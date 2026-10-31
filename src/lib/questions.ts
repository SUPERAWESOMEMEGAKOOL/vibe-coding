import { topics } from '../data/syllabus';
import type { Difficulty, Question, Subject } from '../types';

export interface Filters {
  subject: Subject;
  topic: string;
  subtopic: string;
  type: string;
  difficulty: string;
  source: string;
  query: string;
  sort: string;
}

export function filterQuestions(questions: Question[], filters: Filters) {
  const query = filters.query.trim().toLowerCase();
  const matches = questions.filter(
    (q) =>
      q.subject === filters.subject &&
      (filters.topic === 'all' || q.topicId === filters.topic) &&
      (filters.subtopic === 'all' || q.subtopic === filters.subtopic) &&
      (filters.type === 'all' || q.type === filters.type) &&
      (filters.difficulty === 'all' || q.difficulty === filters.difficulty) &&
      (filters.source === 'all' || q.source === filters.source) &&
      (!query ||
        [
          q.prompt,
          q.subtopic,
          q.sourceName,
          q.paper,
          q.year?.toString(),
          topics[q.subject].find((t) => t.id === q.topicId)?.name,
        ].some((value) => value?.toLowerCase().includes(query))),
  );
  if (filters.sort === 'marks') return matches.sort((a, b) => a.marks - b.marks);
  if (filters.sort === 'difficulty') {
    const order: Record<Difficulty, number> = { Foundation: 0, Standard: 1, Challenge: 2 };
    return matches.sort((a, b) => order[a.difficulty] - order[b.difficulty]);
  }
  if (filters.sort === 'newest') return matches.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
  return matches;
}

export function paperTotals(questions: Question[]) {
  return questions.reduce(
    (total, q) => ({ marks: total.marks + q.marks, minutes: total.minutes + q.minutes }),
    { marks: 0, minutes: 0 },
  );
}

const textField = (v: unknown, max = 15000): v is string =>
  typeof v === 'string' && v.trim().length > 0 && v.length <= max;
const safeUrl = (v: unknown) =>
  v === undefined ||
  v === '' ||
  (typeof v === 'string' &&
    /^https:\/\//i.test(v) &&
    (() => {
      try {
        return !new URL(v).username && !new URL(v).password;
      } catch {
        return false;
      }
    })());

export function validateQuestion(value: unknown): Question {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Each question must be an object.');
  const q = value as Record<string, unknown>;
  if (q.subject !== 'math' && q.subject !== 'physics')
    throw new Error('Subject must be "math" or "physics".');
  const topic = topics[q.subject].find((t) => t.id === q.topicId);
  if (!topic)
    throw new Error(`Choose a valid ${q.subject === 'math' ? 'Math AA HL' : 'Physics HL'} topic.`);
  if (!textField(q.subtopic, 150)) throw new Error('A subtopic is required.');
  if (q.type !== 'mcq' && q.type !== 'structured')
    throw new Error('Type must be "mcq" or "structured".');
  if (q.subject === 'math' && q.type === 'mcq')
    throw new Error('Math AA HL uses structured questions. Choose structured for this subject.');
  if (!['Foundation', 'Standard', 'Challenge'].includes(q.difficulty as string))
    throw new Error('Choose Foundation, Standard, or Challenge difficulty.');
  if (!Number.isInteger(q.marks) || (q.marks as number) < 1 || (q.marks as number) > 100)
    throw new Error('Marks must be an integer from 1 to 100.');
  if (!Number.isInteger(q.minutes) || (q.minutes as number) < 1 || (q.minutes as number) > 300)
    throw new Error('Suggested time must be from 1 to 300 minutes.');
  if (
    !textField(q.paper, 100) ||
    !textField(q.prompt) ||
    !textField(q.answer) ||
    !textField(q.explanation)
  )
    throw new Error('Paper, question, answer, and explanation are required.');
  if (
    q.type === 'mcq' &&
    (!Array.isArray(q.options) ||
      q.options.length !== 4 ||
      !q.options.every((o) => textField(o, 2000)) ||
      !Number.isInteger(q.correctOption) ||
      (q.correctOption as number) < 0 ||
      (q.correctOption as number) > 3)
  )
    throw new Error('An MCQ needs four options and a correctOption index from 0 to 3.');
  if (
    !Array.isArray(q.steps) ||
    q.steps.length === 0 ||
    q.steps.length > 50 ||
    q.steps.some(
      (step) => !step || !textField(step.text) || !Number.isInteger(step.marks) || step.marks < 0,
    ) ||
    q.steps.reduce((sum, step) => sum + step.marks, 0) !== q.marks
  )
    throw new Error(
      'Mark scheme steps must have non-negative integer marks adding up to the question’s total.',
    );
  if (q.source !== 'original' && q.source !== 'past-paper')
    throw new Error('Source must be "original" or "past-paper".');
  if (!textField(q.sourceName, 200)) throw new Error('A source name is required.');
  const firstYear = q.subject === 'math' ? 2021 : 2025;
  if (
    (q.source === 'past-paper' || q.year !== undefined) &&
    (!Number.isInteger(q.year) || (q.year as number) < firstYear || (q.year as number) > 2026)
  )
    throw new Error(
      `For this syllabus, ${q.subject === 'math' ? 'Math AA HL' : 'Physics HL'} past papers must be from ${firstYear}–2026. Older questions need to be adapted and labelled as original practice.`,
    );
  if (!safeUrl(q.sourceUrl) || !safeUrl(q.markSchemeUrl))
    throw new Error('Source links must be valid HTTPS URLs without embedded credentials.');
  return {
    id: `custom-${crypto.randomUUID()}`,
    subject: q.subject,
    topicId: topic.id,
    subtopic: (q.subtopic as string).trim(),
    type: q.type,
    difficulty: q.difficulty as Difficulty,
    marks: q.marks as number,
    minutes: q.minutes as number,
    paper: (q.paper as string).trim(),
    prompt: (q.prompt as string).trim(),
    answer: (q.answer as string).trim(),
    explanation: (q.explanation as string).trim(),
    steps: q.steps.map((step) => ({ text: step.text.trim(), marks: step.marks })),
    ...(q.type === 'mcq'
      ? {
          options: (q.options as string[]).map((o) => o.trim()),
          correctOption: q.correctOption as number,
        }
      : {}),
    source: q.source,
    sourceName: (q.sourceName as string).trim(),
    ...(q.year ? { year: q.year as number } : {}),
    ...(q.sourceUrl ? { sourceUrl: q.sourceUrl as string } : {}),
    ...(q.markSchemeUrl ? { markSchemeUrl: q.markSchemeUrl as string } : {}),
  };
}

export function parseQuestionImport(text: string): Question[] {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      'This file is not valid JSON. Download the template to see the expected format.',
    );
  }
  const values = Array.isArray(data)
    ? data
    : data && typeof data === 'object' && 'questions' in data
      ? data.questions
      : null;
  if (!Array.isArray(values) || !values.length)
    throw new Error('Provide a non-empty questions array.');
  if (values.length > 500) throw new Error('Please import at most 500 questions at a time.');
  return values.map((value, i) => {
    try {
      return validateQuestion(value);
    } catch (error) {
      throw new Error(`Question ${i + 1}: ${(error as Error).message}`);
    }
  });
}

export function downloadJson(data: unknown, filename: string) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
