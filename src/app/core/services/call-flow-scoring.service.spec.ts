import { CallFlowScoringService } from './call-flow-scoring.service';

describe('CallFlowScoringService', () => {
  const service = new CallFlowScoringService();

  it('detects all core steps in a well-structured call', () => {
    const transcript =
      "Hello, thank you for calling. I'm sorry to hear that, I understand how frustrating this is. " +
      "Let me check your account. I can offer a refund. Anything else? Have a great day.";
    const result = service.score(transcript, true);

    const byStep = Object.fromEntries(result.steps.map((s) => [s.step, s.detected]));
    expect(byStep['greeting']).toBe(true);
    expect(byStep['empathy']).toBe(true);
    expect(byStep['investigation']).toBe(true);
    expect(byStep['solution']).toBe(true);
    expect(byStep['closing']).toBe(true);
    expect(result.overall).toBeGreaterThan(50);
  });

  it('only scores conditional steps (verification/identification/confirmation) when expectsLookup is true', () => {
    const transcript = 'Hello, I understand, I can help, have a great day.';
    const withoutLookup = service.score(transcript, false);
    const withLookup = service.score(transcript, true);

    expect(withoutLookup.steps.some((s) => s.step === 'verification')).toBe(false);
    expect(withLookup.steps.some((s) => s.step === 'verification')).toBe(true);
    expect(withLookup.steps.length).toBeGreaterThan(withoutLookup.steps.length);
  });

  it('scores 0 overall for an empty transcript', () => {
    const result = service.score('', false);
    expect(result.overall).toBe(0);
    expect(result.steps.every((s) => !s.detected)).toBe(true);
  });

  it('is case-insensitive', () => {
    const lower = service.score('hello, thank you for calling', false);
    const upper = service.score('HELLO, THANK YOU FOR CALLING', false);
    const greetingLower = lower.steps.find((s) => s.step === 'greeting');
    const greetingUpper = upper.steps.find((s) => s.step === 'greeting');
    expect(greetingLower?.detected).toBe(true);
    expect(greetingUpper?.detected).toBe(true);
  });
});
