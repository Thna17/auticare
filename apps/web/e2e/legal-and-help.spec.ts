import { expect, test } from '@playwright/test';

test.describe('Legal, Privacy, and Help Center Truthfulness', () => {
  const currentYear = new Date().getFullYear().toString();

  test('privacy policy route renders truthfully with dynamic year and no HIPAA claims', async ({
    page,
  }) => {
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeVisible();
    await expect(page.locator('.effective-date')).toContainText(currentYear);
    await expect(page.locator('.legal-footer')).toContainText(currentYear);

    // Verify truthfulness regarding HIPAA
    const content = await page.textContent('main');
    expect(content).toContain(
      'does not claim compliance with the Health Insurance Portability and Accountability Act (HIPAA)',
    );
    expect(content).toContain('first name, date of birth, and free-form support notes');
    expect(content).not.toContain('HIPAA-compliant support');
  });

  test('terms of service route renders truthfully with dynamic year and medical disclaimer', async ({
    page,
  }) => {
    await page.goto('/terms');
    await expect(page.getByRole('heading', { level: 1, name: 'Terms of Service' })).toBeVisible();
    await expect(page.locator('.effective-date')).toContainText(currentYear);
    await expect(page.locator('.legal-footer')).toContainText(currentYear);

    // Verify medical disclaimer and request workflow
    const content = await page.textContent('main');
    expect(content).toContain(
      'AutiCare is not a medical provider and does not give medical advice',
    );
    expect(content).toContain(
      'original heuristic indicators provided for educational and organizational purposes only',
    );
    expect(content).toContain('They do not constitute clinical diagnoses');
    expect(content).toContain(
      'does not guarantee immediate acceptance, admission, or scheduled confirmation',
    );
  });

  test('registration page links to /terms and /privacy correctly', async ({ page }) => {
    await page.goto('/register');
    const termsLink = page.getByRole('link', { name: 'Terms of Service' });
    const privacyLink = page.getByRole('link', { name: 'Privacy Policy' });

    await expect(termsLink).toBeVisible();
    await expect(termsLink).toHaveAttribute('href', '/terms');

    await expect(privacyLink).toBeVisible();
    await expect(privacyLink).toHaveAttribute('href', '/privacy');

    // Click privacy link to verify navigation
    await privacyLink.click();
    await expect(page).toHaveURL(/\/privacy$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeVisible();
  });

  test('login page has truthful privacy statement and dynamic copyright year', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { level: 1, name: 'Welcome back' })).toBeVisible();

    await expect(page.getByText('Secure, private family support.')).toBeVisible();
    await expect(page.getByText('Secure, HIPAA-compliant support.')).not.toBeVisible();
    await expect(page.locator('.login-footer')).toContainText(`(c) ${currentYear} AutiCare`);
  });

  test('help center page provides accurate answers and mailto support link', async ({ page }) => {
    // Help Center is reachable under /support
    // Login as demo parent first to navigate to /support if protected, or navigate directly
    await page.goto('/login');
    await page.getByRole('textbox', { name: /email address/i }).fill('demo.parent@auticare.local');
    await page.locator('input[autocomplete="current-password"]').fill('AutiCareDemoPassword123');
    await page.getByRole('button', { name: /log in/i }).click();
    await expect(page).not.toHaveURL(/\/login$/);

    await page.goto('/support');
    await expect(page.getByRole('heading', { level: 1, name: 'Help Center' })).toBeVisible();

    const contactBtn = page.locator('.contact-btn');
    await expect(contactBtn).toBeVisible();
    await expect(contactBtn).toHaveAttribute('href', 'mailto:support@auticare.local');
  });
});
