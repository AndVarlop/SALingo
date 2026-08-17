/** ISO-ish code for a language supported by the platform. */
export type LanguageCode = 'en' | 'fr' | 'de' | 'it' | 'pt' | 'es';

export interface Language {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flagEmoji: string;
  /** Whether lesson/vocab/grammar content currently exists for this language. */
  available: boolean;
}

export enum CefrLevel {
  A1 = 'A1',
  A2 = 'A2',
  B1 = 'B1',
  B2 = 'B2',
  C1 = 'C1',
  C2 = 'C2',
}

export const CEFR_LEVEL_ORDER: CefrLevel[] = [
  CefrLevel.A1,
  CefrLevel.A2,
  CefrLevel.B1,
  CefrLevel.B2,
  CefrLevel.C1,
  CefrLevel.C2,
];

export const CEFR_LEVEL_LABEL: Record<CefrLevel, string> = {
  [CefrLevel.A1]: 'Beginner',
  [CefrLevel.A2]: 'Elementary',
  [CefrLevel.B1]: 'Intermediate',
  [CefrLevel.B2]: 'Upper Intermediate',
  [CefrLevel.C1]: 'Advanced',
  [CefrLevel.C2]: 'Proficient',
};
