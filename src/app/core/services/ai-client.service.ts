import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface AiChatRequestMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiCompleteRequest {
  system: string;
  messages: AiChatRequestMessage[];
  maxTokens?: number;
}

/** Thrown when the AI backend is reachable but not yet configured (no
 * ANTHROPIC_API_KEY secret set) — callers should show an honest "AI isn't
 * set up yet" message, never silently fall back to a fabricated reply. */
export class AiNotConfiguredError extends Error {}

/** Thrown when the per-user AI rate limit (supabase/ai-rate-limit.sql) is
 * hit. Message is already end-user-appropriate, so callers that don't
 * special-case it still show something sensible via their generic catch. */
export class AiRateLimitedError extends Error {}

/**
 * The ONLY place in Angular that talks to the AI backend. Every AI feature
 * (AI Tutor today; Roleplay/Mock Interview/Writing evaluation/Resume
 * analysis later) goes through `complete()`, which calls the `ai-proxy`
 * Supabase Edge Function — never the AI provider directly, and the API key
 * never exists in this codebase at all (see supabase/functions/ai-proxy).
 */
@Injectable({ providedIn: 'root' })
export class AiClientService {
  private readonly supabase = inject(SupabaseService).client;

  async complete(request: AiCompleteRequest): Promise<string> {
    const { data, error } = await this.supabase.functions.invoke<{ text?: string; error?: string }>(
      'ai-proxy',
      { body: request },
    );

    if (error) {
      // supabase-js surfaces non-2xx responses as a generic FunctionsHttpError;
      // the actual { error: '...' } body is on error.context, when available.
      const status = (error as { context?: { status?: number } }).context?.status;
      if (status === 503) throw new AiNotConfiguredError('AI backend is not configured yet.');
      if (status === 429) {
        throw new AiRateLimitedError("You've reached the AI practice limit for this hour — try again a bit later.");
      }
      throw new Error(`AI request failed: ${error.message}`);
    }

    if (!data?.text) {
      throw new Error(data?.error ?? 'AI request returned no text.');
    }

    return data.text;
  }
}
