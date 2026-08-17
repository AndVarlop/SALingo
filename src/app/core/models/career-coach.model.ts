/**
 * Models for the AI Career & Interview Coach layer (Fase 3). This layer
 * doesn't replace existing progress/gamification models — it derives new,
 * job-readiness-focused signals on top of them.
 */

export interface JobReadyBreakdown {
  english: number | null; // CEFR-derived, 0-100
  speaking: number | null;
  interview: number | null;
  customerService: number | null;
  vocabulary: number | null;
  grammar: number | null;
  confidence: number | null;
}

export interface JobReadyScore {
  /** null when there isn't enough activity yet — never fabricate a number. */
  overall: number | null;
  breakdown: JobReadyBreakdown;
  hasEnoughData: boolean;
  missingDataHint: string | null;
}

export interface Weakness {
  id: string;
  label: string;
  percent: number;
  iconEmoji: string;
  routerLink: string[];
  actionLabel: string;
}

export type MistakeCategory = 'grammar' | 'vocabulary' | 'interview' | 'speaking' | 'customer-service';

export interface MistakeRecord {
  id: string;
  wrong: string;
  correct: string;
  category: MistakeCategory;
  source: string; // e.g. "Mock Interview", "Past Simple lesson"
  firstSeenAt: string; // ISO datetime
  lastSeenAt: string; // ISO datetime
  occurrences: number;
}

/**
 * Full evaluation shape an answer (interview, roleplay, call) can be scored
 * against. Fields default to 0/empty under the current rule-based scorer;
 * a real AI evaluator can populate every field without changing callers.
 */
export interface InterviewEvaluation {
  grammar: number;
  vocabulary: number;
  fluency: number;
  pronunciation: number;
  relevance: number;
  structure: number;
  confidence: number;
  professionalism: number;
  customerService: number;
  overallScore: number;
  strengths: string[];
  improvements: string[];
  recommendedPractice: string[];
}

export type RecommendedActivityType =
  | 'speaking'
  | 'grammar'
  | 'vocabulary'
  | 'listening'
  | 'writing'
  | 'roleplay'
  | 'interview'
  | 'review';

export interface RecommendedActivity {
  id: string;
  type: RecommendedActivityType;
  title: string;
  reason: string;
  iconEmoji: string;
  estimatedMinutes: number;
  actionLabel: string;
  routerLink: string[];
}

export type CareerPathStageId =
  | 'english'
  | 'call-center-english'
  | 'customer-service'
  | 'interview-prep'
  | 'roleplay'
  | 'mock-interview'
  | 'job-ready';

export interface CareerPathStage {
  id: CareerPathStageId;
  label: string;
  iconEmoji: string;
  percent: number; // 0-100
  completed: boolean;
  requirement: string;
  routerLink: string[];
}

export interface CandidateProfile {
  position: string | null;
  hasExperience: boolean | null;
  englishLevel: string | null;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  interviewType: 'general' | 'behavioral' | 'call-center' | 'company-specific';
  goal: string | null;
}
