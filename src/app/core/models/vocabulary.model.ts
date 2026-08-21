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
  // Vocabulary Engine expansion — see DEVELOPMENT_REPORT.md § Vocabulary Engine.
  CustomerService = 'Customer Service',
  CallCenter = 'Call Center',
  Finance = 'Finance',
  Leadership = 'Leadership',
  Career = 'Career',
  Communication = 'Communication',
  Emotions = 'Emotions',
  Environment = 'Environment',
  Society = 'Society',
  Media = 'Media',
  Relationships = 'Relationships',
  Shopping = 'Shopping',
  Sales = 'Sales',
}

/** How natural/appropriate a word or phrase is in a given social setting. */
export type VocabularyRegister = 'casual' | 'neutral' | 'formal';

/** Mastery ladder — drives both selection weighting and "My Vocabulary" grouping. Derived, not stored. */
export type VocabularyStatus = 'new' | 'learning' | 'practicing' | 'familiar' | 'mastered';

export interface VocabularyWord {
  id: string;
  language: LanguageCode;
  term: string;
  translation: string;
  pronunciation: string; // IPA
  /** First/primary example — kept for backward compatibility with existing UI. Prefer `examples`. */
  example: string;
  category: VocabularyCategory;
  level: CefrLevel;
  /** 0-100, how well the user knows this word. */
  masteryPercent: number;
  isFavorite: boolean;

  // --- Lexical knowledge (§3–§4 of the Vocabulary Engine spec). All optional so
  // older/thin rows (or content the migration hasn't reached yet) still render. ---
  /** e.g. "noun", "verb", "phrasal verb", "idiom", "collocation". */
  partOfSpeech?: string;
  /** Short English definition — used by Definition Challenge and Nuance Challenge. */
  definition?: string;
  /** 3–8 varied example sentences (subject/tense/context varied). Falls back to [example]. */
  examples?: string[];
  synonyms?: string[];
  antonyms?: string[];
  /** e.g. ["make a decision", "make progress"] for the headword "make". */
  collocations?: string[];
  register?: VocabularyRegister;
  /** Finer-grained than category — e.g. "Refunds & Billing" within Customer Service. */
  topic?: string;
  /** Ids of lexically related words (word family, e.g. decide → decision, decisive). */
  relatedWords?: string[];
  /** For polysemous headwords sharing a term (e.g. "charge"): a short label for this sense, e.g. "to bill". */
  sense?: string;
  /** Frequent learner error for this word, shown as a callout. */
  commonMistake?: string;
}
