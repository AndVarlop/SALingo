import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AiAnswerBuilderService } from '../../../core/services/ai-answer-builder.service';
import { InterviewProgressService } from '../../../core/services/interview-progress.service';
import { InterviewQuestionService } from '../../../core/services/interview-question.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-answer-builder',
  standalone: true,
  imports: [RouterLink, EmptyStateComponent],
  templateUrl: './answer-builder.html',
  styleUrl: './answer-builder.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnswerBuilderComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly aiAnswerBuilder = inject(AiAnswerBuilderService);
  private readonly progress = inject(InterviewProgressService);
  private readonly questionService = inject(InterviewQuestionService);

  protected readonly questionId = this.route.snapshot.paramMap.get('id') ?? 'iq-tell-me-about-yourself';
  protected readonly question = computed(() => this.questionService.getById(this.questionId));

  /** One text note per step of this question's structure — works for any question, not just one hardcoded form. */
  protected readonly stepNotes = signal<string[]>(
    (this.questionService.getById(this.questionId)?.structure ?? []).map(() => ''),
  );

  protected readonly draft = signal('');
  protected readonly saved = signal(false);

  protected setStepNote(index: number, value: string): void {
    this.stepNotes.update((notes) => notes.map((n, i) => (i === index ? value : n)));
  }

  protected generateDraft(): void {
    const suggestion = this.aiAnswerBuilder.buildAnswer(this.stepNotes());
    this.draft.set(suggestion);
    this.saved.set(false);
  }

  protected setDraft(value: string): void {
    this.draft.set(value);
    this.saved.set(false);
  }

  protected saveAnswer(): void {
    if (!this.draft().trim()) return;
    this.progress.saveAnswer(this.questionId, this.draft(), 'answer-builder');
    this.saved.set(true);
  }

  protected goToQuestion(): void {
    this.router.navigate(['/interview-prep/questions', this.questionId]);
  }
}
