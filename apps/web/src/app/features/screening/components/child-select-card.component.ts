import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { ChildResponse } from '@auticare/contracts';

const formatChildAge = (dateOfBirth: string): string => {
  const birth = new Date(`${dateOfBirth}T00:00:00Z`);
  if (Number.isNaN(birth.getTime())) return '';
  const now = new Date();
  let months =
    (now.getUTCFullYear() - birth.getUTCFullYear()) * 12 +
    (now.getUTCMonth() - birth.getUTCMonth());
  if (now.getUTCDate() < birth.getUTCDate()) months -= 1;
  months = Math.max(months, 0);
  const years = Math.floor(months / 12);
  if (years < 1) return `${months} mo`;
  return `${years} yr${years === 1 ? '' : 's'}`;
};

/**
 * Selectable child card: avatar (initial), name, age, and a selected state
 * (teal border + checkmark badge).
 *
 * Promotion candidate: a generic "selectable entity card" once another feature
 * needs one. Relies on the `--scr-*` custom properties defined by the screening
 * page host; parameterise colours before promoting.
 */
@Component({
  selector: 'ac-child-select-card',
  standalone: true,
  template: `
    <button
      type="button"
      class="card"
      [class.selected]="selected()"
      [attr.aria-pressed]="selected()"
      (click)="select.emit(child().id)"
    >
      @if (selected()) {
        <span class="check" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path
              d="M5 12.5l4 4 10-10"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
      }
      <span class="avatar" aria-hidden="true">{{ initial() }}</span>
      <span class="name">{{ child().firstName }}</span>
      <span class="age">{{ age() }}</span>
    </button>
  `,
  styles: [
    `
      .card {
        position: relative;
        width: 116px;
        min-height: 132px;
        flex: 0 0 auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        padding: 18px 12px 16px;
        border: 2px solid var(--scr-banner-border);
        border-radius: var(--scr-radius);
        background: var(--scr-surface);
        cursor: pointer;
        transition:
          border-color 160ms ease,
          box-shadow 160ms ease;
      }
      .card:hover {
        border-color: var(--scr-avatar-bg);
      }
      .card.selected {
        border-color: var(--scr-teal);
        box-shadow: var(--scr-shadow-card);
      }
      .card:focus-visible {
        outline: 3px solid var(--scr-teal);
        outline-offset: 2px;
      }
      .avatar {
        width: 52px;
        height: 52px;
        border-radius: 999px;
        background: var(--scr-avatar-bg);
        color: var(--scr-teal-ink);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
        font-weight: 800;
      }
      .name {
        color: var(--scr-text);
        font-weight: 700;
        font-size: 15px;
        line-height: 1.2;
        text-align: center;
      }
      .age {
        color: var(--scr-text-muted);
        font-size: 13px;
        font-weight: 600;
      }
      .check {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 22px;
        height: 22px;
        border-radius: 999px;
        background: var(--scr-teal);
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .check svg {
        width: 14px;
        height: 14px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChildSelectCardComponent {
  readonly child = input.required<ChildResponse>();
  readonly selected = input(false);
  readonly select = output<string>();

  readonly initial = computed(() => this.child().firstName.charAt(0).toUpperCase());
  readonly age = computed(() => formatChildAge(this.child().dateOfBirth));
}
