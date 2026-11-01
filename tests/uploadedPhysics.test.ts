import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { uploadedPhysicsQuestions as questions } from '../src/data/uploadedQuestions';
import { filterQuestions, validateQuestion, type Filters } from '../src/lib/questions';
import { initialState, loadState, STORAGE_KEY } from '../src/lib/storage';
import { isLocalPaperPath } from '../src/lib/assets';
import audit from '../scripts/physics-2025-import-audit.json';
import { topics } from '../src/data/syllabus';
import { vi } from 'vitest';

const filters: Filters = {
  subject: 'physics',
  topic: 'all',
  subtopic: 'all',
  type: 'all',
  difficulty: 'all',
  source: 'all',
  query: '',
  sort: 'recommended',
};
const asset = (path: string) => resolve('public', path);
const key = {
  TZ1: 'B B A C C A B B B A D C C D B C B B D C C C D B A A D A C B D A C A A A A D C D',
  TZ2: 'B C D D D A D C C C C D C D D B B A A B A B C B A A A B A D A D C B B C A C D B',
};

describe('Uploaded May 2025 Physics HL papers', () => {
  it('imports all actual questions, original pages, topic tags, and matching marking points', () => {
    expect(questions).toHaveLength(102);
    expect(new Set(questions.map((q) => q.id)).size).toBe(102);
    expect(questions.filter((q) => q.type === 'mcq')).toHaveLength(80);
    expect(questions.filter((q) => q.type === 'structured')).toHaveLength(22);
    for (const q of questions) {
      expect(() => validateQuestion(q)).not.toThrow();
      expect(q.source).toBe('past-paper');
      expect(q.examSession).toBe('May 2025');
      expect(q.difficulty).toBe('Unrated');
      expect(topics.physics.find((t) => t.id === q.topicId)?.subtopics).toContain(q.subtopic);
      expect(q.questionImages!.length).toBeGreaterThan(0);
      expect(q.markSchemeImages!.length).toBeGreaterThan(0);
      for (const image of [...q.questionImages!, ...q.markSchemeImages!]) {
        expect(existsSync(asset(image.path))).toBe(true);
        expect(readFileSync(asset(image.path)).subarray(8, 12).toString()).toBe('WEBP');
      }
    }
    expect(questions.reduce((total, q) => total + q.marks, 0)).toBe(300);
    for (const topic of topics.physics)
      expect(questions.some((q) => q.topicId === topic.id)).toBe(true);
  });

  it('uses the official answer for every MCQ without mixing time zones', () => {
    for (const zone of ['TZ1', 'TZ2'] as const) {
      const mcqs = questions.filter((q) => q.timeZone === zone && q.type === 'mcq');
      expect(mcqs.map((q) => q.originalQuestionNumber)).toEqual(
        Array.from({ length: 40 }, (_, i) => i + 1),
      );
      expect(mcqs.map((q) => 'ABCD'[q.correctOption!]).join(' ')).toBe(key[zone]);
      expect(mcqs.every((q) => q.steps.length === 1 && q.steps[0].marks === 1)).toBe(true);
    }
    // This answer is stored out of order in the PDF text stream; coordinate extraction must keep it.
    expect(
      questions.find(
        (q) => q.timeZone === 'TZ2' && q.paper === 'Paper 1A' && q.originalQuestionNumber === 33,
      )?.correctOption,
    ).toBe(2);
    // This MCQ continues onto a second PDF page.
    expect(
      questions.find(
        (q) => q.timeZone === 'TZ2' && q.paper === 'Paper 1A' && q.originalQuestionNumber === 30,
      )?.questionImages,
    ).toHaveLength(2);
  });

  it('keeps all twelve original uploaded PDFs byte for byte and has complete structured marks', () => {
    for (const record of audit) {
      const [paper, zone] = record.paper.toLowerCase().split('-');
      const base = `papers/physics/2025-may/${zone}/paper-${paper}`;
      for (const [suffix, sha] of [
        ['.pdf', record.questionSha256],
        ['-markscheme.pdf', record.markSchemeSha256],
      ]) {
        expect(
          createHash('sha256')
            .update(readFileSync(asset(base + suffix)))
            .digest('hex'),
        ).toBe(sha);
      }
      const set = questions.filter((q) => q.examCode === record.examCode);
      expect(set).toHaveLength(record.questionCount);
      expect(set.reduce((n, q) => n + q.marks, 0)).toBe(record.marks);
    }
    expect(
      questions.filter((q) => q.paper === 'Paper 2' && q.timeZone === 'TZ1').map((q) => q.marks),
    ).toEqual([6, 6, 8, 5, 9, 10, 6, 20, 20]);
    expect(
      questions.filter((q) => q.paper === 'Paper 2' && q.timeZone === 'TZ2').map((q) => q.marks),
    ).toEqual([8, 10, 9, 9, 8, 6, 20, 20]);
  });

  it('combines paper, time-zone and current-syllabus topic filters, including mixed questions', () => {
    expect(
      filterQuestions(questions, { ...filters, paper: 'Paper 1A', timeZone: 'TZ2' }),
    ).toHaveLength(40);
    expect(
      filterQuestions(questions, { ...filters, paper: 'Paper 1B', timeZone: 'TZ1' }),
    ).toHaveLength(3);
    expect(filterQuestions(questions, { ...filters, subject: 'math' })).toHaveLength(0);
    const multi = questions.find((q) => q.additionalTopics?.some((t) => t.topicId !== q.topicId))!;
    const secondary = multi.additionalTopics!.find((t) => t.topicId !== multi.topicId)!;
    expect(
      filterQuestions([multi], {
        ...filters,
        topic: secondary.topicId,
        subtopic: secondary.subtopic,
      }),
    ).toEqual([multi]);
    expect(filterQuestions(questions, { ...filters, query: '2225-6713' })).toHaveLength(40);
  });

  it('retains image and PDF references through saved-paper and workspace recovery', () => {
    const q = questions.find((q) => q.type === 'structured')!;
    vi.stubGlobal('localStorage', {
      getItem: (key: string) =>
        key === STORAGE_KEY
          ? JSON.stringify({
              ...initialState,
              papers: [
                {
                  id: 'p',
                  name: 'Real paper',
                  subject: 'physics',
                  createdAt: '2026-11-01',
                  questions: [q],
                },
              ],
            })
          : null,
    });
    try {
      expect(loadState().papers[0].questions[0]).toEqual(q);
    } finally {
      vi.unstubAllGlobals();
    }
    expect(isLocalPaperPath('papers/../../secret.pdf', 'pdf')).toBe(false);
    expect(isLocalPaperPath('https://example.com/x.webp', 'image')).toBe(false);
    expect(() =>
      validateQuestion({ ...q, questionDocument: { path: '../secret.pdf', page: 1 } }),
    ).toThrow(/PDF reference/);
  });
});
