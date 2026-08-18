import { Injectable, inject } from '@angular/core';
import { AiChatMessage, AiTutorTopic } from '../models';
import { MistakeDetectionService } from './mistake-detection.service';
import { MistakeMemoryService } from './mistake-memory.service';
import { AiClientService, AiNotConfiguredError } from './ai-client.service';

const MAX_REPLY_TOKENS = 400;

const SYSTEM_PROMPTS: Record<Exclude<AiTutorTopic, 'correction'>, string> = {
  grammar:
    'You are an encouraging, concise English grammar tutor for Spanish-speaking call-center job seekers preparing for English-language job interviews. Explain grammar points simply, give one clear example, and end with a short follow-up question. Keep replies under 80 words.',
  speaking:
    "You are a friendly speaking-practice partner. The user is typing what they would say out loud. Respond naturally as a real conversation partner would, then gently note one pronunciation or fluency tip if you notice something worth mentioning. Keep replies under 60 words, casual tone.",
  vocabulary:
    'You are a vocabulary coach for call-center / customer-service English. When the user gives a topic, suggest 3-5 relevant words each with a short example sentence. Keep replies concise and practical for someone preparing for a customer-service job.',
  conversation:
    'You are a warm conversation partner helping the user practice everyday English. Respond naturally to what they say, ask a genuine follow-up question, and gently note one thing they could improve only if something stands out. Keep replies under 60 words.',
};

/**
 * Conversational AI tutor. "correction" stays rule-based (MistakeDetectionService)
 * — it's already honest and free; there's no reason to spend a real API call
 * on pattern matching a fixed rule set. Every other topic calls Claude
 * through AiClientService -> the ai-proxy Edge Function. If the AI backend
 * isn't configured yet or the request fails, this returns an honest
 * "AI isn't available" message — never a fabricated reply pretending to be
 * a real answer.
 */
@Injectable({ providedIn: 'root' })
export class AiTutorService {
  private readonly mistakeDetection = inject(MistakeDetectionService);
  private readonly mistakeMemory = inject(MistakeMemoryService);
  private readonly aiClient = inject(AiClientService);

  private readonly topicOpeners: Record<AiTutorTopic, string> = {
    grammar: "Sure! What grammar topic would you like to work on — tenses, articles, prepositions?",
    speaking: 'Great choice. Type a sentence and I\'ll pretend to listen to you say it out loud 🎤.',
    vocabulary: "Let's build your vocabulary. Give me a topic (food, travel, work...) and I'll suggest words.",
    conversation: "Let's chat! Tell me about your day.",
    correction: 'Paste a sentence and I\'ll check it against common mistakes and point out what could be improved.',
  };

  async sendMessage(history: AiChatMessage[], userText: string, topic?: AiTutorTopic): Promise<AiChatMessage> {
    if (topic === 'correction') {
      return this.buildCorrectionReply(userText);
    }

    return this.askClaude(history, userText, topic);
  }

  async startTopic(topic: AiTutorTopic): Promise<AiChatMessage> {
    // Static intro copy, not a claimed AI response to user input — no cost, no dishonesty in staying local.
    return this.reply(this.topicOpeners[topic]);
  }

  private async askClaude(
    history: AiChatMessage[],
    userText: string,
    topic: AiTutorTopic | undefined,
  ): Promise<AiChatMessage> {
    const system = SYSTEM_PROMPTS[topic as Exclude<AiTutorTopic, 'correction'>] ?? SYSTEM_PROMPTS.conversation;
    const messages = [
      ...history
        .filter((m) => m.text.trim())
        .map((m) => ({ role: m.role, content: m.text })),
      { role: 'user' as const, content: userText },
    ];

    try {
      const text = await this.aiClient.complete({ system, messages, maxTokens: MAX_REPLY_TOKENS });
      return this.reply(text);
    } catch (err) {
      if (err instanceof AiNotConfiguredError) {
        return this.reply(
          "AI Tutor isn't connected to a live AI yet — that's being set up. In the meantime, try \"Correct my English\", which works today using rule-based detection.",
        );
      }
      console.error('[AiTutor] AI request failed', err);
      return this.reply("I couldn't reach the AI just now. Please try again in a moment.");
    }
  }

  private async buildCorrectionReply(userText: string): Promise<AiChatMessage> {
    const mistakes = this.mistakeDetection.detect(userText);

    if (mistakes.length) {
      await this.mistakeMemory.recordAll(mistakes, 'AI Tutor');
      const lines = mistakes.map((m) => `❌ "${m.wrong}" → ✅ "${m.correct}"`);
      return this.reply(
        `I found ${mistakes.length === 1 ? 'a mistake' : `${mistakes.length} mistakes`}:\n${lines.join('\n')}\n\nTry another sentence whenever you're ready.`,
      );
    }

    return this.reply(
      "I didn't catch any of the common mistakes I know how to check for — that doesn't mean it's perfect, just that nothing matched my (limited) rule set. Try another sentence!",
    );
  }

  private reply(text: string): AiChatMessage {
    return {
      id: `ai-${Date.now()}`,
      role: 'assistant',
      text,
      timestamp: new Date().toISOString(),
    };
  }
}
