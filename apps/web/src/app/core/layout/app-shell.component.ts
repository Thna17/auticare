import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  HostListener,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import type { UserRole } from '@auticare/contracts';
import { AuthService } from '../auth/auth.service';
import { NotificationsStateService } from '../notifications/notifications-state.service';
import { PreferencesService } from '../preferences/preferences.service';
import { I18nService } from '../i18n/i18n.service';
import { DICTIONARY } from '../i18n/i18n.dictionary';
import { NavIconComponent } from './nav-icon.component';
import { AnnouncementBannerComponent } from './announcement-banner.component';
import { SchoolStaffState } from '../../features/schools/data-access/school-staff.state';
import { SchoolRegistrationsService } from '../../features/admin/data-access/school-registrations.service';
import { HospitalRegistrationsService } from '../../features/admin/data-access/hospital-registrations.service';
import { HospitalStaffState } from '../../features/hospital-management/data-access/hospital-staff.state';

export type NavItem = {
  readonly label: string;
  readonly path: string;
  readonly icon: string;
  readonly badge?: string;
  /** Planned area with no page yet: shown greyed out with a "Soon" tag, not linked. */
  readonly soon?: boolean;
};

export type NavSection = {
  readonly title: string;
  readonly items: readonly NavItem[];
};

@Component({
  selector: 'ac-app-shell',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    NavIconComponent,
    AnnouncementBannerComponent,
  ],
  template: `
    <a class="skip" href="#main">{{ shellTexts().skipToContent }}</a>

    <aside
      class="sidebar"
      [class.collapsed]="sidebarCollapsed()"
      [attr.aria-label]="shellTexts().overview"
    >
      <header class="sidebar-header">
        <a class="brand" [routerLink]="brandLink()">
          <img
            class="brand-mark"
            src="/images/auticare-logo.png"
            alt=""
            aria-hidden="true"
            width="32"
            height="32"
          />
          <span class="brand-copy">
            <span class="brand-text">AutiCare</span>
            @if (sidebarSubtitle(); as subtitle) {
              <span class="brand-sub">{{ subtitle }}</span>
            }
          </span>
        </a>
        @if (role() === 'ADMIN') {
          <span class="role-pill">{{ shellTexts().adminBadge }}</span>
        }
        <button
          class="collapse-btn"
          type="button"
          [attr.aria-label]="
            sidebarCollapsed() ? shellTexts().expandSidebar : shellTexts().collapseSidebar
          "
          [attr.aria-expanded]="!sidebarCollapsed()"
          [title]="sidebarCollapsed() ? shellTexts().expandSidebar : shellTexts().collapseSidebar"
          (click)="toggleSidebar()"
        >
          <span class="collapse-icon" [class.collapsed]="sidebarCollapsed()" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="3" x2="9" y2="21"></line>
              <path [attr.d]="sidebarCollapsed() ? 'M14 9l3 3-3 3' : 'M17 15l-3-3 3-3'"></path>
            </svg>
          </span>
        </button>
      </header>

      <nav class="sidebar-nav" aria-label="Primary navigation sections">
        @for (section of navSections(); track section.title) {
          <div class="nav-section">
            @if (section.title) {
              <span class="nav-section-title" aria-hidden="true">{{ section.title }}</span>
            }
            <div class="nav-section-items">
              @for (item of section.items; track item.label) {
                @if (item.soon) {
                  <span
                    class="nav-link soon"
                    aria-disabled="true"
                    [attr.title]="
                      sidebarCollapsed() ? item.label + ' · ' + shellTexts().soon : null
                    "
                  >
                    <ac-nav-icon class="nav-icon" [name]="item.icon" />
                    <span class="nav-label">{{ item.label }}</span>
                    <span class="soon-tag">{{ shellTexts().soon }}</span>
                  </span>
                } @else {
                  <a
                    class="nav-link"
                    [routerLink]="item.path"
                    routerLinkActive="active"
                    [routerLinkActiveOptions]="{
                      exact: item.path === '/dashboard' || item.path === '/hospital/dashboard',
                    }"
                    [attr.title]="sidebarCollapsed() ? item.label : null"
                  >
                    <ac-nav-icon class="nav-icon" [name]="item.icon" />
                    <span class="nav-label">{{ item.label }}</span>
                    @if (item.badge) {
                      <span class="badge" aria-label="Unread count">{{ item.badge }}</span>
                    }
                  </a>
                }
              }
            </div>
          </div>
        }
      </nav>

      <a
        class="role-action"
        [routerLink]="primaryAction().path"
        [attr.title]="sidebarCollapsed() ? primaryAction().label : null"
      >
        <ac-nav-icon class="plus-icon" [name]="primaryAction().path === '/ai' ? 'ai' : 'plus'" />
        <span class="action-label">{{ primaryAction().label }}</span>
      </a>

      <div class="sidebar-footer">
        <a
          class="crisis-shortcut"
          routerLink="/crisis"
          [attr.title]="sidebarCollapsed() ? shellTexts().crisisAndUrgent : null"
        >
          <span class="crisis-icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
              ></path>
            </svg>
          </span>
          <span class="crisis-label">{{ shellTexts().crisisAndUrgent }}</span>
        </a>

        <button
          class="logout-button"
          type="button"
          (click)="logout()"
          [attr.title]="sidebarCollapsed() ? shellTexts().signOut : null"
        >
          <span class="logout-icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </span>
          <span class="logout-label">{{ shellTexts().signOut }}</span>
        </button>
      </div>
    </aside>

    <div class="shell" [class.sidebar-collapsed]="sidebarCollapsed()">
      <header class="topbar">
        <div class="topbar-left">
          <button
            class="topbar-toggle-btn"
            type="button"
            (click)="toggleSidebarOrDrawer()"
            [attr.aria-label]="
              sidebarCollapsed() ? shellTexts().expandSidebar : shellTexts().collapseSidebar
            "
            [title]="shellTexts().toggleNav"
          >
            <span class="toggle-bars" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
          <a class="topbar-brand" [routerLink]="brandLink()" aria-label="AutiCare home">
            <img
              class="brand-mark"
              src="/images/auticare-logo.png"
              alt=""
              aria-hidden="true"
              width="28"
              height="28"
            />
            <span class="topbar-brand-title">AutiCare</span>
          </a>
          <span class="topbar-portal-badge">{{ portalTitle() }}</span>
          @if (sensoryModeActive()) {
            <a class="sensory-mode-pill" routerLink="/settings" [title]="sensoryPreferenceTitle()">
              <span class="sensory-pill-dot" aria-hidden="true"></span>
              <span>{{ sensoryModeLabel() }}</span>
            </a>
          }
        </div>

        <div class="topbar-actions">
          <button
            type="button"
            class="topbar-lang-toggle"
            (click)="toggleLanguage()"
            [attr.aria-label]="
              currentLang() === 'km' ? shellTexts().switchToEnglish : shellTexts().switchToKhmer
            "
            [title]="
              currentLang() === 'km' ? shellTexts().switchToEnglish : shellTexts().switchToKhmer
            "
          >
            <span class="lang-flag" aria-hidden="true">{{
              currentLang() === 'km' ? '🇰🇭' : '🇬🇧'
            }}</span>
            <span class="lang-text">{{ currentLang() === 'km' ? 'ភាសាខ្មែរ' : 'English' }}</span>
          </button>

          <a
            [routerLink]="notificationPath()"
            class="topbar-icon-btn notification-btn"
            [attr.aria-label]="shellTexts().notifications"
            [title]="unreadCount() > 0 ? unreadNotificationTooltip() : shellTexts().notifications"
          >
            <span class="topbar-bell" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </span>
            @if (unreadCount() > 0) {
              <span class="topbar-ping" aria-label="Unread notifications indicator">
                <span class="ping-pulse" aria-hidden="true"></span>
                <span class="ping-count">{{ unreadCount() > 99 ? '99+' : unreadCount() }}</span>
              </span>
            }
          </a>

          <div class="profile-dropdown">
            <button
              class="profile-chip"
              type="button"
              (click)="toggleProfileMenu()"
              [attr.aria-expanded]="profileMenuOpen()"
              aria-haspopup="menu"
              [attr.aria-label]="shellTexts().userAccountMenu"
            >
              <span class="avatar-circle" aria-hidden="true">{{ initials() }}</span>
              <div class="profile-info">
                <strong class="user-display-name">{{ accountName() }}</strong>
                <span class="user-role-tag">{{ roleLabel() }}</span>
              </div>
              <span class="chip-chevron" [class.open]="profileMenuOpen()" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </span>
            </button>

            @if (profileMenuOpen()) {
              <div class="popover-scrim" (click)="closeProfileMenu()" aria-hidden="true"></div>
              <div
                class="popover-menu"
                role="menu"
                [attr.aria-label]="shellTexts().userAccountMenu"
              >
                <div class="popover-header">
                  <span class="popover-avatar" aria-hidden="true">{{ initials() }}</span>
                  <div class="popover-details">
                    <strong class="popover-name">{{ accountName() }}</strong>
                    <span class="popover-role">{{ roleLabel() }}</span>
                  </div>
                </div>
                <div class="popover-divider"></div>
                <a
                  class="popover-item"
                  role="menuitem"
                  [routerLink]="profileSettingsPath()"
                  (click)="closeProfileMenu()"
                >
                  <span class="popover-icon" aria-hidden="true">⚙️</span>
                  <span>{{ shellTexts().accountSettings }}</span>
                </a>
                <a
                  class="popover-item"
                  role="menuitem"
                  routerLink="/support"
                  (click)="closeProfileMenu()"
                >
                  <span class="popover-icon" aria-hidden="true">❓</span>
                  <span>{{ shellTexts().helpCenter }}</span>
                </a>
                <a
                  class="popover-item"
                  role="menuitem"
                  routerLink="/crisis"
                  (click)="closeProfileMenu()"
                >
                  <span class="popover-icon" aria-hidden="true">🛡️</span>
                  <span>{{ shellTexts().crisisSupport }}</span>
                </a>
                <div class="popover-divider"></div>
                <button
                  class="popover-item popover-logout"
                  role="menuitem"
                  type="button"
                  (click)="logout()"
                >
                  <span class="popover-icon" aria-hidden="true">🚪</span>
                  <span>{{ shellTexts().signOut }}</span>
                </button>
              </div>
            }
          </div>
        </div>
      </header>

      <main id="main" class="shell-body">
        <div class="content-container">
          <ac-announcement-banner />
          <router-outlet />
        </div>
      </main>
    </div>

    <nav class="mobile-nav" aria-label="Mobile navigation">
      @for (item of mobileNav().slice(0, 2); track item.path) {
        <a
          [routerLink]="item.path"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{
            exact: item.path === '/dashboard' || item.path === '/hospital/dashboard',
          }"
        >
          <ac-nav-icon class="nav-icon" [name]="item.icon" />
          <span class="mobile-label">{{ item.label }}</span>
          <span class="active-dot" aria-hidden="true"></span>
        </a>
      }

      <a
        class="mobile-action"
        [routerLink]="mobileAction().path"
        [attr.aria-label]="mobileAction().label"
        [title]="mobileAction().label"
      >
        <ac-nav-icon class="plus-icon" name="plus" />
      </a>

      @for (item of mobileNav().slice(2); track item.path) {
        <a
          [routerLink]="item.path"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{
            exact: item.path === '/dashboard' || item.path === '/hospital/dashboard',
          }"
        >
          <ac-nav-icon class="nav-icon" [name]="item.icon" />
          <span class="mobile-label">{{ item.label }}</span>
          <span class="active-dot" aria-hidden="true"></span>
        </a>
      }
    </nav>

    @if (mobileDrawerOpen()) {
      <div class="mobile-drawer-scrim" (click)="closeMobileDrawer()" aria-hidden="true"></div>
      <aside
        class="mobile-drawer"
        role="dialog"
        aria-label="Mobile navigation menu"
        aria-modal="true"
      >
        <header class="mobile-drawer-header">
          <div class="drawer-brand">
            <img src="/images/auticare-logo.png" alt="" width="32" height="32" class="brand-mark" />
            <div class="drawer-brand-info">
              <strong class="drawer-brand-name">AutiCare</strong>
              <span class="drawer-portal-name">{{ portalTitle() }}</span>
            </div>
          </div>
          <button
            type="button"
            class="drawer-close-btn"
            (click)="closeMobileDrawer()"
            [attr.aria-label]="shellTexts().closeDrawer"
          >
            ✕
          </button>
        </header>

        <nav class="mobile-drawer-nav" aria-label="Mobile drawer navigation">
          @for (section of navSections(); track section.title) {
            <div class="nav-section">
              @if (section.title) {
                <span class="nav-section-title">{{ section.title }}</span>
              }
              <div class="nav-section-items">
                @for (item of section.items; track item.label) {
                  @if (item.soon) {
                    <span class="nav-link soon" aria-disabled="true">
                      <ac-nav-icon class="nav-icon" [name]="item.icon" />
                      <span class="nav-label">{{ item.label }}</span>
                      <span class="soon-tag">{{ shellTexts().soon }}</span>
                    </span>
                  } @else {
                    <a
                      class="nav-link"
                      [routerLink]="item.path"
                      routerLinkActive="active"
                      (click)="closeMobileDrawer()"
                    >
                      <ac-nav-icon class="nav-icon" [name]="item.icon" />
                      <span class="nav-label">{{ item.label }}</span>
                      @if (item.badge) {
                        <span class="badge">{{ item.badge }}</span>
                      }
                    </a>
                  }
                }
              </div>
            </div>
          }
        </nav>

        <div class="mobile-drawer-footer">
          <a class="crisis-shortcut" routerLink="/crisis" (click)="closeMobileDrawer()">
            <span class="crisis-icon" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
                ></path>
              </svg>
            </span>
            <span class="crisis-label">{{ shellTexts().crisisAndUrgent }}</span>
          </a>
          <button type="button" class="logout-button" (click)="logout()">
            <span class="logout-icon" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </span>
            <span class="logout-label">{{ shellTexts().signOut }}</span>
          </button>
        </div>
      </aside>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100svh;
        background: var(--ac-color-tint-blue-faint);
        color: var(--ac-color-text-strong);
      }

      .skip {
        position: fixed;
        left: -999px;
        top: 12px;
        z-index: 100;
        border-radius: var(--ac-radius-sm);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-strong);
        padding: 10px 14px;
        box-shadow: var(--ac-shadow-md);
      }

      .skip:focus {
        left: 12px;
      }

      /* ─── SIDEBAR ─── */
      .sidebar {
        position: fixed;
        inset: 0 auto 0 0;
        z-index: 20;
        width: 264px;
        background: var(--ac-color-blue-tint-ice);
        border-right: 1px solid var(--ac-color-ice-blue-pale);
        display: flex;
        flex-direction: column;
        padding: 18px 14px 16px;
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: transparent transparent;
        transition:
          width var(--ac-motion-normal),
          padding var(--ac-motion-normal);
      }

      /* The scrollbar only appears while the pointer is over the sidebar. */
      .sidebar:hover {
        scrollbar-color: var(--ac-color-ice-blue-border) transparent;
      }

      .sidebar-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 2px 6px 16px;
        margin-bottom: 14px;
        border-bottom: 1px solid var(--ac-color-ice-blue-frost);
      }

      .brand {
        color: var(--ac-color-action-mid);
        text-decoration: none;
        font-size: 19px;
        line-height: 1.1;
        font-weight: var(--ac-font-weight-bold);
        letter-spacing: -0.01em;
        display: inline-flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
      }

      .brand-copy {
        display: grid;
        gap: 2px;
        min-width: 0;
      }

      .brand-sub {
        font-size: 12px;
        font-weight: var(--ac-font-weight-medium);
        letter-spacing: 0;
        color: var(--ac-color-text-slate);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .role-pill {
        margin-left: auto;
        padding: 3px 10px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-brand-100);
        color: var(--ac-brand-700);
        font-size: 12px;
        font-weight: var(--ac-font-weight-semibold);
        white-space: nowrap;
      }

      .brand-mark {
        width: 32px;
        height: 32px;
        border-radius: 10px;
        flex: 0 0 auto;
        object-fit: cover;
        box-shadow: 0 0 0 1px var(--ac-color-sky-light);
      }

      .collapse-btn {
        width: 32px;
        height: 32px;
        min-width: 32px;
        min-height: 32px;
        border: 0;
        border-radius: 8px;
        background: transparent;
        color: var(--ac-color-slate-icon);
        display: grid;
        place-items: center;
        cursor: pointer;
        padding: 0;
        transition:
          background var(--ac-motion-fast),
          color var(--ac-motion-fast);
      }

      .collapse-btn:hover {
        background: color-mix(in srgb, var(--ac-color-white) 80%, transparent);
        color: var(--ac-color-action-mid);
      }

      .collapse-btn:focus-visible {
        outline: 2px solid var(--ac-color-focus);
        outline-offset: 2px;
      }

      .collapse-icon {
        display: grid;
        place-items: center;
        transition: transform var(--ac-motion-normal);
      }

      .sidebar.collapsed {
        width: 76px;
        padding: 18px 10px 16px;
      }

      .sidebar.collapsed .sidebar-header {
        flex-direction: column;
        padding: 2px 0 14px;
      }

      .sidebar.collapsed .brand-copy,
      .sidebar.collapsed .role-pill,
      .sidebar.collapsed .soon-tag,
      .sidebar.collapsed .nav-section-title,
      .sidebar.collapsed .nav-label,
      .sidebar.collapsed .badge,
      .sidebar.collapsed .action-label,
      .sidebar.collapsed .logout-label {
        display: none;
      }

      /* Collapsed, a section is marked by a short rule instead of its title. */
      .sidebar.collapsed .nav-section + .nav-section {
        border-top: 1px solid var(--ac-color-ice-blue-frost);
        padding-top: 10px;
      }

      .sidebar.collapsed .role-action,
      .sidebar.collapsed .logout-button {
        justify-content: center;
        padding: 0;
      }

      .sidebar.collapsed .role-action {
        width: 44px;
        margin: 14px auto 10px;
      }

      .sidebar.collapsed .nav-link {
        justify-content: center;
        padding: 0;
        width: 44px;
        height: 44px;
        margin: 0 auto;
      }

      .sidebar.collapsed .nav-link.active::before {
        display: none;
      }

      .sidebar-nav {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      .nav-section {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .nav-section-title {
        padding: 4px 12px 6px;
        font-size: 11px;
        font-weight: var(--ac-font-weight-semibold);
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--ac-color-text-slate);
        user-select: none;
        transition: opacity var(--ac-motion-fast);
      }

      .nav-section-items {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .nav-link {
        position: relative;
        min-height: 40px;
        border-radius: 10px;
        background: transparent;
        color: var(--ac-color-ink-dark-slate);
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 0 12px;
        text-decoration: none;
        font-size: 14.5px;
        font-weight: var(--ac-font-weight-medium);
        line-height: 1.2;
        transition:
          background var(--ac-motion-fast),
          color var(--ac-motion-fast);
      }

      .nav-link .nav-icon {
        color: var(--ac-color-slate-icon);
        transition: color var(--ac-motion-fast);
      }

      .nav-link:hover {
        background: color-mix(in srgb, var(--ac-color-white) 70%, transparent);
        color: var(--ac-color-action-deep);
      }

      .nav-link:hover .nav-icon {
        color: var(--ac-color-action-mid);
      }

      .nav-link:focus-visible {
        outline: 2px solid var(--ac-color-focus);
        outline-offset: 1px;
      }

      .nav-link.active {
        background: var(--ac-color-surface);
        color: var(--ac-color-action-deep);
        font-weight: var(--ac-font-weight-semibold);
        box-shadow:
          0 1px 2px color-mix(in srgb, var(--ac-brand-900) 6%, transparent),
          0 0 0 1px var(--ac-color-ice-blue-frost);
      }

      .nav-link.active .nav-icon {
        color: var(--ac-color-action-mid);
      }

      .nav-link.active::before {
        content: '';
        position: absolute;
        left: 0;
        top: 10px;
        bottom: 10px;
        width: 3px;
        border-radius: 0 3px 3px 0;
        background: var(--ac-color-action-mid);
      }

      /* Planned areas: visible so the admin sees the roadmap, but not clickable. */
      .nav-link.soon {
        color: var(--ac-color-text-slate);
        cursor: default;
      }

      .nav-link.soon:hover {
        background: transparent;
        color: var(--ac-color-text-slate);
      }

      .nav-link.soon .nav-icon,
      .nav-link.soon:hover .nav-icon {
        color: var(--ac-color-slate-icon);
        opacity: 0.7;
      }

      .soon-tag {
        margin-left: auto;
        padding: 1px 7px;
        border-radius: var(--ac-radius-pill);
        border: 1px solid var(--ac-color-ice-blue-frost);
        font-size: 10.5px;
        font-weight: var(--ac-font-weight-semibold);
        letter-spacing: 0.02em;
        color: var(--ac-color-text-slate);
        white-space: nowrap;
      }

      /* In the sidebar the marker sits on the panel edge, outside the pill. */
      .sidebar .nav-link.active::before {
        left: -14px;
      }

      .badge {
        margin-left: auto;
        min-width: 20px;
        height: 20px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        font-size: 11px;
        font-weight: var(--ac-font-weight-bold);
        line-height: 20px;
        padding: 0 6px;
        text-align: center;
      }

      .role-action {
        min-height: 44px;
        border-radius: 12px;
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        margin: 18px 0 12px;
        text-decoration: none;
        font-size: 14.5px;
        font-weight: var(--ac-font-weight-semibold);
        box-shadow: var(--ac-shadow-sm);
        transition:
          background var(--ac-motion-fast),
          box-shadow var(--ac-motion-fast);
      }

      .role-action:hover {
        background: var(--ac-color-action-deep);
        box-shadow: var(--ac-shadow-hover);
      }

      .role-action:focus-visible {
        outline: 2px solid var(--ac-color-focus);
        outline-offset: 2px;
      }

      .sidebar-footer {
        margin-top: auto;
        padding-top: 12px;
        border-top: 1px solid var(--ac-color-ice-blue-frost);
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .crisis-shortcut {
        width: 100%;
        min-height: 40px;
        border: 0;
        border-radius: 10px;
        background: transparent;
        color: var(--ac-color-alert-text);
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 0 12px;
        text-decoration: none;
        font-size: 14.5px;
        font-weight: var(--ac-font-weight-semibold);
        transition: background var(--ac-motion-fast);
      }

      .crisis-shortcut:hover {
        background: var(--ac-color-red-tint-blush);
      }

      .crisis-icon {
        width: 20px;
        display: grid;
        place-items: center;
        color: currentColor;
      }

      .sidebar.collapsed .crisis-shortcut {
        justify-content: center;
        padding: 0;
        width: 44px;
        height: 44px;
        margin: 0 auto;
      }

      .sidebar.collapsed .crisis-label {
        display: none;
      }

      .logout-button {
        width: 100%;
        min-height: 40px;
        border: 0;
        border-radius: 10px;
        background: transparent;
        color: var(--ac-color-ink-dark-slate);
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 0 12px;
        font: inherit;
        font-size: 14.5px;
        font-weight: var(--ac-font-weight-medium);
        cursor: pointer;
        transition:
          background var(--ac-motion-fast),
          color var(--ac-motion-fast);
      }

      .logout-button:hover {
        background: var(--ac-color-red-50);
        color: var(--ac-color-red-600);
      }

      .logout-icon {
        width: 20px;
        display: grid;
        place-items: center;
        color: var(--ac-color-slate-icon);
      }

      .logout-button:hover .logout-icon {
        color: currentColor;
      }

      /* ─── MAIN SHELL & TOPBAR ─── */
      .shell {
        min-height: 100svh;
        margin-left: 264px;
        display: flex;
        flex-direction: column;
        background: var(--ac-color-tint-blue-faint);
        transition: margin-left var(--ac-motion-normal);
      }

      .shell.sidebar-collapsed {
        margin-left: 76px;
      }

      .topbar {
        position: sticky;
        top: 0;
        z-index: 15;
        height: 64px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 36px;
        background: color-mix(in srgb, var(--ac-color-white) 85%, transparent);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-bottom: 1px solid var(--ac-color-border);
      }

      .topbar-left {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .topbar-brand {
        display: none;
        align-items: center;
        gap: 8px;
        text-decoration: none;
        color: var(--ac-color-action-mid);
        font-weight: var(--ac-font-weight-bold);
        font-size: 16px;
      }

      .topbar-brand .brand-mark {
        width: 28px;
        height: 28px;
        border-radius: var(--ac-radius-pill);
        object-fit: cover;
      }

      .sensory-mode-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        background: var(--ac-color-surface-info);
        border: 1px solid var(--ac-color-border-info);
        border-radius: var(--ac-radius-pill);
        color: var(--ac-color-action-deep);
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-medium);
        text-decoration: none;
        transition:
          background var(--ac-motion-fast),
          border-color var(--ac-motion-fast);
      }

      .sensory-mode-pill:hover {
        background: var(--ac-color-tint-blue);
        border-color: var(--ac-color-action-mid);
      }

      .sensory-pill-dot {
        width: 6px;
        height: 6px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-action-mid);
      }

      .topbar-toggle-btn {
        display: none;
        width: 38px;
        height: 38px;
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-sm);
        background: transparent;
        color: var(--ac-color-text-slate);
        cursor: pointer;
        padding: 0;
        place-items: center;
        transition: background var(--ac-motion-fast);
      }

      .topbar-toggle-btn:hover {
        background: var(--ac-color-slate-100);
      }

      .toggle-bars {
        display: flex;
        flex-direction: column;
        gap: 4px;
        width: 18px;
      }

      .toggle-bars span {
        display: block;
        height: 2px;
        border-radius: var(--ac-radius-pill);
        background: currentColor;
      }

      .topbar-portal-badge {
        font-size: var(--ac-type-label);
        font-weight: var(--ac-font-weight-semibold);
        color: var(--ac-color-action-mid);
        letter-spacing: -0.01em;
      }

      .topbar-actions {
        display: flex;
        align-items: center;
        gap: 14px;
      }

      .topbar-lang-toggle {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 5px 12px;
        height: 38px;
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-surface);
        color: var(--ac-color-text);
        font-family: inherit;
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-semibold);
        cursor: pointer;
        transition:
          background var(--ac-motion-fast),
          border-color var(--ac-motion-fast),
          color var(--ac-motion-fast);
      }

      .topbar-lang-toggle:hover {
        background: var(--ac-color-slate-100);
        border-color: var(--ac-color-border-dark);
        color: var(--ac-color-text-strong);
      }

      .topbar-lang-toggle:focus-visible {
        outline: 2px solid var(--ac-color-focus);
        outline-offset: 2px;
      }

      .topbar-lang-toggle .lang-flag {
        font-size: 1.05rem;
        line-height: 1;
      }

      .topbar-lang-toggle .lang-text {
        line-height: 1;
      }

      .topbar-icon-btn {
        position: relative;
        width: 40px;
        height: 40px;
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-md);
        background: color-mix(in srgb, var(--ac-color-white) 90%, transparent);
        color: var(--ac-color-text-slate);
        display: grid;
        place-items: center;
        text-decoration: none;
        transition:
          background var(--ac-motion-fast),
          color var(--ac-motion-fast),
          border-color var(--ac-motion-fast);
      }

      .topbar-icon-btn:hover {
        background: var(--ac-color-surface);
        color: var(--ac-color-action-mid);
        border-color: var(--ac-color-border-info);
      }

      .topbar-ping {
        position: absolute;
        top: -4px;
        right: -4px;
        min-width: 18px;
        height: 18px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-red-600);
        color: var(--ac-color-text-on-action);
        font-size: 10px;
        font-weight: var(--ac-font-weight-bold);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 4px;
        box-shadow: 0 0 0 2px var(--ac-color-surface);
      }

      .ping-pulse {
        position: absolute;
        inset: -2px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-red-500);
        opacity: 0.75;
        animation: ac-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
      }

      @keyframes ac-ping {
        75%,
        100% {
          transform: scale(1.6);
          opacity: 0;
        }
      }

      .profile-dropdown {
        position: relative;
      }

      .profile-chip {
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-pill);
        background: color-mix(in srgb, var(--ac-color-white) 90%, transparent);
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 4px 12px 4px 5px;
        cursor: pointer;
        transition:
          background var(--ac-motion-fast),
          box-shadow var(--ac-motion-fast),
          border-color var(--ac-motion-fast);
      }

      .profile-chip:hover {
        background: var(--ac-color-surface);
        border-color: var(--ac-color-border-info);
        box-shadow: var(--ac-shadow-xs);
      }

      .avatar-circle {
        width: 32px;
        height: 32px;
        border-radius: var(--ac-radius-pill);
        background: linear-gradient(135deg, var(--ac-color-teal-slate), var(--ac-color-sky-soft));
        color: var(--ac-color-text-on-action);
        display: grid;
        place-items: center;
        font-size: 12px;
        font-weight: var(--ac-font-weight-semibold);
      }

      .profile-info {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        line-height: 1.15;
      }

      .user-display-name {
        color: var(--ac-color-text-strong);
        font-size: 13px;
        font-weight: var(--ac-font-weight-semibold);
        max-width: 140px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .user-role-tag {
        font-size: 10px;
        color: var(--ac-color-text-muted);
        font-weight: var(--ac-font-weight-medium);
      }

      .chip-chevron {
        display: grid;
        place-items: center;
        color: var(--ac-color-text-muted);
        transition: transform var(--ac-motion-fast);
      }

      .chip-chevron.open {
        transform: rotate(180deg);
      }

      .popover-scrim {
        position: fixed;
        inset: 0;
        z-index: 25;
        background: transparent;
      }

      .popover-menu {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        z-index: 30;
        width: 230px;
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-lg);
        background: var(--ac-color-surface);
        box-shadow: var(--ac-shadow-lg);
        padding: 8px;
        display: flex;
        flex-direction: column;
        animation: ac-slide-down var(--ac-motion-fast) var(--ac-ease-standard);
      }

      @keyframes ac-slide-down {
        from {
          opacity: 0;
          transform: translateY(-6px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .popover-header {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 10px 8px;
      }

      .popover-avatar {
        width: 36px;
        height: 36px;
        border-radius: var(--ac-radius-pill);
        background: linear-gradient(135deg, var(--ac-color-teal-slate), var(--ac-color-sky-soft));
        color: var(--ac-color-text-on-action);
        display: grid;
        place-items: center;
        font-size: 13px;
        font-weight: var(--ac-font-weight-semibold);
        flex: 0 0 auto;
      }

      .popover-details {
        min-width: 0;
        display: flex;
        flex-direction: column;
      }

      .popover-name {
        font-size: 13px;
        color: var(--ac-color-text-strong);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .popover-role {
        font-size: 11px;
        color: var(--ac-color-text-muted);
      }

      .popover-divider {
        height: 1px;
        background: var(--ac-color-border);
        margin: 6px 0;
      }

      .popover-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 9px 12px;
        border: 0;
        border-radius: var(--ac-radius-md);
        background: transparent;
        color: var(--ac-color-text-body);
        font: inherit;
        font-size: 13px;
        font-weight: var(--ac-font-weight-medium);
        text-decoration: none;
        cursor: pointer;
        text-align: left;
        width: 100%;
        transition: background var(--ac-motion-fast);
      }

      .popover-item:hover {
        background: var(--ac-color-slate-100);
        color: var(--ac-color-text-strong);
      }

      .popover-icon {
        font-size: 14px;
        line-height: 1;
      }

      .popover-logout {
        color: var(--ac-color-red-600);
      }

      .popover-logout:hover {
        background: var(--ac-color-red-50);
        color: var(--ac-color-red-700);
      }

      /* ─── SHELL BODY & CONTENT CONTAINER ─── */
      .shell-body {
        flex: 1;
        padding: 36px 36px 48px;
      }

      .content-container {
        width: 100%;
        max-width: 1200px;
        margin: 0 auto;
      }

      /* ─── MOBILE BOTTOM NAV ─── */
      .mobile-nav {
        display: none;
      }

      @media (max-width: 860px) {
        .sidebar {
          display: none;
        }

        .topbar-toggle-btn {
          display: grid;
        }

        .shell,
        .shell.sidebar-collapsed {
          margin-left: 0;
        }

        .topbar {
          padding: 0 16px;
        }

        .shell-body {
          padding: 24px 16px calc(88px + env(safe-area-inset-bottom, 0px));
        }

        .topbar-actions {
          gap: 8px;
        }

        .profile-chip {
          padding: 3px 8px 3px 4px;
          gap: 6px;
        }

        .user-role-tag {
          display: none;
        }

        .user-display-name {
          max-width: 80px;
          font-size: 12px;
        }

        .topbar-lang-toggle {
          padding: 4px 8px;
          height: 34px;
          font-size: 12px;
          gap: 4px;
        }

        .topbar-icon-btn {
          width: 36px;
          height: 36px;
        }

        .mobile-nav {
          position: fixed;
          z-index: 30;
          left: 0;
          right: 0;
          bottom: 0;
          min-height: 64px;
          padding-top: 4px;
          padding-bottom: max(env(safe-area-inset-bottom, 0px), 8px);
          border-top: 1px solid var(--ac-color-border);
          background: color-mix(in srgb, var(--ac-color-white) 95%, transparent);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          display: grid;
          grid-template-columns: 1fr 1fr 64px 1fr 1fr;
          align-items: center;
          box-shadow: 0 -4px 20px color-mix(in srgb, var(--ac-color-shadow) 8%, transparent);
          box-sizing: border-box;
        }

        .mobile-nav a {
          position: relative;
          color: var(--ac-color-text-muted);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          padding: 6px 2px 8px;
          text-decoration: none;
          font-size: 10px;
          font-weight: var(--ac-font-weight-medium);
          line-height: 1.2;
          transition: color var(--ac-motion-fast);
          min-width: 0;
        }

        .mobile-label {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
          text-align: center;
          font-size: 10px;
          letter-spacing: -0.01em;
          padding: 0 2px;
        }

        .mobile-nav a.active {
          color: var(--ac-color-action);
          font-weight: var(--ac-font-weight-semibold);
        }

        .active-dot {
          position: absolute;
          bottom: 2px;
          width: 4px;
          height: 4px;
          border-radius: var(--ac-radius-pill);
          background: var(--ac-color-action);
          display: none;
        }

        .mobile-nav a.active .active-dot {
          display: block;
        }

        .mobile-action {
          width: 50px;
          height: 50px;
          border-radius: var(--ac-radius-pill);
          background: var(--ac-color-action);
          color: var(--ac-color-text-on-action) !important;
          place-self: center;
          transform: translateY(-14px);
          box-shadow: 0 6px 18px color-mix(in srgb, var(--ac-brand-500) 35%, transparent);
          display: grid;
          place-items: center;
          transition:
            transform var(--ac-motion-fast),
            box-shadow var(--ac-motion-fast);
        }

        .mobile-action:active {
          transform: translateY(-12px) scale(0.96);
        }

        .topbar-brand {
          display: inline-flex;
        }

        .topbar-portal-badge {
          display: none;
        }
      }

      @media (max-width: 420px) {
        .topbar-brand-title {
          display: none;
        }

        .user-display-name {
          max-width: 60px;
        }
      }

      /* ─── MOBILE DRAWER (SLIDE-OVER) ─── */
      .mobile-drawer-scrim {
        position: fixed;
        inset: 0;
        z-index: 50;
        background: var(--ac-color-overlay);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        animation: ac-fade-in var(--ac-motion-fast) ease;
      }

      .mobile-drawer {
        position: fixed;
        inset: 0 auto 0 0;
        z-index: 55;
        width: min(85vw, 320px);
        background: var(--ac-color-surface);
        box-shadow: var(--ac-shadow-lg);
        display: flex;
        flex-direction: column;
        padding: 20px 16px;
        overflow-y: auto;
        animation: ac-drawer-slide var(--ac-motion-normal) var(--ac-ease-standard);
      }

      @keyframes ac-drawer-slide {
        from {
          transform: translateX(-100%);
        }
        to {
          transform: translateX(0);
        }
      }

      @keyframes ac-fade-in {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      .mobile-drawer-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--ac-color-border);
      }

      .drawer-brand {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .drawer-brand-info {
        display: flex;
        flex-direction: column;
        line-height: 1.2;
      }

      .drawer-brand-name {
        color: var(--ac-color-action-mid);
        font-size: 16px;
        font-weight: var(--ac-font-weight-bold);
      }

      .drawer-portal-name {
        font-size: 11px;
        color: var(--ac-color-text-muted);
      }

      .drawer-close-btn {
        width: 32px;
        height: 32px;
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-pill);
        background: transparent;
        color: var(--ac-color-text-muted);
        display: grid;
        place-items: center;
        font-size: 14px;
        cursor: pointer;
        transition:
          background var(--ac-motion-fast),
          color var(--ac-motion-fast);
      }

      .drawer-close-btn:hover {
        background: var(--ac-color-slate-100);
        color: var(--ac-color-text-strong);
      }

      .mobile-drawer-nav {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .mobile-drawer-footer {
        margin-top: auto;
        padding-top: 16px;
        border-top: 1px solid var(--ac-color-border);
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      /* ─── NAV ICONS: drawn by ac-nav-icon; size is set here per surface. ─── */
      .plus-icon {
        width: 18px;
        height: 18px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notificationsState = inject(NotificationsStateService);
  private readonly preferences = inject(PreferencesService, { optional: true });
  private readonly i18n = inject(I18nService, { optional: true });
  private readonly schoolStaff = inject(SchoolStaffState);
  private readonly schoolRegistrations = inject(SchoolRegistrationsService, { optional: true });
  private readonly hospitalStaffState = inject(HospitalStaffState, { optional: true });
  private readonly hospitalRegistrations = inject(HospitalRegistrationsService, { optional: true });

  constructor() {
    effect(() => {
      if (this.role() === 'ADMIN') {
        untracked(() => {
          this.schoolRegistrations?.fetchPendingCount().subscribe({ error: () => {} });
          this.hospitalRegistrations?.fetchPendingCount().subscribe({ error: () => {} });
        });
      }
    });
  }

  readonly sidebarCollapsed = signal(false);
  readonly profileMenuOpen = signal(false);
  readonly mobileDrawerOpen = signal(false);
  readonly currentLang = computed(() => this.i18n?.currentLang() ?? 'km');

  toggleLanguage(): void {
    this.i18n?.toggleLanguage();
  }

  @HostListener('window:keydown', ['$event'])
  protected handleKeydown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'b') {
      event.preventDefault();
      this.toggleSidebar();
    } else if (event.key === 'Escape') {
      if (this.profileMenuOpen()) this.closeProfileMenu();
      if (this.mobileDrawerOpen()) this.closeMobileDrawer();
    }
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update((collapsed) => !collapsed);
  }

  toggleProfileMenu(): void {
    this.profileMenuOpen.update((open) => !open);
  }

  closeProfileMenu(): void {
    this.profileMenuOpen.set(false);
  }

  toggleMobileDrawer(): void {
    this.mobileDrawerOpen.update((open) => !open);
  }

  openMobileDrawer(): void {
    this.mobileDrawerOpen.set(true);
  }

  closeMobileDrawer(): void {
    this.mobileDrawerOpen.set(false);
  }

  toggleSidebarOrDrawer(): void {
    if (typeof window !== 'undefined' && window.innerWidth <= 860) {
      this.toggleMobileDrawer();
    } else {
      this.toggleSidebar();
    }
  }

  readonly shellTexts = computed(() => {
    return this.i18n ? this.i18n.dictionary.shell : DICTIONARY[this.currentLang()].shell;
  });

  protected readonly unreadNotificationTooltip = computed(() => {
    const unread = this.unreadCount();
    return (
      this.i18n?.t('shell.unreadNotifications', { count: unread }) ??
      `${unread} unread notifications`
    );
  });

  protected readonly sensoryPreferenceTitle = computed(() => {
    return (
      this.i18n?.t('shell.sensoryPreferenceTitle', { mode: this.sensoryModeLabel() }) ??
      `Active sensory preference: ${this.sensoryModeLabel()}. Click to configure in Settings.`
    );
  });

  readonly sensoryModeActive = computed(() => {
    if (!this.preferences) return false;
    return (
      this.preferences.highContrast() ||
      this.preferences.calmingPalette() ||
      this.preferences.reducedMotion()
    );
  });

  readonly sensoryModeLabel = computed(() => {
    if (!this.preferences) return '';
    const s = this.shellTexts();
    if (this.preferences.highContrast()) return s.highContrast;
    if (this.preferences.calmingPalette()) return s.calmSensory;
    if (this.preferences.reducedMotion()) return s.reducedMotion;
    return '';
  });

  protected readonly role = computed<UserRole | undefined>(() => this.auth.parent()?.role);

  protected readonly brandLink = computed(() =>
    this.role() === 'HOSPITAL' ? '/hospital/dashboard' : '/dashboard',
  );

  protected readonly unreadCount = computed(() => this.notificationsState.unreadCount());

  protected readonly notificationPath = computed(() => '/notifications');

  protected readonly profileSettingsPath = computed(() => {
    if (this.role() === 'SCHOOL') return '/schools/profile';
    if (this.role() === 'HOSPITAL') return '/hospital/profile';
    return '/settings';
  });

  protected readonly portalTitle = computed(() => {
    const s = this.shellTexts();
    if (this.role() === 'ADMIN') return s.adminPortal;
    if (this.role() === 'SCHOOL') return s.educationPortal;
    if (this.role() === 'HOSPITAL') return s.clinicalCare;
    return s.familyPortal;
  });

  /** Line under "AutiCare" in the sidebar for the portals that have one. */
  protected readonly sidebarSubtitle = computed(() => {
    const s = this.shellTexts();
    if (this.role() === 'ADMIN') return s.platformAdministration;
    if (this.role() === 'SCHOOL') {
      return this.schoolStaff.isSchoolAdmin() ? s.schoolManagementPortal : s.teacherPortal;
    }
    if (this.role() === 'PARENT') return s.parentPortal;
    return null;
  });

  protected readonly navSections = computed<readonly NavSection[]>(() => {
    const s = this.shellTexts();
    const role = this.role();
    const unread = this.unreadCount();
    const badge = unread > 0 ? String(unread) : undefined;

    if (role === 'ADMIN') {
      const pendingCount = this.schoolRegistrations?.pendingCount() ?? 0;
      const requestBadge = pendingCount > 0 ? String(pendingCount) : undefined;
      const hospitalPendingCount = this.hospitalRegistrations?.pendingCount() ?? 0;
      const hospitalRequestBadge =
        hospitalPendingCount > 0 ? String(hospitalPendingCount) : undefined;
      // Areas without a page yet are listed as `soon` (greyed out, not linked).
      // Their `soon:` paths are placeholders that are never navigated to.
      return [
        {
          // Overview stands alone at the top, without a section heading.
          title: '',
          items: [{ label: s.overview, path: '/dashboard', icon: 'grid' }],
        },
        {
          title: s.userManagement,
          items: [
            { label: s.parentsFamilies, path: '/admin/parents', icon: 'family' },
            { label: s.schoolsOrganizations, path: '/admin/schools', icon: 'building' },
            {
              label: s.schoolRequests,
              path: '/admin/school-registrations',
              icon: 'checklist',
              badge: requestBadge,
            },
            {
              label: s.hospitalRequests,
              path: '/admin/hospital-registrations',
              icon: 'checklist',
              badge: hospitalRequestBadge,
            },
            { label: s.teachersStaff, path: '/admin/staff', icon: 'school' },
            { label: s.adminTeamRoles, path: 'soon:admin-team', icon: 'shield', soon: true },
          ],
        },
        {
          title: s.aiAndContent,
          items: [
            { label: s.questionnaireManagement, path: '/admin/questionnaire', icon: 'report' },
            { label: s.aiConfiguration, path: '/admin/ai', icon: 'brain' },
            { label: s.resourcesActivities, path: '/admin/activities', icon: 'book' },
            { label: s.supportServicesDirectory, path: '/hospitals/admin', icon: 'pin' },
          ],
        },
        {
          title: s.subscriptionsRevenue,
          items: [
            { label: s.subscriptionPlans, path: '/admin/subscriptions', icon: 'card' },
            { label: s.paymentsTransactions, path: 'soon:payments', icon: 'receipt', soon: true },
            { label: s.sponsoredProAccounts, path: '/admin/sponsorships', icon: 'gift' },
          ],
        },
        {
          title: s.operationsGrowth,
          items: [
            { label: s.partnerships, path: '/admin/partnerships', icon: 'handshake' },
            { label: s.inquiriesSupport, path: 'soon:inquiries', icon: 'chat', soon: true },
            { label: s.analyticsReports, path: '/admin/analytics', icon: 'chart' },
            { label: s.announcementsPromotions, path: '/admin/announcements', icon: 'megaphone' },
          ],
        },
        {
          title: s.system,
          items: [
            { label: s.auditLogs, path: '/admin/audit', icon: 'file' },
            { label: s.platformSettings, path: '/settings', icon: 'gear' },
            { label: s.helpDocumentation, path: '/admin/help', icon: 'help' },
          ],
        },
      ];
    }

    if (role === 'SCHOOL') {
      // The school admin runs the school; a teacher sees only their own students.
      // Planned areas are `soon`: greyed out, never linked.
      if (this.schoolStaff.isSchoolAdmin()) {
        return [
          { title: '', items: [{ label: s.overview, path: '/dashboard', icon: 'grid' }] },
          {
            title: s.studentManagement,
            items: [
              { label: s.students, path: '/schools/enrollments', icon: 'family' },
              { label: s.progressReports, path: '/schools/reports', icon: 'chart' },
            ],
          },
          {
            title: s.organization,
            items: [
              { label: s.teachersStaff, path: '/schools/staff', icon: 'school' },
              { label: s.sponsoredProAccounts, path: '/schools/sponsorships', icon: 'gift' },
              { label: s.schoolProfile, path: '/schools/profile', icon: 'building' },
            ],
          },
          {
            title: s.settings,
            items: [
              { label: s.settings, path: '/settings', icon: 'gear' },
              { label: s.parentCollaboration, path: '/schools/connect', icon: 'family' },
              { label: s.parentInquiries, path: '/schools/inquiries', icon: 'chat' },
              { label: s.subscriptionBilling, path: '/schools/subscription', icon: 'card' },
            ],
          },
          {
            title: s.support,
            items: [{ label: s.helpSupport, path: '/support', icon: 'help' }],
          },
        ];
      }
      return [
        { title: '', items: [{ label: s.overview, path: '/dashboard', icon: 'grid' }] },
        {
          title: s.studentManagement,
          items: [
            { label: s.myStudents, path: '/schools/enrollments', icon: 'family' },
            { label: s.progressReports, path: '/schools/reports', icon: 'chart' },
          ],
        },
        {
          title: s.learningResources,
          items: [
            { label: s.resourcesActivities, path: 'soon:resources', icon: 'book', soon: true },
          ],
        },
        {
          title: s.other,
          items: [{ label: s.notifications, path: '/notifications', icon: 'bell', badge }],
        },
        {
          title: s.account,
          items: [
            { label: s.myProfile, path: 'soon:profile', icon: 'person', soon: true },
            { label: s.settings, path: '/settings', icon: 'gear' },
          ],
        },
      ];
    }

    if (role === 'HOSPITAL') {
      const hospitalCareItems: NavItem[] = [
        { label: s.overview, path: '/hospital/dashboard', icon: 'grid' },
        { label: s.appointments, path: '/hospital/appointments', icon: 'calendar' },
        { label: s.doctors, path: '/hospital/doctors', icon: 'hospital' },
      ];
      if (this.hospitalStaffState?.isHospitalAdmin()) {
        hospitalCareItems.push({ label: s.team, path: '/hospital/team', icon: 'family' });
      }

      return [
        {
          title: s.careAndDevelopment,
          items: hospitalCareItems,
        },
        {
          title: s.directoryAndVisits,
          items: [{ label: s.hospitalProfile, path: '/hospital/profile', icon: 'person' }],
        },
        {
          title: s.support,
          items: [
            { label: s.notifications, path: '/notifications', icon: 'bell', badge },
            { label: s.crisisSupport, path: '/crisis', icon: 'help' },
            { label: s.helpCenter, path: '/support', icon: 'help' },
            { label: s.accountSettings, path: '/settings', icon: 'settings' },
          ],
        },
      ];
    }

    // Default: PARENT. Every item opens an existing parent page.
    return [
      { title: '', items: [{ label: s.dashboard, path: '/dashboard', icon: 'grid' }] },
      {
        title: s.myChildren,
        items: [
          { label: s.myChildren, path: '/children', icon: 'children' },
          { label: s.behaviorTracking, path: '/observations', icon: 'report' },
          // Not in the design, but the only way in to enter a school's family code.
          { label: s.mySchools, path: '/connections', icon: 'school' },
        ],
      },
      {
        title: s.supportLearning,
        items: [
          { label: s.aiParentAssistant, path: '/ai', icon: 'ai' },
          { label: s.resourcesActivities, path: '/activities', icon: 'book' },
          { label: s.findSupport, path: '/find-support', icon: 'pin' },
        ],
      },
      {
        title: s.progress,
        items: [{ label: s.reports, path: '/reports', icon: 'file' }],
      },
      {
        title: s.other,
        items: [{ label: s.notifications, path: '/notifications', icon: 'bell', badge }],
      },
      {
        title: s.account,
        items: [
          { label: s.subscription, path: '/subscription', icon: 'card' },
          { label: s.settingsPrivacy, path: '/settings', icon: 'gear' },
        ],
      },
    ];
  });

  protected readonly mobileNav = computed<readonly NavItem[]>(() => {
    const s = this.shellTexts();
    if (this.role() === 'ADMIN') {
      return [
        { label: s.overview, path: '/dashboard', icon: 'grid' },
        { label: s.familyRecords, path: '/children', icon: 'family' },
        { label: s.schools, path: '/schools/admin', icon: 'school' },
        { label: s.accountSettings, path: '/settings', icon: 'settings' },
      ];
    }
    if (this.role() === 'SCHOOL') {
      return [
        { label: s.overview, path: '/dashboard', icon: 'grid' },
        { label: s.students, path: '/schools/enrollments', icon: 'family' },
        { label: s.reports, path: '/schools/reports', icon: 'checklist' },
        { label: s.schoolProfile, path: '/schools/profile', icon: 'person' },
      ];
    }
    if (this.role() === 'HOSPITAL') {
      return [
        { label: s.overview, path: '/hospital/dashboard', icon: 'grid' },
        { label: s.appointments, path: '/hospital/appointments', icon: 'calendar' },
        { label: s.doctors, path: '/hospital/doctors', icon: 'hospital' },
        { label: s.hospitalProfile, path: '/hospital/profile', icon: 'person' },
      ];
    }
    return [
      { label: s.overview, path: '/dashboard', icon: 'grid' },
      { label: s.aiAssistant, path: '/ai', icon: 'ai' },
      { label: s.documents, path: '/documents', icon: 'checklist' },
      { label: s.profile, path: '/profile', icon: 'person' },
    ];
  });

  protected readonly mobileAction = computed(() => {
    const s = this.shellTexts();
    if (this.role() === 'ADMIN') {
      return { label: s.createSchoolAccount, path: '/schools/admin/new' };
    }
    if (this.role() === 'SCHOOL') {
      return { label: s.addActivity, path: '/schools/reports/new' };
    }
    if (this.role() === 'HOSPITAL') {
      return { label: s.manageAppointments, path: '/hospital/appointments' };
    }
    return { label: s.newScreening, path: '/screening' };
  });

  protected readonly primaryAction = computed(() => {
    const s = this.shellTexts();
    if (this.role() === 'ADMIN') {
      return { label: s.createSchoolAccount, path: '/schools/admin/new' };
    }
    if (this.role() === 'SCHOOL') {
      return { label: s.addActivity, path: '/schools/reports/new' };
    }
    if (this.role() === 'HOSPITAL') {
      return { label: s.manageAppointments, path: '/hospital/appointments' };
    }
    return { label: s.askAutiCare, path: '/ai' };
  });

  protected readonly accountName = computed(() => {
    const s = this.shellTexts();
    const parent = this.auth.parent();
    if (!parent) return s.autiCareUser;
    if (parent.role === 'ADMIN') return 'Admin Panel';
    return `${parent.firstName} ${parent.lastName}`.trim() || s.autiCareUser;
  });

  protected readonly roleLabel = computed(() => {
    const s = this.shellTexts();
    if (this.role() === 'ADMIN') return s.adminAccount;
    if (this.role() === 'SCHOOL') return s.schoolAccount;
    if (this.role() === 'HOSPITAL') return s.hospitalAccount;
    return s.parentAccount;
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

  protected logout(): void {
    this.closeProfileMenu();
    this.auth.logout().subscribe({ next: () => void this.router.navigateByUrl('/login') });
  }
}
