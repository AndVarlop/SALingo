/**
 * Turns a namespaced skill tag ("grammar:gr-a1-past-simple",
 * "vocab:Business") into a readable label ("Past Simple", "Business").
 * Grammar topic ids embed an internal CEFR-level prefix ("gr-a1-") that
 * gets stripped so it doesn't leak into the display label.
 */
export function humanizeSkillTag(tag: string): string {
  const [, slug] = tag.split(':');
  const clean = (slug ?? tag).replace(/^gr-[a-c]\d-/, '');
  const words = clean.split('-').filter(Boolean);
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
