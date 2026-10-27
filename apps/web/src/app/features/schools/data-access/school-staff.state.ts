import { computed, effect, inject, Injectable, signal } from '@angular/core';
import type { SchoolStaffRole } from '@auticare/contracts';
import { AuthService } from '../../../core/auth/auth.service';
import { SchoolsApi } from './schools.api';

/**
 * Whether the signed-in school account is the school's admin or a teacher.
 *
 * Loaded once per signed-in school account and cleared on sign-out, so the
 * shell can show staff and family-code links to the admin only. This is for
 * presentation; the API enforces the same rule on every request.
 */
@Injectable({ providedIn: 'root' })
export class SchoolStaffState {
  private readonly auth = inject(AuthService);
  private readonly schools = inject(SchoolsApi);

  private readonly role = signal<SchoolStaffRole | null>(null);
  private loadedFor: string | null = null;

  readonly isSchoolAdmin = computed(() => this.role() === 'ADMIN');

  constructor() {
    effect(() => {
      const parent = this.auth.parent();
      if (!parent || parent.role !== 'SCHOOL') {
        this.role.set(null);
        this.loadedFor = null;
        return;
      }
      if (this.loadedFor === parent.id) return;
      this.loadedFor = parent.id;
      this.schools.getMySchoolStaffProfile().subscribe({
        next: (staff) => this.role.set(staff.role),
        error: () => this.role.set(null),
      });
    });
  }
}
