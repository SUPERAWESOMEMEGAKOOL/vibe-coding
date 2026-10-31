import { topics } from '../data/syllabus';
import type { AppState, PracticeEvent, Question, ReviewNote, Subject, Topic } from '../types';

export const mistakeReasons = {
  concept: {
    label: 'Concept gap',
    advice:
      'Revisit the definition or principle, explain it in your own words, then try a fresh question before looking at the solution.',
  },
  method: {
    label: 'Method / setup',
    advice:
      'Write down the known quantities and choose your method before calculating. Compare your first step with the worked solution.',
  },
  calculation: {
    label: 'Calculation slip',
    advice:
      'Keep one calculation per line. Check signs, substitutions, units, and rounding before you settle on an answer.',
  },
  reading: {
    label: 'Misread the question',
    advice:
      'Underline the command term, required units, and restrictions. Restate what the question is asking before you start.',
  },
  unsure: {
    label: 'Not sure yet',
    advice:
      'Attempt the question without the solution, then compare your working line by line to find the first point where your reasoning changes.',
  },
} as const;

export interface MistakeEntry {
  question: Question;
  attempts: number;
  misses: number;
  latest: PracticeEvent;
  lastMistake: PracticeEvent;
  improved: boolean;
}

export interface TopicProgress {
  topic: Topic;
  attempts: number;
  correct: number;
  accuracy: number | null;
  uniqueQuestions: number;
  mistakes: MistakeEntry[];
  needsPractice: number;
  improved: number;
}

export function recordAttempt(
  state: AppState,
  question: Question,
  result: { correct: boolean; choice?: number },
  now = new Date().toISOString(),
): AppState {
  const kind = question.type === 'mcq' ? 'mcq' : 'self-check';
  const event: PracticeEvent = {
    id: crypto.randomUUID(),
    questionId: question.id,
    correct: result.correct,
    kind,
    createdAt: now,
    ...(kind === 'mcq' ? { choice: result.choice } : {}),
  };
  return {
    ...state,
    attempts: {
      ...state.attempts,
      [question.id]: {
        correct: result.correct,
        kind,
        ...(kind === 'mcq' ? { choice: result.choice } : {}),
      },
    },
    history: [...state.history, event],
  };
}

export function getProgress(questions: Question[], history: PracticeEvent[], subject: Subject) {
  const bank = new Map(questions.filter((q) => q.subject === subject).map((q) => [q.id, q]));
  const events = history.filter((event) => bank.has(event.questionId));
  const byQuestion = new Map<string, PracticeEvent[]>();
  for (const event of events) {
    const entries = byQuestion.get(event.questionId) ?? [];
    entries.push(event);
    byQuestion.set(event.questionId, entries);
  }
  const mistakes: MistakeEntry[] = [];
  for (const [id, attempts] of byQuestion) {
    const misses = attempts.filter((attempt) => !attempt.correct).length;
    if (misses) {
      const latest = attempts[attempts.length - 1];
      mistakes.push({
        question: bank.get(id)!,
        attempts: attempts.length,
        misses,
        latest,
        lastMistake: attempts.filter((a) => !a.correct).at(-1)!,
        improved: latest.correct,
      });
    }
  }
  const topicProgress: TopicProgress[] = topics[subject].map((topic) => {
    const topicEvents = events.filter((event) => bank.get(event.questionId)!.topicId === topic.id);
    const topicMistakes = mistakes.filter((mistake) => mistake.question.topicId === topic.id);
    const correct = topicEvents.filter((event) => event.correct).length;
    return {
      topic,
      attempts: topicEvents.length,
      correct,
      accuracy: topicEvents.length ? Math.round((correct / topicEvents.length) * 100) : null,
      uniqueQuestions: new Set(topicEvents.map((event) => event.questionId)).size,
      mistakes: topicMistakes,
      needsPractice: topicMistakes.filter((m) => !m.improved).length,
      improved: topicMistakes.filter((m) => m.improved).length,
    };
  });
  const correct = events.filter((event) => event.correct).length;
  const firstTries = [...byQuestion.values()].map((attempts) => attempts[0]);
  const accuracy = events.length ? Math.round((correct / events.length) * 100) : null;
  const firstTryAccuracy = firstTries.length
    ? Math.round((firstTries.filter((event) => event.correct).length / firstTries.length) * 100)
    : null;
  const recent = events.slice(-5);
  const previous = events.slice(-10, -5);
  const trend =
    events.length >= 10
      ? Math.round(
          ((recent.filter((e) => e.correct).length - previous.filter((e) => e.correct).length) /
            5) *
            100,
        )
      : null;
  const priorities = topicProgress
    .filter((t) => t.mistakes.length)
    .sort(
      (a, b) =>
        b.needsPractice - a.needsPractice ||
        (a.accuracy ?? 100) - (b.accuracy ?? 100) ||
        b.mistakes.length - a.mistakes.length,
    );
  return {
    events,
    mistakes,
    topics: topicProgress,
    priorities,
    correct,
    accuracy,
    firstTryAccuracy,
    uniqueQuestions: byQuestion.size,
    needsPractice: mistakes.filter((m) => !m.improved).length,
    improved: mistakes.filter((m) => m.improved).length,
    trend,
  };
}

export function getReasonCounts(mistakes: MistakeEntry[], notes: Record<string, ReviewNote>) {
  return Object.entries(mistakeReasons)
    .map(([key, value]) => ({
      key,
      ...value,
      count: mistakes.filter((m) => notes[m.question.id]?.reason === key).length,
    }))
    .filter((reason) => reason.count > 0)
    .sort((a, b) => b.count - a.count);
}
