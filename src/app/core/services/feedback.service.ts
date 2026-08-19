import { Injectable } from '@angular/core';
import {
  Exercise,
  ExerciseAnswer,
  ExerciseFeedback,
  ExerciseType,
  FeedbackErrorType,
  FillBlankExercise,
  GrammarTopic,
  ListeningExercise,
  MultipleChoiceExercise,
  TranslationExercise,
  TrueFalseExercise,
  WordOrderExercise,
} from '../models';

export interface FeedbackContext {
  /** The GrammarTopic this exercise belongs to, when known — unlocks the topic's real rule/examples/commonMistakes instead of a generic fallback. */
  topic?: GrammarTopic;
  /** Overrides the guessed errorType (e.g. 'vocabulary' for Vocabulary Rush, which reuses MultipleChoice-shaped questions for word meanings). */
  errorType?: FeedbackErrorType;
}

/**
 * Centralized feedback for every deterministic exercise type — spec:
 * "NO SOLO DECIR QUE ESTÁ MAL". Never returns a bare "wrong": when the
 * content has an authored `explanation` (or belongs to a GrammarTopic with
 * a real rule+examples), that's used; otherwise a templated fallback still
 * names the user's answer, the correct one, and a plain-language "why" —
 * proportional to the exercise (one line for a MultipleChoice swap, more
 * when a GrammarTopic's rule/examples are available).
 */
@Injectable({ providedIn: 'root' })
export class FeedbackService {
  build(exercise: Exercise, answer: ExerciseAnswer, ctx: FeedbackContext = {}): ExerciseFeedback {
    switch (exercise.type) {
      case ExerciseType.MultipleChoice:
      case ExerciseType.FillBlank:
        return this.buildOptionBased(exercise, answer, ctx, ctx.errorType ?? 'grammar');
      case ExerciseType.Listening:
        return this.buildListening(exercise, answer, ctx);
      case ExerciseType.TrueFalse:
        return this.buildTrueFalse(exercise, answer, ctx);
      case ExerciseType.WordOrder:
        return this.buildWordOrder(exercise, answer, ctx);
      case ExerciseType.Translation:
        return this.buildTranslation(exercise, answer, ctx);
      default:
        // Flashcard/Speaking/Reading are self-explanatory or handled by their own component (Speaking has real AI feedback; Reading's nested questions go through buildOptionBased per-question instead of the parent exercise).
        return {
          correct: answer.correct,
          errorType: ctx.errorType ?? 'correct',
          userAnswer: answer.userAnswer,
          correctAnswer: answer.userAnswer,
          why: answer.correct ? 'Correct!' : 'Not quite — see the explanation above.',
        };
    }
  }

  private buildOptionBased(
    exercise: MultipleChoiceExercise | FillBlankExercise,
    answer: ExerciseAnswer,
    ctx: FeedbackContext,
    errorType: FeedbackErrorType,
  ): ExerciseFeedback {
    const correctAnswer = exercise.options[exercise.correctOptionIndex];
    if (answer.correct) {
      return {
        correct: true,
        errorType: 'correct',
        userAnswer: answer.userAnswer,
        correctAnswer,
        why: exercise.explanation ?? 'Correct!',
      };
    }

    const topic = ctx.topic;
    const why =
      exercise.explanation ??
      (topic
        ? topic.explanation
        : `You chose "${answer.userAnswer}", but the correct answer is "${correctAnswer}".`);
    const tip = topic ? this.matchingCommonMistake(topic, answer.userAnswer) : undefined;

    return {
      correct: false,
      errorType,
      userAnswer: answer.userAnswer,
      correctAnswer,
      why,
      rule: topic && why !== topic.explanation ? `${topic.title}: ${topic.summary}` : undefined,
      examples: topic?.examples.slice(0, 2),
      tip,
    };
  }

  private buildListening(exercise: ListeningExercise, answer: ExerciseAnswer, ctx: FeedbackContext): ExerciseFeedback {
    const correctAnswer = exercise.options[exercise.correctOptionIndex];
    if (answer.correct) {
      return {
        correct: true,
        errorType: 'correct',
        userAnswer: answer.userAnswer,
        correctAnswer,
        why: exercise.explanation ?? 'Correct!',
      };
    }
    return {
      correct: false,
      errorType: ctx.errorType ?? 'listening-comprehension',
      userAnswer: answer.userAnswer,
      correctAnswer,
      why:
        exercise.explanation ??
        `What was actually said: "${exercise.audioText}". You heard/chose "${answer.userAnswer}", but listen again for the exact wording.`,
      tip: 'Replay at a slower speed and focus on the words that differ from your answer.',
    };
  }

  private buildTrueFalse(exercise: TrueFalseExercise, answer: ExerciseAnswer, ctx: FeedbackContext): ExerciseFeedback {
    const correctAnswer = exercise.correctAnswer ? 'True' : 'False';
    if (answer.correct) {
      return {
        correct: true,
        errorType: 'correct',
        userAnswer: answer.userAnswer,
        correctAnswer,
        why: exercise.explanation ?? 'Correct!',
      };
    }
    return {
      correct: false,
      errorType: ctx.errorType ?? 'grammar',
      userAnswer: answer.userAnswer,
      correctAnswer,
      why: exercise.explanation ?? `The statement "${exercise.statement}" is actually ${correctAnswer.toLowerCase()}.`,
    };
  }

  private buildWordOrder(exercise: WordOrderExercise, answer: ExerciseAnswer, ctx: FeedbackContext): ExerciseFeedback {
    if (answer.correct) {
      return {
        correct: true,
        errorType: 'correct',
        userAnswer: answer.userAnswer,
        correctAnswer: exercise.correctSentence,
        why: exercise.explanation ?? 'Correct!',
      };
    }
    return {
      correct: false,
      errorType: ctx.errorType ?? 'word-order',
      userAnswer: answer.userAnswer,
      correctAnswer: exercise.correctSentence,
      why:
        exercise.explanation ??
        'Your word order doesn\'t match natural English word order for this sentence — compare it carefully with the correct version below.',
      rule: 'English usually follows Subject → Verb → Object, with time/place expressions at the end.',
      tip: 'Read the correct sentence aloud a few times — word order sticks better by ear than by rule.',
    };
  }

  private buildTranslation(exercise: TranslationExercise, answer: ExerciseAnswer, ctx: FeedbackContext): ExerciseFeedback {
    const correctAnswer = exercise.acceptedAnswers[0];
    if (answer.correct) {
      return {
        correct: true,
        errorType: 'correct',
        userAnswer: answer.userAnswer,
        correctAnswer,
        why: exercise.explanation ?? 'Correct!',
      };
    }
    const others = exercise.acceptedAnswers.slice(1, 3);
    return {
      correct: false,
      errorType: ctx.errorType ?? 'vocabulary',
      userAnswer: answer.userAnswer,
      correctAnswer,
      why:
        exercise.explanation ??
        `Your translation doesn't match. A correct translation is "${correctAnswer}".` +
          (others.length ? ` Also accepted: ${others.map((o) => `"${o}"`).join(', ')}.` : ''),
    };
  }

  /** Best-effort: surface a topic's authored commonMistakes line if it seems to describe the user's wrong answer. */
  private matchingCommonMistake(topic: GrammarTopic, userAnswer: string): string | undefined {
    const needle = userAnswer.toLowerCase();
    return topic.commonMistakes.find((m) => needle.length > 2 && m.toLowerCase().includes(needle));
  }
}
