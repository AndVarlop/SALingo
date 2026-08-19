/** Central registry of localStorage keys. Never build a key string anywhere else. */
export const STORAGE_KEYS = {
  user: 'lingo.user',
  settings: 'lingo.settings',
  progress: 'lingo.progress',
  reviewItems: 'lingo.review-items',
  vocabulary: 'lingo.vocabulary',
  achievements: 'lingo.achievements',
  completedLessons: 'lingo.completed-lessons',
  authToken: 'lingo.auth-token',
  dailyChallengeBonus: 'lingo.daily-challenge-bonus',
  sidebarCollapsed: 'lingo.sidebar-collapsed',
  recentVocabulary: 'lingo.recent-vocabulary',
} as const;
