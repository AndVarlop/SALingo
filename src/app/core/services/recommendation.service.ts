import { Injectable, computed, inject } from '@angular/core';
import { UserStateService } from './user-state.service';
import { MockLessonService } from './mock-lesson.service';
import { Skill, StudyRecommendation } from '../models';
import { SKILL_ICON, SKILL_LABEL } from '../models/skill.model';

/** Not every skill has its own route yet (Reading lives inside Lessons). */
const SKILL_ROUTE: Partial<Record<Skill, string>> = {
  [Skill.Vocabulary]: '/vocabulary',
  [Skill.Grammar]: '/grammar',
  [Skill.Listening]: '/listening',
  [Skill.Speaking]: '/speaking',
  [Skill.Writing]: '/writing',
};

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

  /** Mock count of vocabulary words due today — replaced by SpacedRepetitionService in Phase 4. */
  private readonly wordsDueForReview = computed(() => 12);

  readonly recommendations = computed<StudyRecommendation[]>(() => {
    const items: StudyRecommendation[] = [];
    const dueCount = this.wordsDueForReview();

    if (dueCount > 0) {
      items.push({
        id: 'rec-review',
        title: `Review ${dueCount} vocabulary words`,
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

    const weakestSkill = [...this.userState.currentLanguageProgress().skills]
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

    return items;
  });
}
