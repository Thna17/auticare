import type { OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="profile-hero">
      <div class="identity">
        <div class="avatar" aria-hidden="true">{{ initials() }}</div>
        <div>
          <p class="eyebrow">Parent profile</p>
          <h1>{{ displayName() }}</h1>
          <p>{{ parent()?.email || 'Loading account details...' }}</p>
        </div>
      </div>
      <a class="primary-link" routerLink="/children">Manage child profiles</a>
    </section>

    <section class="summary-grid" aria-label="Parent account summary">
      <article>
        <span>Role</span>
        <strong>{{ parent()?.role || 'Parent' }}</strong>
      </article>
      <article>
        <span>Account status</span>
        <strong>Active</strong>
      </article>
      <article>
        <span>Security</span>
        <strong>Protected</strong>
      </article>
    </section>

    <section class="content-grid">
      <section class="profile-panel" aria-labelledby="account-title">
        <header>
          <h2 id="account-title">Account details</h2>
          <p>Your profile information is used across child profiles, screening, and school reports.</p>
        </header>

        <div class="field-grid">
          <label class="field">
            <span>First name</span>
            <input [value]="parent()?.firstName || ''" readonly />
          </label>
          <label class="field">
            <span>Last name</span>
            <input [value]="parent()?.lastName || ''" readonly />
          </label>
          <label class="field full">
            <span>Email address</span>
            <input [value]="parent()?.email || ''" readonly />
          </label>
        </div>

        <p class="info-note">
          Profile editing for parent account details needs a backend account-update endpoint. This
          screen is structured for that flow and currently reflects your authenticated account.
        </p>
      </section>

      <aside class="side-panel" aria-label="Profile support">
        <h2>Care workspace</h2>
        <div class="support-row">
          <span>Next useful action</span>
          <strong>Review child profiles</strong>
          <a routerLink="/children">Open children</a>
        </div>
        <div class="support-row">
          <span>Security action</span>
          <strong>Password recovery ready</strong>
          <a routerLink="/forgot-password">Reset password</a>
        </div>
        <div class="calm-note">
          <h3>Profile tip</h3>
          <p>
            Keep child support notes specific and practical. Schools and care teams can use clear
            context more easily than long narrative notes.
          </p>
        </div>
      </aside>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .profile-hero {
        border-radius: 8px;
        background: #ffffff;
        border: 1px solid #dde5e4;
        box-shadow: 0 8px 30px rgb(41 74 90 / 0.06);
        padding: 26px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
        margin-bottom: 18px;
      }

      .identity {
        display: flex;
        align-items: center;
        gap: 18px;
        min-width: 0;
      }

      .avatar {
        width: 74px;
        height: 74px;
        border-radius: 24px;
        background: #c0e8fe;
        color: #244b5d;
        display: grid;
        place-items: center;
        font-size: 28px;
        font-weight: 900;
        flex: 0 0 auto;
      }

      h1,
      h2,
      h3,
      p {
        margin: 0;
      }

      .eyebrow {
        color: #546343;
        font-size: 13px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0;
        margin-bottom: 6px;
      }

      h1 {
        color: #001e2b;
        font-size: 40px;
        line-height: 1.2;
        letter-spacing: 0;
      }

      .identity p:last-child {
        color: #41484b;
        margin-top: 8px;
      }

      .primary-link {
        min-height: 46px;
        border-radius: 999px;
        background: #8db4c8;
        color: #123f52;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0 18px;
        text-decoration: none;
        font-weight: 800;
      }

      .primary-link:hover {
        background: #3d6375;
        color: #ffffff;
      }

      .summary-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 14px;
        margin-bottom: 18px;
      }

      .summary-grid article,
      .profile-panel,
      .side-panel {
        border: 1px solid #dde5e4;
        border-radius: 8px;
        background: #ffffff;
        box-shadow: 0 8px 30px rgb(41 74 90 / 0.05);
      }

      .summary-grid article {
        padding: 18px;
        display: grid;
        gap: 8px;
      }

      .summary-grid span,
      .support-row span {
        color: #71787c;
        font-size: 14px;
        line-height: 1.3;
      }

      .summary-grid strong,
      .support-row strong {
        color: #001e2b;
        font-size: 18px;
      }

      .content-grid {
        display: grid;
        grid-template-columns: minmax(0, 1.4fr) minmax(280px, 0.8fr);
        gap: 18px;
        align-items: start;
      }

      .profile-panel,
      .side-panel {
        padding: 24px;
        display: grid;
        gap: 20px;
      }

      header {
        display: grid;
        gap: 10px;
      }

      h2 {
        color: #001e2b;
        font-size: 24px;
        line-height: 1.3;
      }

      header p,
      .calm-note p,
      .info-note {
        color: #41484b;
        line-height: 1.55;
      }

      .field-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px;
      }

      .field {
        display: grid;
        gap: 10px;
        color: #001e2b;
        font-weight: 800;
      }

      .field.full {
        grid-column: 1 / -1;
      }

      input {
        width: 100%;
        min-height: 54px;
        border: 1px solid #b8c2c8;
        border-radius: 12px;
        background: #f8fcff;
        color: #001e2b;
        font: inherit;
        padding: 0 16px;
      }

      input:focus {
        border-color: #3d6375;
        box-shadow: 0 0 0 4px rgb(61 99 117 / 0.12);
        outline: none;
      }

      .info-note {
        border-radius: 12px;
        background: #e8f6ff;
        padding: 14px 16px;
      }

      .support-row {
        border-bottom: 1px solid #dde5e4;
        padding-bottom: 16px;
        display: grid;
        gap: 8px;
      }

      .support-row a {
        color: #164f68;
        font-weight: 800;
        text-decoration: none;
      }

      .support-row a:hover {
        text-decoration: underline;
      }

      .calm-note {
        border-radius: 8px;
        background: #e7eedf;
        padding: 18px;
        display: grid;
        gap: 8px;
      }

      h3 {
        font-size: 18px;
        line-height: 1.3;
      }

      @media (max-width: 860px) {
        .profile-hero,
        .identity {
          align-items: flex-start;
        }

        .profile-hero {
          flex-direction: column;
        }

        .summary-grid,
        .content-grid,
        .field-grid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 560px) {
        h1 {
          font-size: 32px;
        }

        .identity {
          flex-direction: column;
        }

        .primary-link {
          width: 100%;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPage implements OnInit {
  private readonly auth = inject(AuthService);

  readonly parent = this.auth.parent;
  readonly displayName = computed(() => {
    const parent = this.parent();
    if (!parent) return 'Parent profile';
    return `${parent.firstName} ${parent.lastName}`.trim();
  });

  ngOnInit() {
    if (!this.parent()) this.auth.loadCurrentUser().subscribe();
  }

  initials(): string {
    const parent = this.parent();
    if (!parent) return 'AC';
    return `${parent.firstName.slice(0, 1)}${parent.lastName.slice(0, 1)}`.toUpperCase();
  }
}
