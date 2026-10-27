/**
 * Usernames for school-managed teacher accounts.
 *
 * Many schools have no email domain, so a teacher signs in with a username the
 * school can read out or print: the teacher's name, a dot, and a short handle
 * for the school (e.g. `sereysokbotra.ssla`). The account still needs a unique
 * email column, so it gets an address on the reserved `.invalid` domain, which
 * no mail system will ever deliver to.
 */

export const STAFF_EMAIL_DOMAIN = 'staff.auticare.invalid';

export const staffPlaceholderEmail = (username: string): string =>
  `${username}@${STAFF_EMAIL_DOMAIN}`;

/** True for accounts that must never be emailed (password reset, invitations). */
export const isStaffPlaceholderEmail = (email: string): boolean =>
  email.toLowerCase().endsWith(`@${STAFF_EMAIL_DOMAIN}`);

/** Latin letters and digits only; accents are folded, other scripts dropped. */
export const slugifyNamePart = (value: string): string =>
  value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

/** Initials for multi-word names ("Sunrise Special Learning Academy" → "ssla"). */
export const schoolHandle = (schoolName: string): string => {
  const words = schoolName
    .split(/\s+/)
    .map(slugifyNamePart)
    .filter((word) => word.length > 0);
  if (words.length >= 2)
    return words
      .map((word) => word[0])
      .join('')
      .slice(0, 6);
  return (words[0] ?? '').slice(0, 8) || 'school';
};

/**
 * The preferred username. Names in Khmer script slugify to nothing, so those
 * fall back to "teacher"; the service then appends a number for uniqueness.
 */
export const baseStaffUsername = (
  firstName: string,
  lastName: string,
  schoolName: string,
): string => {
  const person = `${slugifyNamePart(firstName)}${slugifyNamePart(lastName)}`.slice(0, 24);
  return `${person || 'teacher'}.${schoolHandle(schoolName)}`;
};

/** First free username: the base, then base2, base3… */
export const nextFreeUsername = (base: string, taken: ReadonlySet<string>): string => {
  if (!taken.has(base)) return base;
  const [person, handle] = base.split('.');
  for (let n = 2; ; n++) {
    const candidate = `${person}${n}.${handle}`;
    if (!taken.has(candidate)) return candidate;
  }
};
