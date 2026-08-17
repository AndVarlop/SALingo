import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
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
}
