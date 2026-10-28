import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PREVIEW_HOME, previewRole, setPreviewRole, type PreviewRole } from './preview-mode';

type RoleCard = { role: PreviewRole; title: string; text: string };

const ROLES: readonly RoleCard[] = [
  {
    role: 'parent',
    title: 'Parent',
    text: 'Dashboard, child, check-in result, notes and reports.',
  },
  {
    role: 'admin',
    title: 'Platform admin',
    text: 'Overview, users, schools, plans and content tools.',
  },
  {
    role: 'school-admin',
    title: 'School admin',
    text: 'School dashboard, students, teachers and plan.',
  },
  { role: 'teacher', title: 'Teacher', text: 'Assigned students and progress reports.' },
  { role: 'hospital', title: 'Hospital', text: 'Appointments, doctors and hospital profile.' },
];

/**
 * /preview — development only. Pick a role and the app opens as that sample
 * account, with sample data and no API. A full page load is used on purpose so
 * the sign-in state and route guards start fresh for the chosen role.
 */
@Component({
  selector: 'ac-preview-launcher-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="launcher">
      <header>
        <p class="kicker">Development preview</p>
        <h1>Open any dashboard without the backend</h1>
        <p class="lead">
          Pick a role. You are signed in as a sample account with sample data. Nothing is saved or
          sent anywhere. Pages that need real data show a short “needs the backend” message.
        </p>
      </header>

      <ul class="roles">
        @for (card of roles; track card.role) {
          <li>
            <button type="button" class="role" (click)="open(card.role)">
              <strong>{{ card.title }}</strong>
              <span>{{ card.text }}</span>
              @if (current() === card.role) {
                <em>Current</em>
              }
            </button>
          </li>
        }
      </ul>

      <div class="extra">
        <a routerLink="/preview/welcome">First-run questionnaire (no login)</a>
        @if (current()) {
          <button type="button" class="exit" (click)="exit()">Exit preview mode</button>
        }
      </div>
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        background: var(--ac-brand-50);
      }

      .launcher {
        max-width: 880px;
        margin: 0 auto;
        padding: 72px 20px;
        display: grid;
        gap: 32px;
      }

      .kicker {
        margin: 0;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: var(--ac-color-action-deep);
      }

      h1 {
        margin: 8px 0 12px;
        font-size: clamp(28px, 4vw, 40px);
        color: var(--ac-color-text-strong);
      }

      .lead {
        margin: 0;
        max-width: 640px;
        line-height: 1.6;
        color: var(--ac-color-text-muted);
      }

      .roles {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 14px;
      }

      .role {
        width: 100%;
        height: 100%;
        display: grid;
        gap: 6px;
        text-align: left;
        padding: 20px;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 14px;
        background: var(--ac-color-surface);
        font: inherit;
        cursor: pointer;
        transition:
          border-color 150ms ease,
          transform 150ms ease;
      }

      .role:hover {
        border-color: var(--ac-color-action);
        transform: translateY(-2px);
      }

      .role:focus-visible,
      .exit:focus-visible,
      .extra a:focus-visible {
        outline: 3px solid var(--ac-color-focus);
        outline-offset: 2px;
      }

      .role strong {
        font-size: 17px;
        color: var(--ac-color-text-strong);
      }

      .role span {
        font-size: 14px;
        line-height: 1.5;
        color: var(--ac-color-text-muted);
      }

      .role em {
        font-style: normal;
        font-size: 12px;
        font-weight: 700;
        color: var(--ac-color-action-deep);
      }

      .extra {
        display: flex;
        gap: 20px;
        align-items: center;
        flex-wrap: wrap;
      }

      .extra a {
        color: var(--ac-color-action-deep);
        font-weight: 700;
      }

      .exit {
        padding: 10px 18px;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 999px;
        background: var(--ac-color-surface);
        font: inherit;
        font-weight: 700;
        cursor: pointer;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewLauncherPage {
  protected readonly roles = ROLES;
  protected readonly current = signal(previewRole());

  protected open(role: PreviewRole): void {
    setPreviewRole(role);
    window.location.assign(PREVIEW_HOME[role]);
  }

  protected exit(): void {
    setPreviewRole(null);
    this.current.set(null);
  }
}
