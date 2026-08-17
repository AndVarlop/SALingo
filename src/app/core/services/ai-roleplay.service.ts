import { Injectable } from '@angular/core';
import { RoleplayDifficulty } from '../models';

export interface RoleplayCustomerMessage {
  text: string;
  isResolved: boolean;
}

/** Everything the picker needs to react to *this* scenario and *this* answer,
 * instead of producing the same reply regardless of either. */
export interface RoleplayTurnContext {
  openingLine: string;
  /** What a good agent response should actually address — drives whether the customer sounds satisfied. */
  expectedResolution: string;
  difficulty: RoleplayDifficulty;
  turnIndex: number;
  /** The agent's last message. Ignored on turn 0 (the opening line). */
  agentText: string;
}

const IMPATIENT_FOLLOW_UPS = [
  "Okay... but what does that actually mean for me?",
  "I still don't feel like that's answering my problem.",
  "Can you be more specific? I don't have all day.",
];

const NEUTRAL_FOLLOW_UPS = [
  "Okay... but what does that actually mean for me?",
  'I see. And how long will that take?',
  "Alright, I guess that works. What do I need to do now?",
];

/** Used once the agent's message shows real progress toward `expectedResolution`. */
const ENCOURAGED_FOLLOW_UPS = [
  'Oh, okay, that actually makes sense. What happens next?',
  "That sounds reasonable. Can you confirm that's really going to happen?",
  "Good, that's what I wanted to hear. Anything else I need to do?",
];

const CLOSINGS = [
  'Okay, thank you for explaining that — I appreciate your help.',
  "Alright, that sounds fair. Thanks for sorting it out.",
  'Good, I feel better about this now. Thanks for your patience.',
];

const PERSISTENT_CLOSINGS = [
  "Fine. I still think this should've been faster, but I'll accept that.",
  "Okay. I'm holding you to that, but thank you for finally sorting it out.",
];

const RESOLUTION_STOPWORDS = new Set([
  'the', 'and', 'that', 'with', 'this', 'their', 'them', 'they', 'have', 'will', 'from', 'your', 'their',
  'been', 'were', 'what', 'when', 'while', 'then', 'than', 'into', 'onto', 'about', 'before', 'after',
]);

/**
 * Plays the "customer" side of a customer-service roleplay. Mock canned
 * responses today — but unlike a fixed script, the response now depends on
 * the specific scenario's `expectedResolution` and on whether the agent's
 * last message actually addresses it, instead of the same 3 phrases for
 * every one of the 14 scenarios regardless of difficulty or content.
 * A real implementation would call an LLM (via backend) conditioned on the
 * scenario's persona/difficulty/problem and the full conversation so far —
 * `RoleplayTurnContext` is shaped to carry exactly what that call would need.
 */
@Injectable({ providedIn: 'root' })
export class AiRoleplayService {
  async getCustomerReply(context: RoleplayTurnContext): Promise<RoleplayCustomerMessage> {
    await this.delay();
    const { openingLine, expectedResolution, difficulty, turnIndex, agentText } = context;

    if (turnIndex === 0) {
      return { text: openingLine, isResolved: false };
    }

    const isPersistent = difficulty === 'Advanced' || difficulty === 'Expert';
    const addressesResolution = this.overlapsResolution(agentText, expectedResolution);

    if (addressesResolution && turnIndex >= 2) {
      const closings = isPersistent ? PERSISTENT_CLOSINGS : CLOSINGS;
      return { text: this.pick(closings, turnIndex), isResolved: true };
    }

    // Safety net: never loop forever even if the agent never mentions the resolution.
    if (turnIndex >= 4) {
      return { text: this.pick(CLOSINGS, turnIndex), isResolved: true };
    }

    const pool = addressesResolution
      ? ENCOURAGED_FOLLOW_UPS
      : isPersistent
        ? IMPATIENT_FOLLOW_UPS
        : NEUTRAL_FOLLOW_UPS;
    return { text: this.pick(pool, turnIndex), isResolved: false };
  }

  /** Word-overlap heuristic: does the agent's message actually touch on what would resolve this specific problem? */
  private overlapsResolution(agentText: string, expectedResolution: string): boolean {
    const resolutionWords = this.significantWords(expectedResolution);
    if (!resolutionWords.length) return false;
    const agentWords = new Set(this.significantWords(agentText));
    const matched = resolutionWords.filter((w) => agentWords.has(w)).length;
    return matched >= 2 || matched / resolutionWords.length >= 0.3;
  }

  private significantWords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[.,!?]/g, '')
      .split(/\s+/)
      .filter((w) => w.length >= 4 && !RESOLUTION_STOPWORDS.has(w));
  }

  private pick(pool: string[], turnIndex: number): string {
    return pool[(turnIndex - 1) % pool.length];
  }

  private delay(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 400));
  }
}
