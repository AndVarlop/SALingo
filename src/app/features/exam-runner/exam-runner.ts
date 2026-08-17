import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ExamRegistryService } from '../../core/services/exam-registry.service';
import { ExamEngineService } from '../../core/services/exam-engine.service';
import { ExamDefinition, ExamQuestion, ExamResult } from '../../core/models';

type Phase = 'loading' | 'playing' | 'result' | 'not-found';

/**
 * Generic Exam Engine runner: works for any ExamDefinition from
 * ExamRegistryService (route: /exam/:id). One question per screen,
 * untimed (this is an exam, not a mini-game), previous/next navigation,
 * then a results screen with per-section scores and the weakest skill
 * tags surfaced by ExamEngineService — same weakestSkillTags shape the
 * rest of the Skill Engine already uses.
 */
@Component({
  selector: 'app-exam-runner',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './exam-runner.html',
  styleUrl: './exam-runner.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamRunnerComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly registry = inject(ExamRegistryService);
  private readonly engine = inject(ExamEngineService);

  protected readonly phase = signal<Phase>('loading');
  protected readonly exam = signal<ExamDefinition | null>(null);
  protected readonly questions = signal<ExamQuestion[]>([]);
  protected readonly index = signal(0);
  protected readonly answers = signal<Map<string, number>>(new Map());
  protected readonly result = signal<ExamResult | null>(null);

  protected readonly currentQuestion = () => this.questions()[this.index()] ?? null;
  protected readonly selectedForCurrent = () => {
    const q = this.currentQuestion();
    return q ? (this.answers().get(q.id) ?? null) : null;
  };
  protected readonly progressPercent = () =>
    this.questions().length ? Math.round((this.index() / this.questions().length) * 100) : 0;
  protected readonly isLastQuestion = () => this.index() + 1 >= this.questions().length;

  private readonly examId = this.route.snapshot.paramMap.get('id');

  constructor() {
    // Runs as a reactive effect (not a one-shot constructor call) because
    // Vocabulary Exam depends on VocabularyService's Supabase fetch, which
    // may still be in flight on a fresh page load — this re-evaluates once
    // ExamRegistryService.isReady() flips, instead of building an exam out
    // of zero words.
    effect(() => {
      if (this.phase() !== 'loading') return;
      this.load();
    });
  }

  private load(): void {
    const id = this.examId;
    if (!id || !this.registry.isReady(id)) return;

    const exam = this.registry.getExam(id);
    if (!exam || exam.sections.every((s) => s.questions.length === 0)) {
      this.phase.set('not-found');
      return;
    }
    this.exam.set(exam);
    this.questions.set(exam.sections.flatMap((s) => s.questions));
    this.index.set(0);
    this.answers.set(new Map());
    this.result.set(null);
    this.phase.set('playing');
  }

  protected selectAnswer(optionIndex: number): void {
    const q = this.currentQuestion();
    if (!q) return;
    const next = new Map(this.answers());
    next.set(q.id, optionIndex);
    this.answers.set(next);
  }

  protected next(): void {
    if (this.isLastQuestion()) {
      this.finish();
    } else {
      this.index.update((i) => i + 1);
    }
  }

  protected previous(): void {
    this.index.update((i) => Math.max(0, i - 1));
  }

  private finish(): void {
    const exam = this.exam();
    if (!exam) return;
    const result = this.engine.evaluate(exam, this.answers());
    this.engine.record(exam, result);
    this.result.set(result);
    this.phase.set('result');
  }

  protected retake(): void {
    this.load();
  }
}
