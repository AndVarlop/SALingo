import { CefrLevel, LanguageCode } from './language.model';
import { Exercise } from './exercise.model';
import { Skill } from './skill.model';

export interface LessonSummary {
  id: string;
  language: LanguageCode;
  level: CefrLevel;
  title: string;
  description: string;
  iconEmoji: string;
  primarySkill: Skill;
  estimatedMinutes: number;
  xpReward: number;
  order: number;
  /** Lesson ids that must be completed before this one unlocks. Empty = always unlocked. */
  requiresLessonIds: string[];
}

export interface Lesson extends LessonSummary {
  explanation: string;
  examples: string[];
  vocabulary: string[]; // vocabulary word ids introduced
  exercises: Exercise[];
}

export interface LessonResult {
  lessonId: string;
  correctCount: number;
  incorrectCount: number;
  xpEarned: number;
  accuracy: number; // 0-100
  timeSpentSeconds: number;
  completedAt: string; // ISO date
}
