import { VocabularyActivityService } from './vocabulary-activity.service';
import { CefrLevel, VocabularyCategory, VocabularyWord } from '../models';

function makeWord(id: string, overrides: Partial<VocabularyWord> = {}): VocabularyWord {
  return {
    id,
    language: 'en',
    term: id,
    translation: `${id}-es`,
    pronunciation: '/x/',
    example: `A sentence with ${id} in it.`,
    category: VocabularyCategory.Work,
    level: CefrLevel.B1,
    masteryPercent: 0,
    isFavorite: false,
    ...overrides,
  };
}

describe('VocabularyActivityService', () => {
  const service = new VocabularyActivityService();
  const pool = Array.from({ length: 6 }, (_, i) =>
    makeWord(`word-${i}`, {
      definition: `Definition of word-${i}.`,
      synonyms: [`syn-${i}`],
      antonyms: [`ant-${i}`],
      collocations: [`make word-${i}`],
      register: i % 2 === 0 ? 'formal' : 'casual',
    }),
  );

  it('builds a multiple-choice question with exactly one correct option present in the options', () => {
    const word = pool[0];
    const q = service.build(word, 'translation', pool);
    expect(q).not.toBeNull();
    expect(q!.options[q!.correctIndex]).toBe(word.term);
    // exactly one occurrence of the correct answer among options
    expect(q!.options.filter((o) => o === word.term).length).toBe(1);
  });

  it('never produces duplicate options (no accidental two-correct-answer question, §38)', () => {
    for (const type of ['multiple-choice', 'translation', 'reverse-translation', 'definition', 'synonym', 'antonym', 'collocation', 'register'] as const) {
      const q = service.build(pool[1], type, pool);
      if (!q) continue;
      const unique = new Set(q.options);
      expect(unique.size).toBe(q.options.length);
    }
  });

  it('returns null instead of inventing a question when metadata is missing (e.g. no synonyms)', () => {
    const bare = makeWord('bare-word');
    expect(service.build(bare, 'synonym', pool)).toBeNull();
    expect(service.build(bare, 'antonym', pool)).toBeNull();
    expect(service.build(bare, 'collocation', pool)).toBeNull();
    expect(service.build(bare, 'definition', pool)).toBeNull();
  });

  it('fill-blank replaces the term in the example sentence with a blank', () => {
    const word = pool[0];
    const q = service.build(word, 'fill-blank', pool);
    expect(q).not.toBeNull();
    expect(q!.prompt).toContain('___');
    expect(q!.prompt.toLowerCase()).not.toContain(word.term.toLowerCase());
  });

  it('collocation challenge blanks only the last word of the phrase', () => {
    const word = pool[0];
    const q = service.build(word, 'collocation', pool);
    expect(q).not.toBeNull();
    expect(q!.prompt.endsWith('___')).toBe(true);
    expect(q!.options[q!.correctIndex]).toBe(`word-${0}`);
  });

  it('register challenge offers the other two registers as distractors, never the correct one twice', () => {
    const word = pool[0]; // formal
    const q = service.build(word, 'register', pool);
    expect(q).not.toBeNull();
    expect(q!.options).toContain('formal');
    expect(q!.options.filter((o) => o === 'formal').length).toBe(1);
  });
});
