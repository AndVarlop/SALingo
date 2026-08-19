import { CefrLevel, ExerciseType, ReadingExercise } from '../../models';

/**
 * Standalone Reading practice, parallel to mock-listening.data.ts.
 * Passage difficulty is real (not just harder vocabulary): B2 tests literal +
 * inferential comprehension of everyday professional texts; C1 adds stance,
 * implicit meaning and argument structure over denser analytical texts; C2
 * works rhetoric, tone and nuance over essay-style writing.
 *
 * Every question carries a real `explanation` (spec: centralized Feedback
 * Engine, §11) — a short "the text says X, therefore Y" pointer back into
 * the passage, not just a checkmark on the right option.
 */
export const MOCK_READING_EXERCISES: ReadingExercise[] = [
  // --------------------------------------------------------------- B2 ---
  {
    id: 'rd-b2-1',
    type: ExerciseType.Reading,
    level: CefrLevel.B2,
    prompt: 'Read the workplace email and answer the questions.',
    passage:
      "Subject: Update on the Hendricks account\n\nHi team,\n\nI wanted to give you a quick update before Friday's call. The client raised a concern last week about our response times, and while I think it was a one-off caused by the holiday, I'd rather we take it seriously than dismiss it. I've asked support to prioritize any tickets from Hendricks for the next two weeks so we can rebuild their confidence. If anyone notices a pattern beyond what happened last week, let me know directly rather than waiting for the weekly report — I'd like to get ahead of this if it turns out to be bigger than I think.\n\nThanks,\nPriya",
    questions: [
      {
        id: 'rd-b2-1-q1',
        type: ExerciseType.MultipleChoice,
        prompt: "What is Priya's main purpose in writing this email?",
        options: [
          'To announce that the Hendricks account has been cancelled',
          'To ask the team to treat a client concern carefully, even though she thinks it was a one-off',
          'To complain that the support team is too slow',
          'To schedule the Friday call',
        ],
        correctOptionIndex: 1,
        explanation:
          'The text says she\'d "rather we take it seriously than dismiss it" and asks support to prioritize Hendricks tickets — she\'s asking the team to act carefully on a concern, not announcing bad news or scheduling anything.',
        xpReward: 10,
      },
      {
        id: 'rd-b2-1-q2',
        type: ExerciseType.MultipleChoice,
        prompt: 'What does "get ahead of this" most likely mean in this context?',
        options: [
          'Finish the project early',
          'Address a possible bigger problem before it grows',
          'Beat a competitor to a deal',
          'Reply to the client before Friday',
        ],
        correctOptionIndex: 1,
        explanation:
          'It follows directly after "if it turns out to be bigger than I think" — Priya wants to act early in case the issue is more serious, which is what "get ahead of" a problem means in workplace English.',
        xpReward: 12,
      },
      {
        id: 'rd-b2-1-q3',
        type: ExerciseType.MultipleChoice,
        prompt: 'Why does Priya ask to be told directly instead of through the weekly report?',
        options: [
          "She doesn't trust the person who writes the report",
          'She wants to react quickly if the issue is more serious than one incident',
          'The weekly report has been cancelled',
          'She is going on vacation',
        ],
        correctOptionIndex: 1,
        explanation:
          'The sentence links directly to "get ahead of this" — waiting for the weekly report would be too slow if the pattern is real, so she wants to know immediately.',
        xpReward: 12,
      },
    ],
    xpReward: 10,
  },
  {
    id: 'rd-b2-2',
    type: ExerciseType.Reading,
    level: CefrLevel.B2,
    prompt: 'Read the short article and answer the questions.',
    passage:
      "Remote work isn't just a perk anymore — for many companies, it's become a trade-off they have to manage carefully. On one hand, employees report higher satisfaction and fewer sick days when they can work from home at least part of the week. On the other, managers say it's harder to build the kind of informal trust that used to happen over a coffee break. Some companies have responded by outsourcing the problem entirely to office-design consultants, redesigning their spaces so that the days people do come in actually feel worth the commute. Others have simply accepted that some loss of spontaneous collaboration is the price of a happier, more flexible workforce.",
    questions: [
      {
        id: 'rd-b2-2-q1',
        type: ExerciseType.MultipleChoice,
        prompt: 'What is the main idea of this article?',
        options: [
          'Remote work has no real downsides',
          'Companies are dealing with a genuine trade-off between flexibility and informal trust',
          'Office design consultants are overpriced',
          'Employees prefer commuting to working from home',
        ],
        correctOptionIndex: 1,
        explanation:
          'The whole passage is built around "it\'s become a trade-off": benefits ("on one hand") are weighed against a real cost ("on the other") — the article never claims remote work is downside-free.',
        xpReward: 10,
      },
      {
        id: 'rd-b2-2-q2',
        type: ExerciseType.MultipleChoice,
        prompt: 'According to the text, what have some companies done about office space?',
        options: [
          'Closed their offices completely',
          'Redesigned it so in-person days feel more worthwhile',
          'Reduced salaries for remote employees',
          'Required everyone to return five days a week',
        ],
        correctOptionIndex: 1,
        explanation:
          'The text says they hired consultants "redesigning their spaces so that the days people do come in actually feel worth the commute" — a direct match for this option.',
        xpReward: 10,
      },
      {
        id: 'rd-b2-2-q3',
        type: ExerciseType.MultipleChoice,
        prompt: "What can you infer about the author's attitude toward this issue?",
        options: [
          'They see it as a simple problem with an obvious solution',
          'They present it as a genuine, ongoing balancing act, without taking a strong side',
          'They strongly favor a full return to the office',
          'They think remote work should be banned',
        ],
        correctOptionIndex: 1,
        explanation:
          'The author lists both sides ("on one hand"/"on the other") and two different company responses without endorsing either one — that balanced framing is the clue, not any single sentence.',
        xpReward: 13,
      },
    ],
    xpReward: 10,
  },
  {
    id: 'rd-b2-3',
    type: ExerciseType.Reading,
    level: CefrLevel.B2,
    prompt: 'Read the customer service report excerpt and answer the questions.',
    passage:
      "This month's report shows a slight dip in customer satisfaction scores, from 4.3 to 4.1 out of 5. The drop coincides with the rollout of our new ticketing system, which — as expected during any transition — has caused some confusion among newer agents. Overwhelmed by the volume of tickets during the first week, several agents fell behind on response times, which is very likely the main driver of the lower scores. The good news is that by week three, response times had already returned to normal as the team got the hang of the new interface. We recommend continuing to monitor scores through next month before drawing any final conclusions.",
    questions: [
      {
        id: 'rd-b2-3-q1',
        type: ExerciseType.MultipleChoice,
        prompt: 'What most likely caused the drop in satisfaction scores?',
        options: [
          'A permanent reduction in staff',
          'Agents adjusting to a new ticketing system',
          'A price increase for customers',
          'A change in the company\'s working hours',
        ],
        correctOptionIndex: 1,
        explanation:
          'The report says the drop "coincides with the rollout of our new ticketing system" and names agents falling behind during the transition as "very likely the main driver" — nothing about staffing, price, or hours is mentioned.',
        xpReward: 10,
      },
      {
        id: 'rd-b2-3-q2',
        type: ExerciseType.MultipleChoice,
        prompt: 'What does the report recommend?',
        options: [
          'Reverting to the old ticketing system immediately',
          'Continuing to monitor scores before making a final judgment',
          'Firing the newer agents',
          'Raising customer satisfaction targets',
        ],
        correctOptionIndex: 1,
        explanation:
          'The last sentence states it directly: "We recommend continuing to monitor scores through next month before drawing any final conclusions."',
        xpReward: 10,
      },
      {
        id: 'rd-b2-3-q3',
        type: ExerciseType.MultipleChoice,
        prompt: 'What does "got the hang of" mean here?',
        options: [
          'Became frustrated with',
          'Became comfortable using',
          'Stopped using',
          'Complained about',
        ],
        correctOptionIndex: 1,
        explanation:
          'It appears right after "response times had already returned to normal" — the team improving at using the interface, i.e. becoming comfortable with it, is what caused response times to recover.',
        xpReward: 10,
      },
    ],
    xpReward: 10,
  },

  // --------------------------------------------------------------- C1 ---
  {
    id: 'rd-c1-1',
    type: ExerciseType.Reading,
    level: CefrLevel.C1,
    prompt: 'Read the opinion piece and answer the questions.',
    passage:
      "There is a comfortable assumption, popular among executives, that AI will simply take over the repetitive parts of customer service, leaving human agents free to focus on the 'meaningful' interactions. It's a tidy story, and it happens to be the one most convenient for whoever is trying to justify the budget for a new chatbot. But it understates something important: a great deal of what makes a customer feel heard is precisely the unremarkable stuff — a rep confirming a detail, acknowledging a frustration, pausing before delivering bad news. Automate that layer away and what's left for humans is disproportionately the conflict — the calls nobody wanted in the first place. If companies are not deliberate about how they redistribute work, they may find they've optimized their agents straight into burnout.",
    questions: [
      {
        id: 'rd-c1-1-q1',
        type: ExerciseType.MultipleChoice,
        prompt: "What is the author's stance toward the executive assumption described?",
        options: [
          'They fully agree with it',
          'They are skeptical of it and point out a flaw in the reasoning',
          'They have no opinion either way',
          'They think it understates how good AI already is',
        ],
        correctOptionIndex: 1,
        explanation:
          'Signal words like "comfortable assumption," "tidy story," and "it understates something important" all mark disagreement — the author goes on to explain exactly what the assumption gets wrong.',
        xpReward: 13,
      },
      {
        id: 'rd-c1-1-q2',
        type: ExerciseType.MultipleChoice,
        prompt: 'What is the author implying by calling the assumption "the one most convenient for whoever is trying to justify the budget"?',
        options: [
          'That the assumption is being adopted partly for self-interested reasons, not purely because it is true',
          'That chatbots are always the cheapest option',
          'That executives never consider budgets',
          'That the assumption came from a customer survey',
        ],
        correctOptionIndex: 0,
        explanation:
          '"Convenient for" someone with a specific goal (justifying a budget) implies the belief is attractive for a self-serving reason, not necessarily because it\'s accurate — that\'s the implicit criticism.',
        xpReward: 15,
      },
      {
        id: 'rd-c1-1-q3',
        type: ExerciseType.MultipleChoice,
        prompt: 'What risk does the author warn about at the end of the passage?',
        options: [
          'Companies losing money on AI tools',
          'Agents ending up handling a higher proportion of difficult, conflict-heavy calls, risking burnout',
          'Customers preferring chatbots over humans',
          'AI replacing executives instead of agents',
        ],
        correctOptionIndex: 1,
        explanation:
          'The final two sentences state it explicitly: automating the "unremarkable" work leaves agents with "disproportionately the conflict," which "optimized their agents straight into burnout."',
        xpReward: 14,
      },
    ],
    xpReward: 12,
  },
  {
    id: 'rd-c1-2',
    type: ExerciseType.Reading,
    level: CefrLevel.C1,
    prompt: 'Read the analytical text and answer the questions.',
    passage:
      "Leadership training programs love to talk about 'authenticity,' as though the goal were simply to bring one's unfiltered self to every meeting. In practice, the leaders who are most trusted by their teams are rarely the most unfiltered — they're the ones who have learned which version of themselves is appropriate for a given room, without that adjustment feeling like a performance. Call it register-switching rather than inauthenticity: the same underlying values, expressed with a discretion that changes depending on whether you're delivering good news, bad news, or simply thinking out loud in front of people who report to you. The leaders who get this wrong tend to fail in one of two directions — either they're so guarded that no one trusts what they say, or so unfiltered that no one feels safe saying anything back.",
    questions: [
      {
        id: 'rd-c1-2-q1',
        type: ExerciseType.MultipleChoice,
        prompt: "What is the author's main argument?",
        options: [
          'Leaders should always say exactly what they think',
          'True authenticity means adapting how you express consistent values to the situation, not being unfiltered',
          'Leadership training programs are always wrong about everything',
          'Trust has nothing to do with communication style',
        ],
        correctOptionIndex: 1,
        explanation:
          'The core claim is stated directly: trusted leaders adjust "which version of themselves is appropriate for a given room" while keeping "the same underlying values" — adaptation, not raw unfilteredness.',
        xpReward: 14,
      },
      {
        id: 'rd-c1-2-q2',
        type: ExerciseType.MultipleChoice,
        prompt: 'The author distinguishes "register-switching" from what?',
        options: [
          'Public speaking',
          'Inauthenticity',
          'Leadership training',
          'Delivering bad news',
        ],
        correctOptionIndex: 1,
        explanation:
          'The text says it explicitly: "Call it register-switching rather than inauthenticity" — the whole point is that adapting your delivery isn\'t the same as being fake.',
        xpReward: 13,
      },
      {
        id: 'rd-c1-2-q3',
        type: ExerciseType.MultipleChoice,
        prompt: 'What two failure modes does the author describe at the end?',
        options: [
          'Being too honest and too dishonest',
          'Being too guarded to be trusted, or too unfiltered for people to feel safe',
          'Speaking too much or too little',
          'Being too formal or too informal in emails',
        ],
        correctOptionIndex: 1,
        explanation:
          'The last sentence names them directly: "so guarded that no one trusts what they say, or so unfiltered that no one feels safe saying anything back."',
        xpReward: 14,
      },
    ],
    xpReward: 12,
  },
  {
    id: 'rd-c1-3',
    type: ExerciseType.Reading,
    level: CefrLevel.C1,
    prompt: 'Read the report excerpt and answer the questions.',
    passage:
      "Retention data from the last two quarters presents something of a paradox. Customers who file at least one complaint that gets resolved to their satisfaction are, on average, more likely to renew than customers who never contact support at all. It would be tempting to conclude that we should therefore encourage more complaints, but that reading mistakes the correlation for the cause: what these customers are actually demonstrating is that they cared enough to reach out in the first place, and our resolution simply confirmed that the relationship was worth maintaining. The real lesson is less about complaints and more about responsiveness — for the much larger group of customers who never complain but quietly disengage, we currently have no equivalent signal at all.",
    questions: [
      {
        id: 'rd-c1-3-q1',
        type: ExerciseType.MultipleChoice,
        prompt: 'What mistaken conclusion does the author warn against?',
        options: [
          'That resolving complaints costs too much money',
          'That the company should encourage more complaints, based on the correlation with renewal',
          'That customers who complain should be ignored',
          'That renewal rates are falling overall',
        ],
        correctOptionIndex: 1,
        explanation:
          'The text names it directly: "It would be tempting to conclude that we should therefore encourage more complaints, but that reading mistakes the correlation for the cause."',
        xpReward: 14,
      },
      {
        id: 'rd-c1-3-q2',
        type: ExerciseType.MultipleChoice,
        prompt: 'According to the author, what does a resolved complaint actually demonstrate?',
        options: [
          'That the product is flawed',
          'That the customer already cared enough to engage, and the resolution confirmed that',
          'That the support team is understaffed',
          'That the customer is likely to complain again',
        ],
        correctOptionIndex: 1,
        explanation:
          'The author\'s real explanation follows the word "actually": these customers "cared enough to reach out in the first place," and the resolution "confirmed that the relationship was worth maintaining."',
        xpReward: 14,
      },
      {
        id: 'rd-c1-3-q3',
        type: ExerciseType.MultipleChoice,
        prompt: 'What gap does the author identify at the end of the passage?',
        options: [
          'A lack of budget for customer service',
          'No equivalent signal for customers who silently disengage without complaining',
          'A lack of training for new agents',
          'Too many customers complaining at once',
        ],
        correctOptionIndex: 1,
        explanation:
          'The final sentence states it directly: for customers who "never complain but quietly disengage," the company has "no equivalent signal at all."',
        xpReward: 13,
      },
    ],
    xpReward: 12,
  },

  // --------------------------------------------------------------- C2 ---
  {
    id: 'rd-c2-1',
    type: ExerciseType.Reading,
    level: CefrLevel.C2,
    prompt: 'Read the essay excerpt and answer the questions.',
    passage:
      "Ask any executive whether they value candor and you will get, with almost mechanical reliability, an emphatic yes — usually delivered in the same breath as a story about an open-door policy nobody quite believes in. The gap between the stated preference and the observed behavior is not hypocrisy exactly; it is closer to a kind of institutional self-deception, in which the organization sincerely believes it wants what it has in fact spent years training its people not to offer. One learns to read the real policy not in the mission statement but in what happens to the last person who was candid: were they promoted, or were they quietly reassigned to a project with no visibility? The answer, more often than anyone would like to admit, tells you everything the town hall did not.",
    questions: [
      {
        id: 'rd-c2-1-q1',
        type: ExerciseType.MultipleChoice,
        prompt: 'What is the author most precisely arguing?',
        options: [
          'Executives are deliberately lying about valuing candor',
          "Organizations often sincerely believe they want candor while their real, observable norms discourage it — a gap the author reads as self-deception rather than conscious hypocrisy",
          'Open-door policies are always effective',
          'Candor is not actually valuable in organizations',
        ],
        correctOptionIndex: 1,
        explanation:
          'The author explicitly rejects "hypocrisy" in favor of a more precise term: "institutional self-deception, in which the organization sincerely believes it wants what it has in fact spent years training its people not to offer."',
        xpReward: 16,
      },
      {
        id: 'rd-c2-1-q2',
        type: ExerciseType.MultipleChoice,
        prompt: 'What is the function of the rhetorical question about "the last person who was candid"?',
        options: [
          'To introduce a new, unrelated topic',
          "To offer a concrete, practical test for detecting an organization's real (unstated) norms, beneath its official ones",
          'To criticize a specific named executive',
          'To suggest that candor should never be rewarded',
        ],
        correctOptionIndex: 1,
        explanation:
          'It follows "one learns to read the real policy not in the mission statement but in..." — the question is offered as a diagnostic tool for what actually happens, not the stated policy.',
        xpReward: 17,
      },
      {
        id: 'rd-c2-1-q3',
        type: ExerciseType.MultipleChoice,
        prompt: 'What tone best describes this passage?',
        options: [
          'Neutral and purely descriptive, with no evaluative stance',
          'Wry and pointedly skeptical, using irony to expose a gap between stated and actual values',
          'Angry and openly hostile toward a specific company',
          'Purely celebratory of open-door policies',
        ],
        correctOptionIndex: 1,
        explanation:
          'Phrases like "with almost mechanical reliability," "nobody quite believes in," and "more often than anyone would like to admit" are dry, ironic understatement — critical without ever raising its voice.',
        xpReward: 17,
      },
    ],
    xpReward: 14,
  },
  {
    id: 'rd-c2-2',
    type: ExerciseType.Reading,
    level: CefrLevel.C2,
    prompt: 'Read the critical analysis and answer the questions.',
    passage:
      "The trouble with most negotiation advice is that it treats concession as a single move rather than a signal read over time. A negotiator who caves quickly on a minor point is not merely giving something away; they are, whether they intend to or not, revealing something about how they weigh the value of the relationship against the value of the specific term — information the other side will quietly bank for the next round. The seasoned negotiators I've studied rarely concede on instinct. They concede deliberately, and often on points they had already decided were negotiable before the conversation began, precisely so that the concession reads as generosity rather than weakness. The distinction is subtle, and it is also, in my experience, the entire difference between negotiators who are respected and those who are merely liked.",
    questions: [
      {
        id: 'rd-c2-2-q1',
        type: ExerciseType.MultipleChoice,
        prompt: "What is the author's central claim about concessions?",
        options: [
          'Concessions should always be avoided',
          'A concession functions as a signal that reveals information, so how and when it is made matters as much as the concession itself',
          'Only inexperienced negotiators ever concede',
          'Concessions have no effect on future negotiations',
        ],
        correctOptionIndex: 1,
        explanation:
          'The opening sentence frames the whole passage: concession is "a signal read over time," not "a single move" — everything that follows explains what that signal reveals.',
        xpReward: 16,
      },
      {
        id: 'rd-c2-2-q2',
        type: ExerciseType.MultipleChoice,
        prompt: 'What distinction does the author draw between "generosity" and "weakness" in this context?',
        options: [
          'There is no real difference — it is purely a matter of luck',
          'A deliberate, pre-planned concession tends to be read as generosity, while an instinctive one tends to be read as weakness',
          'Generosity always involves giving up more than weakness does',
          'Weakness is only shown by junior negotiators',
        ],
        correctOptionIndex: 1,
        explanation:
          'The text ties this directly to deliberateness: seasoned negotiators concede "deliberately... precisely so that the concession reads as generosity rather than weakness" — timing and intent, not the concession itself, make the difference.',
        xpReward: 17,
      },
      {
        id: 'rd-c2-2-q3',
        type: ExerciseType.MultipleChoice,
        prompt: "What can be inferred about the author's relationship to this subject?",
        options: [
          'They are a casual observer with no direct experience',
          "They present themselves as having studied negotiators closely, drawing on direct observation ('in my experience')",
          "They are quoting someone else's research exclusively",
          'They disapprove of negotiation as a practice',
        ],
        correctOptionIndex: 1,
        explanation:
          'The phrases "negotiators I\'ve studied" and "in my experience" are first-person markers of direct, first-hand authority on the topic.',
        xpReward: 15,
      },
    ],
    xpReward: 14,
  },
  {
    id: 'rd-c2-3',
    type: ExerciseType.Reading,
    level: CefrLevel.C2,
    prompt: 'Read the professional text and answer the questions.',
    passage:
      "'We take full responsibility' is, by now, one of the most reliably empty sentences in corporate English — not because responsibility isn't sometimes genuinely taken, but because the phrase has been so thoroughly emptied of consequence by companies that say it and then quietly proceed exactly as before. A more honest version of the sentence would specify what changes as a result of the responsibility being taken: a policy revised, a person reassigned, a process audited. Absent that specificity, the sentence is doing rhetorical work rather than substantive work — it exists to close the news cycle, not to close the gap that caused the problem. Readers have gotten better, if not perfect, at telling the two apart, which is itself a quietly encouraging sign for anyone who still believes that language is supposed to mean something.",
    questions: [
      {
        id: 'rd-c2-3-q1',
        type: ExerciseType.MultipleChoice,
        prompt: 'Why does the author call the phrase "we take full responsibility" empty?',
        options: [
          'Because responsibility should never be taken publicly',
          'Because it is frequently used without any specific, verifiable change following it, so it functions rhetorically rather than substantively',
          'Because it is grammatically incorrect',
          'Because only lawyers use that phrase',
        ],
        correctOptionIndex: 1,
        explanation:
          'The reasoning is explicit: "Absent that specificity, the sentence is doing rhetorical work rather than substantive work" — it\'s empty because nothing concrete backs it up, not because the phrase itself is flawed.',
        xpReward: 16,
      },
      {
        id: 'rd-c2-3-q2',
        type: ExerciseType.MultipleChoice,
        prompt: 'What would make the phrase more honest, according to the author?',
        options: [
          'Repeating it more often',
          'Naming a concrete, specific consequence — a policy, person, or process that actually changed',
          'Using more formal vocabulary',
          'Avoiding the topic entirely',
        ],
        correctOptionIndex: 1,
        explanation:
          'The text says it directly: "A more honest version of the sentence would specify what changes... a policy revised, a person reassigned, a process audited."',
        xpReward: 15,
      },
      {
        id: 'rd-c2-3-q3',
        type: ExerciseType.MultipleChoice,
        prompt: "What is the author's implied attitude in the final sentence?",
        options: [
          'Cynical and hopeless about public language',
          'Cautiously optimistic that audiences are getting better at detecting empty rhetoric',
          'Indifferent to how companies communicate',
          'Certain that all corporate apologies are meaningless',
        ],
        correctOptionIndex: 1,
        explanation:
          '"Gotten better, if not perfect" and "quietly encouraging" both signal measured optimism — not cynicism (that would be hopeless) and not indifference (the author clearly cares about this).',
        xpReward: 17,
      },
    ],
    xpReward: 14,
  },
];
