import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { Exercise, ExerciseResult, ExerciseType } from '../../../core/models';
import { XP_RULES } from '../../../core/constants/xp.constant';
import { ExerciseAnswer } from '../exercises/exercise-answer';
import { MultipleChoiceExerciseComponent } from '../exercises/multiple-choice-exercise';
import { FillBlankExerciseComponent } from '../exercises/fill-blank-exercise';
import { TrueFalseExerciseComponent } from '../exercises/true-false-exercise';
import { WordOrderExerciseComponent } from '../exercises/word-order-exercise';
import { TranslationExerciseComponent } from '../exercises/translation-exercise';
import { ListeningExerciseComponent } from '../exercises/listening-exercise';
import { ReadingExerciseComponent } from '../exercises/reading-exercise';
import { SpeakingExerciseComponent } from '../exercises/speaking-exercise';
import { ProgressBarComponent } from '../../../shared/components/progress-bar/progress-bar';

@Component({
  selector: 'app-exercise-player',
  standalone: true,
  imports: [
    MultipleChoiceExerciseComponent,
    FillBlankExerciseComponent,
    TrueFalseExerciseComponent,
    WordOrderExerciseComponent,
    TranslationExerciseComponent,
    ListeningExerciseComponent,
    ReadingExerciseComponent,
    SpeakingExerciseComponent,
    ProgressBarComponent,
  ],
  templateUrl: './exercise-player.html',
  styleUrl: './exercise-player.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExercisePlayerComponent {
  readonly exercises = input.required<Exercise[]>();
  readonly finished = output<{ results: ExerciseResult[]; xpEarned: number }>();

  protected readonly ExerciseType = ExerciseType;

  protected readonly currentIndex = signal(0);
  private readonly results = signal<ExerciseResult[]>([]);
  private exerciseStartedAt = Date.now();

  protected readonly currentExercise = computed(() => this.exercises()[this.currentIndex()]);
  protected readonly progressPercent = computed(() =>
    Math.round((this.currentIndex() / this.exercises().length) * 100),
  );
  protected readonly isLast = computed(() => this.currentIndex() === this.exercises().length - 1);

  protected readonly lastAnswer = signal<ExerciseAnswer | null>(null);

  protected onAnswered(answer: ExerciseAnswer): void {
    this.lastAnswer.set(answer);
    const exercise = this.currentExercise();
    const timeSpentSeconds = Math.round((Date.now() - this.exerciseStartedAt) / 1000);
    this.results.update((r) => [
      ...r,
      { exerciseId: exercise.id, correct: answer.correct, userAnswer: answer.userAnswer, timeSpentSeconds },
    ]);
  }

  protected next(): void {
    this.lastAnswer.set(null);
    this.exerciseStartedAt = Date.now();

    if (this.isLast()) {
      const results = this.results();
      const xpEarned = this.exercises().reduce((total, ex, i) => {
        const correct = results[i]?.correct ?? false;
        return total + (correct ? ex.xpReward : XP_RULES.incorrectExercise);
      }, 0);
      this.finished.emit({ results, xpEarned });
      return;
    }

    this.currentIndex.update((i) => i + 1);
  }
}
