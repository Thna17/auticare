import { expect, test } from '@playwright/test';
test('registration and login shell render', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  await page.goto('/register');
  await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
});
test('protected route redirects to login', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/login/);
});
test('keyboard navigation reaches focusable content', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: /support for every step of your child's journey/i }),
  ).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toBeVisible();
});
