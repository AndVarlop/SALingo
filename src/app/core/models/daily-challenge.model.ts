import { RecommendedActivityType } from './career-coach.model';

export interface DailyChallengeItem {
  id: string;
  title: string;
  reason: string;
  iconEmoji: string;
  actionLabel: string;
  routerLink: string[];
  type: RecommendedActivityType;
  /** Whether an activity matching this item's type was logged today. */
  completedToday: boolean;
}
