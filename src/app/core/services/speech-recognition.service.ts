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
    const expectedWords = this.normalize(expected);
    const actualWords = new Set(this.normalize(actual));
    if (expectedWords.length === 0) return 0;

    const matched = expectedWords.filter((w) => actualWords.has(w)).length;
    return Math.round((matched / expectedWords.length) * 100);
  }

  /**
   * Records one utterance like `listen()`, but also times it and diffs
   * against `expected` word-by-word — used by the Pronunciation Coach.
   * Still not phonetic analysis: it's recognition accuracy + timing, and the
   * UI is expected to say so explicitly (see PronunciationResult below).
   */
  listenAndAnalyze(expected: string, lang = 'en-US'): Promise<PronunciationResult> {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return Promise.reject(new Error('Speech recognition is not supported in this browser.'));

    return new Promise((resolve, reject) => {
      const recognition = new Ctor();
      recognition.lang = lang;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      const startedAt = performance.now();

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript ?? '';
        const durationSeconds = Math.max(0.5, (performance.now() - startedAt) / 1000);
        resolve(this.buildResult(expected, transcript, durationSeconds));
      };
      recognition.onerror = (event: any) => {
        reject(new Error(event?.error ?? 'Speech recognition error'));
      };

      recognition.start();
    });
  }

  private buildResult(expected: string, transcript: string, durationSeconds: number): PronunciationResult {
    const expectedWords = this.normalize(expected);
    const actualWordsList = this.normalize(transcript);
    const actualWordsSet = new Set(actualWordsList);

    const missedWords = expectedWords.filter((w) => !actualWordsSet.has(w));
    const matchScore = expectedWords.length
      ? Math.round((expectedWords.filter((w) => actualWordsSet.has(w)).length / expectedWords.length) * 100)
      : 0;
    const wordsPerMinute = Math.round((actualWordsList.length / durationSeconds) * 60);

    return { transcript, matchScore, missedWords, wordsPerMinute, durationSeconds };
  }

  private normalize(s: string): string[] {
    return s
      .toLowerCase()
      .replace(/[.,!?]/g, '')
      .split(/\s+/)
      .filter(Boolean);
  }
}

export interface PronunciationResult {
  transcript: string;
  /** Word-overlap score (0-100) — recognition accuracy, not phonetic accuracy. */
  matchScore: number;
  missedWords: string[];
  /** Words-per-minute derived from recognized word count / recording duration — a rough fluency proxy. */
  wordsPerMinute: number;
  durationSeconds: number;
}
