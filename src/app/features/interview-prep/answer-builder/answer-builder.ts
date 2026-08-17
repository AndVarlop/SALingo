import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AiAnswerBuilderService } from '../../../core/services/ai-answer-builder.service';
import { InterviewProgressService } from '../../../core/services/interview-progress.service';

@Component({
  selector: 'app-answer-builder',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './answer-builder.html',
  styleUrl: './answer-builder.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnswerBuilderComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly aiAnswerBuilder = inject(AiAnswerBuilderService);
  private readonly progress = inject(InterviewProgressService);
  private readonly fb = inject(FormBuilder);

  protected readonly questionId = this.route.snapshot.paramMap.get('id') ?? 'iq-tell-me-about-yourself';

  protected readonly form = this.fb.nonNullable.group({
    name: [''],
    whatYouDo: [''],
    hasExperience: ['no'],
    strongestSkills: [''],
    whyThisJob: [''],
  });

  protected readonly draft = signal('');
  protected readonly saved = signal(false);

  protected generateDraft(): void {
    const raw = this.form.getRawValue();
    const suggestion = this.aiAnswerBuilder.buildTellMeAboutYourself({
      name: raw.name,
      whatYouDo: raw.whatYouDo,
      hasExperience: raw.hasExperience === 'yes',
      strongestSkills: raw.strongestSkills,
      whyThisJob: raw.whyThisJob,
    });
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
