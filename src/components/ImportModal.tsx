import { useRef, useState, type FormEvent } from 'react';
import { Download, FileJson2, FilePlus2, Plus, Trash2, Upload, Info } from 'lucide-react';
import type { Question, Subject } from '../types';
import { subjects, topics } from '../data/syllabus';
import { uploadedPhysicsQuestions } from '../data/uploadedQuestions';
import { downloadJson, parseQuestionImport, validateQuestion } from '../lib/questions';
import Modal from './Modal';

export default function ImportModal({
  subject,
  onClose,
  onImport,
}: {
  subject: Subject;
  onClose: () => void;
  onImport: (questions: Question[]) => void;
}) {
  const [tab, setTab] = useState<'question' | 'json'>('question');
  const [selectedSubject, setSubject] = useState(subject);
  const [topicId, setTopicId] = useState(topics[subject][0].id);
  const [type, setType] = useState('structured');
  const [source, setSource] = useState('past-paper');
  const [steps, setSteps] = useState([{ text: '', marks: 4 }]);
  const [json, setJson] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    try {
      if (tab === 'json') {
        onImport(parseQuestionImport(json));
        return;
      }
      const form = new FormData(event.currentTarget);
      const value = (key: string) => String(form.get(key) ?? '').trim();
      const question = validateQuestion({
        subject: selectedSubject,
        topicId,
        subtopic: value('subtopic'),
        type,
        difficulty: value('difficulty'),
        marks: Number(value('marks')),
        minutes: Number(value('minutes')),
        paper: value('paper'),
        prompt: value('prompt'),
        answer: value('answer'),
        explanation: value('explanation'),
        source,
        sourceName: value('sourceName'),
        ...(source === 'past-paper' ? { year: Number(value('year')) } : {}),
        sourceUrl: value('sourceUrl') || undefined,
        markSchemeUrl: value('markSchemeUrl') || undefined,
        ...(type === 'mcq'
          ? {
              options: [0, 1, 2, 3].map((i) => value(`option-${i}`)),
              correctOption: Number(value('correctOption')),
            }
          : {}),
        steps,
      });
      onImport([question]);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function readFile(file?: File) {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error('Choose a JSON file smaller than 5 MB.');
      const text = await file.text();
      parseQuestionImport(text);
      setJson(text);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  return (
    <Modal
      title="Grow your question bank"
      subtitle="Your papers, organized the way you study."
      onClose={onClose}
      wide
    >
      <div className="modal-tabs">
        <button
          className={tab === 'question' ? 'active' : ''}
          onClick={() => {
            setTab('question');
            setError('');
          }}
        >
          <FilePlus2 size={16} />
          Add a question
        </button>
        <button
          className={tab === 'json' ? 'active' : ''}
          onClick={() => {
            setTab('json');
            setError('');
          }}
        >
          <FileJson2 size={16} />
          Import a question bank
        </button>
      </div>
      <form onSubmit={submit} className="import-form">
        {tab === 'question' ? (
          <>
            <div className="form-note">
              <Info size={16} />
              <span>
                Add the question text and mark scheme from a paper you can use. Tag it below to make
                it searchable by topic. Use <code>$…$</code> for mathematical notation.
              </span>
            </div>
            <div className="form-grid">
              <label>
                Subject
                <select
                  value={selectedSubject}
                  onChange={(e) => {
                    const next = e.target.value as Subject;
                    setSubject(next);
                    setTopicId(topics[next][0].id);
                    if (next === 'math') setType('structured');
                  }}
                >
                  <option value="math">Math AA HL</option>
                  <option value="physics">Physics HL</option>
                </select>
              </label>
              <label>
                Topic
                <select value={topicId} onChange={(e) => setTopicId(e.target.value)}>
                  {topics[selectedSubject].map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.code}. {t.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Subtopic
                <select name="subtopic" key={topicId}>
                  {topics[selectedSubject]
                    .find((t) => t.id === topicId)
                    ?.subtopics.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                </select>
              </label>
              <label>
                Question type
                <select
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value);
                    setSteps([{ text: '', marks: e.target.value === 'mcq' ? 1 : 4 }]);
                  }}
                >
                  <option value="structured">Structured</option>
                  {selectedSubject === 'physics' && <option value="mcq">Multiple choice</option>}
                </select>
              </label>
              <label>
                Difficulty
                <select name="difficulty" defaultValue="Standard">
                  <option>Foundation</option>
                  <option>Standard</option>
                  <option>Challenge</option>
                </select>
              </label>
              <label>
                Paper
                <select name="paper" key={`${selectedSubject}-${type}`}>
                  {(selectedSubject === 'math'
                    ? ['Paper 1', 'Paper 2', 'Paper 3']
                    : type === 'mcq'
                      ? ['Paper 1A']
                      : ['Paper 1B', 'Paper 2']
                  ).map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </label>
              <label>
                Marks
                <input
                  name="marks"
                  type="number"
                  min="1"
                  max="100"
                  required
                  defaultValue={type === 'mcq' ? 1 : 4}
                  key={type}
                />
              </label>
              <label>
                Suggested time (minutes)
                <input
                  name="minutes"
                  type="number"
                  min="1"
                  max="300"
                  required
                  defaultValue={type === 'mcq' ? 2 : 6}
                  key={type}
                />
              </label>
            </div>
            <label>
              Question
              <textarea
                name="prompt"
                required
                rows={4}
                maxLength={15000}
                placeholder="Enter the question, including any subparts…"
              />
            </label>
            {type === 'mcq' && (
              <div className="mcq-form">
                <p>
                  Answer options <span>Select the correct answer below.</span>
                </p>
                {[0, 1, 2, 3].map((i) => (
                  <label key={i} className="option-form">
                    <input
                      type="radio"
                      name="correctOption"
                      value={i}
                      required
                      aria-label={`Option ${'ABCD'[i]} is correct`}
                    />
                    <span>{'ABCD'[i]}</span>
                    <input
                      name={`option-${i}`}
                      required
                      maxLength={2000}
                      placeholder={`Option ${'ABCD'[i]}`}
                      aria-label={`Option ${'ABCD'[i]}`}
                    />
                  </label>
                ))}
              </div>
            )}
            <label>
              Answer
              <textarea
                name="answer"
                required
                rows={2}
                placeholder="The final answer, with units where appropriate…"
              />
            </label>
            <label>
              Explanation
              <textarea
                name="explanation"
                required
                rows={3}
                placeholder="Explain why the answer is correct and how to approach the question…"
              />
            </label>
            <div className="step-form">
              <div className="form-section-heading">
                <h3>Mark scheme</h3>
                <span>Step marks must add up to the total.</span>
              </div>
              {steps.map((step, i) => (
                <div className="step-form-row" key={i}>
                  <input
                    aria-label={`Mark scheme step ${i + 1}`}
                    required
                    value={step.text}
                    onChange={(e) =>
                      setSteps(steps.map((s, j) => (j === i ? { ...s, text: e.target.value } : s)))
                    }
                    placeholder={`Step ${i + 1} / marking point`}
                  />
                  <input
                    aria-label={`Marks for step ${i + 1}`}
                    required
                    type="number"
                    min="0"
                    max="100"
                    value={step.marks}
                    onChange={(e) =>
                      setSteps(
                        steps.map((s, j) =>
                          j === i ? { ...s, marks: Number(e.target.value) } : s,
                        ),
                      )
                    }
                  />
                  <button
                    type="button"
                    className="icon-button"
                    disabled={steps.length === 1}
                    aria-label={`Remove step ${i + 1}`}
                    onClick={() => setSteps(steps.filter((_, j) => j !== i))}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="text-button"
                onClick={() => setSteps([...steps, { text: '', marks: 1 }])}
              >
                <Plus size={14} />
                Add marking point
              </button>
            </div>
            <div className="form-section-heading">
              <h3>Keep track of the source</h3>
            </div>
            <div className="form-grid">
              <label>
                Source type
                <select value={source} onChange={(e) => setSource(e.target.value)}>
                  <option value="past-paper">Past-paper question</option>
                  <option value="original">Original / adapted practice</option>
                </select>
              </label>
              <label>
                Source name
                <input
                  name="sourceName"
                  required
                  maxLength={200}
                  placeholder="e.g. May 2026, TZ1, question 4"
                />
              </label>
              {source === 'past-paper' && (
                <label>
                  Exam year
                  <select name="year" key={selectedSubject}>
                    {Array.from(
                      { length: 2027 - subjects[selectedSubject].firstAssessment },
                      (_, i) => 2026 - i,
                    ).map((y) => (
                      <option key={y}>{y}</option>
                    ))}
                  </select>
                </label>
              )}
              <label>
                Question / paper URL (optional)
                <input name="sourceUrl" type="url" placeholder="https://…" />
              </label>
              <label>
                Mark scheme URL (optional)
                <input name="markSchemeUrl" type="url" placeholder="https://…" />
              </label>
            </div>
          </>
        ) : (
          <>
            <div className="form-note">
              <Info size={16} />
              <span>
                Import up to 500 topic-tagged questions with answers and marking points. Physics
                papers must be from 2025 onward; Math AA papers from 2021 onward.
              </span>
            </div>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => readFile(e.target.files?.[0])}
            />
            <button
              className="upload-zone"
              type="button"
              disabled={busy}
              onClick={() => fileInput.current?.click()}
            >
              <span className="upload-icon">
                <Upload size={24} />
              </span>
              <strong>{busy ? 'Reading your file…' : 'Choose a JSON question bank'}</strong>
              <span>or paste your JSON below · up to 5 MB</span>
            </button>
            <button
              type="button"
              className="text-button template-button"
              onClick={() =>
                downloadJson(
                  {
                    version: 1,
                    questions: uploadedPhysicsQuestions
                      .slice(0, 1)
                      .map(({ id: _id, figure: _figure, ...q }) => q),
                  },
                  'folio-question-template.json',
                )
              }
            >
              <Download size={15} />
              Download a real Physics question example
            </button>
            <label>
              Question bank JSON
              <textarea
                className="json-input"
                rows={9}
                value={json}
                onChange={(e) => setJson(e.target.value)}
                placeholder={'{\n  "questions": [ … ]\n}'}
                required
                spellCheck={false}
              />
            </label>
          </>
        )}
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
        <div className="modal-footer">
          <button type="button" className="button secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="button primary" type="submit" disabled={busy}>
            <Plus size={16} />
            {tab === 'question' ? 'Add to question bank' : 'Import questions'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
