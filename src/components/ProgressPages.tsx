import { useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  BookHeart,
  Check,
  CheckCircle2,
  ChevronDown,
  Coffee,
  Download,
  Leaf,
  RotateCcw,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { subjects } from '../data/syllabus';
import { downloadJson } from '../lib/questions';
import { getProgress, getReasonCounts, mistakeReasons, type MistakeEntry } from '../lib/progress';
import type { MistakeReason, Question, ReviewNote, Subject } from '../types';
import MathText from './MathText';

type Progress = ReturnType<typeof getProgress>;
interface Props {
  subject: Subject;
  progress: Progress;
  notes: Record<string, ReviewNote>;
  onReview: (questions: Question[]) => void;
  onPracticeTopic: (topicId: string) => void;
  onNavigate: (view: 'mistakes' | 'feedback' | 'bank') => void;
}

function ProgressTabs({
  active,
  onNavigate,
}: {
  active: 'mistakes' | 'feedback';
  onNavigate: Props['onNavigate'];
}) {
  return (
    <div className="progress-tabs" aria-label="Learning views">
      <button
        className={active === 'mistakes' ? 'active' : ''}
        aria-current={active === 'mistakes' ? 'page' : undefined}
        onClick={() => onNavigate('mistakes')}
      >
        <BookHeart size={15} />
        Mistake notebook
      </button>
      <button
        className={active === 'feedback' ? 'active' : ''}
        aria-current={active === 'feedback' ? 'page' : undefined}
        onClick={() => onNavigate('feedback')}
      >
        <TrendingUp size={15} />
        Your feedback
      </button>
    </div>
  );
}

function ProgressStats({ progress }: { progress: Progress }) {
  return (
    <div className="progress-stats">
      <div>
        <span>RECORDED ATTEMPTS</span>
        <strong>{progress.events.length}</strong>
        <p>Every try counts.</p>
      </div>
      <div>
        <span>FIRST-TRY ACCURACY</span>
        <strong>
          {progress.firstTryAccuracy === null ? '—' : `${progress.firstTryAccuracy}%`}
        </strong>
        <p>
          {progress.uniqueQuestions} unique{' '}
          {progress.uniqueQuestions === 1 ? 'question' : 'questions'} tried
        </p>
      </div>
      <div>
        <span>TO REVISIT</span>
        <strong>{progress.needsPractice}</strong>
        <p>Questions needing a little care</p>
      </div>
      <div>
        <span>IMPROVING</span>
        <strong>{progress.improved}</strong>
        <p>A correct result after a mistake</p>
      </div>
    </div>
  );
}

function EmptyProgress({ onNavigate, subject }: Pick<Props, 'onNavigate' | 'subject'>) {
  return (
    <div className="empty-state progress-empty">
      <span className="empty-icon">
        <Coffee size={29} strokeWidth={1.4} />
      </span>
      <h3>Let’s start with a little practice.</h3>
      <p>
        {subject === 'physics'
          ? 'Answer an MCQ to log your result automatically, or check a structured answer against the mark scheme and log how you did.'
          : 'Try a question, open its answer, then choose “Got it right” or “Needs practice” after comparing your working.'}{' '}
        Your feedback will grow from there.
      </p>
      <button className="button primary" onClick={() => onNavigate('bank')}>
        Find my first question
        <ArrowRight size={15} />
      </button>
    </div>
  );
}

function MistakeCard({
  mistake: m,
  note,
  onSave,
  onReview,
}: {
  mistake: MistakeEntry;
  note?: ReviewNote;
  onSave: (note: ReviewNote) => void;
  onReview: () => void;
}) {
  const [reason, setReason] = useState<MistakeReason>(note?.reason ?? 'unsure');
  const [reflection, setReflection] = useState(note?.note ?? '');
  const changed = reason !== note?.reason || reflection !== (note?.note ?? '');
  const date = m.lastMistake.createdAt
    ? new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'short',
        timeZone: 'Asia/Singapore',
      }).format(new Date(m.lastMistake.createdAt))
    : 'Earlier session';
  return (
    <article className={`mistake-card ${m.improved ? 'improving' : ''}`}>
      <div className="mistake-topline">
        <span className="mistake-subtopic">{m.question.subtopic}</span>
        <span className={`review-status ${m.improved ? 'improved' : ''}`}>
          {m.improved ? <CheckCircle2 size={12} /> : <RotateCcw size={12} />}
          {m.improved ? 'Improving' : 'Needs practice'}
        </span>
      </div>
      <div className="mistake-prompt">
        <MathText text={m.question.prompt.split('\n')[0]} />
      </div>
      <div className="mistake-meta">
        <span>
          {m.misses} {m.misses === 1 ? 'miss' : 'misses'} in {m.attempts}{' '}
          {m.attempts === 1 ? 'attempt' : 'attempts'}
        </span>
        <span>Last mistake: {date}</span>
        <span>
          {m.lastMistake.kind === 'mcq' ? 'MCQ · auto-checked' : 'Structured · self-checked'}
        </span>
      </div>
      {m.lastMistake.kind === 'mcq' && m.lastMistake.choice !== undefined && (
        <p className="missed-answer">
          <span>Your last missed answer</span>
          <strong>{'ABCD'[m.lastMistake.choice]}.</strong>
          <MathText text={m.question.options?.[m.lastMistake.choice] ?? ''} />
        </p>
      )}
      <details className="reflection-details">
        <summary>
          <span>
            <Leaf size={14} />
            {note ? 'Your reflection' : 'What tripped you up?'}
          </span>
          {note && <span className="reflection-tag">{mistakeReasons[note.reason].label}</span>}
          <ChevronDown size={14} />
        </summary>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave({ reason, note: reflection.trim() });
          }}
        >
          <label>
            What happened?
            <select value={reason} onChange={(e) => setReason(e.target.value as MistakeReason)}>
              {Object.entries(mistakeReasons).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            A note to your future self
            <textarea
              maxLength={1000}
              rows={2}
              placeholder="What will you do differently next time?"
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
            />
          </label>
          <div className="reflection-footer">
            <span>{reflection.length}/1000</span>
            <button className="button secondary small" type="submit" disabled={!changed}>
              <Check size={13} />
              {changed ? 'Save reflection' : 'Reflection saved'}
            </button>
          </div>
        </form>
      </details>
      <div className="mistake-actions">
        <span>
          {m.improved
            ? 'Your latest result was correct. Keep building on it.'
            : 'A small revisit can make a big difference.'}
        </span>
        <button className="button secondary small" onClick={onReview}>
          Revisit question
          <ArrowUpRight size={14} />
        </button>
      </div>
    </article>
  );
}

