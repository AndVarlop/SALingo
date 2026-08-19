import { Injectable, inject } from '@angular/core';
import { CefrLevel, WritingEvaluation } from '../models';
import { MistakeDetectionService } from './mistake-detection.service';
import { AiClientService, AiNotConfiguredError } from './ai-client.service';

const BASE_SYSTEM_PROMPT =
  'You are an English writing evaluator for ESL learners preparing for customer-service / call-center jobs. ' +
  "Given the writing prompt and the learner's text, rate vocabulary richness (0-100) and coherence/organization " +
  '(0-100), and give 2-3 short, specific, encouraging suggestions for improvement. ' +
  'Do not treat a more elegant or more formal alternative phrasing as an "error" if what the learner wrote is already ' +
  'grammatically correct and appropriate — frame those as optional alternatives ("for a more formal tone, you could say...") ' +
  'in a suggestion, never as something wrong. Only flag suggestions for things that are actually incorrect, unclear, or ' +
  "genuinely mismatched to the prompt's register. " +
  'Respond with ONLY valid JSON, no markdown fences, no extra text: ' +
  '{"vocabularyScore": number, "coherenceScore": number, "suggestions": string[]}';

/** Level-specific grading emphasis, appended to the base system prompt so
 * higher levels are actually held to a higher bar (register, argumentation,
 * nuance) instead of the exact same rubric as A1/A2 text. */
const LEVEL_EMPHASIS: Partial<Record<CefrLevel, string>> = {
  [CefrLevel.B2]: ' The learner is at B2 (upper-intermediate): also weigh clarity, organization, and appropriate tone for the text type (e.g. a formal complaint should sound formal).',
  [CefrLevel.C1]: ' The learner is at C1 (advanced): weigh coherence and cohesion between paragraphs, register consistency, and how well they build and support an argument, not just vocabulary breadth.',
  [CefrLevel.C2]: ' The learner is at C2 (proficiency): hold them to a near-native bar — weigh precision, nuance, register control, and the sophistication of their argumentation; generic but correct English should not score as highly as it would at a lower level.',
};

const SPEAKING_SYSTEM_PROMPT =
  'You are an English speaking evaluator for ESL learners preparing for customer-service / call-center jobs. ' +
  "You are given a speech-to-text transcript of the learner speaking freely in response to a prompt (not written text — ignore missing punctuation and capitalization, and don't penalize filler words like \"um\" lightly used). " +
  'Rate vocabulary richness (0-100) and coherence/organization of the spoken response (0-100), and give 2-3 short, specific, encouraging spoken-fluency suggestions. ' +
  'If the transcript is empty, extremely short, or clearly unrelated to the prompt, score accordingly (low) rather than inventing credit. ' +
  'Do not treat a more elegant or more formal alternative as an "error" if what the learner said is already correct and natural — save that for an optional-alternative suggestion, never a correction. ' +
  'Respond with ONLY valid JSON, no markdown fences, no extra text: ' +
  '{"vocabularyScore": number, "coherenceScore": number, "suggestions": string[]}';

/** Same escalating rigor as LEVEL_EMPHASIS, worded for spoken responses. */
const SPEAKING_LEVEL_EMPHASIS: Partial<Record<CefrLevel, string>> = {
  [CefrLevel.C1]: ' The learner is at C1 (advanced): weigh how well they structure a spontaneous spoken argument and address a counterpoint, not just vocabulary.',
  [CefrLevel.C2]: ' The learner is at C2 (proficiency): hold them to a near-native bar for nuance, register and persuasiveness in spontaneous speech.',
};

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

  async evaluateWriting(text: string, promptTitle: string, level?: CefrLevel): Promise<WritingEvaluation> {
    const grammarMistakes = this.mistakeDetection.detect(text);
    // Cap at 95, not 100: this only catches the ~20 known patterns, so a
    // clean result means "no *known* mistakes found", not "grammatically perfect".
    const grammarScore = Math.max(40, 95 - grammarMistakes.length * 15);

    const aiScores = await this.getAiScores(text, promptTitle, level);

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

  /**
   * C1/C2 open speaking: grades a real speech-to-text transcript
   * (SpeechRecognitionService) the same way evaluateWriting grades typed
   * text — deterministic grammar-mistake detection + AI-judged vocabulary
   * and coherence — just with a transcript-aware system prompt. Returns the
   * same WritingEvaluation shape so the UI can reuse the writing result view.
   */
  async evaluateSpeaking(transcript: string, promptTitle: string, level?: CefrLevel): Promise<WritingEvaluation> {
    const grammarMistakes = this.mistakeDetection.detect(transcript);
    const grammarScore = Math.max(40, 95 - grammarMistakes.length * 15);

    const system = SPEAKING_SYSTEM_PROMPT + (level ? SPEAKING_LEVEL_EMPHASIS[level] ?? '' : '');
    const aiScores = await this.getAiScores(transcript, promptTitle, undefined, system);

    const overallScore = Math.round((grammarScore + aiScores.vocabularyScore + aiScores.coherenceScore) / 3);
    const suggestions = [...aiScores.suggestions];
    if (suggestions.length === 0) suggestions.push('Nice work! Keep practicing longer, spontaneous responses.');

    return {
      grammarScore,
      vocabularyScore: aiScores.vocabularyScore,
      coherenceScore: aiScores.coherenceScore,
      overallScore,
      suggestions,
      grammarMistakes,
    };
  }

  private async getAiScores(
    text: string,
    promptTitle: string,
    level?: CefrLevel,
    systemOverride?: string,
  ): Promise<AiScoresPayload> {
    const system = systemOverride ?? BASE_SYSTEM_PROMPT + (level ? LEVEL_EMPHASIS[level] ?? '' : '');
    let raw: string;
    try {
      raw = await this.aiClient.complete({
        system,
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
