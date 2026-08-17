export interface WritingPrompt {
  id: string;
  title: string;
  description: string;
  minWords: number;
}

export const MOCK_WRITING_PROMPTS: WritingPrompt[] = [
  {
    id: 'wr-1',
    title: 'Describe your daily routine',
    description: 'What do you usually do from morning to night? Use Present Simple.',
    minWords: 40,
  },
  {
    id: 'wr-2',
    title: 'Write about your last vacation',
    description: 'Where did you go? What did you do? Use Past Simple.',
    minWords: 40,
  },
  {
    id: 'wr-3',
    title: 'Describe your dream job',
    description: "What would you like to do and why? Use 'would like to' or 'want to'.",
    minWords: 40,
  },
  {
    id: 'wr-4',
    title: 'Write a short email to a friend',
    description: 'Tell them about something interesting that happened recently.',
    minWords: 40,
  },
];