export function MistakesPage({
  subject,
  progress,
  notes,
  onReview,
  onPracticeTopic,
  onNavigate,
  onSaveNote,
}: Props & { onSaveNote: (questionId: string, note: ReviewNote) => void }) {
  const [topicFilter, setTopicFilter] = useState('all');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('topic');
  const groups = progress.topics
    .filter((t) => topicFilter === 'all' || t.topic.id === topicFilter)
    .map((t) => ({
      ...t,
      visible: t.mistakes
        .filter((m) => status === 'all' || (status === 'improving' ? m.improved : !m.improved))
        .sort((a, b) =>
          sort === 'misses'
            ? b.misses - a.misses
            : sort === 'recent'
              ? (b.lastMistake.createdAt ?? '').localeCompare(a.lastMistake.createdAt ?? '')
              : a.question.subtopic.localeCompare(b.question.subtopic),
        ),
    }))
    .filter((t) => t.visible.length);
  if (sort === 'misses')
    groups.sort(
      (a, b) =>
        b.visible.reduce((sum, m) => sum + m.misses, 0) -
        a.visible.reduce((sum, m) => sum + m.misses, 0),
    );
  if (sort === 'recent')
    groups.sort((a, b) =>
      (b.visible[0].lastMistake.createdAt ?? '').localeCompare(
        a.visible[0].lastMistake.createdAt ?? '',
      ),
    );
  const visible = groups.reduce((sum, t) => sum + t.visible.length, 0);
  function exportLog() {
    downloadJson(
      {
        version: 1,
        subject,
        exportedAt: new Date().toISOString(),
        questions: progress.mistakes.map((m) => m.question),
        history: progress.events,
        reviewNotes: Object.fromEntries(
          progress.mistakes
            .filter((m) => notes[m.question.id])
            .map((m) => [m.question.id, notes[m.question.id]]),
        ),
      },
      `folio-${subject}-learning-log.json`,
    );
  }
  return (
    <div className="progress-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">ROOM TO GROW</div>
          <h1>
            A softer place to start again<span>.</span>
          </h1>
          <p>
            Your {subjects[subject].short} mistakes, gathered by topic. No judgment, just next
            steps.
          </p>
        </div>
        <span className="heading-illustration">
          <BookHeart size={37} strokeWidth={1.3} />
        </span>
      </div>
      <ProgressTabs active="mistakes" onNavigate={onNavigate} />
      <ProgressStats progress={progress} />
      {!progress.events.length ? (
        <EmptyProgress subject={subject} onNavigate={onNavigate} />
      ) : (
        <>
          <div className="notebook-toolbar">
            <div>
              <label>
                Topic
                <select
                  aria-label="Mistake topic"
                  value={topicFilter}
                  onChange={(e) => setTopicFilter(e.target.value)}
                >
                  <option value="all">All topics</option>
                  {progress.topics.map((t) => (
                    <option key={t.topic.id} value={t.topic.id}>
                      {t.topic.code}. {t.topic.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Status
                <select
                  aria-label="Mistake status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="all">All mistakes</option>
                  <option value="needs-practice">Needs practice</option>
                  <option value="improving">Improving</option>
                </select>
              </label>
              <label>
                Sort groups
                <select
                  aria-label="Sort mistakes"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  <option value="topic">Syllabus topic</option>
                  <option value="misses">Most missed</option>
                  <option value="recent">Most recent</option>
                </select>
              </label>
            </div>
            <button className="button secondary small" onClick={exportLog}>
              <Download size={14} />
              Export learning log
            </button>
          </div>
          <p className="notebook-results">
            {visible} {visible === 1 ? 'question' : 'questions'} · {groups.length}{' '}
            {groups.length === 1 ? 'topic' : 'topics'}
            <span>Retries keep the original mistake in your notebook.</span>
          </p>
          {groups.length ? (
            <div className="mistake-groups">
              {groups.map((group) => (
                <section key={group.topic.id} className="mistake-group">
                  <div className="mistake-group-heading">
                    <span className={`syllabus-code topic-${group.topic.id}`}>
                      {group.topic.code}
                    </span>
                    <div>
                      <h2>{group.topic.name}</h2>
                      <p>
                        {group.visible.length}{' '}
                        {group.visible.length === 1 ? 'question' : 'questions'} in your notebook
                      </p>
                    </div>
                    <button className="text-button" onClick={() => onPracticeTopic(group.topic.id)}>
                      Practice topic
                      <ArrowRight size={14} />
                    </button>
                  </div>
                  {group.visible.map((m) => (
                    <MistakeCard
                      key={m.question.id}
                      mistake={m}
                      note={notes[m.question.id]}
                      onSave={(note) => onSaveNote(m.question.id, note)}
                      onReview={() => onReview([m.question])}
                    />
                  ))}
                </section>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-icon">
                <Leaf size={27} />
              </span>
              <h3>
                {progress.mistakes.length ? 'A quiet corner of your notebook.' : 'A lovely start.'}
              </h3>
              <p>
                {progress.mistakes.length
                  ? 'No mistakes match these filters. Try another topic or view all results.'
                  : 'No mistakes recorded for this subject yet. Try a new topic to keep stretching your understanding.'}
              </p>
              <button
                className="button secondary"
                onClick={() => {
                  setTopicFilter('all');
                  setStatus('all');
                  if (!progress.mistakes.length) onNavigate('bank');
                }}
              >
                {progress.mistakes.length ? 'Show all mistakes' : 'Keep practising'}
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </>
      )}
      <p className="progress-footnote">
        <Leaf size={13} />
        Saved in this browser. MCQs are checked automatically; structured results are self-checked.
      </p>
    </div>
  );
}

export function FeedbackPage({
  subject,
  progress,
  notes,
  onReview,
  onPracticeTopic,
  onNavigate,
}: Props) {
  const focus = progress.priorities.filter((t) => t.needsPractice > 0);
  const reasons = getReasonCounts(progress.mistakes, notes);
  const selfChecked = progress.events.filter((e) => e.kind === 'self-check').length;
  return (
    <div className="progress-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">A LITTLE PERSPECTIVE</div>
          <h1>
            Find your next small step<span>.</span>
          </h1>
          <p>
            Personal feedback from your recorded {subjects[subject].short} attempts and reflections.
          </p>
        </div>
        <span className="heading-illustration">
          <Coffee size={38} strokeWidth={1.3} />
        </span>
      </div>
      <ProgressTabs active="feedback" onNavigate={onNavigate} />
      <ProgressStats progress={progress} />
      {!progress.events.length ? (
        <EmptyProgress subject={subject} onNavigate={onNavigate} />
      ) : (
        <>
          <section className="feedback-focus">
            <span className="feedback-focus-icon">
              <Sparkles size={25} strokeWidth={1.4} />
            </span>
            <div>
              <span className="eyebrow">YOUR NEXT SMALL STEP</span>
              <h2>
                {focus.length
                  ? `A little more time with ${focus[0].topic.shortName.toLowerCase()}.`
                  : progress.improved
                    ? 'Look how far a revisit can take you.'
                    : 'You’re off to a thoughtful start.'}
              </h2>
              <p>
                {focus.length
                  ? `${focus[0].needsPractice} ${focus[0].needsPractice === 1 ? 'question in this topic still needs' : 'questions in this topic still need'} practice. Start with the first step you missed, then try again without the explanation open.`
                  : progress.improved
                    ? `${progress.improved} previously missed ${progress.improved === 1 ? 'question now has' : 'questions now have'} a correct latest result. Keep them in rotation and try a different question to see what has stuck.`
                    : 'No mistakes logged yet. Try a different topic or a more challenging question to get a broader picture of your understanding.'}
              </p>
              <span className="evidence-note">
                Based on {progress.events.length} recorded{' '}
                {progress.events.length === 1 ? 'attempt' : 'attempts'} across{' '}
                {progress.uniqueQuestions}{' '}
                {progress.uniqueQuestions === 1 ? 'question' : 'questions'}
                {progress.uniqueQuestions < 5
                  ? ' · Early signals, not a full topic assessment.'
                  : '.'}
              </span>
            </div>
            <button
              className="button primary"
              onClick={() =>
                focus.length
                  ? onReview(focus[0].mistakes.filter((m) => !m.improved).map((m) => m.question))
                  : onNavigate('bank')
              }
            >
              {focus.length ? 'Review these questions' : 'Keep exploring'}
              <ArrowRight size={14} />
            </button>
          </section>
          <div className="feedback-grid">
            <section className="topic-overview feedback-card">
              <div className="feedback-card-heading">
                <h2>Your topic picture</h2>
                <span>Accuracy across all attempts</span>
              </div>
              <div className="topic-overview-legend">
                <span>TOPIC</span>
                <span>ATTEMPTS</span>
                <span>ACCURACY</span>
              </div>
              {progress.topics.map((t) => (
                <button
                  className="topic-progress-row"
                  key={t.topic.id}
                  onClick={() => onPracticeTopic(t.topic.id)}
                  aria-label={`Practice ${t.topic.name}`}
                >
                  <div className="topic-progress-name">
                    <span className={`mini-topic-code topic-${t.topic.id}`}>{t.topic.code}</span>
                    <span>
                      {t.topic.name}
                      <small>
                        {t.attempts
                          ? `${t.uniqueQuestions} ${t.uniqueQuestions === 1 ? 'question' : 'questions'} tried · ${t.needsPractice} to revisit`
                          : 'Waiting for your first attempt'}
                      </small>
                    </span>
                  </div>
                  <span className="topic-attempt-count">{t.attempts || '—'}</span>
                  <div className="topic-accuracy">
                    <strong>{t.accuracy === null ? '—' : `${t.accuracy}%`}</strong>
                    <span className="accuracy-track">
                      <span style={{ width: `${t.accuracy ?? 0}%` }} />
                    </span>
                  </div>
                </button>
              ))}
              <p className="feedback-card-note">
                Correct retries count as attempts. First-try accuracy above uses only the first
                recorded attempt for each question.
              </p>
            </section>
            <section className="feedback-card reason-card">
              <div className="feedback-card-heading">
                <h2>What trips you up?</h2>
                <Leaf size={17} />
              </div>
              {reasons.length ? (
                <>
                  <p className="feedback-card-description">
                    Patterns from your own reflections, one tag per question.
                  </p>
                  {reasons.map((reason) => (
                    <div className="reason-row" key={reason.key}>
                      <span>{reason.label}</span>
                      <strong>
                        {reason.count} {reason.count === 1 ? 'question' : 'questions'}
                      </strong>
                      <div>
                        <span
                          style={{ width: `${(reason.count / progress.mistakes.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="reason-advice">
                    <Sparkles size={15} />
                    <p>{reasons[0].advice}</p>
                  </div>
                </>
              ) : (
                <div className="reason-empty">
                  <span className="empty-icon">
                    <BookHeart size={24} />
                  </span>
                  <h3>A reflection is a useful clue.</h3>
                  <p>
                    Add a reason to a question in your mistake notebook. We’ll use those notes to
                    suggest how to practise.
                  </p>
                </div>
              )}
              <button className="text-button" onClick={() => onNavigate('mistakes')}>
                Open your notebook
                <ArrowRight size={14} />
              </button>
            </section>
          </div>
          {focus.length > 0 && (
            <section className="next-steps">
              <div className="section-heading">
                <div>
                  <h2>A gentle plan for your next session</h2>
                  <p>Start with the topics that have the most questions still to revisit.</p>
                </div>
              </div>
              <div className="next-step-grid">
                {focus.slice(0, 3).map((t, i) => {
                  const topicReasons = getReasonCounts(
                    t.mistakes.filter((m) => !m.improved),
                    notes,
                  );
                  return (
                    <article className="next-step-card" key={t.topic.id}>
                      <span className="next-step-number">0{i + 1}</span>
                      <span className="next-step-evidence">
                        {t.needsPractice} to revisit · {t.attempts} attempts
                      </span>
                      <h3>{t.topic.name}</h3>
                      <p>
                        {topicReasons[0]?.advice ??
                          `Rework a ${t.mistakes.find((m) => !m.improved)!.question.subtopic} question. Compare each step with the mark scheme, then try it again with the solution closed.`}
                      </p>
                      <button
                        className="text-button"
                        onClick={() =>
                          onReview(t.mistakes.filter((m) => !m.improved).map((m) => m.question))
                        }
                      >
                        Review this topic
                        <ArrowRight size={14} />
                      </button>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
          <div className="feedback-bottom-note">
            <TrendingUp size={19} />
            <div>
              <strong>
                {progress.trend === null
                  ? 'A clearer picture with every session.'
                  : progress.trend > 0
                    ? `Your last 5 attempts improved by ${progress.trend} percentage points.`
                    : progress.trend === 0
                      ? 'Your last two sets of 5 attempts have the same accuracy.'
                      : `Your last 5 attempts were ${Math.abs(progress.trend)} percentage points lower.`}
              </strong>
              <p>
                {progress.trend === null
                  ? 'After 10 recorded attempts, you’ll see how your last 5 compare with the 5 before them.'
                  : 'This compares the last 5 attempts with the previous 5 for this subject, including retries.'}{' '}
                {selfChecked > 0 &&
                  `${selfChecked} ${selfChecked === 1 ? 'result is' : 'results are'} self-checked.`}
              </p>
            </div>
          </div>
        </>
      )}
      <p className="progress-footnote">
        <Leaf size={13} />
        Your feedback stays on this device and updates as you practise. Mixed questions count under
        their main topic; structured results are self-checked for the whole question.
      </p>
    </div>
  );
}
