import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FillBlankExercise } from '../../../core/models';
import { ExerciseAnswer } from './exercise-answer';

@Component({
  selector: 'app-fill-blank-exercise',
  standalone: true,
  template: `
    <p class="exercise-prompt">{{ exercise().sentenceWithBlank }}</p>
    <div class="exercise-options">
      @for (option of exercise().options; track $index) {
        <button
          type="button"
          class="exercise-option"
          [class.exercise-option--selected]="selected() === $index && locked() === null"
          [class.exercise-option--correct]="locked() !== null && $index === exercise().correctOptionIndex"
          [class.exercise-option--incorrect]="
            locked() !== null && selected() === $index && $index !== exercise().correctOptionIndex
          "
          [disabled]="locked() !== null"
          (click)="choose($index)"
        >
          {{ option }}
        </button>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FillBlankExerciseComponent {
  readonly exercise = input.required<FillBlankExercise>();
  readonly answered = output<ExerciseAnswer>();

  protected readonly selected = signal<number | null>(null);
  protected readonly locked = signal<number | null>(null);

  protected choose(index: number): void {
    if (this.locked() !== null) return;
    this.selected.set(index);
    this.locked.set(index);
    const correct = index === this.exercise().correctOptionIndex;
    this.answered.emit({ correct, userAnswer: this.exercise().options[index] });
  }
}
