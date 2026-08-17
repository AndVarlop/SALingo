import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { GrammarService } from '../../../core/services/grammar.service';
import { UserStateService } from '../../../core/services/user-state.service';
import { XP_RULES } from '../../../core/constants/xp.constant';
import { ExerciseResult } from '../../../core/models';
import { ExercisePlayerComponent } from '../../lessons/exercise-player/exercise-player';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';

type Phase = 'intro' | 'test' | 'summary';

@Component({
  selector: 'app-grammar-detail',
  standalone: true,
  imports: [RouterLink, ExercisePlayerComponent, EmptyStateComponent],
  templateUrl: './grammar-detail.html',
  styleUrl: './grammar-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GrammarDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly grammarService = inject(GrammarService);
  private readonly userState = inject(UserStateService);

  protected readonly topic = computed(() =>
    this.grammarService.getById(this.route.snapshot.paramMap.get('id') ?? ''),
  );

  protected readonly phase = signal<Phase>('intro');
  protected readonly lastScore = signal(0);
  protected readonly lastXp = signal(0);

  protected startTest(): void {
    this.phase.set('test');
  }

  protected onFinished(payload: { results: ExerciseResult[]; xpEarned: number }): void {
    const topic = this.topic();
    if (!topic) return;

    const correctCount = payload.results.filter((r) => r.correct).length;
    const score = Math.round((correctCount / payload.results.length) * 100);
    const xp = payload.xpEarned + (score === 100 ? XP_RULES.perfectLessonBonus : 0);
    const minutes = Math.max(
      1,
      Math.round(payload.results.reduce((sum, r) => sum + r.timeSpentSeconds, 0) / 60),
    );

    this.grammarService.recordAttempt(topic.id, score);
    this.userState.recordActivity({
      minutes,
      xp,
      type: 'grammar',
      title: `Completed "${topic.title}" grammar test`,
      accuracy: score,
    });

    this.lastScore.set(score);
    this.lastXp.set(xp);
    this.phase.set('summary');
  }

  protected backToGrammar(): void {
    this.router.navigate(['/grammar']);
  }
}
