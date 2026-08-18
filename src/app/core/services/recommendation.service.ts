import { Injectable, computed, inject } from '@angular/core';
import { UserStateService } from './user-state.service';
import { MockLessonService } from './mock-lesson.service';
import { SpacedRepetitionService } from './spaced-repetition.service';
import { LevelProgressService } from './level-progress.service';
import { CefrLevel, Skill, StudyRecommendation } from '../models';
import { SKILL_ICON, SKILL_LABEL } from '../models/skill.model';
import { humanizeSkillTag } from '../utils/skill-tag.util';

const SKILL_ROUTE: Partial<Record<Skill, string>> = {
  [Skill.Vocabulary]: '/vocabulary',
  [Skill.Grammar]: '/grammar',
  [Skill.Reading]: '/reading',
  [Skill.Listening]: '/listening',
  [Skill.Speaking]: '/speaking',
  [Skill.Writing]: '/writing',
};

/** B2/C1/C2 Final Assessments, in gate order — checked first-unlocked-but-unpassed wins. */
const ADVANCED_LEVELS: CefrLevel[] = [CefrLevel.B2, CefrLevel.C1, CefrLevel.C2];

/**
 * Rule-based "what should I study next" engine. Deliberately simple today
 * (weakest skill + pending review + next lesson); swap the body of
 * `getRecommendations()` for a call to an AI recommendation API later
 * without touching any caller.
 */
@Injectable({ providedIn: 'root' })
export class RecommendationService {
  private readonly userState = inject(UserStateService);
  private readonly lessons = inject(MockLessonService);
  private readonly spacedRepetition = inject(SpacedRepetitionService);
  private readonly levelProgress = inject(LevelProgressService);

  readonly recommendations = computed<StudyRecommendation[]>(() => {
    const items: StudyRecommendation[] = [];
    const dueCount = this.spacedRepetition.dueCount();

    if (dueCount > 0) {
      items.push({
        id: 'rec-review',
        title: `Review ${dueCount} vocabulary word${dueCount === 1 ? '' : 's'}`,
        description: 'Keep your memory fresh with spaced repetition.',
        iconEmoji: '🧠',
        actionLabel: 'Start review',
        routerLink: ['/review'],
      });
    }

    const nextLesson = this.lessons.getRecommendedLesson();
    if (nextLesson) {
      items.push({
        id: 'rec-lesson',
        title: `Complete "${nextLesson.title}"`,
        description: nextLesson.description,
        iconEmoji: nextLesson.iconEmoji,
        actionLabel: 'Continue lesson',
        routerLink: ['/lessons'],
      });
    }

    const weakestSkill = [...this.userState.skillMastery()]
      .filter((s) => SKILL_ROUTE[s.skill])
      .sort((a, b) => a.masteryPercent - b.masteryPercent)[0];
    if (weakestSkill) {
      items.push({
        id: 'rec-skill',
        title: `Practice ${SKILL_LABEL[weakestSkill.skill]}`,
        description: `Your weakest skill right now is at ${weakestSkill.masteryPercent}%.`,
        iconEmoji: SKILL_ICON[weakestSkill.skill],
        actionLabel: 'Practice now',
        routerLink: [SKILL_ROUTE[weakestSkill.skill]!],
      });
    }

    const weakTag = this.weakestTagRecommendation();
    if (weakTag) items.push(weakTag);

    const finalAssessment = this.finalAssessmentRecommendation();
    if (finalAssessment) items.push(finalAssessment);

    return items;
  });

  /**
   * Spec §9/§14: once a level is genuinely reachable (LevelProgressService)
   * but its Final Assessment hasn't been passed yet, that's a concrete,
   * real "what's next" — never suggested for a level still locked, so this
   * can never point at a route the user can't actually act on yet.
   */
  private finalAssessmentRecommendation(): StudyRecommendation | null {
    for (const level of ADVANCED_LEVELS) {
      if (this.levelProgress.isLocked(level)) continue;
      if (this.levelProgress.passedFinalAssessment(level)) continue;
      const attempted = this.levelProgress.finalAssessmentScore(level);
      return {
        id: 'rec-final-assessment',
        title: `Take the ${level} Final Assessment`,
        description: attempted
          ? `Your last attempt scored ${attempted}% — try again to unlock the next level.`
          : `Pass this to unlock the next level and advance your Career Path.`,
        iconEmoji: '🏁',
        actionLabel: 'Start assessment',
        routerLink: ['/exam', `${level.toLowerCase()}-final-assessment`],
      };
    }
    return null;
  }

  /**
   * Skill Engine, sub-skill level: points at the specific mini-game that
   * targets the user's single weakest tag (e.g. "grammar:past-simple" ->
   * Grammar Battle, which already opens on that exact topic first — see
   * GrammarBattleComponent.focusTopicLabel). Only fires below a real
   * struggling threshold, and only once real tagged activity exists.
   */
  private weakestTagRecommendation(): StudyRecommendation | null {
    const WEAK_THRESHOLD = 70;
    const byTag = this.userState.masteryByTag();
    const weakest = Object.entries(byTag)
      .map(([tag, percent]) => ({ tag, percent }))
      .sort((a, b) => a.percent - b.percent)[0];
    if (!weakest || weakest.percent >= WEAK_THRESHOLD) return null;

    const label = humanizeSkillTag(weakest.tag);
    if (weakest.tag.startsWith('grammar:')) {
      return {
        id: 'rec-weak-tag',
        title: `Battle your weak spot: ${label}`,
        description: `You're at ${weakest.percent}% on ${label} — Grammar Battle will open with this topic.`,
        iconEmoji: '⚔️',
        actionLabel: 'Start Grammar Battle',
        routerLink: ['/grammar-battle'],
      };
    }
    if (weakest.tag.startsWith('vocab:')) {
      return {
        id: 'rec-weak-tag',
        title: `Rush your weak spot: ${label}`,
        description: `You're at ${weakest.percent}% on ${label} vocabulary — a quick round will help.`,
        iconEmoji: '⚡',
        actionLabel: 'Start Vocabulary Rush',
        routerLink: ['/vocabulary-rush'],
      };
    }
    if (weakest.tag.startsWith('listening:')) {
      return {
        id: 'rec-weak-tag',
        title: `Practice listening: ${label}`,
        description: `You're at ${weakest.percent}% on ${label} — a focused listening session will help.`,
        iconEmoji: '🎧',
        actionLabel: 'Practice Listening',
        routerLink: ['/listening'],
      };
    }
    if (weakest.tag.startsWith('reading:')) {
      return {
        id: 'rec-weak-tag',
        title: `Practice reading: ${label}`,
        description: `You're at ${weakest.percent}% on ${label} — another passage will help.`,
        iconEmoji: '📖',
        actionLabel: 'Practice Reading',
        routerLink: ['/reading'],
      };
    }
    return {
      id: 'rec-weak-tag',
      title: `Practice: ${label}`,
      description: `You're at ${weakest.percent}% on ${label} — Find the Mistake is good practice for this.`,
      iconEmoji: '🕵️',
      actionLabel: 'Start Find the Mistake',
      routerLink: ['/find-the-mistake'],
    };
  }

}
