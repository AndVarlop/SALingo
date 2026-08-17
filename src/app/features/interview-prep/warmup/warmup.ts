import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { InterviewQuestionService } from '../../../core/services/interview-question.service';
import { UserStateService } from '../../../core/services/user-state.service';
import { XP_RULES } from '../../../core/constants/xp.constant';

interface WarmupStep {
  prompt: string;
}

/**
 * Spec section 20: a quick 5-prompt speaking warm-up before an interview.
 * No scoring, no pressure — just gets the user talking in English before
 * the real thing. Reuses InterviewQuestionService for the last, randomized
 * prompt instead of hardcoding a fifth question.
 */
@Component({
  selector: 'app-warmup',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './warmup.html',
  styleUrl: './warmup.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WarmupComponent {
  private readonly questionService = inject(InterviewQuestionService);
  private readonly userState = inject(UserStateService);

  protected readonly steps = computed<WarmupStep[]>(() => {
    const pool = this.questionService.questions;
    const random = pool[Math.floor(Math.random() * pool.length)];
    return [
      { prompt: 'Introduce yourself in English.' },
      { prompt: 'Explain your work experience (or your studies, if you have no experience yet).' },
      { prompt: 'Explain why you want this job.' },
      { prompt: 'Describe a difficult customer situation and how you would handle it.' },
      { prompt: random?.question ?? 'What are your strengths?' },
    ];
  });

  protected readonly index = signal(0);
  protected readonly done = computed(() => this.index() >= this.steps().length);
  protected readonly currentStep = computed(() => this.steps()[this.index()] ?? null);

  protected next(): void {
    if (this.index() < this.steps().length) {
      this.index.update((i) => i + 1);
    }
    if (this.done()) {
      this.userState.recordActivity({
        minutes: 5,
        xp: XP_RULES.reviewCorrect,
        type: 'speaking',
        title: '5-Minute Speaking Warm-up',
      });
    }
  }

  protected restart(): void {
    this.index.set(0);
  }
}
