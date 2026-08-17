import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { JobOutcomeService } from '../../../core/services/job-outcome.service';
import { JobOutcomeType } from '../../../core/models';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';

interface OutcomeOption {
  value: JobOutcomeType;
  label: string;
  icon: string;
}

const OUTCOME_OPTIONS: OutcomeOption[] = [
  { value: 'applied', label: 'Applied', icon: '📤' },
  { value: 'interview_scheduled', label: 'Interview scheduled', icon: '📅' },
  { value: 'interview_completed', label: 'Interview completed', icon: '🎙️' },
  { value: 'rejected', label: 'Rejected', icon: '❌' },
  { value: 'got_offer', label: 'Got an offer', icon: '🎉' },
  { value: 'accepted_job', label: 'Accepted the job', icon: '💼' },
];

@Component({
  selector: 'app-job-outcomes',
  standalone: true,
  imports: [ReactiveFormsModule, EmptyStateComponent],
  templateUrl: './outcomes.html',
  styleUrl: './outcomes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobOutcomesComponent {
  protected readonly outcomeService = inject(JobOutcomeService);
  protected readonly outcomeOptions = OUTCOME_OPTIONS;
  protected readonly optionByValue = Object.fromEntries(OUTCOME_OPTIONS.map((o) => [o.value, o]));

  private readonly fb = inject(FormBuilder);
  protected readonly showForm = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    company: [''],
    position: [''],
    outcome: this.fb.nonNullable.control<JobOutcomeType>('applied'),
    eventDate: [new Date().toISOString().slice(0, 10)],
    notes: [''],
  });

  protected async submit(): Promise<void> {
    const raw = this.form.getRawValue();
    if (!raw.company.trim()) return;

    await this.outcomeService.log({
      company: raw.company.trim(),
      position: raw.position.trim() || null,
      outcome: raw.outcome,
      notes: raw.notes.trim() || null,
      eventDate: raw.eventDate,
    });

    this.form.reset({
      company: '',
      position: '',
      outcome: 'applied',
      eventDate: new Date().toISOString().slice(0, 10),
      notes: '',
    });
    this.showForm.set(false);
  }
}
