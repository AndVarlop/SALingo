import { Injectable, computed, inject } from '@angular/core';
import { UserStateService } from './user-state.service';
import { VocabularyService } from './vocabulary.service';
import { InterviewSessionService } from './interview-session.service';
import { InterviewProgressService } from './interview-progress.service';
import { RecommendationService } from './recommendation.service';
import { GrammarService } from './grammar.service';
import { CEFR_LEVEL_ORDER, JobReadyScore, RecommendedActivity, Skill, Weakness } from '../models';
import { SKILL_ICON, SKILL_LABEL } from '../models/skill.model';

/** Not every skill has its own practice route yet. */
const SKILL_ROUTE: Partial<Record<Skill, string>> = {
  [Skill.Vocabulary]: '/vocabulary',
  [Skill.Grammar]: '/grammar',
  [Skill.Listening]: '/listening',
  [Skill.Speaking]: '/speaking',
  [Skill.Writing]: '/writing',
};

/** Minimum signals required before we're willing to show a Job Ready number at all. */
const MIN_ACTIVITY_ENTRIES = 3;

/**
 * The "AI Career & Interview Coach" layer. Doesn't own new raw state — it
 * reads UserState/Vocabulary/InterviewSession/InterviewProgress (all already
 * Supabase-backed) and derives job-readiness signals from them:
 *
 *  - Job Ready Score: one weighted number + a per-dimension breakdown.
 *  - Weaknesses: the user's lowest-scoring dimensions, each with a practice link.
 *  - Recommended activities: reuses RecommendationService and adds
 *    interview/call-center-specific suggestions on top.
 *
 * Every score here is `null`/omitted until real activity exists — never a
 * fabricated number. See DEVELOPMENT_REPORT.md for the exact formula.
 */
@Injectable({ providedIn: 'root' })
export class CareerCoachService {
  private readonly userState = inject(UserStateService);
  private readonly vocabulary = inject(VocabularyService);
  private readonly interviewSessions = inject(InterviewSessionService);
  private readonly interviewProgress = inject(InterviewProgressService);
  private readonly recommendationService = inject(RecommendationService);
  private readonly grammarService = inject(GrammarService);

  /** english: CEFR level position on a 6-band scale (A1=~17 .. C2=100). */
  private readonly englishScore = computed<number | null>(() => {
    const level = this.userState.currentLanguageProgress().level;
    const index = CEFR_LEVEL_ORDER.indexOf(level);
    if (index < 0) return null;
    return Math.round(((index + 1) / CEFR_LEVEL_ORDER.length) * 100);
  });

  private readonly speakingScore = computed<number | null>(() => {
    const entry = this.userState.skillMastery().find((s) => s.skill === Skill.Speaking);
    if (!entry || entry.masteryPercent === 0) return null;
    return entry.masteryPercent;
  });

  private readonly interviewScore = computed<number | null>(() =>
    this.interviewSessions.sessionCount() > 0 ? this.interviewSessions.averageScore() : null,
  );

  private readonly customerServiceScore = computed<number | null>(() => {
    const readiness = this.interviewProgress.readiness();
    return readiness.overall > 0 ? readiness.overall : null;
  });

  private readonly vocabularyScore = computed<number | null>(() => {
    const words = this.vocabulary.words();
    const studied = words.filter((w) => w.masteryPercent > 0);
    if (!studied.length) return null;
    return Math.round(studied.reduce((sum, w) => sum + w.masteryPercent, 0) / studied.length);
  });

  /** grammar: average bestScore across attempted grammar topics — 0/untouched topics don't count against the user. */
  private readonly grammarScore = computed<number | null>(() => {
    const topics = this.grammarService.topics;
    const attempted = topics
      .map((t) => this.grammarService.progressFor(t.id))
      .filter((p) => p.attempts > 0);
    if (!attempted.length) return null;
    return Math.round(attempted.reduce((sum, p) => sum + p.bestScore, 0) / attempted.length);
  });

  /** Confidence has no dedicated instrument yet — approximated from interview + speaking performance. */
  private readonly confidenceScore = computed<number | null>(() => {
    const parts = [this.interviewScore(), this.speakingScore()].filter(
      (v): v is number => v !== null,
    );
    if (!parts.length) return null;
    return Math.round(parts.reduce((sum, v) => sum + v, 0) / parts.length);
  });

