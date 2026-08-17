import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CAREER_TRACKS } from '../../../core/services/mock-data/career-tracks.data';
import { MOCK_ROLEPLAY_SCENARIOS } from '../../../core/services/mock-data/mock-roleplay.data';
import { InterviewQuestionService } from '../../../core/services/interview-question.service';
import { InterviewProgressService } from '../../../core/services/interview-progress.service';

@Component({
  selector: 'app-career-tracks',
  standalone: true,
  imports: [],
  templateUrl: './career-tracks.html',
  styleUrl: './career-tracks.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CareerTracksComponent {
  private readonly questionService = inject(InterviewQuestionService);
  private readonly interviewProgress = inject(InterviewProgressService);
  private readonly router = inject(Router);

  protected readonly tracks = CAREER_TRACKS;
  protected readonly currentPosition = () => this.interviewProgress.profile().targetPosition;

  protected questionCountFor(track: (typeof CAREER_TRACKS)[number]): number {
    return this.questionService.forPosition(track.position).length;
  }

  protected roleplayCountFor(track: (typeof CAREER_TRACKS)[number]): number {
    return MOCK_ROLEPLAY_SCENARIOS.filter((s) => track.roleplayCategories.includes(s.category)).length;
  }

  protected async chooseTrack(track: (typeof CAREER_TRACKS)[number]): Promise<void> {
    await this.interviewProgress.updateTargetPosition(track.position);
    this.router.navigateByUrl('/interview-prep');
  }
}
