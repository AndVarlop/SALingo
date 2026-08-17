import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { SpeakingExercise } from '../../../core/models';
import { SpeechRecognitionService } from '../../../core/services/speech-recognition.service';
import { ExerciseAnswer } from './exercise-answer';

type State = 'idle' | 'listening' | 'result' | 'error';

@Component({
  selector: 'app-speaking-exercise',
  standalone: true,
  templateUrl: './speaking-exercise.html',
  styleUrl: './speaking-exercise.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpeakingExerciseComponent {
  readonly exercise = input.required<SpeakingExercise>();
  readonly answered = output<ExerciseAnswer>();

  private readonly speech = inject(SpeechRecognitionService);
  protected readonly isSupported = this.speech.isSupported;

  protected readonly state = signal<State>('idle');
  protected readonly transcript = signal('');
  protected readonly score = signal(0);
  protected readonly errorMessage = signal('');

  protected async startSpeaking(): Promise<void> {
    this.state.set('listening');
    try {
      const transcript = await this.speech.listen();
      const score = this.speech.scoreTranscript(this.exercise().expectedSentence, transcript);
      this.transcript.set(transcript);
      this.score.set(score);
      this.state.set('result');
      this.answered.emit({ correct: score >= 70, userAnswer: transcript });
    } catch (err) {
      this.errorMessage.set(err instanceof Error ? err.message : 'Could not access the microphone.');
      this.state.set('error');
    }
  }

  /** Manual self-report for browsers without speech recognition support. */
  protected selfReport(gotItRight: boolean): void {
    this.transcript.set(gotItRight ? this.exercise().expectedSentence : '—');
    this.score.set(gotItRight ? 100 : 0);
    this.state.set('result');
    this.answered.emit({ correct: gotItRight, userAnswer: gotItRight ? 'Self-reported correct' : 'Self-reported needs practice' });
  }

  protected get feedbackMessage(): string {
    const s = this.score();
    if (s >= 90) return 'Excellent pronunciation! 🎉';
    if (s >= 70) return 'Almost! A few words were off.';
    return 'Keep practicing — try speaking a bit slower.';
  }
}
