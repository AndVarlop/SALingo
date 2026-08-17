import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { TranslationExercise } from '../../../core/models';
import { ExerciseAnswer } from './exercise-answer';

@Component({
  selector: 'app-translation-exercise',
  standalone: true,
  template: `
    <p class="exercise-prompt">Translate: "{{ exercise().sourceText }}"</p>
    <input
      type="text"
      class="translation-exercise__input"
      [value]="userAnswer()"
      [disabled]="locked()"
      placeholder="Type the English translation…"
      (input)="userAnswer.set($any($event.target).value)"
      (keydown.enter)="check()"
    />
    <button type="button" class="btn btn--primary" [disabled]="locked() || !userAnswer().trim()" (click)="check()">
      Check
    </button>
  `,
  styles: `
    .translation-exercise__input {
      width: 100%;
      padding: 12px 14px;
      border-radius: var(--radius-md);
      border: 2px solid var(--color-border);
      background: var(--color-surface);
      color: var(--color-text);
      font-size: 0.92rem;
      margin-bottom: 14px;

      &:focus-visible {
        border-color: var(--color-primary);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TranslationExerciseComponent {
  readonly exercise = input.required<TranslationExercise>();
  readonly answered = output<ExerciseAnswer>();

  protected readonly userAnswer = signal('');
  protected readonly locked = signal(false);

  protected check(): void {
    if (this.locked() || !this.userAnswer().trim()) return;
    const normalized = this.userAnswer().trim().toLowerCase().replace(/[.!?]+$/, '');
    const correct = this.exercise().acceptedAnswers.some(
      (accepted) => accepted.trim().toLowerCase().replace(/[.!?]+$/, '') === normalized,
    );
    this.locked.set(true);
    this.answered.emit({ correct, userAnswer: this.userAnswer() });
  }
}
