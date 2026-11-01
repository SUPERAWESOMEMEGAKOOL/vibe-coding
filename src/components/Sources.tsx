import { useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  BookOpen,
  Check,
  Download,
  ExternalLink,
  FileText,
  FolderOpen,
  Globe2,
  Info,
  Plus,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import type { Question, Subject } from '../types';
import { subjects } from '../data/syllabus';
import { deleteDocument, listDocuments, saveDocuments, type PaperDocument } from '../lib/documents';
import Modal from './Modal';
import PaperResources from './PaperResources';

export default function Sources({
  subject,
  questions,
  onImport,
  notify,
}: {
  subject: Subject;
  questions: Question[];
  onImport: () => void;
  notify: (message: string) => void;
}) {
  const [documents, setDocuments] = useState<PaperDocument[]>([]);
  const [kind, setKind] = useState<PaperDocument['kind']>('paper');
  const [year, setYear] = useState(2026);
  const [searchYear, setSearchYear] = useState('all');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<{ doc: PaperDocument; url: string } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    let active = true;
    listDocuments()
      .then((result) => {
        if (active) setDocuments(result);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (year < subjects[subject].firstAssessment) setYear(2026);
  }, [subject, year]);
  useEffect(() => setSearchYear('all'), [subject]);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview.url);
    },
    [preview],
  );
  async function upload(files: File[]) {
    if (!files.length) return;
    setBusy(true);
    setError('');
    try {
      await saveDocuments(files, subject, kind, year);
      setDocuments(await listDocuments());
      notify(
        `${files.length} ${files.length === 1 ? 'PDF added' : 'PDFs added'} to your source library`,
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  }
  async function remove(id: string) {
    try {
      await deleteDocument(id);
      setDocuments(documents.filter((doc) => doc.id !== id));
      setDeleteId(null);
      notify('PDF removed from your library');
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const ownQuestions = questions.filter((q) => q.subject === subject && q.source === 'past-paper');
  const files = documents.filter((doc) => doc.subject === subject);
  return (
    <div className="sources-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">YOUR REFERENCE SHELF</div>
          <h1>
            Good practice starts here<span>.</span>
          </h1>
          <p>Keep your papers, mark schemes, and question sources in one place.</p>
        </div>
        <span className="heading-illustration">
          <FolderOpen size={40} strokeWidth={1.2} />
        </span>
      </div>
      <div className="source-access-note">
        <Globe2 size={19} />
        <div>
          <strong>Real papers, with their sources</strong>
          <p>
            Your May 2025 Physics HL papers and matching mark schemes are available below. All 102
            questions are also organized by topic in the question bank. Math AA HL specimens are
            available here; Math past papers have not been uploaded yet.
          </p>
        </div>
      </div>
      <div className="resource-grid">
        <a
          className="resource-card ibresources-card"
          href="https://ibresources.cc/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="resource-icon">
            <FolderOpen size={23} />
          </span>
          <ExternalLink size={16} className="resource-arrow" />
          <span className="resource-label">YOUR REQUESTED PAPER SOURCE · LINK ONLY</span>
          <h3>ibresources.cc</h3>
          <p>
            Browse for more Math AA HL and Physics HL papers. Your uploaded Physics papers are
            already included in Folio. This external catalogue is a reference link; other papers on
            it have not been imported or verified.
          </p>
          <div className="source-syllabus-tags">
            <span>Math AA HL · 2021–2026</span>
            <span>Physics HL · 2025–2026</span>
          </div>
          <span className="resource-link">
            Open IB Resources
            <ArrowUpRight size={15} />
          </span>
        </a>
        <a
          className="resource-card"
          href="https://www.ibo.org/programmes/diploma-programme/assessment-and-exams/sample-exam-papers/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="resource-icon">
            <BookOpen size={23} />
          </span>
          <ExternalLink size={16} className="resource-arrow" />
          <span className="resource-label">INTERNATIONAL BACCALAUREATE</span>
          <h3>Official sample papers</h3>
          <p>Start with IB’s public specimen and sample examination resources.</p>
          <span className="resource-link">
            Visit IB resources <ArrowUpRight size={15} />
          </span>
        </a>
        <a
          className="resource-card"
          href={
            subject === 'math'
              ? 'https://www.ibo.org/contentassets/5895a05412144fe890312bad52b17044/subject-brief-dp-math-analysis-and-approaches-en.pdf'
              : 'https://www.ibo.org/globalassets/new-structure/recognition/pdfs/dp_sciences_physics_subject-brief_jan_2022_e.pdf'
          }
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="resource-icon green">
            <FileText size={23} />
          </span>
          <ExternalLink size={16} className="resource-arrow" />
          <span className="resource-label">VERIFIED IB SUBJECT BRIEF · FOR 2026 EXAMS</span>
          <h3>{subjects[subject].short} syllabus</h3>
          <p>
            {subject === 'math'
              ? 'First assessments for SL and HL: 2021. The newer syllabus first assessed in 2029 does not apply to your 2026 exams.'
              : 'First assessment: 2025. Use the current A–E themes and Paper 1A, Paper 1B, and Paper 2 format.'}
          </p>
          <span className="resource-link">
            Open the current syllabus brief <ArrowUpRight size={15} />
          </span>
        </a>
      </div>
      <PaperResources subject={subject} />
      <div className="web-search-card">
        <div className="web-search-heading">
          <Search size={20} />
          <div>
            <h3>Find current-syllabus papers</h3>
            <p>Search for question papers and matching mark schemes by subject and year.</p>
          </div>
        </div>
        <div className="web-search-controls">
          <label>
            Exam year
            <select
              aria-label="Search exam year"
              value={searchYear}
              onChange={(e) => setSearchYear(e.target.value)}
            >
              <option value="all">{subjects[subject].firstAssessment}–2026</option>
              {Array.from(
                { length: 2027 - subjects[subject].firstAssessment },
                (_, i) => 2026 - i,
              ).map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
          </label>
          <a
            className="button secondary"
            href={`https://www.google.com/search?q=${encodeURIComponent(`IB ${subject === 'math' ? 'mathematics analysis approaches AA HL' : 'physics HL current syllabus'} ${searchYear === 'all' ? `${subjects[subject].firstAssessment} 2026` : searchYear} past papers mark schemes PDF`)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Search the web
            <ArrowUpRight size={14} />
          </a>
          <a
            className="button secondary"
            href={`https://www.google.com/search?q=${encodeURIComponent(`site:ibo.org ${subject === 'math' ? 'mathematics analysis approaches higher level 2021' : 'physics higher level 2025'} specimen papers markscheme PDF`)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Find IB specimens
            <ArrowUpRight size={14} />
          </a>
        </div>
        <p className="web-search-note">
          Search links open in a new tab. Results are not verified or imported automatically. Check
          the syllabus, session, time zone, and matching mark scheme before adding a paper.
        </p>
      </div>
      <div className="section-heading">
        <div>
          <h2>
            Your PDF library <span>{files.length}</span>
          </h2>
          <p>Reference files are stored in this browser, on this device.</p>
        </div>
      </div>
      <div className="pdf-upload-card">
        <div className="pdf-upload-copy">
          <span className="upload-icon">
            <Upload size={23} />
          </span>
          <div>
            <h3>Bring your own past papers</h3>
            <p>Upload question papers and matching mark schemes as PDFs.</p>
          </div>
        </div>
        <div className="pdf-upload-controls">
          <label>
            Document type
            <select
              aria-label="PDF document type"
              value={kind}
              onChange={(e) => setKind(e.target.value as PaperDocument['kind'])}
            >
              <option value="paper">Question paper</option>
              <option value="mark-scheme">Mark scheme</option>
            </select>
          </label>
          <label>
            Exam year
            <select
              aria-label="PDF exam year"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {Array.from(
                { length: 2027 - subjects[subject].firstAssessment },
                (_, i) => 2026 - i,
              ).map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
          </label>
          <input
            type="file"
            accept="application/pdf,.pdf"
            multiple
            hidden
            ref={input}
            onChange={(e) => upload(Array.from(e.target.files ?? []))}
          />
          <button className="button primary" onClick={() => input.current?.click()} disabled={busy}>
            <Plus size={16} />
            {busy ? 'Saving…' : 'Upload PDFs'}
          </button>
        </div>
        <p className="pdf-upload-note">
          <Info size={14} />
          PDFs are reference files, not automatically extracted questions. Add or import each
          question to tag its topic and attach its answer. Maximum 25 MB per file.
        </p>
      </div>
      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}
      <div className="document-list">
        {loading ? (
          <p className="loading-text">Opening your library…</p>
        ) : files.length ? (
          files.map((doc) => (
            <div className="document-row" key={doc.id}>
              <span className={`document-icon ${doc.kind}`}>
                <FileText size={22} />
              </span>
              <div>
                <strong>{doc.name}</strong>
                <span>
                  {doc.year} · {doc.kind === 'paper' ? 'Question paper' : 'Mark scheme'} ·{' '}
                  {(doc.size / 1024 / 1024).toFixed(1)} MB
                </span>
              </div>
              <button
                className="button secondary small"
                onClick={() => setPreview({ doc, url: URL.createObjectURL(doc.file) })}
              >
                Open PDF <ArrowUpRight size={14} />
              </button>
              {deleteId === doc.id ? (
                <div className="delete-confirm">
                  <button onClick={() => remove(doc.id)}>Delete</button>
                  <button onClick={() => setDeleteId(null)}>Cancel</button>
                </div>
              ) : (
                <button
                  className="icon-button"
                  aria-label={`Delete ${doc.name}`}
                  onClick={() => setDeleteId(doc.id)}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="empty-documents">
            <FolderOpen size={25} />
            <span>Your {subjects[subject].short} papers will feel right at home here.</span>
          </div>
        )}
      </div>
      <div className="source-question-cta">
        <span className="resource-icon green">
          <Check size={22} />
        </span>
        <div>
          <h3>Turn a paper into focused practice</h3>
          <p>
            {ownQuestions.length
              ? `${ownQuestions.length} past-paper questions added for ${subjects[subject].short}. `
              : ''}
            Add question text, its topic, the answer, and marking points to your bank.
          </p>
        </div>
        <button className="button secondary" onClick={onImport}>
          <Plus size={15} />
          Add questions
        </button>
      </div>
      {preview && (
        <Modal
          title={preview.doc.name}
          subtitle={`${preview.doc.year} · ${subjects[preview.doc.subject].short}`}
          onClose={() => setPreview(null)}
          wide
        >
          <div className="pdf-preview">
            <iframe title={preview.doc.name} src={preview.url} />
            <p>If your browser cannot display PDFs, download the file to view it.</p>
            <a className="button primary" href={preview.url} download={preview.doc.name}>
              <Download size={16} />
              Download PDF
            </a>
          </div>
        </Modal>
      )}
    </div>
  );
}
