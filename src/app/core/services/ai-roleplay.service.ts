import { Injectable } from '@angular/core';

export interface RoleplayCustomerMessage {
  text: string;
  isResolved: boolean;
}

/**
 * Plays the "customer" side of a customer-service roleplay. Mock canned
 * responses today; a real implementation would call an LLM (via backend)
 * conditioned on the scenario's persona and difficulty.
 */
@Injectable({ providedIn: 'root' })
export class AiRoleplayService {
  async getCustomerReply(scenarioOpening: string, turnIndex: number): Promise<RoleplayCustomerMessage> {
    await this.delay();
    if (turnIndex === 0) {
      return { text: scenarioOpening, isResolved: false };
    }
    return {
      text: "Okay, I understand. Thank you for explaining that — I appreciate your help.",
      isResolved: true,
    };
  }

  private delay(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 400));
  }
}
