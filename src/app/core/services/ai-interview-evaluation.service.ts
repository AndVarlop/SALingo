import { Injectable } from '@angular/core';

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

/**
 * Scores a candidate's spoken/written interview answer across the
 * dimensions the product spec calls for (confidence, relevance, structure,
 * professionalism, clarity). Mock heuristic today, same contract an LLM
 * grading endpoint would fill later.
 */
@Injectable({ providedIn: 'root' })
export class AiInterviewEvaluationService {
  async evaluateAnswer(answerText: string): Promise<InterviewAnswerEvaluation> {
    await this.delay();

    const words = answerText.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const hasFillerWords = /\b(um+|uh+|like)\b/i.test(answerText);

    const structure = Math.min(100, Math.round((wordCount / 40) * 100));
    const relevance = wordCount > 15 ? 80 : 50;
    const professionalism = hasFillerWords ? 65 : 90;
    const clarity = wordCount > 10 ? 80 : 55;
    const confidence = Math.round((structure + professionalism) / 2);

    const overallScore = Math.round((confidence + relevance + structure + professionalism + clarity) / 5);

    const strengths: string[] = [];
    const improvements: string[] = [];
    if (wordCount >= 30) strengths.push('Good level of detail');
    if (!hasFillerWords) strengths.push('Clear, confident delivery');
    if (wordCount < 20) improvements.push('Try to give a more complete answer with an example');
    if (hasFillerWords) improvements.push('Avoid filler words like "um" and "like"');
    if (strengths.length === 0) strengths.push('You completed the answer — keep practicing to build confidence');

    return {
      confidence,
      relevance,
      structure,
      professionalism,
      clarity,
      overallScore,
      strengths,
      improvements,
      recommendedPractice: improvements.length ? ['Practice Speaking', 'Review the recommended structure'] : ['Try a harder question next'],
    };
  }

  private delay(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 500));
  }
}
