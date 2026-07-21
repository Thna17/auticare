import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import type { UserRole } from '@auticare/contracts';
import { AuthService } from '../auth/auth.service';

type NavItem = {
  readonly label: string;
  readonly path: string;
  readonly icon: string;
  readonly badge?: string;
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

const adminNav: readonly NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: 'grid' },
  { label: 'Family Records', path: '/children', icon: 'children' },
  { label: 'Schools', path: '/schools/admin', icon: 'school' },
  { label: 'Hospitals', path: '/hospitals', icon: 'hospital' },
  { label: 'School Reports', path: '/schools/reports', icon: 'checklist' },
];

const schoolNav: readonly NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: 'grid' },
  { label: 'School Profile', path: '/schools/profile', icon: 'school' },
  { label: 'Students', path: '/schools/enrollments', icon: 'children' },
  { label: 'Activities', path: '/schools/reports/new', icon: 'activity' },
  { label: 'Reports', path: '/schools/reports', icon: 'report' },
  { label: 'Notifications', path: '/notifications', icon: 'bell' },
];

const secondaryNav: readonly NavItem[] = [
  { label: 'Settings', path: '/settings', icon: 'settings' },
  { label: 'Help Center', path: '/support', icon: 'help' },
];

const mobileNav: readonly NavItem[] = [
  { label: 'Home', path: '/dashboard', icon: 'grid' },
  { label: 'Family', path: '/children', icon: 'family' },
  { label: 'Events', path: '/appointments', icon: 'calendar' },
  { label: 'Profile', path: '/settings', icon: 'person' },
];

const adminMobileNav: readonly NavItem[] = [
  { label: 'Home', path: '/dashboard', icon: 'grid' },
  { label: 'Families', path: '/children', icon: 'family' },
  { label: 'Schools', path: '/schools/admin', icon: 'school' },
  { label: 'Settings', path: '/settings', icon: 'settings' },
];

const schoolMobileNav: readonly NavItem[] = [
  { label: 'Home', path: '/dashboard', icon: 'grid' },
  { label: 'Children', path: '/schools/enrollments', icon: 'family' },
  { label: 'Reports', path: '/schools/reports', icon: 'checklist' },
  { label: 'Profile', path: '/schools/profile', icon: 'person' },
];

