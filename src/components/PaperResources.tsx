import { useState } from 'react';
import {
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  FileCheck2,
  FileText,
  Info,
} from 'lucide-react';
import { paperDocumentUrl, paperResources, type PaperResource } from '../data/paperResources';
import { subjects } from '../data/syllabus';
import type { Subject } from '../types';
import Modal from './Modal';
import { assetUrl } from '../lib/assets';

type Mode = 'questions' | 'markScheme';

export default function PaperResources({ subject }: { subject: Subject }) {
  const [viewer, setViewer] = useState<{ resource: PaperResource; mode: Mode } | null>(null);
  const resources = paperResources.filter((resource) => resource.subject === subject);
  const current = viewer?.resource;
  const pages = viewer && current ? current[viewer.mode] : null;
  const uploaded = resources.some((r) => r.uploaded);
  return (
    <section className="verified-papers" aria-label="Verified paper documents">
      <div className="section-heading">
        <div>
          <h2>
            Verified IB documents <span>{resources.length} pairs</span>
          </h2>
          <p>
            {uploaded
              ? 'Your uploaded May 2025 papers, paired by paper code and time zone.'
              : 'Original IB specimen papers with matching mark schemes.'}
          </p>
        </div>
      </div>
      {resources.length ? (
        <>
          <div className="specimen-notice">
            <Info size={16} />
            <p>
              {uploaded ? (
                <>
                  <strong>Six real May 2025 Physics HL paper/mark-scheme pairs.</strong> All 102
                  questions are available in the question bank: 80 interactive MCQs and 22
                  structured questions, with original diagrams and official marking points. TZ
                  labels follow your filenames.
                </>
              ) : (
                <>
                  These are <strong>official specimen papers</strong> for the syllabus used in 2026,
                  not papers from an actual examination session. Each preview opens the correct HL
                  section of IB’s original PDF. Math past-paper questions have not been supplied
                  yet.
                </>
              )}
            </p>
          </div>
          <div className="verified-paper-grid">
            {resources.map((resource) => (
              <article className="verified-paper-card" key={resource.id}>
                <div className="verified-paper-card-top">
                  <span className="resource-icon">
                    <FileText size={22} />
                  </span>
                  <span className="verified-paper-kind">
                    {resource.uploaded ? 'UPLOADED PAST PAPER' : 'OFFICIAL SPECIMEN'}
                  </span>
                </div>
                <span className="verified-paper-subject">{subjects[resource.subject].short}</span>
                <h3>{resource.paper}</h3>
                <p>
                  First examinations {resource.syllabusFirstAssessment}
                  <br />
                  {resource.uploaded ? (
                    <>
                      {resource.examSession} · {resource.timeZone}
                      <br />
                      {resource.questionCount} questions · {resource.marks} marks
                    </>
                  ) : (
                    'HL paper + matching mark scheme'
                  )}
                </p>
                <div className="paper-pair-status">
                  <CheckCircle2 size={13} />
                  Both documents verified
                </div>
                <div className="verified-paper-buttons">
                  <button
                    className="button secondary"
                    onClick={() => setViewer({ resource, mode: 'questions' })}
                  >
                    <BookOpen size={14} />
                    Question paper
                  </button>
                  <button
                    className="button secondary"
                    onClick={() => setViewer({ resource, mode: 'markScheme' })}
                  >
                    <FileCheck2 size={14} />
                    Mark scheme
                  </button>
                </div>
                <a
                  className="verified-publisher-link"
                  href={assetUrl(resource.sourcePage)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Source: {resource.publisher}
                  <ExternalLink size={11} />
                </a>
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="unverified-subject-notice">
          <FileText size={23} />
          <div>
            <strong>No paper documents added for this subject yet.</strong>
            <p>
              Add question-paper and mark-scheme PDFs to your local library below, or import
              source-attributed questions into the question bank.
            </p>
          </div>
        </div>
      )}
      {viewer && current && pages && (
        <Modal
          title={`${subjects[current.subject].short} · ${current.paper}${current.timeZone ? ` · ${current.timeZone}` : ''}`}
          subtitle={
            current.uploaded
              ? `${current.examSession} · ${current.examCode} · original uploaded PDFs`
              : `Official IB specimen · ${current.syllabusFirstAssessment} syllabus · Higher level`
          }
          wide
          onClose={() => setViewer(null)}
        >
          <div className="paper-resource-viewer">
            <div className="paper-resource-tabs" role="tablist" aria-label="Paper document">
              <button
                role="tab"
                aria-selected={viewer.mode === 'questions'}
                aria-controls="official-paper-panel"
                className={viewer.mode === 'questions' ? 'active' : ''}
                onClick={() => setViewer({ ...viewer, mode: 'questions' })}
              >
                <BookOpen size={15} />
                Question paper
              </button>
              <button
                role="tab"
                aria-selected={viewer.mode === 'markScheme'}
                aria-controls="official-paper-panel"
                className={viewer.mode === 'markScheme' ? 'active' : ''}
                onClick={() => setViewer({ ...viewer, mode: 'markScheme' })}
              >
                <FileCheck2 size={15} />
                Mark scheme
              </button>
            </div>
            <div className="official-paper-meta">
              <span>
                Original PDF: pages {pages.firstPage}–{pages.lastPage} of{' '}
                {viewer.mode === 'markScheme'
                  ? (current.markSchemePdfPages ?? current.pdfPages)
                  : current.pdfPages}
              </span>
              <a
                href={paperDocumentUrl(current, viewer.mode)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open in a new tab
                <ArrowUpRight size={14} />
              </a>
            </div>
            <div
              id="official-paper-panel"
              role="tabpanel"
              aria-label={viewer.mode === 'questions' ? 'Question paper' : 'Mark scheme'}
            >
              <iframe
                key={`${current.id}-${viewer.mode}`}
                title={`${subjects[current.subject].short} ${current.paper} ${viewer.mode === 'questions' ? 'question paper' : 'mark scheme'}`}
                src={paperDocumentUrl(current, viewer.mode)}
              />
            </div>
            <p className="official-paper-viewer-note">
              {current.uploaded
                ? 'The preview shows the original uploaded question paper or its matched mark scheme, with the original pagination and diagrams.'
                : 'The preview loads IB’s original specimen document at the selected HL section. The complete file also contains other papers and SL sections.'}{' '}
              If your browser cannot display PDFs, use “Open in a new tab”.
            </p>
            <p className="official-paper-attribution">
              © International Baccalaureate Organization. Document source and matching page ranges
              checked {current.verifiedOn}.{' '}
              {current.uploaded
                ? 'May 2025 examination paper supplied by the user.'
                : 'This is a specimen, not a past examination sitting.'}
            </p>
          </div>
        </Modal>
      )}
    </section>
  );
}
