import { Injectable, inject } from '@angular/core';
import { MOCK_GRAMMAR_TOPICS } from './mock-data/mock-grammar.data';
import { MOCK_LISTENING_EXERCISES } from './mock-data/mock-listening.data';
import { MOCK_READING_EXERCISES } from './mock-data/mock-reading.data';
import { MOCK_INTERVIEW_VOCABULARY } from './mock-data/mock-interview-vocabulary.data';
import { VocabularyService } from './vocabulary.service';
import {
  CEFR_LEVEL_LABEL,
  CEFR_LEVEL_ORDER,
  CefrLevel,
  ExamDefinition,
  ExamQuestion,
  ExamSection,
  ExerciseType,
} from '../models';

const GRAMMAR_QUESTIONS_PER_LEVEL = 5;
const VOCAB_QUESTIONS_PER_CATEGORY = 5;
const CUSTOMER_SERVICE_QUESTIONS_PER_CATEGORY = 5;
const LISTENING_QUESTION_COUNT = 15;
const JOB_READINESS_QUESTIONS_PER_DOMAIN = 4;

const FINAL_ASSESSMENT_IDS = ['b2-final-assessment', 'c1-final-assessment', 'c2-final-assessment'] as const;
type FinalAssessmentId = (typeof FINAL_ASSESSMENT_IDS)[number];
const FINAL_ASSESSMENT_LEVEL: Record<FinalAssessmentId, CefrLevel> = {
  'b2-final-assessment': CefrLevel.B2,
  'c1-final-assessment': CefrLevel.C1,
  'c2-final-assessment': CefrLevel.C2,
};

interface TranslationItem {
  id: string;
  term: string;
  translation: string;
  category: string;
}

/**
 * Builds concrete ExamDefinitions from content that already exists — no
 * new grammar rules, no new vocabulary, no new interview trivia. Add a
 * new exam by adding a `build*Exam()` method and an entry in `getExam()`
 * below — the runner UI and ExamEngineService need no changes.
 *
 * Deliberately NOT building a standalone "Interview Exam": every existing
 * interview question (MOCK_INTERVIEW_QUESTIONS) is open-ended ("Tell me
 * about yourself") with no correct-option answer key, so there is no real
 * multiple-choice content to reuse there without inventing brand-new quiz
 * trivia — which would break the "zero new content" rule every other exam
 * here follows. Job Readiness Exam covers the interview-adjacent ground
 * (Customer Service section) using what does exist.
 */
@Injectable({ providedIn: 'root' })
export class ExamRegistryService {
  private readonly vocabulary = inject(VocabularyService);

  getExam(id: string): ExamDefinition | null {
    if (id === 'grammar-exam') return this.buildGrammarExam();
    if (id === 'vocabulary-exam') return this.buildVocabularyExam();
    if (id === 'listening-exam') return this.buildListeningExam();
    if (id === 'customer-service-exam') return this.buildCustomerServiceExam();
    if (id === 'job-readiness-exam') return this.buildJobReadinessExam();
    if (isFinalAssessmentId(id)) return this.buildFinalAssessment(id);
    return null;
  }

  /**
   * Whether the exam's underlying content has finished loading. Most exams
   * are built from synchronous mock data, always ready; anything touching
   * Vocabulary depends on VocabularyService's Supabase fetch, which may
   * still be in flight on a fresh page load. Read from the runner's
   * `effect()` so it re-evaluates once loading flips.
   */
  isReady(id: string): boolean {
    if (id === 'vocabulary-exam' || id === 'job-readiness-exam' || isFinalAssessmentId(id)) {
      return !this.vocabulary.loading();
    }
    return true;
  }

  private buildGrammarExam(): ExamDefinition {
    const sections: ExamSection[] = CEFR_LEVEL_ORDER.map((level) => {
      const questions = this.grammarQuestionsForLevel(level)
        .sort(() => Math.random() - 0.5)
        .slice(0, GRAMMAR_QUESTIONS_PER_LEVEL);
      return { id: level, title: `${level} · ${CEFR_LEVEL_LABEL[level]}`, questions };
    }).filter((s) => s.questions.length > 0);

    return {
      id: 'grammar-exam',
      title: 'Grammar Exam',
      description: 'One section per level, pulling real questions from every grammar topic you have access to.',
      icon: '📐',
      activityType: 'grammar',
      sections,
    };
  }

  private buildVocabularyExam(): ExamDefinition {
    const sections = this.translationSections(this.vocabulary.words(), 'vocab', VOCAB_QUESTIONS_PER_CATEGORY, false);
    return {
      id: 'vocabulary-exam',
      title: 'Vocabulary Exam',
      description: 'One section per category, testing the words you actually have loaded.',
      icon: '📚',
      activityType: 'review',
      sections,
    };
  }

