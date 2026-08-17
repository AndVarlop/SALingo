import { Injectable } from '@angular/core';
import { CefrLevel } from '../models';
import { Exercise, ExerciseType, MultipleChoiceExercise } from '../models';

/**
 * Generates practice exercises on demand. Mock implementation builds a
 * simple multiple-choice item from a template; a real implementation would
 * call an LLM with the user's level/weak spots and parse structured output.
 */
@Injectable({ providedIn: 'root' })
export class AiExerciseService {
  async generateExercise(topic: string, level: CefrLevel): Promise<Exercise> {
    await this.simulateThinking();

    const exercise: MultipleChoiceExercise = {
      id: `ai-ex-${Date.now()}`,
      type: ExerciseType.MultipleChoice,
      prompt: `(AI-generated, ${level}) Which sentence about "${topic}" is correct?`,
      options: [
        `I am learning about ${topic}.`,
        `I is learning about ${topic}.`,
        `I learning about ${topic}.`,
        `I am learn about ${topic}.`,
      ],
      correctOptionIndex: 0,
      xpReward: 10,
    };
    return exercise;
  }

  private simulateThinking(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 400));
  }
}
