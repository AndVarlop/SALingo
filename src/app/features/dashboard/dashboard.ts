import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserStateService } from '../../core/services/user-state.service';
import { MockLessonService } from '../../core/services/mock-lesson.service';
import { RecommendationService } from '../../core/services/recommendation.service';
import { ProgressBarComponent } from '../../shared/components/progress-bar/progress-bar';
import { ProgressRingComponent } from '../../shared/components/progress-ring/progress-ring';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card';
import { StreakCalendarComponent } from '../../shared/components/streak-calendar/streak-calendar';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    DecimalPipe,
    ProgressBarComponent,
    ProgressRingComponent,
    StatCardComponent,
    StreakCalendarComponent,
    EmptyStateComponent,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  protected readonly userState = inject(UserStateService);
  protected readonly lessons = inject(MockLessonService);
  protected readonly recommendations = inject(RecommendationService).recommendations;

  protected readonly firstName = computed(() => this.userState.user().name.split(' ')[0]);
  protected readonly recommendedLesson = computed(() => this.lessons.getRecommendedLesson());
  protected readonly languageProgress = this.userState.currentLanguageProgress;
  protected readonly recentActivity = computed(() =>
    this.userState.progress().activityLog.slice(0, 5),
  );

  protected readonly greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 19) return 'Good afternoon';
    return 'Good evening';
  });
}
