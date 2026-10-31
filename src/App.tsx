import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Atom,
  BookMarked,
  BookHeart,
  BookOpen,
  Bookmark,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  Download,
  FileCheck2,
  FilePlus2,
  FileText,
  FolderOpen,
  GraduationCap,
  Grid2X2,
  Leaf,
  ListFilter,
  Menu,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import type { AppState, PracticePaper, Question, ReviewNote, Subject, View } from './types';
import { subjects, topics, getTopic } from './data/syllabus';
import { starterQuestions } from './data/questions';
import { downloadJson, filterQuestions, paperTotals } from './lib/questions';
import { loadState, STORAGE_KEY } from './lib/storage';
import { getProgress, recordAttempt } from './lib/progress';
import QuestionCard from './components/QuestionCard';
import ImportModal from './components/ImportModal';
import PaperModal from './components/PaperModal';
import PrintPaper, { type PrintDocument } from './components/PrintPaper';
import Sources from './components/Sources';
import Modal from './components/Modal';
import { FeedbackPage, MistakesPage } from './components/ProgressPages';

const viewNames: Record<View, string> = {
  bank: 'Question bank',
  saved: 'Saved questions',
  papers: 'My papers',
  sources: 'Source library',
  syllabus: 'Syllabus guide',
  mistakes: 'Mistake notebook',
  feedback: 'Feedback',
};
const PAGE_SIZE = 5;

function HeroArt() {
  return (
    <svg className="hero-art" viewBox="0 0 360 238" fill="none" aria-hidden="true">
      <circle cx="202" cy="123" r="90" fill="#f0e5d8" />
      <circle cx="202" cy="123" r="111" stroke="#e1d7cb" strokeDasharray="3 7" />
      <path d="m280 42 4 12 12 4-12 4-4 12-4-12-12-4 12-4z" fill="#ad9478" />
      <path d="m90 179 3 9 9 3-9 3-3 9-3-9-9-3 9-3z" fill="#ad9478" />
      <rect
        x="149"
        y="45"
        width="126"
        height="157"
        rx="9"
        transform="rotate(12 149 45)"
        fill="#d5c6b4"
        stroke="#cebca7"
      />
      <rect
        x="119"
        y="37"
        width="126"
        height="157"
        rx="9"
        transform="rotate(-9 119 37)"
        fill="#fefdf9"
        stroke="#cdbaa5"
      />
      <path d="m131 62 77-12M134 72l52-8" stroke="#dccfc1" strokeWidth="3" strokeLinecap="round" />
      <path
        d="m143 98 5 4 7-11"
        stroke="#b0987d"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m165 95 51-8M146 121l5 4 7-11M169 118l51-8M149 144l5 4 7-11M172 141l51-8"
        stroke="#cdbba7"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect
        x="199"
        y="138"
        width="77"
        height="56"
        rx="9"
        transform="rotate(8 199 138)"
        fill="#dee8d2"
        stroke="#aebda1"
      />
      <path
        d="m220 166 9 11 22-20"
        stroke="#81916e"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="m273 104 29-28" stroke="#b8a38c" strokeWidth="9" strokeLinecap="round" />
      <path d="m271 106-5 12 12-5" fill="#b8a38c" />
      <circle cx="99" cy="69" r="5" fill="#d0bb99" />
      <circle cx="307" cy="158" r="4" fill="#c4b39f" />
    </svg>
  );
}

