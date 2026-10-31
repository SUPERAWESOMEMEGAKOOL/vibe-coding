import type { Question } from '../types';
import { subjects, getTopic } from '../data/syllabus';
import { paperTotals } from '../lib/questions';
import MathText from './MathText';
import Figure from './Figure';

export interface PrintDocument {
  name: string;
  mode: 'questions' | 'answers';
  questions: Question[];
}

export default function PrintPaper({ document }: { document: PrintDocument | null }) {
  if (!document?.questions.length) return null;
  const { name, mode, questions } = document;
  const totals = paperTotals(questions);
  return (
    <section id="print-paper" aria-label="Printable paper">
      <header>
        <span className="print-brand">
          folio<span> / IB STUDY SPACE</span>
        </span>
        <span>{mode === 'answers' ? 'MARK SCHEME' : 'QUESTION PAPER'}</span>
      </header>
      <h1>{name}</h1>
      <p className="print-subtitle">{subjects[questions[0].subject].full} · For 2026 exams</p>
      <div className="print-stats">
        <span>{questions.length} questions</span>
        <span>{totals.marks} marks</span>
        <span>Suggested time: {totals.minutes} minutes</span>
      </div>
      {mode === 'questions' && (
        <div className="print-name">
          Name: __________________________________________________ Date: __________________
        </div>
      )}
      <p className="print-disclaimer">
        Custom practice compilation. Not an official IB examination paper. Original practice is
        identified per question; its mark scheme is indicative.
      </p>
      {questions.map((q, i) => (
        <article className="print-question" key={q.id}>
          <div className="print-question-header">
            <strong>
              {i + 1}. {getTopic(q.subject, q.topicId)?.name}
            </strong>
            <span>
              [{q.marks} {q.marks === 1 ? 'mark' : 'marks'}]
            </span>
          </div>
          <small>
            {q.source === 'original' ? 'Original practice' : `${q.sourceName} · ${q.year}`} ·{' '}
            {q.subtopic}
          </small>
          {mode === 'questions' ? (
            <>
              <p>
                <MathText text={q.prompt} />
              </p>
              {q.figure && <Figure type={q.figure} />}
              {q.type === 'mcq' ? (
                <div className="print-options">
                  {q.options?.map((option, j) => (
                    <p key={j}>
                      <strong>{'ABCD'[j]}.</strong> <MathText text={option} />
                    </p>
                  ))}
                </div>
              ) : (
                <div className="answer-lines">
                  {Array.from({ length: Math.max(3, q.marks) }, (_, j) => (
                    <div key={j} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <p className="print-answer">
                <MathText text={q.answer} />
              </p>
              <p>
                <MathText text={q.explanation} />
              </p>
              {q.steps.map((step, j) => (
                <div className="print-mark" key={j}>
                  <MathText text={step.text} />
                  <strong>[{step.marks}]</strong>
                </div>
              ))}
            </>
          )}
          {q.sourceUrl && <p className="print-source">Source: {q.sourceUrl}</p>}
          {mode === 'answers' && q.markSchemeUrl && (
            <p className="print-source">Mark scheme: {q.markSchemeUrl}</p>
          )}
        </article>
      ))}
      <footer>Made with Folio · A little practice, a little progress.</footer>
    </section>
  );
}
