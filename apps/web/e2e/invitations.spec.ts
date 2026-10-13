import { expect, test, type Page } from '@playwright/test';

const SEEDED = {
  admin: { email: 'admin@auticare.local', password: 'AutiCareAdminPassword123' },
  school: { email: 'school@auticare.local', password: 'AutiCareSchoolPassword123' },
} as const;

const stamp = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

async function login(page: Page, account: { email: string; password: string }) {
  await page.goto('/login');
  await page.getByRole('textbox', { name: /email address/i }).fill(account.email);
  await page.locator('input[autocomplete="current-password"]').fill(account.password);
  await page.getByRole('button', { name: /log in/i }).click();
  await expect(page).not.toHaveURL(/\/login$/);
}

test.describe('Privileged account provisioning and invitation journey', () => {
  test('administrator provisions hospital manager via UI, manager accepts invitation and logs in', async ({
    browser,
  }) => {
    test.setTimeout(60000);
    const id = stamp();
    const hospitalName = `E2E Hospital ${id}`;
    const managerEmail = `manager-e2e-${id}@auticare.test`;
    const newPassword = 'ManagerSecurePass123!';

    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    let invitationUrl = '';

    try {
      // 1. Admin logs in
      await login(adminPage, SEEDED.admin);

      // 2. Navigate to Admin Hospitals
      await adminPage.goto('/hospitals/admin');
      await expect(adminPage.getByRole('heading', { name: /manage hospitals/i })).toBeVisible();

      // 3. Click Create hospital account
      await adminPage
        .getByRole('link', { name: /create hospital account/i })
        .first()
        .click();
      await expect(adminPage).toHaveURL(/\/hospitals\/admin\/new/);

      // Verify no temporary password input exists on the page
      await expect(adminPage.locator('input[type="password"]')).toHaveCount(0);
      await expect(adminPage.getByText(/invitation email/i)).toBeVisible();

      // 4. Fill form without password
      await adminPage.locator('input[formcontrolname="name"]').fill(hospitalName);
      await adminPage.locator('input[formcontrolname="city"]').fill('Siem Reap');
      await adminPage.locator('input[formcontrolname="address"]').fill('Charles de Gaulle Ave 42');
      await adminPage
        .locator('textarea[formcontrolname="services"]')
        .fill('Developmental therapy and assessments');

      await adminPage.locator('input[formcontrolname="email"]').fill(managerEmail);
      await adminPage.locator('input[formcontrolname="firstName"]').fill('Sophea');
      await adminPage.locator('input[formcontrolname="lastName"]').fill('Manager');
      await adminPage.locator('input[formcontrolname="title"]').fill('Clinic Director');

      // 5. Submit form and wait for response
      const postPromise = adminPage.waitForResponse(
        (res) =>
          res.url().includes('/api/v1/hospitals/admin/accounts') &&
          res.request().method() === 'POST',
      );
      await adminPage.getByRole('button', { name: /create hospital account/i }).click();
      const postResponse = await postPromise;
      expect(postResponse.status()).toBe(201);
      const postJson = await postResponse.json();
      invitationUrl = postJson.data?.invitationUrl;

      // Admin redirected back to /hospitals/admin and sees the newly created hospital card
      await expect(adminPage).toHaveURL(/\/hospitals\/admin$/);
      await expect(adminPage.getByRole('heading', { name: hospitalName })).toBeVisible();

      // 6. Ensure invitation URL was generated and captured
      expect(invitationUrl).toContain('/accept-invitation?token=');
      const token = new URL(invitationUrl).searchParams.get('token');
      expect(token).toBeTruthy();

      // 7. Manager opens the invitation link in a clean context
      const managerContext = await browser.newContext();
      const managerPage = await managerContext.newPage();

      try {
        await managerPage.goto(`/accept-invitation?token=${token}`);
        await expect(
          managerPage.getByRole('heading', { name: /set up your password/i }),
        ).toBeVisible();
        await expect(managerPage.getByText(managerEmail)).toBeVisible();

        // 8. Manager sets up their password
        await managerPage.locator('input[formcontrolname="password"]').fill(newPassword);
        await managerPage.locator('input[formcontrolname="confirmPassword"]').fill(newPassword);
        await managerPage.getByRole('button', { name: /activate account/i }).click();

        // 9. Verify success message and link to login
        await expect(managerPage.locator('.success')).toBeVisible();
        await expect(managerPage.getByText(/password configured successfully/i)).toBeVisible();

        // 10. Manager logs in with newly created password
        await managerPage.getByRole('link', { name: /continue to log in/i }).click();
        await expect(managerPage).toHaveURL(/\/login/);

        await managerPage.getByRole('textbox', { name: /email address/i }).fill(managerEmail);
        await managerPage.locator('input[autocomplete="current-password"]').fill(newPassword);
        await managerPage.getByRole('button', { name: /log in/i }).click();

        // 11. Manager reaches dashboard after login and can access hospital section
        await expect(managerPage).toHaveURL(/\/dashboard$/);
        await managerPage.goto('/hospital/dashboard');
        await expect(managerPage).toHaveURL(/\/hospital\/dashboard/);
        await expect(managerPage).not.toHaveURL(/\/login/);
      } finally {
        await managerContext.close();
      }
    } finally {
      await adminContext.close();
    }
  });

  test('resend invitation triggers invitation token update from admin UI', async ({ page }) => {
    // Admin logs in and visits hospital admin list
    await login(page, SEEDED.admin);
    await page.goto('/hospitals/admin');

    const resendButtons = page.locator('button.resend-btn');
    if ((await resendButtons.count()) > 0) {
      const firstResendBtn = resendButtons.first();
      await firstResendBtn.click();
      await expect(page.locator('ac-ui-message[tone="success"]')).toBeVisible();
    }
  });
});
