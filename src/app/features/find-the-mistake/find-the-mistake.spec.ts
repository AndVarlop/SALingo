import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FindTheMistakeComponent } from './find-the-mistake';
import { MistakeMemoryService } from '../../core/services/mistake-memory.service';
import { UserStateService } from '../../core/services/user-state.service';

interface FtmInternals {
  phase: () => 'idle' | 'playing' | 'result';
  currentRound: () => { isCorrect: boolean; mistake: unknown } | null;
  streak: () => number;
  bestStreak: () => number;
  score: () => number;
  xpEarned: () => number;
  rounds: () => unknown[];
  start: () => void;
  answer: (choice: 'correct' | 'has-mistake') => Promise<void>;
}

function setup() {
  const recordActivity = vi.fn();
  const recordAll = vi.fn().mockResolvedValue(undefined);
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: UserStateService, useValue: { recordActivity } },
      { provide: MistakeMemoryService, useValue: { recordAll } },
      // MistakeDetectionService is left real — it's the pure rule bank
      // this game exists to surface, not something to fake.
    ],
  });
  const fixture = TestBed.createComponent(FindTheMistakeComponent);
  const component = fixture.componentInstance as unknown as FtmInternals;
  return { component, recordActivity, recordAll };
}

describe('FindTheMistakeComponent', () => {
  it('builds rounds from MISTAKE_EXAMPLE_SENTENCES, mixing wrong and corrected variants', () => {
    const { component } = setup();
    component.start();
    expect(component.phase()).toBe('playing');
    expect(component.rounds().length).toBeGreaterThan(0);
    expect(component.rounds().length).toBeLessThanOrEqual(10); // MAX_ROUNDS

    const rounds = component.rounds() as { isCorrect: boolean }[];
    expect(rounds.some((r) => r.isCorrect)).toBe(true);
    expect(rounds.some((r) => !r.isCorrect)).toBe(true);
  });

  it('answering correctly (matching the shown round) increases score and streak', async () => {
    const { component } = setup();
    component.start();

    // Answer whatever round is actually shown, with the right choice for it.
    const round = component.currentRound()!;
    const rightChoice = round.isCorrect ? 'correct' : 'has-mistake';

    await component.answer(rightChoice);

    expect(component.score()).toBe(1);
    expect(component.streak()).toBe(1);
  });

  it('answering wrong resets the streak', async () => {
    const { component } = setup();
    component.start();
    const round = component.currentRound()!;
    const wrongChoice = round.isCorrect ? 'has-mistake' : 'correct';

    await component.answer(wrongChoice);

    expect(component.score()).toBe(0);
    expect(component.streak()).toBe(0);
  });

  it('finish() records one activity and, if any mistakes were missed, feeds Mistake Memory', async () => {
    vi.useFakeTimers();
    const { component, recordActivity, recordAll } = setup();
    component.start();

    for (let i = 0; i < 10; i++) {
      if (component.phase() !== 'playing') break;
      const round = component.currentRound();
      if (!round) break;
      // Deliberately answer wrong every time to guarantee at least one
      // missed real mistake feeds Mistake Memory.
      const wrongChoice = round.isCorrect ? 'has-mistake' : 'correct';
      await component.answer(wrongChoice);
      vi.advanceTimersByTime(1400);
      await Promise.resolve(); // flush the microtask finish() may be awaiting on
    }

    expect(component.phase()).toBe('result');
    expect(recordActivity).toHaveBeenCalledTimes(1);
    const call = recordActivity.mock.calls[0][0];
    expect(call.type).toBe('grammar');
    expect(call.skillTag).toMatch(/:find-the-mistake$/);
    expect(recordAll).toHaveBeenCalled(); // at least one wrong-sentence round was missed
    vi.useRealTimers();
  });
});
