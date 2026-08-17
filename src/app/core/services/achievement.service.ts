import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { UserStateService } from './user-state.service';
import { VocabularyService } from './vocabulary.service';
import { GrammarService } from './grammar.service';
import { InterviewProgressService } from './interview-progress.service';
import { InterviewSessionService } from './interview-session.service';
import { CareerCoachService } from './career-coach.service';
import { MOCK_ACHIEVEMENTS, AchievementContext } from './mock-data/mock-achievements.data';
import { Achievement, Skill } from '../models';

/**
 * Evaluates the static achievement catalog against live app state and
 * unlocks (persists) any newly-earned achievement automatically — no user
 * action needed beyond the normal activity that earns them.
 */
@Injectable({ providedIn: 'root' })
export class AchievementService {
  private readonly supabase = inject(SupabaseService).client;
  private readonly auth = inject(AuthService);
  private readonly userState = inject(UserStateService);
  private readonly vocabularyService = inject(VocabularyService);
  private readonly grammarService = inject(GrammarService);
  private readonly interviewProgress = inject(InterviewProgressService);
  private readonly interviewSessions = inject(InterviewSessionService);
  private readonly careerCoach = inject(CareerCoachService);

  private readonly unlockedAt = signal<Record<string, string>>({});
  private readonly loaded = signal(false);

  private readonly context = computed<AchievementContext>(() => ({
    streak: this.userState.streak(),
    longestStreak: this.userState.longestStreak(),
    xp: this.userState.xp(),
    lessonsCompleted: this.userState.currentLanguageProgress().lessonsCompleted.length,
    wordsLearned: this.vocabularyService.words().filter((w) => w.masteryPercent >= 60).length,
    grammarTopicsCompleted: this.grammarService.completedCount(),
    averageAccuracy: this.userState.averageAccuracy(),
    interviewQuestionsPracticed: this.interviewProgress.practicedCount(),
    interviewWordsKnown: this.interviewProgress.knownWordCount(),
    mockInterviewsCompleted: this.interviewSessions.sessionCount(),
    bestMockInterviewScore: this.interviewSessions.bestScore(),
    roleplaysCompleted: this.interviewSessions.roleplayCount(),
    speakingMasteryPercent:
      this.userState.skillMastery().find((s) => s.skill === Skill.Speaking)?.masteryPercent ?? 0,
    jobReadyScore: this.careerCoach.jobReadyScore().overall,
  }));

  readonly achievements = computed<Achievement[]>(() =>
    MOCK_ACHIEVEMENTS.map((def) => ({
      id: def.id,
      title: def.title,
      description: def.description,
      iconEmoji: def.iconEmoji,
      category: def.category,
      goal: def.goal,
      unlockedAt: this.unlockedAt()[def.id] ?? null,
    })),
  );

  readonly unlockedCount = computed(() => this.achievements().filter((a) => a.unlockedAt !== null).length);

  constructor() {
    effect(() => {
      const userId = this.auth.userId();
      if (userId && this.auth.ready()) {
        this.load(userId);
      } else if (this.auth.ready()) {
        this.unlockedAt.set({});
        this.loaded.set(false);
      }
    });

    // Re-evaluate the catalog whenever the underlying context changes, once loaded.
    effect(() => {
      const ctx = this.context();
      if (!this.loaded()) return;
      this.evaluate(ctx);
    });
  }

  private async load(userId: string): Promise<void> {
    try {
      const { data, error } = await this.supabase.from('user_achievements').select('*').eq('user_id', userId);
      if (error) throw error;
      const map: Record<string, string> = {};
      for (const row of data ?? []) map[row.achievement_id] = row.unlocked_at;
      this.unlockedAt.set(map);
    } catch (err) {
      console.error('[Achievement] load failed', err);
    } finally {
      this.loaded.set(true);
    }
  }

  private evaluate(ctx: AchievementContext): void {
    const userId = this.auth.userId();
    const already = this.unlockedAt();
    const newlyUnlocked: string[] = [];

    for (const def of MOCK_ACHIEVEMENTS) {
      if (already[def.id]) continue;
      if (def.isUnlocked(ctx)) newlyUnlocked.push(def.id);
    }
    if (!newlyUnlocked.length) return;

    const now = new Date().toISOString();
    this.unlockedAt.update((map) => {
      const next = { ...map };
      for (const id of newlyUnlocked) next[id] = now;
      return next;
    });

    if (!userId) return;
    this.supabase
      .from('user_achievements')
      .insert(newlyUnlocked.map((id) => ({ user_id: userId, achievement_id: id, unlocked_at: now })))
      .then(({ error }) => error && console.error('[Achievement] unlock persist failed', error));
  }
}