export default function App() {
  const [state, setState] = useState<AppState>(loadState);
  const [view, setView] = useState<View>('bank');
  const [topic, setTopic] = useState('all');
  const [subtopic, setSubtopic] = useState('all');
  const [questionType, setQuestionType] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [source, setSource] = useState('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('recommended');
  const [page, setPage] = useState(1);
  const [moreFilters, setMoreFilters] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [paperOpen, setPaperOpen] = useState(false);
  const [activePaper, setActivePaper] = useState<PracticePaper | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [toast, setToast] = useState('');
  const [storageError, setStorageError] = useState(false);
  const [deletePaper, setDeletePaper] = useState<string | null>(null);
  const [printDocument, setPrintDocument] = useState<PrintDocument | null>(null);
  const [reviewIds, setReviewIds] = useState<string[] | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const subject = state.subject;
  const subjectInfo = subjects[subject];
  const allQuestions = useMemo(
    () => [...state.customQuestions, ...starterQuestions],
    [state.customQuestions],
  );
  const subjectQuestions = useMemo(
    () => allQuestions.filter((q) => q.subject === subject),
    [allQuestions, subject],
  );
  const bookmarks = subjectQuestions.filter((q) => state.bookmarks.includes(q.id));
  const selection = state.selected
    .map((id) => allQuestions.find((q) => q.id === id))
    .filter((q): q is Question => !!q && q.subject === subject);
  const totals = paperTotals(selection);
  const subjectPapers = state.papers.filter((p) => p.subject === subject);
  const progress = useMemo(
    () => getProgress(allQuestions, state.history, subject),
    [allQuestions, state.history, subject],
  );
  const attempts = progress.events;
  const correct = progress.correct;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [state]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 4000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    setPage(1);
  }, [topic, subtopic, questionType, difficulty, source, query, sort, view, subject]);
  useEffect(() => {
    if (!printDocument) return;
    const oldTitle = document.title;
    document.title = `${printDocument.name} — ${printDocument.mode === 'questions' ? 'Questions' : 'Mark scheme'}`;
    const timer = setTimeout(() => window.print(), 150);
    return () => {
      clearTimeout(timer);
      document.title = oldTitle;
    };
  }, [printDocument]);
  useEffect(() => {
    const done = () => setPrintDocument(null);
    window.addEventListener('afterprint', done);
    return () => window.removeEventListener('afterprint', done);
  }, []);

  const notify = useCallback((message: string) => setToast(message), []);
  const closeImport = useCallback(() => setImportOpen(false), []);
  const closePaper = useCallback(() => {
    setPaperOpen(false);
    setActivePaper(null);
  }, []);
  const closeHelp = useCallback(() => setHelpOpen(false), []);
  const resetFilters = () => {
    setTopic('all');
    setSubtopic('all');
    setQuestionType('all');
    setDifficulty('all');
    setSource('all');
    setQuery('');
  };
  function switchSubject(next: Subject) {
    setState((s) => ({ ...s, subject: next }));
    resetFilters();
    setMobileNav(false);
    setReviewIds(null);
  }
  function navigate(next: View) {
    setView(next);
    resetFilters();
    setMobileNav(false);
    window.scrollTo({ top: 0 });
    setReviewIds(null);
  }
  function startReview(questions: Question[]) {
    navigate('bank');
    const ids = questions.map((q) => q.id);
    setReviewIds(ids);
    setState((s) => {
      const next = { ...s.attempts };
      ids.forEach((id) => delete next[id]);
      return { ...s, attempts: next };
    });
  }
  function practiseTopic(topicId: string) {
    navigate('bank');
    setTopic(topicId);
  }
  function saveReviewNote(questionId: string, note: ReviewNote) {
    setState((s) => ({ ...s, reviewNotes: { ...s.reviewNotes, [questionId]: note } }));
    notify('Reflection saved. A little insight for next time.');
  }
  function logAttempt(question: Question, correct: boolean, choice?: number) {
    setState((s) =>
      s.attempts[question.id] ? s : recordAttempt(s, question, { correct, choice }),
    );
  }
  function toggleBookmark(id: string) {
    const exists = state.bookmarks.includes(id);
    setState((s) => ({
      ...s,
      bookmarks: exists ? s.bookmarks.filter((item) => item !== id) : [...s.bookmarks, id],
    }));
    notify(exists ? 'Question removed from saved' : 'Question saved for a little later');
  }
  function toggleSelected(id: string) {
    setState((s) => ({
      ...s,
      selected: s.selected.includes(id)
        ? s.selected.filter((item) => item !== id)
        : [...s.selected, id],
    }));
  }
  function updateSelection(ids: string[]) {
    const otherIds = state.selected.filter((id) => !subjectQuestions.some((q) => q.id === id));
    setState((s) => ({ ...s, selected: [...otherIds, ...ids] }));
  }
  function importQuestions(questions: Question[]) {
    const existing = new Set(
      allQuestions.map((q) => `${q.subject}:${q.topicId}:${q.prompt.trim()}`),
    );
    const added = questions.filter((q) => {
      const key = `${q.subject}:${q.topicId}:${q.prompt.trim()}`;
      if (existing.has(key)) return false;
      existing.add(key);
      return true;
    });
    if (!added.length) {
      notify('These questions are already in your bank. Nothing duplicated.');
      setImportOpen(false);
      return;
    }
    setState((s) => ({
      ...s,
      customQuestions: [...added, ...s.customQuestions],
      subject: added[0].subject,
    }));
    setImportOpen(false);
    setView('bank');
    resetFilters();
    notify(
      `${added.length} ${added.length === 1 ? 'question added' : 'questions added'}${questions.length > added.length ? ` · ${questions.length - added.length} duplicates skipped` : ''}`,
    );
  }
  function savePaper(name: string) {
    if (!selection.length) return;
    const paper: PracticePaper = {
      id: crypto.randomUUID(),
      name,
      subject,
      questions: selection,
      createdAt: new Date().toISOString(),
    };
    setState((s) => ({
      ...s,
      papers: [paper, ...s.papers],
      selected: s.selected.filter((id) => !selection.some((q) => q.id === id)),
    }));
    setPaperOpen(false);
    navigate('papers');
    notify('Your paper is saved. A little progress, made.');
  }
  const filters = { subject, topic, subtopic, type: questionType, difficulty, source, query, sort };
  const filtered = filterQuestions(
    view === 'saved'
      ? bookmarks
      : reviewIds
        ? allQuestions.filter((q) => reviewIds.includes(q.id))
        : allQuestions,
    filters,
  );
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const visibleQuestions = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const activeFilterCount = [topic, subtopic, questionType, difficulty, source].filter(
    (v) => v !== 'all',
  ).length;
  const anyFilters = activeFilterCount > 0 || !!query;
  const topicCounts = topics[subject].map((t) => ({
    ...t,
    count: subjectQuestions.filter((q) => q.topicId === t.id).length,
  }));

  return (
    <>
      <div className={`app-shell ${mobileNav ? 'nav-open' : ''}`}>
        {mobileNav && (
          <button
            className="sidebar-backdrop"
            aria-label="Close navigation"
            onClick={() => setMobileNav(false)}
          />
        )}
        <aside className="sidebar">
          <button className="brand" onClick={() => navigate('bank')} aria-label="Folio home">
            <span className="brand-mark">
              <BookOpen size={21} strokeWidth={1.7} />
            </span>
            <span>
              folio<span className="brand-period">.</span>
            </span>
          </button>
          <span className="brand-caption">YOUR IB STUDY SPACE</span>
          <div className="subject-picker">
            <label htmlFor="subject-picker">YOUR SUBJECT</label>
            <div className="subject-picker-control">
              <span className={`subject-symbol ${subject}`}>
                {subject === 'math' ? <span>ƒ</span> : <Atom size={21} />}
              </span>
              <select
                id="subject-picker"
                value={subject}
                onChange={(e) => switchSubject(e.target.value as Subject)}
              >
                <option value="math">Math AA HL</option>
                <option value="physics">Physics HL</option>
              </select>
              <ChevronDown size={14} />
            </div>
            <span className="subject-level">
              Higher level <span>·</span> 2026 exams
            </span>
          </div>
          <div className="nav-caption">YOUR WORKSPACE</div>
          <nav aria-label="Main navigation">
            <button
              className={`nav-item ${view === 'bank' ? 'active' : ''}`}
              onClick={() => navigate('bank')}
            >
              <Grid2X2 size={18} />
              <span>Question bank</span>
              <span className="nav-count">{subjectQuestions.length}</span>
            </button>
            <button
              className={`nav-item ${view === 'papers' ? 'active' : ''}`}
              onClick={() => navigate('papers')}
            >
              <FileText size={18} />
              <span>My papers</span>
              {subjectPapers.length > 0 && (
                <span className="nav-count">{subjectPapers.length}</span>
              )}
            </button>
            <button
              className={`nav-item ${view === 'saved' ? 'active' : ''}`}
              onClick={() => navigate('saved')}
            >
              <Bookmark size={18} />
              <span>Saved questions</span>
              {bookmarks.length > 0 && <span className="nav-count">{bookmarks.length}</span>}
            </button>
            <div className="nav-divider" />
            <div className="nav-caption">YOUR LEARNING JOURNEY</div>
            <button
              className={`nav-item ${view === 'mistakes' ? 'active' : ''}`}
              onClick={() => navigate('mistakes')}
            >
              <BookHeart size={18} />
              <span>Mistake notebook</span>
              {progress.needsPractice > 0 && (
                <span className="nav-count">{progress.needsPractice}</span>
              )}
            </button>
            <button
              className={`nav-item ${view === 'feedback' ? 'active' : ''}`}
              onClick={() => navigate('feedback')}
            >
              <TrendingUp size={18} />
              <span>Feedback</span>
            </button>
            <div className="nav-divider" />
            <div className="nav-caption">A LITTLE EXTRA HELP</div>
            <button
              className={`nav-item ${view === 'sources' ? 'active' : ''}`}
              onClick={() => navigate('sources')}
            >
              <FolderOpen size={18} />
              <span>Source library</span>
            </button>
            <button
              className={`nav-item ${view === 'syllabus' ? 'active' : ''}`}
              onClick={() => navigate('syllabus')}
            >
              <BookMarked size={18} />
              <span>Syllabus guide</span>
            </button>
          </nav>
          <div className="sidebar-bottom">
            <div className="encouragement">
              <span>
                <Leaf size={20} />
              </span>
              <p>
                A little every day.<small>That’s how big things happen.</small>
              </p>
              <svg viewBox="0 0 70 50" aria-hidden="true">
                <path
                  d="M30 48Q40 25 56 6M38 32Q13 32 19 17Q37 18 38 32M46 21Q46 3 60 4Q64 17 46 21"
                  fill="none"
                  stroke="#abb69e"
                  strokeWidth="1.5"
                />
              </svg>
            </div>
            <button className="workspace-status" onClick={() => setHelpOpen(true)}>
              <span className="status-dot" />
              Saved on this device
              <CircleHelp size={13} />
            </button>
          </div>
        </aside>
        <div className="main-shell">
          <header className="topbar">
            <div className="breadcrumbs">
              <button
                className="mobile-menu icon-button"
                aria-label="Open navigation"
                onClick={() => setMobileNav(true)}
              >
                <Menu size={21} />
              </button>
              <span>Your workspace</span>
              <ChevronRight size={13} />
              <strong>{viewNames[view]}</strong>
            </div>
            <div className="topbar-actions">
              <span className="exam-badge">
                <span />
                2026 exam prep
              </span>
              <button
                className="icon-button help-button"
                aria-label="About your workspace"
                onClick={() => setHelpOpen(true)}
              >
                <CircleHelp size={18} />
              </button>
              <button
                className="profile-button"
                aria-label="Your local workspace"
                onClick={() => setHelpOpen(true)}
              >
                S
              </button>
            </div>
          </header>
          <main>
            {storageError && (
              <div className="storage-warning" role="alert">
                Your browser could not save this workspace. Export your questions and papers before
                closing this tab.
                <button onClick={() => downloadJson(state, 'folio-workspace-backup.json')}>
                  Export backup <Download size={14} />
                </button>
              </div>
            )}
            {(view === 'bank' || view === 'saved') && (
              <>
                {view === 'bank' ? (
                  <>
                    <section className="welcome-banner">
                      <div className="welcome-copy">
                        <div className="hero-eyebrow">
                          <span />A FRESH PAGE, EVERY DAY
                        </div>
                        <h1>
                          A little practice.
                          <br />A lot of possibility<span>.</span>
                        </h1>
                        <p>
                          Your topics. Your pace. Your next breakthrough.
                          <br className="desktop-break" /> Let’s make this study session count.
                        </p>
                        <span className="hero-subject">
                          <GraduationCap size={15} />
                          {subjectInfo.short}
                          <span>·</span>For 2026 exams
                        </span>
                      </div>
                      <HeroArt />
                    </section>
                    <div className="workspace-stats">
                      <div>
                        <span className="stat-icon oat">
                          <BookOpen size={18} />
                        </span>
                        <p>
                          <strong>{subjectQuestions.length}</strong> questions to explore
                        </p>
                      </div>
                      <div>
                        <span className="stat-icon sage">
                          <Grid2X2 size={17} />
                        </span>
                        <p>
                          <strong>5</strong> topics to discover
                        </p>
                      </div>
                      <button onClick={() => navigate('saved')}>
                        <span className="stat-icon peach">
                          <Bookmark size={17} />
                        </span>
                        <p>
                          <strong>{bookmarks.length}</strong> saved for later
                        </p>
                        <ArrowUpRight size={14} />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="page-heading">
                    <div>
                      <div className="eyebrow">WORTH COMING BACK TO</div>
                      <h1>
                        A little later, a little wiser<span>.</span>
                      </h1>
                      <p>Your saved {subjectInfo.short} questions, ready whenever you are.</p>
                    </div>
                    <span className="heading-illustration">
                      <Bookmark size={38} strokeWidth={1.2} />
                    </span>
                  </div>
                )}
                {reviewIds && (
                  <div className="review-session-banner">
                    <BookHeart size={20} />
                    <div>
                      <strong>Back for a little practice.</strong>
                      <p>
                        Revisiting {reviewIds.length}{' '}
                        {reviewIds.length === 1 ? 'question' : 'questions'} from your notebook.
                        Earlier attempts stay recorded.
                      </p>
                    </div>
                    <button
                      className="button secondary small"
                      onClick={() => {
                        setReviewIds(null);
                        resetFilters();
                      }}
                    >
                      End review
                      <X size={13} />
                    </button>
                  </div>
                )}
                <div className="bank-layout">
                  <div className="question-bank" ref={resultsRef}>
                    <div className="section-heading bank-heading">
                      <div>
                        <h2>
                          {view === 'saved' ? 'Saved questions' : 'Find your next question'}{' '}
                          <span>
                            {view === 'saved' ? bookmarks.length : subjectQuestions.length}
                          </span>
                        </h2>
                        <p>A topic to focus on. A good place to start.</p>
                      </div>
                      <button
                        className="button secondary import-button"
                        onClick={() => setImportOpen(true)}
                      >
                        <Plus size={15} />
                        Add questions
                      </button>
                    </div>
                    <div className="filter-panel">
                      <div className="search-field">
                        <Search size={17} />
                        <input
                          aria-label="Search questions"
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Search a concept, keyword, or question…"
                        />
                        {query && (
                          <button
                            className="icon-button"
                            onClick={() => setQuery('')}
                            aria-label="Clear search"
                          >
                            <X size={15} />
                          </button>
                        )}
                        <span className="search-hint">Find your focus</span>
                      </div>
                      <div className="filter-row">
                        <label className="filter-select">
                          <Grid2X2 size={14} />
                          <select
                            aria-label="Filter by topic"
                            value={topic}
                            onChange={(e) => {
                              setTopic(e.target.value);
                              setSubtopic('all');
                            }}
                          >
                            <option value="all">All topics</option>
                            {topics[subject].map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.code}. {t.name}
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={13} />
                        </label>
                        <label className="filter-select">
                          <FileText size={14} />
                          <select
                            aria-label="Filter by question type"
                            value={questionType}
                            onChange={(e) => setQuestionType(e.target.value)}
                          >
                            <option value="all">All question types</option>
                            <option value="structured">Structured</option>
                            {subject === 'physics' && <option value="mcq">Multiple choice</option>}
                          </select>
                          <ChevronDown size={13} />
                        </label>
                        <label className="filter-select">
                          <SlidersHorizontal size={14} />
                          <select
                            aria-label="Filter by difficulty"
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value)}
                          >
                            <option value="all">All difficulties</option>
                            <option>Foundation</option>
                            <option>Standard</option>
                            <option>Challenge</option>
                          </select>
                          <ChevronDown size={13} />
                        </label>
                        <button
                          className={`more-filters ${moreFilters ? 'active' : ''}`}
                          onClick={() => setMoreFilters(!moreFilters)}
                          aria-expanded={moreFilters}
                        >
                          <ListFilter size={15} />
                          <span>More</span>
                          {activeFilterCount > 0 && <b>{activeFilterCount}</b>}
                        </button>
                      </div>
                      {moreFilters && (
                        <div className="advanced-filters">
                          <label>
                            Subtopic
                            <select
                              aria-label="Filter by subtopic"
                              value={subtopic}
                              onChange={(e) => setSubtopic(e.target.value)}
                            >
                              <option value="all">All subtopics</option>
                              {(topic === 'all'
                                ? topics[subject].flatMap((t) => t.subtopics)
                                : (topics[subject].find((t) => t.id === topic)?.subtopics ?? [])
                              ).map((t) => (
                                <option key={t}>{t}</option>
                              ))}
                            </select>
                          </label>
                          <label>
                            Source
                            <select
                              aria-label="Filter by source"
                              value={source}
                              onChange={(e) => setSource(e.target.value)}
                            >
                              <option value="all">All sources</option>
                              <option value="original">Original practice</option>
                              <option value="past-paper">Past-paper questions</option>
                            </select>
                          </label>
                        </div>
                      )}
                    </div>
                    <div className="topic-chips" aria-label="Quick topic filters">
                      <button
                        className={topic === 'all' ? 'active' : ''}
                        onClick={() => {
                          setTopic('all');
                          setSubtopic('all');
                        }}
                      >
                        All topics
                      </button>
                      {topicCounts.map((t) => (
                        <button
                          key={t.id}
                          className={topic === t.id ? 'active' : ''}
                          onClick={() => {
                            setTopic(t.id);
                            setSubtopic('all');
                          }}
                        >
                          {t.shortName}
                          <span>{t.count}</span>
                        </button>
                      ))}
                    </div>
                    <div className="results-toolbar">
                      <p>
                        <strong>{filtered.length}</strong>{' '}
                        {filtered.length === 1 ? 'question' : 'questions'}
                        {anyFilters ? ' found' : ' to get you thinking'}
                        {anyFilters && (
                          <button className="clear-filters" onClick={resetFilters}>
                            Clear filters <X size={11} />
                          </button>
                        )}
                      </p>
                      <label className="sort-control">
                        <span>Sort by:</span>
                        <select
                          aria-label="Sort questions"
                          value={sort}
                          onChange={(e) => setSort(e.target.value)}
                        >
                          <option value="recommended">Recommended</option>
                          <option value="marks">Marks: low to high</option>
                          <option value="difficulty">Difficulty: low to high</option>
                          <option value="newest">Newest papers</option>
                        </select>
                        <ChevronDown size={12} />
                      </label>
                    </div>
                    <div className="questions-list">
                      {visibleQuestions.map((q, index) => (
                        <QuestionCard
                          key={q.id}
                          question={q}
                          index={(currentPage - 1) * PAGE_SIZE + index}
                          bookmarked={state.bookmarks.includes(q.id)}
                          selected={state.selected.includes(q.id)}
                          attempt={state.attempts[q.id]}
                          onBookmark={() => toggleBookmark(q.id)}
                          onSelect={() => toggleSelected(q.id)}
                          onAnswer={(choice) => logAttempt(q, choice === q.correctOption, choice)}
                          onAssess={(correct) => logAttempt(q, correct)}
                          onRetry={() =>
                            setState((s) => {
                              const next = { ...s.attempts };
                              delete next[q.id];
                              return { ...s, attempts: next };
                            })
                          }
                        />
                      ))}
                    </div>
                    {!filtered.length && (
                      <div className="empty-state">
                        <span className="empty-icon">
                          {view === 'saved' && !bookmarks.length ? (
                            <Bookmark size={27} />
                          ) : (
                            <Search size={27} />
                          )}
                        </span>
                        <h3>
                          {view === 'saved' && !bookmarks.length
                            ? 'Keep the good questions close'
                            : 'A fresh search might help'}
                        </h3>
                        <p>
                          {view === 'saved' && !bookmarks.length
                            ? 'Tap the bookmark on a question to save it for your next session.'
                            : source === 'past-paper'
                              ? 'No past-paper questions have been added for these filters. Add your own questions or explore the original practice bank.'
                              : 'No questions match these filters. Try another topic or broaden your search.'}
                        </p>
                        <button
                          className="button primary"
                          onClick={() => {
                            if (view === 'saved' && !bookmarks.length) navigate('bank');
                            else resetFilters();
                          }}
                        >
                          {view === 'saved' && !bookmarks.length
                            ? 'Explore the question bank'
                            : 'Clear filters'}
                          <ArrowRight size={15} />
                        </button>
                        {source === 'past-paper' && (
                          <button className="text-button" onClick={() => setImportOpen(true)}>
                            <Plus size={14} />
                            Add past-paper questions
                          </button>
                        )}
                      </div>
                    )}
                    {filtered.length > PAGE_SIZE && (
                      <div className="pagination">
                        <p>
                          Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                          {Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
                        </p>
                        <div>
                          <button
                            className="page-arrow"
                            disabled={currentPage === 1}
                            aria-label="Previous page"
                            onClick={() => {
                              setPage(currentPage - 1);
                              resultsRef.current?.scrollIntoView({
                                behavior: 'smooth',
                                block: 'start',
                              });
                            }}
                          >
                            <ChevronLeft size={16} />
                          </button>
                          {Array.from({ length: pages }, (_, i) => i + 1)
                            .filter((p) => p === 1 || p === pages || Math.abs(p - currentPage) <= 1)
                            .map((p, i, arr) => (
                              <span className="page-item" key={p}>
                                {i > 0 && p - arr[i - 1] > 1 && <span>…</span>}
                                <button
                                  className={p === currentPage ? 'active' : ''}
                                  aria-label={`Page ${p}`}
                                  aria-current={p === currentPage ? 'page' : undefined}
                                  onClick={() => {
                                    setPage(p);
                                    resultsRef.current?.scrollIntoView({
                                      behavior: 'smooth',
                                      block: 'start',
                                    });
                                  }}
                                >
                                  {p}
                                </button>
                              </span>
                            ))}
                          <button
                            className="page-arrow"
                            disabled={currentPage === pages}
                            aria-label="Next page"
                            onClick={() => {
                              setPage(currentPage + 1);
                              resultsRef.current?.scrollIntoView({
                                behavior: 'smooth',
                                block: 'start',
                              });
                            }}
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                    <p className="bank-footnote">
                      <span className="tiny-flower">✳</span>A little progress is still progress.
                      You’ve got this.
                    </p>
                  </div>
                  <aside className="study-rail">
                    <div className="paper-builder">
                      <div className="builder-top">
                        <span className="builder-icon">
                          <FilePlus2 size={21} strokeWidth={1.5} />
                        </span>
                        <span className="mini-pill">MAKE IT YOURS</span>
                      </div>
                      <h3>Your next practice paper</h3>
                      <p>
                        Pick the questions. Set the pace.
                        <br />
                        Build a paper around you.
                      </p>
                      <div className={`paper-stack ${selection.length ? 'has-questions' : ''}`}>
                        <div className="stack-back" />
                        <div className="stack-front">
                          <span className="stack-line long" />
                          <span className="stack-line" />
                          <span className="stack-line short" />
                          {selection.length ? (
                            <span className="stack-selection">
                              <Check size={13} />
                              {selection.length} selected
                            </span>
                          ) : (
                            <span className="stack-plus">
                              <Plus size={16} />
                            </span>
                          )}
                        </div>
                      </div>
                      {selection.length > 0 ? (
                        <div className="builder-selected">
                          {selection.slice(0, 3).map((q, i) => (
                            <div key={q.id}>
                              <span>{i + 1}</span>
                              <p>{q.subtopic}</p>
                              <button
                                className="icon-button"
                                aria-label={`Remove ${q.subtopic} from paper`}
                                onClick={() => toggleSelected(q.id)}
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                          {selection.length > 3 && (
                            <p className="more-selected">+ {selection.length - 3} more questions</p>
                          )}
                        </div>
                      ) : (
                        <div className="selection-placeholder">
                          A fresh page, waiting for
                          <br />
                          your first question.
                        </div>
                      )}
                      <div className="builder-totals">
                        <span>
                          <strong>{selection.length}</strong> questions
                        </span>
                        <span>
                          <strong>{totals.marks}</strong> marks
                        </span>
                        <span>
                          <strong>{totals.minutes}</strong> min
                        </span>
                      </div>
                      <button
                        className="button primary builder-button"
                        disabled={!selection.length}
                        onClick={() => setPaperOpen(true)}
                      >
                        {selection.length ? 'Review your paper' : 'Select questions to begin'}
                        <ArrowRight size={15} />
                      </button>
                      {selection.length > 0 ? (
                        <button className="builder-clear" onClick={() => updateSelection([])}>
                          Clear selection
                        </button>
                      ) : (
                        <span className="builder-tip">
                          Look for <Plus size={11} /> Add to paper
                        </span>
                      )}
                    </div>
                    <div className="session-card">
                      <span className="session-icon">
                        <Sparkles size={17} />
                      </span>
                      <h4>A little check-in</h4>
                      {attempts.length ? (
                        <>
                          <p>
                            <strong>
                              {correct} of {attempts.length}
                            </strong>{' '}
                            recorded attempts correct.
                            <br />
                            Every attempt is a step forward.
                          </p>
                          <div className="session-progress">
                            <span style={{ width: `${(correct / attempts.length) * 100}%` }} />
                          </div>
                        </>
                      ) : (
                        <p>
                          {subject === 'physics'
                            ? 'Try a multiple-choice question for instant feedback on your understanding.'
                            : 'Show your working first. Then open the explanation to connect the dots.'}
                        </p>
                      )}
                      <button
                        className="text-button session-feedback-link"
                        onClick={() => navigate('feedback')}
                      >
                        Your feedback
                        <ArrowRight size={13} />
                      </button>
                      <span>
                        {subject === 'physics'
                          ? 'Understanding over guessing.'
                          : 'Understanding over memorizing.'}
                      </span>
                    </div>
                    <button className="syllabus-link" onClick={() => navigate('syllabus')}>
                      <BookOpen size={17} />
                      <span>
                        In line with your syllabus
                        <small>
                          {subject === 'math'
                            ? 'First assessed 2021 · AA HL'
                            : 'First assessed 2025 · Physics HL'}
                        </small>
                      </span>
                      <ArrowUpRight size={14} />
                    </button>
                  </aside>
                </div>
              </>
            )}
            {view === 'papers' && (
              <div className="papers-page">
                <div className="page-heading">
                  <div>
                    <div className="eyebrow">PRACTICE, ON YOUR TERMS</div>
                    <h1>
                      A paper with your name on it<span>.</span>
                    </h1>
                    <p>Your custom {subjectInfo.short} practice papers and their mark schemes.</p>
                  </div>
                  <button className="button primary" onClick={() => navigate('bank')}>
                    <Plus size={16} />
                    Build a paper
                  </button>
                </div>
                <div className="paper-library-note">
                  <FileCheck2 size={19} />
                  <span>
                    Each paper includes a question-only version and a separate answer & mark scheme.
                    Print either one or save it as a PDF.
                  </span>
                </div>
                {subjectPapers.length ? (
                  <div className="papers-grid">
                    {subjectPapers.map((p) => {
                      const total = paperTotals(p.questions);
                      return (
                        <article className="saved-paper" key={p.id}>
                          <div className="saved-paper-top">
                            <span className="paper-cover-icon">
                              <FileText size={25} />
                            </span>
                            <span>
                              {new Date(p.createdAt).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          <span className="paper-subject-label">
                            {subjectInfo.short.toUpperCase()}
                          </span>
                          <h3>{p.name}</h3>
                          <div className="saved-paper-topics">
                            {[
                              ...new Set(
                                p.questions.map((q) => getTopic(q.subject, q.topicId)?.shortName),
                              ),
                            ].map((name) => (
                              <span key={name}>{name}</span>
                            ))}
                          </div>
                          <div className="saved-paper-stats">
                            <span>{p.questions.length} questions</span>
                            <span>{total.marks} marks</span>
                            <span>
                              <Clock3 size={12} />
                              {total.minutes} min
                            </span>
                          </div>
                          <div className="saved-paper-actions">
                            <button
                              className="button secondary"
                              onClick={() => {
                                setActivePaper(p);
                                setPaperOpen(true);
                              }}
                            >
                              Open paper
                              <ArrowUpRight size={15} />
                            </button>
                            {deletePaper === p.id ? (
                              <div className="delete-confirm">
                                <button
                                  onClick={() => {
                                    setState((s) => ({
                                      ...s,
                                      papers: s.papers.filter((item) => item.id !== p.id),
                                    }));
                                    setDeletePaper(null);
                                    notify('Practice paper deleted');
                                  }}
                                >
                                  Delete
                                </button>
                                <button onClick={() => setDeletePaper(null)}>Cancel</button>
                              </div>
                            ) : (
                              <button
                                className="icon-button"
                                aria-label={`Delete ${p.name}`}
                                onClick={() => setDeletePaper(p.id)}
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-state papers-empty">
                    <span className="empty-icon">
                      <FilePlus2 size={30} />
                    </span>
                    <h3>Your first paper starts with a question</h3>
                    <p>
                      Add questions from the bank, review your selection, and save a practice paper
                      that focuses on what you need.
                    </p>
                    <button className="button primary" onClick={() => navigate('bank')}>
                      Find some questions
                      <ArrowRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}
            {view === 'mistakes' && (
              <MistakesPage
                key={subject}
                subject={subject}
                progress={progress}
                notes={state.reviewNotes}
                onReview={startReview}
                onPracticeTopic={practiseTopic}
                onNavigate={navigate}
                onSaveNote={saveReviewNote}
              />
            )}
            {view === 'feedback' && (
              <FeedbackPage
                key={subject}
                subject={subject}
                progress={progress}
                notes={state.reviewNotes}
                onReview={startReview}
                onPracticeTopic={practiseTopic}
                onNavigate={navigate}
              />
            )}
            {view === 'sources' && (
              <Sources
                subject={subject}
                questions={allQuestions}
                onImport={() => setImportOpen(true)}
                notify={notify}
              />
            )}
            {view === 'syllabus' && (
              <div className="syllabus-page">
                <div className="page-heading">
                  <div>
                    <div className="eyebrow">THE BIG PICTURE</div>
                    <h1>
                      Know where you’re going<span>.</span>
                    </h1>
                    <p>A topic map for {subjectInfo.full}, for the 2026 examination sessions.</p>
                  </div>
                  <span className="heading-illustration">
                    <BookMarked size={38} strokeWidth={1.2} />
                  </span>
                </div>
                <div className="syllabus-notice">
                  <GraduationCap size={21} />
                  <div>
                    <strong>
                      {subjectInfo.short} · First assessment {subjectInfo.firstAssessment}
                    </strong>
                    <p>
                      {subject === 'physics'
                        ? 'The current Physics course uses themes A–E. Paper 1A is multiple choice, Paper 1B covers data-based and experimental work, and Paper 2 uses short-answer and extended-response questions. Pre-2025 papers require topic-by-topic compatibility checks.'
                        : 'The current Analysis & Approaches course has five topic areas. Paper 1 is without a calculator, Paper 2 uses a calculator, and HL Paper 3 contains extended problem-solving questions. Math AA examinations use structured questions.'}
                    </p>
                  </div>
                </div>
                <div className="syllabus-topic-list">
                  {topics[subject].map((t) => (
                    <article key={t.id}>
                      <div className="syllabus-topic-heading">
                        <span className={`syllabus-code topic-${t.id}`}>{t.code}</span>
                        <div>
                          <h3>{t.name}</h3>
                          <p>
                            {subjectQuestions.filter((q) => q.topicId === t.id).length} questions in
                            your bank
                          </p>
                        </div>
                        <button
                          className="button secondary small"
                          onClick={() => {
                            navigate('bank');
                            setTopic(t.id);
                          }}
                        >
                          Practice this topic
                          <ArrowRight size={14} />
                        </button>
                      </div>
                      <div className="subtopic-list">
                        {t.subtopics.map((name) => (
                          <button
                            key={name}
                            onClick={() => {
                              navigate('bank');
                              setTopic(t.id);
                              setSubtopic(name);
                            }}
                          >
                            <Check size={13} />
                            {name}
                            <ArrowUpRight size={12} />
                          </button>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
                <p className="syllabus-disclaimer">
                  This is a study navigation map with selected subtopics, not a complete syllabus
                  checklist. Confirm the detailed syllabus and assessment guidance with your teacher
                  and IB’s official course documents.
                </p>
                <button className="text-button" onClick={() => navigate('sources')}>
                  Open the source library
                  <ArrowUpRight size={15} />
                </button>
              </div>
            )}
            <footer className="app-footer">
              <span className="footer-logo">folio.</span>
              <span>A calmer corner of your IB journey.</span>
              <span>Made for small steps & big ideas.</span>
            </footer>
          </main>
        </div>
        {toast && (
          <div className="toast" role="status">
            <CheckCircle2 size={18} />
            <span>{toast}</span>
            <button aria-label="Dismiss notification" onClick={() => setToast('')}>
              <X size={15} />
            </button>
          </div>
        )}
        {importOpen && (
          <ImportModal subject={subject} onClose={closeImport} onImport={importQuestions} />
        )}
        {paperOpen && (
          <PaperModal
            questions={activePaper?.questions ?? selection}
            subject={activePaper?.subject ?? subject}
            saved={activePaper ?? undefined}
            onClose={closePaper}
            onSave={savePaper}
            onUpdate={activePaper ? undefined : updateSelection}
            onPrint={(mode, name) =>
              setPrintDocument({ mode, name, questions: activePaper?.questions ?? selection })
            }
          />
        )}
        {helpOpen && (
          <Modal
            title="A space for your next breakthrough"
            subtitle="Welcome to Folio, your personal IB practice workspace."
            onClose={closeHelp}
          >
            <div className="help-content">
              <div className="help-feature">
                <Grid2X2 size={21} />
                <div>
                  <h3>Find your focus</h3>
                  <p>
                    Choose Math AA HL or Physics HL, then filter by topic, question type, and
                    difficulty.
                  </p>
                </div>
              </div>
              <div className="help-feature">
                <CheckCircle2 size={21} />
                <div>
                  <h3>Check your understanding</h3>
                  <p>
                    Physics MCQs give instant feedback. Every question has an expandable answer,
                    explanation, and marking points. For structured questions, compare your working
                    with the mark scheme and log your result below the explanation.
                  </p>
                </div>
              </div>
              <div className="help-feature">
                <FileText size={21} />
                <div>
                  <h3>Make it your own</h3>
                  <p>
                    Add questions to a paper, put them in your preferred order, and print the
                    questions and mark scheme separately.
                  </p>
                </div>
              </div>
              <div className="help-feature">
                <BookHeart size={21} />
                <div>
                  <h3>Learn from every attempt</h3>
                  <p>
                    Find missed questions grouped by topic in your Mistake notebook. Successful
                    retries keep the original mistake and show your progress. Add a reflection, then
                    open Feedback for suggested topics and questions to revisit.
                  </p>
                </div>
              </div>
              <div className="form-note">
                <FolderOpen size={18} />
                <span>
                  Your questions, papers, attempts, and reflections are saved in this browser. PDFs
                  are stored separately in the local source library. They do not sync across
                  devices. Export important papers as JSON or PDF and keep copies of your original
                  files.
                </span>
              </div>
              <p className="help-source-note">
                The starter bank contains 30 original practice questions, not official IB past
                papers. Import your own source-attributed questions to expand it.
              </p>
              <button
                className="button secondary"
                onClick={() =>
                  downloadJson({ version: 1, questions: allQuestions }, 'folio-question-bank.json')
                }
              >
                <Download size={16} />
                Export my full question bank
              </button>
            </div>
            <div className="modal-footer">
              <button className="button primary" onClick={closeHelp}>
                Let’s get started
                <ArrowRight size={16} />
              </button>
            </div>
          </Modal>
        )}
      </div>
      <PrintPaper document={printDocument} />
    </>
  );
}
