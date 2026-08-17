import { Injectable } from '@angular/core';

/**
 * Assembles a first-draft answer from short notes the user writes for each
 * step of a question's structure (e.g. "Situation" / "Task" / "Action" /
 * "Result", or whatever `InterviewQuestion.structure` defines for that
 * specific question). Works for any of the 23 questions in the bank, not
 * just "Tell me about yourself" — every question already carries its own
 * `structure` array, this just stitches the user's notes together in that
 * order. Pure templating today — the user is always expected to edit the
 * result, never memorize it word-for-word. Swap the body for a real LLM
 * call later; the input/output shape stays the same.
 */
@Injectable({ providedIn: 'root' })
export class AiAnswerBuilderService {
  buildAnswer(stepTexts: string[]): string {
    const sentences = stepTexts
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => this.ensureSentence(s));

    return sentences.join(' ');
  }

  private ensureSentence(text: string): string {
    const capitalized = text.charAt(0).toUpperCase() + text.slice(1);
    return /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`;
  }
}
