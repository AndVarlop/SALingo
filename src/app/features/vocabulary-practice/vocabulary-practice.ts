import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { VocabularyEngineService, VocabularySelection } from '../../core/services/vocabulary-engine.service';
import { VocabularyActivityService } from '../../core/services/vocabulary-activity.service';
import { VocabularyService } from '../../core/services/vocabulary.service';
import { SpacedRepetitionService } from '../../core/services/spaced-repetition.service';
import { UserStateService } from '../../core/services/user-state.service';
import { XP_RULES } from '../../core/constants/xp.constant';
import { ACTIVITY_LABEL, VocabularyQuestion } from '../../core/models/vocabulary-activity.model';
import { CEFR_LEVEL_ORDER, CefrLevel } from '../../core/models';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';

type Phase = 'idle' | 'playing' | 'complete';
type LevelChoice = CefrLevel | 'mixed';

const SESSION_SIZE = 10;

/**
 * Vocabulary Engine practice session (§26): mixes new/review/weak words
 * (VocabularyEngineService) and varies the activity type per word
 * (§12–13), instead of always being "choose the translation" — that's
 * still available separately as Vocabulary Rush.
 */
@Component({
  selector: 'app-vocabulary-practice',
  standalone: true,
  imports: [RouterLink, EmptyStateComponent],
  templateUrl: './vocabulary-practice.html',
  styleUrl: './vocabulary-practice.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VocabularyPracticeComponent {
  private readonly engine = inject(VocabularyEngineService);
  private readonly activities = inject(VocabularyActivityService);
  private readonly vocabulary = inject(VocabularyService);
  private readonly spacedRepetition = inject(SpacedRepetitionService);
  private readonly userState = inject(UserStateService);

  protected readonly loading = this.vocabulary.loading;
  protected readonly levels: LevelChoice[] = ['mixed', ...CEFR_LEVEL_ORDER];
  protected readonly levelChoice = signal<LevelChoice>('mixed');
  protected readonly activityLabel = ACTIVITY_LABEL;

  protected readonly phase = signal<Phase>('idle');
  protected readonly queue = signal<{ selection: VocabularySelection; question: VocabularyQuestion }[]>([]);
  protected readonly index = signal(0);
  protected readonly selectedOption = signal<number | null>(null);
  protected readonly feedback = signal<'correct' | 'wrong' | null>(null);

  private correctCount = 0;
  private xpEarned = 0;
  private sessionStartedAt = 0;

  protected readonly current = computed(() => this.queue()[this.index()] ?? null);
  protected readonly progressLabel = computed(() => `${this.index() + 1} / ${this.queue().length}`);

  protected startSession(): void {
    const level = this.levelChoice() === 'mixed' ? undefined : (this.levelChoice() as CefrLevel);
    const selections = this.engine.buildSession(SESSION_SIZE, level);
    const pool = this.vocabulary.words();

    const items: { selection: VocabularySelection; question: VocabularyQuestion }[] = [];
    for (const selection of selections) {
      const type = this.engine.pickActivityType(selection.word);
      const question =
        this.activities.build(selection.word, type, pool) ??
        this.activities.build(selection.word, 'translation', pool); // guaranteed fallback (§12: every word supports translation)
      if (question) items.push({ selection, question });
    }

    this.queue.set(items);
    this.index.set(0);
    this.selectedOption.set(null);
    this.feedback.set(null);
    this.correctCount = 0;
    this.xpEarned = 0;
    this.sessionStartedAt = Date.now();
    this.phase.set(items.length > 0 ? 'playing' : 'complete');
  }

  protected selectOption(optionIndex: number): void {
    if (this.selectedOption() !== null) return;
    const item = this.current();
    if (!item) return;

    this.selectedOption.set(optionIndex);
    const correct = optionIndex === item.question.correctIndex;
    this.feedback.set(correct ? 'correct' : 'wrong');

    this.spacedRepetition.grade(item.selection.word.id, correct ? 'good' : 'again');
    if (correct) {
      this.correctCount++;
      this.xpEarned += XP_RULES.reviewCorrect;
    } else {
      this.xpEarned += XP_RULES.incorrectExercise;
    }
  }

  protected next(): void {
    this.selectedOption.set(null);
    this.feedback.set(null);
    if (this.index() + 1 >= this.queue().length) {
      this.finish();
    } else {
      this.index.update((i) => i + 1);
    }
  }

  private finish(): void {
    const total = this.queue().length;
    const accuracy = total > 0 ? Math.round((this.correctCount / total) * 100) : 0;
    const minutes = Math.max(1, Math.round((Date.now() - this.sessionStartedAt) / 60_000));

    this.userState.recordActivity({
      minutes,
      xp: this.xpEarned,
      type: 'review',
      title: `Vocabulary Practice — ${this.correctCount}/${total}`,
      accuracy,
      skillTag: this.dominantCategoryTag(),
    });

    this.phase.set('complete');
  }

  private dominantCategoryTag(): string | undefined {
    const counts: Record<string, number> = {};
    for (const item of this.queue()) {
      const cat = item.selection.word.category;
      counts[cat] = (counts[cat] ?? 0) + 1;
    }
    const entries = Object.entries(counts);
    if (!entries.length) return undefined;
    const [dominant] = entries.sort((a, b) => b[1] - a[1]);
    return `vocab:${dominant[0]}`;
  }

  protected playAgain(): void {
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
