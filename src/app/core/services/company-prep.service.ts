import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { JobAnalysisResult } from './ai-job-analysis.service';
import { InterviewPosition } from '../models';

export interface CompanyPrepAnalysis {
  id: string;
  company: string;
  position: InterviewPosition | null;
  jobDescription: string;
  result: JobAnalysisResult;
  createdAt: string;
}

/**
 * Persists Company Prep analyses so they survive a refresh and build up a
 * history per vacancy — previously the analysis lived only in a local
 * signal and vanished the moment the user left the page (gap flagged in
 * SALINGO_FULL_AUDIT.md).
 */
@Injectable({ providedIn: 'root' })
export class CompanyPrepService {
  private readonly supabase = inject(SupabaseService).client;
  private readonly auth = inject(AuthService);

  readonly loading = signal(false);
  private readonly analyses = signal<CompanyPrepAnalysis[]>([]);

  readonly history = computed(() => this.analyses());

  constructor() {
    effect(() => {
      const userId = this.auth.userId();
      if (userId && this.auth.ready()) {
        this.load(userId);
      } else if (this.auth.ready()) {
        this.analyses.set([]);
      }
    });
  }

  async save(input: { company: string; position: InterviewPosition | null; jobDescription: string; result: JobAnalysisResult }): Promise<void> {
    const userId = this.auth.userId();
    const local: CompanyPrepAnalysis = {
      id: `local-${Date.now()}`,
      company: input.company,
      position: input.position,
      jobDescription: input.jobDescription,
      result: input.result,
      createdAt: new Date().toISOString(),
    };
    this.analyses.update((list) => [local, ...list]);

    if (!userId) return;
    const { error } = await this.supabase.from('company_prep_analyses').insert({
      user_id: userId,
      company: input.company,
      position: input.position,
      job_description: input.jobDescription,
      result: input.result,
    });
    if (error) console.error('[CompanyPrep] save failed', error);
  }

  private async load(userId: string): Promise<void> {
    this.loading.set(true);
    try {
      const { data, error } = await this.supabase
        .from('company_prep_analyses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;

      this.analyses.set(
        (data ?? []).map((row) => ({
          id: row.id,
          company: row.company,
          position: row.position as InterviewPosition | null,
          jobDescription: row.job_description,
          result: row.result as JobAnalysisResult,
          createdAt: row.created_at,
        })),
      );
    } catch (err) {
      console.error('[CompanyPrep] load failed', err);
    } finally {
      this.loading.set(false);
    }
  }
}
