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
import type { HospitalRegistration, HospitalRegistrationStatus } from '@auticare/contracts';
import { I18nService } from '../../core/i18n/i18n.service';
import { DICTIONARY } from '../../core/i18n/i18n.dictionary';
import { UiCardComponent } from '../../design-system/components/ui-card.component';
import { UiBadgeComponent } from '../../design-system/components/ui-badge.component';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';
import { UiEmptyStateComponent } from '../../design-system/components/ui-empty-state.component';
import { HospitalRegistrationsService } from './data-access/hospital-registrations.service';

@Component({
  standalone: true,
  selector: 'ac-hospital-registrations-page',
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
              : 'New requests submitted by hospitals will appear here.'
          "
        />
      } @else {
        <div class="cards-list">
          @for (req of requests(); track req.id) {
            <ac-ui-card class="request-card">
              <header class="card-header">
                <div class="hospital-identity">
                  <h2>{{ req.hospitalName }}</h2>
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

                @if (req.services) {
                  <div class="detail-item full-width">
                    <span class="detail-label">{{ texts().services }}</span>
                    <span class="detail-value">{{ req.services }}</span>
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
                    @if (req.hospitalId) {
                      <span class="hospital-id-tag"
                        >{{ texts().hospitalId }}: {{ req.hospitalId }}</span
                      >
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
              <strong>{{ target.hospitalName }}</strong>
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
              <span>{{ actionProcessing() ? '...' : texts().approve }}</span>
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
            <div class="target-summary">
              <strong>{{ target.hospitalName }}</strong>
              <span
                >{{ target.contactFirstName }} {{ target.contactLastName }} ({{
                  target.email
                }})</span
              >
            </div>
            <label class="dialog-field">
              <span>{{ texts().rejectReasonLabel }}</span>
              <textarea
                rows="3"
                [(ngModel)]="rejectReason"
                [placeholder]="texts().rejectReasonPlaceholder"
              ></textarea>
            </label>
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
              <span>{{ actionProcessing() ? '...' : texts().reject }}</span>
            </button>
          </footer>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .admin-page {
        max-width: 1040px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 24px;
        padding-bottom: 48px;
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
        letter-spacing: 0.05em;
        color: var(--ac-color-action-mid);
      }

      h1 {
        margin: 0 0 6px;
        font-size: 28px;
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text-strong);
      }

      .subtitle {
        margin: 0;
        font-size: 14px;
        color: var(--ac-color-text-body);
      }

      .status-tabs {
        display: flex;
        gap: 8px;
        border-bottom: 1px solid var(--ac-color-border);
        padding-bottom: 2px;
      }

      .tab-btn {
        background: transparent;
        border: none;
        padding: 10px 18px;
        font-size: 14px;
        font-weight: var(--ac-font-weight-medium);
        color: var(--ac-color-text-body);
        cursor: pointer;
        border-radius: 8px 8px 0 0;
        border-bottom: 2px solid transparent;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        transition: all 0.2s ease;
      }

      .tab-btn:hover {
        color: var(--ac-color-action-mid);
      }

      .tab-btn.active {
        color: var(--ac-color-action-mid);
        font-weight: var(--ac-font-weight-bold);
        border-bottom-color: var(--ac-color-action-mid);
      }

      .tab-badge {
        background: var(--ac-color-alert);
        color: var(--ac-color-text-on-action);
        font-size: 11px;
        font-weight: var(--ac-font-weight-bold);
        border-radius: var(--ac-radius-pill);
        padding: 2px 7px;
        line-height: 1;
      }

      .cards-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .request-card {
        padding: 20px 24px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .card-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--ac-color-border);
      }

      .hospital-identity h2 {
        margin: 0 0 4px;
        font-size: 18px;
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text-strong);
      }

      .location-tag {
        font-size: 13px;
        color: var(--ac-color-text-muted);
      }

      .header-meta {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .date-tag {
        font-size: 12px;
        color: var(--ac-color-text-muted);
      }

      .card-details-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 16px;
      }

      .detail-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .detail-item.full-width {
        grid-column: 1 / -1;
      }

      .detail-label {
        font-size: 12px;
        font-weight: var(--ac-font-weight-semibold);
        color: var(--ac-color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .detail-value {
        font-size: 14px;
        color: var(--ac-color-text-body);
      }

      .sub-value {
        font-weight: normal;
        color: var(--ac-color-text-muted);
        margin-left: 6px;
      }

      .detail-link {
        font-size: 14px;
        color: var(--ac-color-action-mid);
        text-decoration: none;
      }

      .detail-link:hover {
        text-decoration: underline;
      }

      .message-box {
        background: var(--ac-color-surface-hover);
        border: 1px solid var(--ac-color-border);
        border-radius: 8px;
        padding: 12px 14px;
      }

      .message-content {
        margin: 4px 0 0;
        font-size: 13.5px;
        line-height: 1.5;
        color: var(--ac-color-text-body);
        white-space: pre-wrap;
      }

      .review-meta {
        border-radius: 8px;
        padding: 10px 14px;
        font-size: 13px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .review-meta.approved {
        background: color-mix(in srgb, var(--ac-color-success) 10%, transparent);
        color: var(--ac-color-success);
        font-weight: var(--ac-font-weight-medium);
      }

      .hospital-id-tag {
        font-size: 12px;
        font-family: monospace;
        color: var(--ac-color-text-body);
      }

      .review-meta.rejected {
        background: color-mix(in srgb, var(--ac-color-alert) 10%, transparent);
        color: var(--ac-color-alert);
      }

      .rejection-title {
        font-weight: var(--ac-font-weight-bold);
      }

      .rejection-text {
        margin: 0;
        color: var(--ac-color-text-body);
        font-style: italic;
      }

      .review-date {
        font-size: 11px;
        color: var(--ac-color-text-muted);
      }

      .card-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding-top: 12px;
        border-top: 1px solid var(--ac-color-border);
      }

      .action-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 18px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: var(--ac-font-weight-semibold);
        border: 1px solid transparent;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .approve-btn {
        background: color-mix(in srgb, var(--ac-color-success) 15%, transparent);
        color: var(--ac-color-success);
        border-color: color-mix(in srgb, var(--ac-color-success) 30%, transparent);
      }

      .approve-btn:hover {
        background: var(--ac-color-success);
        color: var(--ac-color-text-on-action);
      }

      .reject-btn {
        background: color-mix(in srgb, var(--ac-color-alert) 12%, transparent);
        color: var(--ac-color-alert);
        border-color: color-mix(in srgb, var(--ac-color-alert) 25%, transparent);
      }

      .reject-btn:hover {
        background: var(--ac-color-alert);
        color: var(--ac-color-text-on-action);
      }

      /* Modal styles */
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: color-mix(in srgb, var(--ac-brand-950) 40%, transparent);
        z-index: 50;
      }

      .modal-dialog {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 100%;
        max-width: 500px;
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
        border-radius: 16px;
        padding: 24px;
        box-shadow: 0 20px 48px -12px color-mix(in srgb, var(--ac-brand-950) 25%, transparent);
        z-index: 51;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .dialog-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text-strong);
      }

      .dialog-body {
        display: flex;
        flex-direction: column;
        gap: 12px;
        font-size: 14px;
        color: var(--ac-color-text-body);
        line-height: 1.5;
      }

      .target-summary {
        background: var(--ac-color-surface-hover);
        border-radius: 8px;
        padding: 10px 14px;
        display: flex;
        flex-direction: column;
        gap: 2px;
        font-size: 13px;
      }

      .dialog-field {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .dialog-field span {
        font-size: 13px;
        font-weight: var(--ac-font-weight-semibold);
        color: var(--ac-color-text-strong);
      }

      .dialog-field textarea {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid var(--ac-color-border);
        border-radius: 8px;
        background: var(--ac-color-surface);
        color: var(--ac-color-text-strong);
        font-family: inherit;
        font-size: 13.5px;
        box-sizing: border-box;
      }

      .dialog-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        padding-top: 8px;
      }

      .dialog-btn {
        padding: 8px 18px;
        border-radius: 8px;
        font-size: 13.5px;
        font-weight: var(--ac-font-weight-semibold);
        border: 1px solid transparent;
        cursor: pointer;
        transition: all 0.2s;
      }

      .dialog-btn.secondary {
        background: var(--ac-color-surface);
        border-color: var(--ac-color-border);
        color: var(--ac-color-text-body);
      }

      .dialog-btn.secondary:hover:not(:disabled) {
        background: var(--ac-color-surface-hover);
      }

      .dialog-btn.primary-approve {
        background: var(--ac-color-success);
        color: var(--ac-color-text-on-action);
      }

      .dialog-btn.primary-approve:hover:not(:disabled) {
        filter: brightness(0.9);
      }

      .dialog-btn.danger-reject {
        background: var(--ac-color-alert);
        color: var(--ac-color-text-on-action);
      }

      .dialog-btn.danger-reject:hover:not(:disabled) {
        filter: brightness(0.9);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HospitalRegistrationsPage implements OnInit {
  private readonly registrationsService = inject(HospitalRegistrationsService);
  private readonly i18n = inject(I18nService, { optional: true });

  readonly activeTab = signal<HospitalRegistrationStatus>('PENDING');
  readonly requests = signal<HospitalRegistration[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);

  readonly actionProcessing = signal(false);
  readonly actionSuccess = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);

  readonly approvingRequest = signal<HospitalRegistration | null>(null);
  readonly rejectingRequest = signal<HospitalRegistration | null>(null);
  rejectReason = '';

  readonly currentLang = computed(() => this.i18n?.currentLang() ?? 'km');

  readonly texts = computed(() => {
    return this.i18n
      ? this.i18n.dictionary.hospitalRegistrations
      : DICTIONARY[this.currentLang()].hospitalRegistrations;
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

  setTab(tab: HospitalRegistrationStatus): void {
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
            : 'Failed to load hospital registration requests.');
        this.loadError.set(msg);
      },
    });
  }

  openApproveDialog(req: HospitalRegistration): void {
    this.actionSuccess.set(null);
    this.actionError.set(null);
    this.approvingRequest.set(req);
  }

  openRejectDialog(req: HospitalRegistration): void {
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

  confirmApprove(req: HospitalRegistration): void {
    this.actionProcessing.set(true);
    this.actionError.set(null);
    this.registrationsService.approve(req.id).subscribe({
      next: () => {
        this.actionProcessing.set(false);
        this.approvingRequest.set(null);
        this.actionSuccess.set(
          this.currentLang() === 'km'
            ? `បានអនុម័តសំណើរបស់ ${req.hospitalName} ដោយជោគជ័យ។`
            : `Successfully approved ${req.hospitalName}. Invitation email sent.`,
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

  confirmReject(req: HospitalRegistration): void {
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
            ? `បានបដិសេធសំណើរបស់ ${req.hospitalName}។`
            : `Rejected registration request for ${req.hospitalName}.`,
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

  statusLabel(status: HospitalRegistrationStatus): string {
    if (status === 'PENDING') return this.texts().pending;
    if (status === 'APPROVED') return this.texts().approved;
    return this.texts().rejected;
  }

  statusBadgeTone(status: HospitalRegistrationStatus): 'warning' | 'success' | 'alert' {
    if (status === 'PENDING') return 'warning';
    if (status === 'APPROVED') return 'success';
    return 'alert';
  }
}
