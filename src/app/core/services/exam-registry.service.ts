import { Injectable, inject } from '@angular/core';
import { MOCK_GRAMMAR_TOPICS } from './mock-data/mock-grammar.data';
import { MOCK_LISTENING_EXERCISES } from './mock-data/mock-listening.data';
import { MOCK_INTERVIEW_VOCABULARY } from './mock-data/mock-interview-vocabulary.data';
import { VocabularyService } from './vocabulary.service';
import {
  CEFR_LEVEL_LABEL,
  CEFR_LEVEL_ORDER,
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
    if (id === 'vocabulary-exam' || id === 'job-readiness-exam') return !this.vocabulary.loading();
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
