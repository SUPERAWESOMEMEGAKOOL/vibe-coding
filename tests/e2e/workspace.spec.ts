import { expect, test } from '@playwright/test';
import { starterQuestions } from '../../src/data/questions';

// Exercise the study tools with explicitly opted-in demo fixtures, not a fake past-paper bank.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('folio.workspace.v1'))
      localStorage.setItem('folio.workspace.v1', JSON.stringify({ showDemoQuestions: true }));
  });
});

test('topic filters, search, bookmarks, and persistence', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /A little practice/ })).toBeVisible();
  await page.getByLabel('Filter by topic').selectOption('m5');
  await expect(page.locator('.question-card')).toHaveCount(3);
  await expect(page.locator('.results-toolbar')).toContainText('3 questions found');
  await page.getByLabel('Search questions').fill('differential');
  await expect(page.locator('.question-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'Save question', exact: true }).click();
  await page.getByRole('button', { name: /Saved questions/ }).click();
  await expect(page.locator('.question-card')).toHaveCount(1);
  await page.reload();
  await page.getByRole('button', { name: /Saved questions/ }).click();
  await expect(page.locator('.question-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'Unsave question', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Keep the good questions close' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('Physics MCQs give correct and incorrect feedback and remember answers', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('YOUR SUBJECT', { exact: true }).selectOption('physics');
  const card = page.locator('.question-card').first();
  await card.locator('.mcq-option').nth(0).click();
  await expect(card.locator('.answer-feedback')).toContainText('Not quite');
  await card.getByRole('button', { name: 'Try again' }).click();
  await card.locator('.mcq-option').nth(1).click();
  await expect(card.locator('.answer-feedback')).toContainText('That’s right');
  await card.locator('summary').click();
  await expect(card.locator('.solution-content')).toBeVisible();
  await expect(card.locator('.solution-content')).toContainText('Displacement is the signed area');
  await page.reload();
  await expect(page.getByLabel('YOUR SUBJECT', { exact: true })).toHaveValue('physics');
  await expect(page.locator('.answer-feedback').first()).toContainText('That’s right');
  await page.getByLabel('Filter by question type').selectOption('structured');
  await expect(page.locator('.question-card')).toHaveCount(5);
  await expect(page.locator('.mcq-options')).toHaveCount(0);
});

test('compile, reorder, save and print a paper and its separate mark scheme', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  await page.locator('.question-card').nth(0).getByRole('button', { name: 'Add to paper' }).click();
  await page.locator('.question-card').nth(1).getByRole('button', { name: 'Add to paper' }).click();
  await expect(page.locator('.builder-totals')).toContainText('11');
  await page.getByRole('button', { name: 'Review your paper' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Paper title').fill('My calculus and algebra practice');
  await dialog.getByRole('button', { name: 'Move question 2 up' }).click();
  await expect(dialog.locator('.paper-question-row').first()).toContainText('Sequences and series');
  await dialog.getByRole('button', { name: 'Save to my papers' }).click();
  await expect(page.locator('.saved-paper')).toContainText('My calculus and algebra practice');
  await page.reload();
  await page.getByRole('button', { name: /My papers/ }).click();
  await page.getByRole('button', { name: 'Open paper' }).click();
  await page.evaluate(() => {
    window.print = () => {};
  });
  await page.getByRole('button', { name: 'Question paper', exact: true }).click();
  await expect(page.locator('#print-paper')).toContainText('My calculus and algebra practice');
  await expect(page.locator('#print-paper .print-answer')).toHaveCount(0);
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#print-paper')).toBeVisible();
  await expect(page.locator('.app-shell')).toBeHidden();
  await page.pdf({ path: testInfo.outputPath('question-paper.pdf'), format: 'A4' });
  await page.emulateMedia({ media: 'screen' });
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  await page.getByRole('button', { name: 'Mark scheme', exact: true }).click();
  await expect(page.locator('#print-paper .print-answer')).toHaveCount(2);
  await page.emulateMedia({ media: 'print' });
  await page.pdf({ path: testInfo.outputPath('mark-scheme.pdf'), format: 'A4' });
  await page.emulateMedia({ media: 'screen' });
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page
    .locator('.saved-paper')
    .getByRole('button', { name: /^Delete / })
    .click();
  await page
    .locator('.saved-paper .delete-confirm')
    .getByRole('button', { name: 'Delete', exact: true })
    .click();
  await expect(page.locator('.saved-paper')).toHaveCount(0);
});

test('imports attributed past-paper questions, validates years, and prevents duplicates', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Add questions', exact: true }).click();
  await page.getByRole('button', { name: 'Import a question bank' }).click();
  const q = {
    ...starterQuestions.find((q) => q.subject === 'physics')!,
    prompt: 'A test fixture for a source-attributed imported question.',
    source: 'past-paper',
    sourceName: 'Test source',
    year: 2024,
  };
  await page.getByLabel('Question bank JSON').fill(JSON.stringify([q]));
  await page.getByRole('button', { name: 'Import questions', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('2025–2026');
  q.year = 2025;
  await page.getByLabel('Question bank JSON').fill(JSON.stringify([q, q]));
  await page.getByRole('button', { name: 'Import questions', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByLabel('YOUR SUBJECT', { exact: true })).toHaveValue('physics');
  await expect(page.getByRole('status')).toContainText('1 question added · 1 duplicates skipped');
  await page.getByRole('button', { name: 'More', exact: false }).click();
  await page.getByLabel('Filter by source').selectOption('past-paper');
  await expect(page.locator('.question-card')).toHaveCount(1);
  await expect(page.locator('.question-card')).toContainText('Test source');
  await page.reload();
  await expect(page.locator('.question-card').first()).toContainText('Test source');
});

test('adds a manually entered MCQ with a complete mark scheme', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Add questions', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('combobox', { name: 'Subject', exact: true }).selectOption('physics');
  await dialog.getByRole('combobox', { name: 'Question type', exact: true }).selectOption('mcq');
  await dialog.getByLabel('Question', { exact: true }).fill('What is the SI unit of force?');
  for (const [i, option] of ['newton', 'joule', 'watt', 'pascal'].entries())
    await dialog.getByLabel(`Option ${'ABCD'[i]}`, { exact: true }).fill(option);
  await dialog.getByRole('radio', { name: 'Option A is correct' }).check();
  await dialog.getByLabel('Answer', { exact: true }).fill('A — newton.');
  await dialog
    .getByLabel('Explanation', { exact: true })
    .fill('Force is measured in newtons, which are kilogram metres per second squared.');
  await dialog.getByLabel('Mark scheme step 1').fill('Identify the newton.');
  await dialog.getByLabel('Source name').fill('User-entered fixture');
  await dialog.getByRole('button', { name: 'Add to question bank' }).click();
  await expect(dialog).toHaveCount(0);
  const card = page.locator('.question-card').first();
  await expect(card).toContainText('What is the SI unit of force?');
  await card.locator('.mcq-option').first().click();
  await expect(card.locator('.answer-feedback')).toContainText('That’s right');
});

test('PDF library uploads, previews, persists and deletes local documents', async ({ page }) => {
  await page.goto('/');
  const pdf = await page.pdf({ format: 'A4' });
  await page.getByRole('button', { name: 'Source library' }).click();
  await page
    .locator('input[type=file]')
    .setInputFiles({ name: 'practice-paper.pdf', mimeType: 'application/pdf', buffer: pdf });
  await expect(page.locator('.document-row')).toContainText('practice-paper.pdf');
  await page.getByRole('button', { name: 'Open PDF' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('.pdf-preview iframe')).toHaveAttribute('src', /^blob:/);
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Source library' }).click();
  await expect(page.locator('.document-row')).toContainText('practice-paper.pdf');
  await page.getByRole('button', { name: 'Delete practice-paper.pdf' }).click();
  await page
    .locator('.delete-confirm')
    .getByRole('button', { name: 'Delete', exact: true })
    .click();
  await expect(page.locator('.document-row')).toHaveCount(0);
});

test('mobile navigation, filters and dialogs fit a small screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByLabel('YOUR SUBJECT', { exact: true }).selectOption('physics');
  await page.getByLabel('Filter by topic').selectOption('pC');
  await expect(page.locator('.question-card')).toHaveCount(3);
  await page.getByRole('button', { name: 'Add questions', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const noOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  );
  expect(noOverflow).toBe(true);
});
