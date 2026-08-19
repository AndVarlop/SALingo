import { Injectable } from '@angular/core';
import { VocabularyWord } from '../models';
import { VocabularyActivityType, VocabularyQuestion } from '../models/vocabulary-activity.model';

/**
 * Turns one word + activity type into a concrete question (§12). `pool` is
 * the rest of the loaded vocabulary, used to build real (not invented)
 * distractors — same idea as VocabularyRushComponent already did for
 * translations, generalized across activity types.
 */
@Injectable({ providedIn: 'root' })
export class VocabularyActivityService {
  build(word: VocabularyWord, type: VocabularyActivityType, pool: VocabularyWord[]): VocabularyQuestion | null {
    const rest = pool.filter((w) => w.id !== word.id);
    switch (type) {
      case 'translation':
        return this.choiceQuestion(word, type, `Which word means "${word.translation}"?`, word.term, this.distractorTerms(word, rest));
      case 'reverse-translation':
        return this.choiceQuestion(word, type, `What does "${word.term}" mean?`, word.translation, this.distractorTranslations(word, rest));
      case 'multiple-choice': {
        const correct = word.definition ?? word.translation;
        const distractors = word.definition
          ? this.distractorDefinitions(word, rest)
          : this.distractorTranslations(word, rest);
        return this.choiceQuestion(word, type, `Choose the correct meaning of "${word.term}".`, correct, distractors);
      }
      case 'definition':
      case 'matching': {
        if (!word.definition) return null;
        const prompt = type === 'definition' ? `Which word matches this definition?\n"${word.definition}"` : `Match the definition to the word:\n"${word.definition}"`;
        return this.choiceQuestion(word, type, prompt, word.term, this.distractorTerms(word, rest));
      }
      case 'synonym': {
        const correct = word.synonyms?.[0];
        if (!correct) return null;
        const distractors = this.distractorSynonymish(word, rest, correct);
        return this.choiceQuestion(word, type, `Choose the closest synonym for "${word.term}".`, correct, distractors, `Synonyms share meaning but not always intensity or register — see word.register.`);
      }
      case 'antonym': {
        const correct = word.antonyms?.[0];
        if (!correct) return null;
        const distractors = this.distractorSynonymish(word, rest, correct);
        return this.choiceQuestion(word, type, `Choose the opposite of "${word.term}".`, correct, distractors);
      }
      case 'collocation': {
        const phrase = word.collocations?.[0];
        if (!phrase) return null;
        const parts = phrase.split(' ');
        const correct = parts.at(-1)!;
        const stem = parts.slice(0, -1).join(' ');
        const otherCollocationWords = rest.flatMap((w) => w.collocations ?? []).map((c) => c.split(' ').at(-1)!);
        const distractors = this.uniqueSample(otherCollocationWords.filter((w) => w !== correct), 3);
        return this.choiceQuestion(word, type, `${stem} ___`, correct, distractors);
      }
      case 'phrasal-verb': {
        if (!word.definition) return null;
        return this.choiceQuestion(word, type, `What does "${word.term}" mean?`, word.definition, this.distractorDefinitions(word, rest));
      }
      case 'register': {
        if (!word.register) return null;
        const registers = ['casual', 'neutral', 'formal'];
        return this.choiceQuestion(word, type, `Which register does "${word.term}" belong to in this context?\n"${this.exampleFor(word)}"`, word.register, registers.filter((r) => r !== word.register));
      }
      case 'context-choice':
      case 'fill-blank': {
        const sentence = this.exampleFor(word);
        if (!sentence) return null;
        const blanked = this.blank(sentence, word.term);
        if (!blanked) return null;
        const prompt = type === 'fill-blank' ? blanked : `Choose the word that best fits:\n${blanked}`;
        return this.choiceQuestion(word, type, prompt, word.term, this.distractorTerms(word, rest));
      }
    }
  }

  private choiceQuestion(
    word: VocabularyWord,
    type: VocabularyActivityType,
    prompt: string,
    correct: string,
    distractors: string[],
    explanation?: string,
  ): VocabularyQuestion | null {
    const options = this.shuffle([correct, ...distractors.slice(0, 3)]);
    if (options.length < 2) return null; // not enough real distractors — skip rather than invent fake ones (§38)
    return {
      id: `${word.id}:${type}:${Date.now()}:${Math.floor(Math.random() * 1e6)}`,
      type,
      wordId: word.id,
      prompt,
      options,
      correctIndex: options.indexOf(correct),
      explanation,
    };
  }

  private exampleFor(word: VocabularyWord): string {
    return word.examples?.length ? word.examples[Math.floor(Math.random() * word.examples.length)] : word.example;
  }

  private blank(sentence: string, term: string): string | null {
    const idx = sentence.toLowerCase().indexOf(term.toLowerCase());
    if (idx === -1) return null;
    return sentence.slice(0, idx) + '___' + sentence.slice(idx + term.length);
  }

  private distractorTerms(word: VocabularyWord, rest: VocabularyWord[]): string[] {
    return this.uniqueSample(
      rest.filter((w) => w.level === word.level).map((w) => w.term),
      3,
      rest.map((w) => w.term),
    );
  }

  private distractorTranslations(word: VocabularyWord, rest: VocabularyWord[]): string[] {
    return this.uniqueSample(
      rest.filter((w) => w.level === word.level).map((w) => w.translation),
      3,
      rest.map((w) => w.translation),
    );
  }

  private distractorDefinitions(word: VocabularyWord, rest: VocabularyWord[]): string[] {
    const withDefs = rest.filter((w) => w.definition);
    return this.uniqueSample(
      withDefs.filter((w) => w.level === word.level).map((w) => w.definition!),
      3,
      withDefs.map((w) => w.definition!),
    );
  }

  /** Pulls plausible near-miss options from other words' synonym/antonym lists (never invented). */
  private distractorSynonymish(word: VocabularyWord, rest: VocabularyWord[], correct: string): string[] {
    const pool = rest.flatMap((w) => [...(w.synonyms ?? []), ...(w.antonyms ?? [])]).filter((s) => s !== correct);
    return this.uniqueSample(pool, 3);
  }

  private uniqueSample(primary: string[], n: number, fallback: string[] = []): string[] {
    const unique = [...new Set(primary)];
    if (unique.length < n) {
      const extra = [...new Set(fallback)].filter((v) => !unique.includes(v));
      unique.push(...this.shuffle(extra).slice(0, n - unique.length));
    }
    return this.shuffle(unique).slice(0, n);
  }

  private shuffle<T>(list: T[]): T[] {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
}
