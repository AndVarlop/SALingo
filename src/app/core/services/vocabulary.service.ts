import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { UserStateService } from './user-state.service';
import { CefrLevel, VocabularyCategory, VocabularyWord } from '../models';

/**
 * Vocabulary content lives in Supabase (`vocabulary_words`, shared/read-only
 * from the client) so new words or languages can be added without a
 * redeploy. Per-user state (favorites, and mastery derived from
 * `review_items`) is merged on top when loaded.
 *
 * Mastery is loaded here directly — rather than depending on
 * SpacedRepetitionService to push it in — so this service works correctly
 * on its own regardless of which page the user visits first.
 */
@Injectable({ providedIn: 'root' })
export class VocabularyService {
  private readonly supabase = inject(SupabaseService).client;
  private readonly auth = inject(AuthService);
  private readonly userState = inject(UserStateService);

  readonly loading = signal(false);
  private readonly rawWords = signal<Omit<VocabularyWord, 'masteryPercent' | 'isFavorite'>[]>([]);
  private readonly favoriteWordIds = signal<Set<string>>(new Set());
  /** wordId -> accuracy 0-100, derived from review_items. Also updated live by SpacedRepetitionService after each grade. */
  readonly masteryByWordId = signal<Record<string, number>>({});

  readonly words = computed<VocabularyWord[]>(() =>
    this.rawWords().map((w) => ({
      ...w,
      isFavorite: this.favoriteWordIds().has(w.id),
      masteryPercent: this.masteryByWordId()[w.id] ?? 0,
    })),
  );

  readonly categories = Object.values(VocabularyCategory);

  constructor() {
    effect(() => {
      const userId = this.auth.userId();
      const language = this.userState.currentLanguage();
      if (userId && this.auth.ready()) {
        this.load(userId, language);
      } else if (this.auth.ready()) {
        this.rawWords.set([]);
        this.favoriteWordIds.set(new Set());
        this.masteryByWordId.set({});
      }
    });
  }

  toggleFavorite(wordId: string): void {
    const userId = this.auth.userId();
    if (!userId) return;

    const isFavorite = this.favoriteWordIds().has(wordId);
    this.favoriteWordIds.update((set) => {
      const next = new Set(set);
      if (isFavorite) next.delete(wordId);
      else next.add(wordId);
      return next;
    });

    const query = isFavorite
      ? this.supabase.from('user_word_favorites').delete().eq('user_id', userId).eq('word_id', wordId)
      : this.supabase.from('user_word_favorites').insert({ user_id: userId, word_id: wordId });

    query.then(({ error }) => error && console.error('[Vocabulary] toggleFavorite failed', error));
  }

  private async load(userId: string, language: string): Promise<void> {
    this.loading.set(true);
    try {
      const [wordsRes, favoritesRes, reviewItemsRes] = await Promise.all([
        this.supabase.from('vocabulary_words').select('*').eq('language', language),
        this.supabase.from('user_word_favorites').select('word_id').eq('user_id', userId),
        this.supabase.from('review_items').select('word_id,times_studied,times_correct').eq('user_id', userId),
      ]);

      this.rawWords.set(
        (wordsRes.data ?? []).map((row) => ({
          id: row.id,
          language: row.language as VocabularyWord['language'],
          term: row.term,
          translation: row.translation,
          pronunciation: row.pronunciation,
          example: row.example,
          category: row.category as VocabularyCategory,
          level: row.level as CefrLevel,
        })),
      );
      this.favoriteWordIds.set(new Set((favoritesRes.data ?? []).map((r) => r.word_id)));

      const mastery: Record<string, number> = {};
      for (const row of reviewItemsRes.data ?? []) {
        mastery[row.word_id] =
          row.times_studied > 0 ? Math.round((row.times_correct / row.times_studied) * 100) : 0;
      }
      this.masteryByWordId.set(mastery);
    } catch (err) {
      console.error('[Vocabulary] load failed', err);
    } finally {
      this.loading.set(false);
    }
  }
}
