import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MockLessonService } from '../../../core/services/mock-lesson.service';
import { UserStateService } from '../../../core/services/user-state.service';
import { XP_RULES } from '../../../core/constants/xp.constant';
import { ExerciseResult } from '../../../core/models';
import { ExercisePlayerComponent } from '../exercise-player/exercise-player';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';

type Phase = 'intro' | 'player' | 'summary';

interface SummaryData {
  correctCount: number;
  incorrectCount: number;
  accuracy: number;
  xpEarned: number;
  timeSpentSeconds: number;
}

@Component({
  selector: 'app-lesson-detail',
  standalone: true,
  imports: [RouterLink, ExercisePlayerComponent, EmptyStateComponent],
  templateUrl: './lesson-detail.html',
  styleUrl: './lesson-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LessonDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly lessonService = inject(MockLessonService);
  private readonly userState = inject(UserStateService);

  protected readonly lesson = computed(() =>
    this.lessonService.getById(this.route.snapshot.paramMap.get('id') ?? ''),
  );

  protected readonly phase = signal<Phase>('intro');
  protected readonly summary = signal<SummaryData | null>(null);

  protected startLesson(): void {
    this.phase.set('player');
  }

  protected onFinished(payload: { results: ExerciseResult[]; xpEarned: number }): void {
    const lesson = this.lesson();
    if (!lesson) return;

    const correctCount = payload.results.filter((r) => r.correct).length;
    const incorrectCount = payload.results.length - correctCount;
    const accuracy = Math.round((correctCount / payload.results.length) * 100);
    const timeSpentSeconds = payload.results.reduce((sum, r) => sum + r.timeSpentSeconds, 0);

    let xpEarned = payload.xpEarned + XP_RULES.lessonCompleteBonus;
    if (accuracy === 100) xpEarned += XP_RULES.perfectLessonBonus;

    this.userState.recordActivity({
      minutes: Math.max(1, Math.round(timeSpentSeconds / 60)),
      xp: xpEarned,
      type: 'lesson',
      title: `Completed "${lesson.title}"`,
      accuracy,
    });
    this.userState.markLessonCompleted(lesson.id);

    this.summary.set({ correctCount, incorrectCount, accuracy, xpEarned, timeSpentSeconds });
    this.phase.set('summary');
  }

  protected backToLessons(): void {
    this.router.navigate(['/lessons']);
  }
}
