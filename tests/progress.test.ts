import { afterEach, describe, expect, it, vi } from 'vitest';
import { starterQuestions } from '../src/data/questions';
import { getProgress, getReasonCounts, recordAttempt } from '../src/lib/progress';
import { initialState, loadState, STORAGE_KEY } from '../src/lib/storage';
import type { AppState } from '../src/types';

const physics = starterQuestions.find((q) => q.subject === 'physics' && q.type === 'mcq')!;
const wave = starterQuestions.find((q) => q.subject === 'physics' && q.topicId === 'pC')!;
const math = starterQuestions[0];
const fresh = (): AppState => structuredClone(initialState);
afterEach(() => vi.unstubAllGlobals());

describe('Mistake history and topic feedback', () => {
  it('keeps every failed attempt after retries and a successful result', () => {
    let state = recordAttempt(fresh(), physics, { correct: false, choice: 0 });
    state = recordAttempt(state, physics, { correct: false, choice: 2 });
    state = recordAttempt(state, physics, { correct: true, choice: 1 });
    const p = getProgress(starterQuestions, state.history, 'physics');
    expect(p.events).toHaveLength(3);
    expect(p.mistakes).toHaveLength(1);
    expect(p.mistakes[0]).toMatchObject({
      misses: 2,
      attempts: 3,
      improved: true,
      lastMistake: { choice: 2 },
    });
    expect(p.needsPractice).toBe(0);
    expect(p.improved).toBe(1);
    expect(p.accuracy).toBe(33);
    expect(p.firstTryAccuracy).toBe(0);
    state = recordAttempt(state, physics, { correct: false, choice: 3 });
    const reopened = getProgress(starterQuestions, state.history, 'physics');
    expect(reopened.needsPractice).toBe(1);
    expect(reopened.mistakes[0].misses).toBe(3);
    expect(reopened.improved).toBe(0);
  });

  it('separates subjects and puts unresolved topics before improved topics', () => {
    let state = recordAttempt(fresh(), physics, { correct: false, choice: 0 });
    state = recordAttempt(state, physics, { correct: true, choice: 1 });
    state = recordAttempt(state, wave, { correct: false, choice: 0 });
    state = recordAttempt(state, math, { correct: false });
    const p = getProgress(starterQuestions, state.history, 'physics');
    expect(p.priorities[0].topic.id).toBe('pC');
    expect(p.uniqueQuestions).toBe(2);
    expect(p.events).toHaveLength(3);
    expect(p.firstTryAccuracy).toBe(0);
    expect(p.topics.find((t) => t.topic.id === 'pB')!.accuracy).toBeNull();
    const m = getProgress(starterQuestions, state.history, 'math');
    expect(m.events).toHaveLength(1);
    expect(m.events[0].kind).toBe('self-check');
    expect(m.mistakes[0].question.id).toBe(math.id);
  });

  it('counts a mistake reason per reflected question, not per retry', () => {
    let state = recordAttempt(fresh(), physics, { correct: false, choice: 0 });
    state = recordAttempt(state, physics, { correct: false, choice: 2 });
    state = recordAttempt(state, wave, { correct: false, choice: 0 });
    const p = getProgress(starterQuestions, state.history, 'physics');
    expect(
      getReasonCounts(p.mistakes, {
        [physics.id]: { reason: 'calculation', note: 'Check the triangle.' },
      }),
    ).toMatchObject([{ key: 'calculation', count: 1 }]);
    expect(getReasonCounts(p.mistakes, {})).toEqual([]);
  });

  it('shows a trend only after ten attempts and compares five with five', () => {
    let state = fresh();
    for (let i = 0; i < 9; i++)
      state = recordAttempt(state, physics, { correct: i >= 5, choice: i >= 5 ? 1 : 0 });
    expect(getProgress(starterQuestions, state.history, 'physics').trend).toBeNull();
    state = recordAttempt(state, physics, { correct: true, choice: 1 });
    const p = getProgress(starterQuestions, state.history, 'physics');
    expect(p.trend).toBe(100);
    expect(p.firstTryAccuracy).toBe(0);
    expect(p.accuracy).toBe(50);
  });
});

describe('Persistent progress and migration', () => {
  function store(value: unknown) {
    let raw = JSON.stringify(value);
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => (key === STORAGE_KEY ? raw : null),
      setItem: (_: string, value: string) => {
        raw = value;
      },
    });
  }
  it('keeps demo questions hidden by default, including for older workspaces', () => {
    expect(initialState.showDemoQuestions).toBe(false);
    store({ subject: 'physics', bookmarks: [physics.id] });
    expect(loadState().showDemoQuestions).toBe(false);
    store({ subject: 'math', showDemoQuestions: true });
    expect(loadState().showDemoQuestions).toBe(true);
  });
  it('migrates the previous latest results once, without fabricated dates', () => {
    const { history: _history, reviewNotes: _notes, ...old } = fresh();
    store({
      ...old,
      bookmarks: [physics.id],
      attempts: { [physics.id]: { correct: false, choice: 0 } },
    });
    const state = loadState();
    expect(state.bookmarks).toEqual([physics.id]);
    expect(state.history).toMatchObject([
      { questionId: physics.id, correct: false, createdAt: null },
    ]);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    expect(loadState().history).toHaveLength(1);
  });
  it('retains mistakes even if the current question has been reset for retry', () => {
    const state = recordAttempt(fresh(), math, { correct: false });
    delete state.attempts[math.id];
    state.reviewNotes[math.id] = { reason: 'method', note: 'Set the derivative equal to zero.' };
    store(state);
    const recovered = loadState();
    expect(recovered.attempts[math.id]).toBeUndefined();
    expect(recovered.history).toHaveLength(1);
    expect(recovered.reviewNotes[math.id].reason).toBe('method');
    expect(getProgress(starterQuestions, recovered.history, 'math').needsPractice).toBe(1);
  });
  it('recovers self-checks and skips malformed history and notes', () => {
    const state = recordAttempt(fresh(), math, { correct: true });
    store({
      ...state,
      history: [
        ...state.history,
        {
          id: 'bad',
          questionId: math.id,
          correct: false,
          kind: 'mcq',
          choice: 9,
          createdAt: 'not-a-date',
        },
      ],
      reviewNotes: { [math.id]: { reason: 'unknown', note: 'bad' } },
    });
    const recovered = loadState();
    expect(recovered.attempts[math.id]).toEqual({ correct: true, kind: 'self-check' });
    expect(recovered.history).toHaveLength(1);
    expect(recovered.reviewNotes).toEqual({});
  });
});
