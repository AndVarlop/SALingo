import { CefrLevel, LanguageCode } from './language.model';
import { Exercise } from './exercise.model';

export interface GrammarTopic {
  id: string;
  language: LanguageCode;
  level: CefrLevel;
  title: string;
  summary: string;
  explanation: string;
  examples: string[];
  commonMistakes: string[];
  exercises: Exercise[];
  order: number;
}

export interface GrammarProgress {
  topicId: string;
  completed: boolean;
  bestScore: number; // 0-100
  attempts: number;
}
