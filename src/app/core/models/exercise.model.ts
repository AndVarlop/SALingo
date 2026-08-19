import { CefrLevel } from './language.model';

export enum ExerciseType {
  MultipleChoice = 'multiple-choice',
  Translation = 'translation',
  FillBlank = 'fill-blank',
  WordOrder = 'word-order',
  TrueFalse = 'true-false',
  Flashcard = 'flashcard',
  Listening = 'listening',
  Reading = 'reading',
  Speaking = 'speaking',
}

interface BaseExercise {
  id: string;
  type: ExerciseType;
  prompt: string;
  explanation?: string;
  xpReward: number;
  /** Optional CEFR level tag, used by standalone skill modules (Reading/Listening/Speaking) to filter by level. Lessons carry their level on the parent Lesson instead. */
  level?: CefrLevel;
}

export interface MultipleChoiceExercise extends BaseExercise {
  type: ExerciseType.MultipleChoice;
  options: string[];
  correctOptionIndex: number;
}

export interface TranslationExercise extends BaseExercise {
  type: ExerciseType.Translation;
  sourceText: string;
  acceptedAnswers: string[];
}

export interface FillBlankExercise extends BaseExercise {
  type: ExerciseType.FillBlank;
  sentenceWithBlank: string; // uses "___" as blank marker
  options: string[];
  correctOptionIndex: number;
}

export interface WordOrderExercise extends BaseExercise {
  type: ExerciseType.WordOrder;
  shuffledWords: string[];
  correctSentence: string;
}

export interface TrueFalseExercise extends BaseExercise {
  type: ExerciseType.TrueFalse;
  statement: string;
  correctAnswer: boolean;
}

export interface FlashcardExercise extends BaseExercise {
  type: ExerciseType.Flashcard;
  term: string;
  pronunciation?: string;
  translation: string;
  example?: string;
}

export interface ListeningExercise extends BaseExercise {
  type: ExerciseType.Listening;
  audioText: string; // text fed to speech synthesis
  options: string[];
  correctOptionIndex: number;
}

export interface ReadingExercise extends BaseExercise {
  type: ExerciseType.Reading;
  passage: string;
  questions: MultipleChoiceExercise[];
}

export interface SpeakingExercise extends BaseExercise {
  type: ExerciseType.Speaking;
  expectedSentence: string;
  hint?: string;
}

export type Exercise =
  | MultipleChoiceExercise
  | TranslationExercise
  | FillBlankExercise
  | WordOrderExercise
  | TrueFalseExercise
  | FlashcardExercise
  | ListeningExercise
  | ReadingExercise
  | SpeakingExercise;

export interface ExerciseResult {
  exerciseId: string;
  correct: boolean;
  userAnswer: string;
  timeSpentSeconds: number;
}

/** Emitted by every exercise-type component the moment the user's answer is locked in. */
export interface ExerciseAnswer {
  correct: boolean;
  userAnswer: string;
}
