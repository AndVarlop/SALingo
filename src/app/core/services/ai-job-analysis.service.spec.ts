import { TestBed } from '@angular/core/testing';
import { AiJobAnalysisService, JobAnalysisError } from './ai-job-analysis.service';
import { AiClientService, AiCompleteRequest, AiNotConfiguredError } from './ai-client.service';

const FAKE_AI_JSON = JSON.stringify({
  companyProfile: 'A fast-growing SaaS company.',
  possibleQuestions: ['Why do you want to work here?'],
  technicalVocabulary: ['troubleshoot'],
  customerServiceVocabulary: ['customer'],
  skillsToHighlight: ['Communication'],
  interviewStrategy: ['Research the company beforehand.'],
});

function setup(complete: (req: AiCompleteRequest) => Promise<string> = async () => FAKE_AI_JSON) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [{ provide: AiClientService, useValue: { complete } }],
  });
  return TestBed.inject(AiJobAnalysisService);
}

describe('AiJobAnalysisService.analyze', () => {
  it('returns the real AI analysis for the given company and job description', async () => {
    const service = setup();
    const result = await service.analyze('Acme Corp', 'We need a technical support agent...');
    expect(result.companyProfile).toBe('A fast-growing SaaS company.');
    expect(result.possibleQuestions).toEqual(['Why do you want to work here?']);
  });

  it('sends the real company name and job description to the AI', async () => {
    let captured: AiCompleteRequest | null = null;
    const service = setup(async (req) => {
      captured = req;
      return FAKE_AI_JSON;
    });
    await service.analyze('Acme Corp', 'A very specific job description.');
    expect(captured!.messages[0].content).toContain('Acme Corp');
    expect(captured!.messages[0].content).toContain('A very specific job description.');
  });

  it('always includes the fixed suggestedPreparation pointing at real SALingo features', async () => {
    const service = setup();
    const result = await service.analyze('Acme Corp', 'desc');
    expect(result.suggestedPreparation).toContain('Take a Mock Interview');
  });

  it('is honest when AI is not configured, instead of fabricating an analysis', async () => {
    const service = setup(async () => {
      throw new AiNotConfiguredError('nope');
    });
    await expect(service.analyze('Acme', 'desc')).rejects.toThrow(JobAnalysisError);
  });

  it('is honest when the AI response is not valid JSON', async () => {
    const service = setup(async () => 'not json');
    await expect(service.analyze('Acme', 'desc')).rejects.toThrow(JobAnalysisError);
  });
});
