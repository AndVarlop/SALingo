import { Injectable } from '@angular/core';
import { CallFlowScore, CallFlowStepId, CallPerformance } from '../models';

/** Keyword rules per call-flow step. Mock/rule-based today — the shape
 * (`CallPerformance`) is what a real transcript-analysis model would fill in,
 * so swapping this service's internals later needs no caller changes. */
const STEP_KEYWORDS: Record<CallFlowStepId, string[]> = {
  greeting: ['hello', 'hi ', 'hi,', 'good morning', 'good afternoon', 'good evening', 'thank you for calling', 'thanks for calling'],
  identification: ['my name is', "i'm ", 'this is', 'speaking with', 'i am '],
  verification: ['can you confirm', 'could you confirm', 'verify', 'account number', 'date of birth', 'can i have your', 'could i have your'],
  understanding: ['i understand', 'i see', 'so what happened', 'let me make sure', 'if i understand', 'so you'],
  empathy: ['i understand how', 'i apologize', "i'm sorry", 'i am sorry', 'that must be', 'i know this is frustrating', 'sorry for the trouble', 'sorry about that'],
  investigation: ['let me check', 'let me look', "i'll check", 'i will check', 'looking into', 'let me see', "i'll look"],
  solution: ['i can offer', 'i can', 'what i can do', "here's what", 'we can', "i'll process", 'i will process', 'the solution'],
  confirmation: ['does that work', 'does that sound', 'is that okay', 'to confirm', 'just to confirm', 'sound good'],
  closing: ['anything else', 'have a great day', 'have a good day', 'thank you for your patience', 'thanks for your patience', 'take care'],
};

const STEP_LABEL: Record<CallFlowStepId, string> = {
  greeting: 'Greeting',
  identification: 'Identification',
  verification: 'Verification',
  understanding: 'Understanding',
  empathy: 'Empathy',
  investigation: 'Investigation',
  solution: 'Solution',
  confirmation: 'Confirmation',
  closing: 'Closing',
};

/** Steps every call is expected to attempt, regardless of scenario. The
 * remaining three (identification/verification/investigation) only count
 * when the scenario's `availableInfo` implies a lookup was needed. */
const CORE_STEPS: CallFlowStepId[] = ['greeting', 'understanding', 'empathy', 'solution', 'closing'];
const CONDITIONAL_STEPS: CallFlowStepId[] = ['identification', 'verification', 'investigation', 'confirmation'];

@Injectable({ providedIn: 'root' })
export class CallFlowScoringService {
  /**
   * Scores a full agent transcript against the call-flow checklist.
   * `expectsLookup` (true when the scenario has `availableInfo` to check)
   * decides whether the conditional steps count toward the overall score —
   * a simple info request shouldn't be penalized for skipping "verification".
   */
  score(agentTranscript: string, expectsLookup: boolean): CallPerformance {
    const text = agentTranscript.toLowerCase();
    const stepsToScore = expectsLookup ? [...CORE_STEPS, ...CONDITIONAL_STEPS] : CORE_STEPS;

    const steps: CallFlowScore[] = stepsToScore.map((step) => {
      const detected = STEP_KEYWORDS[step].some((k) => text.includes(k));
      return { step, label: STEP_LABEL[step], percent: detected ? 100 : 0, detected };
    });

    const overall = steps.length
      ? Math.round(steps.reduce((sum, s) => sum + s.percent, 0) / steps.length)
      : 0;

    return { steps, overall };
  }
}
