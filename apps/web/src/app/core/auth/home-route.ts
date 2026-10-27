import type { UserRole } from '@auticare/contracts';

/**
 * Returns the primary home dashboard route for a given user role.
 */
export function homeRouteFor(role?: UserRole | null): string {
  switch (role) {
    case 'HOSPITAL':
      return '/hospital/dashboard';
    case 'SCHOOL':
      return '/schools/enrollments';
    case 'ADMIN':
      return '/dashboard';
    case 'PARENT':
    default:
      return '/dashboard';
  }
}
