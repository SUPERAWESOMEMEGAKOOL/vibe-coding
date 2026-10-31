import { describe, expect, it } from 'vitest';
import { paperDocumentUrl, paperResources } from '../src/data/paperResources';

describe('Verified original paper documents', () => {
  it('identifies official Math AA HL specimens honestly and pairs every HL paper with its mark scheme', () => {
    expect(paperResources).toHaveLength(3);
    expect(paperResources.map((p) => p.paper)).toEqual(['Paper 1', 'Paper 2', 'Paper 3']);
    for (const paper of paperResources) {
      expect(paper.subject).toBe('math');
      expect(paper.kind).toBe('specimen');
      expect(paper.syllabusFirstAssessment).toBe(2021);
      expect(new URL(paper.pdfUrl).hostname).toBe('www.ibo.org');
      expect(paper.questions.firstPage).toBeGreaterThan(0);
      expect(paper.questions.lastPage).toBeLessThan(paper.markScheme.firstPage);
      expect(paper.markScheme.lastPage).toBeLessThan(77); // The first SL paper starts at PDF page 77.
      expect(paper.markScheme.lastPage).toBeLessThanOrEqual(paper.pdfPages);
    }
  });
  it('opens at the separately verified paper and mark scheme cover pages', () => {
    expect(paperResources.map((p) => [p.questions.firstPage, p.markScheme.firstPage])).toEqual([
      [3, 19],
      [35, 47],
      [63, 68],
    ]);
    expect(paperDocumentUrl(paperResources[0], 'questions')).toContain('#page=3&view=FitH');
    expect(paperDocumentUrl(paperResources[0], 'markScheme')).toContain('#page=19&view=FitH');
  });
  it('does not fabricate current Physics documents or past exam sittings', () => {
    expect(paperResources.filter((p) => p.subject === 'physics')).toHaveLength(0);
    expect(paperResources.filter((p) => p.kind === 'past-paper')).toHaveLength(0);
  });
});
