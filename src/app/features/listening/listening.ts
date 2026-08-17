import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MOCK_LISTENING_EXERCISES } from '../../core/services/mock-data/mock-listening.data';
import { UserStateService } from '../../core/services/user-state.service';
import { ExerciseResult } from '../../core/models';
import { ExercisePlayerComponent } from '../lessons/exercise-player/exercise-player';

type Phase = 'idle' | 'playing' | 'summary';

@Component({
  selector: 'app-listening',
  standalone: true,
  imports: [RouterLink, ExercisePlayerComponent],
  templateUrl: './listening.html',
  styleUrl: './listening.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListeningComponent {
  private readonly userState = inject(UserStateService);

  protected readonly exercises = MOCK_LISTENING_EXERCISES;
  protected readonly phase = signal<Phase>('idle');
  protected readonly lastAccuracy = signal(0);
  protected readonly lastXp = signal(0);

  protected start(): void {
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
      type: 'listening',
      title: 'Listening practice',
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
