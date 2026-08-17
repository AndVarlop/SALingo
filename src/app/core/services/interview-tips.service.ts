import { Injectable, effect, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

/**
 * Persists the Interview Tips pre-interview checklist — previously a local
 * `Set` signal that reset on every reload (gap flagged in
 * SALINGO_FULL_AUDIT.md). One row per user, whole array upserted on toggle.
 */
@Injectable({ providedIn: 'root' })
export class InterviewTipsService {
  private readonly supabase = inject(SupabaseService).client;
  private readonly auth = inject(AuthService);

  readonly checkedIndices = signal<Set<number>>(new Set());

  constructor() {
    effect(() => {
      const userId = this.auth.userId();
      if (userId && this.auth.ready()) {
        this.load(userId);
      } else if (this.auth.ready()) {
        this.checkedIndices.set(new Set());
      }
    });
  }

  toggle(index: number): void {
    const userId = this.auth.userId();
    this.checkedIndices.update((set) => {
      const next = new Set(set);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });

    if (!userId) return;
    const indices = [...this.checkedIndices()];
    this.supabase
      .from('interview_tips_checklist')
      .upsert({ user_id: userId, checked_indices: indices, updated_at: new Date().toISOString() })
      .then(({ error }) => error && console.error('[InterviewTips] toggle failed', error));
  }

  private async load(userId: string): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from('interview_tips_checklist')
        .select('checked_indices')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;

      const indices = (data?.checked_indices as number[] | undefined) ?? [];
      this.checkedIndices.set(new Set(indices));
    } catch (err) {
      console.error('[InterviewTips] load failed', err);
    }
  }
}
