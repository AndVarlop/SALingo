import { Injectable, computed, inject } from '@angular/core';
import { UserStateService } from './user-state.service';
import { CEFR_LEVEL_ORDER, CefrLevel } from '../models';

/** Passing a Final Assessment requires at least this overall score. */
export const FINAL_ASSESSMENT_PASS_THRESHOLD = 70;

/**
 * Level unlocking (spec §8): a level is reachable either because the
 * user's own placement level already put them there (never lock someone
 * OUT of where a placement test or manual level change put them — "no
 * asumir que todos empiezan en A1"), or because they progressed there
 * sequentially by passing the previous level's Final Assessment.
 *
 * B1 → B2 has no Final Assessment gate (none existed before this level
 * system), so it stays reachable the same way it always was — via the
 * user's tracked level. B2 → C1 and C1 → C2 are real gates: the previous
 * level's Final Assessment (exam-registry.service.ts) must be passed.
 */
@Injectable({ providedIn: 'root' })
export class LevelProgressService {
  private readonly userState = inject(UserStateService);

  /** Most recent overall score per Final Assessment exam id, read from the same activity log every other Skill Engine consumer reads. */
  private readonly finalAssessmentScores = computed<Partial<Record<CefrLevel, number>>>(() => {
    const log = this.userState.progress().activityLog;
    const scores: Partial<Record<CefrLevel, number>> = {};
    const examIdForLevel: Partial<Record<CefrLevel, string>> = {
      [CefrLevel.B2]: 'b2-final-assessment',
      [CefrLevel.C1]: 'c1-final-assessment',
      [CefrLevel.C2]: 'c2-final-assessment',
    };
    for (const [level, examId] of Object.entries(examIdForLevel) as [CefrLevel, string][]) {
      const tag = `final-assessment:${examId}`;
      // Log entries aren't guaranteed sorted; take the best attempt, not just the latest — a
      // learner who passed once shouldn't get re-locked by a worse retake shown out of order.
      const best = log
        .filter((e) => e.skillTag === tag && e.accuracy !== undefined)
        .reduce<number | null>((max, e) => Math.max(max ?? 0, e.accuracy ?? 0), null);
      if (best !== null) scores[level] = best;
    }
    return scores;
  });

  passedFinalAssessment(level: CefrLevel): boolean {
    const score = this.finalAssessmentScores()[level];
    return score !== undefined && score >= FINAL_ASSESSMENT_PASS_THRESHOLD;
  }

  finalAssessmentScore(level: CefrLevel): number | null {
    return this.finalAssessmentScores()[level] ?? null;
  }

  readonly unlockedLevels = computed<Set<CefrLevel>>(() => {
    const placementIndex = CEFR_LEVEL_ORDER.indexOf(this.userState.user().level);
    const unlocked = new Set<CefrLevel>();
    for (let i = 0; i < CEFR_LEVEL_ORDER.length; i++) {
      const level = CEFR_LEVEL_ORDER[i];
      if (i <= placementIndex) {
        unlocked.add(level);
        continue;
      }
      const prev = CEFR_LEVEL_ORDER[i - 1];
      if (!unlocked.has(prev)) continue; // previous level itself unreachable
      if (prev === CefrLevel.B1) {
        // No Final Assessment exists for A1/A2/B1 — reaching B1 is enough, same as before this feature.
        unlocked.add(level);
      } else if (this.passedFinalAssessment(prev)) {
        unlocked.add(level);
      }
    }
    return unlocked;
  });

  isLocked(level: CefrLevel): boolean {
    return !this.unlockedLevels().has(level);
  }

  /** Human-readable unlock condition, for the 🔒 locked-state UI. */
  lockReason(level: CefrLevel): string {
    const i = CEFR_LEVEL_ORDER.indexOf(level);
    const prev = i > 0 ? CEFR_LEVEL_ORDER[i - 1] : null;
    if (!prev) return '';
    if (prev === CefrLevel.B1) return `Reach ${prev} to unlock ${level}.`;
    return `Complete the ${prev} Final Assessment to unlock ${level}.`;
  }
}
