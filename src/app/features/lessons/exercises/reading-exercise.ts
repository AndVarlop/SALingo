import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { ReadingExercise } from '../../../core/models';
import { shuffleOptions } from '../../../core/utils/shuffle.util';
import { ExerciseAnswer } from './exercise-answer';

@Component({
  selector: 'app-reading-exercise',
  standalone: true,
  templateUrl: './reading-exercise.html',
  styleUrl: './reading-exercise.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReadingExerciseComponent {
  readonly exercise = input.required<ReadingExercise>();
  readonly answered = output<ExerciseAnswer>();

  /** Selected option index per question index. */
  protected readonly selections = signal<Record<number, number>>({});
  protected readonly locked = signal(false);

  /** Each question's options shuffled once per exercise instance (spec §25/§26) — the original `exercise()` object (with its authored correctOptionIndex/explanation) stays untouched for FeedbackService and content authoring. */
  protected readonly shuffledQuestions = computed(() =>
    this.exercise().questions.map((q) => ({ ...q, ...shuffleOptions(q.options, q.correctOptionIndex) })),
  );

  protected readonly canCheck = computed(
    () => !this.locked() && Object.keys(this.selections()).length === this.exercise().questions.length,
  );

  protected select(questionIndex: number, optionIndex: number): void {
    if (this.locked()) return;
    this.selections.update((s) => ({ ...s, [questionIndex]: optionIndex }));
  }

  protected isCorrectSelection(questionIndex: number): boolean {
    return this.selections()[questionIndex] === this.shuffledQuestions()[questionIndex].correctOptionIndex;
  }

  protected check(): void {
    if (!this.canCheck()) return;
    this.locked.set(true);
    const questions = this.shuffledQuestions();
    const allCorrect = questions.every((_, i) => this.isCorrectSelection(i));
    const userAnswer = questions
      .map((q, i) => q.options[this.selections()[i]])
      .join(' / ');
    this.answered.emit({ correct: allCorrect, userAnswer });
  }
}
