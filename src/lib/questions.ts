import { topics } from '../data/syllabus';
import type { Difficulty, Question, Subject } from '../types';
import { isLocalPaperPath } from './assets';

export interface Filters {
  subject: Subject;
  topic: string;
  subtopic: string;
  type: string;
  difficulty: string;
  source: string;
  paper?: string;
  timeZone?: string;
  query: string;
  sort: string;
}

export function filterQuestions(questions: Question[], filters: Filters) {
  const query = filters.query.trim().toLowerCase();
  const matches = questions.filter(
    (q) =>
      q.subject === filters.subject &&
      (filters.topic === 'all' ||
        q.topicId === filters.topic ||
        q.additionalTopics?.some((t) => t.topicId === filters.topic)) &&
      (filters.subtopic === 'all' ||
        q.subtopic === filters.subtopic ||
        q.additionalTopics?.some((t) => t.subtopic === filters.subtopic)) &&
      (filters.type === 'all' || q.type === filters.type) &&
      (filters.difficulty === 'all' || q.difficulty === filters.difficulty) &&
      (filters.source === 'all' || q.source === filters.source) &&
      (!filters.paper || filters.paper === 'all' || q.paper === filters.paper) &&
      (!filters.timeZone || filters.timeZone === 'all' || q.timeZone === filters.timeZone) &&
      (!query ||
        [
          q.prompt,
          q.subtopic,
          ...(q.additionalTopics?.map((t) => t.subtopic) ?? []),
          q.sourceName,
          q.paper,
          q.year?.toString(),
          q.timeZone,
          q.examSession,
          q.examCode,
          q.originalQuestionNumber ? `question ${q.originalQuestionNumber}` : undefined,
          topics[q.subject].find((t) => t.id === q.topicId)?.name,
        ].some((value) => value?.toLowerCase().includes(query))),
  );
  if (filters.sort === 'marks') return matches.sort((a, b) => a.marks - b.marks);
  if (filters.sort === 'difficulty') {
    const order: Record<Difficulty, number> = {
      Foundation: 0,
      Standard: 1,
      Challenge: 2,
      Unrated: 3,
    };
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
  if (!['Foundation', 'Standard', 'Challenge', 'Unrated'].includes(q.difficulty as string))
    throw new Error('Choose Foundation, Standard, Challenge, or Unrated difficulty.');
  if (!Number.isInteger(q.marks) || (q.marks as number) < 1 || (q.marks as number) > 100)
    throw new Error('Marks must be an integer from 1 to 100.');
  if (!Number.isInteger(q.minutes) || (q.minutes as number) < 1 || (q.minutes as number) > 300)
    throw new Error('Suggested time must be from 1 to 300 minutes.');
  const images = (key: string) => {
    if (q[key] === undefined) return undefined;
    if (!Array.isArray(q[key]) || q[key].length === 0 || q[key].length > 30)
      throw new Error('Original page images must be a non-empty list of up to 30 images.');
    return q[key].map((image: { path: unknown; width: number; height: number; page: number }) => {
      if (
        !image ||
        !isLocalPaperPath(image.path, 'image') ||
        !Number.isInteger(image.width) ||
        image.width < 1 ||
        !Number.isInteger(image.height) ||
        image.height < 1 ||
        !Number.isInteger(image.page) ||
        image.page < 1
      )
        throw new Error('Invalid original page image.');
      return { path: image.path, width: image.width, height: image.height, page: image.page };
    });
  };
  const questionImages = images('questionImages');
  const markSchemeImages = images('markSchemeImages');
  const documentRef = (key: string) => {
    if (q[key] === undefined) return undefined;
    const d = q[key] as { path: unknown; page: number };
    if (!d || !isLocalPaperPath(d.path, 'pdf') || !Number.isInteger(d.page) || d.page < 1)
      throw new Error('Invalid original PDF reference.');
    return { path: d.path, page: d.page };
  };
  const questionDocument = documentRef('questionDocument');
  const markSchemeDocument = documentRef('markSchemeDocument');
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
    (q.steps.length === 0 && !markSchemeImages) ||
    q.steps.length > 50 ||
    q.steps.some(
      (step) => !step || !textField(step.text) || !Number.isInteger(step.marks) || step.marks < 0,
    ) ||
    (q.steps.length > 0 && q.steps.reduce((sum, step) => sum + step.marks, 0) !== q.marks)
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
    ...(questionImages ? { questionImages } : {}),
    ...(markSchemeImages ? { markSchemeImages } : {}),
    ...(questionDocument ? { questionDocument } : {}),
    ...(markSchemeDocument ? { markSchemeDocument } : {}),
    ...(Number.isInteger(q.originalQuestionNumber) && (q.originalQuestionNumber as number) > 0
      ? { originalQuestionNumber: q.originalQuestionNumber as number }
      : {}),
    ...(q.timeZone === 'TZ1' || q.timeZone === 'TZ2' ? { timeZone: q.timeZone } : {}),
    ...(textField(q.examSession, 80) ? { examSession: q.examSession } : {}),
    ...(textField(q.examCode, 80) ? { examCode: q.examCode } : {}),
    ...(Array.isArray(q.additionalTopics)
      ? {
          additionalTopics: q.additionalTopics.map(
            (entry: { topicId: string; subtopic: string }) => {
              if (
                !entry ||
                !topics[q.subject as Subject].some(
                  (t) => t.id === entry.topicId && t.subtopics.includes(entry.subtopic),
                )
              )
                throw new Error('Invalid additional topic.');
              return { topicId: entry.topicId, subtopic: entry.subtopic };
            },
          ),
        }
      : {}),
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
