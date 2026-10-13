import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const BREAKPOINTS = [
  { name: 'Mobile (Portrait)', width: 375, height: 667 },
  { name: 'Tablet (Portrait / iPad)', width: 768, height: 1024 },
  { name: 'Laptop / Desktop', width: 1024, height: 768 },
  { name: 'Widescreen Monitor', width: 1440, height: 900 },
];

test.describe('Responsive Viewports & Accessibility at Breakpoints', () => {
  for (const bp of BREAKPOINTS) {
    test.describe(`${bp.name} (${bp.width}x${bp.height})`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: bp.width, height: bp.height });
      });

      test('landing page renders cleanly without horizontal overflow and passes axe', async ({
        page,
      }) => {
        await page.goto('/');

        await expect(
          page.getByRole('heading', { name: /support for every step of your child's journey/i }),
        ).toBeVisible();

        // Verify no horizontal overflow beyond the viewport width
        const hasHorizontalOverflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });
        expect(hasHorizontalOverflow).toBe(false);

        // Run WCAG accessibility audit at this breakpoint
        const axeResults = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
        expect(axeResults.violations).toEqual([]);
      });

      test('login page adapts layout and preserves interactive touch targets', async ({ page }) => {
        await page.goto('/login');

        await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();

        const submitButton = page.getByRole('button', { name: /log in/i });
        await expect(submitButton).toBeVisible();

        const box = await submitButton.boundingBox();
        expect(box).not.toBeNull();
        if (box) {
          // Touch target height >= 44px
          expect(box.height).toBeGreaterThanOrEqual(44);
        }

        const hasHorizontalOverflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });
        expect(hasHorizontalOverflow).toBe(false);
      });

      test('terms and privacy pages adapt responsively with clean typography', async ({ page }) => {
        await page.goto('/terms');
        await expect(
          page.getByRole('heading', { level: 1, name: 'Terms of Service' }),
        ).toBeVisible();

        const hasHorizontalOverflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });
        expect(hasHorizontalOverflow).toBe(false);

        await page.goto('/privacy');
        await expect(page.getByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeVisible();
      });

      test('registration page adapts layout and preserves interactive touch targets', async ({
        page,
      }) => {
        await page.goto('/register');
        await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();

        const submitButton = page.getByRole('button', { name: /create account/i });
        await expect(submitButton).toBeVisible();

        const box = await submitButton.boundingBox();
        expect(box).not.toBeNull();
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(44);
        }

        const hasHorizontalOverflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });
        expect(hasHorizontalOverflow).toBe(false);
      });

      test('Cambodian crisis resources page renders emergency banners with compliant touch targets and no overflow', async ({
        page,
      }) => {
        await page.goto('/crisis-resources');

        // Verify Cambodian emergency alerts presence
        await expect(
          page.getByRole('heading', {
            name: /Cambodian National Crisis & Autism Emergency Center/i,
          }),
        ).toBeVisible();

        // Verify emergency hotline numbers
        await expect(page.getByText('119')).toBeVisible();
        await expect(page.getByText('1280')).toBeVisible();

        // Check emergency call action button touch target height (>= 44px)
        const call119Btn = page.getByRole('link', { name: /call 119/i }).first();
        if (await call119Btn.isVisible()) {
          const box = await call119Btn.boundingBox();
          expect(box).not.toBeNull();
          if (box) {
            expect(box.height).toBeGreaterThanOrEqual(44);
          }
        }

        // Verify no horizontal overflow at this breakpoint
        const hasHorizontalOverflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });
        expect(hasHorizontalOverflow).toBe(false);
      });
    });
  }
});
