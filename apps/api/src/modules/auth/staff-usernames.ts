/**
 * Usernames for organization-managed staff accounts (teachers, coordinators, doctors).
 *
 * Many schools and hospitals have staff without an email domain, so staff sign in with
 * a username the administrator can read out or print: the person's name, a dot, and a
 * short handle for the organization (e.g. `sereysokbotra.ssla`). The account still needs
 * a unique email column, so it gets an address on the reserved `.invalid` domain, which
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
export const orgHandle = (name: string, fallback: string): string => {
  const words = name
    .split(/\s+/)
    .map(slugifyNamePart)
    .filter((word) => word.length > 0);
  if (words.length >= 2)
    return words
      .map((word) => word[0])
      .join('')
      .slice(0, 6);
  return (words[0] ?? '').slice(0, 8) || fallback;
};

export const schoolHandle = (schoolName: string): string => orgHandle(schoolName, 'school');
export const hospitalHandle = (hospitalName: string): string => orgHandle(hospitalName, 'hospital');

/**
 * The preferred username. Names in Khmer script slugify to nothing, so those
 * fall back to a role word ("teacher", "staff") and the organisation to its kind
 * ("school", "hospital"); the service then appends a number for uniqueness.
 */
export const baseStaffUsername = (
  firstName: string,
  lastName: string,
  orgName: string,
  personFallback = 'teacher',
  orgFallback = 'school',
): string => {
  const person = `${slugifyNamePart(firstName)}${slugifyNamePart(lastName)}`.slice(0, 24);
  return `${person || personFallback}.${orgHandle(orgName, orgFallback)}`;
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
