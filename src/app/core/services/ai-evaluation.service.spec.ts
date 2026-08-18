import { TestBed } from '@angular/core/testing';
import { AiEvaluationService, WritingEvaluationError } from './ai-evaluation.service';
import { AiClientService, AiNotConfiguredError } from './ai-client.service';

const FAKE_AI_JSON = JSON.stringify({ vocabularyScore: 70, coherenceScore: 75, suggestions: ['Try shorter sentences.'] });

function setup(complete: (...args: unknown[]) => Promise<string> = async () => FAKE_AI_JSON) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [{ provide: AiClientService, useValue: { complete } }],
  });
  return TestBed.inject(AiEvaluationService);
}

describe('AiEvaluationService.evaluateWriting — grammarScore (rule-based, unaffected by AI)', () => {
  it('does not penalize a long, grammatically clean text more than a short one', async () => {
    const service = setup();
    const longClean = Array(80).fill('This is a clean sentence with no known mistakes.').join(' ');
    const shortClean = 'This is a short clean sentence.';

    const longResult = await service.evaluateWriting(longClean, 'Test');
    const shortResult = await service.evaluateWriting(shortClean, 'Test');

    expect(longResult.grammarScore).toBeGreaterThanOrEqual(shortResult.grammarScore);
  });

  it('lowers grammarScore when a known grammar mistake is present', async () => {
    const service = setup();
    const clean = await service.evaluateWriting('I have five years of experience in customer service.', 'Test');
    const withMistake = await service.evaluateWriting('I have 5 years working in customer service.', 'Test');

    expect(withMistake.grammarScore).toBeLessThan(clean.grammarScore);
    expect(withMistake.grammarMistakes.length).toBeGreaterThan(0);
  });

  it('never returns a grammarScore below the floor of 40', async () => {
    const service = setup();
    const veryBad = 'I am agree, I am agree, peoples explain me things, I am agree.';
    const result = await service.evaluateWriting(veryBad, 'Test');
    expect(result.grammarScore).toBeGreaterThanOrEqual(40);
  });

  it('surfaces detected mistakes as suggestions alongside the AI ones', async () => {
    const service = setup();
    const result = await service.evaluateWriting('I am agree with the plan.', 'Test');
    expect(result.suggestions.some((s) => s.includes('Grammar:'))).toBe(true);
    expect(result.suggestions).toContain('Try shorter sentences.');
  });
});

describe('AiEvaluationService.evaluateWriting — vocabulary/coherence (real AI)', () => {
  it('uses the AI-provided vocabulary and coherence scores', async () => {
    const service = setup(async () =>
      JSON.stringify({ vocabularyScore: 88, coherenceScore: 92, suggestions: [] }),
    );
    const result = await service.evaluateWriting('This is fine.', 'Test');
    expect(result.vocabularyScore).toBe(88);
    expect(result.coherenceScore).toBe(92);
  });

  it('is honest when AI is not configured, instead of fabricating scores', async () => {
    const service = setup(async () => {
      throw new AiNotConfiguredError('nope');
    });
    await expect(service.evaluateWriting('Some text here.', 'Test')).rejects.toThrow(WritingEvaluationError);
  });

  it('is honest when the AI response is not valid JSON, instead of fabricating scores', async () => {
    const service = setup(async () => 'not json at all');
    await expect(service.evaluateWriting('Some text here.', 'Test')).rejects.toThrow(WritingEvaluationError);
  });

  it('strips markdown code fences the model might add despite instructions', async () => {
    const service = setup(async () => '```json\n' + FAKE_AI_JSON + '\n```');
    const result = await service.evaluateWriting('Some text here.', 'Test');
    expect(result.vocabularyScore).toBe(70);
  });
});
