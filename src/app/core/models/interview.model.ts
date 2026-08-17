import { CefrLevel } from './language.model';

export enum InterviewPosition {
  CustomerService = 'customer-service',
  TechnicalSupport = 'technical-support',
  Sales = 'sales',
  ChatSupport = 'chat-support',
  EmailSupport = 'email-support',
  BilingualAgent = 'bilingual-agent',
  CallCenterAgent = 'call-center-agent',
  Collections = 'collections',
  Retention = 'retention',
  BackOffice = 'back-office',
}

export const INTERVIEW_POSITION_LABEL: Record<InterviewPosition, string> = {
  [InterviewPosition.CustomerService]: 'Customer Service',
  [InterviewPosition.TechnicalSupport]: 'Technical Support',
  [InterviewPosition.Sales]: 'Sales',
  [InterviewPosition.ChatSupport]: 'Chat Support',
  [InterviewPosition.EmailSupport]: 'Email Support',
  [InterviewPosition.BilingualAgent]: 'Bilingual Agent',
  [InterviewPosition.CallCenterAgent]: 'Call Center Agent',
  [InterviewPosition.Collections]: 'Collections',
  [InterviewPosition.Retention]: 'Retention',
  [InterviewPosition.BackOffice]: 'Back Office',
};

export type InterviewQuestionCategory = 'about-you' | 'call-center' | 'behavioral';

export const INTERVIEW_CATEGORY_LABEL: Record<InterviewQuestionCategory, string> = {
  'about-you': 'About You',
  'call-center': 'Call Center',
  behavioral: 'Behavioral (STAR)',
};

export interface InterviewQuestion {
  id: string;
  category: InterviewQuestionCategory;
  /** Positions this question is especially relevant for. Empty = applies to all. */
  positions: InterviewPosition[];
  question: string;
  /** Spanish: what the interviewer is really trying to find out. */
  whatInterviewerWants: string;
  /** Ordered steps for structuring an answer. */
  structure: string[];
  exampleAnswer: string;
  /** Spanish explanation of the example answer. */
  spanishExplanation: string;
  usefulVocabulary: string[];
}

export interface CallCenterVocabularyWord {
  id: string;
  term: string;
  translation: string;
  pronunciation: string;
  example: string;
  category: 'Customer Service' | 'Calls' | 'Problem Solving' | 'Sales';
  difficulty: 'easy' | 'medium' | 'hard';
}

export type CallCenterPhraseCategory =
  | 'Greeting'
  | 'Verification'
  | 'Clarification'
  | 'Hold'
  | 'Transfer'
  | 'Closing';

export interface CallCenterPhrase {
  id: string;
  category: CallCenterPhraseCategory;
  phrase: string;
  translation: string;
}

export interface InterviewProfile {
  targetPosition: InterviewPosition | null;
  hasExperience: boolean | null;
  englishLevel: CefrLevel | null;
  struggleArea: string | null;
  interviewDate: string | null; // ISO date
  onboarded: boolean;
}

export interface InterviewAnswer {
  questionId: string;
  answerText: string;
  source: 'practice' | 'answer-builder';
  updatedAt: string;
}

/** One step in the guided Answer Builder wizard. */
export interface AnswerBuilderField {
  id: string;
  label: string;
  type: 'text' | 'yesno';
  placeholder?: string;
}
