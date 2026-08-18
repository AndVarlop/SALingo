import { ChangeDetectionStrategy, Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { InterviewQuestionService } from '../../../core/services/interview-question.service';
import { InterviewProgressService } from '../../../core/services/interview-progress.service';
import { InterviewSessionService } from '../../../core/services/interview-session.service';
import { AiInterviewEvaluationService, InterviewAnswerEvaluation, InterviewEvaluationError } from '../../../core/services/ai-interview-evaluation.service';
import { AiInterviewService } from '../../../core/services/ai-interview.service';
import { MistakeDetectionService } from '../../../core/services/mistake-detection.service';
import { MistakeMemoryService } from '../../../core/services/mistake-memory.service';
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
  private readonly aiInterview = inject(AiInterviewService);
  private readonly mistakeDetection = inject(MistakeDetectionService);
  private readonly mistakeMemory = inject(MistakeMemoryService);
  private readonly userState = inject(UserStateService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  protected readonly positions = Object.values(InterviewPosition);
  protected readonly positionLabel = INTERVIEW_POSITION_LABEL;
  protected readonly difficulties: Difficulty[] = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

  /** Set when arriving from Company Prep's "Start Personalized Interview". */
  private readonly personalized = (history.state as {
    personalizedQuestions?: string[];
    personalizedCompany?: string | null;
    personalizedPosition?: InterviewPosition | null;
  }) ?? {};
  protected readonly personalizedCompany = this.personalized.personalizedCompany ?? null;

  protected readonly setupForm = this.fb.nonNullable.group({
    position: this.fb.control<InterviewPosition | null>(
      this.personalized.personalizedPosition ?? this.interviewProgress.profile().targetPosition,
    ),
    difficulty: this.fb.nonNullable.control<Difficulty>('Beginner'),
    mode: this.fb.nonNullable.control<Mode>('guided'),
  });

  protected readonly phase = signal<Phase>('setup');
  protected readonly questions = signal<InterviewQuestion[]>([]);
  protected readonly currentIndex = signal(0);
  protected readonly answers = signal<string[]>([]);
  protected readonly draft = signal('');
  protected readonly timeLeft = signal(REAL_MODE_SECONDS_PER_QUESTION);
  protected readonly result = signal<InterviewAnswerEvaluation | null>(null);
  protected readonly evaluationError = signal<string | null>(null);
  /** Adaptive: not every question is picked up-front — the pool the next pick comes from. */
  private readonly remainingPool = signal<InterviewQuestion[]>([]);
  protected readonly targetCount = signal(0);

  protected readonly currentQuestion = computed(() => this.questions()[this.currentIndex()] ?? null);
  protected readonly isRealMode = computed(() => this.setupForm.controls.mode.value === 'real');
  protected readonly progressLabel = computed(
    () => `${this.currentIndex() + 1} / ${this.targetCount()}`,
  );

  private timerHandle: ReturnType<typeof setInterval> | null = null;
  private startedAt = 0;

  protected startInterview(): void {
    const { position, difficulty, mode } = this.setupForm.getRawValue();
    const basePool = this.questionService.forPosition(position);
    const personalizedPool: InterviewQuestion[] = (this.personalized.personalizedQuestions ?? []).map(
      (question, i) => ({
        id: `personalized-${i}`,
        category: 'behavioral',
        positions: [],
        question,
        whatInterviewerWants: 'Tailored to the job description you provided in Company Prep.',
        structure: ['Situation', 'Action', 'Result'],
        exampleAnswer: '',
        spanishExplanation: '',
        usefulVocabulary: [],
      }),
    );
    const pool = [...personalizedPool, ...basePool];
    const count = QUESTION_COUNT_BY_DIFFICULTY[difficulty];
    const shuffled = personalizedPool.length
      ? [...personalizedPool, ...[...basePool].sort(() => Math.random() - 0.5)]
      : [...pool].sort(() => Math.random() - 0.5);

    this.targetCount.set(Math.min(count, shuffled.length));
    this.remainingPool.set(shuffled);
    // Adaptive picker chooses the opening question too (no previous answer yet, so it's random).
    const first = this.aiInterview.pickNextQuestion(this.remainingPool(), '');
    this.remainingPool.update((pool) => pool.filter((q) => q.id !== first?.id));
    this.questions.set(first ? [first] : []);

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
    const answerText = this.draft().trim() || '(no answer given)';
    this.answers.update((a) => [...a, answerText]);
    this.draft.set('');

    if (this.currentIndex() + 1 >= this.targetCount() || !this.remainingPool().length) {
      this.finishInterview();
    } else {
      const next = this.aiInterview.pickNextQuestion(this.remainingPool(), answerText);
      this.remainingPool.update((pool) => pool.filter((q) => q.id !== next?.id));
      if (next) this.questions.update((q) => [...q, next]);
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
    this.evaluationError.set(null);

    const qaPairs = this.questions().map((q, i) => ({ question: q.question, answer: this.answers()[i] ?? '' }));

    let result: InterviewAnswerEvaluation;
    try {
      // ONE AI call for the whole interview, evaluated holistically — not
      // one call per question, which would be both slower and needlessly
      // expensive for a 15-question Expert-difficulty session.
      result = await this.aiEvaluation.evaluateInterview(qaPairs);
    } catch (err) {
      this.evaluationError.set(
        err instanceof InterviewEvaluationError ? err.message : 'Something went wrong evaluating your interview. Please try again.',
      );
      return; // stay on the 'evaluating' screen — it shows the error + a retry button
    }

    this.result.set(result);

    const detected = this.answers().flatMap((a) => this.mistakeDetection.detect(a));
    if (detected.length) await this.mistakeMemory.recordAll(detected, 'Mock Interview');

    const durationSeconds = Math.round((Date.now() - this.startedAt) / 1000);
    const { position, mode } = this.setupForm.getRawValue();

    await this.sessionService.saveSession({
      position,
      durationSeconds,
      questionCount: this.questions().length,
      overallScore: result.overallScore,
      strengths: result.strengths,
      improvements: result.improvements,
      mode,
    });

    this.userState.recordActivity({
      minutes: Math.max(1, Math.round(durationSeconds / 60)),
      xp: 40 + Math.round(result.overallScore / 5),
      type: 'interview',
      title: 'Completed a Mock Interview',
      accuracy: result.overallScore,
      skillTag: `interview:${position ?? 'general'}`,
    });

    this.phase.set('result');
  }

  protected restart(): void {
    this.stopTimer();
    this.phase.set('setup');
    this.result.set(null);
  }

  protected retryEvaluation(): void {
    void this.finishInterview();
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }
}
