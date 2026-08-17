import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MOCK_INTERVIEW_SCENARIOS } from '../../../core/services/mock-data/mock-interview-scenarios.data';
import { MOCK_DIFFICULT_CUSTOMER_TIPS } from '../../../core/services/mock-data/mock-difficult-customers.data';
import { UserStateService } from '../../../core/services/user-state.service';
import { InterviewSessionService } from '../../../core/services/interview-session.service';
import { ExerciseResult } from '../../../core/models';
import { ExercisePlayerComponent } from '../../lessons/exercise-player/exercise-player';

type Tab = 'scenarios' | 'difficult';
type Phase = 'idle' | 'playing' | 'summary';

@Component({
  selector: 'app-interview-scenarios',
  standalone: true,
  imports: [ExercisePlayerComponent],
  templateUrl: './scenarios.html',
  styleUrl: './scenarios.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InterviewScenariosComponent {
  private readonly userState = inject(UserStateService);
  private readonly sessionService = inject(InterviewSessionService);

  protected readonly tab = signal<Tab>('scenarios');
  protected readonly phase = signal<Phase>('idle');

  protected readonly exercises = MOCK_INTERVIEW_SCENARIOS;
  protected readonly tips = MOCK_DIFFICULT_CUSTOMER_TIPS;

  protected readonly lastAccuracy = signal(0);
  protected readonly lastXp = signal(0);

  protected start(): void {
    this.phase.set('playing');
  }

  protected async onFinished(payload: { results: ExerciseResult[]; xpEarned: number }): Promise<void> {
    const correctCount = payload.results.filter((r) => r.correct).length;
    const accuracy = Math.round((correctCount / payload.results.length) * 100);
    const minutes = Math.max(
      1,
      Math.round(payload.results.reduce((sum, r) => sum + r.timeSpentSeconds, 0) / 60),
    );

    this.userState.recordActivity({
      minutes,
      xp: payload.xpEarned,
      type: 'interview',
      title: 'Practiced customer service scenarios',
      accuracy,
    });
    await this.sessionService.saveScenarioSession(accuracy);

    this.lastAccuracy.set(accuracy);
    this.lastXp.set(payload.xpEarned);
    this.phase.set('summary');
  }

  protected reset(): void {
    this.phase.set('idle');
  }
}
