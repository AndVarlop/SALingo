import { Injectable, inject } from '@angular/core';
import { RoleplayDifficulty } from '../models';
import { AiClientService, AiChatRequestMessage, AiNotConfiguredError } from './ai-client.service';

export interface RoleplayCustomerMessage {
  text: string;
  isResolved: boolean;
}

export interface RoleplayScenarioContext {
  customerPersona: string;
  problem: string;
  context: string;
  difficulty: RoleplayDifficulty;
  expectedResolution: string;
  openingLine: string;
}

export interface RoleplayHistoryTurn {
  role: 'customer' | 'agent';
  text: string;
}

/** Thrown when the AI can't produce a customer reply — callers must show an
 * honest "the customer couldn't respond" state, never a fabricated line. */
export class RoleplayAiError extends Error {}

const MAX_TURNS_BEFORE_FORCED_RESOLUTION = 6;

function buildSystemPrompt(scenario: RoleplayScenarioContext): string {
  const toneNote =
    scenario.difficulty === 'Advanced' || scenario.difficulty === 'Expert'
      ? 'You are impatient and skeptical — do not soften easily. Only sound satisfied once the agent has genuinely addressed your problem.'
      : 'You are reasonably patient, but still a real customer with a real problem, not a pushover.';

  return (
    'You are role-playing as a customer calling a customer-service / call-center agent, for English-practice ' +
    "purposes. Stay fully in character as the customer — never break character, never mention you're an AI. " +
    `Your persona: ${scenario.customerPersona}. Your problem: ${scenario.problem}. Context: ${scenario.context}. ` +
    `${toneNote} You will consider the issue resolved only once the agent's response genuinely addresses: ` +
    `${scenario.expectedResolution}. Keep replies short and natural (1-3 sentences), like a real phone call. ` +
    'Respond with ONLY valid JSON, no markdown fences, no extra text: {"text": string, "resolved": boolean}.'
  );
}

/**
 * Plays the "customer" side of a customer-service roleplay via Claude,
 * conditioned on the scenario's real persona/problem/context/difficulty and
 * the full conversation so far — not a fixed script. The opening line stays
 * scripted per scenario (curated, deterministic) rather than AI-generated,
 * so every playthrough of a given scenario starts the same way.
 */
@Injectable({ providedIn: 'root' })
export class AiRoleplayService {
  private readonly aiClient = inject(AiClientService);

  async getCustomerReply(
    scenario: RoleplayScenarioContext,
    history: RoleplayHistoryTurn[],
  ): Promise<RoleplayCustomerMessage> {
    if (history.length === 0) {
      return { text: scenario.openingLine, isResolved: false };
    }

    const messages: AiChatRequestMessage[] = history.map((turn) => ({
      role: turn.role === 'agent' ? 'user' : 'assistant',
      content: turn.text,
    }));

    let raw: string;
    try {
      raw = await this.aiClient.complete({
        system: buildSystemPrompt(scenario),
        messages,
        maxTokens: 200,
      });
    } catch (err) {
      if (err instanceof AiNotConfiguredError) {
        throw new RoleplayAiError("The AI customer isn't set up yet — this roleplay isn't available.");
      }
      console.error('[AiRoleplay] AI request failed', err);
      throw new RoleplayAiError("Couldn't reach the AI customer. Please try again.");
    }

    const parsed = this.parseReply(raw);
    if (!parsed) {
      console.error('[AiRoleplay] Unparseable AI response', raw);
      throw new RoleplayAiError('Got an unexpected response from the AI customer. Please try again.');
    }

    // Safety net: never let a call drag on forever even if the AI keeps finding new objections.
    const agentTurns = history.filter((t) => t.role === 'agent').length;
    const forceResolved = agentTurns >= MAX_TURNS_BEFORE_FORCED_RESOLUTION;

    return { text: parsed.text, isResolved: parsed.resolved || forceResolved };
  }

  private parseReply(raw: string): { text: string; resolved: boolean } | null {
    try {
      const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
      const data = JSON.parse(cleaned) as Partial<{ text: string; resolved: boolean }>;
      if (typeof data.text !== 'string' || !data.text.trim() || typeof data.resolved !== 'boolean') return null;
      return { text: data.text, resolved: data.resolved };
    } catch {
      return null;
    }
  }
}
