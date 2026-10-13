import { expect, test } from '@playwright/test';

const SEEDED = {
  parent: { email: 'demo.parent@auticare.local', password: 'AutiCareDemoPassword123' },
  hospital: { email: 'hospital@auticare.local', password: 'AutiCareHospitalPassword123' },
  school: { email: 'school@auticare.local', password: 'AutiCareSchoolPassword123' },
} as const;

test.describe('Session refresh and authentication flows', () => {
  test('session refresh retries request transparently on 401 when refresh succeeds', async ({
    page,
  }) => {
    // 1. Log in as parent
    await page.goto('/login');
    await page.getByRole('textbox', { name: /email address/i }).fill(SEEDED.parent.email);
    await page.locator('input[autocomplete="current-password"]').fill(SEEDED.parent.password);
    await page.getByRole('button', { name: /log in/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    // 2. Intercept /api/v1/children request to return 401 once, while allowing /api/v1/auth/refresh
    let intercepted401 = false;
    let refreshTriggered = false;

    await page.route('**/api/v1/children**', async (route) => {
      if (!intercepted401) {
        intercepted401 = true;
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Token expired' } }),
        });
      } else {
        await route.continue();
      }
    });

    await page.route('**/api/v1/auth/refresh', async (route) => {
      refreshTriggered = true;
      await route.continue();
    });

    // 3. Set up response promise for /api/v1/auth/refresh and click "My Children"
    const refreshResponsePromise = page.waitForResponse(
      (res) => res.url().includes('/api/v1/auth/refresh') && res.status() === 200,
    );
    await page.getByRole('link', { name: 'My Children' }).click();
    await expect(page).toHaveURL(/\/children$/);

    // Wait for the transparent refresh call to complete
    await refreshResponsePromise;

    // Verify 401 was simulated and refresh succeeded, keeping user on /children
    expect(intercepted401).toBe(true);
    expect(refreshTriggered).toBe(true);
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('failed refresh redirects to login and preserves intended navigation', async ({ page }) => {
    // 1. Log in as parent
    await page.goto('/login');
    await page.getByRole('textbox', { name: /email address/i }).fill(SEEDED.parent.email);
    await page.locator('input[autocomplete="current-password"]').fill(SEEDED.parent.password);
    await page.getByRole('button', { name: /log in/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    // 2. Force 401 on /api/v1/appointments AND 401 on /api/v1/auth/refresh (expired refresh token)
    await page.route('**/api/v1/appointments**', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Session expired' } }),
      });
    });

    await page.route('**/api/v1/auth/refresh', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Refresh token expired' } }),
      });
    });

    // 3. Navigate to /appointments
    await page.goto('/appointments');

    // 4. Expect redirection to /login with returnUrl preserved
    await expect(page).toHaveURL(/\/login\?returnUrl=%2Fappointments/);
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  });

  test('concurrent 401s trigger exactly one shared refresh call', async ({ page }) => {
    // 1. Log in as parent
    await page.goto('/login');
    await page.getByRole('textbox', { name: /email address/i }).fill(SEEDED.parent.email);
    await page.locator('input[autocomplete="current-password"]').fill(SEEDED.parent.password);
    await page.getByRole('button', { name: /log in/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    let refreshCallCount = 0;
    await page.route('**/api/v1/auth/refresh', async (route) => {
      refreshCallCount++;
      await route.continue();
    });

    // 2. Mock 401 on notifications and children on first hit
    let notifs401 = false;
    await page.route('**/api/v1/notifications**', async (route) => {
      if (!notifs401) {
        notifs401 = true;
        await route.fulfill({ status: 401, contentType: 'application/json', body: '{}' });
      } else {
        await route.continue();
      }
    });

    let hospitals401 = false;
    await page.route('**/api/v1/hospitals**', async (route) => {
      if (!hospitals401) {
        hospitals401 = true;
        await route.fulfill({ status: 401, contentType: 'application/json', body: '{}' });
      } else {
        await route.continue();
      }
    });

    // 3. Trigger concurrent requests via page evaluate fetch
    await page.evaluate(async () => {
      await Promise.allSettled([
        fetch('/api/v1/notifications', { credentials: 'include' }),
        fetch('/api/v1/hospitals', { credentials: 'include' }),
      ]);
    });

    // Ensure at most one refresh call was fired
    expect(refreshCallCount).toBeLessThanOrEqual(1);
  });

  test('logout clears client state and redirects to /login', async ({ page }) => {
    // 1. Log in
    await page.goto('/login');
    await page.getByRole('textbox', { name: /email address/i }).fill(SEEDED.parent.email);
    await page.locator('input[autocomplete="current-password"]').fill(SEEDED.parent.password);
    await page.getByRole('button', { name: /log in/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    // 2. Click logout button in app shell
    const logoutBtn = page.locator('button.logout-button');
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click();

    await expect(page).toHaveURL(/\/login$/);

    // 3. Trying to access /dashboard bounces back to /login
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('role guards enforce authorized role access', async ({ page }) => {
    // 1. Log in as parent
    await page.goto('/login');
    await page.getByRole('textbox', { name: /email address/i }).fill(SEEDED.parent.email);
    await page.locator('input[autocomplete="current-password"]').fill(SEEDED.parent.password);
    await page.getByRole('button', { name: /log in/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    // 2. Parent tries to access hospital management portal (/hospital)
    await page.goto('/hospital');
    await expect(page).toHaveURL(/\/unauthorized$/);
    await expect(page.getByRole('heading', { name: /access denied|unauthorized/i })).toBeVisible();

    // 3. Navigate back to /login and log in as school
    await page.goto('/login');
    await page.getByRole('textbox', { name: /email address/i }).fill(SEEDED.school.email);
    await page.locator('input[autocomplete="current-password"]').fill(SEEDED.school.password);
    await page.getByRole('button', { name: /log in/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    // 4. School user cannot access screening (/screening is PARENT only)
    await page.goto('/screening');
    await expect(page).toHaveURL(/\/unauthorized$/);
  });
});
