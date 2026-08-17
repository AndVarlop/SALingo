/**
 * Spaced-repetition tracking record for one vocabulary word.
 * Simplified SM-2-inspired algorithm (see SpacedRepetitionService).
 */
export interface ReviewItem {
  wordId: string;
  timesStudied: number;
  timesCorrect: number;
  timesIncorrect: number;
  lastReviewedAt: string | null; // ISO date
  nextReviewAt: string; // ISO date
  /** 1 = easy/well-known ... 5 = very hard. Drives the next interval length. */
  difficulty: number;
  /** Current spaced-repetition interval, in days. */
  intervalDays: number;
}

export type ReviewGrade = 'again' | 'hard' | 'good' | 'easy';
