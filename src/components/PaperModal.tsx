import { useState } from 'react';
import { ArrowDown, ArrowUp, Check, Download, FileText, Printer, Trash2 } from 'lucide-react';
import type { PracticePaper, Question, Subject } from '../types';
import { subjects, getTopic } from '../data/syllabus';
import { downloadJson, paperTotals } from '../lib/questions';
import MathText from './MathText';
import Modal from './Modal';

export default function PaperModal({
  questions,
  subject,
  saved,
  onClose,
  onSave,
  onPrint,
  onUpdate,
}: {
  questions: Question[];
  subject: Subject;
  saved?: PracticePaper;
  onClose: () => void;
  onSave: (name: string) => void;
  onPrint: (mode: 'questions' | 'answers', name: string) => void;
  onUpdate?: (ids: string[]) => void;
}) {
  const [name, setName] = useState(saved?.name ?? `${subjects[subject].short} · Topic practice`);
  const totals = paperTotals(questions);
  const reorder = (index: number, direction: number) => {
    const ids = questions.map((q) => q.id);
    [ids[index], ids[index + direction]] = [ids[index + direction], ids[index]];
    onUpdate?.(ids);
  };
  return (
    <Modal
      title={saved ? 'Your practice paper' : 'A paper, made for you'}
      subtitle="A focused set of questions. A fresh chance to improve."
      onClose={onClose}
      wide
    >
      <div className="paper-modal-body">
        <label>
          Paper title
          <input
            value={name}
            maxLength={100}
            onChange={(e) => setName(e.target.value)}
            readOnly={!!saved}
          />
        </label>
        <div className="paper-summary-strip">
          <span>
            <FileText size={17} />
            {questions.length} questions
          </span>
          <span>{totals.marks} marks</span>
          <span>~{totals.minutes} min</span>
          <span>{subjects[subject].short}</span>
        </div>
        <div className="paper-question-list">
          {questions.length ? (
            questions.map((q, i) => (
              <div className="paper-question-row" key={q.id}>
                <span className="paper-q-number">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <span className="paper-q-topic">{getTopic(q.subject, q.topicId)?.name}</span>
                  <p>
                    <MathText text={q.prompt.split('\n')[0]} />
                  </p>
                  <span className="paper-q-meta">
                    {q.marks} {q.marks === 1 ? 'mark' : 'marks'} · {q.subtopic}
                  </span>
                </div>
                {onUpdate && (
                  <div className="reorder-buttons">
                    <button
                      className="icon-button"
                      disabled={i === 0}
                      onClick={() => reorder(i, -1)}
                      aria-label={`Move question ${i + 1} up`}
                    >
                      <ArrowUp size={15} />
                    </button>
                    <button
                      className="icon-button"
                      disabled={i === questions.length - 1}
                      onClick={() => reorder(i, 1)}
                      aria-label={`Move question ${i + 1} down`}
                    >
                      <ArrowDown size={15} />
                    </button>
                    <button
                      className="icon-button"
                      onClick={() =>
                        onUpdate(
                          questions.filter((item) => item.id !== q.id).map((item) => item.id),
                        )
                      }
                      aria-label={`Remove question ${i + 1}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="empty-state compact">
              <FileText size={30} />
              <h3>A fresh page</h3>
              <p>Close this window and add some questions to your paper.</p>
            </div>
          )}
        </div>
        <p className="paper-disclaimer">
          A custom practice compilation, not an official IB paper. Original questions use indicative
          marking points.
        </p>
        <div className="paper-export">
          <h3>Ready when you are</h3>
          <p>Print to paper or choose “Save as PDF” in your browser’s print dialog.</p>
          <div>
            <button
              className="button secondary"
              disabled={!questions.length}
              onClick={() => onPrint('questions', name.trim() || 'Practice paper')}
            >
              <Printer size={15} />
              Question paper
            </button>
            <button
              className="button secondary"
              disabled={!questions.length}
              onClick={() => onPrint('answers', name.trim() || 'Practice paper')}
            >
              <Printer size={15} />
              Mark scheme
            </button>
            <button
              className="button secondary"
              disabled={!questions.length}
              onClick={() =>
                downloadJson(
                  { version: 1, name: name.trim(), subject, questions },
                  `${(name || 'practice-paper').replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase()}.json`,
                )
              }
            >
              <Download size={15} />
              JSON
            </button>
          </div>
        </div>
      </div>
      <div className="modal-footer">
        <button className="button secondary" onClick={onClose}>
          {saved ? 'Close' : 'Keep selecting'}
        </button>
        {!saved && (
          <button
            className="button primary"
            disabled={!questions.length || !name.trim()}
            onClick={() => onSave(name.trim())}
          >
            <Check size={16} />
            Save to my papers
          </button>
        )}
      </div>
    </Modal>
  );
}
