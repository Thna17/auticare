import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import type { AdminAiMonitoring } from '@auticare/contracts';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';
import { PORTAL_PAGE_STYLES } from '../../design-system/styles/portal-page.styles';
import { errorMessage } from './admin-format';
import { AdminPortalApi } from './data-access/admin-portal.api';

/**
 * How the AI Parent Assistant is being used, and the safety rules it answers
 * under. Counts and timings only: the admin never sees what families asked.
 * The provider is configured on the server (AI_BASE_URL, AI_MODEL, AI_API_KEY).
 */
@Component({
  standalone: true,
  imports: [UiMessageComponent, UiSpinnerComponent],
  selector: 'ac-admin-ai-page',
  template: `
    <header class="page-head">
      <div>
        <h1>AI Configuration &amp; Monitoring</h1>
        <p class="subtitle">
          Usage of the AI Parent Assistant. You see numbers only — never what a family asked or
          their child's details.
        </p>
      </div>
      <select aria-label="Period" (change)="setDays(+$any($event.target).value)">
        @for (option of periods; track option) {
          <option [value]="option" [selected]="option === days()">Last {{ option }} days</option>
        }
      </select>
    </header>

    @if (loading()) {
      <ac-ui-spinner label="Loading AI usage…" />
    } @else if (error(); as message) {
      <ac-ui-message tone="error">{{ message }}</ac-ui-message>
    } @else if (data(); as d) {
      @if (!d.configured) {
        <ac-ui-message tone="info">
          The assistant is switched off: no AI provider is configured on the server. Families see a
          message that it is unavailable; the rest of AutiCare works normally.
        </ac-ui-message>
      }

      <section class="stats" aria-label="Usage">
        <div class="stat">
          <strong>{{ d.configured ? 'Connected' : 'Off' }}</strong>
          <span>{{ d.model ?? 'No model set' }}</span>
        </div>
        <div class="stat">
          <strong>{{ d.totals.questions }}</strong
          ><span>Questions asked</span>
        </div>
        <div class="stat">
          <strong>{{ d.totals.conversations }}</strong
          ><span>New conversations</span>
        </div>
        <div class="stat">
          <strong>{{ seconds(d.totals.avgLatencyMs) }}</strong
          ><span>Average answer time</span>
        </div>
        <div class="stat">
          <strong>{{ d.totals.crisisReplies }}</strong>
          <span>Crisis safety replies (pointed to emergency help)</span>
        </div>
        <div class="stat">
          <strong>{{ d.totals.medicationReplies }}</strong>
          <span>Medication questions sent to a professional</span>
        </div>
        <div class="stat">
          <strong>{{ (d.totals.tokensIn + d.totals.tokensOut).toLocaleString('en-US') }}</strong>
          <span
            >Tokens used (in {{ d.totals.tokensIn.toLocaleString('en-US') }} / out
            {{ d.totals.tokensOut.toLocaleString('en-US') }})</span
          >
        </div>
        <div class="stat">
          <strong>{{ d.totals.reviewedSources }}</strong
          ><span>Reviewed source documents</span>
        </div>
      </section>

      <section class="card" aria-labelledby="daily-title">
        <h2 id="daily-title">Questions per day</h2>
        <ol class="bars">
          @for (day of d.daily; track day.date) {
            <li [attr.aria-label]="day.date + ': ' + day.questions + ' questions'">
              <span class="bar-wrap" aria-hidden="true">
                <span class="bar" [style.height.%]="height(day.questions)"></span>
              </span>
              <span class="label">{{ day.date.slice(8, 10) }}</span>
            </li>
          }
        </ol>
      </section>

      <section class="card" aria-labelledby="rules-title">
        <h2 id="rules-title">Safety rules every answer follows</h2>
        <p class="note">
          These are part of the server code, so a change goes through code review rather than an
          edit here. They keep the assistant educational: it never diagnoses, prescribes or replaces
          a professional.
        </p>
        <pre class="rules">{{ d.rules }}</pre>
      </section>
    }
  `,
  styles: [
    PORTAL_PAGE_STYLES,
    `
      .bars {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        grid-auto-flow: column;
        grid-auto-columns: minmax(14px, 1fr);
        gap: 4px;
        overflow-x: auto;
      }

      .bars li {
        display: grid;
        justify-items: center;
        gap: 4px;
      }

      .bar-wrap {
        display: flex;
        align-items: flex-end;
        width: 100%;
        height: 90px;
        border-bottom: 1px solid var(--ac-color-border-slate);
      }

      .bar {
        display: block;
        width: 100%;
        min-height: 2px;
        border-radius: 4px 4px 0 0;
        background: var(--ac-color-action);
      }

      .label {
        font-size: 11px;
        color: var(--ac-color-text-muted);
      }

      .rules {
        margin: 0;
        padding: 14px;
        max-height: 360px;
        overflow: auto;
        white-space: pre-wrap;
        border-radius: 10px;
        background: var(--ac-color-surface-slate);
        color: var(--ac-color-text-body);
        font-size: 13px;
        line-height: 1.5;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminAiPage implements OnInit {
  private readonly api = inject(AdminPortalApi);

  protected readonly data = signal<AdminAiMonitoring | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly days = signal(30);
  protected readonly periods = [7, 30, 90];

  ngOnInit(): void {
    this.load();
  }

  protected setDays(days: number): void {
    this.days.set(days);
    this.load();
  }

  protected seconds(ms: number | null): string {
    return ms === null ? '—' : `${(ms / 1000).toFixed(1)} s`;
  }

  protected height(value: number): number {
    const max = Math.max(0, ...(this.data()?.daily ?? []).map((d) => d.questions));
    return max === 0 ? 0 : (value / max) * 100;
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.aiMonitoring(this.days()).subscribe({
      next: (data) => {
        this.data.set(data);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(errorMessage(err, 'AI usage could not be loaded.'));
        this.loading.set(false);
      },
    });
  }
}