  /**
   * Job Ready Score = weighted average of seven dimensions. Missing
   * dimensions are excluded and the remaining weights renormalized, so
   * early users aren't punished for not having tried a feature yet —
   * they just see fewer dimensions until they do.
   *
   * Weights: english 18%, speaking 18%, interview 18%, customerService 12%,
   * vocabulary 12%, grammar 12%, confidence 10%. (Grammar has real tracked
   * data — 45 topics with per-user attempts/bestScore — that used to be
   * ignored by this formula for no reason; it's now weighted the same as
   * vocabulary/customerService.)
   */
  readonly jobReadyScore = computed<JobReadyScore>(() => {
    const breakdown = {
      english: this.englishScore(),
      speaking: this.speakingScore(),
      interview: this.interviewScore(),
      customerService: this.customerServiceScore(),
      vocabulary: this.vocabularyScore(),
      grammar: this.grammarScore(),
      confidence: this.confidenceScore(),
    };
    const weights: Record<keyof typeof breakdown, number> = {
      english: 18,
      speaking: 18,
      interview: 18,
      customerService: 12,
      vocabulary: 12,
      grammar: 12,
      confidence: 10,
    };

    const entries = Object.entries(breakdown) as [keyof typeof breakdown, number | null][];
    const available = entries.filter(([, v]) => v !== null) as [keyof typeof breakdown, number][];
    const activityCount = this.userState.progress().activityLog.length;
    const hasEnoughData = available.length >= 2 && activityCount >= MIN_ACTIVITY_ENTRIES;

    if (!hasEnoughData) {
      return {
        overall: null,
        breakdown,
        hasEnoughData: false,
        missingDataHint:
          'Not enough data yet. Complete a few lessons, a Speaking exercise and a Mock Interview to unlock your Job Ready Score.',
      };
    }

    const totalWeight = available.reduce((sum, [key]) => sum + weights[key], 0);
    const overall = Math.round(
      available.reduce((sum, [key, value]) => sum + value * weights[key], 0) / totalWeight,
    );

    return { overall, breakdown, hasEnoughData: true, missingDataHint: null };
  });

  /** Lowest-scoring dimensions with real data, worst first. Empty until enough activity exists. */
  readonly weaknesses = computed<Weakness[]>(() => {
    const candidates: { skill: Skill; percent: number }[] = this.userState
      .skillMastery()
      .filter((s) => SKILL_ROUTE[s.skill] && s.masteryPercent > 0)
      .map((s) => ({ skill: s.skill, percent: s.masteryPercent }));

    const interview = this.interviewScore();
    const list: Weakness[] = candidates
      .sort((a, b) => a.percent - b.percent)
      .slice(0, 3)
      .map((c) => ({
        id: `weak-${c.skill}`,
        label: SKILL_LABEL[c.skill],
        percent: c.percent,
        iconEmoji: SKILL_ICON[c.skill],
        routerLink: [SKILL_ROUTE[c.skill]!],
        actionLabel: `Practice ${SKILL_LABEL[c.skill]}`,
      }));

    if (interview !== null) {
      list.push({
        id: 'weak-interview',
        label: 'Interview Confidence',
        percent: interview,
        iconEmoji: '🎙️',
        routerLink: ['/interview-prep/mock-interview'],
        actionLabel: 'Practice Mock Interview',
      });
    }

    return list.sort((a, b) => a.percent - b.percent).slice(0, 4);
  });

  /** RecommendationService's picks, reframed as timed activities, plus interview-specific ones. */
  readonly recommendedActivities = computed<RecommendedActivity[]>(() => {
    const base: RecommendedActivity[] = this.recommendationService.recommendations().map((r) => ({
      id: r.id,
      type: this.inferType(r.id),
      title: r.title,
      reason: r.description,
      iconEmoji: r.iconEmoji,
      estimatedMinutes: this.estimateMinutes(r.id),
      actionLabel: r.actionLabel,
      routerLink: r.routerLink,
    }));

    if (this.interviewSessions.sessionCount() === 0) {
      base.push({
        id: 'rec-first-interview',
        type: 'interview',
        title: 'Complete your first Mock Interview',
        reason: 'You need at least one interview session to see your Job Ready Score.',
        iconEmoji: '🎙️',
        estimatedMinutes: 15,
        actionLabel: 'Start Mock Interview',
        routerLink: ['/interview-prep/mock-interview'],
      });
    } else if (this.interviewSessions.averageScore() < 70) {
      base.push({
        id: 'rec-improve-interview',
        type: 'interview',
        title: 'Handle an Angry Customer',
        reason: 'Your interview average is below 70% — practicing difficult scenarios builds confidence.',
        iconEmoji: '📞',
        estimatedMinutes: 10,
        actionLabel: 'Start Roleplay',
        routerLink: ['/interview-prep/roleplay'],
      });
    }

    return base;
  });

  private inferType(recId: string): RecommendedActivity['type'] {
    if (recId === 'rec-review') return 'review';
    if (recId === 'rec-lesson') return 'grammar';
    if (recId === 'rec-skill') return 'speaking';
    return 'review';
  }

  private estimateMinutes(recId: string): number {
    if (recId === 'rec-review') return 8;
    if (recId === 'rec-lesson') return 10;
    if (recId === 'rec-skill') return 10;
    return 10;
  }
}
