import { xpForNextLevel } from './xp.constant';

describe('xpForNextLevel', () => {
  it('returns 500 for 0 XP (first level threshold)', () => {
    expect(xpForNextLevel(0)).toBe(500);
  });

  it('returns 500 for XP just under the first threshold', () => {
    expect(xpForNextLevel(499)).toBe(500);
  });

  it('returns the next 500-multiple once a threshold is crossed', () => {
    expect(xpForNextLevel(500)).toBe(1000);
    expect(xpForNextLevel(999)).toBe(1000);
    expect(xpForNextLevel(1000)).toBe(1500);
  });

  it('scales linearly for large XP totals', () => {
    expect(xpForNextLevel(4750)).toBe(5000);
  });
});
