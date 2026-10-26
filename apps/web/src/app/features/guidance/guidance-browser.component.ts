import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type { GuidanceSearchResponse } from '@auticare/contracts';
import { I18nService } from '../../core/i18n/i18n.service';
import { GuidanceApi } from './data-access/guidance.api';

const COPY = {
  en: {
    title: 'Reviewed guidance',
    subtitle:
      'Practical suggestions taken from a small, reviewed set of autism resources. If nothing here answers your question, the app says so rather than making something up.',
    placeholder: 'bedtime, transitions, the market, a haircut…',
    search: 'Look it up',
    searching: 'Looking…',
    noResultsTitle: 'No reviewed source answers this',
    noResultsBody:
      'That is a real answer, not an error. It is better to say we do not know than to invent something. A clinician is the right person for this one.',
    emptyCorpusTitle: 'No sources added yet',
    emptyCorpusBody:
      'This installation has no reviewed guidance corpus yet, so nothing can be suggested. An administrator adds sources with the knowledge import command.',
    sources: 'Source',
    relevance: (score: number) => `relevance ${score}`,
    error: 'The guidance search failed.',
  },
  km: {
    title: 'ការណែនាំដែលបានពិនិត្យ',
    subtitle:
      'យោបល់ជាក់ស្តែង ដកស្រង់ចេញពីបណ្តុំធនធានអូទីសឹមដែលបានពិនិត្យហើយ។ ប្រសិនបើគ្មានអ្វីនៅទីនេះឆ្លើយសំណួររបស់អ្នកទេ កម្មវិធីនឹងប្រាប់ត្រង់ៗ ជាជាងប្រឌិតឡើង។',
    placeholder: 'ពេលគេង ការផ្លាស់ប្តូរ ផ្សារ កាត់សក់…',
    search: 'ស្វែងរក',
    searching: 'កំពុងស្វែងរក…',
    noResultsTitle: 'គ្មានប្រភពដែលបានពិនិត្យឆ្លើយសំណួរនេះទេ',
    noResultsBody:
      'នេះជាចម្លើយពិត មិនមែនកំហុសទេ។ វាល្អជាងក្នុងការនិយាយថាយើងមិនដឹង ជាជាងប្រឌិតអ្វីមួយឡើង។ គ្រូពេទ្យគឺជាអ្នកត្រឹមត្រូវសម្រាប់រឿងនេះ។',
    emptyCorpusTitle: 'មិនទាន់មានប្រភពបន្ថែមទេ',
    emptyCorpusBody:
      'ការដំឡើងនេះមិនទាន់មានបណ្តុំការណែនាំដែលបានពិនិត្យទេ ដូច្នេះមិនអាចណែនាំអ្វីបានឡើយ។ អ្នកគ្រប់គ្រងបន្ថែមប្រភពដោយពាក្យបញ្ជានាំចូល។',
    sources: 'ប្រភព',
    relevance: (score: number) => `ភាពពាក់ព័ន្ធ ${score}`,
    error: 'ការស្វែងរកការណែនាំបានបរាជ័យ។',
  },
};

/**
 * Browse reviewed guidance.
 *
 * The empty state is the point of this component. A search that finds nothing in
 * the corpus says so plainly, and points at a clinician — it does not fall back to
 * a general answer, because a plausible-sounding invention is exactly the failure
 * mode this feature exists to avoid.
 */
