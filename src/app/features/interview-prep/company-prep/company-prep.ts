import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AiJobAnalysisService, JobAnalysisResult } from '../../../core/services/ai-job-analysis.service';
import { INTERVIEW_POSITION_LABEL, InterviewPosition } from '../../../core/models';

@Component({
  selector: 'app-company-prep',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './company-prep.html',
  styleUrl: './company-prep.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyPrepComponent {
  private readonly aiJobAnalysis = inject(AiJobAnalysisService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  protected readonly positions = Object.values(InterviewPosition);
  protected readonly positionLabel = INTERVIEW_POSITION_LABEL;

  protected readonly form = this.fb.nonNullable.group({
    company: [''],
    position: this.fb.control<InterviewPosition | null>(null),
    jobDescription: [''],
  });

  protected readonly analyzing = signal(false);
  protected readonly result = signal<JobAnalysisResult | null>(null);

  protected async analyze(): Promise<void> {
    const { company, jobDescription } = this.form.getRawValue();
    if (!jobDescription.trim()) return;

    this.analyzing.set(true);
    try {
      const analysis = await this.aiJobAnalysis.analyze(company, jobDescription);
      this.result.set(analysis);
    } finally {
      this.analyzing.set(false);
    }
  }

  protected reset(): void {
    this.result.set(null);
  }

  /** Hands the generated questions to Mock Interview via router state — a real
   * personalized session, not just a link back to the generic setup screen. */
  protected startPersonalizedInterview(): void {
    const result = this.result();
    const { company, position } = this.form.getRawValue();
    if (!result) return;

    this.router.navigateByUrl('/interview-prep/mock-interview', {
      state: {
        personalizedQuestions: result.possibleQuestions,
        personalizedCompany: company || null,
        personalizedPosition: position,
      },
    });
  }
}
