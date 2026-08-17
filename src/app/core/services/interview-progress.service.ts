import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { UserStateService } from './user-state.service';
import { MOCK_INTERVIEW_QUESTIONS } from './mock-data/mock-interview-questions.data';
import { MOCK_INTERVIEW_VOCABULARY } from './mock-data/mock-interview-vocabulary.data';
import { CefrLevel, InterviewAnswer, InterviewPosition, InterviewProfile } from '../models';
import { XP_RULES } from '../constants/xp.constant';

const EMPTY_PROFILE: InterviewProfile = {
  targetPosition: null,
  hasExperience: null,
  englishLevel: null,
  struggleArea: null,
  interviewDate: null,
  onboarded: false,
};

/**
 * Owns everything user-specific in the Interview Prep module: the onboarding
 * profile, saved answers (= practiced questions), and known vocabulary.
 * Question/vocabulary/phrase content stays static — see mock-data/.
 */
@Injectable({ providedIn: 'root' })
export class InterviewProgressService {
  private readonly supabase = inject(SupabaseService).client;
  private readonly auth = inject(AuthService);
  private readonly userState = inject(UserStateService);

  readonly loading = signal(false);
  readonly profile = signal<InterviewProfile>(EMPTY_PROFILE);
  private readonly answersByQuestion = signal<Record<string, InterviewAnswer>>({});
  private readonly knownWordIds = signal<Set<string>>(new Set());

  readonly practicedCount = computed(() => Object.keys(this.answersByQuestion()).length);
  readonly knownWordCount = computed(() => this.knownWordIds().size);
  readonly totalQuestions = MOCK_INTERVIEW_QUESTIONS.length;
  readonly totalVocabulary = MOCK_INTERVIEW_VOCABULARY.length;

  /** 0-100 breakdown that adds up to the overall "Interview Readiness" score. */
  readonly readiness = computed(() => {
    const questionsScore = Math.round((this.practicedCount() / this.totalQuestions) * 100);
    const vocabularyScore = Math.round((this.knownWordIds().size / this.totalVocabulary) * 100);
    const overall = Math.round(questionsScore * 0.6 + vocabularyScore * 0.4);
    return { overall, questionsScore, vocabularyScore };
  });

  constructor() {
    effect(() => {
      const userId = this.auth.userId();
      if (userId && this.auth.ready()) {
        this.load(userId);
      } else if (this.auth.ready()) {
        this.profile.set(EMPTY_PROFILE);
        this.answersByQuestion.set({});
        this.knownWordIds.set(new Set());
      }
    });
  }

  answerFor(questionId: string): InterviewAnswer | null {
    return this.answersByQuestion()[questionId] ?? null;
  }

  isPracticed(questionId: string): boolean {
    return questionId in this.answersByQuestion();
  }

  isWordKnown(wordId: string): boolean {
    return this.knownWordIds().has(wordId);
  }

  async completeOnboarding(input: {
    targetPosition: InterviewPosition | null;
    hasExperience: boolean;
    englishLevel: CefrLevel;
    struggleArea: string;
    interviewDate: string | null;
  }): Promise<void> {
    const userId = this.auth.userId();
    const profile: InterviewProfile = { ...input, onboarded: true };
    this.profile.set(profile);
    if (!userId) return;

    const { error } = await this.supabase.from('interview_profile').upsert({
      user_id: userId,
      target_position: input.targetPosition,
      has_experience: input.hasExperience,
      english_level: input.englishLevel,
      struggle_area: input.struggleArea,
      interview_date: input.interviewDate,
      onboarded: true,
    });
    if (error) console.error('[InterviewProgress] completeOnboarding failed', error);
  }

