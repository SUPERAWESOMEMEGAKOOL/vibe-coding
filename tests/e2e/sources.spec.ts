import { expect, test } from '@playwright/test';

test('real-paper mode is the default for both subjects and the requested source is explicit', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('.question-card')).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: 'Your real-paper bank starts here' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Open paper sources' }).click();
  const source = page.locator('.ibresources-card');
  await expect(source).toHaveAttribute('href', 'https://ibresources.cc/');
  await expect(source).toContainText('Math AA HL · 2021–2026');
  await expect(source).toContainText('Physics HL · 2025–2026');
  await expect(source).toContainText('not been verified');
  const brief = page.locator('.resource-card').filter({ hasText: 'VERIFIED IB SUBJECT BRIEF' });
  await expect(brief).toHaveAttribute(
    'href',
    /subject-brief-dp-math-analysis-and-approaches-en\.pdf$/,
  );
  await expect(brief).toContainText('2021');
  await page.getByLabel('YOUR SUBJECT', { exact: true }).selectOption('physics');
  await expect(brief).toHaveAttribute('href', /dp_sciences_physics_subject-brief_jan_2022_e\.pdf$/);
  await expect(brief).toContainText('2025');
  await page
    .getByRole('navigation')
    .getByRole('button', { name: /Question bank/ })
    .click();
  await page.getByLabel('YOUR SUBJECT', { exact: true }).selectOption('physics');
  await expect(page.locator('.question-card')).toHaveCount(0);
  await expect(page.locator('.empty-state')).toContainText(
    'No real Physics HL questions have been imported',
  );
});

test('demo questions require explicit opt-in and can be hidden again without losing saved progress', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'About your workspace' }).click();
  await page.getByRole('checkbox', { name: /Show original demo questions/ }).check();
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await expect(page.locator('.question-card')).toHaveCount(5);
  await page
    .locator('.question-card')
    .first()
    .getByRole('button', { name: 'Save question', exact: true })
    .click();
  await page.getByRole('button', { name: 'About your workspace' }).click();
  await page.getByRole('checkbox', { name: /Show original demo questions/ }).uncheck();
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await expect(page.locator('.question-card')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('.question-card')).toHaveCount(0);
  await page.getByRole('button', { name: 'About your workspace' }).click();
  await page.getByRole('checkbox', { name: /Show original demo questions/ }).check();
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await expect(
    page
      .locator('.question-card')
      .first()
      .getByRole('button', { name: 'Unsave question', exact: true }),
  ).toBeVisible();
});
