import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';

const PUBLIC_FORMS = [
  { path: '/login', name: 'Sign in' },
  { path: '/register', name: 'Create account' },
  { path: '/forgot-password', name: 'Forgot password' },
  { path: '/reset-password', name: 'Reset password' },
] as const;

const ACCOUNTS = {
  parent: {
    email: 'demo.parent@auticare.local',
    password: 'AutiCareDemoPassword123',
  },
  school: {
    email: 'school@auticare.local',
    password: 'AutiCareSchoolPassword123',
  },
} as const;

async function login(page: Page, account: (typeof ACCOUNTS)[keyof typeof ACCOUNTS]) {
  await page.goto('/login');
  await page.getByRole('textbox', { name: /email address/i }).fill(account.email);
  await page.locator('input[autocomplete="current-password"]').fill(account.password);
  await page.getByRole('button', { name: /log in/i }).click();
  await expect(page).not.toHaveURL(/\/login$/);
}

async function expectEveryControlNamed(scope: Page | Locator) {
  const controls = scope.locator('input, select, textarea');
  await controls.first().waitFor({ state: 'attached' });
  const count = await controls.count();
  expect(count, 'page should have form controls').toBeGreaterThan(0);

  for (let index = 0; index < count; index += 1) {
    await expect(
      controls.nth(index),
      `control ${index + 1} should have an accessible name`,
    ).toHaveAccessibleName(/\S/);
  }
}

async function expectNoBlockingAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page })
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

test.describe('public forms', () => {
  for (const form of PUBLIC_FORMS) {
    test(`${form.name}: controls are named and the flow passes axe`, async ({ page }) => {
      await page.goto(form.path);
      await expectEveryControlNamed(page.locator('form'));
      await expectNoBlockingAxeViolations(page);
    });
  }

  test('failed login announces errors, exposes state, and focuses the first field', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /log in/i }).click();

    const email = page.getByRole('textbox', { name: /email address/i });
    await expect(email).toBeFocused();
    await expect(email).toHaveAttribute('required', '');
    await expect(email).toHaveAttribute('aria-invalid', 'true');
    const describedBy = await email.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    await expect(page.locator(`#${describedBy}`)).toHaveText(/valid email/i);
    await expect(page.getByRole('alert').filter({ hasText: /valid email/i })).toBeVisible();
    await expect(
      page.getByRole('alert').filter({ hasText: /fix the highlighted fields/i }),
    ).toBeVisible();
  });
});

test('parent forms and screening are accessible', async ({ page }) => {
  await login(page, ACCOUNTS.parent);

  await page.goto('/children/new');
  await expectEveryControlNamed(page.locator('form'));
  await page.getByRole('button', { name: /create child profile/i }).click();
  await expect(page.getByRole('textbox', { name: /first name/i })).toBeFocused();
  await expect(
    page.getByRole('alert').filter({ hasText: /fix the highlighted fields/i }),
  ).toBeVisible();
  await expectNoBlockingAxeViolations(page);

  await page.goto('/settings');
  await expectEveryControlNamed(page.locator('form'));
  await expectNoBlockingAxeViolations(page);

  await page.goto('/screening');
  const continueButton = page.getByRole('button', { name: 'Continue' });
  if (await continueButton.isVisible()) await continueButton.click();
  else await page.getByRole('button', { name: /start new screening/i }).click();
  await expect(page).toHaveURL(/\/screening\/session\//);
  const answers = page.getByRole('radiogroup');
  await expect(answers).toHaveAccessibleName(/\S/);
  await expect(answers).toHaveAttribute('aria-required', 'true');
  for (const radio of await page.getByRole('radio').all()) {
    await expect(radio).toHaveAccessibleName(/\S/);
  }
  await expectNoBlockingAxeViolations(page);

  await page.goto('/appointments/new');
  await page.locator('.hospital-card').first().click();
  await page
    .getByRole('button', { name: /request appointment/i })
    .first()
    .click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  await dialog.getByRole('button', { name: /confirm booking/i }).click();
  const patientGroup = dialog.getByRole('radiogroup', { name: /who is this visit for/i });
  await expect(patientGroup.getByRole('radio').first()).toBeFocused();
  await expect(dialog.getByRole('alert')).toContainText(/choose a child, date, and time/i);

  await patientGroup.getByRole('radio').first().click();
  const dateGroup = dialog.getByRole('radiogroup', { name: /choose a date/i });
  await dateGroup.locator('button[role="radio"]:not([disabled])').first().click();
  const timeGroup = dialog.getByRole('radiogroup', { name: /available slots/i });
  await expect(timeGroup).toBeVisible();
  await timeGroup.getByRole('radio').first().click();

  await expectEveryControlNamed(dialog);
  for (const group of await dialog.getByRole('radiogroup').all()) {
    await expect(group).toHaveAccessibleName(/\S/);
    await expect(group).toHaveAttribute('aria-required', 'true');
  }
  await expectNoBlockingAxeViolations(page);
});

test('school forms are named, announce validation, focus errors, and pass axe', async ({
  page,
}) => {
  await login(page, ACCOUNTS.school);

  await page.goto('/schools/students/add');
  await expectEveryControlNamed(page.locator('form'));
  await page.getByRole('button', { name: /add student/i }).click();
  await expect(page.getByRole('textbox', { name: /first name/i }).first()).toBeFocused();
  await expect(
    page.getByRole('alert').filter({ hasText: /fix the highlighted fields/i }),
  ).toBeVisible();
  await expectNoBlockingAxeViolations(page);

  await page.goto('/schools/profile');
  const editProfile = page.getByRole('button', { name: /edit profile/i });
  await expect(editProfile.or(page.locator('form'))).toBeVisible();
  if (await editProfile.isVisible()) await editProfile.click();
  await expectEveryControlNamed(page.locator('form'));
  await expectNoBlockingAxeViolations(page);

  await page.goto('/schools/reports/new');
  await expectEveryControlNamed(page.locator('form'));
  await page.getByRole('button', { name: /submit report/i }).click();
  await expect(page.getByRole('combobox', { name: /select student/i })).toBeFocused();
  await expect(
    page.getByRole('alert').filter({ hasText: /fill in all required fields/i }),
  ).toBeVisible();
  await expectNoBlockingAxeViolations(page);
});
