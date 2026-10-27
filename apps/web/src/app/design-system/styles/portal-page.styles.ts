/** Layout and controls shared by the portal management pages (admin, subscriptions). */
export const PORTAL_PAGE_STYLES = `
  :host {
    display: grid;
    gap: 20px;
    padding-bottom: 48px;
  }

  .page-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }

  h1 {
    margin: 0 0 6px;
    font-size: var(--ac-type-page-title);
    line-height: var(--ac-line-title);
    color: var(--ac-color-text-strong);
  }

  h2 {
    margin: 0;
    font-size: 17px;
    color: var(--ac-color-text-strong);
  }

  .subtitle,
  .note {
    margin: 0;
    max-width: 66ch;
    line-height: var(--ac-line-body);
    color: var(--ac-color-text-muted);
  }

  .subtitle {
    font-size: var(--ac-type-page-subtitle);
  }

  .note {
    font-size: 14px;
  }

  .card {
    display: grid;
    gap: 14px;
    background: var(--ac-color-surface);
    border: 1px solid var(--ac-color-border-slate);
    border-radius: 16px;
    padding: 20px 22px;
  }

  .card.highlight {
    border: 2px solid var(--ac-color-border-info);
    background: var(--ac-color-surface-info);
  }

  .plan-line {
    display: flex;
    align-items: baseline;
    gap: 12px;
    flex-wrap: wrap;
  }

  .plan-name {
    font-size: 26px;
    font-weight: 800;
    color: var(--ac-color-text-strong);
  }

  .facts {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
    gap: 12px;
    margin: 0;
  }

  .facts dt {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--ac-color-text-muted);
  }

  .facts dd {
    margin: 4px 0 0;
    font-weight: 700;
    color: var(--ac-color-text-strong);
  }

  .chip {
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
    background: var(--ac-color-green-50);
    color: var(--ac-color-green-600);
    white-space: nowrap;
  }

  .chip.warn,
  .chip[data-status='INVITED'],
  .chip[data-status='PAST_DUE'],
  .chip[data-status='CANCELED'] {
    background: var(--ac-color-amber-tint-cream);
    color: var(--ac-color-amber-dark);
  }

  .chip.off,
  .chip[data-status='ENDED'],
  .chip[data-status='EXPIRED'] {
    background: var(--ac-color-surface-slate);
    color: var(--ac-color-text-muted);
  }

  .rows {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .row {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    padding: 12px 2px;
    border-bottom: 1px solid var(--ac-color-border-slate);
  }

  .row:last-child {
    border-bottom: 0;
  }

  .row .who {
    display: grid;
    gap: 2px;
    flex: 1 1 220px;
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .row .who strong {
    color: var(--ac-color-text-strong);
  }

  .meta {
    font-size: 13px;
    color: var(--ac-color-text-muted);
  }

  .actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
  }

  .empty {
    padding: 12px 2px;
    color: var(--ac-color-text-muted);
  }

  .meter {
    height: 10px;
    border-radius: 999px;
    background: var(--ac-color-surface-slate);
    overflow: hidden;
  }

  .meter span {
    display: block;
    height: 100%;
    background: var(--ac-color-action);
  }

  form.inline {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items: flex-end;
  }

  form.inline ac-ui-field {
    flex: 1 1 260px;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 14px;
  }

  select,
  input {
    font: inherit;
  }

  .btn-primary,
  .btn-ghost,
  .btn-small {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    font: inherit;
    font-weight: 700;
    text-decoration: none;
    cursor: pointer;
  }

  .btn-primary {
    height: 42px;
    padding: 0 18px;
    border: 0;
    background: var(--ac-color-action);
    color: var(--ac-color-text-on-action);
    font-size: 14px;
  }

  .btn-primary:disabled,
  .btn-small:disabled {
    opacity: 0.6;
    cursor: default;
  }

  .btn-ghost {
    height: 42px;
    padding: 0 16px;
    border: 1px solid var(--ac-color-border-slate);
    background: var(--ac-color-surface);
    color: var(--ac-color-action-deep);
    font-size: 14px;
  }

  .btn-small {
    height: 34px;
    padding: 0 12px;
    border: 1px solid var(--ac-color-border-slate);
    background: var(--ac-color-surface);
    color: var(--ac-color-text-strong);
    font-size: 13px;
  }

  .btn-small.danger {
    color: var(--ac-color-alert-text);
  }

  button:focus-visible,
  a:focus-visible,
  select:focus-visible {
    outline: 3px solid var(--ac-color-focus);
    outline-offset: 2px;
  }

  /* Search box and filter buttons above a list. */
  .toolbar {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items: center;
  }

  .toolbar input[type='search'] {
    flex: 1 1 240px;
    min-width: 0;
    height: 42px;
    padding: 0 14px;
    border: 1px solid var(--ac-color-border-slate);
    border-radius: 10px;
    background: var(--ac-color-surface);
    color: var(--ac-color-text-strong);
  }

  .toolbar select {
    height: 42px;
    padding: 0 10px;
    border: 1px solid var(--ac-color-border-slate);
    border-radius: 10px;
    background: var(--ac-color-surface);
    color: var(--ac-color-text-strong);
  }

  .btn-small[aria-pressed='true'] {
    background: var(--ac-color-action);
    border-color: var(--ac-color-action);
    color: var(--ac-color-text-on-action);
  }

  /* Number tiles on overview pages. */
  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
    gap: 12px;
  }

  .stat {
    display: grid;
    gap: 4px;
    padding: 16px 18px;
    border: 1px solid var(--ac-color-border-slate);
    border-radius: 14px;
    background: var(--ac-color-surface);
    text-decoration: none;
  }

  .stat strong {
    font-size: 26px;
    font-weight: 800;
    color: var(--ac-color-text-strong);
  }

  .stat span {
    font-size: 13px;
    color: var(--ac-color-text-muted);
  }

  a.stat:hover {
    border-color: var(--ac-color-action);
  }
`;
