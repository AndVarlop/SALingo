import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { MistakeCategory, MistakeRecord } from '../models';
import { DetectedMistake } from './mistake-detection.service';

const REVIEW_STALE_DAYS = 3;

/**
 * Owns "My Mistakes" — records recurring language errors detected in Mock
 * Interview / Roleplay answers (see MistakeDetectionService) and lets them
 * resurface for review. Deliberately simple "days since last seen" staleness
 * check rather than the full SM-2 spaced-repetition algorithm used for
 * vocabulary — a mistake needing review isn't scheduled the same way a new
 * word is, but the same "resurface periodically" spirit applies.
 */
@Injectable({ providedIn: 'root' })
export class MistakeMemoryService {
  private readonly supabase = inject(SupabaseService).client;
  private readonly auth = inject(AuthService);

  readonly loading = signal(false);
  private readonly mistakes = signal<MistakeRecord[]>([]);

  readonly all = computed(() => [...this.mistakes()].sort((a, b) => b.occurrences - a.occurrences));
  readonly totalCount = computed(() => this.mistakes().length);

  readonly byCategory = computed<Record<MistakeCategory, MistakeRecord[]>>(() => {
    const groups: Record<MistakeCategory, MistakeRecord[]> = {
      grammar: [],
      vocabulary: [],
      interview: [],
      speaking: [],
      'customer-service': [],
    };
    for (const m of this.all()) groups[m.category].push(m);
    return groups;
  });

  /** Mistakes not reviewed in the last REVIEW_STALE_DAYS days — the "practice my mistakes" queue. */
  readonly dueForReview = computed(() => {
    const cutoff = Date.now() - REVIEW_STALE_DAYS * 24 * 60 * 60 * 1000;
    return this.all().filter((m) => new Date(m.lastSeenAt).getTime() < cutoff);
  });

  constructor() {
    effect(() => {
      const userId = this.auth.userId();
      if (userId && this.auth.ready()) {
        this.load(userId);
      } else if (this.auth.ready()) {
        this.mistakes.set([]);
      }
    });
  }

  /** Records every mistake detected in one answer. Upserts by (user, wrong_text) so repeats increment occurrences. */
  async recordAll(detected: DetectedMistake[], source: string): Promise<void> {
    const userId = this.auth.userId();
    if (!userId || !detected.length) return;

    const nowIso = new Date().toISOString();
    for (const d of detected) {
      const existing = this.mistakes().find(
        (m) => m.wrong.toLowerCase() === d.wrong.toLowerCase(),
      );

      if (existing) {
        const updated: MistakeRecord = {
          ...existing,
          lastSeenAt: nowIso,
          occurrences: existing.occurrences + 1,
        };
        this.mistakes.update((list) => list.map((m) => (m.id === existing.id ? updated : m)));

        await this.supabase
          .from('user_mistakes')
          .update({ last_seen_at: nowIso, occurrences: updated.occurrences })
          .eq('user_id', userId)
          .eq('wrong_text', d.wrong)
          .then(({ error }) => error && console.error('[MistakeMemory] update failed', error));
      } else {
        const local: MistakeRecord = {
          id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          wrong: d.wrong,
          correct: d.correct,
          category: d.category,
          source,
          firstSeenAt: nowIso,
          lastSeenAt: nowIso,
          occurrences: 1,
        };
        this.mistakes.update((list) => [local, ...list]);

        await this.supabase
          .from('user_mistakes')
          .upsert(
            {
              user_id: userId,
              wrong_text: d.wrong,
              correct_text: d.correct,
              category: d.category,
              source,
              first_seen_at: nowIso,
              last_seen_at: nowIso,
              occurrences: 1,
            },
            { onConflict: 'user_id,wrong_text' },
          )
          .then(({ error }) => error && console.error('[MistakeMemory] insert failed', error));
      }
    }
  }

  /** Marks a mistake as reviewed right now, resetting its staleness clock. */
  async markReviewed(mistakeId: string): Promise<void> {
    const userId = this.auth.userId();
    const nowIso = new Date().toISOString();
    const mistake = this.mistakes().find((m) => m.id === mistakeId);
    if (!mistake) return;

    this.mistakes.update((list) =>
      list.map((m) => (m.id === mistakeId ? { ...m, lastSeenAt: nowIso } : m)),
    );

    if (!userId) return;
    await this.supabase
      .from('user_mistakes')
      .update({ last_seen_at: nowIso })
      .eq('user_id', userId)
      .eq('wrong_text', mistake.wrong)
      .then(({ error }) => error && console.error('[MistakeMemory] markReviewed failed', error));
  }

  private async load(userId: string): Promise<void> {
    this.loading.set(true);
    try {
      const { data, error } = await this.supabase
        .from('user_mistakes')
        .select('*')
        .eq('user_id', userId)
        .order('occurrences', { ascending: false });
      if (error) throw error;

      this.mistakes.set(
        (data ?? []).map((row) => ({
          id: row.id,
          wrong: row.wrong_text,
          correct: row.correct_text,
          category: row.category as MistakeCategory,
          source: row.source,
          firstSeenAt: row.first_seen_at,
          lastSeenAt: row.last_seen_at,
          occurrences: row.occurrences,
        })),
      );
    } catch (err) {
      console.error('[MistakeMemory] load failed', err);
    } finally {
      this.loading.set(false);
    }
  }
}
