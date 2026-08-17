import { CefrLevel, LanguageCode } from './language.model';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  avatarEmoji: string;
  primaryLanguage: LanguageCode;
  level: CefrLevel;
  startedAt: string; // ISO date
}

export type ThemeMode = 'light' | 'dark';

export interface UserSettings {
  theme: ThemeMode;
  dailyGoalMinutes: number;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  difficulty: 'easy' | 'normal' | 'hard';
  learningLanguage: LanguageCode;
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  theme: 'light',
  dailyGoalMinutes: 20,
  notificationsEnabled: true,
  soundEnabled: true,
  difficulty: 'normal',
  learningLanguage: 'en',
};
