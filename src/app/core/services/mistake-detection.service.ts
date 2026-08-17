import { Injectable } from '@angular/core';
import { MistakeCategory } from '../models';

export interface DetectedMistake {
  wrong: string;
  correct: string;
  category: MistakeCategory;
}

interface MistakeRule {
  pattern: RegExp;
  correct: (match: RegExpMatchArray) => string;
  category: MistakeCategory;
}

/** Common ESL mistakes made by Spanish speakers, focused on call-center /
 * interview English. Rule-based pattern matching today — the output shape
 * (`DetectedMistake`) is exactly what a real grammar-checking model would
 * return, so swapping `detect()`'s body later needs no caller changes. */
const RULES: MistakeRule[] = [
  {
    pattern: /\bi have (\d+) years? working\b/i,
    correct: (m) => `I have ${m[1]} years of experience working`,
    category: 'grammar',
  },
  {
    pattern: /\bi am agree\b/i,
    correct: () => 'I agree',
    category: 'grammar',
  },
  {
    pattern: /\bi am agreed\b/i,
    correct: () => 'I agree',
    category: 'grammar',
  },
  {
    pattern: /\bpeoples\b/i,
    correct: () => 'people',
    category: 'vocabulary',
  },
  {
    pattern: /\bi have (\d+) years old\b/i,
    correct: (m) => `I am ${m[1]} years old`,
    category: 'grammar',
  },
  {
    pattern: /\bsince (\d+) years?\b/i,
    correct: (m) => `for ${m[1]} years`,
    category: 'grammar',
  },
  {
    pattern: /\bi am agreed with you\b/i,
    correct: () => 'I agree with you',
    category: 'grammar',
  },
  {
    pattern: /\bmake a mistake in\b/i,
    correct: () => 'make a mistake with',
    category: 'vocabulary',
  },
  {
    pattern: /\bi did an? (?:mistake|error)\b/i,
    correct: () => 'I made a mistake',
    category: 'grammar',
  },
  {
    pattern: /\bit depends of\b/i,
    correct: () => 'it depends on',
    category: 'grammar',
  },
  {
    pattern: /\bi am boring\b/i,
    correct: () => 'I am bored',
    category: 'vocabulary',
  },
  {
    pattern: /\bexplain me\b/i,
    correct: () => 'explain to me',
    category: 'grammar',
  },
  {
    pattern: /\bi am agree that\b/i,
    correct: () => 'I agree that',
    category: 'grammar',
  },
  {
    pattern: /\bactually,? actually\b/i,
    correct: () => 'actually',
    category: 'speaking',
  },
  {
    pattern: /\bi will to\b/i,
    correct: () => 'I will',
    category: 'grammar',
  },
  {
    pattern: /\bcan to\b/i,
    correct: () => 'can',
    category: 'grammar',
  },
  {
    pattern: /\bi am here since\b/i,
    correct: () => 'I have been here since',
    category: 'grammar',
  },
  {
    pattern: /\bin the moment\b/i,
    correct: () => 'at the moment',
    category: 'customer-service',
  },
  {
    pattern: /\bi will call you back in a moment\b/i,
    correct: () => "I'll get back to you shortly",
    category: 'customer-service',
  },
  {
    pattern: /\bfor me it's\b/i,
    correct: () => 'In my opinion, it is',
    category: 'speaking',
  },
];

/**
 * One full sentence per rule above, each written to trigger that rule when
 * run through `detect()`. This is the content bank for the "Find the
 * Mistake" mini-game — zero new mistake logic, just real sentences that
 * surface the rules that already exist.
 */
export const MISTAKE_EXAMPLE_SENTENCES: string[] = [
  'I have 5 years working in customer service.',
  'I am agree with the new schedule.',
  'I am agreed to help you today.',
  'There are many peoples waiting in the queue.',
  'I have 28 years old and I love this job.',
  'I have worked here since 3 years.',
  'I am agreed with you about the refund.',
  "Please don't make a mistake in the invoice.",
  'I did a mistake when I processed the order.',
  'It depends of the situation.',
  'I am boring during this meeting.',
  'Can you explain me the policy again?',
  'I am agree that the price is too high.',
  'Actually, actually, I think we should escalate this.',
  'I will to call you back later.',
  'I can to help you with that.',
  'I am here since 9 AM.',
  'I am busy in the moment, please wait.',
  'I will call you back in a moment.',
  "For me it's very difficult to understand.",
];

@Injectable({ providedIn: 'root' })
export class MistakeDetectionService {
  detect(text: string): DetectedMistake[] {
    if (!text.trim()) return [];

    const found: DetectedMistake[] = [];
    for (const rule of RULES) {
      const match = text.match(rule.pattern);
      if (match) {
        found.push({ wrong: match[0], correct: rule.correct(match), category: rule.category });
      }
    }
    return found;
  }
}
