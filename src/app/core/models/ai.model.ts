/** Contracts for the future AI integration. Implementations are mock today. */

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string; // ISO datetime
  quickReplies?: string[];
}

export type AiTutorTopic = 'grammar' | 'speaking' | 'vocabulary' | 'conversation' | 'correction';

export interface WritingEvaluation {
  grammarScore: number; // 0-100
  vocabularyScore: number; // 0-100
  coherenceScore: number; // 0-100
  overallScore: number; // 0-100
  suggestions: string[];
}

export interface SpeakingEvaluation {
  transcript: string;
  matchScore: number; // 0-100
  feedback: string;
}

export interface StudyRecommendation {
  id: string;
  title: string;
  description: string;
  iconEmoji: string;
  actionLabel: string;
  routerLink: string[];
}
