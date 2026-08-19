import { describe, expect, it } from 'vitest';
import { sanitizeReturnUrl } from './return-url.util';

describe('sanitizeReturnUrl', () => {
  it('accepts a same-app relative path', () => {
    expect(sanitizeReturnUrl('/lessons/en-b2-mixed-conditionals')).toBe('/lessons/en-b2-mixed-conditionals');
  });

  it('accepts a relative path with query params', () => {
    expect(sanitizeReturnUrl('/exam/b2-final-assessment?foo=bar')).toBe('/exam/b2-final-assessment?foo=bar');
  });

  it.each([null, undefined, ''])('rejects empty/missing input (%s)', (input) => {
    expect(sanitizeReturnUrl(input)).toBeNull();
  });

  it('rejects an absolute URL to another host (open redirect)', () => {
    expect(sanitizeReturnUrl('https://evil.example/phish')).toBeNull();
  });

  it('rejects a protocol-relative URL (open redirect)', () => {
    expect(sanitizeReturnUrl('//evil.example/phish')).toBeNull();
  });

  it('rejects a path with no leading slash', () => {
    expect(sanitizeReturnUrl('dashboard')).toBeNull();
  });

  it('rejects a javascript: pseudo-protocol payload', () => {
    expect(sanitizeReturnUrl('javascript:alert(1)')).toBeNull();
  });
});
