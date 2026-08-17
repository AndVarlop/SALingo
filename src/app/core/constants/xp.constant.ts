/** XP economy tuning. Kept in one place so gamification stays consistent. */
export const XP_RULES = {
  correctExercise: 10,
  incorrectExercise: 2, // small consolation XP so users don't feel punished
  lessonCompleteBonus: 25,
  reviewCorrect: 5,
  streakDayBonus: 15,
  perfectLessonBonus: 20, // 100% accuracy
} as const;

/** XP required to go from level N to N+1. Simple linear curve, easy to swap later. */
export function xpForNextLevel(currentXp: number): number {
  const level = Math.floor(currentXp / 500);
  return (level + 1) * 500;
}
