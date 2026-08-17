import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { TrueFalseExercise } from '../../../core/models';
import { ExerciseAnswer } from './exercise-answer';

@Component({
  selector: 'app-true-false-exercise',
  standalone: true,
  template: `
    <p class="exercise-prompt">"{{ exercise().statement }}"</p>
    <div class="exercise-options">
      @for (choice of [true, false]; track choice) {
        <button
          type="button"
          class="exercise-option"
          [class.exercise-option--selected]="selected() === choice && locked() === null"
          [class.exercise-option--correct]="locked() !== null && choice === exercise().correctAnswer"
          [class.exercise-option--incorrect]="
            locked() !== null && selected() === choice && choice !== exercise().correctAnswer
          "
          [disabled]="locked() !== null"
          (click)="choose(choice)"
        >
          {{ choice ? 'True' : 'False' }}
        </button>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrueFalseExerciseComponent {
  readonly exercise = input.required<TrueFalseExercise>();
  readonly answered = output<ExerciseAnswer>();

  protected readonly selected = signal<boolean | null>(null);
  protected readonly locked = signal<boolean | null>(null);

  protected choose(choice: boolean): void {
    if (this.locked() !== null) return;
    this.selected.set(choice);
    this.locked.set(choice);
    const correct = choice === this.exercise().correctAnswer;
    this.answered.emit({ correct, userAnswer: choice ? 'True' : 'False' });
  }
}