  private buildListeningExam(): ExamDefinition {
    const questions = this.listeningQuestions()
      .sort(() => Math.random() - 0.5)
      .slice(0, LISTENING_QUESTION_COUNT);

    return {
      id: 'listening-exam',
      title: 'Listening Exam',
      description: 'Listen to each sentence and choose what you heard.',
      icon: '🎧',
      activityType: 'listening',
      sections: [{ id: 'comprehension', title: 'Listening Comprehension', questions }],
    };
  }

  private buildCustomerServiceExam(): ExamDefinition {
    const sections = this.translationSections(
      MOCK_INTERVIEW_VOCABULARY,
      'customer-service',
      CUSTOMER_SERVICE_QUESTIONS_PER_CATEGORY,
      true,
    );

    return {
      id: 'customer-service-exam',
      title: 'Customer Service Exam',
      description: 'Call center English vocabulary — Customer Service, Calls, Problem Solving and Sales.',
      icon: '📞',
      activityType: 'interview',
      sections,
    };
  }

  /**
   * A mixed exam pulling a handful of real questions from each domain —
   * the "how ready am I overall" check the strategy doc calls for. Every
   * question is tagged with its own real skill tag (grammar:*, vocab:*,
   * listening:comprehension, customer-service:*), so masteryByTag stays
   * accurate per-domain even though the exam itself is one activityType
   * ('interview', the closest overall-readiness bucket — a known
   * simplification of the one-type-per-exam model, not a scoring bug).
   */
  private buildJobReadinessExam(): ExamDefinition {
    const grammar = this.grammarQuestionsForLevel(null)
      .sort(() => Math.random() - 0.5)
      .slice(0, JOB_READINESS_QUESTIONS_PER_DOMAIN);
    const vocabulary = this.flatTranslationQuestions(
      this.vocabulary.words(),
      'vocab',
      JOB_READINESS_QUESTIONS_PER_DOMAIN,
      false,
    );
    const listening = this.listeningQuestions()
      .sort(() => Math.random() - 0.5)
      .slice(0, JOB_READINESS_QUESTIONS_PER_DOMAIN);
    const customerService = this.flatTranslationQuestions(
      MOCK_INTERVIEW_VOCABULARY,
      'customer-service',
      JOB_READINESS_QUESTIONS_PER_DOMAIN,
      true,
    );

    const sections: ExamSection[] = [
      { id: 'grammar', title: 'Grammar', questions: grammar },
      { id: 'vocabulary', title: 'Vocabulary', questions: vocabulary },
      { id: 'listening', title: 'Listening', questions: listening },
      { id: 'customer-service', title: 'Customer Service', questions: customerService },
    ].filter((s) => s.questions.length > 0);

    return {
      id: 'job-readiness-exam',
      title: 'Job Readiness Exam',
      description: 'A mixed exam across Grammar, Vocabulary, Listening and Customer Service.',
      icon: '💼',
      activityType: 'interview',
      sections,
    };
  }

  /**
   * The B2/C1/C2 Final Assessment — the level-unlock gate. Pulls real
   * questions from Grammar, Vocabulary, Reading and Listening for that
   * level; Speaking and Writing are deliberately NOT folded in here since
   * they're open-ended and AI-graded elsewhere (Speaking/Writing modules),
   * not auto-gradable multiple-choice — folding them in would mean either
   * inventing fake MC "writing" questions or silently not grading them,
   * both worse than being explicit that this assessment covers the
   * auto-gradable skills and the other two are tracked via their own
   * modules' activity log. C1 adds a Professional English section (reusing
   * the real call-center vocabulary bank); C2's reading section already
   * tests tone/inference/implied meaning, so it doubles as the "Nuance &
   * Register" section the brief asks for, rather than inventing separate
   * content for what the reading questions already exercise.
   */
  private buildFinalAssessment(id: FinalAssessmentId): ExamDefinition {
    const level = FINAL_ASSESSMENT_LEVEL[id];
    const grammar = this.grammarQuestionsForLevel(level).sort(() => Math.random() - 0.5);
    const vocabulary = this.flatTranslationQuestions(
      this.vocabulary.words().filter((w) => w.level === level),
      'vocab',
      10,
      false,
    );
    const reading = this.readingQuestionsForLevel(level);
    const listening = this.listeningQuestionsForLevel(level);

    const sections: ExamSection[] = [
      { id: 'grammar', title: 'Grammar', questions: grammar },
      { id: 'vocabulary', title: level === CefrLevel.C2 ? 'Advanced Vocabulary' : 'Vocabulary', questions: vocabulary },
      {
        id: 'reading',
        title:
          level === CefrLevel.C1
            ? 'Reading & Critical Thinking'
            : level === CefrLevel.C2
              ? 'Reading, Nuance & Inference'
              : 'Reading',
        questions: reading,
      },
      { id: 'listening', title: 'Listening', questions: listening },
    ];

    if (level === CefrLevel.C1) {
      sections.push({
        id: 'professional-english',
        title: 'Professional English',
        questions: this.flatTranslationQuestions(MOCK_INTERVIEW_VOCABULARY, 'customer-service', 8, true),
      });
    }

    return {
      id,
      title: `${level} Final Assessment`,
      description: `The level-unlock gate for ${level} — covers Grammar, Vocabulary, Reading and Listening at ${CEFR_LEVEL_LABEL[level]} level. Speaking and Writing are graded separately in their own modules.`,
      icon: '🏁',
      activityType: 'final-assessment',
      sections: sections.filter((s) => s.questions.length > 0),
    };
  }

