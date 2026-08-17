import { Injectable } from '@angular/core';

/** Thin wrapper around the browser's SpeechSynthesis API. Swap for a
 * higher-quality TTS backend later without touching callers. */
@Injectable({ providedIn: 'root' })
export class TextToSpeechService {
  readonly isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  speak(text: string, lang = 'en-US'): void {
    if (!this.isSupported) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }
}
