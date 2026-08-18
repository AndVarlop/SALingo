import { Injectable } from '@angular/core';
import { CandidateProfile } from '../models/career-coach.model';
import { InterviewQuestion } from '../models';

/** Keyword groups used to steer which question comes next. Rule-based today —
 * swap `pickNextQuestion`'s body for a real LLM call later without touching callers. */
const TOPIC_KEYWORDS: Record<string, string[]> = {
  sales: ['sales', 'sold', 'selling', 'upsell', 'convince', 'convinced'],
  noExperience: ['no experience', 'never worked', "haven't worked", 'first job', 'student'],
  teamwork: ['team', 'coworker', 'colleague', 'together'],
  conflict: ['angry', 'upset', 'complain', 'difficult', 'frustrated'],
  leadership: ['lead', 'supervisor', 'manager', 'trained', 'mentor'],
};

function detectTopics(answerText: string): string[] {
  const lower = answerText.toLowerCase();
  return Object.entries(TOPIC_KEYWORDS)
    .filter(([, keywords]) => keywords.some((k) => lower.includes(k)))
    .map(([topic]) => topic);
}

/**
 * Drives a simulated interview conversation. Mock/rule-based today: it picks
 * the next question from a candidate pool based on keywords found in the
 * previous answer plus the candidate profile, instead of asking in a fixed
 * order. The real implementation is expected to live behind a backend that
 * calls an LLM, never a direct client-side API call — `pickNextQuestion`'s
 * signature is designed to stay stable when that swap happens.
 */
@Injectable({ providedIn: 'root' })
export class AiInterviewService {
  /**
   * Adaptively selects the next question out of `pool`. If the previous
   * answer mentions a detectable topic (sales, no experience, conflict,
   * teamwork, leadership) and a matching question exists in the pool, it is
   * preferred; otherwise falls back to a random pick from the pool.
   * Mutates nothing — caller is responsible for removing the returned
   * question from its own remaining-pool state.
   */
  pickNextQuestion(
    pool: InterviewQuestion[],
    previousAnswerText: string,
    _profile?: CandidateProfile,
  ): InterviewQuestion | null {
    if (!pool.length) return null;
    const topics = previousAnswerText ? detectTopics(previousAnswerText) : [];

    if (topics.length) {
      const haystackMatch = (q: InterviewQuestion) => {
        const text = `${q.question} ${q.whatInterviewerWants}`.toLowerCase();
        return topics.some((topic) => TOPIC_KEYWORDS[topic].some((k) => text.includes(k)));
      };
      const match = pool.find(haystackMatch);
      if (match) return match;
    }

    return pool[Math.floor(Math.random() * pool.length)];
  }
}
