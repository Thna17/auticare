import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { helpCenterCategories } from './help-center.data';

type FaqItem = {
  readonly categoryId: string;
  readonly categoryLabel: string;
  readonly question: string;
  readonly answer: string;
};

const allItems: readonly FaqItem[] = helpCenterCategories.flatMap((category) =>
  category.entries.map((entry) => ({
    categoryId: category.id,
    categoryLabel: category.label,
    question: entry.question,
    answer: entry.answer,
  })),
);

@Component({
  standalone: true,
  template: `
    <section class="help">
      <header class="head">
        <h1>Help Center</h1>
        <p class="subtitle">
          Find answers about screening, schools, appointments, and your account.
        </p>
      </header>

      <div class="search">
        <svg class="search-icon" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="2" />
          <line
            x1="16"
            y1="16"
            x2="21"
            y2="21"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
        <input
          type="search"
          class="search-input"
          placeholder="Search help articles…"
          aria-label="Search help articles"
          [value]="query()"
          (input)="onSearch($event)"
        />
      </div>

      <div class="pills" role="tablist" aria-label="Help categories">
        @for (category of categories; track category.id) {
          <button
            type="button"
            class="pill"
            role="tab"
            [class.active]="!searching() && category.id === selectedCategoryId()"
            [attr.aria-selected]="!searching() && category.id === selectedCategoryId()"
            (click)="selectCategory(category.id)"
          >
            {{ category.label }}
          </button>
        }
      </div>

      @if (!filteredItems().length) {
        <p class="empty" role="status">No help articles match “{{ query() }}”.</p>
      } @else {
        <ul class="faq-list">
          @for (item of filteredItems(); track item.question) {
            <li class="faq-item">
              <button
                type="button"
                class="faq-q"
                [attr.aria-expanded]="isOpen(item.question)"
                (click)="toggle(item.question)"
              >
                <span class="faq-q-text">
                  {{ item.question }}
                  @if (searching()) {
                    <span class="faq-tag">{{ item.categoryLabel }}</span>
                  }
                </span>
                <svg
                  class="chevron"
                  [class.open]="isOpen(item.question)"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    d="M6 9l6 6 6-6"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>
              @if (isOpen(item.question)) {
                <p class="faq-a">{{ item.answer }}</p>
              }
            </li>
          }
        </ul>
      }

      <!-- Contact card: soft teal, matching the Screening disclaimer banner style. -->
      <aside class="contact-card">
        <div class="contact-copy">
          <h2>Still need help?</h2>
          <p>Can't find what you're looking for? Our support team is happy to help.</p>
        </div>
        <a class="contact-btn" href="mailto:support&#64;auticare.local">Contact support</a>
      </aside>
    </section>
  `,
  styles: [
    `
      /* Local constants mirroring the app shell's hardcoded hex/px (no new tokens). */
      :host {
        --hc-teal: #3d6375;
        --hc-text: #263238;
        --hc-text-muted: #66747a;
        --hc-surface: #ffffff;
        --hc-banner-bg: #e8f6ff;
        --hc-banner-border: #d4e6ef;
        --hc-avatar-bg: #8db4c8;
        --hc-radius: 12px;
        --hc-shadow-card: 0 12px 30px rgb(41 74 90 / 0.08);
        display: block;
      }

      .help {
        max-width: 760px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      .head h1 {
        margin: 0 0 8px;
        color: var(--hc-teal);
        font-size: 34px;
        font-weight: 800;
      }
      .subtitle {
        margin: 0;
        color: var(--hc-text-muted);
        font-size: 16px;
      }

      /* Search input */
      .search {
        position: relative;
        display: flex;
        align-items: center;
      }
      .search-icon {
        position: absolute;
        left: 16px;
        width: 20px;
        height: 20px;
        color: var(--hc-text-muted);
        pointer-events: none;
      }
      .search-input {
        width: 100%;
        min-height: 50px;
        border: 1px solid var(--hc-banner-border);
        border-radius: var(--hc-radius);
        background: var(--hc-surface);
        padding: 0 18px 0 46px;
        font-size: 16px;
        color: var(--hc-text);
      }
      .search-input:focus-visible {
        outline: 3px solid var(--hc-teal);
        outline-offset: 1px;
        border-color: var(--hc-teal);
      }

      /* Category pills */
      .pills {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .pill {
        min-height: 38px;
        padding: 0 16px;
        border-radius: 999px;
        border: 2px solid var(--hc-banner-border);
        background: var(--hc-surface);
        color: var(--hc-text);
        font-weight: 700;
        font-size: 14px;
        cursor: pointer;
      }
      .pill:hover:not(.active) {
        border-color: var(--hc-avatar-bg);
      }
      .pill.active {
        border-color: var(--hc-teal);
        background: var(--hc-teal);
        color: #ffffff;
      }
      .pill:focus-visible {
        outline: 3px solid var(--hc-teal);
        outline-offset: 2px;
      }

      .empty {
        color: var(--hc-text-muted);
        font-weight: 600;
        text-align: center;
        padding: 12px 0;
      }

      /* FAQ accordion */
      .faq-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .faq-item {
        background: var(--hc-surface);
        border: 1px solid var(--hc-banner-border);
        border-radius: var(--hc-radius);
        box-shadow: var(--hc-shadow-card);
        overflow: hidden;
      }
      .faq-q {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 18px 20px;
        border: 0;
        background: none;
        cursor: pointer;
        text-align: left;
        color: var(--hc-text);
        font-size: 16px;
        font-weight: 700;
      }
      .faq-q-text {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }
      .faq-tag {
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: var(--hc-teal);
        background: var(--hc-banner-bg);
        border-radius: 999px;
        padding: 3px 10px;
      }
      .chevron {
        width: 22px;
        height: 22px;
        flex: 0 0 auto;
        color: var(--hc-text-muted);
        transition: transform 180ms ease;
      }
      .chevron.open {
        transform: rotate(180deg);
      }
      .faq-a {
        margin: 0;
        padding: 0 20px 20px;
        color: var(--hc-text);
        font-size: 15px;
        line-height: 1.6;
      }

      /* Contact card */
      .contact-card {
        margin-top: 8px;
        background: var(--hc-banner-bg);
        border: 1px solid var(--hc-banner-border);
        border-radius: var(--hc-radius);
        padding: 24px 26px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        flex-wrap: wrap;
      }
      .contact-copy h2 {
        margin: 0 0 6px;
        color: var(--hc-teal);
        font-size: 20px;
        font-weight: 800;
      }
      .contact-copy p {
        margin: 0;
        color: var(--hc-text);
        font-size: 15px;
      }
      .contact-btn {
        flex: 0 0 auto;
        min-height: 48px;
        display: inline-flex;
        align-items: center;
        padding: 0 24px;
        border-radius: var(--hc-radius);
        background: var(--hc-teal);
        color: #ffffff;
        font-weight: 700;
        font-size: 15px;
        text-decoration: none;
        box-shadow: 0 10px 26px rgb(61 99 117 / 0.18);
      }
      .contact-btn:focus-visible {
        outline: 3px solid var(--hc-teal);
        outline-offset: 2px;
      }

      @media (max-width: 560px) {
        .contact-card {
          flex-direction: column;
          align-items: flex-start;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpCenterPage {
  readonly categories = helpCenterCategories;

  readonly query = signal('');
  readonly selectedCategoryId = signal(helpCenterCategories[0]?.id ?? '');
  // First question of the default category is expanded on load.
  readonly openQuestion = signal<string | null>(
    helpCenterCategories[0]?.entries[0]?.question ?? null,
  );

  readonly searching = computed(() => this.query().trim().length > 0);

  readonly filteredItems = computed<readonly FaqItem[]>(() => {
    const term = this.query().trim().toLowerCase();
    if (term) {
      // Search matches question or answer text, across all categories.
      return allItems.filter(
        (item) =>
          item.question.toLowerCase().includes(term) || item.answer.toLowerCase().includes(term),
      );
    }
    return allItems.filter((item) => item.categoryId === this.selectedCategoryId());
  });

  onSearch(event: Event) {
    this.query.set((event.target as HTMLInputElement).value);
  }

  selectCategory(categoryId: string) {
    // Selecting a category clears the search so its list is shown.
    this.query.set('');
    this.selectedCategoryId.set(categoryId);
  }

  toggle(question: string) {
    this.openQuestion.update((current) => (current === question ? null : question));
  }

  isOpen(question: string): boolean {
    return this.openQuestion() === question;
  }
}
