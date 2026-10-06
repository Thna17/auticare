import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { UiButtonComponent } from '../../design-system/components/ui-button.component';
import { UiDialogComponent } from '../../design-system/components/ui-dialog.component';
import type { AppointmentResponse } from '@auticare/contracts';

const presetReasons = [
  'No slots available',
  'Doctor unavailable',
  'Needs referral',
  'Duplicate request',
  'Other',
] as const;

@Component({
  standalone: true,
  selector: 'ac-reject-reason-modal',
  imports: [UiButtonComponent, UiDialogComponent],
  template: `
    <ac-ui-dialog
      heading="Reject appointment request"
      dialogRole="alertdialog"
      size="sm"
      (close)="cancel.emit()"
    >
      <p class="summary">
        {{ appointment().childName ?? 'Patient' }} ·
        {{ appointment().doctorName ?? 'Specialist TBD' }} ·
        {{ formattedDate() }}
      </p>

      <label class="field-label" for="reject-reason-select">Reason</label>
      <select
        id="reject-reason-select"
        class="reason-select"
        [value]="selectedPreset()"
        (change)="selectedPreset.set($any($event.target).value)"
      >
        @for (reason of presetReasons; track reason) {
          <option [value]="reason">{{ reason }}</option>
        }
      </select>

      <label class="field-label" for="reject-reason-notes">
        Note to patient {{ selectedPreset() === 'Other' ? '(required)' : '(optional)' }}
      </label>
      <textarea
        id="reject-reason-notes"
        class="reason-notes"
        rows="3"
        maxlength="500"
        placeholder="Short, patient-facing explanation"
        [value]="notes()"
        (input)="notes.set($any($event.target).value)"
      ></textarea>

      <div dialogFooter class="modal-footer">
        <ac-ui-button variant="secondary" (click)="cancel.emit()">Cancel</ac-ui-button>
        <ac-ui-button
          variant="destructive"
          [disabled]="!canConfirm()"
          (click)="confirm.emit(finalReason())"
        >
          Confirm rejection
        </ac-ui-button>
      </div>
    </ac-ui-dialog>
  `,
  styles: [
    `
      .summary {
        margin: 0 0 var(--ac-space-4);
        color: var(--ac-color-text-muted);
        font-size: var(--ac-type-meta);
      }

      .field-label {
        display: block;
        margin: 0 0 var(--ac-space-2);
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-medium);
        color: var(--ac-color-text-muted);
      }

      .reason-select,
      .reason-notes {
        width: 100%;
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-md);
        padding: 10px 12px;
        font-family: inherit;
        font-size: var(--ac-type-meta);
        color: var(--ac-color-text);
        margin-bottom: var(--ac-space-4);
        background: var(--ac-color-surface);
      }

      .reason-notes {
        resize: vertical;
      }

      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: var(--ac-space-2);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RejectReasonModalComponent {
  readonly appointment = input.required<AppointmentResponse>();
  readonly cancel = output<void>();
  readonly confirm = output<string>();

  protected readonly presetReasons = presetReasons;
  protected readonly selectedPreset = signal<(typeof presetReasons)[number]>(presetReasons[0]);
  protected readonly notes = signal('');

  protected readonly canConfirm = computed(() =>
    this.selectedPreset() === 'Other' ? this.notes().trim().length > 0 : true,
  );

  protected readonly finalReason = computed(() => {
    const preset = this.selectedPreset();
    const notes = this.notes().trim();
    if (preset === 'Other') return notes;
    return notes ? `${preset} — ${notes}` : preset;
  });

  protected formattedDate(): string {
    return new Date(this.appointment().scheduledAt).toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }
}
