import { Injectable } from '@angular/core';
import { AiChatMessage, AiTutorTopic } from '../models';

/**
 * Conversational AI tutor. Returns canned responses today; swap `sendMessage`
 * for a real HTTP/streaming call to an LLM later — callers only depend on
 * this method's signature (Promise<AiChatMessage>), not its implementation.
 */
@Injectable({ providedIn: 'root' })
export class AiTutorService {
  private readonly topicOpeners: Record<AiTutorTopic, string> = {
    grammar: "Sure! What grammar topic would you like to work on — tenses, articles, prepositions?",
    speaking: 'Great choice. Type a sentence and I\'ll pretend to listen to you say it out loud 🎤.',
    vocabulary: "Let's build your vocabulary. Give me a topic (food, travel, work...) and I'll suggest words.",
    conversation: "Let's chat! Tell me about your day.",
    correction: 'Paste a sentence and I\'ll point out what could be improved.',
  };

  async sendMessage(history: AiChatMessage[], userText: string): Promise<AiChatMessage> {
    await this.simulateThinking();
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

  private mockReply(userText: string): string {
    if (!userText.trim()) return "I didn't quite catch that — could you say it again?";
    return `Got it: "${userText}". That's a great sentence! Here's a small tip: try varying your vocabulary to sound more natural.`;
  }

  private simulateThinking(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 400));
  }
}
