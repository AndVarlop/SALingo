/**
 * Centralized answer-feedback contract (spec: "NO SOLO DECIR QUE ESTÁ MAL").
 * One shape every deterministic exercise type (MultipleChoice, FillBlank,
 * TrueFalse, WordOrder, Translation, Listening, and the nested questions
 * inside Reading) renders through, via FeedbackService — instead of each
 * exercise-type component inventing its own "wrong" message.
 */
export type FeedbackErrorType =
  | 'grammar'
  | 'vocabulary'
  | 'word-order'
  | 'listening-comprehension'
  | 'reading-comprehension'
  | 'correct';

export interface ExerciseFeedback {
  correct: boolean;
  errorType: FeedbackErrorType;
  /** What the learner actually answered, in a form worth re-reading (not just an index). */
  userAnswer: string;
  /** The correct answer, in the same form. */
  correctAnswer: string;
  /** Why — always present, even as a templated fallback; never a bare "wrong". */
  why: string;
  /** The underlying rule/pattern, when the content has one (e.g. a GrammarTopic). */
  rule?: string;
  /** 1-3 short correct-usage examples, when available. */
  examples?: string[];
  /** A short memorable takeaway ("yesterday → Past Simple"), when derivable. */
  tip?: string;
}
