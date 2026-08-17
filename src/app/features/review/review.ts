import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { SpacedRepetitionService } from '../../core/services/spaced-repetition.service';
import { UserStateService } from '../../core/services/user-state.service';
import { XP_RULES } from '../../core/constants/xp.constant';
import { ReviewGrade, VocabularyWord } from '../../core/models';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';

type Phase = 'idle' | 'reviewing' | 'complete';

@Component({
  selector: 'app-review',
  standalone: true,
  imports: [EmptyStateComponent],
  templateUrl: './review.html',
  styleUrl: './review.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewComponent {
  private readonly spacedRepetition = inject(SpacedRepetitionService);
  private readonly userState = inject(UserStateService);

  protected readonly loading = this.spacedRepetition.loading;
  protected readonly dueCount = this.spacedRepetition.dueCount;

  protected readonly phase = signal<Phase>('idle');
  protected readonly queue = signal<VocabularyWord[]>([]);
  protected readonly currentIndex = signal(0);
  protected readonly revealed = signal(false);

  private correctCount = 0;
  private xpEarned = 0;
  private sessionStartedAt = 0;

  protected readonly currentWord = computed<VocabularyWord | null>(
    () => this.queue()[this.currentIndex()] ?? null,
  );
  protected readonly progressLabel = computed(
    () => `${this.currentIndex() + 1} / ${this.queue().length}`,
  );

  protected startSession(): void {
    this.queue.set(this.spacedRepetition.dueWords());
    this.currentIndex.set(0);
    this.revealed.set(false);
    this.correctCount = 0;
    this.xpEarned = 0;
    this.sessionStartedAt = Date.now();
    this.phase.set('reviewing');
  }

  protected reveal(): void {
    this.revealed.set(true);
  }

  protected grade(grade: ReviewGrade): void {
    const word = this.currentWord();
    if (!word) return;

    this.spacedRepetition.grade(word.id, grade);
    if (grade === 'again') {
      this.xpEarned += XP_RULES.incorrectExercise;
    } else {
      this.correctCount += 1;
      this.xpEarned += XP_RULES.reviewCorrect;
    }

    this.revealed.set(false);
    if (this.currentIndex() + 1 >= this.queue().length) {
      this.finishSession();
    } else {
      this.currentIndex.update((i) => i + 1);
    }
  }

  private finishSession(): void {
    const total = this.queue().length;
    const accuracy = total > 0 ? Math.round((this.correctCount / total) * 100) : 0;
    const minutes = Math.max(1, Math.round((Date.now() - this.sessionStartedAt) / 60_000));

    this.userState.recordActivity({
      minutes,
      xp: this.xpEarned,
      type: 'review',
      title: `Reviewed ${total} vocabulary word${total === 1 ? '' : 's'}`,
      accuracy,
    });

    this.phase.set('complete');
  }

  protected reviewAgain(): void {
    this.phase.set('idle');
  }

  protected get sessionXp(): number {
    return this.xpEarned;
  }

  protected get sessionAccuracy(): number {
    const total = this.queue().length;
    return total > 0 ? Math.round((this.correctCount / total) * 100) : 0;
  }
}
