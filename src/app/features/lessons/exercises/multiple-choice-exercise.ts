import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { MultipleChoiceExercise } from '../../../core/models';
import { shuffleOptions } from '../../../core/utils/shuffle.util';
import { ExerciseAnswer } from './exercise-answer';

@Component({
  selector: 'app-multiple-choice-exercise',
  standalone: true,
  template: `
    <p class="exercise-prompt">{{ exercise().prompt }}</p>
    <div class="exercise-options">
      @for (option of shuffled().options; track $index) {
        <button
          type="button"
          class="exercise-option"
          [class.exercise-option--selected]="selected() === $index && locked() === null"
          [class.exercise-option--correct]="locked() !== null && $index === shuffled().correctOptionIndex"
          [class.exercise-option--incorrect]="
            locked() !== null && selected() === $index && $index !== shuffled().correctOptionIndex
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
export class MultipleChoiceExerciseComponent {
  readonly exercise = input.required<MultipleChoiceExercise>();
  readonly answered = output<ExerciseAnswer>();

  /** Recomputes only when `exercise` changes — so option order stays stable while this exercise is on screen, but varies the next time it's shown (spec §25/§26). */
  protected readonly shuffled = computed(() => shuffleOptions(this.exercise().options, this.exercise().correctOptionIndex));

  protected readonly selected = signal<number | null>(null);
  protected readonly locked = signal<number | null>(null);

  protected choose(index: number): void {
    if (this.locked() !== null) return;
    this.selected.set(index);
    this.locked.set(index);
    const correct = index === this.shuffled().correctOptionIndex;
    this.answered.emit({ correct, userAnswer: this.shuffled().options[index] });
  }
}
