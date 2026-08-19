/**
 * Fisher-Yates shuffle. Pure, non-mutating.
 */
export function shuffleArray<T>(arr: readonly T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Shuffles a multiple-choice option list and returns the new position of
 * the correct answer — spec §25/§26: authored exercises store a fixed
 * `correctOptionIndex`, so replaying the same exercise (Grammar Battle,
 * lesson retakes, exam retakes) always showed the correct answer in the
 * same visual position. Shuffles by index permutation (not by string
 * value) so it stays correct even when two options share the same text.
 */
export function shuffleOptions(
  options: readonly string[],
  correctOptionIndex: number,
): { options: string[]; correctOptionIndex: number } {
  const order = shuffleArray(options.map((_, i) => i));
  return {
    options: order.map((i) => options[i]),
    correctOptionIndex: order.indexOf(correctOptionIndex),
  };
}
