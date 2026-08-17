import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
  imports: [RouterLink, FormsModule],
  templateUrl: './preparation-plan.html',
  styleUrl: './preparation-plan.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreparationPlanComponent {
  private readonly questionService = inject(InterviewQuestionService);
  protected readonly interviewProgress = inject(InterviewProgressService);
  private readonly sessionService = inject(InterviewSessionService);

  protected setInterviewDate(value: string): void {
    this.interviewProgress.updateInterviewDate(value || null);
  }

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

  private readonly daysUntilInterview = computed<number | null>(() => {
    const dateStr = this.interviewProgress.profile().interviewDate;
    if (!dateStr) return null;
    return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  });

  /** Which plan to show: 'intensive' (today/tomorrow), 'medium' (2-5 days), or 'standard' (the default 7-day plan / no date set). */
  protected readonly planTier = computed<'intensive' | 'medium' | 'standard'>(() => {
    const days = this.daysUntilInterview();
    if (days === null || days > 5) return 'standard';
    if (days <= 1) return 'intensive';
    return 'medium';
  });

  /** Kept for the template — true when the intensive (today/tomorrow) plan should show. */
  protected readonly isInterviewSoon = computed(() => this.planTier() === 'intensive');
  protected readonly isMediumTerm = computed(() => this.planTier() === 'medium');

  /** For an interview 2-5 days out — more room than the intensive plan, no need to compress into one day, but no reason to spread thin over a full week either. */
  protected readonly mediumPlan = computed<PlanDay[]>(() => {
    const aboutYou = this.questionService.getByCategory('about-you');
    const sessions = this.sessionService.history();
    return [
      {
        day: 1,
        title: 'Foundations',
        description: 'Build your "Tell me about yourself" answer and review the About You questions.',
        icon: '👋',
        routerLink: '/interview-prep/answer-builder/iq-tell-me-about-yourself',
        actionLabel: 'Build your answer',
        completed:
          this.interviewProgress.isPracticed('iq-tell-me-about-yourself') &&
          aboutYou.every((q) => this.interviewProgress.isPracticed(q.id)),
      },
      {
        day: 2,
        title: 'Customer Service & Difficult Customers',
        description: 'Refresh call center vocabulary and practice handling difficult situations.',
        icon: '📞',
        routerLink: '/interview-prep/scenarios',
        actionLabel: 'Explore scenarios',
        completed: this.sessionService.hasCompletedAnyScenarioSession(),
      },
      {
        day: 3,
        title: 'Roleplay Practice',
        description: 'Simulate a couple of real customer calls.',
        icon: '🎭',
        routerLink: '/interview-prep/roleplay',
        actionLabel: 'Start a call',
        completed: this.sessionService.roleplayCount() > 0,
      },
      {
        day: 4,
        title: 'Mock Interview',
        description: 'Take a full guided mock interview with hints and feedback.',
        icon: '🎙️',
        routerLink: '/interview-prep/mock-interview',
        actionLabel: 'Start mock interview',
        completed: sessions.length > 0,
      },
      {
        day: 5,
        title: 'Review your mistakes',
        description: 'Go over recurring errors so they don\'t show up again in the real interview.',
        icon: '🧠',
        routerLink: '/interview-prep/mistakes',
        actionLabel: 'Review mistakes',
        completed: null,
      },
    ];
  });

  protected readonly intensivePlan = computed<PlanDay[]>(() => {
    const sessions = this.sessionService.history();
    return [
      {
        day: 1,
        title: 'Tell me about yourself',
        description: '10 min — build a solid answer for the question you will always get.',
        icon: '👋',
        routerLink: '/interview-prep/answer-builder/iq-tell-me-about-yourself',
        actionLabel: 'Build your answer',
        completed: this.interviewProgress.isPracticed('iq-tell-me-about-yourself'),
      },
      {
        day: 2,
        title: 'Common questions',
        description: '15 min — review the question bank one more time.',
        icon: '💬',
        routerLink: '/interview-prep/questions',
        actionLabel: 'Practice questions',
        completed: null,
      },
      {
        day: 3,
        title: 'Call Center Vocabulary',
        description: '10 min — refresh the key terms and phrases.',
        icon: '📖',
        routerLink: '/interview-prep/vocabulary',
        actionLabel: 'Review vocabulary',
        completed: null,
      },
      {
        day: 4,
        title: 'Customer Service Roleplay',
        description: '15 min — one full call simulation.',
        icon: '📞',
        routerLink: '/interview-prep/roleplay',
        actionLabel: 'Start a call',
        completed: this.sessionService.roleplayCount() > 0,
      },
      {
        day: 5,
        title: 'Mock Interview',
        description: '20 min — one full run to get comfortable with the format.',
        icon: '🎙️',
        routerLink: '/interview-prep/mock-interview',
        actionLabel: 'Start mock interview',
        completed: sessions.length > 0,
      },
      {
        day: 6,
        title: 'Review your mistakes',
        description: '10 min — go over recurring errors one last time.',
        icon: '🧠',
        routerLink: '/interview-prep/mistakes',
        actionLabel: 'Review mistakes',
        completed: null,
      },
      {
        day: 7,
        title: 'Speaking Warm-up',
        description: '5 min — right before the interview, get your English brain switched on.',
        icon: '🔥',
        routerLink: '/interview-prep/warmup',
        actionLabel: 'Start warm-up',
        completed: null,
      },
    ];
  });
}
