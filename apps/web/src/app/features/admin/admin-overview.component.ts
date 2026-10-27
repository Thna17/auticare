import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { AdminOverview } from '@auticare/contracts';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { PORTAL_PAGE_STYLES } from '../../design-system/styles/portal-page.styles';
import { actionLabel, errorMessage, formatDateTime } from './admin-format';
import { AdminPortalApi } from './data-access/admin-portal.api';

/**
 * The top of the admin dashboard: what needs attention (pending requests,
 * overdue plans) and how the platform is growing. Every tile links to the
 * page that handles it.
 */
@Component({
  standalone: true,
  imports: [RouterLink, UiMessageComponent],
  selector: 'ac-admin-overview',
  template: `
    @if (error(); as message) {
      <ac-ui-message tone="error">{{ message }}</ac-ui-message>
    } @else if (data(); as d) {
      <section class="stats" aria-label="Needs attention">
        <a class="stat" routerLink="/admin/school-registrations">
          <strong>{{ d.pending.schoolRequests }}</strong
          ><span>School requests waiting</span>
        </a>
        <a class="stat" routerLink="/admin/hospital-registrations">
          <strong>{{ d.pending.hospitalRequests }}</strong
          ><span>Hospital requests waiting</span>
        </a>
        <a class="stat" routerLink="/admin/staff">
          <strong>{{ d.pending.teacherSetups }}</strong
          ><span>Teachers not set up yet</span>
        </a>
        <a class="stat" routerLink="/admin/subscriptions">
          <strong>{{ d.subscriptions.pastDue }}</strong
          ><span>Plans with payment overdue</span>
        </a>
      </section>

      <section class="stats" aria-label="Platform">
        <a class="stat" routerLink="/admin/parents">
          <strong>{{ d.parents.total }}</strong>
          <span
            >Parents · {{ d.parents.new7d }} new this week, {{ d.parents.new30d }} this month</span
          >
        </a>
        <a class="stat" routerLink="/admin/schools">
          <strong>{{ d.schools.active }}</strong>
          <span>Active schools · {{ d.schools.suspended }} suspended</span>
        </a>
        <a class="stat" routerLink="/admin/subscriptions">
          <strong>{{ d.subscriptions.pro }}</strong
          ><span>Pro plans active</span>
        </a>
        <a class="stat" routerLink="/admin/subscriptions">
          <strong>{{ d.subscriptions.business }}</strong
          ><span>Business plans active</span>
        </a>
        <a class="stat" routerLink="/admin/sponsorships">
          <strong>{{ d.subscriptions.sponsoredActive }}</strong
          ><span>Sponsored Pro families</span>
        </a>
        <div class="stat">
          <strong>{{ d.aiConfigured ? 'On' : 'Off' }}</strong>
          <span>AI assistant {{ d.aiConfigured ? 'connected' : 'not configured' }}</span>
        </div>
      </section>

      @if (d.suspendedAccounts > 0) {
        <p class="note">
          {{ d.suspendedAccounts }} {{ d.suspendedAccounts === 1 ? 'account is' : 'accounts are' }}
          suspended.
        </p>
      }

      <section class="card" aria-labelledby="activity-title">
        <div class="plan-line">
          <h2 id="activity-title">Recent activity</h2>
          <a routerLink="/admin/audit" class="meta">View audit log</a>
        </div>
        <ul class="rows">
          @for (event of d.recentActivity; track event.id) {
            <li class="row">
              <div class="who">
                <strong>{{ label(event.action) }}</strong>
                <span class="meta">
                  {{ formatDateTime(event.createdAt) }}
                  @if (event.actorEmail) {
                    · {{ event.actorEmail }}
                  }
                </span>
              </div>
            </li>
          } @empty {
            <li class="empty">Nothing recorded yet.</li>
          }
        </ul>
      </section>
    }
  `,
  styles: [PORTAL_PAGE_STYLES],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminOverviewComponent implements OnInit {
  private readonly api = inject(AdminPortalApi);

  protected readonly data = signal<AdminOverview | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly label = actionLabel;
  protected readonly formatDateTime = formatDateTime;

  ngOnInit(): void {
    this.api.overview().subscribe({
      next: (data) => this.data.set(data),
      error: (err: unknown) =>
        this.error.set(errorMessage(err, 'The overview could not be loaded.')),
    });
  }
}
