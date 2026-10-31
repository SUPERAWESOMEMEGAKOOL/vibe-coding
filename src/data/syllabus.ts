import type { Subject, Topic } from '../types';

export const subjects = {
  math: {
    name: 'Mathematics',
    short: 'Math AA HL',
    full: 'Mathematics: Analysis & Approaches HL',
    firstAssessment: 2021,
    description: 'Build confidence, one problem at a time.',
    symbol: 'ƒ',
  },
  physics: {
    name: 'Physics',
    short: 'Physics HL',
    full: 'Physics HL',
    firstAssessment: 2025,
    description: 'Make sense of the world, one question at a time.',
    symbol: 'φ',
  },
} satisfies Record<Subject, object>;

export const topics: Record<Subject, Topic[]> = {
  math: [
    {
      id: 'm1',
      code: '1',
      name: 'Number and algebra',
      shortName: 'Algebra',
      subtopics: [
        'Sequences and series',
        'Binomial theorem',
        'Complex numbers',
        'Proof and induction',
        'Logarithms',
      ],
    },
    {
      id: 'm2',
      code: '2',
      name: 'Functions',
      shortName: 'Functions',
      subtopics: [
        'Composite and inverse functions',
        'Transformations',
        'Polynomials',
        'Rational functions',
        'Exponential functions',
      ],
    },
    {
      id: 'm3',
      code: '3',
      name: 'Geometry and trigonometry',
      shortName: 'Geometry',
      subtopics: [
        'Trigonometric identities',
        'Vectors',
        'Lines and planes',
        'Circular measure',
        'Trigonometric equations',
      ],
    },
    {
      id: 'm4',
      code: '4',
      name: 'Statistics and probability',
      shortName: 'Probability',
      subtopics: [
        'Conditional probability',
        'Discrete random variables',
        'Binomial distribution',
        'Normal distribution',
        'Continuous random variables',
      ],
    },
    {
      id: 'm5',
      code: '5',
      name: 'Calculus',
      shortName: 'Calculus',
      subtopics: [
        'Differentiation',
        'Integration',
        'Differential equations',
        'Maclaurin series',
        'Optimization',
      ],
    },
  ],
  physics: [
    {
      id: 'pA',
      code: 'A',
      name: 'Space, time and motion',
      shortName: 'Motion',
      subtopics: [
        'A.1 Kinematics',
        'A.2 Forces and momentum',
        'A.3 Work, energy and power',
        'A.4 Rigid body mechanics',
        'A.5 Galilean and special relativity',
      ],
    },
    {
      id: 'pB',
      code: 'B',
      name: 'The particulate nature of matter',
      shortName: 'Matter',
      subtopics: [
        'B.1 Thermal energy transfers',
        'B.2 Greenhouse effect',
        'B.3 Gas laws',
        'B.4 Thermodynamics',
        'B.5 Current and circuits',
      ],
    },
    {
      id: 'pC',
      code: 'C',
      name: 'Wave behaviour',
      shortName: 'Waves',
      subtopics: [
        'C.1 Simple harmonic motion',
        'C.2 Wave model',
        'C.3 Wave phenomena',
        'C.4 Standing waves and resonance',
        'C.5 Doppler effect',
      ],
    },
    {
      id: 'pD',
      code: 'D',
      name: 'Fields',
      shortName: 'Fields',
      subtopics: [
        'D.1 Gravitational fields',
        'D.2 Electric and magnetic fields',
        'D.3 Motion in electromagnetic fields',
        'D.4 Induction',
      ],
    },
    {
      id: 'pE',
      code: 'E',
      name: 'Nuclear and quantum physics',
      shortName: 'Nuclear',
      subtopics: [
        'E.1 Structure of the atom',
        'E.2 Quantum physics',
        'E.3 Radioactive decay',
        'E.4 Fission',
        'E.5 Fusion and stars',
      ],
    },
  ],
};

export const getTopic = (subject: Subject, id: string) =>
  topics[subject].find((topic) => topic.id === id);
