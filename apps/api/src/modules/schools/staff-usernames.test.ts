import { describe, expect, it } from 'vitest';
import {
  baseStaffUsername,
  isStaffPlaceholderEmail,
  nextFreeUsername,
  schoolHandle,
  staffPlaceholderEmail,
} from './staff-usernames.js';

describe('staff usernames', () => {
  it('joins the teacher name and a short school handle', () => {
    expect(baseStaffUsername('So', 'Sereysokbotra', 'Sunrise Special Learning Academy')).toBe(
      'sosereysokbotra.ssla',
    );
  });

  it('folds accents and falls back when a name has no Latin letters', () => {
    expect(baseStaffUsername('Zoë', 'Núñez', 'Hope')).toBe('zoenunez.hope');
    expect(baseStaffUsername('សុខ', 'បុត្រា', 'Hope School')).toBe('teacher.hs');
  });

  it('uses initials for multi-word school names and a fallback for none', () => {
    expect(schoolHandle('Hope Center for Children')).toBe('hcfc');
    expect(schoolHandle('Sunrise')).toBe('sunrise');
    expect(schoolHandle('សាលា')).toBe('school');
  });

  it('numbers a username that is already taken', () => {
    const taken = new Set(['dara.ssla', 'dara2.ssla']);
    expect(nextFreeUsername('dara.ssla', taken)).toBe('dara3.ssla');
    expect(nextFreeUsername('sok.ssla', taken)).toBe('sok.ssla');
  });

  it('marks placeholder emails so they are never mailed', () => {
    const email = staffPlaceholderEmail('dara.ssla');
    expect(email).toBe('dara.ssla@staff.auticare.invalid');
    expect(isStaffPlaceholderEmail(email)).toBe(true);
    expect(isStaffPlaceholderEmail('dara@school.edu.kh')).toBe(false);
  });
});
