import { nextIntervalDays, nextDifficulty } from './spaced-repetition.service';

describe('nextIntervalDays (simplified SM-2)', () => {
  it('resets to 1 day on "again"', () => {
    expect(nextIntervalDays(10, 'again')).toBe(1);
  });

  it('grows the interval more for "easy" than for "hard"', () => {
    const hard = nextIntervalDays(10, 'hard');
    const good = nextIntervalDays(10, 'good');
    const easy = nextIntervalDays(10, 'easy');
    expect(hard).toBeLessThan(good);
    expect(good).toBeLessThan(easy);
  });

  it('never returns an interval below 1 day', () => {
    expect(nextIntervalDays(1, 'hard')).toBeGreaterThanOrEqual(1);
  });

  it('converges: grading "easy" repeatedly grows the interval unboundedly', () => {
    let interval = 1;
    for (let i = 0; i < 5; i++) interval = nextIntervalDays(interval, 'easy');
    expect(interval).toBeGreaterThan(20);
  });
});

describe('nextDifficulty', () => {
  it('decreases (gets easier) on "easy", floored at 1', () => {
    expect(nextDifficulty(3, 'easy')).toBe(2);
    expect(nextDifficulty(1, 'easy')).toBe(1);
  });

  it('increases (gets harder) on "again" or "hard", capped at 5', () => {
    expect(nextDifficulty(3, 'again')).toBe(4);
    expect(nextDifficulty(3, 'hard')).toBe(4);
    expect(nextDifficulty(5, 'again')).toBe(5);
  });

  it('stays the same on "good"', () => {
    expect(nextDifficulty(3, 'good')).toBe(3);
  });
});