@Component({
  selector: 'ac-guidance-browser',
  standalone: true,
  template: `
    <details class="browser">
      <summary>
        <span class="summary-title">{{ copy().title }}</span>
        <span class="summary-sub">{{ copy().subtitle }}</span>
      </summary>

      <form class="search" (submit)="submit($event)">
        <label class="sr" for="guidance-query">{{ copy().title }}</label>
        <input
          id="guidance-query"
          type="search"
          maxlength="300"
          [placeholder]="copy().placeholder"
          [value]="query()"
          (input)="onInput($event)"
        />
        <button type="submit" class="primary" [disabled]="searching() || query().trim() === ''">
          {{ searching() ? copy().searching : copy().search }}
        </button>
      </form>

      @if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      }

      @if (result(); as data) {
        @if (data.corpusSize === 0) {
          <div class="empty">
            <p class="empty-title">{{ copy().emptyCorpusTitle }}</p>
            <p class="empty-body">{{ copy().emptyCorpusBody }}</p>
          </div>
        } @else if (data.passages.length === 0) {
          <div class="empty">
            <p class="empty-title">{{ copy().noResultsTitle }}</p>
            <p class="empty-body">{{ copy().noResultsBody }}</p>
          </div>
        } @else {
          <ul class="results">
            @for (passage of data.passages; track passage.sourceUrl + passage.heading) {
              <li class="result">
                <p class="result-title">
                  {{ passage.title }}
                  @if (passage.heading) {
                    <span class="result-heading">— {{ passage.heading }}</span>
                  }
                </p>
                <p class="result-excerpt">{{ passage.excerpt }}</p>
                <p class="result-source">
                  {{ copy().sources }}:
                  <a [href]="passage.sourceUrl" target="_blank" rel="noopener noreferrer">
                    {{ passage.publisher }}
                  </a>
                </p>
              </li>
            }
          </ul>
        }
      }
    </details>
  `,
  styles: [
    `
      :host {
        display: block;
        margin-top: 18px;
      }

      .browser {
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-lg);
        background: var(--ac-color-surface);
        padding: 16px 18px;
      }

      summary {
        cursor: pointer;
        display: flex;
        flex-direction: column;
        gap: 4px;
        list-style: none;
      }

      summary::-webkit-details-marker {
        display: none;
      }

      .summary-title {
        font-weight: 700;
        color: var(--ac-color-text-strong);
      }

      .summary-sub {
        font-size: var(--ac-type-meta);
        color: var(--ac-color-text-muted);
        line-height: 1.55;
        max-width: 70ch;
      }

      .search {
        display: flex;
        gap: 8px;
        margin-top: 14px;
      }

      input {
        flex: 1;
        font: inherit;
        padding: 10px 12px;
        border-radius: var(--ac-radius-sm);
        border: 1px solid var(--ac-color-border);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-strong);
      }

      input:focus-visible,
      button:focus-visible {
        outline: 3px solid var(--ac-color-focus);
        outline-offset: 2px;
      }

      .primary {
        font: inherit;
        font-weight: 700;
        font-size: var(--ac-type-meta);
        padding: 10px 18px;
        border-radius: var(--ac-radius-pill);
        border: 1px solid var(--ac-color-action-deep);
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        cursor: pointer;
        white-space: nowrap;
      }

      button:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }

      .results {
        list-style: none;
        margin: 14px 0 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .result {
        padding: 14px;
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-blue-surface-soft);
      }

      .result-title {
        margin: 0 0 6px;
        font-weight: 700;
        color: var(--ac-color-text-strong);
      }

      .result-heading {
        font-weight: 500;
        color: var(--ac-color-text-muted);
      }

      .result-excerpt {
        margin: 0;
        line-height: 1.6;
        font-size: var(--ac-type-body);
        color: var(--ac-color-text-strong);
      }

      .result-source {
        margin: 8px 0 0;
        font-size: var(--ac-type-meta);
        color: var(--ac-color-text-muted);
      }

      .result-source a {
        color: var(--ac-color-action);
        font-weight: 600;
      }

      .empty {
        margin-top: 14px;
        padding: 16px;
        border: 1px dashed var(--ac-color-border);
        border-radius: var(--ac-radius-md);
      }

      .empty-title {
        margin: 0 0 6px;
        font-weight: 700;
        color: var(--ac-color-text-strong);
      }

      .empty-body {
        margin: 0;
        color: var(--ac-color-text-muted);
        line-height: 1.6;
        font-size: var(--ac-type-meta);
      }

      .error {
        margin: 12px 0 0;
        color: var(--ac-color-alert-text);
        font-size: var(--ac-type-meta);
      }

      .sr {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
      }

      @media (max-width: 560px) {
        .search {
          flex-direction: column;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuidanceBrowserComponent {
  private readonly i18n = inject(I18nService);
  private readonly api = inject(GuidanceApi);

  protected readonly copy = computed(() => COPY[this.i18n.currentLang()]);
  protected readonly query = signal('');
  protected readonly result = signal<GuidanceSearchResponse | null>(null);
  protected readonly searching = signal(false);
  protected readonly error = signal<string | null>(null);

  protected onInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected submit(event?: Event): void {
    event?.preventDefault();
    const query = this.query().trim();
    if (!query || this.searching()) return;

    this.searching.set(true);
    this.error.set(null);

    this.api.search(query, this.i18n.currentLang()).subscribe({
      next: (result) => {
        this.result.set(result);
        this.searching.set(false);
      },
      error: () => {
        this.searching.set(false);
        this.error.set(this.copy().error);
      },
    });
  }
}
