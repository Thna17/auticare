import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

type NavItem = {
  readonly label: string;
  readonly path: string;
  readonly icon: string;
};

const primaryNav: readonly NavItem[] = [
  { label: 'Overview', path: '/dashboard', icon: 'grid' },
  { label: 'My Children', path: '/children', icon: 'family' },
  { label: 'Screening', path: '/screening', icon: 'checklist' },
  { label: 'Schools', path: '/schools', icon: 'school' },
  { label: 'Hospitals', path: '/hospitals', icon: 'hospital' },
  { label: 'Progress', path: '/progress', icon: 'trend' },
  { label: 'Appointments', path: '/appointments', icon: 'calendar' },
  { label: 'Messages', path: '/support', icon: 'mail' },
];

const secondaryNav: readonly NavItem[] = [
  { label: 'Saved', path: '/activities', icon: 'bookmark' },
  { label: 'Settings', path: '/settings', icon: 'settings' },
];

const mobileNav: readonly NavItem[] = [
  { label: 'Home', path: '/dashboard', icon: 'grid' },
  { label: 'Family', path: '/children', icon: 'family' },
  { label: 'Events', path: '/appointments', icon: 'calendar' },
  { label: 'Profile', path: '/settings', icon: 'person' },
];

@Component({
  selector: 'ac-app-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `<a class="skip" href="#main">Skip to content</a>

    <aside class="sidebar" aria-label="Primary navigation">
      <a class="brand" routerLink="/dashboard">AutiCare</a>

      <nav class="nav-list">
        @for (item of primaryNav; track item.path) {
          <a
            [routerLink]="item.path"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: item.path === '/dashboard' }"
          >
            <span class="nav-icon" [class]="item.icon" aria-hidden="true"></span>
            <span>{{ item.label }}</span>
          </a>
        }
      </nav>

      <a class="new-screening" routerLink="/screening">
        <span class="plus-icon" aria-hidden="true"></span>
        <span>New Screening</span>
      </a>

      <nav class="nav-list secondary" aria-label="Secondary navigation">
        @for (item of secondaryNav; track item.path) {
          <a [routerLink]="item.path" routerLinkActive="active">
            <span class="nav-icon" [class]="item.icon" aria-hidden="true"></span>
            <span>{{ item.label }}</span>
          </a>
        }
      </nav>
    </aside>

    <main id="main" class="shell"><router-outlet /></main>

    <nav class="mobile-nav" aria-label="Mobile navigation">
      @for (item of mobileNav.slice(0, 2); track item.path) {
        <a
          [routerLink]="item.path"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: item.path === '/dashboard' }"
        >
          <span class="nav-icon" [class]="item.icon" aria-hidden="true"></span>
          <span>{{ item.label }}</span>
        </a>
      }

      <a class="mobile-action" routerLink="/screening" aria-label="Start new screening">
        <span class="plus-icon" aria-hidden="true"></span>
      </a>

      @for (item of mobileNav.slice(2); track item.path) {
        <a [routerLink]="item.path" routerLinkActive="active">
          <span class="nav-icon" [class]="item.icon" aria-hidden="true"></span>
          <span>{{ item.label }}</span>
        </a>
      }
    </nav>`,
  styles: [
    `
      :host {
        display: block;
        min-height: 100svh;
        background: #f4faff;
        color: #001e2b;
      }

      .skip {
        position: fixed;
        left: -999px;
        top: 12px;
        z-index: 100;
        border-radius: 8px;
        background: #ffffff;
        color: #001e2b;
        padding: 10px 14px;
      }

      .skip:focus {
        left: 12px;
      }

      .sidebar {
        position: fixed;
        inset: 0 auto 0 0;
        z-index: 20;
        width: 260px;
        background: #e8f6ff;
        border-right: 1px solid #d4e6ef;
        display: flex;
        flex-direction: column;
        padding: 32px 8px 24px;
      }

      .brand {
        color: #315d72;
        text-decoration: none;
        font-size: 32px;
        line-height: 1;
        font-weight: 700;
        letter-spacing: 0;
        margin: 0 16px 54px;
      }

      .nav-list {
        display: grid;
        gap: 6px;
      }

      .nav-list a {
        min-height: 50px;
        border-radius: 12px;
        color: #263238;
        display: flex;
        align-items: center;
        gap: 14px;
        margin: 0 0;
        padding: 0 18px;
        text-decoration: none;
        font-size: 16px;
        line-height: 1.2;
        font-weight: 600;
        transition:
          background 160ms ease,
          color 160ms ease;
      }

      .nav-list a:hover,
      .nav-list a.active {
        background: #8db4c8;
        color: #103443;
      }

      .nav-icon,
      .plus-icon {
        position: relative;
        width: 24px;
        height: 24px;
        flex: 0 0 auto;
        color: currentColor;
      }

      .nav-icon::before,
      .nav-icon::after,
      .plus-icon::before,
      .plus-icon::after {
        content: '';
        position: absolute;
        box-sizing: border-box;
      }

      .grid::before {
        inset: 3px;
        border: 2px solid currentColor;
        box-shadow:
          9px 0 0 -2px currentColor,
          0 9px 0 -2px currentColor,
          9px 9px 0 -2px currentColor;
      }

      .family::before {
        left: 3px;
        top: 5px;
        width: 7px;
        height: 7px;
        border: 2px solid currentColor;
        border-radius: 999px;
        box-shadow: 11px 0 0 -1px currentColor;
      }

      .family::after {
        left: 1px;
        bottom: 3px;
        width: 22px;
        height: 10px;
        border: 2px solid currentColor;
        border-radius: 10px 10px 3px 3px;
      }

      .checklist::before {
        inset: 3px;
        border: 2px solid currentColor;
        border-radius: 3px;
      }

      .checklist::after {
        left: 8px;
        top: 8px;
        width: 10px;
        height: 7px;
        border-left: 2px solid currentColor;
        border-bottom: 2px solid currentColor;
        transform: rotate(-45deg);
      }

      .school::before {
        left: 2px;
        top: 6px;
        width: 20px;
        height: 12px;
        border: 2px solid currentColor;
        transform: rotate(45deg) skew(-10deg, -10deg);
      }

      .school::after {
        left: 8px;
        bottom: 2px;
        width: 9px;
        height: 9px;
        border: 2px solid currentColor;
        border-top: 0;
      }

      .hospital::before {
        inset: 3px;
        border: 2px solid currentColor;
        border-radius: 3px;
      }

      .hospital::after {
        left: 11px;
        top: 7px;
        width: 2px;
        height: 10px;
        background: currentColor;
        box-shadow: -4px 4px 0 0 currentColor;
        transform: rotate(90deg);
      }

      .trend::before {
        left: 3px;
        top: 13px;
        width: 18px;
        height: 8px;
        border-left: 2px solid currentColor;
        border-top: 2px solid currentColor;
        transform: skew(-35deg);
      }

      .trend::after {
        right: 2px;
        top: 5px;
        width: 7px;
        height: 7px;
        border-top: 2px solid currentColor;
        border-right: 2px solid currentColor;
      }

      .calendar::before {
        inset: 4px 3px 3px;
        border: 2px solid currentColor;
        border-radius: 3px;
      }

      .calendar::after {
        left: 6px;
        right: 6px;
        top: 9px;
        height: 2px;
        background: currentColor;
      }

      .mail::before {
        inset: 4px 2px;
        border: 2px solid currentColor;
        border-radius: 3px;
      }

      .mail::after {
        left: 4px;
        top: 8px;
        width: 16px;
        height: 10px;
        border-left: 2px solid currentColor;
        border-bottom: 2px solid currentColor;
        transform: rotate(-45deg);
      }

      .bookmark::before {
        inset: 3px 6px;
        border: 2px solid currentColor;
        border-bottom: 0;
        border-radius: 3px 3px 0 0;
      }

      .bookmark::after {
        left: 7px;
        bottom: 4px;
        width: 10px;
        height: 10px;
        border-left: 2px solid currentColor;
        border-bottom: 2px solid currentColor;
        transform: rotate(-45deg);
      }

      .settings::before {
        inset: 5px;
        border: 3px solid currentColor;
        border-radius: 999px;
      }

      .settings::after {
        left: 11px;
        top: 1px;
        width: 2px;
        height: 22px;
        background: currentColor;
        box-shadow:
          0 0 0 0 currentColor,
          0 0 0 0 currentColor;
        transform: rotate(45deg);
      }

      .person::before {
        left: 8px;
        top: 4px;
        width: 8px;
        height: 8px;
        border: 2px solid currentColor;
        border-radius: 999px;
      }

      .person::after {
        left: 4px;
        bottom: 3px;
        width: 16px;
        height: 9px;
        border: 2px solid currentColor;
        border-radius: 12px 12px 4px 4px;
      }

      .plus-icon::before {
        left: 11px;
        top: 5px;
        width: 2px;
        height: 14px;
        background: currentColor;
      }

      .plus-icon::after {
        left: 5px;
        top: 11px;
        width: 14px;
        height: 2px;
        background: currentColor;
      }

      .new-screening {
        min-height: 56px;
        border-radius: 12px;
        background: #3d6375;
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        margin: auto 10px 18px;
        text-decoration: none;
        font-weight: 700;
        box-shadow: 0 10px 26px rgb(61 99 117 / 0.18);
      }

      .secondary {
        border-top: 1px solid #c1d3dc;
        padding-top: 18px;
      }

      .shell {
        min-height: 100svh;
        margin-left: 260px;
        padding: 48px 56px 56px;
        background: #f4faff;
      }

      .mobile-nav {
        display: none;
      }

      @media (max-width: 860px) {
        .sidebar {
          display: none;
        }

        .shell {
          margin-left: 0;
          padding: 28px 20px 104px;
        }

        .mobile-nav {
          position: fixed;
          z-index: 30;
          left: 0;
          right: 0;
          bottom: 0;
          min-height: 72px;
          border-top: 1px solid #dde5e4;
          background: rgb(255 255 255 / 0.96);
          display: grid;
          grid-template-columns: 1fr 1fr 72px 1fr 1fr;
          align-items: center;
          padding: 8px 8px 10px;
          box-shadow: 0 -8px 28px rgb(41 74 90 / 0.08);
        }

        .mobile-nav a {
          color: #66747a;
          display: grid;
          justify-items: center;
          gap: 4px;
          text-decoration: none;
          font-size: 11px;
          font-weight: 800;
          line-height: 1.1;
        }

        .mobile-nav a.active {
          color: #3d6375;
        }

        .mobile-action {
          width: 58px;
          height: 58px;
          border-radius: 999px;
          background: #3d6375;
          color: #ffffff !important;
          place-self: start center;
          transform: translateY(-22px);
          box-shadow: 0 12px 28px rgb(61 99 117 / 0.28);
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  protected readonly primaryNav = primaryNav;
  protected readonly secondaryNav = secondaryNav;
  protected readonly mobileNav = mobileNav;
}
