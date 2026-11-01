import { describe, expect, it } from 'vitest';
import katex from 'katex';
import { starterQuestions } from './fixtures/studyQuestions';
import { topics } from '../src/data/syllabus';
import {
  filterQuestions,
  paperTotals,
  parseQuestionImport,
  validateQuestion,
  type Filters,
} from '../src/lib/questions';

const base: Filters = {
  subject: 'math',
  topic: 'all',
  subtopic: 'all',
  type: 'all',
  difficulty: 'all',
  source: 'all',
  query: '',
  sort: 'recommended',
};
const original = starterQuestions[0];

describe('Study tool fixtures (excluded from the production question bank)', () => {
  it('has valid fixtures covering every subject topic', () => {
    expect(starterQuestions).toHaveLength(30);
    for (const q of starterQuestions) expect(() => validateQuestion(q)).not.toThrow();
    for (const subject of ['math', 'physics'] as const)
      for (const topic of topics[subject])
        expect(starterQuestions.some((q) => q.subject === subject && q.topicId === topic.id)).toBe(
          true,
        );
    expect(
      starterQuestions.filter((q) => q.subject === 'math').every((q) => q.type === 'structured'),
    ).toBe(true);
  });
  it('renders all mathematical expressions without LaTeX errors', () => {
    for (const q of starterQuestions) {
      const texts = [
        q.prompt,
        q.answer,
        q.explanation,
        ...q.steps.map((s) => s.text),
        ...(q.options ?? []),
      ];
      for (const text of texts)
        for (const match of text.matchAll(/\$([^$\n]+)\$/g))
          expect(() => katex.renderToString(match[1], { throwOnError: true })).not.toThrow();
    }
  });
  it('combines subject, topic, type, source and search filters', () => {
    expect(filterQuestions(starterQuestions, { ...base, topic: 'm5' })).toHaveLength(3);
    expect(
      filterQuestions(starterQuestions, { ...base, subject: 'physics', type: 'mcq', topic: 'pA' }),
    ).toHaveLength(2);
    expect(filterQuestions(starterQuestions, { ...base, query: 'complex' })).toHaveLength(1);
    expect(filterQuestions(starterQuestions, { ...base, source: 'past-paper' })).toHaveLength(0);
    expect(
      filterQuestions(starterQuestions, { ...base, subject: 'physics', topic: 'm5' }),
    ).toHaveLength(0);
  });
  it('sums the question marks and suggested durations accurately', () => {
    expect(paperTotals([starterQuestions[0], starterQuestions[1]])).toEqual({
      marks: 11,
      minutes: 17,
    });
    expect(paperTotals([])).toEqual({ marks: 0, minutes: 0 });
  });
});

describe('Question imports', () => {
  it('parses the exported bank and assigns local IDs', () => {
    const result = parseQuestionImport(JSON.stringify({ questions: starterQuestions }));
    expect(result).toHaveLength(30);
    expect(result[0].id).toMatch(/^custom-/);
    expect(result[0].prompt).toBe(original.prompt);
  });
  it('rejects obsolete Physics papers and names the failing question', () => {
    const q = starterQuestions.find((q) => q.subject === 'physics')!;
    expect(() =>
      parseQuestionImport(JSON.stringify([{ ...q, source: 'past-paper', year: 2024 }])),
    ).toThrow(/Question 1:.*2025–2026/);
    expect(() => validateQuestion({ ...q, source: 'past-paper', year: 2025 })).not.toThrow();
    expect(() => validateQuestion({ ...original, source: 'past-paper', year: 2020 })).toThrow(
      /2021–2026/,
    );
  });
  it('rejects unsafe sources, invalid option indices, and inconsistent marks', () => {
    expect(() => validateQuestion({ ...original, sourceUrl: 'javascript:alert(1)' })).toThrow(
      /HTTPS/,
    );
    expect(() =>
      validateQuestion({ ...original, sourceUrl: 'https://user:password@example.com' }),
    ).toThrow(/HTTPS/);
    const q = starterQuestions.find((q) => q.type === 'mcq')!;
    expect(() => validateQuestion({ ...q, correctOption: 8 })).toThrow(/four options/);
    expect(() => validateQuestion({ ...original, marks: 10 })).toThrow(/adding up/);
    expect(() => parseQuestionImport('not JSON')).toThrow(/not valid JSON/);
    expect(() => parseQuestionImport('[]')).toThrow(/non-empty/);
  });
});
