import { Injectable, computed, inject } from '@angular/core';
import { UserStateService } from './user-state.service';
import { MistakeMemoryService } from './mistake-memory.service';

export interface WeeklyMetric {
  label: string;
  thisWeek: number | null;
  lastWeek: number | null;
  unit: string;
}

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

/**
 * Spec section 30: a weekly report comparing "this week" vs "last week"
 * across study time, XP, speaking/interview accuracy, vocabulary practice
 * and mistakes reviewed. Everything here is derived from data the app
 * already tracks (activityByDate/activityLog, My Mistakes) — no new
 * tables, no snapshots. Per the "no fake data" rule, a week with zero
 * matching entries reports `null`, not 0, so the UI can say "not enough
 * data" instead of implying a decline that didn't happen.
 */
@Injectable({ providedIn: 'root' })
export class AdvancedAnalyticsService {
  private readonly userState = inject(UserStateService);
  private readonly mistakeMemory = inject(MistakeMemoryService);

  private readonly thisWeekStart = daysAgoIso(7);
  private readonly lastWeekStart = daysAgoIso(14);

  private avgAccuracy(type: string, from: string, to: string): number | null {
    const entries = this.userState
      .progress()
      .activityLog.filter((e) => e.type === type && e.accuracy !== undefined && e.date.slice(0, 10) >= from && e.date.slice(0, 10) < to);
    if (!entries.length) return null;
    return Math.round(entries.reduce((sum, e) => sum + (e.accuracy ?? 0), 0) / entries.length);
  }

  private countByType(type: string, from: string, to: string): number {
    return this.userState
      .progress()
      .activityLog.filter((e) => e.type === type && e.date.slice(0, 10) >= from && e.date.slice(0, 10) < to).length;
  }

  readonly weeklyReport = computed<WeeklyMetric[]>(() => {
    const activity = this.userState.progress().activityByDate;
    const sumMinutes = (from: string, to: string) =>
      activity.filter((a) => a.date >= from && a.date < to).reduce((sum, a) => sum + a.minutesStudied, 0);
    const sumXp = (from: string, to: string) =>
      activity.filter((a) => a.date >= from && a.date < to).reduce((sum, a) => sum + a.xpEarned, 0);

    const hasThisWeekActivity = activity.some((a) => a.date >= this.thisWeekStart);
    const hasLastWeekActivity = activity.some((a) => a.date >= this.lastWeekStart && a.date < this.thisWeekStart);

    const mistakesReviewedThisWeek = this.mistakeMemory
      .all()
      .filter((m) => m.lastSeenAt.slice(0, 10) >= this.thisWeekStart).length;
    const mistakesReviewedLastWeek = this.mistakeMemory
      .all()
      .filter((m) => m.lastSeenAt.slice(0, 10) >= this.lastWeekStart && m.lastSeenAt.slice(0, 10) < this.thisWeekStart)
      .length;

    return [
      {
        label: 'Study time',
        thisWeek: hasThisWeekActivity ? sumMinutes(this.thisWeekStart, '9999-12-31') : null,
        lastWeek: hasLastWeekActivity ? sumMinutes(this.lastWeekStart, this.thisWeekStart) : null,
        unit: 'min',
      },
      {
        label: 'XP earned',
        thisWeek: hasThisWeekActivity ? sumXp(this.thisWeekStart, '9999-12-31') : null,
        lastWeek: hasLastWeekActivity ? sumXp(this.lastWeekStart, this.thisWeekStart) : null,
        unit: 'XP',
      },
      {
        label: 'Speaking accuracy',
        thisWeek: this.avgAccuracy('speaking', this.thisWeekStart, '9999-12-31'),
        lastWeek: this.avgAccuracy('speaking', this.lastWeekStart, this.thisWeekStart),
        unit: '%',
      },
      {
        label: 'Interview accuracy',
        thisWeek: this.avgAccuracy('interview', this.thisWeekStart, '9999-12-31'),
        lastWeek: this.avgAccuracy('interview', this.lastWeekStart, this.thisWeekStart),
        unit: '%',
      },
      {
        label: 'Vocabulary reviews',
        thisWeek: hasThisWeekActivity ? this.countByType('review', this.thisWeekStart, '9999-12-31') : null,
        lastWeek: hasLastWeekActivity ? this.countByType('review', this.lastWeekStart, this.thisWeekStart) : null,
        unit: 'sessions',
      },
      {
        label: 'Mistakes reviewed',
        thisWeek: mistakesReviewedThisWeek || null,
        lastWeek: mistakesReviewedLastWeek || null,
        unit: '',
      },
    ];
  });
}
