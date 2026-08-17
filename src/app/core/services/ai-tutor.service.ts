import { Injectable, inject } from '@angular/core';
import { AiChatMessage, AiTutorTopic } from '../models';
import { MistakeDetectionService } from './mistake-detection.service';
import { MistakeMemoryService } from './mistake-memory.service';

/**
 * Conversational AI tutor. Every topic except "correction" still returns a
 * canned response after an artificial "thinking" delay — swap `sendMessage`
 * for a real HTTP/streaming call to an LLM later; callers only depend on
 * this method's signature (Promise<AiChatMessage>), not its implementation.
 *
 * "correction" is the one topic that used to promise something it never
 * did ("Paste a sentence and I'll point out what could be improved" — then
 * always replied with generic praise, ignoring the text). It now actually
 * runs the same rule-based mistake detector My Mistakes/Writing/Roleplay
 * use, so it either points out a real match or is honest that it found
 * none — never a fabricated correction.
 */
@Injectable({ providedIn: 'root' })
export class AiTutorService {
  private readonly mistakeDetection = inject(MistakeDetectionService);
  private readonly mistakeMemory = inject(MistakeMemoryService);

  private readonly topicOpeners: Record<AiTutorTopic, string> = {
    grammar: "Sure! What grammar topic would you like to work on — tenses, articles, prepositions?",
    speaking: 'Great choice. Type a sentence and I\'ll pretend to listen to you say it out loud 🎤.',
    vocabulary: "Let's build your vocabulary. Give me a topic (food, travel, work...) and I'll suggest words.",
    conversation: "Let's chat! Tell me about your day.",
    correction: 'Paste a sentence and I\'ll check it against common mistakes and point out what could be improved.',
  };

  async sendMessage(history: AiChatMessage[], userText: string, topic?: AiTutorTopic): Promise<AiChatMessage> {
    await this.simulateThinking();

    if (topic === 'correction') {
      return this.buildCorrectionReply(userText);
    }

    return {
      id: `ai-${Date.now()}`,
      role: 'assistant',
      text: this.mockReply(userText),
      timestamp: new Date().toISOString(),
    };
  }

  async startTopic(topic: AiTutorTopic): Promise<AiChatMessage> {
    await this.simulateThinking();
    return {
      id: `ai-${Date.now()}`,
      role: 'assistant',
      text: this.topicOpeners[topic],
      timestamp: new Date().toISOString(),
    };
  }

  private async buildCorrectionReply(userText: string): Promise<AiChatMessage> {
    const mistakes = this.mistakeDetection.detect(userText);

    if (mistakes.length) {
      await this.mistakeMemory.recordAll(mistakes, 'AI Tutor');
      const lines = mistakes.map((m) => `❌ "${m.wrong}" → ✅ "${m.correct}"`);
      return {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        text: `I found ${mistakes.length === 1 ? 'a mistake' : `${mistakes.length} mistakes`}:\n${lines.join('\n')}\n\nTry another sentence whenever you're ready.`,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      id: `ai-${Date.now()}`,
      role: 'assistant',
      text: "I didn't catch any of the common mistakes I know how to check for — that doesn't mean it's perfect, just that nothing matched my (limited) rule set. Try another sentence!",
      timestamp: new Date().toISOString(),
    };
  }

  private mockReply(userText: string): string {
    if (!userText.trim()) return "I didn't quite catch that — could you say it again?";
    return `Got it: "${userText}". That's a great sentence! Here's a small tip: try varying your vocabulary to sound more natural.`;
  }

  private simulateThinking(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 400));
  }
}
