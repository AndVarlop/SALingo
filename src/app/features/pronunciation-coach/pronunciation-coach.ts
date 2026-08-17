import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MOCK_SPEAKING_EXERCISES } from '../../core/services/mock-data/mock-speaking.data';
import { SpeechRecognitionService, PronunciationResult } from '../../core/services/speech-recognition.service';
import { TextToSpeechService } from '../../core/services/text-to-speech.service';
import { UserStateService } from '../../core/services/user-state.service';
import { XP_RULES } from '../../core/constants/xp.constant';

type Phase = 'idle' | 'recording' | 'result';

@Component({
  selector: 'app-pronunciation-coach',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './pronunciation-coach.html',
  styleUrl: './pronunciation-coach.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PronunciationCoachComponent {
  private readonly speechRecognition = inject(SpeechRecognitionService);
  private readonly tts = inject(TextToSpeechService);
  private readonly userState = inject(UserStateService);

  protected readonly isRecognitionSupported = this.speechRecognition.isSupported;
  protected readonly isTtsSupported = this.tts.isSupported;
  protected readonly sentences = MOCK_SPEAKING_EXERCISES;

  protected readonly index = signal(0);
  protected readonly phase = signal<Phase>('idle');
  protected readonly result = signal<PronunciationResult | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly currentSentence = () => this.sentences[this.index()];

  protected listenToSentence(): void {
    this.tts.speak(this.currentSentence().expectedSentence);
  }

  protected async record(): Promise<void> {
    this.error.set(null);
    this.phase.set('recording');
    try {
      const result = await this.speechRecognition.listenAndAnalyze(this.currentSentence().expectedSentence);
      this.result.set(result);
      this.phase.set('result');

      this.userState.recordActivity({
        minutes: 1,
        xp: result.matchScore >= 70 ? XP_RULES.correctExercise : XP_RULES.incorrectExercise,
        type: 'speaking',
        title: 'Pronunciation Coach practice',
        accuracy: result.matchScore,
      });
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Recording failed.');
      this.phase.set('idle');
    }
  }

  protected next(): void {
    this.result.set(null);
    this.error.set(null);
    this.phase.set('idle');
    this.index.update((i) => (i + 1) % this.sentences.length);
  }

  protected tryAgain(): void {
    this.result.set(null);
    this.error.set(null);
    this.phase.set('idle');
  }
}
