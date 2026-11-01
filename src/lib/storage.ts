import type {
  AppState,
  Attempt,
  PracticeEvent,
  PracticePaper,
  Question,
  ReviewNote,
} from '../types';
import { validateQuestion } from './questions';
import { mistakeReasons } from './progress';

export const STORAGE_KEY = 'folio.workspace.v1';
export const initialState: AppState = {
  subject: 'physics',
  bookmarks: [],
  attempts: {},
  history: [],
  reviewNotes: {},
  selected: [],
  customQuestions: [],
  papers: [],
};
const ids = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];

function recoverQuestion(value: unknown): Question | null {
  try {
    const q = validateQuestion(value);
    const original = value as Question;
    return {
      ...q,
      id: typeof original.id === 'string' ? original.id : q.id,
      figure: ['velocity', 'wave', 'parabola'].includes(original.figure ?? '')
        ? original.figure
        : undefined,
    };
  } catch {
    return null;
  }
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const value = JSON.parse(raw);
    if (!value || typeof value !== 'object') return initialState;
    const attempts: Record<string, Attempt> = {};
    if (value.attempts && typeof value.attempts === 'object') {
      Object.entries(value.attempts).forEach(([id, attempt]) => {
        const a = attempt as Attempt | null;
        if (
          a &&
          (a.kind === 'self-check' ||
            (Number.isInteger(a.choice) && a.choice! >= 0 && a.choice! <= 3)) &&
          typeof a.correct === 'boolean'
        )
          attempts[id] = {
            correct: a.correct,
            ...(a.kind === 'self-check'
              ? { kind: 'self-check' }
              : { kind: 'mcq', choice: a.choice }),
          };
      });
    }
    const customQuestions = (Array.isArray(value.customQuestions) ? value.customQuestions : [])
      .map(recoverQuestion)
      .filter(Boolean) as Question[];
    const papers: PracticePaper[] = [];
    for (const p of Array.isArray(value.papers) ? value.papers : []) {
      if (
        !p ||
        typeof p.id !== 'string' ||
        typeof p.name !== 'string' ||
        typeof p.createdAt !== 'string' ||
        !['math', 'physics'].includes(p.subject) ||
        !Array.isArray(p.questions)
      )
        continue;
      const questions = p.questions
        .map(recoverQuestion)
        .filter((q: Question | null) => q?.subject === p.subject) as Question[];
      if (questions.length)
        papers.push({
          id: p.id,
          name: p.name,
          createdAt: p.createdAt,
          subject: p.subject,
          questions,
        });
    }
    const history: PracticeEvent[] = [];
    if (Array.isArray(value.history)) {
      for (const event of value.history) {
        if (
          !event ||
          typeof event.id !== 'string' ||
          typeof event.questionId !== 'string' ||
          typeof event.correct !== 'boolean' ||
          !['mcq', 'self-check'].includes(event.kind)
        )
          continue;
        if (
          event.kind === 'mcq' &&
          (!Number.isInteger(event.choice) || event.choice < 0 || event.choice > 3)
        )
          continue;
        if (
          event.createdAt !== null &&
          (typeof event.createdAt !== 'string' || !Number.isFinite(Date.parse(event.createdAt)))
        )
          continue;
        history.push({
          id: event.id,
          questionId: event.questionId,
          correct: event.correct,
          kind: event.kind,
          createdAt: event.createdAt,
          ...(event.kind === 'mcq' ? { choice: event.choice } : {}),
        });
      }
    } else {
      // Preserve the latest result from the previous version without inventing past retries or dates.
      for (const [id, attempt] of Object.entries(attempts))
        history.push({
          id: `legacy-${id}`,
          questionId: id,
          correct: attempt.correct,
          kind: attempt.kind ?? 'mcq',
          createdAt: null,
          ...(attempt.choice !== undefined ? { choice: attempt.choice } : {}),
        });
    }
    const reviewNotes: Record<string, ReviewNote> = {};
    if (value.reviewNotes && typeof value.reviewNotes === 'object') {
      for (const [id, note] of Object.entries(value.reviewNotes)) {
        const n = note as ReviewNote | null;
        if (n && Object.hasOwn(mistakeReasons, n.reason) && typeof n.note === 'string')
          reviewNotes[id] = { reason: n.reason, note: n.note.slice(0, 1000) };
      }
    }
    return {
      subject: value.subject === 'math' ? 'math' : 'physics',
      bookmarks: ids(value.bookmarks),
      selected: ids(value.selected),
      customQuestions,
      attempts,
      history,
      reviewNotes,
      papers,
    };
  } catch {
    return initialState;
  }
}
