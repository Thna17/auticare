import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  type OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import type { SchoolRegistration, SchoolRegistrationStatus } from '@auticare/contracts';
import { I18nService } from '../../core/i18n/i18n.service';
import { DICTIONARY } from '../../core/i18n/i18n.dictionary';
import { UiCardComponent } from '../../design-system/components/ui-card.component';
import { UiBadgeComponent } from '../../design-system/components/ui-badge.component';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';
import { UiEmptyStateComponent } from '../../design-system/components/ui-empty-state.component';
import { SchoolRegistrationsService } from './data-access/school-registrations.service';

@Component({
  standalone: true,
  selector: 'ac-school-registrations-page',
  imports: [
    FormsModule,
    DatePipe,
    UiCardComponent,
    UiBadgeComponent,
    UiMessageComponent,
    UiSpinnerComponent,
    UiEmptyStateComponent,
  ],
  template: `
    <div class="admin-page">
      <header class="page-header">
        <div>
          <p class="eyebrow">
            {{ currentLang() === 'km' ? 'ការគ្រប់គ្រងប្រព័ន្ធ' : 'Administration' }}
          </p>
          <h1>{{ texts().adminTitle }}</h1>
          <p class="subtitle">{{ texts().adminSubtitle }}</p>
        </div>
      </header>

      <!-- Status Tabs -->
      <nav class="status-tabs" aria-label="Registration status filters">
        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab() === 'PENDING'"
          (click)="setTab('PENDING')"
        >
          <span>{{ texts().pending }}</span>
          @if (pendingCount() > 0) {
            <span class="tab-badge">{{ pendingCount() }}</span>
          }
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab() === 'APPROVED'"
          (click)="setTab('APPROVED')"
        >
          <span>{{ texts().approved }}</span>
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab() === 'REJECTED'"
          (click)="setTab('REJECTED')"
        >
          <span>{{ texts().rejected }}</span>
        </button>
      </nav>

      @if (actionSuccess()) {
        <ac-ui-message tone="success">{{ actionSuccess() }}</ac-ui-message>
      }
      @if (actionError()) {
        <ac-ui-message tone="error">{{ actionError() }}</ac-ui-message>
      }

      @if (loading()) {
        <ac-ui-card>
          <ac-ui-spinner
            [label]="
              currentLang() === 'km' ? 'កំពុងផ្ទុកសំណើ...' : 'Loading registration requests…'
            "
          />
        </ac-ui-card>
      } @else if (loadError()) {
        <ac-ui-message tone="error">{{ loadError() }}</ac-ui-message>
      } @else if (requests().length === 0) {
        <ac-ui-empty-state
          [title]="emptyMessage()"
          [message]="
            currentLang() === 'km'
              ? 'សំណើថ្មីៗដែលបានដាក់ស្នើនឹងបង្ហាញនៅទីនេះ។'
              : 'New requests submitted by schools will appear here.'
          "
        />
      } @else {
        <div class="cards-list">
          @for (req of requests(); track req.id) {
            <ac-ui-card class="request-card">
              <header class="card-header">
                <div class="school-identity">
                  <h2>{{ req.schoolName }}</h2>
                  <span class="location-tag">📍 {{ req.city }}</span>
                </div>
                <div class="header-meta">
                  <ac-ui-badge [tone]="statusBadgeTone(req.status)">
                    {{ statusLabel(req.status) }}
                  </ac-ui-badge>
                  <time class="date-tag">{{ req.createdAt | date: 'mediumDate' }}</time>
                </div>
              </header>

              <div class="card-details-grid">
                <div class="detail-item">
                  <span class="detail-label">
                    {{ currentLang() === 'km' ? 'អ្នកទំនាក់ទំនង' : 'Contact Person' }}
                  </span>
                  <span class="detail-value">
                    <strong>{{ req.contactFirstName }} {{ req.contactLastName }}</strong>
                    @if (req.contactTitle) {
                      <span class="sub-value">({{ req.contactTitle }})</span>
                    }
                  </span>
                </div>

                <div class="detail-item">
                  <span class="detail-label">{{ texts().email }}</span>
                  <a [href]="'mailto:' + req.email" class="detail-link">{{ req.email }}</a>
                </div>

                <div class="detail-item">
                  <span class="detail-label">{{ texts().phone }}</span>
                  <a [href]="'tel:' + req.phone" class="detail-link">{{ req.phone }}</a>
                </div>

                @if (req.studentCount) {
                  <div class="detail-item">
                    <span class="detail-label">{{ texts().studentCount }}</span>
                    <span class="detail-value">{{ req.studentCount }}</span>
                  </div>
                }

                @if (req.address) {
                  <div class="detail-item full-width">
                    <span class="detail-label">{{ texts().address }}</span>
                    <span class="detail-value">{{ req.address }}</span>
                  </div>
                }

                @if (req.message) {
                  <div class="detail-item full-width message-box">
                    <span class="detail-label">{{ texts().message }}</span>
                    <p class="message-content">{{ req.message }}</p>
                  </div>
                }

                @if (req.status === 'APPROVED') {
                  <div class="detail-item full-width review-meta approved">
                    <span> ✓ {{ texts().reviewedAt }}: {{ req.reviewedAt | date: 'medium' }} </span>
                    @if (req.schoolId) {
                      <span class="school-id-tag">{{ texts().schoolId }}: {{ req.schoolId }}</span>
                    }
                  </div>
                }

                @if (req.status === 'REJECTED') {
                  <div class="detail-item full-width review-meta rejected">
                    <span class="rejection-title">✕ {{ texts().rejectionReason }}:</span>
                    <p class="rejection-text">{{ req.rejectionReason }}</p>
                    <span class="review-date">
                      {{ texts().reviewedAt }}: {{ req.reviewedAt | date: 'medium' }}
                    </span>
                  </div>
                }
              </div>

              @if (req.status === 'PENDING') {
                <footer class="card-actions">
                  <button
                    type="button"
                    class="action-btn approve-btn"
                    (click)="openApproveDialog(req)"
                  >
                    <span>✓ {{ texts().approve }}</span>
                  </button>
                  <button
                    type="button"
                    class="action-btn reject-btn"
                    (click)="openRejectDialog(req)"
                  >
                    <span>✕ {{ texts().reject }}</span>
                  </button>
                </footer>
              }
            </ac-ui-card>
          }
        </div>
      }

      <!-- Approve Confirm Dialog Modal -->
      @if (approvingRequest(); as target) {
        <div class="modal-backdrop" (click)="closeDialogs()" aria-hidden="true"></div>
        <div
          class="modal-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="approve-dialog-title"
        >
          <header class="dialog-header">
            <h3 id="approve-dialog-title">{{ texts().approveConfirmTitle }}</h3>
          </header>
          <div class="dialog-body">
            <p>{{ texts().approveConfirmMessage }}</p>
            <div class="target-summary">
              <strong>{{ target.schoolName }}</strong>
              <span
                >{{ target.contactFirstName }} {{ target.contactLastName }} ({{
                  target.email
                }})</span
              >
            </div>
          </div>
          <footer class="dialog-actions">
            <button
              type="button"
              class="dialog-btn secondary"
              [disabled]="actionProcessing()"
              (click)="closeDialogs()"
            >
              {{ currentLang() === 'km' ? 'បោះបង់' : 'Cancel' }}
            </button>
            <button
              type="button"
              class="dialog-btn primary-approve"
              [disabled]="actionProcessing()"
              (click)="confirmApprove(target)"
            >
              {{
                actionProcessing()
                  ? currentLang() === 'km'
                    ? 'កំពុងអនុម័ត...'
                    : 'Approving…'
                  : texts().approve
              }}
            </button>
          </footer>
        </div>
      }

      <!-- Reject Dialog Modal -->
      @if (rejectingRequest(); as target) {
        <div class="modal-backdrop" (click)="closeDialogs()" aria-hidden="true"></div>
        <div
          class="modal-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reject-dialog-title"
        >
          <header class="dialog-header">
            <h3 id="reject-dialog-title">{{ texts().rejectDialogTitle }}</h3>
          </header>
          <div class="dialog-body">
            <p>
              {{
                currentLang() === 'km'
                  ? 'សូមបញ្ជាក់មូលហេតុនៃការបដិសេធសំណើរបស់ ' +
                    target.schoolName +
                    '។ មូលហេតុនេះនឹងត្រូវផ្ញើតាមអ៊ីមែលទៅកាន់សាលា។'
                  : 'Specify why this registration request is being rejected. This will be emailed to ' +
                    target.email +
                    '.'
              }}
            </p>
            <label class="dialog-label" for="reject-reason-input">
              {{ texts().rejectReasonLabel }}
            </label>
            <textarea
              id="reject-reason-input"
              rows="4"
              class="dialog-textarea"
              [(ngModel)]="rejectReason"
              [placeholder]="texts().rejectReasonPlaceholder"
            ></textarea>
            @if (rejectReason.trim().length > 0 && rejectReason.trim().length < 3) {
              <span class="field-error">
                {{
                  currentLang() === 'km'
                    ? 'មូលហេតុត្រូវមានយ៉ាងតិច ៣ តួអក្សរ'
                    : 'Reason must be at least 3 characters'
                }}
              </span>
            }
          </div>
          <footer class="dialog-actions">
            <button
              type="button"
              class="dialog-btn secondary"
              [disabled]="actionProcessing()"
              (click)="closeDialogs()"
            >
              {{ currentLang() === 'km' ? 'បោះបង់' : 'Cancel' }}
            </button>
            <button
              type="button"
              class="dialog-btn danger-reject"
              [disabled]="actionProcessing() || rejectReason.trim().length < 3"
              (click)="confirmReject(target)"
            >
              {{
                actionProcessing()
                  ? currentLang() === 'km'
                    ? 'កំពុងបដិសេធ...'
                    : 'Rejecting…'
                  : texts().reject
              }}
            </button>
          </footer>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        color: var(--ac-color-text-strong);
      }

      .admin-page {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .page-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
      }

      .eyebrow {
        margin: 0 0 4px;
        font-size: 12px;
        font-weight: var(--ac-font-weight-bold);
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--ac-color-text-slate);
      }

      h1 {
        margin: 0;
        font-size: 26px;
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text-strong);
      }

      .subtitle {
        margin: 6px 0 0;
        font-size: 14px;
        color: var(--ac-color-text-body);
      }

      .status-tabs {
        display: flex;
        gap: 8px;
        border-bottom: 1px solid var(--ac-color-border-slate);
        padding-bottom: 4px;
      }

      .tab-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 18px;
        border: 0;
        border-radius: var(--ac-radius-pill);
        background: transparent;
        color: var(--ac-color-text-body);
        font: inherit;
        font-size: 14px;
        font-weight: var(--ac-font-weight-medium);
        cursor: pointer;
        transition:
          background var(--ac-motion-fast),
          color var(--ac-motion-fast);
      }

      .tab-btn:hover {
        background: var(--ac-color-surface-slate);
        color: var(--ac-color-text-strong);
      }

      .tab-btn.active {
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        font-weight: var(--ac-font-weight-semibold);
      }

      .tab-badge {
        padding: 2px 7px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-surface-info);
        color: var(--ac-color-action-deep);
        font-size: 11px;
        font-weight: var(--ac-font-weight-bold);
      }

      .tab-btn.active .tab-badge {
        background: var(--ac-color-surface);
        color: var(--ac-color-action);
      }

      .cards-list {
        display: grid;
        gap: 16px;
      }

      .request-card {
        display: grid;
        gap: 18px;
        padding: 24px;
      }

      .card-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--ac-color-border-slate);
      }

      .school-identity h2 {
        margin: 0;
        font-size: 18px;
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text-strong);
      }

      .location-tag {
        font-size: 13px;
        color: var(--ac-color-text-muted);
        display: inline-block;
        margin-top: 2px;
      }

      .header-meta {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .date-tag {
        font-size: 12.5px;
        color: var(--ac-color-text-muted);
      }

      .card-details-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 14px 20px;
      }

      .detail-item {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .full-width {
        grid-column: 1 / -1;
      }

      .detail-label {
        font-size: 11px;
        font-weight: var(--ac-font-weight-semibold);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--ac-color-text-slate);
      }

      .detail-value {
        font-size: 14px;
        color: var(--ac-color-text-strong);
      }

      .sub-value {
        font-size: 12.5px;
        color: var(--ac-color-text-muted);
        margin-left: 4px;
      }

      .detail-link {
        font-size: 14px;
        color: var(--ac-color-action);
        text-decoration: none;
      }

      .detail-link:hover {
        text-decoration: underline;
      }

      .message-box {
        background: var(--ac-color-surface-slate);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: var(--ac-radius-md);
        padding: 10px 14px;
      }

      .message-content {
        margin: 4px 0 0;
        font-size: 13.5px;
        color: var(--ac-color-text-body);
        line-height: 1.45;
        white-space: pre-line;
      }

      .review-meta {
        border-radius: var(--ac-radius-md);
        padding: 10px 14px;
        font-size: 13px;
      }

      .review-meta.approved {
        background: var(--ac-color-surface-info);
        border: 1px solid var(--ac-color-border-info);
        color: var(--ac-color-action-deep);
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 8px;
      }

      .school-id-tag {
        font-family: monospace;
        font-size: 12px;
        background: var(--ac-color-surface);
        padding: 2px 8px;
        border-radius: var(--ac-radius-sm);
        border: 1px solid var(--ac-color-border);
      }

      .review-meta.rejected {
        background: var(--ac-color-red-50);
        border: 1px solid var(--ac-color-red-200);
        color: var(--ac-color-red-700);
      }

      .rejection-title {
        font-weight: var(--ac-font-weight-semibold);
      }

      .rejection-text {
        margin: 4px 0 6px;
        font-size: 13.5px;
        color: var(--ac-color-red-900);
      }

      .review-date {
        font-size: 11.5px;
        color: var(--ac-color-red-600);
      }

      .card-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding-top: 8px;
        border-top: 1px solid var(--ac-color-border-slate);
      }

      .action-btn {
        height: 38px;
        padding: 0 18px;
        border: 0;
        border-radius: var(--ac-radius-pill);
        font: inherit;
        font-size: 13.5px;
        font-weight: var(--ac-font-weight-semibold);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        transition:
          background var(--ac-motion-fast),
          opacity var(--ac-motion-fast);
      }

      .approve-btn {
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
      }

      .approve-btn:hover {
        background: var(--ac-color-action-mid);
      }

      .reject-btn {
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-red-300);
        color: var(--ac-color-red-700);
      }

      .reject-btn:hover {
        background: var(--ac-color-red-50);
        border-color: var(--ac-color-red-600);
      }

      /* ─── MODAL DIALOGS ─── */
      .modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 50;
        background: var(--ac-color-overlay);
        backdrop-filter: blur(2px);
      }

      .modal-dialog {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 55;
        width: 100%;
        max-width: 480px;
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 20px;
        padding: 26px 24px;
        box-shadow: 0 20px 48px -12px color-mix(in srgb, var(--ac-brand-950) 16%, transparent);
        display: grid;
        gap: 18px;
      }

      .dialog-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text-strong);
      }

      .dialog-body {
        display: grid;
        gap: 10px;
      }

      .dialog-body p {
        margin: 0;
        font-size: 14px;
        color: var(--ac-color-text-body);
        line-height: 1.45;
      }

      .target-summary {
        background: var(--ac-color-surface-slate);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: var(--ac-radius-md);
        padding: 10px 14px;
        display: flex;
        flex-direction: column;
        gap: 2px;
        font-size: 13.5px;
      }

      .dialog-label {
        font-size: 12.5px;
        font-weight: var(--ac-font-weight-semibold);
        color: var(--ac-color-text-strong);
        margin-top: 4px;
      }

      .dialog-textarea {
        width: 100%;
        border: 1px solid var(--ac-color-border-grey);
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-strong);
        font: inherit;
        font-size: 14px;
        padding: 10px 12px;
        resize: vertical;
        transition: border-color 160ms ease;
      }

      .dialog-textarea:focus {
        border-color: var(--ac-color-action);
        outline: none;
      }

      .field-error {
        font-size: 12px;
        color: var(--ac-color-red-600);
      }

      .dialog-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        padding-top: 6px;
      }

      .dialog-btn {
        height: 40px;
        padding: 0 18px;
        border: 0;
        border-radius: var(--ac-radius-pill);
        font: inherit;
        font-size: 13.5px;
        font-weight: var(--ac-font-weight-semibold);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition:
          background var(--ac-motion-fast),
          opacity var(--ac-motion-fast);
      }

      .dialog-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .dialog-btn.secondary {
        background: var(--ac-color-surface-slate);
        color: var(--ac-color-text-body);
        border: 1px solid var(--ac-color-border-slate);
      }

      .dialog-btn.secondary:hover:not(:disabled) {
        background: var(--ac-color-border-slate);
      }

      .dialog-btn.primary-approve {
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
      }

      .dialog-btn.primary-approve:hover:not(:disabled) {
        background: var(--ac-color-action-mid);
      }

      .dialog-btn.danger-reject {
        background: var(--ac-color-red-600);
        color: var(--ac-color-text-on-action);
      }

      .dialog-btn.danger-reject:hover:not(:disabled) {
        background: var(--ac-color-red-700);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchoolRegistrationsPage implements OnInit {
  private readonly registrationsService = inject(SchoolRegistrationsService);
  private readonly i18n = inject(I18nService, { optional: true });

  readonly activeTab = signal<SchoolRegistrationStatus>('PENDING');
  readonly requests = signal<SchoolRegistration[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);

  readonly actionProcessing = signal(false);
  readonly actionSuccess = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);

  readonly approvingRequest = signal<SchoolRegistration | null>(null);
  readonly rejectingRequest = signal<SchoolRegistration | null>(null);
  rejectReason = '';

  readonly currentLang = computed(() => this.i18n?.currentLang() ?? 'km');

  readonly texts = computed(() => {
    return this.i18n
      ? this.i18n.dictionary.schoolRegistrations
      : DICTIONARY[this.currentLang()].schoolRegistrations;
  });

  readonly pendingCount = computed(() => this.registrationsService.pendingCount());

  readonly emptyMessage = computed(() => {
    const tab = this.activeTab();
    if (tab === 'PENDING') return this.texts().emptyPending;
    if (tab === 'APPROVED') return this.texts().emptyApproved;
    return this.texts().emptyRejected;
  });

  ngOnInit(): void {
    this.loadData();
    this.registrationsService.fetchPendingCount().subscribe({ error: () => {} });
  }

  setTab(tab: SchoolRegistrationStatus): void {
    this.activeTab.set(tab);
    this.actionSuccess.set(null);
    this.actionError.set(null);
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.registrationsService.list(this.activeTab()).subscribe({
      next: (data) => {
        this.requests.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        const msg =
          err?.error?.error?.message ||
          (this.currentLang() === 'km'
            ? 'មិនអាចទាញយកទិន្នន័យបានទេ។'
            : 'Failed to load school registration requests.');
        this.loadError.set(msg);
      },
    });
  }

  openApproveDialog(req: SchoolRegistration): void {
    this.actionSuccess.set(null);
    this.actionError.set(null);
    this.approvingRequest.set(req);
  }

  openRejectDialog(req: SchoolRegistration): void {
    this.actionSuccess.set(null);
    this.actionError.set(null);
    this.rejectReason = '';
    this.rejectingRequest.set(req);
  }

  closeDialogs(): void {
    if (this.actionProcessing()) return;
    this.approvingRequest.set(null);
    this.rejectingRequest.set(null);
    this.rejectReason = '';
  }

  confirmApprove(req: SchoolRegistration): void {
    this.actionProcessing.set(true);
    this.actionError.set(null);
    this.registrationsService.approve(req.id).subscribe({
      next: () => {
        this.actionProcessing.set(false);
        this.approvingRequest.set(null);
        this.actionSuccess.set(
          this.currentLang() === 'km'
            ? `បានអនុម័តសំណើរបស់ ${req.schoolName} ដោយជោគជ័យ។`
            : `Successfully approved ${req.schoolName}. Invitation email sent.`,
        );
        this.loadData();
      },
      error: (err) => {
        this.actionProcessing.set(false);
        const msg =
          err?.error?.error?.message ||
          (this.currentLang() === 'km'
            ? 'ការអនុម័តបានបរាជ័យ។ សំណើអាចត្រូវបានពិនិត្យរួចហើយ។'
            : 'Approval failed. The request may have already been reviewed.');
        this.actionError.set(msg);
        this.approvingRequest.set(null);
        this.loadData();
      },
    });
  }

  confirmReject(req: SchoolRegistration): void {
    const reason = this.rejectReason.trim();
    if (reason.length < 3) return;

    this.actionProcessing.set(true);
    this.actionError.set(null);
    this.registrationsService.reject(req.id, reason).subscribe({
      next: () => {
        this.actionProcessing.set(false);
        this.rejectingRequest.set(null);
        this.rejectReason = '';
        this.actionSuccess.set(
          this.currentLang() === 'km'
            ? `បានបដិសេធសំណើរបស់ ${req.schoolName}។`
            : `Rejected registration request for ${req.schoolName}.`,
        );
        this.loadData();
      },
      error: (err) => {
        this.actionProcessing.set(false);
        const msg =
          err?.error?.error?.message ||
          (this.currentLang() === 'km'
            ? 'ការបដិសេធបានបរាជ័យ។'
            : 'Rejection failed. The request may have already been reviewed.');
        this.actionError.set(msg);
        this.rejectingRequest.set(null);
        this.rejectReason = '';
        this.loadData();
      },
    });
  }

  statusLabel(status: SchoolRegistrationStatus): string {
    if (status === 'PENDING') return this.texts().pending;
    if (status === 'APPROVED') return this.texts().approved;
    return this.texts().rejected;
  }

  statusBadgeTone(status: SchoolRegistrationStatus): 'warning' | 'success' | 'alert' {
    if (status === 'PENDING') return 'warning';
    if (status === 'APPROVED') return 'success';
    return 'alert';
  }
}
