import { TestBed } from '@angular/core/testing';
import { AiInterviewEvaluationService, InterviewEvaluationError } from './ai-interview-evaluation.service';
import { AiClientService, AiCompleteRequest, AiNotConfiguredError } from './ai-client.service';

const FAKE_AI_JSON = JSON.stringify({
  confidence: 80,
  relevance: 75,
  structure: 85,
  professionalism: 90,
  clarity: 70,
  strengths: ['Clear answer', 'Good structure'],
  improvements: ['Reduce filler words'],
  recommendedPractice: ['Practice Speaking'],
});

function setup(complete: (req: AiCompleteRequest) => Promise<string> = async () => FAKE_AI_JSON) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [{ provide: AiClientService, useValue: { complete } }],
  });
  return TestBed.inject(AiInterviewEvaluationService);
}

describe('AiInterviewEvaluationService.evaluateInterview', () => {
  it('computes overallScore as the average of the 5 AI-scored dimensions', async () => {
    const service = setup();
    const result = await service.evaluateInterview([{ question: 'Tell me about yourself.', answer: 'I am...' }]);
    // (80+75+85+90+70)/5 = 80
    expect(result.overallScore).toBe(80);
  });

  it('sends every question/answer pair from the session in ONE AI call, not one call per question', async () => {
    let calls = 0;
    let captured: AiCompleteRequest | null = null;
    const service = setup(async (req) => {
      calls++;
      captured = req;
      return FAKE_AI_JSON;
    });
    await service.evaluateInterview([
      { question: 'Q1', answer: 'A1' },
      { question: 'Q2', answer: 'A2' },
      { question: 'Q3', answer: 'A3' },
    ]);
    expect(calls).toBe(1);
    expect(captured!.messages[0].content).toContain('Q1');
    expect(captured!.messages[0].content).toContain('Q2');
    expect(captured!.messages[0].content).toContain('Q3');
  });

  it('clamps out-of-range scores into 0-100', async () => {
    const service = setup(async () =>
      JSON.stringify({
        confidence: 150,
        relevance: -20,
        structure: 50,
        professionalism: 50,
        clarity: 50,
        strengths: [],
        improvements: [],
        recommendedPractice: [],
      }),
    );
    const result = await service.evaluateInterview([{ question: 'Q', answer: 'A' }]);
    expect(result.confidence).toBe(100);
    expect(result.relevance).toBe(0);
  });

  it('is honest when AI is not configured, instead of fabricating scores', async () => {
    const service = setup(async () => {
      throw new AiNotConfiguredError('nope');
    });
    await expect(service.evaluateInterview([{ question: 'Q', answer: 'A' }])).rejects.toThrow(
      InterviewEvaluationError,
    );
  });

  it('is honest when the AI response is not valid JSON', async () => {
    const service = setup(async () => 'not json');
    await expect(service.evaluateInterview([{ question: 'Q', answer: 'A' }])).rejects.toThrow(
      InterviewEvaluationError,
    );
  });
});

describe('AiInterviewEvaluationService.evaluateAnswer (single-pair wrapper for Roleplay)', () => {
  it('wraps a single question/answer pair into one evaluateInterview call', async () => {
    let captured: AiCompleteRequest | null = null;
    const service = setup(async (req) => {
      captured = req;
      return FAKE_AI_JSON;
    });
    await service.evaluateAnswer('Handle an angry customer.', 'I would stay calm and listen.');
    expect(captured!.messages[0].content).toContain('Handle an angry customer.');
    expect(captured!.messages[0].content).toContain('I would stay calm and listen.');
  });
});
