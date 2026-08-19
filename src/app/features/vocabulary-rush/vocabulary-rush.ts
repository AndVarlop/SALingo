import { ChangeDetectionStrategy, Component, OnDestroy, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { VocabularyService } from '../../core/services/vocabulary.service';
import { UserStateService } from '../../core/services/user-state.service';
import { XP_RULES } from '../../core/constants/xp.constant';
import { VocabularyWord } from '../../core/models';

interface RushRound {
  word: VocabularyWord;
  options: string[]; // translations
  correctIndex: number;
}

type Phase = 'idle' | 'playing' | 'result';

const ROUND_SECONDS = 8;
const MAX_ROUNDS = 12;

/**
 * Vocabulary Rush: match the English word to its translation before the
 * clock runs out. Zero new content — pulls straight from
 * VocabularyService.words() (already Supabase-backed, ~107 words across
 * general + call-center vocab), generating wrong-answer options from other
 * real words in the pool instead of inventing distractors.
 */
@Component({
  selector: 'app-vocabulary-rush',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './vocabulary-rush.html',
  styleUrl: './vocabulary-rush.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VocabularyRushComponent implements OnDestroy {
  private readonly vocabulary = inject(VocabularyService);
  private readonly userState = inject(UserStateService);

  protected readonly phase = signal<Phase>('idle');
  protected readonly rounds = signal<RushRound[]>([]);
  protected readonly index = signal(0);
  protected readonly timeLeft = signal(ROUND_SECONDS);
  protected readonly streak = signal(0);
  protected readonly bestStreak = signal(0);
  protected readonly score = signal(0);
  protected readonly xpEarned = signal(0);
  protected readonly selectedIndex = signal<number | null>(null);
  protected readonly feedback = signal<'correct' | 'wrong' | 'timeout' | null>(null);

  protected readonly hasEnoughWords = () => this.vocabulary.words().length >= 4;
  protected readonly currentRound = () => this.rounds()[this.index()] ?? null;

  private timerHandle: ReturnType<typeof setInterval> | null = null;
  private categoriesPlayed: string[] = [];

  protected start(): void {
    this.rounds.set(this.buildRounds());
    this.index.set(0);
    this.streak.set(0);
    this.bestStreak.set(0);
    this.score.set(0);
    this.xpEarned.set(0);
    this.categoriesPlayed = [];
    this.phase.set('playing');
    this.startRound();
  }

  private buildRounds(): RushRound[] {
    const words = [...this.vocabulary.words()].sort(() => Math.random() - 0.5).slice(0, MAX_ROUNDS);
    const allTranslations = this.vocabulary.words().map((w) => w.translation);

    return words.map((word) => {
      const distractorPool = allTranslations.filter((t) => t !== word.translation);
      const distractors = this.pickRandom(distractorPool, 3);
      const options = [word.translation, ...distractors].sort(() => Math.random() - 0.5);
      return { word, options, correctIndex: options.indexOf(word.translation) };
    });
  }

  private pickRandom(pool: string[], count: number): string[] {
    const unique = [...new Set(pool)];
    const shuffled = unique.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  private startRound(): void {
    this.selectedIndex.set(null);
    this.feedback.set(null);
    this.timeLeft.set(ROUND_SECONDS);
    this.stopTimer();
    this.timerHandle = setInterval(() => {
      this.timeLeft.update((t) => t - 1);
      if (this.timeLeft() <= 0) this.onTimeout();
    }, 1000);
  }

  protected selectAnswer(optionIndex: number): void {
    if (this.selectedIndex() !== null) return;
    this.stopTimer();
    this.selectedIndex.set(optionIndex);

    const round = this.currentRound();
    if (!round) return;
    this.categoriesPlayed.push(round.word.category);

    if (optionIndex === round.correctIndex) {
      this.streak.update((s) => s + 1);
      this.bestStreak.update((b) => Math.max(b, this.streak()));
      const streakBonus = Math.min(this.streak() * 2, 20);
      this.xpEarned.update((x) => x + XP_RULES.reviewCorrect + streakBonus);
      this.score.update((s) => s + 1);
      this.feedback.set('correct');
      setTimeout(() => this.nextRound(), 800);
    } else {
      this.streak.set(0);
      this.xpEarned.update((x) => x + XP_RULES.incorrectExercise);
      this.feedback.set('wrong');
      // Longer pause than a correct answer — long enough to read the word's example sentence, per spec §20.
      setTimeout(() => this.nextRound(), 3000);
    }
  }

  private onTimeout(): void {
    this.stopTimer();
    if (this.selectedIndex() !== null) return;
    const round = this.currentRound();
    if (round) this.categoriesPlayed.push(round.word.category);
    this.streak.set(0);
    this.feedback.set('timeout');
    setTimeout(() => this.nextRound(), 3000);
  }

  private nextRound(): void {
    if (this.index() + 1 >= this.rounds().length) {
      this.finish();
    } else {
      this.index.update((i) => i + 1);
      this.startRound();
    }
  }

  private finish(): void {
    this.stopTimer();
    const total = this.rounds().length;
    const accuracy = total > 0 ? Math.round((this.score() / total) * 100) : 0;

    this.userState.recordActivity({
      minutes: 1,
      xp: this.xpEarned(),
      type: 'review',
      title: `Vocabulary Rush — ${this.score()}/${total}`,
      accuracy,
      skillTag: `vocab:${this.dominantCategory()}`,
    });

    this.phase.set('result');
  }

  private dominantCategory(): string {
    const counts: Record<string, number> = {};
    for (const c of this.categoriesPlayed) counts[c] = (counts[c] ?? 0) + 1;
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return entries[0]?.[0] ?? 'mixed';
  }

  protected playAgain(): void {
    this.phase.set('idle');
  }

  private stopTimer(): void {
    if (this.timerHandle) {
      clearInterval(this.timerHandle);
      this.timerHandle = null;
    }
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }
}
