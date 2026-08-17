import { Injectable, inject } from '@angular/core';
import { WritingEvaluation } from '../models';
import { MistakeDetectionService } from './mistake-detection.service';

/**
 * Evaluates free-form writing. Today this runs simple heuristics (length,
 * sentence variety, repeated words, and — for grammar specifically — the
 * same rule-based mistake detector used by My Mistakes); replace
 * `evaluateWriting`'s body with a call to an LLM grading endpoint later —
 * the return shape stays the same.
 *
 * `grammarScore` used to be `100 - words.length / 40`, i.e. it measured
 * length, not grammar (a perfect 200-word essay scored *worse* than a
 * broken 10-word one). Fixed to actually scan for grammar mistakes instead.
 */
@Injectable({ providedIn: 'root' })
export class AiEvaluationService {
  private readonly mistakeDetection = inject(MistakeDetectionService);

  async evaluateWriting(text: string): Promise<WritingEvaluation> {
    await this.simulateThinking();

    const words = text.trim().split(/\s+/).filter(Boolean);
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const uniqueWords = new Set(words.map((w) => w.toLowerCase()));

    const lengthScore = Math.min(100, Math.round((words.length / 60) * 100));
    const vocabularyScore = words.length
      ? Math.round((uniqueWords.size / words.length) * 100)
      : 0;
    const coherenceScore = Math.min(100, sentences.length * 15);

    const grammarMistakes = this.mistakeDetection.detect(text);
    // Cap at 95, not 100: this only catches the ~20 known patterns, so a
    // clean result means "no *known* mistakes found", not "grammatically perfect".
    const grammarScore = Math.max(40, 95 - grammarMistakes.length * 15);

    const overallScore = Math.round(
      (lengthScore + vocabularyScore + coherenceScore + grammarScore) / 4,
    );

    const suggestions: string[] = [];
    if (words.length < 40) suggestions.push('Try writing a bit more to fully develop your ideas.');
    if (vocabularyScore < 60) suggestions.push('Vary your word choice — avoid repeating the same words.');
    if (sentences.length < 3) suggestions.push('Break your text into more than one sentence.');
    for (const mistake of grammarMistakes.slice(0, 3)) {
      suggestions.push(`Grammar: "${mistake.wrong}" → "${mistake.correct}"`);
    }
    if (suggestions.length === 0) suggestions.push('Nice work! Keep practicing with longer texts.');

    return { grammarScore, vocabularyScore, coherenceScore, overallScore, suggestions, grammarMistakes };
  }

  private simulateThinking(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 500));
  }
}
