import { AiInterviewService } from './ai-interview.service';
import { InterviewQuestion } from '../models';

function makeQuestion(id: string, question: string, whatInterviewerWants = ''): InterviewQuestion {
  return {
    id,
    category: 'behavioral',
    positions: [],
    question,
    whatInterviewerWants,
    structure: [],
    exampleAnswer: '',
    spanishExplanation: '',
    usefulVocabulary: [],
  };
}

describe('AiInterviewService.pickNextQuestion', () => {
  const service = new AiInterviewService();

  it('returns null for an empty pool', () => {
    expect(service.pickNextQuestion([], '')).toBeNull();
  });

  it('returns the only question when the pool has one item', () => {
    const q = makeQuestion('q1', 'Tell me about yourself.');
    expect(service.pickNextQuestion([q], '')).toBe(q);
  });

  it('prefers a pool question matching a detected topic in the previous answer', () => {
    const salesQuestion = makeQuestion('q-sales', 'Tell me about a time you convinced a customer to buy something.');
    const genericQuestion = makeQuestion('q-generic', 'How do you prioritize your day?');
    const pool = [genericQuestion, salesQuestion];

    const picked = service.pickNextQuestion(pool, 'I have experience in sales and upsell techniques.');
    expect(picked?.id).toBe('q-sales');
  });

  it('falls back to a random pick when no topic is detected', () => {
    const pool = [makeQuestion('q1', 'Question one.'), makeQuestion('q2', 'Question two.')];
    const picked = service.pickNextQuestion(pool, 'This answer has no special keywords in it.');
    expect(pool.some((q) => q.id === picked?.id)).toBe(true);
  });

  it('falls back to a random pick when a topic is detected but no matching question exists', () => {
    const pool = [makeQuestion('q1', 'Describe your daily routine.')];
    const picked = service.pickNextQuestion(pool, 'I love sales and upselling.');
    expect(picked?.id).toBe('q1');
  });
});
