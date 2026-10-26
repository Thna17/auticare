import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import type { UserRole } from '@auticare/contracts';
import { AuthService } from '../auth/auth.service';
import { NotificationsStateService } from '../notifications/notifications-state.service';
import { PreferencesService } from '../preferences/preferences.service';
import { I18nService } from '../i18n/i18n.service';
import { DICTIONARY } from '../i18n/i18n.dictionary';

export type NavItem = {
  readonly label: string;
  readonly path: string;
  readonly icon: string;
  readonly badge?: string;
};

export type NavSection = {
  readonly title: string;
  readonly items: readonly NavItem[];
};

@Component({
  selector: 'ac-app-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
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
            src="/images/auticare-logo.jpg"
            alt=""
            aria-hidden="true"
            width="32"
            height="32"
          />
          <span class="brand-text">AutiCare</span>
        </a>
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
            <span class="nav-section-title" aria-hidden="true">{{ section.title }}</span>
            <div class="nav-section-items">
              @for (item of section.items; track item.path) {
                <a
                  class="nav-link"
                  [routerLink]="item.path"
                  routerLinkActive="active"
                  [routerLinkActiveOptions]="{
                    exact: item.path === '/dashboard' || item.path === '/hospital/dashboard',
                  }"
                  [attr.title]="sidebarCollapsed() ? item.label : null"
                >
                  <span class="nav-icon" [class]="item.icon" aria-hidden="true"></span>
                  <span class="nav-label">{{ item.label }}</span>
                  @if (item.badge) {
                    <span class="badge" aria-label="Unread count">{{ item.badge }}</span>
                  }
                </a>
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
        <span class="plus-icon" aria-hidden="true"></span>
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
              src="/images/auticare-logo.jpg"
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
          <span class="nav-icon" [class]="item.icon" aria-hidden="true"></span>
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
        <span class="plus-icon" aria-hidden="true"></span>
      </a>

      @for (item of mobileNav().slice(2); track item.path) {
        <a
          [routerLink]="item.path"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{
            exact: item.path === '/dashboard' || item.path === '/hospital/dashboard',
          }"
        >
          <span class="nav-icon" [class]="item.icon" aria-hidden="true"></span>
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
            <img src="/images/auticare-logo.jpg" alt="" width="32" height="32" class="brand-mark" />
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
              <span class="nav-section-title">{{ section.title }}</span>
              <div class="nav-section-items">
                @for (item of section.items; track item.path) {
                  <a
                    class="nav-link"
                    [routerLink]="item.path"
                    routerLinkActive="active"
                    (click)="closeMobileDrawer()"
                  >
                    <span class="nav-icon" [class]="item.icon" aria-hidden="true"></span>
                    <span class="nav-label">{{ item.label }}</span>
                    @if (item.badge) {
                      <span class="badge">{{ item.badge }}</span>
                    }
                  </a>
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
        width: 284px;
        background: var(--ac-color-blue-tint-ice);
        border-right: 1px solid var(--ac-color-ice-blue-pale);
        display: flex;
        flex-direction: column;
        padding: 24px 16px 20px;
        overflow-y: auto;
        transition:
          width var(--ac-motion-normal),
          padding var(--ac-motion-normal);
      }

      .sidebar-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 24px;
        padding: 0 4px;
      }

      .brand {
        color: var(--ac-color-action-mid);
        text-decoration: none;
        font-size: 22px;
        line-height: 1.1;
        font-weight: var(--ac-font-weight-semibold);
        display: inline-flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
      }

      .brand-mark {
        width: 32px;
        height: 32px;
        border-radius: var(--ac-radius-pill);
        flex: 0 0 auto;
        object-fit: cover;
        box-shadow: 0 0 0 1px var(--ac-color-sky-light);
      }

      .collapse-btn {
        width: 36px;
        height: 36px;
        min-width: 36px;
        min-height: 36px;
        border: 1px solid var(--ac-color-ice-blue-frost);
        border-radius: var(--ac-radius-sm);
        background: rgb(255 255 255 / 0.7);
        color: var(--ac-color-slate-icon);
        display: grid;
        place-items: center;
        cursor: pointer;
        padding: 0;
        transition:
          background var(--ac-motion-fast),
          color var(--ac-motion-fast),
          border-color var(--ac-motion-fast);
      }

      .collapse-btn:hover {
        background: rgb(255 255 255 / 0.95);
        color: var(--ac-color-action-mid);
        border-color: var(--ac-color-border-info);
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
        padding: 24px 10px 20px;
      }

      .sidebar.collapsed .brand-text,
      .sidebar.collapsed .nav-section-title,
      .sidebar.collapsed .nav-label,
      .sidebar.collapsed .badge,
      .sidebar.collapsed .action-label,
      .sidebar.collapsed .logout-label {
        display: none;
      }

      .sidebar.collapsed .role-action,
      .sidebar.collapsed .logout-button {
        justify-content: center;
        padding: 0;
      }

      .sidebar.collapsed .nav-link {
        justify-content: center;
        padding: 0;
        width: 48px;
        height: 48px;
        margin: 0 auto;
      }

      .sidebar-nav {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .nav-section {
        display: flex;
        flex-direction: column;
        gap: 3px;
      }

      .nav-section-title {
        padding: 6px 12px 2px;
        font-size: 11px;
        font-weight: var(--ac-font-weight-bold);
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--ac-color-text-slate);
        user-select: none;
        transition: opacity var(--ac-motion-fast);
      }

      .nav-section-items {
        display: flex;
        flex-direction: column;
        gap: 3px;
      }

      .nav-link {
        position: relative;
        min-height: 44px;
        border-radius: var(--ac-radius-md);
        background: transparent;
        color: var(--ac-color-ink-dark-slate);
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 0 12px;
        text-decoration: none;
        font-size: var(--ac-type-label);
        font-weight: var(--ac-font-weight-medium);
        line-height: 1.2;
        transition:
          background var(--ac-motion-fast),
          color var(--ac-motion-fast),
          transform var(--ac-motion-fast);
      }

      .nav-link:hover {
        background: rgb(255 255 255 / 0.65);
        color: var(--ac-color-action-mid);
        transform: translateX(2px);
      }

      .nav-link.active {
        background: var(--ac-color-primary);
        color: var(--ac-color-ink-f);
        font-weight: var(--ac-font-weight-semibold);
        box-shadow: var(--ac-shadow-xs);
      }

      .nav-link.active::before {
        content: '';
        position: absolute;
        left: 0;
        top: 8px;
        bottom: 8px;
        width: 4px;
        border-radius: 0 var(--ac-radius-xs) var(--ac-radius-xs) 0;
        background: var(--ac-color-action-mid);
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
        min-height: 48px;
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        margin: 18px 4px 12px;
        text-decoration: none;
        font-size: var(--ac-type-label);
        font-weight: var(--ac-font-weight-semibold);
        box-shadow: var(--ac-shadow-sm);
        transition:
          transform var(--ac-motion-fast),
          box-shadow var(--ac-motion-fast);
      }

      .role-action:hover {
        transform: translateY(-1px);
        box-shadow: var(--ac-shadow-hover);
      }

      .role-action:active {
        transform: scale(0.99);
      }

      .sidebar-footer {
        margin-top: auto;
        padding-top: 14px;
        border-top: 1px solid var(--ac-color-ice-blue-frost);
      }

      .crisis-shortcut {
        width: 100%;
        min-height: 44px;
        border: 1px solid var(--ac-color-red-border);
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-red-tint-blush);
        color: var(--ac-color-alert-text);
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 0 12px;
        margin-bottom: 8px;
        text-decoration: none;
        font-size: var(--ac-type-label);
        font-weight: var(--ac-font-weight-semibold);
        transition:
          background var(--ac-motion-fast),
          transform var(--ac-motion-fast);
      }

      .crisis-shortcut:hover {
        background: var(--ac-color-red-tint-muted);
        transform: translateY(-1px);
      }

      .crisis-icon {
        display: grid;
        place-items: center;
        color: currentColor;
      }

      .sidebar.collapsed .crisis-shortcut {
        justify-content: center;
        padding: 0;
        width: 48px;
        height: 48px;
        margin: 0 auto 8px;
      }

      .sidebar.collapsed .crisis-label {
        display: none;
      }

      .logout-button {
        width: 100%;
        min-height: 44px;
        border: 0;
        border-radius: var(--ac-radius-md);
        background: transparent;
        color: var(--ac-color-red-600);
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 0 12px;
        font: inherit;
        font-size: var(--ac-type-label);
        font-weight: var(--ac-font-weight-medium);
        cursor: pointer;
        transition: background var(--ac-motion-fast);
      }

      .logout-button:hover {
        background: var(--ac-color-red-50);
      }

      .logout-icon {
        display: grid;
        place-items: center;
        color: currentColor;
      }

      /* ─── MAIN SHELL & TOPBAR ─── */
      .shell {
        min-height: 100svh;
        margin-left: 284px;
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
        background: rgb(255 255 255 / 0.85);
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
        background: rgb(255 255 255 / 0.9);
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
        background: rgb(255 255 255 / 0.9);
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
        max-width: 1440px;
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
          background: rgb(255 255 255 / 0.95);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          display: grid;
          grid-template-columns: 1fr 1fr 64px 1fr 1fr;
          align-items: center;
          box-shadow: 0 -4px 20px rgb(15 23 42 / 0.08);
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
          box-shadow: 0 6px 18px rgb(61 99 117 / 0.35);
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

      /* ─── NAV ICONS (PURE CSS TOKENS) ─── */
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

      /* Assistant: a speech bubble with three dots. */
      .ai::before {
        inset: 3px 2px 5px;
        border: 2px solid currentColor;
        border-radius: 50% 50% 50% 6px;
      }

      .ai::after {
        left: 10px;
        top: 9px;
        width: 3px;
        height: 3px;
        border-radius: var(--ac-radius-pill);
        background: currentColor;
        box-shadow:
          -5px 0 0 0 currentColor,
          5px 0 0 0 currentColor;
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
        border-radius: var(--ac-radius-pill);
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
        border-radius: var(--ac-radius-pill);
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
        border-radius: var(--ac-radius-xs);
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

      .activity::before {
        left: 9px;
        top: 2px;
        width: 6px;
        height: 18px;
        background: currentColor;
        border-radius: var(--ac-radius-xs);
      }

      .activity::after {
        left: 2px;
        top: 8px;
        width: 18px;
        height: 6px;
        background: currentColor;
        border-radius: var(--ac-radius-xs);
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
        border-radius: var(--ac-radius-xs);
      }

      .calendar::after {
        left: 6px;
        right: 6px;
        top: 9px;
        height: 2px;
        background: currentColor;
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
        border-radius: var(--ac-radius-xs);
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
        border-radius: var(--ac-radius-pill);
        background: currentColor;
      }

      .report::before {
        left: 3px;
        bottom: 3px;
        width: 18px;
        height: 18px;
        border-radius: var(--ac-radius-pill);
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

      .person::before {
        left: 8px;
        top: 4px;
        width: 8px;
        height: 8px;
        border: 2px solid currentColor;
        border-radius: var(--ac-radius-pill);
      }

      .person::after {
        left: 4px;
        bottom: 3px;
        width: 16px;
        height: 9px;
        border: 2px solid currentColor;
        border-radius: 12px 12px 4px 4px;
      }

      .settings::before {
        inset: 5px;
        border: 2px solid currentColor;
        border-radius: var(--ac-radius-pill);
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
        border-radius: var(--ac-radius-pill);
      }

      .help::before {
        inset: 3px;
        border-radius: var(--ac-radius-pill);
        background: currentColor;
      }

      .help::after {
        content: '?';
        inset: 0;
        color: var(--ac-color-blue-tint-ice);
        display: grid;
        place-items: center;
        font-size: var(--ac-type-label);
        font-weight: var(--ac-font-weight-bold);
      }

      .plus-icon::before {
        left: 10px;
        top: 4px;
        width: 2px;
        height: 14px;
        background: currentColor;
      }

      .plus-icon::after {
        left: 4px;
        top: 10px;
        width: 14px;
        height: 2px;
        background: currentColor;
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

  private readonly role = computed<UserRole | undefined>(() => this.auth.parent()?.role);

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

  protected readonly navSections = computed<readonly NavSection[]>(() => {
    const s = this.shellTexts();
    const role = this.role();
    const unread = this.unreadCount();
    const badge = unread > 0 ? String(unread) : undefined;

    if (role === 'ADMIN') {
      return [
        {
          title: s.careAndDevelopment,
          items: [
            { label: s.overview, path: '/dashboard', icon: 'grid' },
            { label: s.familyRecords, path: '/children', icon: 'children' },
          ],
        },
        {
          title: s.directoryAndVisits,
          items: [
            { label: s.schools, path: '/schools/admin', icon: 'school' },
            { label: s.hospitals, path: '/hospitals/admin', icon: 'hospital' },
            { label: s.schoolReports, path: '/schools/reports', icon: 'checklist' },
          ],
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

    if (role === 'SCHOOL') {
      return [
        {
          title: s.careAndDevelopment,
          items: [
            { label: s.overview, path: '/dashboard', icon: 'grid' },
            { label: s.students, path: '/schools/enrollments', icon: 'children' },
            { label: s.reports, path: '/schools/reports', icon: 'report' },
          ],
        },
        {
          title: s.directoryAndVisits,
          items: [{ label: s.schoolProfile, path: '/schools/profile', icon: 'school' }],
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

    if (role === 'HOSPITAL') {
      return [
        {
          title: s.careAndDevelopment,
          items: [
            { label: s.overview, path: '/hospital/dashboard', icon: 'grid' },
            { label: s.appointments, path: '/hospital/appointments', icon: 'calendar' },
            { label: s.doctors, path: '/hospital/doctors', icon: 'hospital' },
          ],
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

    // Default: PARENT
    //
    // Five areas organised by what the parent is trying to do, not by which
    // feature implements it: look at how things are (Dashboard), ask something
    // (AI), find what we have (Documents), who we are (Profile), and settings.
    // The existing screens all keep their routes; they are regrouped, not rebuilt.
    return [
      {
        title: s.dashboard,
        items: [
          { label: s.overview, path: '/dashboard', icon: 'grid' },
          { label: s.observations, path: '/observations', icon: 'report' },
          { label: s.screening, path: '/screening', icon: 'checklist' },
          { label: s.progress, path: '/progress', icon: 'trend' },
        ],
      },
      {
        title: s.aiAssistant,
        items: [{ label: s.aiAssistant, path: '/ai', icon: 'ai' }],
      },
      {
        title: s.documents,
        items: [
          { label: s.schools, path: '/schools', icon: 'school' },
          { label: s.hospitals, path: '/hospitals', icon: 'hospital' },
          { label: s.activities, path: '/activities', icon: 'activity' },
          { label: s.appointments, path: '/appointments', icon: 'calendar' },
        ],
      },
      {
        title: s.profile,
        items: [
          { label: s.myChildren, path: '/children', icon: 'family' },
          { label: s.notifications, path: '/notifications', icon: 'bell', badge },
        ],
      },
      {
        title: s.settings,
        items: [
          { label: s.accountSettings, path: '/settings', icon: 'settings' },
          { label: s.helpCenter, path: '/support', icon: 'help' },
          { label: s.crisisSupport, path: '/crisis', icon: 'help' },
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
