import { Injectable, inject } from '@angular/core';
import { CefrLevel, VocabularyStatus, VocabularyWord } from '../models';
import { VocabularyActivityType } from '../models/vocabulary-activity.model';
import { VocabularyService } from './vocabulary.service';
import { SpacedRepetitionService } from './spaced-repetition.service';
import { STORAGE_KEYS } from '../constants/storage-keys.constant';

/** How many recently-shown words/activity-types to remember before they're eligible again (§8, §31). */
export const RECENT_WORD_WINDOW = 40;
export const RECENT_ACTIVITY_WINDOW = 4;

/** Default session composition — adjusted per §11 when a bucket can't fill its share. */
export const DEFAULT_RATIO = { new: 0.6, review: 0.25, weak: 0.15 };

export const ALL_ACTIVITY_TYPES: VocabularyActivityType[] = [
  'multiple-choice',
  'context-choice',
  'fill-blank',
  'matching',
  'synonym',
  'antonym',
  'collocation',
  'phrasal-verb',
  'definition',
  'translation',
  'reverse-translation',
  'register',
];

export interface VocabularySelection {
  word: VocabularyWord;
  bucket: 'new' | 'review' | 'weak';
}

function shuffle<T>(list: T[]): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickN<T>(list: T[], n: number): T[] {
  if (n <= 0) return [];
  return shuffle(list).slice(0, n);
}

/**
 * Pure selection core (§9, §11, §37) — no DI, no randomness source other than
 * Math.random as a final tie-breaker inside an already-valid set. Exported
 * for unit testing; VocabularyEngineService wraps it with live signals and
 * recent-history persistence.
 */
export function selectSession(
  pool: VocabularyWord[],
  statusByWordId: Record<string, VocabularyStatus>,
  dueWordIds: Set<string>,
  recentWordIds: Set<string>,
  count: number,
  ratio: { new: number; review: number; weak: number } = DEFAULT_RATIO,
): VocabularySelection[] {
  if (pool.length === 0 || count <= 0) return [];

  const buckets = { new: [] as VocabularyWord[], review: [] as VocabularyWord[], weak: [] as VocabularyWord[] };
  for (const word of pool) {
    const status: VocabularyStatus = statusByWordId[word.id] ?? 'new';
    if (status === 'learning' || status === 'practicing') buckets.weak.push(word);
    else if (status === 'new') buckets.new.push(word);
    else if (dueWordIds.has(word.id)) buckets.review.push(word);
  }

  // Prefer words not recently seen, but fall back to the full bucket rather
  // than come up short — never block a word forever (§8).
  const fresh = (list: VocabularyWord[]) => {
    const notRecent = list.filter((w) => !recentWordIds.has(w.id));
    return notRecent.length > 0 ? notRecent : list;
  };

  const targetNew = Math.round(count * ratio.new);
  const targetReview = Math.round(count * ratio.review);
  const targetWeak = count - targetNew - targetReview;

  const picked: VocabularySelection[] = [
    ...pickN(fresh(buckets.new), targetNew).map((word) => ({ word, bucket: 'new' as const })),
    ...pickN(fresh(buckets.review), targetReview).map((word) => ({ word, bucket: 'review' as const })),
    ...pickN(fresh(buckets.weak), targetWeak).map((word) => ({ word, bucket: 'weak' as const })),
  ];

  // Backfill from whatever's left if a bucket ran dry (small pools, e.g. C2).
  // Still respects recency first — only reaches into recently-shown words if
  // it truly has to (§8: never blocked forever, but not the first resort).
  if (picked.length < count) {
    const used = new Set(picked.map((p) => p.word.id));
    const rest = pool.filter((w) => !used.has(w.id));
    for (const word of pickN(fresh(rest), count - picked.length)) {
      picked.push({ word, bucket: (statusByWordId[word.id] ?? 'new') === 'new' ? 'new' : 'review' });
    }
  }

  return shuffle(picked).slice(0, count);
}

/** True if `word` has enough metadata to support this activity type (§12, §38 — never invent distractors). */
export function supportsActivityType(word: VocabularyWord, type: VocabularyActivityType): boolean {
  switch (type) {
    case 'multiple-choice':
    case 'translation':
    case 'reverse-translation':
      return true;
    case 'context-choice':
    case 'fill-blank':
      return !!(word.example || word.examples?.length);
    case 'definition':
    case 'matching':
      return !!word.definition;
    case 'synonym':
      return !!word.synonyms?.length;
    case 'antonym':
      return !!word.antonyms?.length;
    case 'collocation':
      return !!word.collocations?.length;
    case 'phrasal-verb':
      return word.partOfSpeech === 'phrasal verb' && !!word.definition;
    case 'register':
      return !!word.register;
  }
}

/** Chooses an activity type for a word, favoring types it supports and avoiding recently-used ones (§13). */
export function selectActivityType(
  word: VocabularyWord,
  recentActivityTypes: VocabularyActivityType[],
): VocabularyActivityType {
  const eligible = ALL_ACTIVITY_TYPES.filter((type) => supportsActivityType(word, type));
  const fresh = eligible.filter((t) => !recentActivityTypes.includes(t));
  const from = fresh.length > 0 ? fresh : eligible;
  return from[Math.floor(Math.random() * from.length)] ?? 'multiple-choice';
}

/**
 * Selects which words a practice/review session shows and which activity
 * type fits each one — the stateful shell around the pure functions above.
 * Deliberately not random-first: level/status/recency narrow the pool, and
 * Math.random only breaks ties inside a still-valid set (§36).
 */
@Injectable({ providedIn: 'root' })
export class VocabularyEngineService {
  private readonly vocabulary = inject(VocabularyService);
  private readonly spacedRepetition = inject(SpacedRepetitionService);

  private recentWordIds: string[] = this.loadRecent();
  private recentActivityTypes: VocabularyActivityType[] = [];

  /** Builds a session of `count` words, mixing new/review/weak per §11, honoring level + recency. */
  buildSession(count: number, level?: CefrLevel): VocabularySelection[] {
    const pool = this.vocabulary.words().filter((w) => !level || w.level === level);
    const picked = selectSession(
      pool,
      this.spacedRepetition.statusByWordId(),
      new Set(this.spacedRepetition.dueWords().map((w) => w.id)),
      new Set(this.recentWordIds),
      count,
    );
    this.rememberWords(picked.map((p) => p.word.id));
    return picked;
  }

  /** Chooses an activity type for a word, remembering it so the next few picks vary (§13). */
  pickActivityType(word: VocabularyWord): VocabularyActivityType {
    const chosen = selectActivityType(word, this.recentActivityTypes);
    this.recentActivityTypes = [chosen, ...this.recentActivityTypes].slice(0, RECENT_ACTIVITY_WINDOW);
    return chosen;
  }

  private rememberWords(ids: string[]): void {
    this.recentWordIds = [...ids, ...this.recentWordIds].slice(0, RECENT_WORD_WINDOW);
    try {
      localStorage.setItem(STORAGE_KEYS.recentVocabulary, JSON.stringify(this.recentWordIds));
    } catch {
      // localStorage unavailable (SSR/private mode) — recency tracking degrades to in-memory only.
    }
  }

  private loadRecent(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.recentVocabulary);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  }
}
