import { CefrLevel, LanguageCode } from './language.model';

export enum VocabularyCategory {
  Food = 'Food',
  Travel = 'Travel',
  Work = 'Work',
  Technology = 'Technology',
  Family = 'Family',
  DailyLife = 'Daily Life',
  Education = 'Education',
  Business = 'Business',
  Health = 'Health',
  Nature = 'Nature',
}

export interface VocabularyWord {
  id: string;
  language: LanguageCode;
  term: string;
  translation: string;
  pronunciation: string; // IPA
  example: string;
  category: VocabularyCategory;
  level: CefrLevel;
  /** 0-100, how well the user knows this word. */
  masteryPercent: number;
  isFavorite: boolean;
}
