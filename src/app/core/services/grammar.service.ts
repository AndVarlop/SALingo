import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { MOCK_GRAMMAR_TOPICS } from './mock-data/mock-grammar.data';
import { CefrLevel, GrammarProgress, GrammarTopic } from '../models';

/**
 * Grammar topic content (explanation, examples, exercises) is static, same
 * pattern as lessons. Per-user progress (completed / best score / attempts)
 * lives in Supabase's `grammar_progress` table.
 */
@Injectable({ providedIn: 'root' })
export class GrammarService {
  private readonly supabase = inject(SupabaseService).client;
  private readonly auth = inject(AuthService);

  readonly loading = signal(false);
  private readonly progressByTopic = signal<Record<string, GrammarProgress>>({});

  readonly topics = MOCK_GRAMMAR_TOPICS;

  constructor() {
    effect(() => {
      const userId = this.auth.userId();
      if (userId && this.auth.ready()) {
        this.load(userId);
      } else if (this.auth.ready()) {
        this.progressByTopic.set({});
      }
    });
  }

  getByLevel(level: CefrLevel): GrammarTopic[] {
    return this.topics.filter((t) => t.level === level).sort((a, b) => a.order - b.order);
  }

  getById(id: string): GrammarTopic | undefined {
    return this.topics.find((t) => t.id === id);
  }

  progressFor(topicId: string): GrammarProgress {
    return (
      this.progressByTopic()[topicId] ?? { topicId, completed: false, bestScore: 0, attempts: 0 }
    );
  }

  readonly completedCount = computed(
    () => Object.values(this.progressByTopic()).filter((p) => p.completed).length,
  );

  /** Records the result of one attempt at a topic's test. */
  recordAttempt(topicId: string, score: number): void {
    const userId = this.auth.userId();
    const current = this.progressFor(topicId);
    const updated: GrammarProgress = {
      topicId,
      attempts: current.attempts + 1,
      bestScore: Math.max(current.bestScore, score),
      completed: current.completed || score >= 70,
    };

    this.progressByTopic.update((map) => ({ ...map, [topicId]: updated }));
    if (!userId) return;

    this.supabase
      .from('grammar_progress')
      .upsert(
        {
          user_id: userId,
          topic_id: topicId,
          completed: updated.completed,
          best_score: updated.bestScore,
          attempts: updated.attempts,
        },
        { onConflict: 'user_id,topic_id' },
      )
      .then(({ error }) => error && console.error('[Grammar] recordAttempt failed', error));
  }

  private async load(userId: string): Promise<void> {
    this.loading.set(true);
    try {
      const { data, error } = await this.supabase
        .from('grammar_progress')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;

      const map: Record<string, GrammarProgress> = {};
      for (const row of data ?? []) {
        map[row.topic_id] = {
          topicId: row.topic_id,
          completed: row.completed,
          bestScore: row.best_score,
          attempts: row.attempts,
        };
      }
      this.progressByTopic.set(map);
    } catch (err) {
      console.error('[Grammar] load failed', err);
    } finally {
      this.loading.set(false);
    }
  }
}
