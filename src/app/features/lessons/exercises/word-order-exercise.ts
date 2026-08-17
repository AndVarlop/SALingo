import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { WordOrderExercise } from '../../../core/models';
import { ExerciseAnswer } from './exercise-answer';

interface Chip {
  word: string;
  usedIndex: number | null; // position in the built sentence, or null if still available
}

@Component({
  selector: 'app-word-order-exercise',
  standalone: true,
  templateUrl: './word-order-exercise.html',
  styleUrl: './word-order-exercise.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WordOrderExerciseComponent implements OnInit {
  readonly exercise = input.required<WordOrderExercise>();
  readonly answered = output<ExerciseAnswer>();

  protected readonly chips = signal<Chip[]>([]);
  protected readonly locked = signal(false);
  protected readonly isCorrect = signal<boolean | null>(null);

  ngOnInit(): void {
    this.chips.set(this.exercise().shuffledWords.map((word) => ({ word, usedIndex: null })));
  }

  /** Chips the user has placed, in tap order — what the template renders in the "built" strip. */
  protected readonly orderedBuiltChips = computed(() =>
    this.chips()
      .filter((c) => c.usedIndex !== null)
      .sort((a, b) => (a.usedIndex ?? 0) - (b.usedIndex ?? 0)),
  );

  protected readonly builtSentence = computed(() =>
    this.orderedBuiltChips()
      .map((c) => c.word)
      .join(' '),
  );

  protected readonly canCheck = computed(
    () => !this.locked() && this.chips().every((c) => c.usedIndex !== null),
  );

  protected tapAvailable(chip: Chip): void {
    if (this.locked() || chip.usedIndex !== null) return;
    const usedCount = this.chips().filter((c) => c.usedIndex !== null).length;
    this.chips.update((chips) =>
      chips.map((c) => (c === chip ? { ...c, usedIndex: usedCount } : c)),
    );
  }

  protected tapUsed(chip: Chip): void {
    if (this.locked() || chip.usedIndex === null) return;
    const removedIndex = chip.usedIndex;
    this.chips.update((chips) =>
      chips.map((c) => {
        if (c === chip) return { ...c, usedIndex: null };
        if (c.usedIndex !== null && c.usedIndex > removedIndex) return { ...c, usedIndex: c.usedIndex - 1 };
        return c;
      }),
    );
  }

  protected check(): void {
    if (!this.canCheck()) return;
    const userAnswer = this.builtSentence();
    const correct = userAnswer.toLowerCase() === this.exercise().correctSentence.toLowerCase();
    this.locked.set(true);
    this.isCorrect.set(correct);
    this.answered.emit({ correct, userAnswer });
  }
}
