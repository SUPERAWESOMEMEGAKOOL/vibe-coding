import {
  Bookmark,
  BookHeart,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  ExternalLink,
  Plus,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { getTopic } from '../data/syllabus';
import type { Attempt, Question } from '../types';
import MathText from './MathText';
import Figure from './Figure';

interface Props {
  question: Question;
  index: number;
  bookmarked: boolean;
  selected: boolean;
  attempt?: Attempt;
  onBookmark: () => void;
  onSelect: () => void;
  onAnswer: (choice: number) => void;
  onRetry: () => void;
  onAssess: (correct: boolean) => void;
}

export default function QuestionCard({
  question: q,
  index,
  bookmarked,
  selected,
  attempt,
  onBookmark,
  onSelect,
  onAnswer,
  onRetry,
  onAssess,
}: Props) {
  const topic = getTopic(q.subject, q.topicId);
  return (
    <article className={`question-card ${selected ? 'is-selected' : ''}`}>
      <div className="question-topline">
        <div className="question-label">
          <span className="question-number">{String(index + 1).padStart(2, '0')}</span>
          <span>
            {q.source === 'original' ? 'ORIGINAL PRACTICE' : q.sourceName}
            {q.year ? ` · ${q.year}` : ''}
          </span>
        </div>
        <button
          className={`icon-button bookmark-button ${bookmarked ? 'active' : ''}`}
          aria-label={bookmarked ? 'Unsave question' : 'Save question'}
          aria-pressed={bookmarked}
          onClick={onBookmark}
        >
          <Bookmark size={18} fill={bookmarked ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="question-tags">
        <span className={`topic-badge topic-${q.topicId}`}>
          <span className="tag-dot" />
          {topic?.name}
        </span>
        <span className={`difficulty ${q.difficulty.toLowerCase()}`}>
          <i />
          <i />
          <i />
          {q.difficulty}
        </span>
        <span className="question-paper">{q.paper}</span>
      </div>
      <p className="question-subtopic">{q.subtopic}</p>
      <div className="question-prompt">
        <MathText text={q.prompt} />
      </div>
      {q.figure && <Figure type={q.figure} />}
      {q.type === 'mcq' && (
        <div className="mcq-options" role="group" aria-label="Answer choices">
          {q.options?.map((option, i) => {
            const picked = attempt?.choice === i;
            return (
              <button
                key={i}
                className={`mcq-option ${picked ? (attempt.correct ? 'correct' : 'incorrect') : ''}`}
                onClick={() => onAnswer(i)}
                disabled={!!attempt}
                aria-pressed={picked}
              >
                <span className="option-letter">{'ABCD'[i]}</span>
                <MathText text={option} />
                {picked && (attempt.correct ? <CheckCircle2 size={19} /> : <XCircle size={19} />)}
              </button>
            );
          })}
        </div>
      )}
      {attempt && q.type === 'mcq' && (
        <div
          className={`answer-feedback ${attempt.correct ? 'correct' : 'incorrect'}`}
          role="status"
        >
          {attempt.correct ? <CheckCircle2 size={17} /> : <XCircle size={17} />}
          <span>
            {attempt.correct
              ? 'That’s right. Nicely done!'
              : 'Not quite. Give it another try, or explore the explanation.'}
            {!attempt.correct && <small>Saved to your mistake notebook.</small>}
          </span>
          <button onClick={onRetry}>
            <RotateCcw size={13} />
            Try again
          </button>
        </div>
      )}
      <div className="question-footer">
        <div className="question-meta">
          <span>
            {q.marks} {q.marks === 1 ? 'mark' : 'marks'}
          </span>
          <span className="meta-divider" />
          <span>
            <Clock3 size={13} />
            {q.minutes} min
          </span>
          <span className="meta-divider" />
          <span>{q.type === 'mcq' ? 'Multiple choice' : 'Structured'}</span>
        </div>
        <button
          className={`add-question ${selected ? 'added' : ''}`}
          onClick={onSelect}
          aria-pressed={selected}
        >
          {selected ? <Check size={15} /> : <Plus size={15} />}
          {selected ? 'Added to paper' : 'Add to paper'}
        </button>
      </div>
      <details className="solution">
        <summary>
          <span>
            <ChevronDown size={15} />
            Answer & explanation
          </span>
          <span className="solution-hint">Check your understanding</span>
        </summary>
        <div className="solution-content">
          <div className="answer-title">THE ANSWER</div>
          <p className="answer-text">
            <MathText text={q.answer} />
          </p>
          <h4>Let’s work through it</h4>
          <p>
            <MathText text={q.explanation} />
          </p>
          <div className="mark-scheme">
            <div className="mark-scheme-header">
              <h4>Mark scheme</h4>
              <span>{q.marks} marks available</span>
            </div>
            {q.steps.map((step, i) => (
              <div key={i} className="mark-step">
                <span className="step-number">{i + 1}</span>
                <MathText text={step.text} />
                <span className="step-marks">[{step.marks}]</span>
              </div>
            ))}
          </div>
          {q.source === 'original' && (
            <p className="solution-note">
              Original practice with an indicative mark scheme. Not an official IB examination
              question.
            </p>
          )}
          {(q.sourceUrl || q.markSchemeUrl) && (
            <div className="source-links">
              {q.sourceUrl && (
                <a href={q.sourceUrl} target="_blank" rel="noopener noreferrer">
                  Question source <ExternalLink size={13} />
                </a>
              )}
              {q.markSchemeUrl && (
                <a href={q.markSchemeUrl} target="_blank" rel="noopener noreferrer">
                  Original mark scheme <ExternalLink size={13} />
                </a>
              )}
            </div>
          )}
          {q.type === 'structured' && (
            <div className="self-check-panel">
              <div>
                <span className="eyebrow">A MOMENT TO REFLECT</span>
                <h4>How did your working compare?</h4>
                <p>Check your working against the mark scheme, then log your result.</p>
              </div>
              <div className="self-check-actions">
                <button
                  className={`button secondary ${attempt?.correct === true ? 'self-check-selected' : ''}`}
                  aria-pressed={attempt?.correct === true}
                  disabled={!!attempt}
                  onClick={() => onAssess(true)}
                >
                  <CheckCircle2 size={15} />
                  Got it right
                </button>
                <button
                  className={`button secondary ${attempt?.correct === false ? 'self-check-selected' : ''}`}
                  aria-pressed={attempt?.correct === false}
                  disabled={!!attempt}
                  onClick={() => onAssess(false)}
                >
                  <BookHeart size={15} />
                  Needs practice
                </button>
              </div>
              {attempt && (
                <div className="self-check-result" role="status">
                  <span>
                    {attempt.correct
                      ? 'Logged as correct (self-checked). A little progress, made.'
                      : 'Added to your mistake notebook. We’ll keep this topic in mind.'}
                  </span>
                  <button className="text-button" onClick={onRetry}>
                    <RotateCcw size={13} />
                    Log another attempt
                  </button>
                </div>
              )}
              <small>Self-checked results count toward your topic feedback.</small>
            </div>
          )}
        </div>
      </details>
    </article>
  );
}
