import { ChangeDetectionStrategy, Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { InterviewQuestionService } from '../../../core/services/interview-question.service';
import { InterviewProgressService } from '../../../core/services/interview-progress.service';
import { InterviewSessionService } from '../../../core/services/interview-session.service';
import { AiInterviewEvaluationService, InterviewAnswerEvaluation } from '../../../core/services/ai-interview-evaluation.service';
import { UserStateService } from '../../../core/services/user-state.service';
import { INTERVIEW_POSITION_LABEL, InterviewPosition, InterviewQuestion } from '../../../core/models';

type Phase = 'setup' | 'interviewing' | 'evaluating' | 'result';
type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
type Mode = 'guided' | 'real';

const QUESTION_COUNT_BY_DIFFICULTY: Record<Difficulty, number> = {
  Beginner: 8,
  Intermediate: 10,
  Advanced: 12,
  Expert: 15,
};

const REAL_MODE_SECONDS_PER_QUESTION = 90;

interface AggregateResult {
  overallScore: number;
  confidence: number;
  relevance: number;
  structure: number;
  professionalism: number;
  clarity: number;
  strengths: string[];
  improvements: string[];
  recommendedPractice: string[];
}

@Component({
  selector: 'app-mock-interview',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './mock-interview.html',
  styleUrl: './mock-interview.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MockInterviewComponent implements OnDestroy {
  private readonly questionService = inject(InterviewQuestionService);
  private readonly interviewProgress = inject(InterviewProgressService);
  private readonly sessionService = inject(InterviewSessionService);
  private readonly aiEvaluation = inject(AiInterviewEvaluationService);
  private readonly userState = inject(UserStateService);
  private readonly fb = inject(FormBuilder);

  protected readonly positions = Object.values(InterviewPosition);
  protected readonly positionLabel = INTERVIEW_POSITION_LABEL;
  protected readonly difficulties: Difficulty[] = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

  protected readonly setupForm = this.fb.nonNullable.group({
    position: this.fb.control<InterviewPosition | null>(this.interviewProgress.profile().targetPosition),
    difficulty: this.fb.nonNullable.control<Difficulty>('Beginner'),
    mode: this.fb.nonNullable.control<Mode>('guided'),
  });

  protected readonly phase = signal<Phase>('setup');
  protected readonly questions = signal<InterviewQuestion[]>([]);
  protected readonly currentIndex = signal(0);
  protected readonly answers = signal<string[]>([]);
  protected readonly draft = signal('');
  protected readonly timeLeft = signal(REAL_MODE_SECONDS_PER_QUESTION);
  protected readonly result = signal<AggregateResult | null>(null);

  protected readonly currentQuestion = computed(() => this.questions()[this.currentIndex()] ?? null);
  protected readonly isRealMode = computed(() => this.setupForm.controls.mode.value === 'real');
  protected readonly progressLabel = computed(
    () => `${this.currentIndex() + 1} / ${this.questions().length}`,
  );

  private timerHandle: ReturnType<typeof setInterval> | null = null;
  private startedAt = 0;

  protected startInterview(): void {
    const { position, difficulty, mode } = this.setupForm.getRawValue();
    const pool = this.questionService.forPosition(position);
    const count = QUESTION_COUNT_BY_DIFFICULTY[difficulty];
    const shuffled = [...pool].sort(() => Math.random() - 0.5);

    this.questions.set(shuffled.slice(0, Math.min(count, shuffled.length)));
    this.answers.set([]);
    this.currentIndex.set(0);
    this.draft.set('');
    this.startedAt = Date.now();
    this.phase.set('interviewing');

    if (mode === 'real') this.startTimer();
  }

  protected setDraft(value: string): void {
    this.draft.set(value);
  }

  protected nextQuestion(): void {
    this.stopTimer();
    this.answers.update((a) => [...a, this.draft().trim() || '(no answer given)']);
    this.draft.set('');

    if (this.currentIndex() + 1 >= this.questions().length) {
      this.finishInterview();
    } else {
      this.currentIndex.update((i) => i + 1);
      if (this.isRealMode()) this.startTimer();
    }
  }

  private startTimer(): void {
    this.timeLeft.set(REAL_MODE_SECONDS_PER_QUESTION);
    this.timerHandle = setInterval(() => {
      this.timeLeft.update((t) => t - 1);
      if (this.timeLeft() <= 0) this.nextQuestion();
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerHandle) {
      clearInterval(this.timerHandle);
      this.timerHandle = null;
    }
  }

  private async finishInterview(): Promise<void> {
    this.phase.set('evaluating');
    const evaluations = await Promise.all(this.answers().map((a) => this.aiEvaluation.evaluateAnswer(a)));
    const aggregate = this.aggregate(evaluations);
    this.result.set(aggregate);

    const durationSeconds = Math.round((Date.now() - this.startedAt) / 1000);
    const { position, mode } = this.setupForm.getRawValue();

    await this.sessionService.saveSession({
      position,
      durationSeconds,
      questionCount: this.questions().length,
      overallScore: aggregate.overallScore,
      strengths: aggregate.strengths,
      improvements: aggregate.improvements,
      mode,
    });

    this.userState.recordActivity({
      minutes: Math.max(1, Math.round(durationSeconds / 60)),
      xp: 40 + Math.round(aggregate.overallScore / 5),
      type: 'interview',
      title: 'Completed a Mock Interview',
      accuracy: aggregate.overallScore,
    });

    this.phase.set('result');
  }

  private aggregate(evaluations: InterviewAnswerEvaluation[]): AggregateResult {
    const avg = (key: keyof InterviewAnswerEvaluation) =>
      Math.round(
        evaluations.reduce((sum, e) => sum + (e[key] as number), 0) / Math.max(1, evaluations.length),
      );

    const strengths = [...new Set(evaluations.flatMap((e) => e.strengths))].slice(0, 5);
    const improvements = [...new Set(evaluations.flatMap((e) => e.improvements))].slice(0, 5);
    const recommendedPractice = [...new Set(evaluations.flatMap((e) => e.recommendedPractice))].slice(0, 4);

    return {
      overallScore: avg('overallScore'),
      confidence: avg('confidence'),
      relevance: avg('relevance'),
      structure: avg('structure'),
      professionalism: avg('professionalism'),
      clarity: avg('clarity'),
      strengths: strengths.length ? strengths : ['You completed the full interview — that takes courage!'],
      improvements,
      recommendedPractice,
    };
  }

  protected restart(): void {
    this.stopTimer();
    this.phase.set('setup');
    this.result.set(null);
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }
}
