import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';

const ACCOUNTS = {
  parent: {
    email: 'demo.parent@auticare.local',
    password: 'AutiCareDemoPassword123',
  },
  hospital: {
    email: 'hospital@auticare.local',
    password: 'AutiCareHospitalPassword123',
  },
} as const;

async function login(page: Page, account: (typeof ACCOUNTS)[keyof typeof ACCOUNTS]) {
  await page.goto('/login');
  await page.getByRole('textbox', { name: /email address/i }).fill(account.email);
  await page.locator('input[autocomplete="current-password"]').fill(account.password);
  await page.getByRole('button', { name: /log in/i }).click();
  await expect(page).not.toHaveURL(/\/login$/);
}

async function expectNoBlockingAxeViolations(page: Page, dialog: Locator) {
  const selector = await dialog.getAttribute('role');
  const results = await new AxeBuilder({ page })
    .include(`[role="${selector}"]`)
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const blocking = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  );

  expect(
    blocking.map(
      (violation) =>
        `${violation.id} (${violation.impact}): ${violation.nodes
          .map((node) => node.target.join(' > '))
          .join(', ')}`,
    ),
  ).toEqual([]);
}

async function expectFocusInside(dialog: Locator) {
  await expect
    .poll(() => dialog.evaluate((element) => element.contains(document.activeElement)))
    .toBe(true);
}

async function openBookingDialog(page: Page) {
  await page.goto('/appointments/new');
  await page.locator('.hospital-card').first().click();
  const trigger = page.getByRole('button', { name: /request appointment/i }).first();
  await trigger.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  return { dialog, trigger };
}

test.describe('accessible dialog primitive', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ACCOUNTS.parent);
  });

  test('traps focus, closes with Escape, and restores focus to the trigger', async ({ page }) => {
    const { dialog, trigger } = await openBookingDialog(page);
    const closeButton = dialog.getByRole('button', { name: 'Close dialog' });

    await expect(closeButton).toBeFocused();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');

    await page.keyboard.press('Shift+Tab');
    await expectFocusInside(dialog);
    await expect(closeButton).not.toBeFocused();

    await page.keyboard.press('Tab');
    await expect(closeButton).toBeFocused();

    for (let index = 0; index < 20; index += 1) {
      await page.keyboard.press('Tab');
      await expectFocusInside(dialog);
    }

    await expectNoBlockingAxeViolations(page, dialog);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('backdrop click dismisses and restores focus', async ({ page }) => {
    const { dialog, trigger } = await openBookingDialog(page);

    await page.locator('.dialog-backdrop').click({ position: { x: 2, y: 2 } });
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});

test.describe('dialog variants', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ACCOUNTS.hospital);
    await page.goto('/hospital/appointments');
    await expect(page.getByRole('heading', { name: /appointment requests/i })).toBeVisible();
  });

  test('appointment detail drawer is named, modal, and axe-clean', async ({ page }) => {
    const trigger = page.getByRole('button', { name: 'View' }).first();
    await trigger.click();

    const drawer = page.getByRole('dialog');
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveAccessibleName(/\S/);
    await expect(drawer).toHaveAttribute('aria-modal', 'true');
    await expectFocusInside(drawer);
    await expectNoBlockingAxeViolations(page, drawer);

    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('reject confirmation uses an axe-clean alertdialog', async ({ page }) => {
    const trigger = page.getByRole('button', { name: 'Reject', exact: true }).first();
    await trigger.click();

    const alertDialog = page.getByRole('alertdialog');
    await expect(alertDialog).toBeVisible();
    await expect(alertDialog).toHaveAccessibleName('Reject appointment request');
    await expectFocusInside(alertDialog);
    await expectNoBlockingAxeViolations(page, alertDialog);

    await page.keyboard.press('Escape');
    await expect(alertDialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});