  /** Saves the user's own answer to a question — this is what "practiced" means. */
  saveAnswer(questionId: string, answerText: string, source: InterviewAnswer['source']): void {
    const userId = this.auth.userId();
    const alreadyPracticed = this.isPracticed(questionId);
    const answer: InterviewAnswer = { questionId, answerText, source, updatedAt: new Date().toISOString() };

    this.answersByQuestion.update((map) => ({ ...map, [questionId]: answer }));

    if (!alreadyPracticed) {
      this.userState.recordActivity({
        minutes: 3,
        xp: XP_RULES.lessonCompleteBonus,
        type: 'interview',
        title: 'Practiced an interview question',
        accuracy: 100,
      });
    }

    if (!userId) return;
    this.supabase
      .from('interview_answers')
      .upsert({ user_id: userId, question_id: questionId, answer_text: answerText, source })
      .then(({ error }) => error && console.error('[InterviewProgress] saveAnswer failed', error));
  }

  /** Lets a user pick/change their target position after onboarding — drives Career Tracks. */
  async updateTargetPosition(targetPosition: InterviewPosition): Promise<void> {
    const userId = this.auth.userId();
    this.profile.update((p) => ({ ...p, targetPosition, onboarded: true }));
    if (!userId) return;

    const { error } = await this.supabase
      .from('interview_profile')
      .upsert({ user_id: userId, target_position: targetPosition, onboarded: true });
    if (error) console.error('[InterviewProgress] updateTargetPosition failed', error);
  }

  /** Lets a user set/change their interview date after onboarding (e.g. once it gets scheduled) — drives 24-Hour Interview Mode. */
  async updateInterviewDate(interviewDate: string | null): Promise<void> {
    const userId = this.auth.userId();
    this.profile.update((p) => ({ ...p, interviewDate }));
    if (!userId) return;

    const { error } = await this.supabase
      .from('interview_profile')
      .update({ interview_date: interviewDate })
      .eq('user_id', userId);
    if (error) console.error('[InterviewProgress] updateInterviewDate failed', error);
  }

  toggleWordKnown(wordId: string): void {
    const userId = this.auth.userId();
    const isKnown = this.knownWordIds().has(wordId);

    this.knownWordIds.update((set) => {
      const next = new Set(set);
      if (isKnown) next.delete(wordId);
      else next.add(wordId);
      return next;
    });

    if (!isKnown) {
      this.userState.recordActivity({
        minutes: 0,
        xp: XP_RULES.reviewCorrect,
        type: 'interview',
        title: 'Learned a call center word',
        accuracy: 100,
      });
    }

    if (!userId) return;
    const query = isKnown
      ? this.supabase.from('interview_vocab_progress').delete().eq('user_id', userId).eq('word_id', wordId)
      : this.supabase.from('interview_vocab_progress').insert({ user_id: userId, word_id: wordId, known: true });

    query.then(({ error }) => error && console.error('[InterviewProgress] toggleWordKnown failed', error));
  }

  private async load(userId: string): Promise<void> {
    this.loading.set(true);
    try {
      const [profileRes, answersRes, vocabRes] = await Promise.all([
        this.supabase.from('interview_profile').select('*').eq('user_id', userId).maybeSingle(),
        this.supabase.from('interview_answers').select('*').eq('user_id', userId),
        this.supabase.from('interview_vocab_progress').select('word_id').eq('user_id', userId),
      ]);

      const row = profileRes.data;
      this.profile.set(
        row
          ? {
              targetPosition: row.target_position as InterviewPosition | null,
              hasExperience: row.has_experience,
              englishLevel: row.english_level as CefrLevel | null,
              struggleArea: row.struggle_area,
              interviewDate: row.interview_date,
              onboarded: row.onboarded,
            }
          : EMPTY_PROFILE,
      );

      const answers: Record<string, InterviewAnswer> = {};
      for (const a of answersRes.data ?? []) {
        answers[a.question_id] = {
          questionId: a.question_id,
          answerText: a.answer_text,
          source: a.source as InterviewAnswer['source'],
          updatedAt: a.updated_at,
        };
      }
      this.answersByQuestion.set(answers);
      this.knownWordIds.set(new Set((vocabRes.data ?? []).map((r) => r.word_id)));
    } catch (err) {
      console.error('[InterviewProgress] load failed', err);
    } finally {
      this.loading.set(false);
    }
  }
}
