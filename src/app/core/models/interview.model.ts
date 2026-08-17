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

export type RoleplayDifficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

/** Call type — doubles as the Call Center Simulator's scenario categories. */
export type CallCategory =
  | 'Billing'
  | 'Technical Support'
  | 'Cancellation'
  | 'Refund'
  | 'Sales'
  | 'Delivery'
  | 'Account'
  | 'Angry Customer'
  | 'Escalation'
  | 'Retention';

export interface RoleplayScenario {
  id: string;
  difficulty: RoleplayDifficulty;
  category: CallCategory;
  title: string;
  context: string;
  objective: string;
  customerPersona: string;
  problem: string;
  availableInfo: string[];
  expectedResolution: string;
  openingLine: string;
}

/** The call-flow checklist a well-handled call is expected to follow. Not
 * every scenario needs every step (e.g. a simple info request skips
 * "escalation"), so scoring only counts steps that were actually attempted
 * or clearly missing from context, never penalizing an irrelevant step. */
export type CallFlowStepId =
  | 'greeting'
  | 'identification'
  | 'verification'
  | 'understanding'
  | 'empathy'
  | 'investigation'
  | 'solution'
  | 'confirmation'
  | 'closing';

export interface CallFlowScore {
  step: CallFlowStepId;
  label: string;
  percent: number;
  detected: boolean;
}

export interface CallPerformance {
  steps: CallFlowScore[];
  overall: number;
}

/** One saved run of a Mock Interview. */
export interface InterviewSession {
  id: string;
  position: InterviewPosition | null;
  startedAt: string;
  durationSeconds: number;
  questionCount: number;
  overallScore: number;
  strengths: string[];
  improvements: string[];
  mode: 'guided' | 'real';
}
