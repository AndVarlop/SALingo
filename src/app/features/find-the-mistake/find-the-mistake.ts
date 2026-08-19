import { ChangeDetectionStrategy, Component, OnDestroy, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  DetectedMistake,
  MISTAKE_EXAMPLE_SENTENCES,
  MistakeDetectionService,
} from '../../core/services/mistake-detection.service';
import { MistakeMemoryService } from '../../core/services/mistake-memory.service';
import { UserStateService } from '../../core/services/user-state.service';
import { XP_RULES } from '../../core/constants/xp.constant';

interface FtmRound {
  text: string;
  isCorrect: boolean;
  mistake: DetectedMistake | null;
  corrected: string;
}

type Phase = 'idle' | 'playing' | 'result';
type Answer = 'correct' | 'has-mistake';

const ROUND_SECONDS = 12;
const MAX_ROUNDS = 10;

/**
 * Find the Mistake: shown one sentence at a time, decide if it's correct or
 * has a mistake. Zero new mistake content — every sentence comes from
 * MistakeDetectionService.detect() run against MISTAKE_EXAMPLE_SENTENCES,
 * so the "wrong" and "correct" versions of each round are the same rules
 * that power AI Tutor / Writing / Mock Interview corrections. Missed
 * mistakes get recorded into Mistake Memory, same as everywhere else.
 */
@Component({
  selector: 'app-find-the-mistake',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './find-the-mistake.html',
  styleUrl: './find-the-mistake.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FindTheMistakeComponent implements OnDestroy {
  private readonly mistakeDetection = inject(MistakeDetectionService);
  private readonly mistakeMemory = inject(MistakeMemoryService);
  private readonly userState = inject(UserStateService);

  protected readonly phase = signal<Phase>('idle');
  protected readonly rounds = signal<FtmRound[]>([]);
  protected readonly index = signal(0);
  protected readonly timeLeft = signal(ROUND_SECONDS);
  protected readonly streak = signal(0);
  protected readonly bestStreak = signal(0);
  protected readonly score = signal(0);
  protected readonly xpEarned = signal(0);
  protected readonly answered = signal<Answer | null>(null);
  protected readonly feedback = signal<'correct' | 'wrong' | 'timeout' | null>(null);

  protected readonly currentRound = () => this.rounds()[this.index()] ?? null;

  private timerHandle: ReturnType<typeof setInterval> | null = null;
  private categoriesPlayed: string[] = [];
  private missedMistakes: DetectedMistake[] = [];

  protected start(): void {
    this.rounds.set(this.buildRounds());
    this.index.set(0);
    this.streak.set(0);
    this.bestStreak.set(0);
    this.score.set(0);
    this.xpEarned.set(0);
    this.categoriesPlayed = [];
    this.missedMistakes = [];
    this.phase.set('playing');
    this.startRound();
  }

  private buildRounds(): FtmRound[] {
    const built: FtmRound[] = [];
    for (const sentence of MISTAKE_EXAMPLE_SENTENCES) {
      const detected = this.mistakeDetection.detect(sentence);
      if (!detected.length) continue;
      const mistake = detected.reduce((longest, m) =>
        m.wrong.length > longest.wrong.length ? m : longest,
      );
      const corrected = this.applyCorrection(sentence, mistake);
      built.push({ text: sentence, isCorrect: false, mistake, corrected });
      built.push({ text: corrected, isCorrect: true, mistake: null, corrected });
    }
    return built.sort(() => Math.random() - 0.5).slice(0, MAX_ROUNDS);
  }

  private applyCorrection(text: string, mistake: DetectedMistake): string {
    const escaped = mistake.wrong.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp(escaped, 'i'), mistake.correct);
  }

  private startRound(): void {
    this.answered.set(null);
    this.feedback.set(null);
    this.timeLeft.set(ROUND_SECONDS);
    this.stopTimer();
    this.timerHandle = setInterval(() => {
      this.timeLeft.update((t) => t - 1);
      if (this.timeLeft() <= 0) this.onTimeout();
    }, 1000);
  }

  protected async answer(choice: Answer): Promise<void> {
    if (this.answered() !== null) return;
    this.stopTimer();
    this.answered.set(choice);

    const round = this.currentRound();
    if (!round) return;
    if (round.mistake) this.categoriesPlayed.push(round.mistake.category);

    const userSaysCorrect = choice === 'correct';
    const isRight = userSaysCorrect === round.isCorrect;

    if (isRight) {
      this.streak.update((s) => s + 1);
      this.bestStreak.update((b) => Math.max(b, this.streak()));
      const streakBonus = Math.min(this.streak() * 2, 20);
      this.xpEarned.update((x) => x + XP_RULES.correctExercise + streakBonus);
      this.score.update((s) => s + 1);
      this.feedback.set('correct');
      setTimeout(() => this.nextRound(), 1400);
    } else {
      this.streak.set(0);
      this.xpEarned.update((x) => x + XP_RULES.incorrectExercise);
      this.feedback.set('wrong');
      if (round.mistake) this.missedMistakes.push(round.mistake);
      // Longer pause than a correct answer — long enough to read the "why" line, per spec §20.
      setTimeout(() => this.nextRound(), 3200);
    }
  }

  private onTimeout(): void {
    this.stopTimer();
    if (this.answered() !== null) return;
    const round = this.currentRound();
    if (round?.mistake) {
      this.categoriesPlayed.push(round.mistake.category);
      this.missedMistakes.push(round.mistake);
    }
    this.streak.set(0);
    this.feedback.set('timeout');
    this.answered.set('correct');
    setTimeout(() => this.nextRound(), 3200);
  }

  private nextRound(): void {
    if (this.index() + 1 >= this.rounds().length) {
      this.finish();
    } else {
      this.index.update((i) => i + 1);
      this.startRound();
    }
  }

  private async finish(): Promise<void> {
    this.stopTimer();
    const total = this.rounds().length;
    const accuracy = total > 0 ? Math.round((this.score() / total) * 100) : 0;

    this.userState.recordActivity({
      minutes: 1,
      xp: this.xpEarned(),
      type: 'grammar',
      title: `Find the Mistake — ${this.score()}/${total}`,
      accuracy,
      skillTag: `${this.dominantSkillPrefix()}:find-the-mistake`,
    });

    if (this.missedMistakes.length) {
      await this.mistakeMemory.recordAll(this.missedMistakes, 'Find the Mistake');
    }

    this.phase.set('result');
  }

  private dominantSkillPrefix(): string {
    const counts: Record<string, number> = {};
    for (const category of this.categoriesPlayed) counts[category] = (counts[category] ?? 0) + 1;
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const category = entries[0]?.[0] ?? 'grammar';
    return category === 'vocabulary' ? 'vocab' : category;
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
