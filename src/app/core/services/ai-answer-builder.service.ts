import { Injectable } from '@angular/core';

export interface AnswerBuilderInput {
  name: string;
  whatYouDo: string;
  hasExperience: boolean;
  strongestSkills: string;
  whyThisJob: string;
}

/**
 * Assembles a first-draft answer to "Tell me about yourself" from the
 * Answer Builder wizard's inputs. Pure templating today — the user is always
 * expected to edit the result, never memorize it word-for-word. Swap the
 * body for a real LLM call later; the input/output shape stays the same.
 */
@Injectable({ providedIn: 'root' })
export class AiAnswerBuilderService {
  buildTellMeAboutYourself(input: AnswerBuilderInput): string {
    const parts: string[] = [];

    parts.push(`Hi, my name is ${input.name || '[your name]'}.`);
    parts.push(input.whatYouDo ? `I'm ${input.whatYouDo}.` : "I'm currently looking for new opportunities.");

    if (input.hasExperience) {
      parts.push('I have previous experience that I think is relevant for this role.');
    } else {
      parts.push("I don't have previous call center experience, but I'm a fast learner and I'm ready to give my best.");
    }

    if (input.strongestSkills) {
      parts.push(`My strongest skills are ${input.strongestSkills}.`);
    }

    if (input.whyThisJob) {
      parts.push(`I'm interested in this position because ${input.whyThisJob}.`);
    }

    return parts.join(' ');
  }
}
