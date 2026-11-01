import { expect, test } from '@playwright/test';

test('read an original Math HL specimen and switch to its matching mark scheme', async ({
  page,
}) => {
  await page.route('https://www.ibo.org/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/pdf', body: '%PDF-1.4\n%%EOF' }),
  );
  await page.goto('/');
  await page.getByLabel('YOUR SUBJECT', { exact: true }).selectOption('math');
  await page.getByRole('navigation').getByRole('button', { name: 'Source library' }).click();
  await expect(page.locator('.verified-paper-card')).toHaveCount(3);
  const first = page.locator('.verified-paper-card').first();
  await first.getByRole('button', { name: 'Question paper', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.locator('iframe')).toHaveAttribute('src', /#page=3&view=FitH$/);
  await expect(dialog.locator('.official-paper-meta')).toContainText('pages 3–18 of 121');
  await dialog.getByRole('tab', { name: 'Mark scheme' }).click();
  await expect(dialog.locator('iframe')).toHaveAttribute('src', /#page=19&view=FitH$/);
  await expect(dialog.locator('.official-paper-meta')).toContainText('pages 19–34 of 121');
  await dialog.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByLabel('YOUR SUBJECT', { exact: true }).selectOption('physics');
  await expect(page.locator('.verified-paper-card')).toHaveCount(6);
});

test('all uploaded paper pairs load the matching local PDF and separate mark scheme', async ({
  page,
  request,
}) => {
  await page.goto('/');
  await page.getByRole('navigation').getByRole('button', { name: 'Source library' }).click();
  await expect(page.locator('.specimen-notice')).toContainText('Six real May 2025 Physics HL');
  const names = [
    'tz1/paper-1a',
    'tz1/paper-1b',
    'tz1/paper-2',
    'tz2/paper-1a',
    'tz2/paper-1b',
    'tz2/paper-2',
  ];
  for (const [i, name] of names.entries()) {
    await page
      .locator('.verified-paper-card')
      .nth(i)
      .getByRole('button', { name: 'Question paper', exact: true })
      .click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.locator('iframe')).toHaveAttribute(
      'src',
      new RegExp(`${name}\\.pdf#page=2&view=FitH$`),
    );
    const response = await request.get(`/papers/physics/2025-may/${name}.pdf`);
    expect(response.ok()).toBe(true);
    expect((await response.body()).subarray(0, 5).toString()).toBe('%PDF-');
    await dialog.getByRole('tab', { name: 'Mark scheme' }).click();
    await expect(dialog.locator('iframe')).toHaveAttribute(
      'src',
      new RegExp(`${name}-markscheme\\.pdf#page=1&view=FitH$`),
    );
    const ms = await request.get(`/papers/physics/2025-may/${name}-markscheme.pdf`);
    expect(ms.ok()).toBe(true);
    expect((await ms.body()).subarray(0, 5).toString()).toBe('%PDF-');
    await dialog.getByRole('button', { name: 'Close dialog' }).click();
  }
});

test('uploaded paper previews and original question images fit a mobile screen', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('.question-original img').first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByRole('navigation').getByRole('button', { name: 'Source library' }).click();
  await page
    .locator('.verified-paper-card')
    .last()
    .getByRole('button', { name: 'Mark scheme', exact: true })
    .click();
  await expect(page.getByRole('dialog').locator('iframe')).toHaveAttribute(
    'src',
    /tz2\/paper-2-markscheme\.pdf#page=1&view=FitH$/,
  );
  expect(
    await page.getByRole('dialog').evaluate((e) => {
      const r = e.getBoundingClientRect();
      return r.left >= 0 && r.right <= innerWidth;
    }),
  ).toBe(true);
});
