import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MOCK_PLACEMENT_QUESTIONS, PlacementQuestion } from '../../core/services/mock-data/mock-placement-test.data';
import { UserStateService } from '../../core/services/user-state.service';
import { CEFR_LEVEL_LABEL, CefrLevel, ExerciseResult } from '../../core/models';
import { ExercisePlayerComponent } from '../lessons/exercise-player/exercise-player';

type Phase = 'idle' | 'stage1' | 'stage2' | 'result';

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

function byLevel(levels: CefrLevel[]): PlacementQuestion[] {
  return MOCK_PLACEMENT_QUESTIONS.filter((q) => levels.includes(q.level));
}

/** Stage 1 is a fixed calibration round in the middle of the range (not the easiest, not the hardest). */
const STAGE_1_LEVELS: CefrLevel[] = [CefrLevel.A2, CefrLevel.B1];

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

  protected readonly phase = signal<Phase>('idle');
  protected readonly resultLevel = signal<CefrLevel | null>(null);
  protected readonly resultAdvice = signal('');
  protected readonly resultScore = signal(0);

  protected readonly levelLabel = CEFR_LEVEL_LABEL;

  private readonly stage1Questions = byLevel(STAGE_1_LEVELS);
  protected readonly stage1Exercises = this.stage1Questions.map((q) => q.exercise);
  private stage1Results: ExerciseResult[] = [];

  protected stage2Questions: PlacementQuestion[] = [];
  protected readonly stage2Exercises = signal(this.stage2Questions.map((q) => q.exercise));

  protected start(): void {
    this.phase.set('stage1');
  }

  /**
   * Adaptive, spec §7: stage 1 (A2/B1) calibrates roughly where the learner
   * sits, then stage 2 branches to a targeted band instead of marching
   * everyone through every level in a fixed order — a struggling learner
   * never sees C1/C2 questions, and a strong one isn't padded with A1.
   */
  protected onStage1Finished(payload: { results: ExerciseResult[] }): void {
    this.stage1Results = payload.results;
    const correct = payload.results.filter((r) => r.correct).length;
    const accuracy = correct / payload.results.length;

    const nextLevels: CefrLevel[] =
      accuracy < 0.34 ? [CefrLevel.A1] : accuracy <= 0.67 ? [CefrLevel.B2] : [CefrLevel.C1, CefrLevel.C2];

    const stage2 = byLevel(nextLevels);
    this.stage2Questions = stage2;
    this.stage2Exercises.set(stage2.map((q) => q.exercise));
    this.phase.set('stage2');
  }

  protected onStage2Finished(payload: { results: ExerciseResult[] }): void {
    const combined = [...this.stage1Results, ...payload.results];
    const correctCount = combined.filter((r) => r.correct).length;
    const score = Math.round((correctCount / combined.length) * 100);
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
    this.stage1Results = [];
    this.stage2Questions = [];
    this.stage2Exercises.set([]);
    this.phase.set('idle');
  }
}
