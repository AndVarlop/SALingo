import { ChangeDetectionStrategy, Component, OnDestroy, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MOCK_GRAMMAR_TOPICS } from '../../core/services/mock-data/mock-grammar.data';
import { CareerCoachService } from '../../core/services/career-coach.service';
import { UserStateService } from '../../core/services/user-state.service';
import { XP_RULES } from '../../core/constants/xp.constant';
import { ExerciseType, MultipleChoiceExercise } from '../../core/models';

interface BattleQuestion {
  topicId: string;
  exercise: MultipleChoiceExercise;
}

type Phase = 'idle' | 'playing' | 'result';

const ROUND_SECONDS = 12;
const MAX_QUESTIONS = 10;

/**
 * Grammar Battle: timed multiple-choice against the clock, with a streak
 * multiplier. Zero new content — pulls the multiple-choice exercises
 * already authored for every grammar topic (mock-grammar.data.ts) and, if
 * the Skill Engine has detected a weak grammar tag, opens with questions
 * from that topic first (same "pull from real data, prioritize the real
 * weakness" pattern as the rest of the app — no fabricated difficulty).
 */
@Component({
  selector: 'app-grammar-battle',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './grammar-battle.html',
  styleUrl: './grammar-battle.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GrammarBattleComponent implements OnDestroy {
  private readonly careerCoach = inject(CareerCoachService);
  private readonly userState = inject(UserStateService);

  protected readonly phase = signal<Phase>('idle');
  protected readonly questions = signal<BattleQuestion[]>([]);
  protected readonly index = signal(0);
  protected readonly timeLeft = signal(ROUND_SECONDS);
  protected readonly streak = signal(0);
  protected readonly bestStreak = signal(0);
  protected readonly score = signal(0);
  protected readonly xpEarned = signal(0);
  protected readonly selectedIndex = signal<number | null>(null);
  protected readonly feedback = signal<'correct' | 'wrong' | 'timeout' | null>(null);

  protected readonly focusTopicLabel = () => {
    const tag = this.careerCoach
      .weakestSkillTags()
      .find((t) => t.tag.startsWith('grammar:'));
    return tag?.label ?? null;
  };

  protected readonly currentQuestion = () => this.questions()[this.index()] ?? null;

  private timerHandle: ReturnType<typeof setInterval> | null = null;
  private topicsPlayed: string[] = [];

  protected start(): void {
    const pool = this.buildPool();
    this.questions.set(pool);
    this.index.set(0);
    this.streak.set(0);
    this.bestStreak.set(0);
    this.score.set(0);
    this.xpEarned.set(0);
    this.topicsPlayed = [];
    this.phase.set('playing');
    this.startRound();
  }

  private buildPool(): BattleQuestion[] {
    const all: BattleQuestion[] = [];
    for (const topic of MOCK_GRAMMAR_TOPICS) {
      for (const exercise of topic.exercises) {
        if (exercise.type === ExerciseType.MultipleChoice) {
          all.push({ topicId: topic.id, exercise });
        }
      }
    }

    const weakTag = this.careerCoach.weakestSkillTags().find((t) => t.tag.startsWith('grammar:'));
    const weakTopicId = weakTag?.tag.split(':')[1];
    const prioritized = weakTopicId ? all.filter((q) => q.topicId === weakTopicId) : [];
    const rest = all.filter((q) => !prioritized.includes(q)).sort(() => Math.random() - 0.5);

    return [...prioritized, ...rest].slice(0, MAX_QUESTIONS);
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

    const question = this.currentQuestion();
    if (!question) return;
    this.topicsPlayed.push(question.topicId);

    const correct = optionIndex === question.exercise.correctOptionIndex;
    if (correct) {
      this.streak.update((s) => s + 1);
      this.bestStreak.update((b) => Math.max(b, this.streak()));
      const streakBonus = Math.min(this.streak() * 2, 20);
      const roundXp = XP_RULES.correctExercise + streakBonus;
      this.xpEarned.update((x) => x + roundXp);
      this.score.update((s) => s + 1);
      this.feedback.set('correct');
    } else {
      this.streak.set(0);
      this.xpEarned.update((x) => x + XP_RULES.incorrectExercise);
      this.feedback.set('wrong');
    }

    setTimeout(() => this.nextQuestion(), 900);
  }

  private onTimeout(): void {
    this.stopTimer();
    if (this.selectedIndex() !== null) return;
    const question = this.currentQuestion();
    if (question) this.topicsPlayed.push(question.topicId);
    this.streak.set(0);
    this.feedback.set('timeout');
    setTimeout(() => this.nextQuestion(), 900);
  }

  private nextQuestion(): void {
    if (this.index() + 1 >= this.questions().length) {
      this.finish();
    } else {
      this.index.update((i) => i + 1);
      this.startRound();
    }
  }

  private finish(): void {
    this.stopTimer();
    const total = this.questions().length;
    const accuracy = total > 0 ? Math.round((this.score() / total) * 100) : 0;

    this.userState.recordActivity({
      minutes: 1,
      xp: this.xpEarned(),
      type: 'grammar',
      title: `Grammar Battle — ${this.score()}/${total}`,
      accuracy,
      skillTag: `grammar:${this.dominantTopic()}`,
    });

    this.phase.set('result');
  }

  private dominantTopic(): string {
    const counts: Record<string, number> = {};
    for (const id of this.topicsPlayed) counts[id] = (counts[id] ?? 0) + 1;
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
