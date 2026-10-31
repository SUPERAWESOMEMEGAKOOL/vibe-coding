import { expect, test } from '@playwright/test';

test('the notebook groups and filters multiple topics and sorts by most missed', async ({
  page,
}) => {
  await page.goto('/');
  const calculus = page.locator('.question-card').nth(0);
  await calculus.locator('summary').click();
  await calculus.getByRole('button', { name: 'Needs practice', exact: true }).click();
  await calculus.getByRole('button', { name: 'Log another attempt' }).click();
  await calculus.getByRole('button', { name: 'Needs practice', exact: true }).click();
  const algebra = page.locator('.question-card').nth(1);
  await algebra.locator('summary').click();
  await algebra.getByRole('button', { name: 'Needs practice', exact: true }).click();
  await page
    .getByRole('navigation')
    .getByRole('button', { name: /Mistake notebook/ })
    .click();
  await expect(page.locator('.mistake-group')).toHaveCount(2);
  await expect(page.locator('.mistake-group-heading').first()).toContainText('Number and algebra');
  await page.getByLabel('Sort mistakes').selectOption('misses');
  await expect(page.locator('.mistake-group-heading').first()).toContainText('Calculus');
  await expect(page.locator('.mistake-card').first()).toContainText('2 misses in 2 attempts');
  await page.getByLabel('Mistake topic').selectOption('m1');
  await expect(page.locator('.mistake-group')).toHaveCount(1);
  await expect(page.locator('.mistake-group-heading')).toContainText('Number and algebra');
});

test('mistakes survive retries, group by topic, and produce feedback from reflections', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByLabel('YOUR SUBJECT', { exact: true }).selectOption('physics');
  const card = page.locator('.question-card').first();
  await card.locator('.mcq-option').nth(0).click();
  await card.getByRole('button', { name: 'Try again' }).click();
  await card.locator('.mcq-option').nth(2).click();
  await page
    .getByRole('navigation')
    .getByRole('button', { name: /Mistake notebook/ })
    .click();
  await expect(page.locator('.mistake-group-heading')).toContainText('Space, time and motion');
  await expect(page.locator('.mistake-card')).toContainText('2 misses in 2 attempts');
  await page.locator('.reflection-details summary').click();
  await page.getByRole('combobox', { name: 'What happened?' }).selectOption('calculation');
  await page.getByLabel('A note to your future self').fill('Use half the base times the height.');
  await page.getByRole('button', { name: 'Save reflection' }).click();
  await page.getByRole('navigation').getByRole('button', { name: 'Feedback', exact: true }).click();
  await expect(page.locator('.feedback-focus')).toContainText('motion');
  await expect(page.locator('.reason-row')).toContainText('Calculation slip');
  await expect(page.locator('.progress-stats > div').nth(0)).toContainText('2');
  await expect(page.locator('.progress-stats > div').nth(2)).toContainText('1');
  await page.getByRole('button', { name: 'Review these questions' }).click();
  await expect(page.locator('.question-card')).toHaveCount(1);
  await expect(page.locator('.review-session-banner')).toBeVisible();
  await page.locator('.mcq-option').nth(1).click();
  await page
    .getByRole('navigation')
    .getByRole('button', { name: /Mistake notebook/ })
    .click();
  await expect(page.locator('.mistake-card')).toContainText('2 misses in 3 attempts');
  await expect(page.locator('.review-status')).toContainText('Improving');
  await expect(page.locator('.missed-answer')).toContainText('C.');
  await page.getByLabel('Mistake status').selectOption('needs-practice');
  await expect(page.locator('.mistake-card')).toHaveCount(0);
  await page.getByLabel('Mistake status').selectOption('improving');
  await expect(page.locator('.mistake-card')).toHaveCount(1);
  await page.reload();
  await page
    .getByRole('navigation')
    .getByRole('button', { name: /Mistake notebook/ })
    .click();
  await expect(page.locator('.mistake-card')).toContainText('2 misses in 3 attempts');
  await page.locator('.reflection-details summary').click();
  await expect(page.getByLabel('A note to your future self')).toHaveValue(
    'Use half the base times the height.',
  );
  await page.getByLabel('YOUR SUBJECT', { exact: true }).selectOption('math');
  await expect(page.locator('.mistake-card')).toHaveCount(0);
});

test('Math self-checks log mistakes and successful reattempts without losing history', async ({
  page,
}) => {
  await page.goto('/');
  const card = page.locator('.question-card').first();
  await card.locator('summary').click();
  await card.getByRole('button', { name: 'Needs practice', exact: true }).click();
  await expect(card.locator('.self-check-result')).toContainText('Added to your mistake notebook');
  await page.getByRole('navigation').getByRole('button', { name: 'Feedback', exact: true }).click();
  await expect(page.locator('.feedback-focus')).toContainText('calculus');
  await expect(page.locator('.progress-stats > div').nth(0)).toContainText('1');
  await page.getByRole('button', { name: 'Review these questions' }).click();
  await page.locator('.question-card summary').click();
  await page.getByRole('button', { name: 'Got it right' }).click();
  await page.getByRole('navigation').getByRole('button', { name: 'Feedback', exact: true }).click();
  await expect(page.locator('.progress-stats > div').nth(0)).toContainText('2');
  await expect(page.locator('.progress-stats > div').nth(1)).toContainText('0%');
  await expect(page.locator('.progress-stats > div').nth(2)).toContainText('0');
  await expect(page.locator('.progress-stats > div').nth(3)).toContainText('1');
  await expect(page.locator('.feedback-focus')).toContainText(
    'previously missed question now has a correct latest result',
  );
});

test('feedback has honest empty states and fits mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByRole('navigation').getByRole('button', { name: 'Feedback', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Let’s start with a little practice.' }),
  ).toBeVisible();
  await expect(page.locator('.progress-stats > div').nth(1).locator('strong')).toHaveText('—');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('button', { name: 'Find my first question' }).click();
  await page.locator('.question-card').first().locator('summary').click();
  await page.getByRole('button', { name: 'Needs practice', exact: true }).click();
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByRole('navigation').getByRole('button', { name: 'Feedback', exact: true }).click();
  await expect(page.locator('.feedback-focus')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('button', { name: 'Mistake notebook', exact: true }).click();
  await expect(page.locator('.mistake-card')).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
