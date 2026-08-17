import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  CANDIDATE_QUESTIONS,
  NO_EXPERIENCE_SOURCES,
  PRE_INTERVIEW_CHECKLIST,
  STAR_STEPS,
} from '../../../core/services/mock-data/mock-interview-tips.data';
import { InterviewTipsService } from '../../../core/services/interview-tips.service';

type Tab = 'star' | 'no-experience' | 'checklist' | 'ask-them';

@Component({
  selector: 'app-interview-tips',
  standalone: true,
  templateUrl: './tips.html',
  styleUrl: './tips.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InterviewTipsComponent {
  private readonly tipsService = inject(InterviewTipsService);

  protected readonly tab = signal<Tab>('star');
  protected readonly starSteps = STAR_STEPS;
  protected readonly noExperienceSources = NO_EXPERIENCE_SOURCES;
  protected readonly checklist = PRE_INTERVIEW_CHECKLIST;
  protected readonly candidateQuestions = CANDIDATE_QUESTIONS;

  protected toggleChecklistItem(index: number): void {
    this.tipsService.toggle(index);
  }

  protected isChecked(index: number): boolean {
    return this.tipsService.checkedIndices().has(index);
  }
}
