import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  CANDIDATE_QUESTIONS,
  NO_EXPERIENCE_SOURCES,
  PRE_INTERVIEW_CHECKLIST,
  STAR_STEPS,
} from '../../../core/services/mock-data/mock-interview-tips.data';

type Tab = 'star' | 'no-experience' | 'checklist' | 'ask-them';

@Component({
  selector: 'app-interview-tips',
  standalone: true,
  templateUrl: './tips.html',
  styleUrl: './tips.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InterviewTipsComponent {
  protected readonly tab = signal<Tab>('star');
  protected readonly starSteps = STAR_STEPS;
  protected readonly noExperienceSources = NO_EXPERIENCE_SOURCES;
  protected readonly checklist = PRE_INTERVIEW_CHECKLIST;
  protected readonly candidateQuestions = CANDIDATE_QUESTIONS;

  protected readonly checkedItems = signal<Set<number>>(new Set());

  protected toggleChecklistItem(index: number): void {
    this.checkedItems.update((set) => {
      const next = new Set(set);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  }

  protected isChecked(index: number): boolean {
    return this.checkedItems().has(index);
  }
}
