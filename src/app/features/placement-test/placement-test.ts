import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MOCK_PLACEMENT_QUESTIONS } from '../../core/services/mock-data/mock-placement-test.data';
import { UserStateService } from '../../core/services/user-state.service';
import { CEFR_LEVEL_LABEL, CefrLevel, ExerciseResult } from '../../core/models';
import { ExercisePlayerComponent } from '../lessons/exercise-player/exercise-player';

type Phase = 'idle' | 'testing' | 'result';

const LEVEL_BY_SCORE: { min: number; level: CefrLevel; advice: string }[] = [
  {
    min: 91,
    level: CefrLevel.C2,
    advice: 'You have an excellent command of English across all areas. Keep challenging yourself with advanced material.',
  },
  {
    min: 76,
    level: CefrLevel.C1,
    advice: 'You have a strong grasp of complex grammar and vocabulary. Focus on nuance, idioms and natural fluency.',
  },
  {
    min: 56,
    level: CefrLevel.B2,
    advice: 'You communicate well and handle most grammar confidently. Keep practicing more complex structures and listening to native speech.',
  },
  {
    min: 36,
    level: CefrLevel.B1,
    advice:
      'You have a good understanding of basic grammar and vocabulary, but you should work more on listening and speaking.',
  },
  {
    min: 21,
    level: CefrLevel.A2,
    advice: 'You know the basics. Keep building your vocabulary and practicing everyday grammar structures.',
  },
  {
    min: 0,
    level: CefrLevel.A1,
    advice: "You're just starting out — that's great! Focus on core vocabulary and simple sentence structures first.",
  },
];

@Component({
  selector: 'app-placement-test',
  standalone: true,
  imports: [ExercisePlayerComponent],
  templateUrl: './placement-test.html',
  styleUrl: './placement-test.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlacementTestComponent {
  private readonly userState = inject(UserStateService);

  protected readonly questions = MOCK_PLACEMENT_QUESTIONS;
  protected readonly exercises = this.questions.map((q) => q.exercise);

  protected readonly phase = signal<Phase>('idle');
  protected readonly resultLevel = signal<CefrLevel | null>(null);
  protected readonly resultAdvice = signal('');
  protected readonly resultScore = signal(0);

  protected readonly levelLabel = CEFR_LEVEL_LABEL;

  protected start(): void {
    this.phase.set('testing');
  }

  protected onFinished(payload: { results: ExerciseResult[] }): void {
    const correctCount = payload.results.filter((r) => r.correct).length;
    const score = Math.round((correctCount / payload.results.length) * 100);
    const tier = LEVEL_BY_SCORE.find((t) => score >= t.min) ?? LEVEL_BY_SCORE[LEVEL_BY_SCORE.length - 1];

    this.resultScore.set(score);
    this.resultLevel.set(tier.level);
    this.resultAdvice.set(tier.advice);
    this.phase.set('result');
  }

  protected applyLevel(): void {
    const level = this.resultLevel();
    if (level) this.userState.updateLevel(level);
  }

  protected retake(): void {
    this.phase.set('idle');
  }
}
