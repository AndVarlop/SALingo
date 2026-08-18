import { Injectable, inject } from '@angular/core';
import { AiClientService, AiNotConfiguredError } from './ai-client.service';

export interface InterviewAnswerEvaluation {
  confidence: number;
  relevance: number;
  structure: number;
  professionalism: number;
  clarity: number;
  overallScore: number;
  strengths: string[];
  improvements: string[];
  recommendedPractice: string[];
}

export interface InterviewQaPair {
  question: string;
  answer: string;
}

/** Thrown when the AI evaluator fails or is unavailable — callers must show
 * an honest "couldn't evaluate" state, never fabricated scores. */
export class InterviewEvaluationError extends Error {}

const SYSTEM_PROMPT =
  'You are an interview coach evaluating a candidate answering customer-service / call-center job interview ' +
  "questions in English (the candidate is likely a non-native speaker). Given the question(s) and the candidate's " +
  'answer(s), score confidence, relevance, structure, professionalism, and clarity — each 0-100 — as a genuine ' +
  "assessment of quality. Length alone should never determine a score: a concise, complete, well-structured " +
  'answer should score as well as a longer one, and a long rambling answer should not score higher just for ' +
  'being long. Give 2-3 real, specific strengths, 2-3 real, specific improvements, and 1-2 short recommended ' +
  'practice activities. Respond with ONLY valid JSON, no markdown fences, no extra text: {"confidence": number, ' +
  '"relevance": number, "structure": number, "professionalism": number, "clarity": number, "strengths": ' +
  'string[], "improvements": string[], "recommendedPractice": string[]}';

/**
 * Scores interview answers via Claude. `evaluateInterview` takes every
 * question/answer pair from ONE session in a single AI call — evaluating
 * holistically the way a real interviewer would, and critically avoiding
 * firing N parallel API calls (one per question) on every interview
 * completion, which would be both slow and needlessly expensive.
 * `evaluateAnswer` is a thin single-pair wrapper for Roleplay, which only
 * ever evaluates one call's worth of agent responses at a time.
 */
@Injectable({ providedIn: 'root' })
export class AiInterviewEvaluationService {
  private readonly aiClient = inject(AiClientService);

  async evaluateAnswer(questionText: string, answerText: string): Promise<InterviewAnswerEvaluation> {
    return this.evaluateInterview([{ question: questionText, answer: answerText }]);
  }

  async evaluateInterview(qaPairs: InterviewQaPair[]): Promise<InterviewAnswerEvaluation> {
    const transcript = qaPairs
      .map((pair, i) => `Q${i + 1}: ${pair.question}\nA${i + 1}: ${pair.answer || '(no answer given)'}`)
      .join('\n\n');

    let raw: string;
    try {
      raw = await this.aiClient.complete({
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: transcript }],
        maxTokens: 600,
      });
    } catch (err) {
      if (err instanceof AiNotConfiguredError) {
        throw new InterviewEvaluationError("AI evaluation isn't set up yet.");
      }
      console.error('[AiInterviewEvaluation] AI request failed', err);
      throw new InterviewEvaluationError('Could not reach the AI evaluator. Please try again.');
    }

    const parsed = this.parse(raw);
    if (!parsed) {
      console.error('[AiInterviewEvaluation] Unparseable AI response', raw);
      throw new InterviewEvaluationError('The AI evaluator returned an unexpected response. Please try again.');
    }
    return parsed;
  }

  private parse(raw: string): InterviewAnswerEvaluation | null {
    try {
      const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
      const data = JSON.parse(cleaned) as Partial<Record<keyof InterviewAnswerEvaluation, unknown>>;
      const dims: (keyof Pick<InterviewAnswerEvaluation, 'confidence' | 'relevance' | 'structure' | 'professionalism' | 'clarity'>)[] =
        ['confidence', 'relevance', 'structure', 'professionalism', 'clarity'];
      if (dims.some((d) => typeof data[d] !== 'number')) return null;
      if (!Array.isArray(data.strengths) || !Array.isArray(data.improvements) || !Array.isArray(data.recommendedPractice)) {
        return null;
      }

      const scores = Object.fromEntries(dims.map((d) => [d, this.clamp(data[d] as number)])) as Record<
        (typeof dims)[number],
        number
      >;
      const overallScore = Math.round(dims.reduce((sum, d) => sum + scores[d], 0) / dims.length);

      return {
        ...scores,
        overallScore,
        strengths: (data.strengths as unknown[]).filter((s): s is string => typeof s === 'string').slice(0, 3),
        improvements: (data.improvements as unknown[]).filter((s): s is string => typeof s === 'string').slice(0, 3),
        recommendedPractice: (data.recommendedPractice as unknown[])
          .filter((s): s is string => typeof s === 'string')
          .slice(0, 2),
      };
    } catch {
      return null;
    }
  }

  private clamp(value: number): number {
    return Math.max(0, Math.min(100, Math.round(value)));
  }
}
