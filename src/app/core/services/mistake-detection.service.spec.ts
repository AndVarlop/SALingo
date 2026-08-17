import { MistakeDetectionService } from './mistake-detection.service';

describe('MistakeDetectionService', () => {
  const service = new MistakeDetectionService();

  it('detects the "years working" grammar mistake and produces the correction', () => {
    const found = service.detect('I have 5 years working in customer service.');
    expect(found).toHaveLength(1);
    expect(found[0].category).toBe('grammar');
    expect(found[0].correct).toBe('I have 5 years of experience working');
  });

  it('detects the "peoples" vocabulary mistake', () => {
    const found = service.detect('The peoples here are very friendly.');
    expect(found.some((m) => m.wrong.toLowerCase() === 'peoples' && m.category === 'vocabulary')).toBe(true);
  });

  it('detects multiple distinct mistakes in one answer', () => {
    const found = service.detect('I am agree that the peoples were nice.');
    expect(found.length).toBeGreaterThanOrEqual(2);
  });

  it('returns an empty array for clean text', () => {
    const found = service.detect('I have five years of experience in customer service.');
    expect(found).toHaveLength(0);
  });

  it('returns an empty array for empty/whitespace input', () => {
    expect(service.detect('')).toHaveLength(0);
    expect(service.detect('   ')).toHaveLength(0);
  });

  it('is case-insensitive', () => {
    const found = service.detect('I AM AGREE with you');
    expect(found.length).toBeGreaterThan(0);
  });
});
