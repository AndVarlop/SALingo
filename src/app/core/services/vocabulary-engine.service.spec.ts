import { selectSession, selectActivityType, supportsActivityType, ALL_ACTIVITY_TYPES } from './vocabulary-engine.service';
import { CefrLevel, VocabularyCategory, VocabularyWord } from '../models';

function makeWord(id: string, overrides: Partial<VocabularyWord> = {}): VocabularyWord {
  return {
    id,
    language: 'en',
    term: id,
    translation: `${id}-es`,
    pronunciation: '/x/',
    example: `An example with ${id}.`,
    category: VocabularyCategory.Work,
    level: CefrLevel.B1,
    masteryPercent: 0,
    isFavorite: false,
    ...overrides,
  };
}

describe('selectSession', () => {
  it('splits a session roughly 60/25/15 new/review/weak when all buckets are large enough', () => {
    const pool = [
      ...Array.from({ length: 20 }, (_, i) => makeWord(`new-${i}`)),
      ...Array.from({ length: 20 }, (_, i) => makeWord(`review-${i}`)),
      ...Array.from({ length: 20 }, (_, i) => makeWord(`weak-${i}`)),
    ];
    const status: Record<string, 'new' | 'learning' | 'practicing' | 'familiar' | 'mastered'> = {};
    const due = new Set<string>();
    for (const w of pool) {
      if (w.id.startsWith('review')) {
        status[w.id] = 'mastered';
        due.add(w.id);
      } else if (w.id.startsWith('weak')) {
        status[w.id] = 'learning';
      }
    }

    const session = selectSession(pool, status, due, new Set(), 20);
    const buckets = { new: 0, review: 0, weak: 0 };
    for (const s of session) buckets[s.bucket]++;

    expect(session.length).toBe(20);
    expect(buckets.new).toBe(12); // 60%
    expect(buckets.review).toBe(5); // 25%
    expect(buckets.weak).toBe(3); // 15%
  });

  it('never returns more items than requested', () => {
    const pool = Array.from({ length: 5 }, (_, i) => makeWord(`w-${i}`));
    const session = selectSession(pool, {}, new Set(), new Set(), 20);
    expect(session.length).toBeLessThanOrEqual(5);
  });

  it('excludes recently-shown words when enough fresh ones remain (§8)', () => {
    const pool = Array.from({ length: 10 }, (_, i) => makeWord(`w-${i}`));
    const recent = new Set(['w-0', 'w-1', 'w-2']);
    const session = selectSession(pool, {}, new Set(), recent, 5);
    const ids = session.map((s) => s.word.id);
    expect(ids).not.toContain('w-0');
    expect(ids).not.toContain('w-1');
    expect(ids).not.toContain('w-2');
  });

  it('falls back to recently-shown words rather than returning fewer than requested (§8: not blocked forever)', () => {
    const pool = Array.from({ length: 3 }, (_, i) => makeWord(`w-${i}`));
    const recent = new Set(['w-0', 'w-1', 'w-2']);
    const session = selectSession(pool, {}, new Set(), recent, 3);
    expect(session.length).toBe(3);
  });

  it('only selects words already present in the given pool (level filtering happens by the caller)', () => {
    const pool = [makeWord('a1-word', { level: CefrLevel.A1 })];
    const session = selectSession(pool, {}, new Set(), new Set(), 5);
    expect(session.every((s) => s.word.level === CefrLevel.A1)).toBe(true);
  });
});

describe('supportsActivityType', () => {
  it('requires a definition for definition/matching', () => {
    const withDef = makeWord('w', { definition: 'A thing.' });
    const withoutDef = makeWord('w2');
    expect(supportsActivityType(withDef, 'definition')).toBe(true);
    expect(supportsActivityType(withoutDef, 'definition')).toBe(false);
  });

  it('requires synonyms/antonyms/collocations for their respective challenges', () => {
    const word = makeWord('w', { synonyms: ['big'], antonyms: ['small'], collocations: ['make a decision'] });
    expect(supportsActivityType(word, 'synonym')).toBe(true);
    expect(supportsActivityType(word, 'antonym')).toBe(true);
    expect(supportsActivityType(word, 'collocation')).toBe(true);
    const bare = makeWord('w2');
    expect(supportsActivityType(bare, 'synonym')).toBe(false);
    expect(supportsActivityType(bare, 'antonym')).toBe(false);
    expect(supportsActivityType(bare, 'collocation')).toBe(false);
  });

  it('multiple-choice, translation, and reverse-translation always work (every word has term+translation)', () => {
    const bare = makeWord('w');
    expect(supportsActivityType(bare, 'multiple-choice')).toBe(true);
    expect(supportsActivityType(bare, 'translation')).toBe(true);
    expect(supportsActivityType(bare, 'reverse-translation')).toBe(true);
  });
});

describe('selectActivityType', () => {
  it('only ever returns a type the word supports', () => {
    const word = makeWord('w'); // no definition/synonyms/etc.
    for (let i = 0; i < 30; i++) {
      const type = selectActivityType(word, []);
      expect(supportsActivityType(word, type)).toBe(true);
    }
  });

  it('avoids recently-used types when the word supports more than one', () => {
    const word = makeWord('w', {
      definition: 'def',
      synonyms: ['s'],
      antonyms: ['a'],
      collocations: ['c x'],
      register: 'neutral',
    });
    const recent = ALL_ACTIVITY_TYPES.filter((t) => t !== 'translation');
    const type = selectActivityType(word, recent);
    expect(type).toBe('translation');
  });

  it('falls back to a recently-used type rather than failing when nothing else is eligible', () => {
    const word = makeWord('w', { example: '' }); // supports only multiple-choice/translation/reverse-translation
    const type = selectActivityType(word, ['multiple-choice', 'translation', 'reverse-translation']);
    expect(['multiple-choice', 'translation', 'reverse-translation']).toContain(type);
  });
});
