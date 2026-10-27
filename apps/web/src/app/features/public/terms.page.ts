import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LegalSectionsComponent } from './legal/legal-sections.component';
import { TERMS_SECTIONS, TERMS_EFFECTIVE_DATE } from './legal/terms.content';

@Component({
  standalone: true,
  imports: [RouterLink, LegalSectionsComponent],
  template: `
    <div class="legal-page">
      <header class="legal-header">
        <a class="brand" routerLink="/" aria-label="AutiCare home">
          <img src="/images/auticare-logo.png" alt="" aria-hidden="true" width="36" height="36" />
          <span>AutiCare</span>
        </a>
        <nav class="legal-nav" aria-label="Legal navigation">
          <a routerLink="/privacy">Privacy Policy</a>
          <a routerLink="/terms" class="active" aria-current="page">Terms of Use</a>
          <a routerLink="/support">Help Center</a>
          <a routerLink="/crisis">Crisis Support</a>
        </nav>
      </header>

      <main class="legal-content" id="main">
        <div class="legal-layout">
          <!-- Sticky Table of Contents -->
          <aside class="toc-sidebar" aria-label="Table of contents">
            <div class="toc-sticky-card">
              <div class="toc-header">
                <svg
                  class="toc-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <line x1="4" y1="6" x2="20" y2="6"></line>
                  <line x1="4" y1="12" x2="20" y2="12"></line>
                  <line x1="4" y1="18" x2="14" y2="18"></line>
                </svg>
                <span>On this page</span>
              </div>

              <nav class="toc-list" aria-label="Section shortcuts">
                @for (item of toc; track item.id) {
                  <a [href]="'#' + item.id" class="toc-link">{{ item.label }}</a>
                }
              </nav>

              <div class="toc-footer-card">
                <div class="read-pill">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span>3 min read</span>
                </div>
                <p class="toc-help-note">
                  Questions regarding terms?
                  <a href="mailto:support@auticare.local">Contact our team</a>
                </p>
              </div>
            </div>
          </aside>

          <!-- Main Editorial Article -->
          <article class="prose">
            <header class="prose-header">
              <span class="meta-tag">Terms &amp; Conditions</span>
              <h1>Terms of Use</h1>
              <p class="effective-date">
                Effective date: {{ effectiveDate }} · Last updated {{ currentYear }}
              </p>
            </header>

            <p class="legal-intro">
              Welcome to AutiCare! By creating an account or using our platform, you agree to the
              following terms.
            </p>

            <ac-legal-sections [sections]="sections" />
            <p class="legal-tagline">
              AutiCare — Every Child Deserves Understanding, Support, and Opportunity.
            </p>
          </article>
        </div>
      </main>

      <footer class="legal-footer">
        <p>&copy; {{ currentYear }} AutiCare. All rights reserved.</p>
        <div class="footer-links">
          <a routerLink="/privacy">Privacy Policy</a>
          <a routerLink="/terms">Terms of Use</a>
          <a routerLink="/support">Help Center</a>
        </div>
      </footer>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100svh;
        background: var(--ac-color-tint-blue-faint);
        color: var(--ac-color-text-strong);
        scroll-behavior: smooth;
      }

      .legal-page {
        display: flex;
        flex-direction: column;
        min-height: 100svh;
      }

      .legal-header {
        max-width: 1140px;
        width: 100%;
        margin: 0 auto;
        padding: 28px 24px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        flex-wrap: wrap;
      }

      .brand {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        text-decoration: none;
        color: var(--ac-color-action-mid);
        font-size: 22px;
        font-weight: var(--ac-font-weight-bold);
      }

      .brand img {
        width: 36px;
        height: 36px;
        border-radius: 999px;
        object-fit: cover;
      }

      .legal-nav {
        display: flex;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
      }

      .legal-nav a {
        text-decoration: none;
        color: var(--ac-color-text-body);
        font-size: var(--ac-type-label);
        font-weight: var(--ac-font-weight-semibold);
        padding: 8px 14px;
        border-radius: 999px;
        transition: all 140ms ease;
      }

      .legal-nav a:hover {
        color: var(--ac-color-action-mid);
        background: var(--ac-color-surface);
      }

      .legal-nav a.active {
        color: var(--ac-color-action-mid);
        background: var(--ac-color-primary);
      }

      .legal-content {
        flex: 1;
        max-width: 1140px;
        width: 100%;
        margin: 0 auto;
        padding: 12px 24px 64px;
      }

      .legal-layout {
        display: grid;
        grid-template-columns: 260px 1fr;
        gap: 40px;
        align-items: start;
      }

      /* Sticky Table of Contents */
      .toc-sidebar {
        display: block;
      }

      .toc-sticky-card {
        position: sticky;
        top: 24px;
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
        border-radius: 16px;
        padding: 24px;
        box-shadow: 0 4px 16px color-mix(in srgb, var(--ac-brand-950) 4%, transparent);
      }

      .toc-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        font-weight: var(--ac-font-weight-bold);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--ac-color-text-muted);
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--ac-color-border);
      }

      .toc-icon {
        width: 16px;
        height: 16px;
        color: var(--ac-color-action);
      }

      .toc-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .toc-link {
        display: block;
        padding: 8px 12px;
        border-radius: 8px;
        text-decoration: none;
        color: var(--ac-color-text-body);
        font-size: 14px;
        line-height: 1.4;
        font-weight: var(--ac-font-weight-medium);
        transition: all 120ms ease;
      }

      .toc-link:hover {
        background: var(--ac-color-surface-info);
        color: var(--ac-color-action-deep);
        padding-left: 14px;
      }

      .toc-footer-card {
        margin-top: 24px;
        padding-top: 18px;
        border-top: 1px solid var(--ac-color-border);
      }

      .read-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        font-weight: var(--ac-font-weight-semibold);
        color: var(--ac-color-text-muted);
        background: var(--ac-color-tint-blue-soft);
        padding: 4px 10px;
        border-radius: 999px;
        margin-bottom: 12px;
      }

      .read-pill svg {
        width: 13px;
        height: 13px;
      }

      .toc-help-note {
        font-size: 13px;
        line-height: 1.5;
        color: var(--ac-color-text-muted);
        margin: 0;
      }

      .toc-help-note a {
        display: inline-block;
        color: var(--ac-color-action-deep);
        font-weight: var(--ac-font-weight-semibold);
        text-decoration: none;
      }

      .toc-help-note a:hover {
        text-decoration: underline;
      }

      /* Editorial Prose Area */
      .prose {
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
        border-radius: 20px;
        padding: 48px 56px;
        box-shadow: 0 4px 20px color-mix(in srgb, var(--ac-brand-950) 4%, transparent);
        max-width: 72ch;
      }

      .prose-header {
        margin-bottom: 36px;
        padding-bottom: 24px;
        border-bottom: 1px solid var(--ac-color-border);
      }

      .meta-tag {
        display: inline-block;
        font-size: 12px;
        font-weight: var(--ac-font-weight-bold);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--ac-color-action);
        background: var(--ac-color-surface-info);
        padding: 4px 12px;
        border-radius: 999px;
        margin-bottom: 12px;
      }

      h1 {
        font-size: 36px;
        line-height: 1.25;
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text-strong);
        margin: 0 0 10px;
      }

      .effective-date {
        color: var(--ac-color-text-muted);
        font-size: 14px;
        margin: 0;
      }

      .legal-section {
        margin-bottom: 40px;
        scroll-margin-top: 36px;
      }

      h2 {
        font-size: 22px;
        font-weight: var(--ac-font-weight-bold);
        line-height: 1.35;
        margin: 0 0 16px;
        color: var(--ac-color-ink-b);
      }

      p {
        font-size: 16px;
        line-height: 1.7;
        color: var(--ac-color-text-body);
        margin: 0 0 16px;
      }

      a {
        color: var(--ac-color-action-deep);
        text-decoration: underline;
        text-underline-offset: 2px;
      }

      a:hover {
        color: var(--ac-color-action-mid);
      }

      /* Callout Card */
      .notice-callout {
        display: flex;
        align-items: flex-start;
        gap: 16px;
        border-radius: 12px;
        padding: 20px 22px;
        margin: 20px 0;
      }

      .notice-callout.warning {
        background: var(--ac-color-amber-tint-50);
        border: 1px solid var(--ac-color-amber-tint-sand);
        border-left: 4px solid var(--ac-color-warning);
      }

      .callout-indicator {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: var(--ac-color-amber-tint-cream);
        color: var(--ac-color-amber-800);
      }

      .callout-indicator svg {
        width: 18px;
        height: 18px;
      }

      .callout-body {
        font-size: 15px;
        line-height: 1.65;
        color: var(--ac-color-text-strong);
      }

      .callout-body p {
        margin: 0;
        font-size: 15px;
        line-height: 1.65;
      }

      .callout-body strong {
        color: var(--ac-color-amber-800);
      }

      /* Footer */
      .legal-footer {
        max-width: 1140px;
        width: 100%;
        margin: auto auto 0;
        padding: 32px 24px;
        border-top: 1px solid var(--ac-color-border);
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 20px;
        flex-wrap: wrap;
        font-size: 14px;
        color: var(--ac-color-text-muted);
      }

      .footer-links {
        display: flex;
        gap: 20px;
      }

      .footer-links a {
        color: inherit;
        text-decoration: none;
      }

      .footer-links a:hover {
        color: var(--ac-color-action-mid);
        text-decoration: underline;
      }

      .legal-intro {
        font-size: 17px;
        line-height: 1.7;
        color: var(--ac-color-text-body);
        margin: 0 0 32px;
      }

      .legal-tagline {
        margin: 40px 0 0;
        padding-top: 24px;
        border-top: 1px solid var(--ac-color-border);
        font-weight: var(--ac-font-weight-semibold);
        color: var(--ac-color-action-deep);
        text-align: center;
      }
      @media (max-width: 860px) {
        .legal-layout {
          grid-template-columns: 1fr;
          gap: 24px;
        }

        .toc-sidebar {
          order: -1;
        }

        .toc-sticky-card {
          position: static;
        }

        .prose {
          padding: 32px 24px;
          max-width: 100%;
        }

        h1 {
          font-size: 28px;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TermsPage {
  readonly currentYear = new Date().getFullYear();
  readonly effectiveDate = TERMS_EFFECTIVE_DATE;
  readonly sections = TERMS_SECTIONS;
  readonly toc = TERMS_SECTIONS.map((section) => ({
    id: section.id,
    label: section.title.replace(/^Article /, ''),
  }));
}
