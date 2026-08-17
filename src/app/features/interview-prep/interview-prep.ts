import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { InterviewProgressService } from '../../core/services/interview-progress.service';
import { InterviewQuestionService } from '../../core/services/interview-question.service';
import { InterviewSessionService } from '../../core/services/interview-session.service';
import { CEFR_LEVEL_ORDER, CefrLevel, INTERVIEW_POSITION_LABEL, InterviewPosition } from '../../core/models';
import { ProgressRingComponent } from '../../shared/components/progress-ring/progress-ring';
import { ProgressBarComponent } from '../../shared/components/progress-bar/progress-bar';

@Component({
  selector: 'app-interview-prep',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, ProgressRingComponent, ProgressBarComponent],
  templateUrl: './interview-prep.html',
  styleUrl: './interview-prep.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InterviewPrepComponent {
  protected readonly progress = inject(InterviewProgressService);
  protected readonly sessionService = inject(InterviewSessionService);
  private readonly questionService = inject(InterviewQuestionService);
  private readonly fb = inject(FormBuilder);

  /** Combines question/vocab readiness with real Mock Interview results, once any exist. */
  protected readonly overallReadiness = computed(() => {
    const base = this.progress.readiness();
    const interviewScore = this.sessionService.bestScore();
    if (this.sessionService.sessionCount() === 0) return base.overall;
    return Math.round(base.overall * 0.7 + interviewScore * 0.3);
  });

  protected readonly positions = Object.values(InterviewPosition);
  protected readonly positionLabel = INTERVIEW_POSITION_LABEL;
  protected readonly levels = CEFR_LEVEL_ORDER;

  protected readonly submitting = signal(false);

  protected readonly onboardingForm = this.fb.nonNullable.group({
    targetPosition: this.fb.control<InterviewPosition | null>(null),
    hasExperience: ['no', Validators.required],
    englishLevel: ['A2', Validators.required],
    struggleArea: [''],
    interviewDate: [''],
  });

  protected readonly nextQuestion = computed(() =>
    this.questionService.getNextRecommended(this.progress.profile().targetPosition),
  );

  protected async submitOnboarding(): Promise<void> {
    if (this.onboardingForm.invalid) {
      this.onboardingForm.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    const raw = this.onboardingForm.getRawValue();
    try {
      await this.progress.completeOnboarding({
        targetPosition: raw.targetPosition,
        hasExperience: raw.hasExperience === 'yes',
        englishLevel: raw.englishLevel as CefrLevel,
        struggleArea: raw.struggleArea,
        interviewDate: raw.interviewDate || null,
      });
    } finally {
      this.submitting.set(false);
    }
  }
}
