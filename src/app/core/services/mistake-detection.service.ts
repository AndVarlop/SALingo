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
