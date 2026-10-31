export type Subject = 'math' | 'physics';
export type QuestionType = 'structured' | 'mcq';
export type Difficulty = 'Foundation' | 'Standard' | 'Challenge';
export type View = 'bank' | 'saved' | 'papers' | 'sources' | 'syllabus' | 'mistakes' | 'feedback';

export interface Topic {
  id: string;
  code: string;
  name: string;
  shortName: string;
  subtopics: string[];
}

export interface Question {
  id: string;
  subject: Subject;
  topicId: string;
  subtopic: string;
  type: QuestionType;
  difficulty: Difficulty;
  marks: number;
  minutes: number;
  paper: string;
  prompt: string;
  options?: string[];
  correctOption?: number;
  answer: string;
  explanation: string;
  steps: { text: string; marks: number }[];
  source: 'original' | 'past-paper';
  sourceName: string;
  year?: number;
  sourceUrl?: string;
  markSchemeUrl?: string;
  figure?: 'velocity' | 'wave' | 'parabola';
}

export interface Attempt {
  choice?: number;
  correct: boolean;
  kind?: 'mcq' | 'self-check';
}

export interface PracticeEvent {
  id: string;
  questionId: string;
  correct: boolean;
  kind: 'mcq' | 'self-check';
  choice?: number;
  /** Older saved attempts have no reliable timestamp. */
  createdAt: string | null;
}

export type MistakeReason = 'concept' | 'method' | 'calculation' | 'reading' | 'unsure';

export interface ReviewNote {
  reason: MistakeReason;
  note: string;
}

export interface PracticePaper {
  id: string;
  name: string;
  subject: Subject;
  questions: Question[];
  createdAt: string;
}

export interface AppState {
  subject: Subject;
  bookmarks: string[];
  attempts: Record<string, Attempt>;
  history: PracticeEvent[];
  reviewNotes: Record<string, ReviewNote>;
  selected: string[];
  customQuestions: Question[];
  papers: PracticePaper[];
}
