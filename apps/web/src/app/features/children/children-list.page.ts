import type { OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { ChildResponse } from '@auticare/contracts';
import { AuthService } from '../../core/auth/auth.service';
import { UiEmptyStateComponent } from '../../design-system/components/ui-empty-state.component';
import { ChildrenFacade } from './state/children.facade';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';

@Component({
  standalone: true,
  imports: [RouterLink, UiEmptyStateComponent, UiMessageComponent],
  template: `
    <section class="page-header">
      <div>
        <p class="eyebrow">Family profiles</p>
        <h1>Children</h1>
        <p>Review each child profile, support notes, and care details in one calm place.</p>
      </div>
      @if (canCreateChildren()) {
        <a class="create-child" routerLink="/children/new">Add child</a>
      }
    </section>

    @if (facade.loading()) {
      <p class="status" aria-live="polite">Loading children...</p>
    } @else if (facade.error()) {
      <ac-ui-message tone="error">{{ facade.error() }}</ac-ui-message>
    } @else if (facade.children().length === 0) {
      <ac-ui-empty-state
        title="No child profiles yet"
        message="Create a profile when you are ready to track support plans."
      />
      @if (canCreateChildren()) {
        <a class="empty-action" routerLink="/children/new">Create child profile</a>
      }
    } @else {
      <section class="child-grid" aria-label="Child profiles">
        @for (child of facade.children(); track child.id) {
          <article class="child-card">
            <div class="avatar" aria-hidden="true">{{ initials(child) }}</div>
            <div class="card-content">
              <div>
                <h2>{{ child.firstName }}</h2>
                <p>{{ ageLabel(child.dateOfBirth) }} · Born {{ child.dateOfBirth }}</p>
              </div>
              @if (child.notes) {
                <p class="notes">{{ child.notes }}</p>
              } @else {
                <p class="notes muted">No support notes added yet.</p>
              }
            </div>
            <a class="profile-link" [routerLink]="['/children', child.id]">
              <span>View profile</span>
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  d="M5 12h13M13 6l6 6-6 6"
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2.4"
                />
              </svg>
            </a>
          </article>
        }
      </section>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        gap: 24px;
        margin-bottom: 28px;
      }

      .page-header div {
        max-width: 720px;
      }

      .create-child,
      .empty-action {
        align-self: center;
        border-radius: 12px;
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        min-height: 46px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0 18px;
        text-decoration: none;
        font-weight: var(--ac-font-weight-bold);
      }

      .create-child:hover,
      .empty-action:hover {
        background: var(--ac-color-ink-j);
      }

      .empty-action {
        margin-top: 16px;
      }

      .eyebrow {
        margin: 0 0 8px;
        color: var(--ac-color-olive);
        font-size: var(--ac-type-label);
        font-weight: var(--ac-font-weight-bold);
        text-transform: uppercase;
        letter-spacing: 0;
      }

      h1,
      h2,
      p {
        margin: 0;
      }

      h1 {
        color: var(--ac-color-text-strong);
        font-size: var(--ac-type-page-title);
        line-height: 1.25;
        letter-spacing: 0;
      }

      .page-header p:last-child {
        margin-top: 10px;
        color: var(--ac-color-text-body);
        font-size: var(--ac-type-page-subtitle);
        line-height: 1.55;
      }

      .status,
      .error {
        border-radius: 12px;
        padding: 16px;
        background: var(--ac-color-surface-info);
        color: var(--ac-color-ink-c);
      }

      .error {
        background: var(--ac-color-alert-surface);
        color: var(--ac-color-alert-strong);
      }

      .child-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 18px;
      }

      .child-card {
        min-height: 260px;
        border: 1px solid var(--ac-color-border);
        border-radius: 8px;
        background: var(--ac-color-surface);
        box-shadow: 0 8px 30px rgb(41 74 90 / 0.06);
        padding: 22px;
        display: grid;
        gap: 18px;
      }

      .avatar {
        width: 58px;
        height: 58px;
        border-radius: 18px;
        background: var(--ac-color-olive-light);
        color: var(--ac-color-olive-dark);
        display: grid;
        place-items: center;
        font-size: 22px;
        font-weight: var(--ac-font-weight-bold);
      }

      .card-content {
        display: grid;
        gap: 14px;
      }

      h2 {
        color: var(--ac-color-text-strong);
        font-size: 24px;
        line-height: 1.3;
      }

      .card-content p {
        color: var(--ac-color-text-body);
        line-height: 1.5;
      }

      .notes {
        min-height: 72px;
        border-radius: 8px;
        background: var(--ac-color-tint-blue-wash);
        padding: 14px;
      }

      .muted {
        color: var(--ac-color-grey-c);
      }

      .profile-link {
        align-self: end;
        min-height: 46px;
        border-radius: 999px;
        color: var(--ac-color-action-deep);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        text-decoration: none;
        font-weight: var(--ac-font-weight-bold);
      }

      .profile-link svg {
        width: 20px;
        height: 20px;
      }

      .profile-link:hover {
        text-decoration: underline;
      }

      @media (max-width: 640px) {
        .page-header {
          flex-direction: column;
        }

        .create-child {
          align-self: stretch;
        }

        h1 {
          font-size: 32px;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChildrenListPage implements OnInit {
  readonly facade = inject(ChildrenFacade);
  private readonly auth = inject(AuthService);
  readonly canCreateChildren = computed(() => this.auth.parent()?.role === 'PARENT');

  ngOnInit() {
    this.facade.load();
  }

  initials(child: ChildResponse): string {
    return child.firstName.slice(0, 2).toUpperCase();
  }

  ageLabel(dateOfBirth: string): string {
    const birthDate = new Date(`${dateOfBirth}T00:00:00`);
    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    const monthDelta = today.getMonth() - birthDate.getMonth();
    if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) {
      years -= 1;
    }
    return years === 1 ? '1 year old' : `${Math.max(years, 0)} years old`;
  }
}
