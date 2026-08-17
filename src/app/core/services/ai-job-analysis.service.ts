import { Injectable } from '@angular/core';

export interface JobAnalysisResult {
  companyProfile: string;
  possibleQuestions: string[];
  technicalVocabulary: string[];
  customerServiceVocabulary: string[];
  skillsToHighlight: string[];
  interviewStrategy: string[];
  suggestedPreparation: string[];
}

/**
 * Section 23/26 of the spec ("Company Preparation 2.0"): paste a company +
 * job description, get a tailored prep plan the user can launch straight
 * into a personalized Mock Interview from. Mock/keyword-based today; the
 * real version is expected to run behind a backend that calls an LLM with
 * the pasted description — the output shape stays the same either way.
 */
@Injectable({ providedIn: 'root' })
export class AiJobAnalysisService {
  async analyze(company: string, jobDescription: string): Promise<JobAnalysisResult> {
    await this.delay();
    const name = company.trim() || 'this company';
    const mentionsSales = /sale|upsell|target|quota/i.test(jobDescription);
    const mentionsTech = /technical|software|troubleshoot|it support|saas/i.test(jobDescription);
    const mentionsRemote = /remote|work from home|wfh/i.test(jobDescription);
    const mentionsFastPaced = /fast-paced|fast paced|high volume|high-volume/i.test(jobDescription);

    return {
      companyProfile: mentionsTech
        ? `${name} appears to be a technical support / SaaS-style operation. Expect questions about troubleshooting, patience with non-technical users, and clear step-by-step explanations.`
        : `${name} appears to be a customer-facing service role. Expect questions about communication, empathy, and handling everyday customer requests.`,
      possibleQuestions: [
        `Why do you want to work at ${name}?`,
        'How would you handle a difficult customer?',
        mentionsSales ? 'How do you approach meeting a sales target?' : 'How do you prioritize your daily tasks?',
        mentionsTech
          ? 'How would you explain a technical problem to someone who is not technical?'
          : 'Tell me about a time you went above and beyond for a customer.',
        mentionsRemote ? 'How do you stay focused and productive working from home?' : 'How do you handle a busy, noisy work environment?',
      ],
      technicalVocabulary: mentionsTech
        ? ['troubleshoot', 'resolve', 'escalate', 'root cause', 'ticket']
        : ['account', 'order', 'subscription', 'process'],
      customerServiceVocabulary: ['customer', 'assistance', 'satisfaction', 'resolve', 'follow up'],
      skillsToHighlight: [
        'Communication',
        'Patience',
        'Problem solving',
        ...(mentionsFastPaced ? ['Working under pressure'] : []),
        ...(mentionsSales ? ['Persuasion'] : []),
      ],
      interviewStrategy: [
        `Research ${name} before the interview — mention something specific about them in your answers.`,
        'Use the STAR method (Situation, Task, Action, Result) for behavioral questions.',
        mentionsFastPaced
          ? 'Prepare one concrete example of staying calm under pressure.'
          : 'Prepare one concrete example of resolving a customer problem end-to-end.',
        'Prepare 1-2 questions to ask the interviewer at the end — it shows genuine interest.',
      ],
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
