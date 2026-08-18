import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MOCK_WRITING_PROMPTS, WritingPrompt } from '../../core/services/mock-data/mock-writing.data';
import { AiEvaluationService, WritingEvaluationError } from '../../core/services/ai-evaluation.service';
import { MistakeMemoryService } from '../../core/services/mistake-memory.service';
import { UserStateService } from '../../core/services/user-state.service';
import { CefrLevel, WritingEvaluation } from '../../core/models';
import { LevelFilterComponent } from '../../shared/components';

type Phase = 'selecting' | 'writing' | 'result';

const LEVELS_WITH_CONTENT: CefrLevel[] = [
  CefrLevel.B2,
  CefrLevel.C1,
  CefrLevel.C2,
];

@Component({
  selector: 'app-writing',
  standalone: true,
  imports: [LevelFilterComponent],
  templateUrl: './writing.html',
  styleUrl: './writing.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WritingComponent {
  private readonly aiEvaluation = inject(AiEvaluationService);
  private readonly mistakeMemory = inject(MistakeMemoryService);
  private readonly userState = inject(UserStateService);

  protected readonly allPrompts = MOCK_WRITING_PROMPTS;
  protected readonly levels = LEVELS_WITH_CONTENT;
  protected readonly selectedLevel = signal<CefrLevel | null>(null);
  protected readonly prompts = computed(() => {
    const level = this.selectedLevel();
    if (level === null) return this.allPrompts;
    return this.allPrompts.filter((p) => p.level === level);
  });

  protected setLevel(level: CefrLevel | null): void {
    this.selectedLevel.set(level);
  }

  protected readonly phase = signal<Phase>('selecting');
  protected readonly selectedPrompt = signal<WritingPrompt | null>(null);
  protected readonly text = signal('');
  protected readonly evaluating = signal(false);
  protected readonly evaluation = signal<WritingEvaluation | null>(null);
  protected readonly evaluationError = signal<string | null>(null);

  protected readonly wordCount = () => this.text().trim().split(/\s+/).filter(Boolean).length;

  protected selectPrompt(prompt: WritingPrompt): void {
    this.selectedPrompt.set(prompt);
    this.text.set('');
    this.phase.set('writing');
  }

  protected setText(value: string): void {
    this.text.set(value);
  }

  protected async submit(): Promise<void> {
    const prompt = this.selectedPrompt();
    if (!prompt || this.wordCount() < 10) return;

    this.evaluating.set(true);
    this.evaluationError.set(null);
    try {
      const result = await this.aiEvaluation.evaluateWriting(this.text(), prompt.title, prompt.level);
      this.evaluation.set(result);

      if (result.grammarMistakes.length) {
        await this.mistakeMemory.recordAll(result.grammarMistakes, `Writing: ${prompt.title}`);
      }

      const xp = Math.round(15 + result.overallScore * 0.2);
      this.userState.recordActivity({
        minutes: 3,
        xp,
        type: 'writing',
        title: `Wrote about "${prompt.title}"`,
        accuracy: result.overallScore,
      });

      this.phase.set('result');
    } catch (err) {
      this.evaluationError.set(
        err instanceof WritingEvaluationError ? err.message : 'Something went wrong evaluating your text. Please try again.',
      );
    } finally {
      this.evaluating.set(false);
    }
  }

  protected writeAnother(): void {
    this.evaluation.set(null);
    this.phase.set('selecting');
  }
}
