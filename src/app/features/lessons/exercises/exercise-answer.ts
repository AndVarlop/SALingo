/** Emitted by every exercise-type component the moment the user's answer is locked in. */
export interface ExerciseAnswer {
  correct: boolean;
  userAnswer: string;
}
