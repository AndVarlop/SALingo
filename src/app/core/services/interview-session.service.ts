import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { InterviewPosition, InterviewSession } from '../models';

/** Owns Mock Interview session history — separate from InterviewProgressService's profile/answers/vocab concerns. */
@Injectable({ providedIn: 'root' })
export class InterviewSessionService {
  private readonly supabase = inject(SupabaseService).client;
  private readonly auth = inject(AuthService);

  readonly loading = signal(false);
  private readonly sessions = signal<InterviewSession[]>([]);

  readonly history = computed(() => this.sessions());
  readonly sessionCount = computed(() => this.sessions().length);
  readonly bestScore = computed(() => Math.max(0, ...this.sessions().map((s) => s.overallScore)));
  readonly averageScore = computed(() => {
    const list = this.sessions();
    if (!list.length) return 0;
    return Math.round(list.reduce((sum, s) => sum + s.overallScore, 0) / list.length);
  });

  constructor() {
    effect(() => {
      const userId = this.auth.userId();
      if (userId && this.auth.ready()) {
        this.load(userId);
      } else if (this.auth.ready()) {
        this.sessions.set([]);
      }
    });
  }

  async saveSession(session: {
    position: InterviewPosition | null;
    durationSeconds: number;
    questionCount: number;
    overallScore: number;
    strengths: string[];
    improvements: string[];
    mode: 'guided' | 'real';
  }): Promise<void> {
    const userId = this.auth.userId();
    const local: InterviewSession = {
      id: `local-${Date.now()}`,
      position: session.position,
      startedAt: new Date().toISOString(),
      durationSeconds: session.durationSeconds,
      questionCount: session.questionCount,
      overallScore: session.overallScore,
      strengths: session.strengths,
      improvements: session.improvements,
      mode: session.mode,
    };
    this.sessions.update((list) => [local, ...list]);

    if (!userId) return;
    const { error } = await this.supabase.from('interview_sessions').insert({
      user_id: userId,
      target_position: session.position,
      duration_seconds: session.durationSeconds,
      question_count: session.questionCount,
      overall_score: session.overallScore,
      strengths: session.strengths,
      improvements: session.improvements,
      mode: session.mode,
    });
    if (error) console.error('[InterviewSession] saveSession failed', error);
  }

  private async load(userId: string): Promise<void> {
    this.loading.set(true);
    try {
      const { data, error } = await this.supabase
        .from('interview_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
        .limit(30);
      if (error) throw error;

      this.sessions.set(
        (data ?? []).map((row) => ({
          id: row.id,
          position: row.target_position as InterviewPosition | null,
          startedAt: row.started_at,
          durationSeconds: row.duration_seconds,
          questionCount: row.question_count,
          overallScore: row.overall_score,
          strengths: (row.strengths as string[]) ?? [],
          improvements: (row.improvements as string[]) ?? [],
          mode: row.mode as InterviewSession['mode'],
        })),
      );
    } catch (err) {
      console.error('[InterviewSession] load failed', err);
    } finally {
      this.loading.set(false);
    }
  }
}
