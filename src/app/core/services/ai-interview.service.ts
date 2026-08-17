import { Injectable } from '@angular/core';

export interface MockInterviewQuestionPrompt {
  question: string;
  isFollowUp: boolean;
}

/**
 * Drives a simulated interview conversation — asks questions one at a time
 * and reacts to the candidate's answers. Mock today (returns from a fixed
 * script); the real implementation is expected to live behind a backend
 * that calls an LLM, never a direct client-side API call.
 */
@Injectable({ providedIn: 'root' })
export class AiInterviewService {
  async getNextQuestion(askedCount: number, position: string): Promise<MockInterviewQuestionPrompt> {
    await this.delay();
    if (askedCount === 0) {
      return { question: 'Thanks for being here today. Could you please introduce yourself?', isFollowUp: false };
    }
    return {
      question: `Tell me more about how you'd handle a typical day in a ${position} role.`,
      isFollowUp: false,
    };
  }

  private delay(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 400));
  }
}
