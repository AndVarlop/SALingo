import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { InterviewQuestionService } from '../../../core/services/interview-question.service';
import { InterviewProgressService } from '../../../core/services/interview-progress.service';
import { INTERVIEW_CATEGORY_LABEL, InterviewQuestionCategory } from '../../../core/models';
import { BadgeChipComponent } from '../../../shared/components/badge-chip/badge-chip';

const CATEGORIES: InterviewQuestionCategory[] = ['about-you', 'call-center', 'behavioral'];

@Component({
  selector: 'app-interview-questions',
  standalone: true,
  imports: [RouterLink, BadgeChipComponent],
  templateUrl: './questions.html',
  styleUrl: './questions.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InterviewQuestionsComponent {
  private readonly questionService = inject(InterviewQuestionService);
  protected readonly progress = inject(InterviewProgressService);

  protected readonly categories = CATEGORIES;
  protected readonly categoryLabel = INTERVIEW_CATEGORY_LABEL;
  protected readonly activeCategory = signal<InterviewQuestionCategory>('about-you');

  protected questionsForCategory(category: InterviewQuestionCategory) {
    return this.questionService.getByCategory(category);
  }
}
