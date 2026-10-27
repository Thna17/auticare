import { describe, expect, it } from 'vitest';
import { homeRouteFor } from './home-route';

describe('homeRouteFor', () => {
  it('returns /hospital/dashboard for HOSPITAL', () => {
    expect(homeRouteFor('HOSPITAL')).toBe('/hospital/dashboard');
  });

  it('returns /schools/enrollments for SCHOOL', () => {
    expect(homeRouteFor('SCHOOL')).toBe('/schools/enrollments');
  });

  it('returns /dashboard for ADMIN', () => {
    expect(homeRouteFor('ADMIN')).toBe('/dashboard');
  });

  it('returns /dashboard for PARENT and fallback', () => {
    expect(homeRouteFor('PARENT')).toBe('/dashboard');
    expect(homeRouteFor(undefined)).toBe('/dashboard');
    expect(homeRouteFor(null)).toBe('/dashboard');
  });
});
