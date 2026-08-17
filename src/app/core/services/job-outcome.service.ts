import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { JobOutcome, JobOutcomeType } from '../models';

/**
 * Captures whether the user's prep actually led anywhere in the real world
 * — applied, got an interview, got rejected, got an offer. Flagged in
 * SALINGO_FULL_AUDIT.md as the single most important missing signal: the
 * Job Ready Score is a plausible estimate, but nothing ever recorded a real
 * outcome to check it against. This service only captures that signal —
 * using it to recalibrate the score's weights is future work, not done
 * here.
 */
@Injectable({ providedIn: 'root' })
export class JobOutcomeService {
  private readonly supabase = inject(SupabaseService).client;
  private readonly auth = inject(AuthService);

  readonly loading = signal(false);
  private readonly outcomes = signal<JobOutcome[]>([]);

  readonly history = computed(() =>
    [...this.outcomes()].sort((a, b) => b.eventDate.localeCompare(a.eventDate)),
  );

  /** Best outcome reached so far, for a quick "how's it going" summary. */
  readonly bestOutcomeSoFar = computed<JobOutcomeType | null>(() => {
    const rank: JobOutcomeType[] = [
      'applied',
      'interview_scheduled',
      'interview_completed',
      'rejected',
      'got_offer',
      'accepted_job',
    ];
    const present = new Set(this.outcomes().map((o) => o.outcome));
    let best: JobOutcomeType | null = null;
    for (const type of rank) {
      if (present.has(type) && type !== 'rejected') best = type;
    }
    return best;
  });

  constructor() {
    effect(() => {
      const userId = this.auth.userId();
      if (userId && this.auth.ready()) {
        this.load(userId);
      } else if (this.auth.ready()) {
        this.outcomes.set([]);
      }
    });
  }

  async log(input: { company: string; position: string | null; outcome: JobOutcomeType; notes: string | null; eventDate: string }): Promise<void> {
    const userId = this.auth.userId();
    const local: JobOutcome = {
      id: `local-${Date.now()}`,
      company: input.company,
      position: input.position,
      outcome: input.outcome,
      notes: input.notes,
      eventDate: input.eventDate,
      createdAt: new Date().toISOString(),
    };
    this.outcomes.update((list) => [local, ...list]);

    if (!userId) return;
    const { error } = await this.supabase.from('job_outcomes').insert({
      user_id: userId,
      company: input.company,
      position: input.position,
      outcome: input.outcome,
      notes: input.notes,
      event_date: input.eventDate,
    });
    if (error) console.error('[JobOutcome] log failed', error);
  }

  private async load(userId: string): Promise<void> {
    this.loading.set(true);
    try {
      const { data, error } = await this.supabase
        .from('job_outcomes')
        .select('*')
        .eq('user_id', userId)
        .order('event_date', { ascending: false })
        .limit(50);
      if (error) throw error;

      this.outcomes.set(
        (data ?? []).map((row) => ({
          id: row.id,
          company: row.company,
          position: row.position,
          outcome: row.outcome as JobOutcomeType,
          notes: row.notes,
          eventDate: row.event_date,
          createdAt: row.created_at,
        })),
      );
    } catch (err) {
      console.error('[JobOutcome] load failed', err);
    } finally {
      this.loading.set(false);
    }
  }
}
