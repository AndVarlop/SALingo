import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { ListeningExercise } from '../../../core/models';
import { shuffleOptions } from '../../../core/utils/shuffle.util';
import { ExerciseAnswer } from './exercise-answer';

const SPEEDS = [0.75, 1, 1.25, 1.5] as const;

@Component({
  selector: 'app-listening-exercise',
  standalone: true,
  templateUrl: './listening-exercise.html',
  styleUrl: './listening-exercise.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListeningExerciseComponent {
  readonly exercise = input.required<ListeningExercise>();
  readonly answered = output<ExerciseAnswer>();

  protected readonly speeds = SPEEDS;
  protected readonly speed = signal<(typeof SPEEDS)[number]>(1);
  protected readonly selected = signal<number | null>(null);
  protected readonly locked = signal<number | null>(null);
  protected readonly speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  protected readonly shuffled = computed(() => shuffleOptions(this.exercise().options, this.exercise().correctOptionIndex));

  protected play(): void {
    if (!this.speechSupported) return;
    const utterance = new SpeechSynthesisUtterance(this.exercise().audioText);
    utterance.rate = this.speed();
    utterance.lang = 'en-US';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  protected setSpeed(value: (typeof SPEEDS)[number]): void {
    this.speed.set(value);
  }

  protected choose(index: number): void {
    if (this.locked() !== null) return;
    this.selected.set(index);
    this.locked.set(index);
    const correct = index === this.shuffled().correctOptionIndex;
    this.answered.emit({ correct, userAnswer: this.shuffled().options[index] });
  }
}
