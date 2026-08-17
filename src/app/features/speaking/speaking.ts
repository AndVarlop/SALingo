import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MOCK_SPEAKING_EXERCISES } from '../../core/services/mock-data/mock-speaking.data';
import { UserStateService } from '../../core/services/user-state.service';
import { SpeechRecognitionService } from '../../core/services/speech-recognition.service';
import { ExerciseResult } from '../../core/models';
import { ExercisePlayerComponent } from '../lessons/exercise-player/exercise-player';

type Phase = 'idle' | 'playing' | 'summary';

@Component({
  selector: 'app-speaking',
  standalone: true,
  imports: [ExercisePlayerComponent],
  templateUrl: './speaking.html',
  styleUrl: './speaking.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpeakingComponent {
  private readonly userState = inject(UserStateService);
  protected readonly isSupported = inject(SpeechRecognitionService).isSupported;

  protected readonly exercises = MOCK_SPEAKING_EXERCISES;
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
      type: 'speaking',
      title: 'Speaking practice',
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
