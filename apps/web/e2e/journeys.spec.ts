import { expect, test, type Page } from '@playwright/test';

/**
 * The three journeys the product exists for, driven end to end through the UI.
 *
 * The other specs cover accessibility and dialog behaviour; the integration suite
 * covers the API. Nothing covered a whole path through the stack — whether a
 * parent can actually register, add a child, complete a screening and reach a
 * result — so a break anywhere along one of these would have shipped silently.
 *
 * These run against a seeded database. Journeys 1 and 2 register their own
 * accounts so they do not depend on, or disturb, seeded state; journey 3 uses the
 * seeded school and its already-enrolled child, because arranging an enrollment
 * through the UI is a different journey and would make this test about that.
 */

const SEEDED = {
  parent: { email: 'demo.parent@auticare.local', password: 'AutiCareDemoPassword123' },
  hospital: { email: 'hospital@auticare.local', password: 'AutiCareHospitalPassword123' },
  school: { email: 'school@auticare.local', password: 'AutiCareSchoolPassword123' },
} as const;

const PASSWORD = 'AutiCareJourneyPass123';

/** Unique per test run so a re-run never collides with its own leftovers. */
const stamp = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

async function login(page: Page, account: { email: string; password: string }) {
  await page.goto('/login');
  await page.getByRole('textbox', { name: /email address/i }).fill(account.email);
  await page.locator('input[autocomplete="current-password"]').fill(account.password);
  await page.getByRole('button', { name: /log in/i }).click();
  await expect(page).not.toHaveURL(/\/login$/);
}

async function register(page: Page, name: string, email: string) {
  await page.goto('/register');
  await page.getByRole('textbox', { name: /full name/i }).fill(name);
  await page.getByRole('textbox', { name: /email address/i }).fill(email);
  await page.locator('input[autocomplete="new-password"]').first().fill(PASSWORD);
  await page.locator('input[autocomplete="new-password"]').last().fill(PASSWORD);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: /create account/i }).click();
  await expect(page).not.toHaveURL(/\/register$/);
}

async function addChild(page: Page, firstName: string, dateOfBirth: string) {
  await page.goto('/children/new');
  await page.getByRole('textbox', { name: /first name/i }).fill(firstName);
  await page.getByRole('textbox', { name: /date of birth/i }).fill(dateOfBirth);
  await page.getByRole('button', { name: /create child profile/i }).click();
  await expect(page).not.toHaveURL(/\/children\/new$/);
}

