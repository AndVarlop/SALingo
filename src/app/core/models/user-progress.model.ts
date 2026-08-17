import { CefrLevel, LanguageCode } from './language.model';
import { Skill } from './skill.model';

export interface DailyActivity {
  date: string; // ISO date, yyyy-mm-dd
  minutesStudied: number;
  xpEarned: number;
  goalMet: boolean;
}

export interface ActivityLogEntry {
  id: string;
  date: string; // ISO datetime
  type: 'lesson' | 'review' | 'grammar' | 'listening' | 'speaking' | 'writing' | 'placement-test' | 'interview';
  title: string;
  xpEarned: number;
  accuracy?: number;
  /** Sub-skill this activity fed, e.g. "grammar:past-simple", "vocab:customer-service".
   * Optional — the Skill Engine falls back to the broad `type` when absent. */
  skillTag?: string;
}

export interface SkillProgress {
  skill: Skill;
  masteryPercent: number; // 0-100
}

export interface LanguageProgress {
  language: LanguageCode;
  level: CefrLevel;
  xp: number;
  xpToNextLevel: number;
  wordsLearned: number;
  totalStudyMinutes: number;
  averageAccuracy: number; // 0-100
  lessonsCompleted: string[]; // lesson ids
  skills: SkillProgress[];
  levelProgress: Record<CefrLevel, number>; // 0-100 completion per CEFR level
}

export interface UserProgress {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null; // ISO date
  activityByDate: DailyActivity[];
  activityLog: ActivityLogEntry[];
  languages: Record<LanguageCode, LanguageProgress | undefined>;
}
