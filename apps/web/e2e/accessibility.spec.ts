import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Accessibility checks for the forms a parent actually has to get through.
 *
 * Two kinds of assertion, because they catch different things. The accessible-name
 * checks are specific: they fail with the name of the control that lost its label,
 * which is the regression most likely to be reintroduced by a copy-paste. The axe
 * scans are broad: they catch contrast, landmark and ARIA problems nobody thought
 * to assert.
 *
 * Both are scoped to pages reachable without signing in, so this suite needs no
 * fixtures or seeded account. The authenticated forms — settings, add child,
 * activity report — are covered by the ui-field component's own behaviour and are
 * worth adding here once the suite has a login fixture.
 */

const PUBLIC_PAGES = [
  { path: '/login', name: 'Sign in' },
  { path: '/register', name: 'Create account' },
  { path: '/forgot-password', name: 'Forgot password' },
];

test.describe('form controls have accessible names', () => {
  for (const page of PUBLIC_PAGES) {
    test(`${page.name}: every control is named`, async ({ page: p }) => {
      await p.goto(page.path);

      const controls = p.locator('input, select, textarea');
      // Angular renders the form after hydration, so count() can run against an
      // empty DOM and pass vacuously. Wait for the first control to exist first.
      await controls.first().waitFor({ state: 'attached' });

      const count = await controls.count();
      expect(count, 'page should have form controls').toBeGreaterThan(0);

      for (let i = 0; i < count; i += 1) {
        const control = controls.nth(i);
        // A placeholder is not a name: it disappears the moment someone types.
        const accessibleName = await control.evaluate((el) => {
          const labelled = el.getAttribute('aria-label');
          if (labelled) return labelled;
          const describedBy = el.getAttribute('aria-labelledby');
          if (describedBy) return document.getElementById(describedBy)?.textContent ?? '';
          const id = el.getAttribute('id');
          if (id) {
            const explicit = document.querySelector(`label[for="${id}"]`);
            if (explicit) return explicit.textContent ?? '';
          }
          return el.closest('label')?.textContent ?? '';
        });

        const descriptor = await control.evaluate(
          (el) => `${el.tagName.toLowerCase()}[${el.getAttribute('type') ?? 'text'}]`,
        );
        expect(
          accessibleName.trim(),
          `${descriptor} on ${page.path} has no accessible name`,
        ).not.toBe('');
      }
    });
  }
});

test.describe('axe scan', () => {
  for (const page of PUBLIC_PAGES) {
    test(`${page.name}: no serious or critical violations`, async ({ page: p }) => {
      await p.goto(page.path);

      const results = await new AxeBuilder({ page: p })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      // Serious and critical only. Minor and moderate findings are worth fixing but
      // would make this gate noisy enough to be ignored, which is worse than not
      // having it.
      const blocking = results.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical',
      );

      expect(
        blocking.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s)`),
        `axe violations on ${page.path}`,
      ).toEqual([]);
    });
  }
});

test('an invalid field reports itself, not just its message', async ({ page }) => {
  await page.goto('/login');

  // Submitting empty should mark the control invalid, not only colour the text.
  await page.getByRole('button', { name: /log in/i }).click();

  const email = page.locator('input[type="email"]');
  const describedBy = await email.getAttribute('aria-describedby');
  const invalid = await email.getAttribute('aria-invalid');

  // Either the browser's own validation blocks submission, or the app marks the
  // field — both are acceptable; silently doing neither is not.
  const blocked = await email.evaluate((el: HTMLInputElement) => !el.validity.valid);
  expect(blocked || invalid === 'true' || describedBy !== null).toBe(true);
});
