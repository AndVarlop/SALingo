import { AchievementCategory } from '../../models';

export interface AchievementContext {
  streak: number;
  longestStreak: number;
  xp: number;
  lessonsCompleted: number;
  wordsLearned: number;
  grammarTopicsCompleted: number;
  averageAccuracy: number;
  interviewQuestionsPracticed: number;
  interviewWordsKnown: number;
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  iconEmoji: string;
  category: AchievementCategory;
  goal: number;
  isUnlocked: (ctx: AchievementContext) => boolean;
}

export const MOCK_ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'ach-first-lesson',
    title: 'First Lesson Completed',
    description: 'Complete your very first lesson.',
    iconEmoji: '🏆',
    category: AchievementCategory.Lessons,
    goal: 1,
    isUnlocked: (ctx) => ctx.lessonsCompleted >= 1,
  },
  {
    id: 'ach-lessons-5',
    title: 'Getting Started',
    description: 'Complete 5 lessons.',
    iconEmoji: '📗',
    category: AchievementCategory.Lessons,
    goal: 5,
    isUnlocked: (ctx) => ctx.lessonsCompleted >= 5,
  },
  {
    id: 'ach-streak-7',
    title: '7 Day Streak',
    description: 'Study 7 days in a row.',
    iconEmoji: '🔥',
    category: AchievementCategory.Streak,
    goal: 7,
    isUnlocked: (ctx) => ctx.streak >= 7 || ctx.longestStreak >= 7,
  },
  {
    id: 'ach-streak-30',
    title: '30 Day Streak',
    description: 'Study 30 days in a row.',
    iconEmoji: '🔥',
    category: AchievementCategory.Streak,
    goal: 30,
    isUnlocked: (ctx) => ctx.streak >= 30 || ctx.longestStreak >= 30,
  },
  {
    id: 'ach-words-25',
    title: '25 Words Learned',
    description: 'Reach 60%+ mastery on 25 vocabulary words.',
    iconEmoji: '📚',
    category: AchievementCategory.Vocabulary,
    goal: 25,
    isUnlocked: (ctx) => ctx.wordsLearned >= 25,
  },
  {
    id: 'ach-words-100',
    title: '100 Words Learned',
    description: 'Reach 60%+ mastery on 100 vocabulary words.',
    iconEmoji: '📚',
    category: AchievementCategory.Vocabulary,
    goal: 100,
    isUnlocked: (ctx) => ctx.wordsLearned >= 100,
  },
  {
    id: 'ach-accuracy-90',
    title: '90% Accuracy',
    description: 'Reach a 90% average accuracy.',
    iconEmoji: '🎯',
    category: AchievementCategory.Accuracy,
    goal: 90,
    isUnlocked: (ctx) => ctx.averageAccuracy >= 90,
  },
  {
    id: 'ach-xp-500',
    title: 'Level Up',
    description: 'Earn 500 total XP.',
    iconEmoji: '⭐',
    category: AchievementCategory.Xp,
    goal: 500,
    isUnlocked: (ctx) => ctx.xp >= 500,
  },
  {
    id: 'ach-xp-2000',
    title: 'XP Champion',
    description: 'Earn 2,000 total XP.',
    iconEmoji: '💎',
    category: AchievementCategory.Xp,
    goal: 2000,
    isUnlocked: (ctx) => ctx.xp >= 2000,
  },
  {
    id: 'ach-grammar-5',
    title: 'Grammar Enthusiast',
    description: 'Complete 5 grammar topics.',
    iconEmoji: '✏️',
    category: AchievementCategory.Lessons,
    goal: 5,
    isUnlocked: (ctx) => ctx.grammarTopicsCompleted >= 5,
  },
  {
    id: 'ach-interview-first-question',
    title: 'Interview Ready',
    description: 'Practice your first interview question.',
    iconEmoji: '📞',
    category: AchievementCategory.Lessons,
    goal: 1,
    isUnlocked: (ctx) => ctx.interviewQuestionsPracticed >= 1,
  },
  {
    id: 'ach-interview-questions-10',
    title: 'Customer Service Pro',
    description: 'Practice 10 interview questions.',
    iconEmoji: '💬',
    category: AchievementCategory.Lessons,
    goal: 10,
    isUnlocked: (ctx) => ctx.interviewQuestionsPracticed >= 10,
  },
  {
    id: 'ach-interview-vocab-20',
    title: 'Call Center Vocabulary',
    description: 'Mark 20 call center words as known.',
    iconEmoji: '📖',
    category: AchievementCategory.Vocabulary,
    goal: 20,
    isUnlocked: (ctx) => ctx.interviewWordsKnown >= 20,
  },
];
