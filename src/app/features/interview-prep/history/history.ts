import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { InterviewSessionService } from '../../../core/services/interview-session.service';
import { INTERVIEW_POSITION_LABEL } from '../../../core/models';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-interview-history',
  standalone: true,
  imports: [StatCardComponent, EmptyStateComponent],
  templateUrl: './history.html',
  styleUrl: './history.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InterviewHistoryComponent {
  protected readonly sessionService = inject(InterviewSessionService);
  protected readonly positionLabel = INTERVIEW_POSITION_LABEL;

  protected starsFor(score: number): number {
    return Math.max(1, Math.round(score / 20));
  }

  protected formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  }

  protected formatDuration(seconds: number): string {
    const minutes = Math.round(seconds / 60);
    return minutes < 1 ? '<1 min' : `${minutes} min`;
  }
}
