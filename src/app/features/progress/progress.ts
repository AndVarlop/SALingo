import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { UserStateService } from '../../core/services/user-state.service';
import { VocabularyService } from '../../core/services/vocabulary.service';
import { AdvancedAnalyticsService } from '../../core/services/advanced-analytics.service';
import { SKILL_ICON, SKILL_LABEL } from '../../core/models/skill.model';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card';
import { ProgressBarComponent } from '../../shared/components/progress-bar/progress-bar';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';

interface DayBar {
  label: string;
  xp: number;
  heightPercent: number;
  isToday: boolean;
}

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [DecimalPipe, StatCardComponent, ProgressBarComponent, EmptyStateComponent],
  templateUrl: './progress.html',
  styleUrl: './progress.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressComponent {
  protected readonly userState = inject(UserStateService);
  private readonly vocabularyService = inject(VocabularyService);
  protected readonly weeklyReport = inject(AdvancedAnalyticsService).weeklyReport;

  protected readonly skillIcon = SKILL_ICON;
  protected readonly skillLabel = SKILL_LABEL;

  protected readonly languageProgress = this.userState.currentLanguageProgress;
  protected readonly wordsLearnedCount = computed(
    () => this.vocabularyService.words().filter((w) => w.masteryPercent >= 60).length,
  );

  /** Last 14 days of XP, oldest first, padded with zero-days that have no activity row yet. */
  protected readonly xpByDay = computed<DayBar[]>(() => {
    const byDate = new Map(this.userState.progress().activityByDate.map((a) => [a.date, a]));
    const todayIso = new Date().toISOString().slice(0, 10);

    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      const iso = d.toISOString().slice(0, 10);
      const entry = byDate.get(iso);
      return {
        date: iso,
        label: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
        xp: entry?.xpEarned ?? 0,
        isToday: iso === todayIso,
      };
    });

    const maxXp = Math.max(1, ...days.map((d) => d.xp));
    return days.map((d) => ({
      label: d.label,
      xp: d.xp,
      heightPercent: Math.max(4, Math.round((d.xp / maxXp) * 100)),
      isToday: d.isToday,
    }));
  });

  protected readonly totalXpLast14Days = computed(() => this.xpByDay().reduce((sum, d) => sum + d.xp, 0));
  protected readonly hasAnyActivity = computed(() => this.userState.progress().activityLog.length > 0);

  /** "+20%", "-5%", "New" (no last-week baseline) or null (nothing to compare). */
  protected trendLabel(thisWeek: number | null, lastWeek: number | null): string | null {
    if (thisWeek === null) return null;
    if (lastWeek === null || lastWeek === 0) return thisWeek > 0 ? 'New' : null;
    const change = Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
    return `${change >= 0 ? '+' : ''}${change}%`;
  }
}
