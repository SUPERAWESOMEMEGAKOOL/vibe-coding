import { expect, test } from '@playwright/test';

test('the supplied Physics papers replace the demo bank and Math remains honest about missing papers', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByLabel('YOUR SUBJECT', { exact: true })).toHaveValue('physics');
  await expect(page.locator('.results-toolbar')).toContainText('102 questions');
  await expect(page.locator('.question-card')).toHaveCount(5);
  await expect(page.locator('.question-card').first()).toContainText('May 2025');
  await expect(page.locator('.question-card').first()).toContainText('Instantaneous velocity');
  await expect(page.getByText('ORIGINAL PRACTICE', { exact: true })).toHaveCount(0);
  await page.getByLabel('YOUR SUBJECT', { exact: true }).selectOption('math');
  await expect(page.locator('.question-card')).toHaveCount(0);
  await expect(page.locator('.empty-state')).toContainText(
    'No Math AA HL past papers have been uploaded',
  );
  await page.getByRole('button', { name: 'Open paper sources' }).click();
  await expect(page.locator('.verified-paper-card')).toHaveCount(3);
  await expect(page.locator('.specimen-notice')).toContainText(
    'not papers from an actual examination session',
  );
  const brief = page.locator('.resource-card').filter({ hasText: 'VERIFIED IB SUBJECT BRIEF' });
  await expect(brief).toHaveAttribute(
    'href',
    /subject-brief-dp-math-analysis-and-approaches-en\.pdf$/,
  );
  await page.getByLabel('YOUR SUBJECT', { exact: true }).selectOption('physics');
  await expect(page.locator('.verified-paper-card')).toHaveCount(6);
  await expect(brief).toHaveAttribute('href', /dp_sciences_physics_subject-brief_jan_2022_e\.pdf$/);
  await expect(page.locator('.ibresources-card')).toHaveAttribute(
    'href',
    'https://ibresources.cc/',
  );
});

test('legacy demo settings cannot bring back made-up questions and bookmarks still persist', async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('folio.workspace.v1'))
      localStorage.setItem(
        'folio.workspace.v1',
        JSON.stringify({ subject: 'physics', showDemoQuestions: true }),
      );
  });
  await page.goto('/');
  await expect(page.locator('.results-toolbar')).toContainText('102 questions');
  await page
    .locator('.question-card')
    .first()
    .getByRole('button', { name: 'Save question', exact: true })
    .click();
  await page.getByRole('button', { name: 'About your workspace' }).click();
  await expect(page.getByRole('checkbox', { name: /demo/i })).toHaveCount(0);
  await expect(page.getByRole('dialog')).toContainText('102 real questions');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.reload();
  await expect(
    page
      .locator('.question-card')
      .first()
      .getByRole('button', { name: 'Unsave question', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.question-card').first()).toContainText('Instantaneous velocity');
});
