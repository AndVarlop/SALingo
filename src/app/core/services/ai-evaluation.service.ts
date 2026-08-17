import { Injectable } from '@angular/core';
import { WritingEvaluation } from '../models';

/**
 * Evaluates free-form writing. Today this runs simple heuristics (length,
 * sentence variety, repeated words); replace `evaluateWriting`'s body with a
 * call to an LLM grading endpoint later — the return shape stays the same.
 */
@Injectable({ providedIn: 'root' })
export class AiEvaluationService {
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
    const grammarScore = Math.max(40, 100 - Math.round(words.length / 40));

    const overallScore = Math.round(
      (lengthScore + vocabularyScore + coherenceScore + grammarScore) / 4,
    );

    const suggestions: string[] = [];
    if (words.length < 40) suggestions.push('Try writing a bit more to fully develop your ideas.');
    if (vocabularyScore < 60) suggestions.push('Vary your word choice — avoid repeating the same words.');
    if (sentences.length < 3) suggestions.push('Break your text into more than one sentence.');
    if (suggestions.length === 0) suggestions.push('Nice work! Keep practicing with longer texts.');

    return { grammarScore, vocabularyScore, coherenceScore, overallScore, suggestions };
  }

  private simulateThinking(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 500));
  }
}
