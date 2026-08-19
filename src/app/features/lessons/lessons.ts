import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MockLessonService } from '../../core/services/mock-lesson.service';
import { UserStateService } from '../../core/services/user-state.service';
import { CEFR_LEVEL_LABEL, CEFR_LEVEL_ORDER, CefrLevel, LessonSummary } from '../../core/models';
import { ProgressBarComponent } from '../../shared/components/progress-bar/progress-bar';
import { BadgeChipComponent } from '../../shared/components/badge-chip/badge-chip';

@Component({
  selector: 'app-lessons',
  standalone: true,
  imports: [RouterLink, ProgressBarComponent, BadgeChipComponent],
  templateUrl: './lessons.html',
  styleUrl: './lessons.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LessonsComponent {
  private readonly lessonService = inject(MockLessonService);
  protected readonly userState = inject(UserStateService);

  protected readonly levels = CEFR_LEVEL_ORDER;
  protected readonly levelLabel = CEFR_LEVEL_LABEL;

  protected lessonsForLevel(level: CefrLevel): LessonSummary[] {
    return this.lessonService.getByLevel(level);
  }

  protected levelPercent(level: CefrLevel): number {
    return this.lessonService.levelProgressPercent(level);
  }

  protected isUnlocked(lesson: LessonSummary): boolean {
    return this.lessonService.isUnlocked(lesson);
  }

  protected isCompleted(lesson: LessonSummary): boolean {
    return this.userState.currentLanguageProgress().lessonsCompleted.includes(lesson.id);
  }
}
