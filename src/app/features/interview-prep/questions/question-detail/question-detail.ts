import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { InterviewQuestionService } from '../../../../core/services/interview-question.service';
import { InterviewProgressService } from '../../../../core/services/interview-progress.service';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-interview-question-detail',
  standalone: true,
  imports: [RouterLink, EmptyStateComponent],
  templateUrl: './question-detail.html',
  styleUrl: './question-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly questionService = inject(InterviewQuestionService);
  protected readonly progress = inject(InterviewProgressService);

  protected readonly question = computed(() =>
    this.questionService.getById(this.route.snapshot.paramMap.get('id') ?? ''),
  );

  protected readonly myAnswer = signal(this.progress.answerFor(this.route.snapshot.paramMap.get('id') ?? '')?.answerText ?? '');
  protected readonly saved = signal(false);

  protected setAnswer(value: string): void {
    this.myAnswer.set(value);
    this.saved.set(false);
  }

  protected save(): void {
    const question = this.question();
    if (!question || !this.myAnswer().trim()) return;
    this.progress.saveAnswer(question.id, this.myAnswer(), 'practice');
    this.saved.set(true);
  }
}
