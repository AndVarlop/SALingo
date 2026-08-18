import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MOCK_READING_EXERCISES } from '../../core/services/mock-data/mock-reading.data';
import { UserStateService } from '../../core/services/user-state.service';
import { CefrLevel, ExerciseResult } from '../../core/models';
import { ExercisePlayerComponent } from '../lessons/exercise-player/exercise-player';
import { LevelFilterComponent } from '../../shared/components';

type Phase = 'idle' | 'playing' | 'summary';

const LEVELS_WITH_CONTENT: CefrLevel[] = [
  CefrLevel.B2,
  CefrLevel.C1,
  CefrLevel.C2,
];

@Component({
  selector: 'app-reading',
  standalone: true,
  imports: [ExercisePlayerComponent, LevelFilterComponent],
  templateUrl: './reading.html',
  styleUrl: './reading.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReadingComponent {
  private readonly userState = inject(UserStateService);

  protected readonly allExercises = MOCK_READING_EXERCISES;
  protected readonly levels = LEVELS_WITH_CONTENT;
  protected readonly selectedLevel = signal<CefrLevel | null>(null);

  protected readonly exercises = computed(() => {
    const level = this.selectedLevel();
    if (level === null) return this.allExercises;
    return this.allExercises.filter((e) => e.level === level);
  });

  protected readonly phase = signal<Phase>('idle');
  protected readonly lastAccuracy = signal(0);
  protected readonly lastXp = signal(0);

  protected setLevel(level: CefrLevel | null): void {
    this.selectedLevel.set(level);
  }

  protected start(): void {
    if (this.exercises().length === 0) return;
    this.phase.set('playing');
  }

  protected onFinished(payload: { results: ExerciseResult[]; xpEarned: number }): void {
    const correctCount = payload.results.filter((r) => r.correct).length;
    const accuracy = Math.round((correctCount / payload.results.length) * 100);
    const minutes = Math.max(
      1,
      Math.round(payload.results.reduce((sum, r) => sum + r.timeSpentSeconds, 0) / 60),
    );

    this.userState.recordActivity({
      minutes,
      xp: payload.xpEarned,
      type: 'reading',
      title: 'Reading practice',
      accuracy,
    });

    this.lastAccuracy.set(accuracy);
    this.lastXp.set(payload.xpEarned);
    this.phase.set('summary');
  }

  protected reset(): void {
    this.phase.set('idle');
  }
}
