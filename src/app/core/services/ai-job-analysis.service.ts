import { Injectable, inject } from '@angular/core';
import { AiClientService, AiNotConfiguredError } from './ai-client.service';

export interface JobAnalysisResult {
  companyProfile: string;
  possibleQuestions: string[];
  technicalVocabulary: string[];
  customerServiceVocabulary: string[];
  skillsToHighlight: string[];
  interviewStrategy: string[];
  suggestedPreparation: string[];
}

/** Thrown when the AI analysis fails or is unavailable — callers must show
 * an honest "couldn't analyze" state, never fabricated analysis. */
export class JobAnalysisError extends Error {}

// Fixed — these point at real SALingo features, not something an LLM
// should invent (it could hallucinate a feature name that doesn't exist).
const SUGGESTED_PREPARATION = [
  'Practice: Tell me about yourself',
  'Review Call Center Vocabulary',
  'Take a Mock Interview',
];

const SYSTEM_PROMPT =
  'You are a career coach helping a non-native-English-speaking candidate prepare for a customer-service / ' +
  "call-center job interview. Given a company name and a real job description, produce a short company/role " +
  'profile (2-3 sentences), 5 likely interview questions specific to this exact role, 5 technical or ' +
  'role-specific vocabulary words relevant to the job description, 5 general customer-service vocabulary words, ' +
  '3-5 skills to highlight based on what the description asks for, and 3-4 concrete interview strategy tips. ' +
  'Respond with ONLY valid JSON, no markdown fences, no extra text, in exactly this shape: {"companyProfile": ' +
  'string, "possibleQuestions": string[], "technicalVocabulary": string[], "customerServiceVocabulary": ' +
  'string[], "skillsToHighlight": string[], "interviewStrategy": string[]}';

/**
 * "Company Preparation": paste a company + job description, get a tailored
 * prep plan via Claude, personalized to the actual pasted text instead of
 * a handful of keyword-triggered templates. suggestedPreparation stays a
 * fixed pointer to real SALingo features (not AI-generated — see above).
 */
@Injectable({ providedIn: 'root' })
export class AiJobAnalysisService {
  private readonly aiClient = inject(AiClientService);

  async analyze(company: string, jobDescription: string): Promise<JobAnalysisResult> {
    const name = company.trim() || 'this company';

    let raw: string;
    try {
      raw = await this.aiClient.complete({
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: `Company: ${name}\n\nJob description:\n${jobDescription}` }],
        maxTokens: 800,
      });
    } catch (err) {
      if (err instanceof AiNotConfiguredError) {
        throw new JobAnalysisError("AI analysis isn't set up yet.");
      }
      console.error('[AiJobAnalysis] AI request failed', err);
      throw new JobAnalysisError('Could not reach the AI analyzer. Please try again.');
    }

    const parsed = this.parse(raw);
    if (!parsed) {
      console.error('[AiJobAnalysis] Unparseable AI response', raw);
      throw new JobAnalysisError('The AI analyzer returned an unexpected response. Please try again.');
    }

    return { ...parsed, suggestedPreparation: SUGGESTED_PREPARATION };
  }

  private parse(raw: string): Omit<JobAnalysisResult, 'suggestedPreparation'> | null {
    try {
      const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
      const data = JSON.parse(cleaned) as Partial<Record<string, unknown>>;
      const stringArrayFields = [
        'possibleQuestions',
        'technicalVocabulary',
        'customerServiceVocabulary',
        'skillsToHighlight',
        'interviewStrategy',
      ] as const;

      if (typeof data['companyProfile'] !== 'string' || !data['companyProfile'].trim()) return null;
      if (stringArrayFields.some((f) => !Array.isArray(data[f]))) return null;

      const toStringArray = (v: unknown): string[] =>
        (v as unknown[]).filter((s): s is string => typeof s === 'string' && s.trim().length > 0);

      return {
        companyProfile: data['companyProfile'],
        possibleQuestions: toStringArray(data['possibleQuestions']),
        technicalVocabulary: toStringArray(data['technicalVocabulary']),
        customerServiceVocabulary: toStringArray(data['customerServiceVocabulary']),
        skillsToHighlight: toStringArray(data['skillsToHighlight']),
        interviewStrategy: toStringArray(data['interviewStrategy']),
      };
    } catch {
      return null;
    }
  }
}
