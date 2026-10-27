import { computed, effect, inject, Injectable, signal } from '@angular/core';
import type { HospitalStaffRole } from '@auticare/contracts';
import { AuthService } from '../../../core/auth/auth.service';
import { HospitalManagementApi } from '../hospital-management.api';

/**
 * Whether the signed-in hospital account is an ADMIN, COORDINATOR, or DOCTOR.
 *
 * Loaded once per signed-in hospital account and cleared on sign-out, so the
 * shell and pages can adapt controls (e.g. team menu, editing doctors/profile,
 * appointments filter).
 */
@Injectable({ providedIn: 'root' })
export class HospitalStaffState {
  private readonly auth = inject(AuthService);
  private readonly api = inject(HospitalManagementApi);

  readonly role = signal<HospitalStaffRole | null>(null);
  private loadedFor: string | null = null;

  readonly isHospitalAdmin = computed(() => this.role() === 'ADMIN');
  readonly isDoctor = computed(() => this.role() === 'DOCTOR');
  readonly isCoordinator = computed(() => this.role() === 'COORDINATOR');

  constructor() {
    effect(() => {
      const parent = this.auth.parent();
      if (!parent || parent.role !== 'HOSPITAL') {
        this.role.set(null);
        this.loadedFor = null;
        return;
      }
      if (this.loadedFor === parent.id) return;
      this.loadedFor = parent.id;
      this.api.me().subscribe({
        next: (data) => this.role.set(data.staffRole ?? null),
        error: () => this.role.set(null),
      });
    });
  }
}
