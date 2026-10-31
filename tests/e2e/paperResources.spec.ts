import { expect, test } from '@playwright/test';

test('read an original HL question paper and switch to its matching mark scheme', async ({
  page,
}) => {
  // Keep this UI test deterministic; live URL and PDF contents were checked separately.
  await page.route('https://www.ibo.org/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/pdf', body: '%PDF-1.4\n%%EOF' }),
  );
  await page.goto('/');
  await page.getByRole('navigation').getByRole('button', { name: 'Source library' }).click();
  await expect(page.locator('.verified-paper-card')).toHaveCount(3);
  await expect(page.locator('.specimen-notice')).toContainText(
    'not papers from an actual examination session',
  );
  const first = page.locator('.verified-paper-card').first();
  await first.getByRole('button', { name: 'Question paper', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.locator('iframe')).toHaveAttribute('src', /#page=3&view=FitH$/);
  await expect(dialog.locator('.official-paper-meta')).toContainText('pages 3–18 of 121');
  await dialog.getByRole('tab', { name: 'Mark scheme' }).click();
  await expect(dialog.locator('iframe')).toHaveAttribute('src', /#page=19&view=FitH$/);
  await expect(dialog.locator('.official-paper-meta')).toContainText('pages 19–34 of 121');
  await expect(dialog.getByRole('link', { name: 'Open in a new tab' })).toHaveAttribute(
    'href',
    /#page=19&view=FitH$/,
  );
  await dialog.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByLabel('YOUR SUBJECT', { exact: true }).selectOption('physics');
  await expect(page.locator('.verified-paper-card')).toHaveCount(0);
  await expect(page.locator('.unverified-subject-notice')).toContainText(
    'No verified current-syllabus Physics papers',
  );
});

test('verified papers and their PDF preview fit a mobile screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('https://www.ibo.org/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/pdf', body: '%PDF-1.4\n%%EOF' }),
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Open paper sources' }).click();
  await page
    .locator('.verified-paper-card')
    .last()
    .getByRole('button', { name: 'Mark scheme', exact: true })
    .click();
  await expect(page.getByRole('dialog').locator('iframe')).toHaveAttribute(
    'src',
    /#page=68&view=FitH$/,
  );
  const fits = await page.getByRole('dialog').evaluate((e) => {
    const r = e.getBoundingClientRect();
    return r.left >= 0 && r.right <= innerWidth;
  });
  expect(fits).toBe(true);
});