@Component({
  selector: 'ac-app-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `<a class="skip" href="#main">Skip to content</a>

    <aside class="sidebar" aria-label="Primary navigation">
      <header class="sidebar-header">
        <a class="brand" routerLink="/dashboard">
          <img class="brand-mark" src="/images/auticare-logo.jpg" alt="" aria-hidden="true" />
          <span>AutiCare</span>
        </a>
        <button class="menu-button" type="button" aria-label="Open navigation menu">
          <span aria-hidden="true"></span>
        </button>
      </header>

      <section class="account-card" aria-label="Current account">
        <span class="avatar" aria-hidden="true">{{ initials() }}</span>
        <span class="account-copy">
          <strong>{{ accountName() }}</strong>
          <span>{{ roleLabel() }}</span>
        </span>
        <span class="chevron" aria-hidden="true"></span>
      </section>

      <nav class="nav-list">
        @for (item of primaryNav(); track item.path) {
          <a
            [routerLink]="item.path"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: item.path === '/dashboard' }"
          >
            <span class="nav-icon" [class]="item.icon" aria-hidden="true"></span>
            <span>{{ item.label }}</span>
            @if (item.badge) {
              <span class="badge">{{ item.badge }}</span>
            }
          </a>
        }
      </nav>

      <a class="role-action" [routerLink]="primaryAction().path">
        <span class="plus-icon" aria-hidden="true"></span>
        <span>{{ primaryAction().label }}</span>
      </a>

      <nav class="nav-list secondary" aria-label="Secondary navigation">
        @for (item of secondaryNav(); track item.path) {
          <a [routerLink]="item.path" routerLinkActive="active">
            <span class="nav-icon" [class]="item.icon" aria-hidden="true"></span>
            <span>{{ item.label }}</span>
          </a>
        }

        <button class="logout-button" type="button" (click)="logout()">
          <span class="plus-icon" aria-hidden="true"></span>
          <span>Logout</span>
        </button>
      </nav>
    </aside>

    <main id="main" class="shell"><router-outlet /></main>

    <nav class="mobile-nav" aria-label="Mobile navigation">
      @for (item of mobileNav().slice(0, 2); track item.path) {
        <a
          [routerLink]="item.path"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: item.path === '/dashboard' }"
        >
          <span class="nav-icon" [class]="item.icon" aria-hidden="true"></span>
          <span>{{ item.label }}</span>
        </a>
      }

      <a
        class="mobile-action"
        [routerLink]="mobileAction().path"
        [attr.aria-label]="mobileAction().label"
      >
        <span class="plus-icon" aria-hidden="true"></span>
      </a>

      @for (item of mobileNav().slice(2); track item.path) {
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
        background: #f2f9fd;
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
        width: 292px;
        background: #e5f6ff;
        border-right: 1px solid #c9e5f1;
        display: flex;
        flex-direction: column;
        padding: 28px 18px 24px;
        overflow-y: auto;
      }

      .sidebar-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 28px;
      }

      .brand {
        color: #315d72;
        text-decoration: none;
        font-size: 24px;
        line-height: 1.1;
        font-weight: var(--ac-font-weight-semibold);
        letter-spacing: 0;
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }

      .brand-mark {
        width: 31px;
        height: 31px;
        border-radius: 999px;
        flex: 0 0 auto;
        object-fit: cover;
        box-shadow: 0 0 0 1px #9bc6d8;
      }

      .menu-button {
        width: 34px;
        height: 34px;
        border: 0;
        background: transparent;
        color: #759bad;
        display: grid;
        place-items: center;
      }

      .menu-button span,
      .menu-button span::before,
      .menu-button span::after {
        width: 16px;
        height: 2px;
        border-radius: 999px;
        background: currentColor;
        display: block;
        content: '';
      }

      .menu-button span::before {
        transform: translateY(-6px);
      }

      .menu-button span::after {
        transform: translateY(4px);
      }

      .account-card {
        min-height: 68px;
        border: 1px solid #c8e1ed;
        border-radius: 14px;
        background: #eefaff;
        display: grid;
        grid-template-columns: 44px 1fr 20px;
        align-items: center;
        gap: 12px;
        padding: 12px;
        margin: 0 8px 24px;
      }

      .avatar {
        width: 40px;
        height: 40px;
        border-radius: 999px;
        background: linear-gradient(135deg, #47758b, #9cc5d6);
        color: #ffffff;
        display: grid;
        place-items: center;
        font-size: 12px;
        font-weight: var(--ac-font-weight-semibold);
      }

      .account-copy {
        min-width: 0;
        display: grid;
        gap: 4px;
      }

      .account-copy strong {
        color: #19465b;
        font-size: var(--ac-type-label);
        line-height: 1.15;
        font-weight: var(--ac-font-weight-semibold);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .account-copy span {
        width: fit-content;
        border-radius: 999px;
        background: #d5eaf3;
        color: #315d72;
        font-size: 11px;
        font-weight: var(--ac-font-weight-medium);
        line-height: 1;
        padding: 5px 8px;
      }

      .chevron {
        width: 8px;
        height: 8px;
        border-right: 2px solid #315d72;
        border-bottom: 2px solid #315d72;
        transform: rotate(45deg) translateY(-2px);
      }

      .nav-list {
        display: grid;
        gap: 6px;
      }

      .nav-list a,
      .logout-button {
        position: relative;
        min-height: 54px;
        border: 0;
        border-radius: 14px;
        background: transparent;
        color: #34434a;
        display: flex;
        align-items: center;
        gap: 13px;
        padding: 0 14px;
        text-decoration: none;
        font: inherit;
        font-size: var(--ac-type-label);
        line-height: 1.2;
        font-weight: var(--ac-font-weight-medium);
        text-align: left;
        transition:
          background 160ms ease,
          color 160ms ease;
      }

      .nav-list a:hover,
      .logout-button:hover {
        background: rgb(255 255 255 / 0.55);
      }

      .nav-list a.active {
        background: #8db4c8;
        color: #103443;
        font-weight: var(--ac-font-weight-semibold);
      }

      .nav-list a.active::before {
        content: '';
        position: absolute;
        left: -10px;
        top: 14px;
        bottom: 14px;
        width: 4px;
        border-radius: 999px;
        background: #315d72;
      }

      .nav-icon,
      .plus-icon {
        position: relative;
        width: 22px;
        height: 22px;
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

      .plus::before {
        left: 11px;
        top: 5px;
        width: 2px;
        height: 14px;
        background: currentColor;
      }

      .plus::after {
        left: 5px;
        top: 11px;
        width: 14px;
        height: 2px;
        background: currentColor;
      }

      .badge {
        margin-left: auto;
        min-width: 22px;
        border-radius: 999px;
        background: #3d6375;
        color: #ffffff;
        font-size: 12px;
        font-weight: var(--ac-font-weight-semibold);
        line-height: 1;
        padding: 5px 7px;
        text-align: center;
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

      .children::before {
        left: 3px;
        top: 4px;
        width: 6px;
        height: 6px;
        border: 2px solid currentColor;
        border-radius: 999px;
        box-shadow:
          10px 0 0 -1px currentColor,
          5px 8px 0 -1px currentColor;
      }

      .children::after {
        left: 1px;
        bottom: 2px;
        width: 20px;
        height: 8px;
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

      .activity::before {
        left: 9px;
        top: 2px;
        width: 6px;
        height: 18px;
        background: currentColor;
        border-radius: 2px;
      }

      .activity::after {
        left: 2px;
        top: 8px;
        width: 18px;
        height: 6px;
        background: currentColor;
        border-radius: 2px;
      }

      .report::before {
        left: 3px;
        bottom: 3px;
        width: 18px;
        height: 18px;
        border-radius: 999px;
        border: 2px solid currentColor;
        clip-path: polygon(50% 50%, 100% 50%, 100% 100%, 50% 100%);
      }

      .report::after {
        left: 11px;
        top: 2px;
        width: 2px;
        height: 20px;
        background: currentColor;
      }

      .bell::before {
        left: 5px;
        top: 4px;
        width: 12px;
        height: 13px;
        border: 2px solid currentColor;
        border-radius: 9px 9px 4px 4px;
      }

      .bell::after {
        left: 9px;
        bottom: 1px;
        width: 5px;
        height: 5px;
        border-radius: 999px;
        background: currentColor;
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
        border: 2px solid currentColor;
        border-radius: 999px;
        box-shadow:
          0 -5px 0 -3px currentColor,
          0 5px 0 -3px currentColor,
          5px 0 0 -3px currentColor,
          -5px 0 0 -3px currentColor,
          4px 4px 0 -3px currentColor,
          -4px 4px 0 -3px currentColor,
          4px -4px 0 -3px currentColor,
          -4px -4px 0 -3px currentColor;
      }

      .settings::after {
        left: 9px;
        top: 9px;
        width: 4px;
        height: 4px;
        background: currentColor;
        border-radius: 999px;
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

      .help::before {
        inset: 3px;
        border-radius: 999px;
        background: currentColor;
      }

      .help::after {
        content: '?';
        inset: 0;
        color: #e5f6ff;
        display: grid;
        place-items: center;
        font-size: var(--ac-type-label);
        font-weight: var(--ac-font-weight-bold);
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

      .role-action {
        min-height: 54px;
        border-radius: 14px;
        background: #3d6375;
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        margin: 28px 8px 24px;
        text-decoration: none;
        font-size: var(--ac-type-label);
        font-weight: var(--ac-font-weight-semibold);
        box-shadow: 0 10px 22px rgb(61 99 117 / 0.22);
      }

      .secondary {
        border-top: 1px solid #c1d3dc;
        padding-top: 20px;
        margin-top: auto;
      }

      .logout-button {
        color: #c64c4c;
        cursor: pointer;
      }

      .logout-button .plus-icon::before {
        left: 4px;
        top: 6px;
        width: 10px;
        height: 10px;
        border: 2px solid currentColor;
        border-right: 0;
        background: transparent;
      }

      .logout-button .plus-icon::after {
        left: 9px;
        top: 10px;
        width: 12px;
        height: 2px;
        background: currentColor;
        box-shadow: 6px 0 0 -2px currentColor;
      }

      .shell {
        min-height: 100svh;
        margin-left: 292px;
        padding: 48px 56px 56px;
        background: #f2f9fd;
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
          font-weight: var(--ac-font-weight-bold);
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
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly role = computed<UserRole | undefined>(() => this.auth.parent()?.role);
  protected readonly primaryNav = computed(() => {
    if (this.role() === 'ADMIN') return adminNav;
    if (this.role() === 'SCHOOL') return schoolNav;
    return primaryNav;
  });
  protected readonly secondaryNav = computed(() => secondaryNav);
  protected readonly mobileNav = computed(() => {
    if (this.role() === 'ADMIN') return adminMobileNav;
    if (this.role() === 'SCHOOL') return schoolMobileNav;
    return mobileNav;
  });
  protected readonly mobileAction = computed(() => {
    if (this.role() === 'ADMIN')
      return { label: 'Create school account', path: '/schools/admin/new' };
    if (this.role() === 'SCHOOL')
      return { label: 'Create activity report', path: '/schools/reports/new' };
    return { label: 'Start new screening', path: '/screening' };
  });
  protected readonly primaryAction = computed(() => {
    if (this.role() === 'ADMIN')
      return { label: 'Create School Account', path: '/schools/admin/new' };
    if (this.role() === 'SCHOOL') return { label: 'Add Activity', path: '/schools/reports/new' };
    return { label: 'New Screening', path: '/screening' };
  });
  protected readonly accountName = computed(() => {
    const parent = this.auth.parent();
    if (!parent) return 'AutiCare user';
    if (parent.role === 'ADMIN') return 'Admin Panel';
    if (parent.role === 'SCHOOL') return `${parent.firstName} ${parent.lastName}`.trim();
    return `${parent.firstName} ${parent.lastName}`.trim();
  });
  protected readonly roleLabel = computed(() => {
    if (this.role() === 'ADMIN') return 'System administrator';
    if (this.role() === 'SCHOOL') return 'School account';
    return 'Parent account';
  });
  protected readonly initials = computed(() => {
    const name = this.accountName();
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  });

  protected logout() {
    this.auth.logout().subscribe({ next: () => void this.router.navigateByUrl('/login') });
  }
}
