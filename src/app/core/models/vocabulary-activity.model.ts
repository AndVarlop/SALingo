import { VocabularyWord } from './vocabulary.model';

/**
 * Vocabulary practice activity types (§12 of the Vocabulary Engine spec).
 * Not every word supports every type — generation falls back when metadata
 * is missing (see VocabularyActivityService.eligibleTypes).
 */
export type VocabularyActivityType =
  | 'multiple-choice' // choose the correct translation
  | 'context-choice' // choose the word that best fits a sentence
  | 'fill-blank' // type/choose the missing word
  | 'matching' // word <-> definition (rendered as a single question here: pick the match)
  | 'synonym' // choose the closest synonym
  | 'antonym' // choose the opposite
  | 'collocation' // "make a ___" -> decision
  | 'phrasal-verb' // meaning of a phrasal verb
  | 'definition' // shown a definition, choose the word
  | 'translation' // Spanish -> English
  | 'reverse-translation' // English -> Spanish
  | 'register'; // casual / neutral / formal / professional

export interface VocabularyQuestion {
  /** Stable per-generation id so recent-question history can dedupe (§31). */
  id: string;
  type: VocabularyActivityType;
  wordId: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  /** Shown after answering — reinforces context/nuance (§6, §16, §20). */
  explanation?: string;
}

export const ACTIVITY_LABEL: Record<VocabularyActivityType, string> = {
  'multiple-choice': 'Multiple Choice',
  'context-choice': 'Context Choice',
  'fill-blank': 'Fill in the Blank',
  matching: 'Matching',
  synonym: 'Synonym Challenge',
  antonym: 'Antonym Challenge',
  collocation: 'Collocation Challenge',
  'phrasal-verb': 'Phrasal Verb Challenge',
  definition: 'Definition Challenge',
  translation: 'Translation',
  'reverse-translation': 'Reverse Translation',
  register: 'Register Challenge',
};

/** One item in a practice session queue: a word paired with the activity chosen for it. */
export interface VocabularySessionItem {
  word: VocabularyWord;
  activityType: VocabularyActivityType;
}
