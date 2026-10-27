/**
 * Prints a small slip a school can hand to someone in person: a teacher's
 * username and setup code, or a family's connection code. The slip opens in
 * its own window so none of the app's chrome is printed.
 */
export type PrintSlip = {
  heading: string;
  lines: readonly { label: string; value: string; large?: boolean }[];
  steps?: readonly string[];
  footer?: string;
};

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

// The slip window has no app stylesheet, so it copies the brand tokens it needs.
const SLIP_TOKENS = [
  '--ac-brand-300',
  '--ac-brand-900',
  '--ac-color-text-muted',
  '--ac-color-white',
] as const;

const slipTokenCss = (): string => {
  const styles = getComputedStyle(document.documentElement);
  return SLIP_TOKENS.map((name) => `${name}: ${styles.getPropertyValue(name).trim()};`).join(' ');
};

export const printSlip = (slip: PrintSlip): void => {
  const win = window.open('', '_blank', 'width=520,height=640');
  if (!win) return;

  const lines = slip.lines
    .map(
      (line) =>
        `<div class="row"><span>${escapeHtml(line.label)}</span><strong class="${
          line.large ? 'large' : ''
        }">${escapeHtml(line.value)}</strong></div>`,
    )
    .join('');
  const steps = slip.steps?.length
    ? `<ol>${slip.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ol>`
    : '';
  const footer = slip.footer ? `<p class="foot">${escapeHtml(slip.footer)}</p>` : '';

  win.document.write(`<!doctype html><html><head><meta charset="utf-8" />
<title>${escapeHtml(slip.heading)}</title>
<style>
  :root { ${slipTokenCss()} }
  body { font-family: system-ui, sans-serif; margin: 32px; color: var(--ac-brand-900); background: var(--ac-color-white); }
  .slip { border: 2px dashed var(--ac-brand-300); border-radius: 16px; padding: 24px; }
  h1 { font-size: 20px; margin: 0 0 18px; }
  .row { display: grid; gap: 4px; margin-bottom: 14px; }
  .row span { font-size: 12px; text-transform: uppercase; letter-spacing: .08em; color: var(--ac-color-text-muted); }
  .row strong { font-size: 18px; font-family: ui-monospace, Menlo, monospace; }
  .row strong.large { font-size: 32px; letter-spacing: .14em; }
  ol { padding-left: 20px; line-height: 1.6; }
  .foot { font-size: 12px; color: var(--ac-color-text-muted); margin-top: 18px; }
</style></head>
<body><div class="slip"><h1>AutiCare · ${escapeHtml(slip.heading)}</h1>${lines}${steps}${footer}</div>
<script>window.onload = () => { window.print(); };</script></body></html>`);
  win.document.close();
};
