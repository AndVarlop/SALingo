/** The learnable skill dimensions tracked across the whole platform. */
export enum Skill {
  Vocabulary = 'vocabulary',
  Grammar = 'grammar',
  Listening = 'listening',
  Speaking = 'speaking',
  Reading = 'reading',
  Writing = 'writing',
}

export const SKILL_LABEL: Record<Skill, string> = {
  [Skill.Vocabulary]: 'Vocabulary',
  [Skill.Grammar]: 'Grammar',
  [Skill.Listening]: 'Listening',
  [Skill.Speaking]: 'Speaking',
  [Skill.Reading]: 'Reading',
  [Skill.Writing]: 'Writing',
};

export const SKILL_ICON: Record<Skill, string> = {
  [Skill.Vocabulary]: '📖',
  [Skill.Grammar]: '✏️',
  [Skill.Listening]: '🎧',
  [Skill.Speaking]: '🎤',
  [Skill.Reading]: '📗',
  [Skill.Writing]: '📝',
};
