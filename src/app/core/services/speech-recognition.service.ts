import { Injectable } from '@angular/core';

/** Minimal shape of the Web Speech API's SpeechRecognition — not in lib.dom.d.ts. */
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Wraps the browser's Web Speech API behind a Promise-based method so
 * components don't deal with event listeners directly. Swap the internals
 * for a server-side transcription API later without touching callers.
 */
@Injectable({ providedIn: 'root' })
export class SpeechRecognitionService {
  readonly isSupported = getRecognitionCtor() !== null;

  /** Records one utterance and resolves with the transcript. */
  listen(lang = 'en-US'): Promise<string> {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return Promise.reject(new Error('Speech recognition is not supported in this browser.'));

    return new Promise((resolve, reject) => {
      const recognition = new Ctor();
      recognition.lang = lang;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript ?? '';
        resolve(transcript);
      };
      recognition.onerror = (event: any) => {
        reject(new Error(event?.error ?? 'Speech recognition error'));
      };

      recognition.start();
    });
  }

  /** Simple word-overlap score (0-100) — not phonetic, just a practical proxy. */
  scoreTranscript(expected: string, actual: string): number {
    const normalize = (s: string) =>
      s
        .toLowerCase()
        .replace(/[.,!?]/g, '')
        .split(/\s+/)
        .filter(Boolean);

    const expectedWords = normalize(expected);
    const actualWords = new Set(normalize(actual));
    if (expectedWords.length === 0) return 0;

    const matched = expectedWords.filter((w) => actualWords.has(w)).length;
    return Math.round((matched / expectedWords.length) * 100);
  }
}
