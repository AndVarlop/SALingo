export enum AchievementCategory {
  Streak = 'streak',
  Vocabulary = 'vocabulary',
  Accuracy = 'accuracy',
  Lessons = 'lessons',
  Xp = 'xp',
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  iconEmoji: string;
  category: AchievementCategory;
  /** Numeric goal to reach (e.g. 7 for a 7-day streak). */
  goal: number;
  unlockedAt: string | null; // ISO date, null = still locked
}
