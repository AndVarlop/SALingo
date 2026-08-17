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
  {
    id: 'wr-5',
    title: 'Write a complaint email to a company',
    description: 'Describe a problem with a product or service and what solution you expect. Use formal language.',
    minWords: 50,
  },
  {
    id: 'wr-6',
    title: 'Describe your hometown',
    description: 'What is it like? What can people do there? Use descriptive adjectives.',
    minWords: 40,
  },
  {
    id: 'wr-7',
    title: 'Write about a person you admire',
    description: 'Who are they and why do you admire them? Give specific examples.',
    minWords: 50,
  },
  {
    id: 'wr-8',
    title: 'Compare two ways of learning a language',
    description: 'Compare studying alone versus taking a class. Use comparative structures.',
    minWords: 60,
  },
  {
    id: 'wr-9',
    title: 'Write about your plans for next year',
    description: 'What do you plan to achieve? Use future forms (will, going to).',
    minWords: 50,
  },
  {
    id: 'wr-10',
    title: 'Describe a challenge you overcame',
    description: 'What happened, what did you do, and what did you learn? Use Past Simple and Past Perfect.',
    minWords: 60,
  },
  {
    id: 'wr-11',
    title: 'Write a formal request for time off work',
    description: 'Explain the dates, the reason, and how your work will be covered. Use formal, polite language.',
    minWords: 50,
  },
  {
    id: 'wr-12',
    title: 'Give your opinion on remote work',
    description: 'Do you think remote work is better than office work? Support your opinion with reasons.',
    minWords: 70,
  },
];
