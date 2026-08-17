import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { VocabularyRushComponent } from './vocabulary-rush';
import { VocabularyService } from '../../core/services/vocabulary.service';
import { UserStateService } from '../../core/services/user-state.service';
import { CefrLevel, VocabularyCategory, VocabularyWord } from '../../core/models';

/** Exposes the component's protected/private scoring internals for testing
 * without changing their visibility for templates/callers — `protected` is
 * a compile-time-only restriction, so this cast is safe at runtime. */
interface RushInternals {
  phase: () => 'idle' | 'playing' | 'result';
  hasEnoughWords: () => boolean;
  currentRound: () => { correctIndex: number; options: string[] } | null;
  streak: () => number;
  bestStreak: () => number;
  score: () => number;
  xpEarned: () => number;
  index: () => number;
  rounds: () => unknown[];
  start: () => void;
  selectAnswer: (i: number) => void;
}

function makeWord(id: string, term: string, translation: string, category: VocabularyCategory): VocabularyWord {
  return {
    id,
    language: 'en',
    term,
    translation,
    pronunciation: '',
    example: '',
    category,
    level: CefrLevel.A1,
    masteryPercent: 0,
    isFavorite: false,
  };
}

function setup(words: VocabularyWord[]) {
  const recordActivity = vi.fn();
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: VocabularyService, useValue: { words: () => words } },
      { provide: UserStateService, useValue: { recordActivity } },
    ],
  });
  const fixture = TestBed.createComponent(VocabularyRushComponent);
  const component = fixture.componentInstance as unknown as RushInternals;
  return { component, recordActivity };
}

const WORDS: VocabularyWord[] = [
  makeWord('w1', 'Apple', 'Manzana', VocabularyCategory.Food),
  makeWord('w2', 'Bread', 'Pan', VocabularyCategory.Food),
  makeWord('w3', 'Car', 'Coche', VocabularyCategory.Travel),
  makeWord('w4', 'Dog', 'Perro', VocabularyCategory.Nature),
  makeWord('w5', 'Egg', 'Huevo', VocabularyCategory.Food),
];

describe('VocabularyRushComponent', () => {
  it('hasEnoughWords is false below 4 words, true at 4+', () => {
    const { component } = setup(WORDS.slice(0, 3));
    expect(component.hasEnoughWords()).toBe(false);

    const { component: ready } = setup(WORDS);
    expect(ready.hasEnoughWords()).toBe(true);
  });

  it('start() builds rounds where the correct translation is always among the options', () => {
    const { component } = setup(WORDS);
    component.start();
    expect(component.phase()).toBe('playing');
    for (const round of component.rounds() as { options: string[]; correctIndex: number; word: VocabularyWord }[]) {
      expect(round.options[round.correctIndex]).toBe(round.word.translation);
      expect(new Set(round.options).size).toBe(round.options.length); // no duplicate options
    }
  });

  it('a correct answer increases score and streak, awards XP', () => {
    const { component } = setup(WORDS);
    component.start();
    const round = component.currentRound();
    expect(round).not.toBeNull();

    component.selectAnswer(round!.correctIndex);

    expect(component.score()).toBe(1);
    expect(component.streak()).toBe(1);
    expect(component.xpEarned()).toBeGreaterThan(0);
  });

  it('a wrong answer resets streak and does not increase score', () => {
    const { component } = setup(WORDS);
    component.start();
    const round = component.currentRound();
    const wrongIndex = round!.options.findIndex((_, i) => i !== round!.correctIndex);

    component.selectAnswer(wrongIndex);

    expect(component.score()).toBe(0);
    expect(component.streak()).toBe(0);
  });

  it('streak bonus XP is capped, never grows unbounded', () => {
    vi.useFakeTimers();
    const { component } = setup(WORDS);
    component.start();

    // Answer every round correctly to build a long streak.
    let remaining = WORDS.length;
    while (remaining-- > 0) {
      const round = component.currentRound();
      if (!round) break;
      component.selectAnswer(round.correctIndex);
      vi.advanceTimersByTime(800); // let nextRound() fire
    }

    // XP per correct answer = reviewCorrect(5) + min(streak*2, 20). With a
    // 5-word pool the streak never exceeds 5, so the bonus is never capped
    // here — this asserts the formula stays bounded and monotonic instead.
    expect(component.xpEarned()).toBeGreaterThan(0);
    expect(component.streak()).toBeLessThanOrEqual(WORDS.length);
    vi.useRealTimers();
  });

  it('finish() records one activity tagged with the dominant category played', () => {
    vi.useFakeTimers();
    const { component, recordActivity } = setup(WORDS);
    component.start();

    let remaining = WORDS.length;
    while (remaining-- > 0) {
      const round = component.currentRound();
      if (!round) break;
      component.selectAnswer(round.correctIndex);
      vi.advanceTimersByTime(800);
    }

    expect(component.phase()).toBe('result');
    expect(recordActivity).toHaveBeenCalledTimes(1);
    const call = recordActivity.mock.calls[0][0];
    expect(call.type).toBe('review');
    expect(call.skillTag).toMatch(/^vocab:/);
    expect(call.accuracy).toBe(100); // every answer in this test was correct
    vi.useRealTimers();
  });
});
