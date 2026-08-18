import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MOCK_SPEAKING_EXERCISES } from '../../core/services/mock-data/mock-speaking.data';
import { MOCK_OPEN_SPEAKING_PROMPTS, OpenSpeakingPrompt } from '../../core/services/mock-data/mock-open-speaking.data';
import { UserStateService } from '../../core/services/user-state.service';
import { SpeechRecognitionService } from '../../core/services/speech-recognition.service';
import { AiEvaluationService, WritingEvaluationError } from '../../core/services/ai-evaluation.service';
import { CefrLevel, ExerciseResult, WritingEvaluation } from '../../core/models';
import { ExercisePlayerComponent } from '../lessons/exercise-player/exercise-player';
import { LevelFilterComponent } from '../../shared/components';
import { LevelProgressService } from '../../core/services/level-progress.service';

type Phase = 'idle' | 'playing' | 'summary';
type OpenPhase = 'selecting' | 'ready' | 'recording' | 'result';

const LEVELS_WITH_CONTENT: CefrLevel[] = [
  CefrLevel.B2,
  CefrLevel.C1,
  CefrLevel.C2,
];

/** Levels that use the new open-ended, AI-judged speaking mode instead of the guided exact-sentence one. */
const OPEN_LEVELS = new Set<CefrLevel>([CefrLevel.C1, CefrLevel.C2]);

@Component({
  selector: 'app-speaking',
  standalone: true,
  imports: [ExercisePlayerComponent, LevelFilterComponent],
  templateUrl: './speaking.html',
  styleUrl: './speaking.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpeakingComponent {
  private readonly userState = inject(UserStateService);
  private readonly speechRecognition = inject(SpeechRecognitionService);
  private readonly aiEvaluation = inject(AiEvaluationService);
  protected readonly levelProgress = inject(LevelProgressService);
  protected readonly isSupported = this.speechRecognition.isSupported;

  protected readonly allExercises = MOCK_SPEAKING_EXERCISES;
  protected readonly allOpenPrompts = MOCK_OPEN_SPEAKING_PROMPTS;
  protected readonly levels = LEVELS_WITH_CONTENT;
  protected readonly lockedLevels = computed(
    () => new Set(this.levels.filter((l) => this.levelProgress.isLocked(l))),
  );
  protected readonly selectedLevel = signal<CefrLevel | null>(null);
  protected readonly lockedMessage = signal<string | null>(null);

  protected readonly isOpenMode = computed(() => {
    const level = this.selectedLevel();
    return level !== null && OPEN_LEVELS.has(level);
  });

  protected readonly exercises = computed(() => {
    const accessible = this.allExercises.filter((e) => !e.level || !this.levelProgress.isLocked(e.level));
    const level = this.selectedLevel();
    if (level === null) return accessible;
    return accessible.filter((e) => e.level === level);
  });

  protected readonly openPrompts = computed(() => {
    const accessible = this.allOpenPrompts.filter((p) => !this.levelProgress.isLocked(p.level));
    const level = this.selectedLevel();
    if (level === null) return accessible;
    return accessible.filter((p) => p.level === level);
  });

  // --- guided (exact-sentence match) mode ---
  protected readonly phase = signal<Phase>('idle');
  protected readonly lastAccuracy = signal(0);
  protected readonly lastXp = signal(0);

  // --- open (AI-judged transcript) mode, C1/C2 ---
  protected readonly openPhase = signal<OpenPhase>('selecting');
  protected readonly selectedPrompt = signal<OpenSpeakingPrompt | null>(null);
  protected readonly transcript = signal('');
  protected readonly recording = signal(false);
  protected readonly recordingError = signal<string | null>(null);
  protected readonly evaluating = signal(false);
  protected readonly evaluation = signal<WritingEvaluation | null>(null);
  protected readonly evaluationError = signal<string | null>(null);

  protected setLevel(level: CefrLevel | null): void {
    this.selectedLevel.set(level);
    this.openPhase.set('selecting');
    this.selectedPrompt.set(null);
    this.evaluation.set(null);
    this.lockedMessage.set(null);
  }

  protected onLockedLevelClicked(level: CefrLevel): void {
    this.lockedMessage.set(this.levelProgress.lockReason(level));
  }

  protected start(): void {
    if (this.exercises().length === 0) return;
    this.phase.set('playing');
  }

  protected onFinished(payload: { results: ExerciseResult[]; xpEarned: number }): void {
    const correctCount = payload.results.filter((r) => r.correct).length;
    const accuracy = Math.round((correctCount / payload.results.length) * 100);
    const minutes = Math.max(
      1,
      Math.round(payload.results.reduce((sum, r) => sum + r.timeSpentSeconds, 0) / 60),
    );

    this.userState.recordActivity({
      minutes,
      xp: payload.xpEarned,
      type: 'speaking',
      title: 'Speaking practice',
      accuracy,
    });

    this.lastAccuracy.set(accuracy);
    this.lastXp.set(payload.xpEarned);
    this.phase.set('summary');
  }

  protected reset(): void {
    this.phase.set('idle');
    this.openPhase.set('selecting');
    this.selectedPrompt.set(null);
    this.transcript.set('');
    this.evaluation.set(null);
    this.evaluationError.set(null);
    this.recordingError.set(null);
  }

  protected selectPrompt(prompt: OpenSpeakingPrompt): void {
    this.selectedPrompt.set(prompt);
    this.transcript.set('');
    this.recordingError.set(null);
    this.openPhase.set('ready');
  }

  protected async record(): Promise<void> {
    if (!this.isSupported) {
      this.recordingError.set("Your browser doesn't support speech recognition — try Chrome on desktop.");
      return;
    }
    this.recording.set(true);
    this.recordingError.set(null);
    this.openPhase.set('recording');
    try {
      const text = await this.speechRecognition.listen();
      this.transcript.set(text);
      this.openPhase.set('ready');
    } catch (err) {
      this.recordingError.set(err instanceof Error ? err.message : 'Could not record. Please try again.');
      this.openPhase.set('ready');
    } finally {
      this.recording.set(false);
    }
  }

  protected async submitOpenSpeaking(): Promise<void> {
    const prompt = this.selectedPrompt();
    if (!prompt || !this.transcript().trim()) return;

    this.evaluating.set(true);
    this.evaluationError.set(null);
    try {
      const result = await this.aiEvaluation.evaluateSpeaking(this.transcript(), prompt.title, prompt.level);
      this.evaluation.set(result);

      const xp = Math.round(20 + result.overallScore * 0.25);
      this.userState.recordActivity({
        minutes: 3,
        xp,
        type: 'speaking',
        title: `Spoke about "${prompt.title}"`,
        accuracy: result.overallScore,
      });

      this.openPhase.set('result');
    } catch (err) {
      this.evaluationError.set(
        err instanceof WritingEvaluationError ? err.message : 'Something went wrong evaluating your speech. Please try again.',
      );
    } finally {
      this.evaluating.set(false);
    }
  }

  protected speakAnother(): void {
    this.openPhase.set('selecting');
    this.selectedPrompt.set(null);
    this.transcript.set('');
    this.evaluation.set(null);
  }
}
