import { Injectable, inject } from '@angular/core';
import { MOCK_GRAMMAR_TOPICS } from './mock-data/mock-grammar.data';
import { VocabularyService } from './vocabulary.service';
import { CEFR_LEVEL_LABEL, CEFR_LEVEL_ORDER, ExamDefinition, ExamSection, ExerciseType } from '../models';

const GRAMMAR_QUESTIONS_PER_LEVEL = 5;
const VOCAB_QUESTIONS_PER_CATEGORY = 5;

/**
 * Builds concrete ExamDefinitions from content that already exists —
 * no new grammar rules, no new vocabulary. Grammar Exam sections are CEFR
 * levels pulling multiple-choice exercises from every topic at that level;
 * Vocabulary Exam sections are categories, generating term -> translation
 * multiple-choice questions the same way Vocabulary Rush does. Add a new
 * exam by adding a `build*Exam()` method and an entry in `EXAMS` below —
 * the runner UI and ExamEngineService need no changes.
 */
@Injectable({ providedIn: 'root' })
export class ExamRegistryService {
  private readonly vocabulary = inject(VocabularyService);

  getExam(id: string): ExamDefinition | null {
    if (id === 'grammar-exam') return this.buildGrammarExam();
    if (id === 'vocabulary-exam') return this.buildVocabularyExam();
    return null;
  }

  /**
   * Whether the exam's underlying content has finished loading. Grammar
   * Exam is built from synchronous mock data, always ready; Vocabulary
   * Exam depends on VocabularyService's Supabase fetch, which may still be
   * in flight on a fresh page load. Read from the runner's `effect()` so
   * it re-evaluates once loading flips.
   */
  isReady(id: string): boolean {
    if (id === 'vocabulary-exam') return !this.vocabulary.loading();
    return true;
  }

  private buildGrammarExam(): ExamDefinition {
    const sections: ExamSection[] = CEFR_LEVEL_ORDER.map((level) => {
      const topics = MOCK_GRAMMAR_TOPICS.filter((t) => t.level === level);
      const questions = topics
        .flatMap((topic) =>
          topic.exercises
            .filter((ex) => ex.type === ExerciseType.MultipleChoice)
            .map((ex) => ({
              id: `${topic.id}:${ex.id}`,
              prompt: ex.prompt,
              options: ex.options,
              correctOptionIndex: ex.correctOptionIndex,
              skillTag: `grammar:${topic.id}`,
            })),
        )
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
    const words = this.vocabulary.words();
    const allTranslations = words.map((w) => w.translation);
    const categories = [...new Set(words.map((w) => w.category))];

    const sections: ExamSection[] = categories.map((category) => {
      const categoryWords = words
        .filter((w) => w.category === category)
        .sort(() => Math.random() - 0.5)
        .slice(0, VOCAB_QUESTIONS_PER_CATEGORY);

      const questions = categoryWords.map((word) => {
        const distractorPool = allTranslations.filter((t) => t !== word.translation);
        const distractors = [...new Set(distractorPool)].sort(() => Math.random() - 0.5).slice(0, 3);
        const options = [word.translation, ...distractors].sort(() => Math.random() - 0.5);
        return {
          id: word.id,
          prompt: `What does "${word.term}" mean?`,
          options,
          correctOptionIndex: options.indexOf(word.translation),
          skillTag: `vocab:${category}`,
        };
      });

      return { id: category, title: category, questions };
    }).filter((s) => s.questions.length > 0);

    return {
      id: 'vocabulary-exam',
      title: 'Vocabulary Exam',
      description: 'One section per category, testing the words you actually have loaded.',
      icon: '📚',
      activityType: 'review',
      sections,
    };
  }
}
