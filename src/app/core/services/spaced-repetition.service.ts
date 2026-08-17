import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { VocabularyService } from './vocabulary.service';
import { ReviewGrade, ReviewItem, VocabularyWord } from '../models';

/**
 * Simplified SM-2-inspired spaced repetition. Not mathematically perfect —
 * intentionally so, per the product spec — but it converges: easy answers
 * push the next review further out, "again" resets it to tomorrow.
 */
/** Exported for unit testing — see spaced-repetition.service.spec.ts. */
export function nextIntervalDays(current: number, grade: ReviewGrade): number {
  switch (grade) {
    case 'again':
      return 1;
    case 'hard':
      return Math.max(1, Math.round(current * 1.2));
    case 'good':
      return Math.max(1, Math.round(current * 1.8));
    case 'easy':
      return Math.max(1, Math.round(current * 2.5));
  }
}

export function nextDifficulty(current: number, grade: ReviewGrade): number {
  if (grade === 'easy') return Math.max(1, current - 1);
  if (grade === 'again' || grade === 'hard') return Math.min(5, current + 1);
  return current;
}

const DEFAULT_ITEM: Omit<ReviewItem, 'wordId'> = {
  timesStudied: 0,
  timesCorrect: 0,
  timesIncorrect: 0,
  lastReviewedAt: null,
  nextReviewAt: new Date().toISOString(),
  difficulty: 3,
  intervalDays: 1,
};

@Injectable({ providedIn: 'root' })
export class SpacedRepetitionService {
  private readonly supabase = inject(SupabaseService).client;
  private readonly auth = inject(AuthService);
  private readonly vocabulary = inject(VocabularyService);

  readonly loading = signal(false);
  private readonly reviewItems = signal<Record<string, ReviewItem>>({});

  /** Words that are new (never studied) or whose next review date has arrived. */
  readonly dueWords = computed<VocabularyWord[]>(() => {
    const items = this.reviewItems();
    const now = new Date();
    return this.vocabulary.words().filter((w) => {
      const item = items[w.id];
      if (!item) return true;
      return new Date(item.nextReviewAt) <= now;
    });
  });

  readonly dueCount = computed(() => this.dueWords().length);

  constructor() {
    effect(() => {
      const userId = this.auth.userId();
      if (userId && this.auth.ready()) {
        this.load(userId);
      } else if (this.auth.ready()) {
        this.reviewItems.set({});
      }
    });
  }

  /** Records the user's answer for one word and schedules its next review. */
  grade(wordId: string, grade: ReviewGrade): void {
    const userId = this.auth.userId();
    if (!userId) return;

    const current = this.reviewItems()[wordId] ?? { wordId, ...DEFAULT_ITEM };
    const intervalDays = nextIntervalDays(current.intervalDays, grade);
    const difficulty = nextDifficulty(current.difficulty, grade);
    const nextReviewAt = new Date();
    nextReviewAt.setDate(nextReviewAt.getDate() + intervalDays);

    const updated: ReviewItem = {
      wordId,
      timesStudied: current.timesStudied + 1,
      timesCorrect: current.timesCorrect + (grade === 'again' ? 0 : 1),
      timesIncorrect: current.timesIncorrect + (grade === 'again' ? 1 : 0),
      lastReviewedAt: new Date().toISOString(),
      nextReviewAt: nextReviewAt.toISOString(),
      difficulty,
      intervalDays,
    };

    this.reviewItems.update((items) => ({ ...items, [wordId]: updated }));
    this.syncMasteryToVocabulary();

    this.supabase
      .from('review_items')
      .upsert(
        {
          user_id: userId,
          word_id: wordId,
          times_studied: updated.timesStudied,
          times_correct: updated.timesCorrect,
          times_incorrect: updated.timesIncorrect,
          last_reviewed_at: updated.lastReviewedAt,
          next_review_at: updated.nextReviewAt,
          difficulty: updated.difficulty,
          interval_days: updated.intervalDays,
        },
        { onConflict: 'user_id,word_id' },
      )
      .then(({ error }) => error && console.error('[SpacedRepetition] grade failed', error));
  }

  private async load(userId: string): Promise<void> {
    this.loading.set(true);
    try {
      const { data, error } = await this.supabase
        .from('review_items')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;

      const items: Record<string, ReviewItem> = {};
      for (const row of data ?? []) {
        items[row.word_id] = {
          wordId: row.word_id,
          timesStudied: row.times_studied,
          timesCorrect: row.times_correct,
          timesIncorrect: row.times_incorrect,
          lastReviewedAt: row.last_reviewed_at,
          nextReviewAt: row.next_review_at,
          difficulty: row.difficulty,
          intervalDays: row.interval_days,
        };
      }
      this.reviewItems.set(items);
      this.syncMasteryToVocabulary();
    } catch (err) {
      console.error('[SpacedRepetition] load failed', err);
    } finally {
      this.loading.set(false);
    }
  }

  private syncMasteryToVocabulary(): void {
    const mastery: Record<string, number> = {};
    for (const [wordId, item] of Object.entries(this.reviewItems())) {
      mastery[wordId] = item.timesStudied > 0 ? Math.round((item.timesCorrect / item.timesStudied) * 100) : 0;
    }
    this.vocabulary.masteryByWordId.set(mastery);
  }
}
