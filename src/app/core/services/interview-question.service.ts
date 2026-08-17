import { Injectable, inject } from '@angular/core';
import { MOCK_INTERVIEW_QUESTIONS } from './mock-data/mock-interview-questions.data';
import { MOCK_INTERVIEW_VOCABULARY } from './mock-data/mock-interview-vocabulary.data';
import { MOCK_INTERVIEW_PHRASES } from './mock-data/mock-interview-phrases.data';
import { InterviewProgressService } from './interview-progress.service';
import { InterviewPosition, InterviewQuestion, InterviewQuestionCategory } from '../models';

@Injectable({ providedIn: 'root' })
export class InterviewQuestionService {
  private readonly progress = inject(InterviewProgressService);

  readonly questions = MOCK_INTERVIEW_QUESTIONS;
  readonly vocabulary = MOCK_INTERVIEW_VOCABULARY;
  readonly phrases = MOCK_INTERVIEW_PHRASES;

  getById(id: string): InterviewQuestion | undefined {
    return this.questions.find((q) => q.id === id);
  }

  getByCategory(category: InterviewQuestionCategory): InterviewQuestion[] {
    return this.questions.filter((q) => q.category === category);
  }

  /** Questions especially relevant to a target position, falling back to all of them. */
  forPosition(position: InterviewPosition | null): InterviewQuestion[] {
    if (!position) return this.questions;
    const relevant = this.questions.filter((q) => q.positions.length === 0 || q.positions.includes(position));
    return relevant.length ? relevant : this.questions;
  }

  /** First unpracticed question — drives the dashboard's "next recommended activity". */
  getNextRecommended(position: InterviewPosition | null): InterviewQuestion | undefined {
    return this.forPosition(position).find((q) => !this.progress.isPracticed(q.id));
  }
}
