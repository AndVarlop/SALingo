import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { InterviewPosition, InterviewSession } from '../models';

/**
 * Owns every kind of Interview Prep "practice session" log — Mock Interview
 * history, plus lighter-weight Roleplay and Scenario completion records
 * (separate from InterviewProgressService's profile/answers/vocab concerns).
 */
@Injectable({ providedIn: 'root' })
export class InterviewSessionService {
  private readonly supabase = inject(SupabaseService).client;
  private readonly auth = inject(AuthService);

  readonly loading = signal(false);
  private readonly sessions = signal<InterviewSession[]>([]);
  private readonly roleplayCompletions = signal<{ scenarioId: string; score: number }[]>([]);
  private readonly scenarioSessionCount = signal(0);

  readonly history = computed(() => this.sessions());
  readonly sessionCount = computed(() => this.sessions().length);
  readonly bestScore = computed(() => Math.max(0, ...this.sessions().map((s) => s.overallScore)));
  readonly averageScore = computed(() => {
    const list = this.sessions();
    if (!list.length) return 0;
    return Math.round(list.reduce((sum, s) => sum + s.overallScore, 0) / list.length);
  });

  readonly roleplayCount = computed(() => this.roleplayCompletions().length);
  readonly completedRoleplayScenarioIds = computed(
    () => new Set(this.roleplayCompletions().map((r) => r.scenarioId)),
  );
  readonly hasCompletedAnyScenarioSession = computed(() => this.scenarioSessionCount() > 0);

  constructor() {
    effect(() => {
      const userId = this.auth.userId();
      if (userId && this.auth.ready()) {
        this.load(userId);
      } else if (this.auth.ready()) {
        this.sessions.set([]);
        this.roleplayCompletions.set([]);
        this.scenarioSessionCount.set(0);
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

  async saveRoleplayCompletion(scenarioId: string, score: number): Promise<void> {
    this.roleplayCompletions.update((list) => [...list, { scenarioId, score }]);

    const userId = this.auth.userId();
    if (!userId) return;
    const { error } = await this.supabase
      .from('roleplay_sessions')
      .insert({ user_id: userId, scenario_id: scenarioId, score });
    if (error) console.error('[InterviewSession] saveRoleplayCompletion failed', error);
  }

  async saveScenarioSession(accuracy: number): Promise<void> {
    this.scenarioSessionCount.update((n) => n + 1);

    const userId = this.auth.userId();
    if (!userId) return;
    const { error } = await this.supabase.from('scenario_sessions').insert({ user_id: userId, accuracy });
    if (error) console.error('[InterviewSession] saveScenarioSession failed', error);
  }

  private async load(userId: string): Promise<void> {
    this.loading.set(true);
    try {
      const [sessionsRes, roleplayRes, scenarioRes] = await Promise.all([
        this.supabase
          .from('interview_sessions')
          .select('*')
          .eq('user_id', userId)
          .order('started_at', { ascending: false })
          .limit(30),
        this.supabase.from('roleplay_sessions').select('scenario_id,score').eq('user_id', userId),
        this.supabase.from('scenario_sessions').select('id').eq('user_id', userId),
      ]);

      if (sessionsRes.error) throw sessionsRes.error;
      this.sessions.set(
        (sessionsRes.data ?? []).map((row) => ({
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

      if (roleplayRes.error) throw roleplayRes.error;
      this.roleplayCompletions.set(
        (roleplayRes.data ?? []).map((r) => ({ scenarioId: r.scenario_id, score: r.score })),
      );

      if (scenarioRes.error) throw scenarioRes.error;
      this.scenarioSessionCount.set((scenarioRes.data ?? []).length);
    } catch (err) {
      console.error('[InterviewSession] load failed', err);
    } finally {
      this.loading.set(false);
    }
  }
}
