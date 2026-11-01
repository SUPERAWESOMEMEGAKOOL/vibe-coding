import { describe, expect, it } from 'vitest';
import { paperDocumentUrl, paperResources } from '../src/data/paperResources';

const math = paperResources.filter((p) => p.subject === 'math');
const physics = paperResources.filter((p) => p.subject === 'physics');

describe('Verified original paper documents', () => {
  it('identifies the three official Math AA HL specimens honestly', () => {
    expect(math.map((p) => p.paper)).toEqual(['Paper 1', 'Paper 2', 'Paper 3']);
    for (const paper of math) {
      expect(paper.kind).toBe('specimen');
      expect(paper.syllabusFirstAssessment).toBe(2021);
      expect(new URL(paper.pdfUrl).hostname).toBe('www.ibo.org');
      expect(paper.questions.firstPage).toBeGreaterThan(0);
      expect(paper.questions.lastPage).toBeLessThan(paper.markScheme.firstPage);
      expect(paper.markScheme.lastPage).toBeLessThan(77);
    }
    expect(math.map((p) => [p.questions.firstPage, p.markScheme.firstPage])).toEqual([
      [3, 19],
      [35, 47],
      [63, 68],
    ]);
    expect(paperDocumentUrl(math[0], 'questions')).toContain('#page=3&view=FitH');
    expect(paperDocumentUrl(math[0], 'markScheme')).toContain('#page=19&view=FitH');
  });

  it('pairs all six supplied Physics papers with separate matching PDFs', () => {
    expect(physics).toHaveLength(6);
    expect(physics.map((p) => `${p.timeZone} ${p.paper}`)).toEqual([
      'TZ1 Paper 1A',
      'TZ1 Paper 1B',
      'TZ1 Paper 2',
      'TZ2 Paper 1A',
      'TZ2 Paper 1B',
      'TZ2 Paper 2',
    ]);
    for (const paper of physics) {
      expect(paper.kind).toBe('past-paper');
      expect(paper.uploaded).toBe(true);
      expect(paper.examSession).toBe('May 2025');
      expect(paper.syllabusFirstAssessment).toBe(2025);
      expect(paper.markSchemePdfUrl).toBe(paper.pdfUrl.replace('.pdf', '-markscheme.pdf'));
      expect(paperDocumentUrl(paper, 'questions')).toContain(`${paper.pdfUrl}#page=2&view=FitH`);
      expect(paperDocumentUrl(paper, 'markScheme')).toContain(
        `${paper.markSchemePdfUrl}#page=1&view=FitH`,
      );
      expect(paper.markScheme.lastPage).toBe(paper.markSchemePdfPages);
      expect(paper.questions.lastPage).toBe(paper.pdfPages);
    }
    expect(physics.reduce((n, p) => n + p.questionCount!, 0)).toBe(102);
    expect(physics.reduce((n, p) => n + p.marks!, 0)).toBe(300);
  });
});
