import { CefrLevel } from '../../models';

export interface WritingPrompt {
  id: string;
  title: string;
  description: string;
  minWords: number;
  /** Optional CEFR level tag. Untagged prompts are the original A2/B1-era set, shown under "All". */
  level?: CefrLevel;
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

  // --------------------------------------------------------------- B2 ---
  {
    id: 'wr-b2-1',
    title: 'Write a complaint email about a delayed order',
    description:
      'Your order arrived two weeks late and one item was missing. Write a clear, professional complaint email explaining what happened and what resolution you expect.',
    minWords: 100,
    level: CefrLevel.B2,
  },
  {
    id: 'wr-b2-2',
    title: 'Respond to a customer who wants a refund outside the policy window',
    description:
      'Write a professional email declining a refund request that is past the 30-day window, while offering an alternative (store credit or a discount on their next order).',
    minWords: 100,
    level: CefrLevel.B2,
  },
  {
    id: 'wr-b2-3',
    title: 'Write a short report on a workplace problem',
    description:
      'Write a short report (for your manager) describing a recurring problem at work, its likely cause, and a proposed solution.',
    minWords: 120,
    level: CefrLevel.B2,
  },
  {
    id: 'wr-b2-4',
    title: 'Give your opinion: should companies allow full remote work?',
    description:
      'Write a short opinion piece. State your position clearly and support it with at least two reasons and one counterpoint you address.',
    minWords: 120,
    level: CefrLevel.B2,
  },
  {
    id: 'wr-b2-5',
    title: 'Write a professional message rescheduling a meeting',
    description:
      'Write a polite, professional message to a client explaining why a meeting needs to be rescheduled and proposing two alternative times.',
    minWords: 80,
    level: CefrLevel.B2,
  },
  {
    id: 'wr-b2-6',
    title: 'Write a short essay on work-life balance',
    description:
      "Write a short essay giving your view on how companies can support work-life balance. Include an introduction, at least two supporting points, and a conclusion.",
    minWords: 150,
    level: CefrLevel.B2,
  },

  // --------------------------------------------------------------- C1 ---
  {
    id: 'wr-c1-1',
    title: 'Write a formal proposal to your manager',
    description:
      'Propose a specific change to your team\'s workflow (e.g. a new tool, a new process). Justify it with concrete reasoning and anticipate at least one objection.',
    minWords: 180,
    level: CefrLevel.C1,
  },
  {
    id: 'wr-c1-2',
    title: 'Write a persuasive email to a hesitant client',
    description:
      'A long-term client is considering switching to a competitor over price. Write a persuasive but respectful email that reframes the conversation around value, not just price.',
    minWords: 160,
    level: CefrLevel.C1,
  },
  {
    id: 'wr-c1-3',
    title: 'Write a critical response to a negative online review',
    description:
      'Write a public response to a critical but not abusive customer review. Acknowledge the issue genuinely, correct any factual inaccuracy diplomatically, and explain the fix — without sounding defensive.',
    minWords: 150,
    level: CefrLevel.C1,
  },
  {
    id: 'wr-c1-4',
    title: 'Write a business report analyzing a decline in metrics',
    description:
      'Write a report analyzing a hypothetical 15% drop in customer satisfaction over one quarter. Include likely causes, evidence, and recommendations — using appropriately formal, analytical language.',
    minWords: 200,
    level: CefrLevel.C1,
  },
  {
    id: 'wr-c1-5',
    title: 'Write an essay: should AI handle customer complaints?',
    description:
      'Write an argumentative essay taking a clear position on whether AI should handle first-line customer complaints. Address the strongest counterargument directly before your conclusion.',
    minWords: 200,
    level: CefrLevel.C1,
  },

  // --------------------------------------------------------------- C2 ---
  {
    id: 'wr-c2-1',
    title: 'Write a critical essay on corporate accountability language',
    description:
      "Write a critical essay analyzing how companies use phrases like 'we take full responsibility' without concrete follow-through. Use precise, nuanced language and a clear argumentative structure.",
    minWords: 220,
    level: CefrLevel.C2,
  },
  {
    id: 'wr-c2-2',
    title: 'Write an advanced proposal for a leadership team',
    description:
      'Write a proposal to a leadership team recommending a significant, potentially controversial change (e.g. restructuring a department). Anticipate multiple stakeholder objections and address each with precision and appropriate register.',
    minWords: 220,
    level: CefrLevel.C2,
  },
  {
    id: 'wr-c2-3',
    title: 'Write a persuasive document for a skeptical audience',
    description:
      'Write a persuasive document aimed at an audience predisposed to disagree with you (choose your own controversial-but-professional topic). Use precise register, concession, and rebuttal.',
    minWords: 220,
    level: CefrLevel.C2,
  },
  {
    id: 'wr-c2-4',
    title: 'Write an analytical review of a negotiation outcome',
    description:
      'Write an analytical piece reviewing a hypothetical negotiation that partially failed. Distinguish clearly between what was said, what was implied, and what should have been done differently, with precise, nuanced vocabulary.',
    minWords: 220,
    level: CefrLevel.C2,
  },
];
