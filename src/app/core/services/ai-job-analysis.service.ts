import { Injectable } from '@angular/core';

export interface JobAnalysisResult {
  possibleQuestions: string[];
  relevantVocabulary: string[];
  skillsToHighlight: string[];
  suggestedPreparation: string[];
}

/**
 * Section 26 of the spec: paste a company + job description, get a tailored
 * prep plan. Mock/keyword-based today; the real version is expected to run
 * behind a backend that calls an LLM with the pasted description.
 */
@Injectable({ providedIn: 'root' })
export class AiJobAnalysisService {
  async analyze(company: string, jobDescription: string): Promise<JobAnalysisResult> {
    await this.delay();
    const mentionsSales = /sale|upsell|target/i.test(jobDescription);
    const mentionsTech = /technical|software|troubleshoot/i.test(jobDescription);

    return {
      possibleQuestions: [
        `Why do you want to work at ${company || 'this company'}?`,
        'How would you handle a difficult customer?',
        mentionsSales ? 'How do you approach meeting a sales target?' : 'How do you prioritize your daily tasks?',
      ],
      relevantVocabulary: mentionsTech
        ? ['troubleshoot', 'resolve', 'escalate', 'root cause']
        : ['customer', 'assistance', 'satisfaction', 'resolve'],
      skillsToHighlight: ['Communication', 'Patience', 'Problem solving'],
      suggestedPreparation: [
        'Practice: Tell me about yourself',
        'Review Call Center Vocabulary',
        'Take a Mock Interview',
      ],
    };
  }

  private delay(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 500));
  }
}
