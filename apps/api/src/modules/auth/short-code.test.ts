import { describe, expect, it } from 'vitest';
import { createShortCode, hashShortCode, normalizeShortCode } from './short-code.js';

const secret = 'test_secret_with_at_least_32_characters';

describe('short codes', () => {
  it('formats eight unambiguous characters as XXXX-XXXX', () => {
    for (let i = 0; i < 200; i++) {
      const code = createShortCode();
      expect(code).toMatch(/^[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}$/);
      // No characters people confuse when reading a code aloud.
      expect(code).not.toMatch(/[01OIL]/);
    }
  });

  it('accepts what people type: lower case, spaces, no dash', () => {
    expect(normalizeShortCode(' abcd-efgh ')).toBe('ABCDEFGH');
    expect(normalizeShortCode('abcd efgh')).toBe('ABCDEFGH');
    expect(hashShortCode('abcd efgh', secret, 'school-connection')).toBe(
      hashShortCode('ABCD-EFGH', secret, 'school-connection'),
    );
  });

  it('keeps purposes apart, so a code works only in the flow it was issued for', () => {
    expect(hashShortCode('ABCD-EFGH', secret, 'staff-setup')).not.toBe(
      hashShortCode('ABCD-EFGH', secret, 'school-connection'),
    );
  });

  it('is keyed: the same code under another secret hashes differently', () => {
    expect(hashShortCode('ABCD-EFGH', secret, 'staff-setup')).not.toBe(
      hashShortCode('ABCD-EFGH', `${secret}x`, 'staff-setup'),
    );
  });
});
