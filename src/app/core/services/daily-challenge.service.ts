import { Injectable, computed, effect, inject } from '@angular/core';
import { CareerCoachService } from './career-coach.service';
import { UserStateService } from './user-state.service';
import { StorageService } from './storage.service';
import { STORAGE_KEYS } from '../constants/storage-keys.constant';
import { XP_RULES } from '../constants/xp.constant';
import { DailyChallengeItem } from '../models';

const CHALLENGE_SIZE = 3;

interface BonusRecord {
  date: string;
  awarded: boolean;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Daily Challenge: today's top real recommendations
 * (CareerCoachService.recommendedActivities — already personalized, real
 * data, no fabrication) presented as a checklist, with "completed today"
 * checked against the real activity log. Zero new content or scoring —
 * this is a framing/reward layer on top of what already exists.
 *
 * Awards a one-time XP bonus per day when every item is completed, guarded
 * by a local flag (not Supabase-synced) so it doesn't re-fire on every
 * reload. Known limitation: a user completing the same day's challenge
 * from two different devices could get the bonus twice, since the guard
 * is per-device — an acceptable tradeoff for a one-time XP nudge, not
 * worth a schema change to prevent.
 */
@Injectable({ providedIn: 'root' })
export class DailyChallengeService {
  private readonly careerCoach = inject(CareerCoachService);
  private readonly userState = inject(UserStateService);
  private readonly storage = inject(StorageService);

  readonly items = computed<DailyChallengeItem[]>(() => {
    const today = todayIso();
    const todaysTypes = new Set<string>(
      this.userState
        .progress()
        .activityLog.filter((e) => e.date.slice(0, 10) === today)
        .map((e) => e.type),
    );

    return this.careerCoach
      .recommendedActivities()
      .slice(0, CHALLENGE_SIZE)
      .map((rec) => ({
        id: rec.id,
        title: rec.title,
        reason: rec.reason,
        iconEmoji: rec.iconEmoji,
        actionLabel: rec.actionLabel,
        routerLink: rec.routerLink,
        type: rec.type,
        completedToday: todaysTypes.has(rec.type),
      }));
  });

  readonly allCompleted = computed(
    () => this.items().length > 0 && this.items().every((i) => i.completedToday),
  );

  constructor() {
    effect(() => {
      if (!this.allCompleted()) return;
      this.tryAwardBonus();
    });
  }

  private tryAwardBonus(): void {
    const today = todayIso();
    const record = this.storage.get<BonusRecord>(STORAGE_KEYS.dailyChallengeBonus);
    if (record?.date === today && record.awarded) return;

    this.storage.set<BonusRecord>(STORAGE_KEYS.dailyChallengeBonus, { date: today, awarded: true });
    this.userState.recordActivity({
      minutes: 0,
      xp: XP_RULES.dailyChallengeBonus,
      type: 'review',
      title: 'Daily Challenge complete',
    });
  }
}
