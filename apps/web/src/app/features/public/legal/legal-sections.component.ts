import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** A list entry; `lead` is shown in bold before the text ("Parents: …"). */
export type LegalItem = { lead?: string; text: string };

export type LegalBlock =
  | { kind: 'p'; text: string; n?: string; lead?: string }
  | { kind: 'list'; items: readonly LegalItem[] }
  | { kind: 'table'; head?: readonly string[]; rows: readonly (readonly string[])[] }
  | { kind: 'callout'; title: string; text: string };

export type LegalSection = { id: string; title: string; blocks: readonly LegalBlock[] };

/** Renders the numbered sections of a legal document (terms, privacy policy). */
@Component({
  selector: 'ac-legal-sections',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (section of sections(); track section.id) {
      <section [id]="section.id" class="legal-section">
        <h2>{{ section.title }}</h2>
        @for (block of section.blocks; track $index) {
          @if (block.kind === 'p') {
            <p>
              @if (block.n) {
                <span class="clause-no">{{ block.n }}</span>
              }
              @if (block.lead) {
                <strong>{{ block.lead }}</strong>
              }
              {{ block.text }}
            </p>
          } @else if (block.kind === 'list') {
            <ul class="styled-list">
              @for (item of block.items; track $index) {
                <li>
                  @if (item.lead) {
                    <strong>{{ item.lead }}:</strong>
                  }
                  {{ item.text }}
                </li>
              }
            </ul>
          } @else if (block.kind === 'table') {
            <div class="table-wrap">
              <table class="legal-table">
                @if (block.head) {
                  <thead>
                    <tr>
                      @for (heading of block.head; track $index) {
                        <th scope="col">{{ heading }}</th>
                      }
                    </tr>
                  </thead>
                }
                <tbody>
                  @for (row of block.rows; track $index) {
                    <tr>
                      @for (cell of row; track $index) {
                        <td>{{ cell }}</td>
                      }
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <div class="notice-callout" role="note">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <path
                  d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                ></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              <p>
                <strong>{{ block.title }}</strong> {{ block.text }}
              </p>
            </div>
          }
        }
      </section>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .legal-section {
        margin-bottom: 40px;
        scroll-margin-top: 36px;
      }

      .legal-section:last-child {
        margin-bottom: 0;
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

      p strong,
      li strong {
        color: var(--ac-color-text-strong);
      }

      .clause-no {
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-action);
        margin-right: 6px;
        font-variant-numeric: tabular-nums;
      }

      .styled-list {
        margin: 8px 0 20px;
        padding-left: 20px;
      }

      .styled-list li {
        font-size: 16px;
        line-height: 1.7;
        color: var(--ac-color-text-body);
        margin-bottom: 8px;
      }

      .styled-list li::marker {
        color: var(--ac-color-action);
      }

      .table-wrap {
        overflow-x: auto;
        margin: 8px 0 24px;
        border: 1px solid var(--ac-color-border);
        border-radius: 12px;
      }

      .legal-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 14px;
        line-height: 1.55;
      }

      .legal-table th {
        text-align: left;
        font-weight: var(--ac-font-weight-semibold);
        color: var(--ac-color-text-strong);
        background: var(--ac-color-surface-info);
        padding: 10px 14px;
        white-space: nowrap;
      }

      .legal-table td {
        padding: 10px 14px;
        color: var(--ac-color-text-body);
        border-top: 1px solid var(--ac-color-border);
        vertical-align: top;
      }

      .legal-table tbody tr:first-child td {
        border-top: 0;
      }

      .legal-table thead + tbody tr:first-child td {
        border-top: 1px solid var(--ac-color-border);
      }

      .legal-table td:first-child {
        font-weight: var(--ac-font-weight-semibold);
        color: var(--ac-color-text-strong);
      }

      .notice-callout {
        display: flex;
        align-items: flex-start;
        gap: 14px;
        border-radius: 12px;
        padding: 18px 20px;
        margin: 8px 0 20px;
        background: var(--ac-color-amber-tint-50);
        border: 1px solid var(--ac-color-amber-tint-sand);
        border-left: 4px solid var(--ac-color-warning);
      }

      .notice-callout svg {
        flex-shrink: 0;
        width: 20px;
        height: 20px;
        margin-top: 3px;
        color: var(--ac-color-amber-800);
      }

      .notice-callout p {
        margin: 0;
        font-size: 15px;
        color: var(--ac-color-text-strong);
      }

      .notice-callout strong {
        color: var(--ac-color-amber-800);
      }
    `,
  ],
})
export class LegalSectionsComponent {
  readonly sections = input.required<readonly LegalSection[]>();
}
