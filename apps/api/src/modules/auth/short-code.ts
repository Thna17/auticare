import crypto from 'node:crypto';

/**
 * Short, human-typable codes: teacher setup codes and school connection codes.
 *
 * They are read aloud, printed and typed on phones, so the alphabet leaves out
 * characters people confuse (0/O, 1/I/L). Eight characters from 31 symbols is
 * about 40 bits; with single use, a few days' expiry and the login rate limit,
 * guessing is not a practical attack.
 *
 * Only an HMAC is stored. A plain hash of so short a value could be reversed
 * by brute force if the database leaked; keyed with a server secret it cannot.
 * The purpose is mixed into the HMAC so a code issued for one flow can never
 * be redeemed in the other.
 */

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 8;

export type ShortCodePurpose = 'staff-setup' | 'school-connection' | 'email-verification';

/** A new code, formatted for display as `XXXX-XXXX`. */
export const createShortCode = (): string => {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[crypto.randomInt(ALPHABET.length)];
  }
  return `${code.slice(0, 4)}-${code.slice(4)}`;
};

/** Accepts what people actually type: lower case, spaces, missing dash. */
export const normalizeShortCode = (input: string): string =>
  input.toUpperCase().replace(/[^A-Z0-9]/g, '');

export const hashShortCode = (input: string, secret: string, purpose: ShortCodePurpose): string =>
  crypto
    .createHmac('sha256', secret)
    .update(`${purpose}:${normalizeShortCode(input)}`)
    .digest('hex');
