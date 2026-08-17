import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { InterviewQuestionService } from '../../../core/services/interview-question.service';
import { InterviewProgressService } from '../../../core/services/interview-progress.service';
import { InterviewSessionService } from '../../../core/services/interview-session.service';

interface PlanDay {
  day: number;
  title: string;
  description: string;
  icon: string;
  routerLink: string;
  actionLabel: string;
  completed: boolean | null; // null = not automatically trackable
}

@Component({
  selector: 'app-preparation-plan',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './preparation-plan.html',
  styleUrl: './preparation-plan.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreparationPlanComponent {
  private readonly questionService = inject(InterviewQuestionService);
  private readonly interviewProgress = inject(InterviewProgressService);
  private readonly sessionService = inject(InterviewSessionService);

  protected readonly plan = computed<PlanDay[]>(() => {
    const aboutYou = this.questionService.getByCategory('about-you');
    const callCenter = this.questionService.getByCategory('call-center');
    const sessions = this.sessionService.history();

    return [
      {
        day: 1,
        title: 'Introduction',
        description: 'Learn how interviews work and practice introducing yourself.',
        icon: '👋',
        routerLink: '/interview-prep/answer-builder/iq-tell-me-about-yourself',
        actionLabel: 'Build your answer',
        completed: this.interviewProgress.isPracticed('iq-tell-me-about-yourself'),
      },
      {
        day: 2,
        title: 'Common Questions',
        description: 'Practice the "About You" question bank.',
        icon: '💬',
        routerLink: '/interview-prep/questions',
        actionLabel: 'Practice questions',
        completed: aboutYou.every((q) => this.interviewProgress.isPracticed(q.id)),
      },
      {
        day: 3,
        title: 'Customer Service',
        description: 'Learn call center vocabulary and practice call-center-specific questions.',
        icon: '📞',
        routerLink: '/interview-prep/vocabulary',
        actionLabel: 'Learn vocabulary',
        completed: callCenter.every((q) => this.interviewProgress.isPracticed(q.id)),
      },
      {
        day: 4,
        title: 'Difficult Customers',
        description: 'Learn how to handle angry, confused or demanding customers professionally.',
        icon: '😤',
        routerLink: '/interview-prep/scenarios',
        actionLabel: 'Explore scenarios',
        completed: this.sessionService.hasCompletedAnyScenarioSession(),
      },
      {
        day: 5,
        title: 'Roleplay',
        description: 'Simulate real customer calls, starting easy and working up in difficulty.',
        icon: '🎭',
        routerLink: '/interview-prep/roleplay',
        actionLabel: 'Start roleplay',
        completed: this.sessionService.roleplayCount() > 0,
      },
      {
        day: 6,
        title: 'Mock Interview',
        description: 'Take a full guided mock interview with hints and feedback.',
        icon: '🎙️',
        routerLink: '/interview-prep/mock-interview',
        actionLabel: 'Start mock interview',
        completed: sessions.some((s) => s.mode === 'guided'),
      },
      {
        day: 7,
        title: 'Final Interview',
        description: 'Take a timed Real Interview Mode session — no hints, just like the real thing.',
        icon: '🏁',
        routerLink: '/interview-prep/mock-interview',
        actionLabel: 'Start real interview',
        completed: sessions.some((s) => s.mode === 'real'),
      },
    ];
  });

  protected readonly completedDays = computed(() => this.plan().filter((d) => d.completed === true).length);
}
