import { CefrLevel } from '../../models';

/**
 * C1/C2 speaking: unlike the guided B2 exercises (a fixed expectedSentence to
 * match), these are open-ended — the learner speaks freely in response to a
 * prompt, using SpeechRecognitionService for a real transcript, and
 * AiEvaluationService.evaluateSpeaking for real AI feedback on fluency,
 * coherence and argumentation. Hints shrink from C1 to C2, per the brief's
 * "progressively fewer hints" requirement — C2 gives no hint at all.
 */
export interface OpenSpeakingPrompt {
  id: string;
  level: CefrLevel;
  title: string;
  instructions: string;
  hint?: string;
  minWords: number;
}

export const MOCK_OPEN_SPEAKING_PROMPTS: OpenSpeakingPrompt[] = [
  // --------------------------------------------------------------- C1 ---
  {
    id: 'osp-c1-1',
    level: CefrLevel.C1,
    title: 'Debate: Should AI handle first-line customer support?',
    instructions:
      'Take a clear position — for or against — and defend it out loud for at least 30 seconds. Address one likely objection to your view.',
    hint: 'Start with "I believe that..." and use "Some might argue... but..." to address the objection.',
    minWords: 40,
  },
  {
    id: 'osp-c1-2',
    level: CefrLevel.C1,
    title: 'Presentation: Pitch a process improvement to your team',
    instructions:
      'Speak as if presenting to your team: describe a workplace inefficiency and propose a specific fix, explaining why it would help.',
    hint: 'Structure: the problem, the proposal, the benefit.',
    minWords: 40,
  },
  {
    id: 'osp-c1-3',
    level: CefrLevel.C1,
    title: 'Negotiation: Respond to a client asking for a price match',
    instructions:
      'A client says a competitor is cheaper and asks you to match the price. Speak your response out loud, negotiating rather than simply agreeing or refusing.',
    hint: 'Acknowledge their point before explaining your position.',
    minWords: 40,
  },
  {
    id: 'osp-c1-4',
    level: CefrLevel.C1,
    title: 'Persuasion: Convince a skeptical colleague',
    instructions:
      'Persuade a colleague who is skeptical about a new tool your team wants to adopt. Speak for at least 30 seconds, addressing their likely concern.',
    hint: 'Acknowledge the concern before making your case.',
    minWords: 40,
  },

  // --------------------------------------------------------------- C2 ---
  {
    id: 'osp-c2-1',
    level: CefrLevel.C2,
    title: 'Abstract discussion: Is "customer-centricity" a meaningful goal, or just a slogan?',
    instructions:
      'Speak for at least 45 seconds on this question. Take a nuanced position — you do not have to fully agree or disagree.',
    minWords: 50,
  },
  {
    id: 'osp-c2-2',
    level: CefrLevel.C2,
    title: 'Spontaneous debate: Defend an unpopular operational decision',
    instructions:
      'Imagine your company just made a decision most customers dislike (e.g. removing a free feature). Speak as if defending it publicly, without sounding defensive.',
    minWords: 50,
  },
  {
    id: 'osp-c2-3',
    level: CefrLevel.C2,
    title: 'Critical response: Respond to harsh but fair feedback',
    instructions:
      'Someone has just given you harsh, fair criticism of a proposal you made. Respond out loud in a way that is professional, doesn\'t dismiss the criticism, but also states your view clearly.',
    minWords: 50,
  },
  {
    id: 'osp-c2-4',
    level: CefrLevel.C2,
    title: 'Complex explanation: Explain a trade-off with no perfect answer',
    instructions:
      'Explain, as if to a non-expert, a genuine trade-off in your work with no perfect solution (e.g. speed vs. accuracy, automation vs. personal touch). Speak for at least 45 seconds.',
    minWords: 50,
  },
];
