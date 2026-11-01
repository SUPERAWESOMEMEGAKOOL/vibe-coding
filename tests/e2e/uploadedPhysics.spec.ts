import { expect, test } from '@playwright/test';

test('topic, paper and time-zone dropdowns select real questions with their own answer keys', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'More', exact: false }).click();
  await page.getByLabel('Filter by paper').selectOption('Paper 1A');
  await page.getByLabel('Filter by time zone').selectOption('TZ1');
  await expect(page.locator('.results-toolbar')).toContainText('40 questions');
  const second = page.locator('.question-card').nth(1);
  await second.locator('.mcq-option').nth(1).click();
  await expect(second.locator('.answer-feedback')).toContainText('That’s right');
  await page.getByLabel('Filter by time zone').selectOption('TZ2');
  await second.locator('.mcq-option').nth(1).click();
  await expect(second.locator('.answer-feedback')).toContainText('Not quite');
  await second.getByRole('button', { name: 'Try again' }).click();
  await second.locator('.mcq-option').nth(2).click();
  await expect(second.locator('.answer-feedback')).toContainText('That’s right');
  await second.locator('summary').click();
  await expect(second.locator('.mark-scheme img')).toHaveAttribute(
    'src',
    /tz2\/markschemes\/1a-q02.webp$/,
  );
  await expect(second.locator('.answer-text')).toContainText('C — official answer');
  await expect(second.getByRole('link', { name: 'Open original question paper' })).toHaveAttribute(
    'href',
    /tz2\/paper-1a.pdf#page=3&view=FitH$/,
  );
  await page.getByLabel('Filter by topic').selectOption('pE');
  await page.getByLabel('Filter by subtopic').selectOption('E.2 Quantum physics');
  await expect(page.locator('.question-card')).toHaveCount(2);
  for (const image of await page.locator('.question-original img').all()) {
    await image.scrollIntoViewIfNeeded();
    await expect
      .poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
      .toBe(true);
  }
  expect(errors).toEqual([]);
});

test('structured questions retain continuation pages and official marking points for topic feedback', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'More', exact: false }).click();
  await page.getByLabel('Filter by paper').selectOption('Paper 1B');
  await page.getByLabel('Filter by time zone').selectOption('TZ2');
  await expect(page.locator('.question-card')).toHaveCount(2);
  const card = page.locator('.question-card').first();
  await expect(card).toContainText('11 marks');
  expect(await card.locator('.question-original img').count()).toBeGreaterThan(1);
  await card.locator('summary').click();
  await expect(card.locator('.mark-scheme img')).toHaveCount(2);
  await expect(card.locator('.mark-scheme img').first()).toHaveAttribute(
    'src',
    /tz2\/markschemes\/1b-q01-p4.webp$/,
  );
  await card.getByRole('button', { name: 'Needs practice', exact: true }).click();
  await page.getByRole('navigation').getByRole('button', { name: 'Feedback', exact: true }).click();
  await expect(page.locator('.progress-stats > div').first()).toContainText('1');
  await page.getByRole('button', { name: 'Review these questions' }).click();
  await expect(page.locator('.question-card')).toHaveCount(1);
  await expect(page.locator('.question-card')).toContainText('May 2025 · Physics HL · TZ2 · Q1');
});

test('compiled papers print original question images and separate official mark schemes after images load', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  await page
    .locator('.question-card')
    .first()
    .getByRole('button', { name: 'Add to paper', exact: true })
    .click();
  await page.getByRole('button', { name: 'More', exact: false }).click();
  await page.getByLabel('Filter by paper').selectOption('Paper 1B');
  await page
    .locator('.question-card')
    .first()
    .getByRole('button', { name: 'Add to paper', exact: true })
    .click();
  await page.getByRole('button', { name: 'Review your paper' }).click();
  await page.getByLabel('Paper title').fill('May 2025 original practice');
  await page.evaluate(() => {
    (window as unknown as { printCount: number }).printCount = 0;
    window.print = () => {
      (window as unknown as { printCount: number }).printCount++;
    };
  });
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Question paper', exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { printCount: number }).printCount))
    .toBe(1);
  await expect(page.locator('#print-paper .print-answer')).toHaveCount(0);
  expect(
    await page
      .locator('#print-paper img')
      .evaluateAll((images) =>
        images.every((image) => (image as HTMLImageElement).naturalWidth > 0),
      ),
  ).toBe(true);
  await page.emulateMedia({ media: 'print' });
  await page.pdf({ path: testInfo.outputPath('original-question-paper.pdf'), format: 'A4' });
  await page.emulateMedia({ media: 'screen' });
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  await page.getByRole('dialog').getByRole('button', { name: 'Mark scheme', exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { printCount: number }).printCount))
    .toBe(2);
  await expect(page.locator('#print-paper .print-answer')).toHaveCount(2);
  await expect(page.locator('#print-paper img').first()).toHaveAttribute(
    'src',
    /markschemes\/1a-q01.webp$/,
  );
  await page.emulateMedia({ media: 'print' });
  await page.pdf({ path: testInfo.outputPath('original-mark-scheme.pdf'), format: 'A4' });
});
