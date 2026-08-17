import { AiAnswerBuilderService } from './ai-answer-builder.service';

describe('AiAnswerBuilderService.buildAnswer', () => {
  const service = new AiAnswerBuilderService();

  it('joins non-empty step notes into sentences', () => {
    const result = service.buildAnswer(['my name is Andres', 'I studied computer science']);
    expect(result).toBe('My name is Andres. I studied computer science.');
  });

  it('skips empty/whitespace-only steps', () => {
    const result = service.buildAnswer(['I love helping people', '   ', '']);
    expect(result).toBe('I love helping people.');
  });

  it('does not add a duplicate period if the note already ends with punctuation', () => {
    const result = service.buildAnswer(['I am ready!', 'Let\'s go?']);
    expect(result).toBe("I am ready! Let's go?");
  });

  it('returns an empty string when every step is empty', () => {
    expect(service.buildAnswer(['', '  '])).toBe('');
  });

  it('works for any number of steps, not just a fixed set of 5 fields', () => {
    const result = service.buildAnswer(['step one', 'step two', 'step three', 'step four', 'step five', 'step six']);
    expect(result.split('. ').length).toBe(6);
  });
});
