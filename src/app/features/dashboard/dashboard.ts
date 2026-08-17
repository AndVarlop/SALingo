import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserStateService } from '../../core/services/user-state.service';
import { CareerCoachService } from '../../core/services/career-coach.service';
import { VocabularyService } from '../../core/services/vocabulary.service';
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
  private readonly careerCoach = inject(CareerCoachService);
  protected readonly recommendedActivities = this.careerCoach.recommendedActivities;
  protected readonly jobReadyScore = this.careerCoach.jobReadyScore;
  protected readonly weaknesses = this.careerCoach.weaknesses;
  private readonly vocabularyService = inject(VocabularyService);

  protected readonly firstName = computed(() => this.userState.user().name.split(' ')[0]);

  /**
   * Adaptive Learning Home: the single best next action, driven entirely by
   * RecommendationService (spaced-repetition due count, next lesson, weakest
   * broad skill, weakest skill *tag* pointing at a specific mini-game,
   * interview readiness) — never a fixed/hardcoded "what to do today".
   * Empty only when there's genuinely nothing to recommend yet (brand-new
   * account with zero activity), never fabricated.
   */
  protected readonly topRecommendation = computed(() => this.recommendedActivities()[0] ?? null);
  protected readonly moreRecommendations = computed(() => this.recommendedActivities().slice(1));

  /** Brand-new account: no lessons finished yet — the best moment to suggest the Placement Test, before they start at a possibly-wrong level. */
  protected readonly isNewToLearning = computed(
    () => this.languageProgress().lessonsCompleted.length === 0,
  );
  protected readonly languageProgress = this.userState.currentLanguageProgress;
  /** Real count — languageProgress().wordsLearned is never written to, so it always reads 0. */
  protected readonly wordsLearnedCount = computed(
    () => this.vocabularyService.words().filter((w) => w.masteryPercent >= 60).length,
  );
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