  private readingQuestionsForLevel(level: CefrLevel): ExamQuestion[] {
    return MOCK_READING_EXERCISES.filter((ex) => ex.level === level).flatMap((ex) =>
      ex.questions.map((q) => ({
        id: q.id,
        prompt: `Passage: "${ex.passage.slice(0, 220)}${ex.passage.length > 220 ? '…' : ''}"\n\n${q.prompt}`,
        options: q.options,
        correctOptionIndex: q.correctOptionIndex,
        skillTag: `reading:${ex.id}`,
      })),
    );
  }

  private listeningQuestionsForLevel(level: CefrLevel): ExamQuestion[] {
    return MOCK_LISTENING_EXERCISES.filter((ex) => ex.level === level).map((ex) => ({
      id: ex.id,
      prompt: ex.audioText,
      options: ex.options,
      correctOptionIndex: ex.correctOptionIndex,
      skillTag: 'listening:comprehension',
    }));
  }

  private grammarQuestionsForLevel(level: (typeof CEFR_LEVEL_ORDER)[number] | null): ExamQuestion[] {
    const topics = level === null ? MOCK_GRAMMAR_TOPICS : MOCK_GRAMMAR_TOPICS.filter((t) => t.level === level);
    return topics.flatMap((topic) =>
      topic.exercises
        .filter((ex) => ex.type === ExerciseType.MultipleChoice)
        .map((ex) => ({
          id: `${topic.id}:${ex.id}`,
          prompt: ex.prompt,
          options: ex.options,
          correctOptionIndex: ex.correctOptionIndex,
          skillTag: `grammar:${topic.id}`,
        })),
    );
  }

  private listeningQuestions(): ExamQuestion[] {
    return MOCK_LISTENING_EXERCISES.map((ex) => ({
      id: ex.id,
      prompt: ex.audioText, // the runner shows the prompt text directly; there's no audio-play UI yet, same limitation as the Listening feature itself
      options: ex.options,
      correctOptionIndex: ex.correctOptionIndex,
      skillTag: 'listening:comprehension',
    }));
  }

  private toTranslationQuestion(item: TranslationItem, allTranslations: string[], skillPrefix: string, slugifyTag: boolean): ExamQuestion {
    const distractorPool = allTranslations.filter((t) => t !== item.translation);
    const distractors = [...new Set(distractorPool)].sort(() => Math.random() - 0.5).slice(0, 3);
    const options = [item.translation, ...distractors].sort(() => Math.random() - 0.5);
    const tag = slugifyTag ? item.category.toLowerCase().replace(/\s+/g, '-') : item.category;
    return {
      id: item.id,
      prompt: `What does "${item.term}" mean?`,
      options,
      correctOptionIndex: options.indexOf(item.translation),
      skillTag: `${skillPrefix}:${tag}`,
    };
  }

  private translationSections(
    items: TranslationItem[],
    skillPrefix: string,
    perCategory: number,
    slugifyTag: boolean,
  ): ExamSection[] {
    const allTranslations = items.map((w) => w.translation);
    const categories = [...new Set(items.map((w) => w.category))];

    return categories
      .map((category) => {
        const questions = items
          .filter((w) => w.category === category)
          .sort(() => Math.random() - 0.5)
          .slice(0, perCategory)
          .map((item) => this.toTranslationQuestion(item, allTranslations, skillPrefix, slugifyTag));
        return { id: category, title: category, questions };
      })
      .filter((s) => s.questions.length > 0);
  }

  private flatTranslationQuestions(
    items: TranslationItem[],
    skillPrefix: string,
    count: number,
    slugifyTag: boolean,
  ): ExamQuestion[] {
    const allTranslations = items.map((w) => w.translation);
    return [...items]
      .sort(() => Math.random() - 0.5)
      .slice(0, count)
      .map((item) => this.toTranslationQuestion(item, allTranslations, skillPrefix, slugifyTag));
  }
}

function isFinalAssessmentId(id: string): id is FinalAssessmentId {
  return (FINAL_ASSESSMENT_IDS as readonly string[]).includes(id);
}
