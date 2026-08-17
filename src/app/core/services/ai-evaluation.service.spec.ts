import { TestBed } from '@angular/core/testing';
import { AiEvaluationService } from './ai-evaluation.service';

describe('AiEvaluationService.evaluateWriting — grammarScore', () => {
  let service: AiEvaluationService;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    service = TestBed.inject(AiEvaluationService);
  });

  it('does not penalize a long, grammatically clean text more than a short one', async () => {
    const longClean = Array(80).fill('This is a clean sentence with no known mistakes.').join(' ');
    const shortClean = 'This is a short clean sentence.';

    const longResult = await service.evaluateWriting(longClean);
    const shortResult = await service.evaluateWriting(shortClean);

    // The old buggy formula made longer text score *worse* on grammar.
    // A real grammar check must not do that when no mistakes are present.
    expect(longResult.grammarScore).toBeGreaterThanOrEqual(shortResult.grammarScore);
  });

  it('lowers grammarScore when a known grammar mistake is present', async () => {
    const clean = await service.evaluateWriting('I have five years of experience in customer service.');
    const withMistake = await service.evaluateWriting('I have 5 years working in customer service.');

    expect(withMistake.grammarScore).toBeLessThan(clean.grammarScore);
    expect(withMistake.grammarMistakes.length).toBeGreaterThan(0);
  });

  it('never returns a grammarScore below the floor of 40', async () => {
    const veryBad = 'I am agree, I am agree, peoples explain me things, I am agree.';
    const result = await service.evaluateWriting(veryBad);
    expect(result.grammarScore).toBeGreaterThanOrEqual(40);
  });

  it('surfaces detected mistakes as suggestions', async () => {
    const result = await service.evaluateWriting('I am agree with the plan.');
    expect(result.suggestions.some((s) => s.includes('Grammar:'))).toBe(true);
  });
});