test.describe('journey: register, add a child, complete a screening, read the result', () => {
  // 24 questions clicked one at a time, plus registration.
  test.setTimeout(120_000);

  test('a new family reaches a scored result', async ({ page }) => {
    const id = stamp();
    const childName = `Journey${id.slice(-5)}`;

    await register(page, 'Journey Parent', `journey-screen-${id}@auticare.test`);
    await addChild(page, childName, '2021-04-15');

    await page.goto('/screening');
    // A family with one child should not have to click their only child before
    // they can begin, and the page auto-selects the first — asserted here because
    // it is a real decision the page makes, and the start button is gated on it.
    await expect(page.getByRole('button', { name: new RegExp(childName, 'i') })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    const start = page.getByRole('button', { name: /start new screening/i });
    await expect(start).toBeEnabled();
    await start.click();

    await expect(page).toHaveURL(/\/screening\/session\//);

    const progress = page.getByText(/Question \d+ of \d+/);
    await expect(progress).toBeVisible();
    const total = Number(((await progress.textContent()) ?? '').match(/of (\d+)/)?.[1] ?? '0');
    expect(total).toBeGreaterThan(0);

    for (let question = 1; question <= total; question += 1) {
      await expect(page.getByText(`Question ${question} of ${total}`)).toBeVisible();
      // "Sometimes" rather than an extreme, so the result is a real mixed score
      // rather than the all-0 or all-4 edge the unit tests already cover.
      await page.getByRole('radio', { name: 'Sometimes' }).click();
      const advance = question === total ? /finish/i : /next/i;
      await page.getByRole('button', { name: advance }).click();
    }

    await expect(page).toHaveURL(/\/screening\/result\//, { timeout: 30_000 });
    await expect(page.getByText(childName)).toBeVisible();
    // A result page that renders without a score is the failure worth catching:
    // the request succeeded and the user still learned nothing.
    await expect(page.locator('.score')).toContainText(/\d/);
    await expect(page.locator('.score-caption')).toContainText(/overall indicator/i);
  });
});

test.describe('journey: a parent books, the hospital rejects with a reason, the parent reads it', () => {
  test.setTimeout(120_000);

  test('the rejection reason reaches the parent who asked', async ({ browser }) => {
    const id = stamp();
    const childName = `Booker${id.slice(-5)}`;
    const reason = `Specialist unavailable ${id}`;

    const parentContext = await browser.newContext();
    const parentPage = await parentContext.newPage();
    const hospitalContext = await browser.newContext();
    const hospitalPage = await hospitalContext.newPage();

    try {
      await register(parentPage, 'Booking Parent', `journey-book-${id}@auticare.test`);
      await addChild(parentPage, childName, '2020-06-10');

      await parentPage.goto('/appointments/new');
      await parentPage.locator('.hospital-card').first().click();
      await parentPage
        .getByRole('button', { name: /request appointment/i })
        .first()
        .click();

      const booking = parentPage.getByRole('dialog');
      await expect(booking).toBeVisible();
      await booking
        .getByRole('radiogroup', { name: /who is this visit for/i })
        .getByRole('radio')
        .first()
        .click();
      // Deliberately not the first enabled date. The calendar enables today, and
      // its slot list still offers times that have already passed — picking
      // today + 09:00 in the afternoon is rejected by the API with "Appointments
      // must be scheduled in the future", which the dialog only reports after
      // submission. That is a real flaw in the picker, filed separately; this
      // journey is about the rejection-reason path, so it books a day ahead.
      const dates = booking
        .getByRole('radiogroup', { name: /choose a date/i })
        .locator('button[role="radio"]:not([disabled])');
      await dates.nth((await dates.count()) > 1 ? 1 : 0).click();
      const slots = booking.getByRole('radiogroup', { name: /available slots/i });
      await expect(slots).toBeVisible();
      await slots.getByRole('radio').first().click();
      await booking.getByRole('button', { name: /confirm booking/i }).click();

      // The booking dialog is replaced by a confirmation one rather than closing,
      // so waiting for "no dialog" would hang. Assert the confirmation instead —
      // it is also the only on-screen proof the request was actually accepted.
      await expect(
        parentPage.getByRole('heading', { name: /hospital appointment requested/i }),
      ).toBeVisible();

      await parentPage.goto('/appointments');
      await expect(parentPage.getByText(childName).first()).toBeVisible();

      // ── the hospital side ──
      await login(hospitalPage, SEEDED.hospital);
      await hospitalPage.goto('/hospital/appointments');
      const row = hospitalPage.locator('tr', { hasText: childName });
      await expect(row).toBeVisible();

      await row.getByRole('button', { name: 'Reject', exact: true }).click();
      const rejectDialog = hospitalPage.getByRole('alertdialog');
      await expect(rejectDialog).toBeVisible();
      await rejectDialog.getByLabel(/note to patient/i).fill(reason);
      await rejectDialog.getByRole('button', { name: /confirm rejection/i }).click();
      await expect(rejectDialog).toBeHidden();

      // ── back to the parent ──
      // This is the assertion the whole journey exists for. The reason was once
      // dropped silently: the schema parsed the request and stripped the unknown
      // key, so the hospital typed an explanation and the parent saw none.
      await parentPage.goto('/appointments');
      const appointment = parentPage.locator('li', { hasText: childName });
      await expect(appointment).toContainText(/cancelled|rejected/i);
      await expect(appointment).toContainText('Reason given:');
      await expect(appointment).toContainText(reason);
    } finally {
      await parentContext.close();
      await hospitalContext.close();
    }
  });
});

test.describe('journey: a school writes a report, the parent reads it', () => {
  test.setTimeout(120_000);

  test('a submitted report reaches the enrolled child’s parent', async ({ browser }) => {
    const id = stamp();
    const title = `Sensory play ${id}`;
    const observation = `Observation written by the e2e journey ${id}.`;

    const schoolContext = await browser.newContext();
    const schoolPage = await schoolContext.newPage();
    const parentContext = await browser.newContext();
    const parentPage = await parentContext.newPage();

    try {
      await login(schoolPage, SEEDED.school);
      await schoolPage.goto('/schools/reports/new');

      // Every required field, not just the interesting ones — the form refuses to
      // submit otherwise and says so only by not navigating. Duration and the six
      // metric sliders carry defaults and are left alone.
      const studentPicker = schoolPage.getByRole('combobox', { name: /select student/i });
      await studentPicker.selectOption({ index: 1 });
      // Whichever student that is, the parent side has to look at the same child.
      const studentName = (await studentPicker.locator('option:checked').textContent())
        ?.trim()
        .split(/\s+/)[0];
      expect(studentName).toBeTruthy();
      await schoolPage
        .getByRole('combobox', { name: /activity category/i })
        .selectOption({ index: 1 });
      await schoolPage.getByRole('textbox', { name: /activity name/i }).fill(title);
      await schoolPage.getByRole('textbox', { name: /teacher observations/i }).fill(observation);
      await schoolPage
        .getByRole('textbox', { name: /recommendations for parents/i })
        .fill('Repeat the activity at home twice this week.');
      await schoolPage.getByRole('button', { name: /submit report/i }).click();

      // The form navigates away on success; staying put means validation stopped it.
      await expect(schoolPage).not.toHaveURL(/\/schools\/reports\/new$/, { timeout: 20_000 });

      await login(parentPage, SEEDED.parent);
      await parentPage.goto('/progress');
      const childPicker = parentPage.getByRole('combobox', { name: /child/i });
      await childPicker.selectOption({
        // selectOption takes a literal label, not a pattern, so the option is
        // located by text first and selected by its value.
        value: await childPicker
          .locator('option', { hasText: studentName ?? '' })
          .first()
          .getAttribute('value'),
      });

      // The report list is a <select>, whose options are never "visible", so the
      // title is checked by selecting it rather than by looking for its text.
      // The report is picked explicitly rather than relying on it sorting first:
      // which report loads by default is a separate behaviour, and this journey
      // is about whether the parent can reach the one the school just wrote.
      const reportPicker = parentPage.locator('select.report-select');
      await expect(reportPicker).toBeVisible({ timeout: 20_000 });
      const mine = reportPicker.locator('option', { hasText: title });
      await expect(mine).toHaveCount(1);
      await reportPicker.selectOption({ value: await mine.getAttribute('value') });

      // What the parent actually reads.
      await expect(parentPage.locator('.observation-text').first()).toContainText(observation);
    } finally {
      await schoolContext.close();
      await parentContext.close();
    }
  });
});
