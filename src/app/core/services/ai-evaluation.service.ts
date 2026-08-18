import { Injectable, inject } from '@angular/core';
import { WritingEvaluation } from '../models';
import { MistakeDetectionService } from './mistake-detection.service';
import { AiClientService, AiNotConfiguredError } from './ai-client.service';

const SYSTEM_PROMPT =
  'You are an English writing evaluator for ESL learners preparing for customer-service / call-center jobs. ' +
  "Given the writing prompt and the learner's text, rate vocabulary richness (0-100) and coherence/organization " +
  '(0-100), and give 2-3 short, specific, encouraging suggestions for improvement. ' +
  'Respond with ONLY valid JSON, no markdown fences, no extra text: ' +
  '{"vocabularyScore": number, "coherenceScore": number, "suggestions": string[]}';

interface AiScoresPayload {
  vocabularyScore: number;
  coherenceScore: number;
  suggestions: string[];
}

/** Thrown when the AI evaluation fails or is unavailable — callers must
 * show an honest "couldn't evaluate" state, never fabricated scores. */
export class WritingEvaluationError extends Error {}

/**
 * Evaluates free-form writing. `grammarScore`/`grammarMistakes` stay
 * rule-based (MistakeDetectionService, same detector My Mistakes/AI Tutor
 * use) — deterministic and free, and it's what actually feeds Mistake
 * Memory, so it needs to stay grounded in real detected mistakes rather
 * than something an LLM might invent. Vocabulary and coherence — judgments
 * a fixed rule set genuinely can't make well — go to Claude.
 */
@Injectable({ providedIn: 'root' })
export class AiEvaluationService {
  private readonly mistakeDetection = inject(MistakeDetectionService);
  private readonly aiClient = inject(AiClientService);

  async evaluateWriting(text: string, promptTitle: string): Promise<WritingEvaluation> {
    const grammarMistakes = this.mistakeDetection.detect(text);
    // Cap at 95, not 100: this only catches the ~20 known patterns, so a
    // clean result means "no *known* mistakes found", not "grammatically perfect".
    const grammarScore = Math.max(40, 95 - grammarMistakes.length * 15);

    const aiScores = await this.getAiScores(text, promptTitle);

    const overallScore = Math.round((grammarScore + aiScores.vocabularyScore + aiScores.coherenceScore) / 3);

    const suggestions = [...aiScores.suggestions];
    for (const mistake of grammarMistakes.slice(0, 3)) {
      suggestions.push(`Grammar: "${mistake.wrong}" → "${mistake.correct}"`);
    }
    if (suggestions.length === 0) suggestions.push('Nice work! Keep practicing with longer texts.');

    return {
      grammarScore,
      vocabularyScore: aiScores.vocabularyScore,
      coherenceScore: aiScores.coherenceScore,
      overallScore,
      suggestions,
      grammarMistakes,
    };
  }

  private async getAiScores(text: string, promptTitle: string): Promise<AiScoresPayload> {
    let raw: string;
    try {
      raw = await this.aiClient.complete({
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: `Prompt: "${promptTitle}"\n\nLearner's text:\n${text}` }],
        maxTokens: 400,
      });
    } catch (err) {
      if (err instanceof AiNotConfiguredError) {
        throw new WritingEvaluationError("AI evaluation isn't set up yet.");
      }
      console.error('[AiEvaluation] AI request failed', err);
      throw new WritingEvaluationError('Could not reach the AI evaluator. Please try again.');
    }

    const parsed = this.parseAiScores(raw);
    if (!parsed) {
      console.error('[AiEvaluation] Unparseable AI response', raw);
      throw new WritingEvaluationError('The AI evaluator returned an unexpected response. Please try again.');
    }
    return parsed;
  }

  private parseAiScores(raw: string): AiScoresPayload | null {
    try {
      // Defensive: strip markdown code fences if the model adds them despite instructions.
      const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
      const data = JSON.parse(cleaned) as Partial<AiScoresPayload>;
      if (
        typeof data.vocabularyScore !== 'number' ||
        typeof data.coherenceScore !== 'number' ||
        !Array.isArray(data.suggestions)
      ) {
        return null;
      }
      return {
        vocabularyScore: this.clamp(data.vocabularyScore),
        coherenceScore: this.clamp(data.coherenceScore),
        suggestions: data.suggestions.filter((s): s is string => typeof s === 'string').slice(0, 3),
      };
    } catch {
      return null;
    }
  }

  private clamp(value: number): number {
    return Math.max(0, Math.min(100, Math.round(value)));
  }
}
