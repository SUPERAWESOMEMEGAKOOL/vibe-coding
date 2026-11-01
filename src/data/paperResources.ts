import type { Subject } from '../types';
import uploadedPapers from './uploadedPaperResources.json';
import { assetUrl } from '../lib/assets';

export interface PaperResource {
  id: string;
  subject: Subject;
  paper: string;
  kind: 'specimen' | 'past-paper';
  syllabusFirstAssessment: number;
  publisher: string;
  sourcePage: string;
  pdfUrl: string;
  pdfPages: number;
  questions: { firstPage: number; lastPage: number };
  markScheme: { firstPage: number; lastPage: number };
  verifiedOn: string;
  markSchemePdfUrl?: string;
  markSchemePdfPages?: number;
  uploaded?: boolean;
  year?: number;
  examSession?: string;
  timeZone?: string;
  questionCount?: number;
  marks?: number;
  examCode?: string;
}

// Math specimens open at IB's public source; uploaded Physics PDFs are bundled below.
// The page ranges were checked against the PDF contents and the HL cover pages.
const mathDocument = {
  subject: 'math' as const,
  kind: 'specimen' as const,
  syllabusFirstAssessment: 2021,
  publisher: 'International Baccalaureate',
  sourcePage:
    'https://www.ibo.org/programmes/diploma-programme/assessment-and-exams/sample-exam-papers/',
  pdfUrl:
    'https://www.ibo.org/globalassets/new-structure/university-admission/pdfs/dp-mathematics-analysis-and-approaches-specimen-papers-en.pdf',
  pdfPages: 121,
  verifiedOn: '2026-11-01',
};

export const paperResources: PaperResource[] = [
  ...(uploadedPapers as PaperResource[]),
  {
    ...mathDocument,
    id: 'ib-math-aa-hl-specimen-p1',
    paper: 'Paper 1',
    questions: { firstPage: 3, lastPage: 18 },
    markScheme: { firstPage: 19, lastPage: 34 },
  },
  {
    ...mathDocument,
    id: 'ib-math-aa-hl-specimen-p2',
    paper: 'Paper 2',
    questions: { firstPage: 35, lastPage: 46 },
    markScheme: { firstPage: 47, lastPage: 62 },
  },
  {
    ...mathDocument,
    id: 'ib-math-aa-hl-specimen-p3',
    paper: 'Paper 3',
    questions: { firstPage: 63, lastPage: 67 },
    markScheme: { firstPage: 68, lastPage: 76 },
  },
];

export function paperDocumentUrl(resource: PaperResource, mode: 'questions' | 'markScheme') {
  const file =
    mode === 'markScheme' ? (resource.markSchemePdfUrl ?? resource.pdfUrl) : resource.pdfUrl;
  return `${assetUrl(file)}#page=${resource[mode].firstPage}&view=FitH`;
}
