import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import type { AdminSponsorshipSchool } from '@auticare/contracts';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';
import { PORTAL_PAGE_STYLES } from '../../design-system/styles/portal-page.styles';
import { errorMessage } from './admin-format';
import { AdminPortalApi } from './data-access/admin-portal.api';

/**
 * How each Business school is using its five sponsored Pro family accounts.
 * Counts only: who was invited is the school's business, and no child data is
 * involved in a sponsorship at all.
 */
@Component({
  standalone: true,
  imports: [UiMessageComponent, UiSpinnerComponent],
  selector: 'ac-admin-sponsorships-page',
  template: `
    <header class="page-head">
      <div>
        <h1>Sponsored Pro Accounts</h1>
        <p class="subtitle">
          Every Business plan includes five Pro family accounts the school gives to parents. These
          are family accounts, not teacher seats. Extra paid accounts come with online payment.
        </p>
      </div>
    </header>

    @if (loading()) {
      <ac-ui-spinner label="Loading sponsorships…" />
    } @else if (error(); as message) {
      <ac-ui-message tone="error">{{ message }}</ac-ui-message>
    } @else {
      <section class="stats" aria-label="Totals">
        <div class="stat">
          <strong>{{ totals().active }}</strong
          ><span>Families on sponsored Pro</span>
        </div>
        <div class="stat">
          <strong>{{ totals().invited }}</strong
          ><span>Offers waiting for a parent</span>
        </div>
        <div class="stat">
          <strong>{{ totals().schools }}</strong
          ><span>Schools with a Business plan</span>
        </div>
      </section>

      <section class="card" aria-label="Schools">
        <ul class="rows">
          @for (school of schools(); track school.schoolId) {
            <li class="row">
              <div class="who">
                <strong>{{ school.schoolName }}</strong>
                <span class="meta">
                  {{ school.active }} in use · {{ school.invited }} waiting ·
                  {{ school.ended }} ended
                </span>
              </div>
              <div
                class="meter"
                style="flex: 0 1 160px"
                role="meter"
                [attr.aria-valuenow]="school.slotsUsed"
                aria-valuemin="0"
                [attr.aria-valuemax]="school.slotsTotal"
                [attr.aria-label]="school.schoolName + ' slots in use'"
              >
                <span [style.width.%]="(school.slotsUsed / school.slotsTotal) * 100"></span>
              </div>
              <span class="meta">{{ school.slotsUsed }} / {{ school.slotsTotal }}</span>
              <span class="chip" [class.off]="!school.businessActive">{{
                school.businessActive ? 'Business active' : 'Plan not active'
              }}</span>
            </li>
          } @empty {
            <li class="empty">No school has a Business plan yet.</li>
          }
        </ul>
      </section>
    }
  `,
  styles: [PORTAL_PAGE_STYLES],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSponsorshipsPage implements OnInit {
  private readonly api = inject(AdminPortalApi);

  protected readonly schools = signal<AdminSponsorshipSchool[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly totals = computed(() => {
    const rows = this.schools();
    return {
      active: rows.reduce((sum, row) => sum + row.active, 0),
      invited: rows.reduce((sum, row) => sum + row.invited, 0),
      schools: rows.filter((row) => row.businessActive).length,
    };
  });

  ngOnInit(): void {
    this.api.sponsorships().subscribe({
      next: (rows) => {
        this.schools.set(rows);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(errorMessage(err, 'Sponsorships could not be loaded.'));
        this.loading.set(false);
      },
    });
  }
}
