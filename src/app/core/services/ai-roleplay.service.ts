import { Injectable } from '@angular/core';

export interface RoleplayCustomerMessage {
  text: string;
  isResolved: boolean;
}

const FOLLOW_UPS = [
  "Okay... but what does that actually mean for me?",
  "I see. And how long will that take?",
  "Alright, I guess that works. What do I need to do now?",
];

const CLOSINGS = [
  'Okay, thank you for explaining that — I appreciate your help.',
  "Alright, that sounds fair. Thanks for sorting it out.",
  'Good, I feel better about this now. Thanks for your patience.',
];

/**
 * Plays the "customer" side of a customer-service roleplay. Mock canned
 * responses today, escalating toward resolution over a few turns; a real
 * implementation would call an LLM (via backend) conditioned on the
 * scenario's persona and difficulty.
 */
@Injectable({ providedIn: 'root' })
export class AiRoleplayService {
  async getCustomerReply(scenarioOpening: string, turnIndex: number): Promise<RoleplayCustomerMessage> {
    await this.delay();

    if (turnIndex === 0) {
      return { text: scenarioOpening, isResolved: false };
    }
    if (turnIndex < 3) {
      return { text: FOLLOW_UPS[(turnIndex - 1) % FOLLOW_UPS.length], isResolved: false };
    }
    return { text: CLOSINGS[turnIndex % CLOSINGS.length], isResolved: true };
  }

  private delay(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 400));
  }
}
