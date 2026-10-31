import type { Question, Subject } from '../types';

type Seed = Omit<Question, 'id' | 'subject' | 'source' | 'sourceName' | 'minutes' | 'paper'> & {
  paper?: string;
};
function seed(subject: Subject, data: Seed[]): Question[] {
  return data.map((q, i) => ({
    ...q,
    id: `${subject}-${String(i + 1).padStart(3, '0')}`,
    subject,
    source: 'original',
    sourceName: 'Folio original practice',
    minutes: q.type === 'mcq' ? 2 : Math.ceil(q.marks * 1.5),
    paper:
      q.paper ??
      (subject === 'math'
        ? 'Paper 1 style'
        : q.type === 'mcq'
          ? 'Paper 1A style'
          : 'Paper 2 style'),
  }));
}

export const starterQuestions: Question[] = [
  ...seed('math', [
    {
      topicId: 'm5',
      subtopic: 'Differentiation',
      type: 'structured',
      difficulty: 'Standard',
      marks: 6,
      prompt:
        "Let $f(x)=x^3-6x^2+9x+2$, for $x\\in\\mathbb{R}$.\n(a) Find $f'(x)$. [2]\n(b) Find the coordinates of the stationary points of the graph of $f$. [2]\n(c) Determine the nature of each stationary point. [2]",
      answer: "$f'(x)=3x^2-12x+9$. The local maximum is $(1,6)$ and the local minimum is $(3,2)$.",
      explanation:
        'Stationary points occur when the gradient is zero. Factor the derivative to find the two values of $x$, then use the second derivative to classify them.',
      steps: [
        { text: "Differentiate term by term: $f'(x)=3x^2-12x+9$.", marks: 2 },
        {
          text: 'Solve $3(x-1)(x-3)=0$ to obtain $x=1,3$; substitute to obtain $(1,6)$ and $(3,2)$.',
          marks: 2,
        },
        {
          text: "$f''(x)=6x-12$. Since $f''(1)=-6<0$, $(1,6)$ is a maximum; since $f''(3)=6>0$, $(3,2)$ is a minimum.",
          marks: 2,
        },
      ],
    },
    {
      topicId: 'm1',
      subtopic: 'Sequences and series',
      type: 'structured',
      difficulty: 'Standard',
      marks: 5,
      prompt:
        'An arithmetic sequence has third term $u_3=11$ and eighth term $u_8=31$.\n(a) Find the common difference and the first term. [3]\n(b) Find the sum of the first 20 terms. [2]',
      answer: '$d=4$, $u_1=3$, and $S_{20}=820$.',
      explanation:
        'Subtract the two equations for the known terms. Use $u_n=u_1+(n-1)d$ and the arithmetic-series formula.',
      steps: [
        { text: '$5d=31-11=20$, so $d=4$. Then $u_1+2(4)=11$ gives $u_1=3$.', marks: 3 },
        { text: '$S_{20}=\\frac{20}{2}[2(3)+19(4)]=820$.', marks: 2 },
      ],
    },
    {
      topicId: 'm2',
      subtopic: 'Composite and inverse functions',
      type: 'structured',
      difficulty: 'Foundation',
      marks: 4,
      prompt:
        'The functions $f$ and $g$ are defined by $f(x)=2x-3$ and $g(x)=x^2+1$.\n(a) Find $(g\\circ f)(x)$. [2]\n(b) Find $f^{-1}(x)$. [2]',
      answer: '$(g\\circ f)(x)=4x^2-12x+10$ and $f^{-1}(x)=\\frac{x+3}{2}$.',
      explanation:
        'A composite function applies the inside function first. For the inverse, set $y=2x-3$ and rearrange to make $x$ the subject.',
      steps: [
        { text: '$g(f(x))=(2x-3)^2+1=4x^2-12x+10$.', marks: 2 },
        { text: '$y=2x-3\\Rightarrow x=\\frac{y+3}{2}$, so $f^{-1}(x)=\\frac{x+3}{2}$.', marks: 2 },
      ],
    },
    {
      topicId: 'm3',
      subtopic: 'Vectors',
      type: 'structured',
      difficulty: 'Standard',
      marks: 5,
      prompt:
        'Let $\\mathbf{a}=(2,1,-2)$ and $\\mathbf{b}=(1,-2,2)$.\n(a) Find $\\mathbf{a}\\cdot\\mathbf{b}$. [2]\n(b) Find the angle between the two vectors, in degrees. Give your answer to three significant figures. [3]',
      answer: '$\\mathbf{a}\\cdot\\mathbf{b}=-4$ and $\\theta=116^\\circ$ (3 s.f.).',
      explanation:
        'The scalar product equals both the sum of the products of corresponding components and $|\\mathbf{a}||\\mathbf{b}|\\cos\\theta$.',
      paper: 'Paper 2 style',
      steps: [
        { text: '$\\mathbf{a}\\cdot\\mathbf{b}=2(1)+1(-2)+(-2)(2)=-4$.', marks: 2 },
        {
          text: '$|\\mathbf{a}|=|\\mathbf{b}|=3$. Thus $\\cos\\theta=-4/9$ and $\\theta\\approx116.388^\\circ\\approx116^\\circ$.',
          marks: 3,
        },
      ],
    },
    {
      topicId: 'm4',
      subtopic: 'Conditional probability',
      type: 'structured',
      difficulty: 'Standard',
      marks: 5,
      prompt:
        'For two events $A$ and $B$, $P(A)=0.6$, $P(B)=0.5$, and $P(A\\cap B)=0.3$.\n(a) Find $P(A\\mid B)$. [2]\n(b) Determine whether $A$ and $B$ are independent, giving a reason. [1]\n(c) Find $P(A\\cup B)$. [2]',
      answer: '$P(A\\mid B)=0.6$. The events are independent. $P(A\\cup B)=0.8$.',
      explanation:
        'Conditional probability restricts the sample space to event $B$. Independence is established when the intersection probability equals the product of the individual probabilities.',
      steps: [
        { text: '$P(A\\mid B)=\\frac{0.3}{0.5}=0.6$.', marks: 2 },
        { text: '$P(A)P(B)=0.6(0.5)=0.3=P(A\\cap B)$, so the events are independent.', marks: 1 },
        { text: '$P(A\\cup B)=0.6+0.5-0.3=0.8$.', marks: 2 },
      ],
    },
    {
      topicId: 'm5',
      subtopic: 'Integration',
      type: 'structured',
      difficulty: 'Standard',
      marks: 5,
      prompt: 'Find the exact value of $\\displaystyle\\int_0^1 x e^{2x}\\,\\mathrm{d}x$.',
      answer: '$\\displaystyle\\frac{e^2+1}{4}$.',
      explanation:
        'Use integration by parts with $u=x$ and $\\mathrm{d}v=e^{2x}\\,\\mathrm{d}x$. Remember that the lower limit contributes a negative term before subtraction.',
      steps: [
        { text: 'Choose $u=x$, $v=\\frac12e^{2x}$.', marks: 1 },
        { text: '$\\int xe^{2x}\\,\\mathrm{d}x=\\frac{x}{2}e^{2x}-\\frac14e^{2x}+C$.', marks: 2 },
        {
          text: 'Evaluate: $[\\frac{x}{2}e^{2x}-\\frac14e^{2x}]_0^1=\\frac14e^2+\\frac14$.',
          marks: 2,
        },
      ],
    },
    {
      topicId: 'm1',
      subtopic: 'Complex numbers',
      type: 'structured',
      difficulty: 'Challenge',
      marks: 6,
      prompt:
        'The complex number $z$ satisfies $z^3=8i$. Find all three possible values of $z$, giving your answers in the form $a+bi$.',
      answer: '$z=\\sqrt3+i$, $-\\sqrt3+i$, or $-2i$.',
      explanation:
        'Write $8i$ in modulus–argument form. Divide each possible argument by three and use the three distinct values generated by $k=0,1,2$.',
      steps: [
        {
          text: '$8i=8\\operatorname{cis}(\\frac\\pi2+2k\\pi)$. Each root has modulus $2$.',
          marks: 2,
        },
        {
          text: 'Arguments are $\\frac\\pi6$, $\\frac{5\\pi}{6}$, and $\\frac{3\\pi}{2}$.',
          marks: 2,
        },
        { text: 'Convert to Cartesian form: $\\sqrt3+i$, $-\\sqrt3+i$, and $-2i$.', marks: 2 },
      ],
    },
    {
      topicId: 'm2',
      subtopic: 'Polynomials',
      type: 'structured',
      difficulty: 'Standard',
      marks: 5,
      prompt:
        'The polynomial $p(x)=x^3+kx^2-4x-4$ has a factor $(x-2)$.\n(a) Find $k$. [2]\n(b) Factorize $p(x)$ completely. [3]',
      answer: '$k=1$ and $p(x)=(x-2)(x+1)(x+2)$.',
      explanation:
        'The factor theorem gives $p(2)=0$. After finding $k$, divide by $x-2$ and factor the quadratic.',
      steps: [
        { text: '$p(2)=8+4k-8-4=0$ gives $k=1$.', marks: 2 },
        { text: '$p(x)=(x-2)(x^2+3x+2)=(x-2)(x+1)(x+2)$.', marks: 3 },
      ],
    },
    {
      topicId: 'm3',
      subtopic: 'Trigonometric identities',
      type: 'structured',
      difficulty: 'Foundation',
      marks: 4,
      prompt: 'Solve $2\\sin^2x-3\\sin x+1=0$ for $0\\leq x\\leq2\\pi$. Give exact answers.',
      answer: '$x=\\frac\\pi6,\\frac\\pi2,\\frac{5\\pi}{6}$.',
      explanation:
        'Treat the equation as a quadratic in $\\sin x$. Sine is positive in the first and second quadrants.',
      steps: [
        { text: 'Factor: $(2\\sin x-1)(\\sin x-1)=0$.', marks: 2 },
        {
          text: '$\\sin x=\\frac12$ gives $\\frac\\pi6,\\frac{5\\pi}{6}$; $\\sin x=1$ gives $\\frac\\pi2$.',
          marks: 2,
        },
      ],
    },
    {
      topicId: 'm4',
      subtopic: 'Binomial distribution',
      type: 'structured',
      difficulty: 'Standard',
      marks: 5,
      paper: 'Paper 2 style',
      prompt:
        'A fair six-sided die is rolled 10 times. Let $X$ be the number of sixes obtained.\n(a) State the distribution of $X$. [1]\n(b) Find $P(X=2)$. [2]\n(c) Find $P(X\\geq1)$. [2]',
      answer:
        '$X\\sim\\mathrm{B}(10,\\frac16)$, $P(X=2)\\approx0.291$, and $P(X\\geq1)\\approx0.838$.',
      explanation:
        'Each roll is an independent trial with two outcomes: a six or not a six. For at least one six, use the complement of no sixes.',
      steps: [
        { text: '$X\\sim\\mathrm{B}(10,\\frac16)$.', marks: 1 },
        { text: '$P(X=2)=\\binom{10}{2}(\\frac16)^2(\\frac56)^8\\approx0.291$.', marks: 2 },
        { text: '$P(X\\geq1)=1-(\\frac56)^{10}\\approx0.838$.', marks: 2 },
      ],
    },
    {
      topicId: 'm5',
      subtopic: 'Differential equations',
      type: 'structured',
      difficulty: 'Challenge',
      marks: 6,
      prompt:
        'Solve the differential equation $\\frac{\\mathrm{d}y}{\\mathrm{d}x}=2xy$, given that $y=3$ when $x=0$.',
      answer: '$y=3e^{x^2}$.',
      explanation:
        'Separate the variables before integrating. The initial condition fixes the arbitrary multiplicative constant.',
      steps: [
        { text: 'Separate: $\\frac1y\\,\\mathrm{d}y=2x\\,\\mathrm{d}x$.', marks: 2 },
        { text: 'Integrate: $\\ln|y|=x^2+C$, so $y=Ae^{x^2}$.', marks: 2 },
        { text: 'Use $(0,3)$: $A=3$. Therefore $y=3e^{x^2}$.', marks: 2 },
      ],
    },
    {
      topicId: 'm1',
      subtopic: 'Binomial theorem',
      type: 'structured',
      difficulty: 'Foundation',
      marks: 3,
      prompt: 'Find the coefficient of $x^3$ in the expansion of $(1+2x)^5$.',
      answer: '$80$.',
      explanation: 'The $x^3$ term comes from selecting $2x$ from three of the five factors.',
      steps: [
        { text: 'Use $\\binom53(2x)^3$.', marks: 2 },
        { text: 'The coefficient is $10\\times8=80$.', marks: 1 },
      ],
    },
    {
      topicId: 'm2',
      subtopic: 'Transformations',
      type: 'structured',
      difficulty: 'Foundation',
      marks: 4,
      prompt:
        'The graph of $y=x^2$ is translated 3 units to the right and 2 units down.\n(a) Write the equation of the new graph. [2]\n(b) State its vertex and axis of symmetry. [2]',
      figure: 'parabola',
      answer: '$y=(x-3)^2-2$. Vertex $(3,-2)$; axis $x=3$.',
      explanation:
        'A horizontal translation to the right replaces $x$ with $x-3$. A vertical translation downward subtracts 2 from the function.',
      steps: [
        { text: 'The equation is $y=(x-3)^2-2$.', marks: 2 },
        { text: 'Vertex $(3,-2)$ and axis of symmetry $x=3$.', marks: 2 },
      ],
    },
    {
      topicId: 'm3',
      subtopic: 'Lines and planes',
      type: 'structured',
      difficulty: 'Challenge',
      marks: 5,
      prompt:
        'Find the Cartesian equation of the plane through $P(1,2,3)$ with normal vector $\\mathbf{n}=(2,-1,4)$. Determine the point where the $z$-axis meets the plane.',
      answer: '$2x-y+4z=12$. The intercept is $(0,0,3)$.',
      explanation:
        'For any point $\\mathbf{r}$ on the plane, $\\mathbf{n}\\cdot(\\mathbf{r}-\\mathbf{p})=0$. Points on the $z$-axis have $x=y=0$.',
      steps: [
        { text: '$2(x-1)-(y-2)+4(z-3)=0$.', marks: 2 },
        { text: 'Simplify to $2x-y+4z=12$.', marks: 1 },
        { text: 'Set $x=y=0$: $4z=12$, so the point is $(0,0,3)$.', marks: 2 },
      ],
    },
    {
      topicId: 'm4',
      subtopic: 'Continuous random variables',
      type: 'structured',
      difficulty: 'Challenge',
      marks: 6,
      prompt:
        'A continuous random variable $X$ has probability density $f(x)=kx(2-x)$ for $0\\leq x\\leq2$, and $f(x)=0$ otherwise.\n(a) Find $k$. [3]\n(b) Find $E(X)$. [3]',
      answer: '$k=\\frac34$ and $E(X)=1$.',
      explanation:
        'A probability density must integrate to one. The expected value is the integral of $xf(x)$; symmetry about $x=1$ also checks the result.',
      steps: [
        { text: '$k\\int_0^2(2x-x^2)\\,\\mathrm{d}x=k(4-\\frac83)=1$, so $k=\\frac34$.', marks: 3 },
        {
          text: '$E(X)=\\frac34\\int_0^2(2x^2-x^3)\\,\\mathrm{d}x=\\frac34(\\frac{16}{3}-4)=1$.',
          marks: 3,
        },
      ],
    },
  ]),
  ...seed('physics', [
    {
      topicId: 'pA',
      subtopic: 'A.1 Kinematics',
      type: 'mcq',
      difficulty: 'Foundation',
      marks: 1,
      figure: 'velocity',
      prompt:
        'The velocity–time graph shows the motion of a particle. What is its displacement during the first $4.0\\,\\mathrm{s}$?',
      options: [
        '$8.0\\,\\mathrm{m}$',
        '$16\\,\\mathrm{m}$',
        '$24\\,\\mathrm{m}$',
        '$32\\,\\mathrm{m}$',
      ],
      correctOption: 1,
      answer: 'B — $16\\,\\mathrm{m}$.',
      explanation:
        'Displacement is the signed area under a velocity–time graph. Here the area is a triangle of base $4.0\\,\\mathrm{s}$ and height $8.0\\,\\mathrm{m\\,s^{-1}}$.',
      steps: [{ text: '$s=\\frac12\\times4.0\\times8.0=16\\,\\mathrm{m}$.', marks: 1 }],
    },
    {
      topicId: 'pB',
      subtopic: 'B.3 Gas laws',
      type: 'mcq',
      difficulty: 'Standard',
      marks: 1,
      prompt:
        'A fixed mass of ideal gas is held at constant volume. Its absolute temperature is doubled. What happens to its pressure?',
      options: ['It is halved.', 'It is unchanged.', 'It is doubled.', 'It is quadrupled.'],
      correctOption: 2,
      answer: 'C — It is doubled.',
      explanation:
        'From $pV=nRT$, pressure is directly proportional to absolute temperature when the volume and amount of gas are constant. Temperature must be in kelvin.',
      steps: [{ text: '$p\\propto T$ at constant $V$ and $n$, so $p_2=2p_1$.', marks: 1 }],
    },
    {
      topicId: 'pC',
      subtopic: 'C.2 Wave model',
      type: 'mcq',
      difficulty: 'Foundation',
      marks: 1,
      figure: 'wave',
      prompt:
        'A transverse wave has a wavelength of $0.80\\,\\mathrm{m}$ and a frequency of $5.0\\,\\mathrm{Hz}$. What is its speed?',
      options: [
        '$0.16\\,\\mathrm{m\\,s^{-1}}$',
        '$4.0\\,\\mathrm{m\\,s^{-1}}$',
        '$5.8\\,\\mathrm{m\\,s^{-1}}$',
        '$6.25\\,\\mathrm{m\\,s^{-1}}$',
      ],
      correctOption: 1,
      answer: 'B — $4.0\\,\\mathrm{m\\,s^{-1}}$.',
      explanation:
        'The wave travels one wavelength during each oscillation, so its speed is frequency multiplied by wavelength.',
      steps: [{ text: '$v=f\\lambda=5.0\\times0.80=4.0\\,\\mathrm{m\\,s^{-1}}$.', marks: 1 }],
    },
    {
      topicId: 'pD',
      subtopic: 'D.1 Gravitational fields',
      type: 'mcq',
      difficulty: 'Standard',
      marks: 1,
      prompt:
        'The gravitational field strength at distance $r$ from the centre of an isolated spherical planet is $g$. What is the field strength at distance $2r$ from its centre?',
      options: ['$g/4$', '$g/2$', '$2g$', '$4g$'],
      correctOption: 0,
      answer: 'A — $g/4$.',
      explanation:
        'Outside a spherical planet, gravitational field strength follows an inverse-square law. Doubling the distance reduces the field strength by a factor of four.',
      steps: [{ text: '$g=GM/r^2$, so $g(2r)=GM/(2r)^2=g/4$.', marks: 1 }],
    },
    {
      topicId: 'pE',
      subtopic: 'E.3 Radioactive decay',
      type: 'mcq',
      difficulty: 'Foundation',
      marks: 1,
      prompt:
        'A radioactive isotope has a half-life of 6 hours. What fraction of the original undecayed nuclei remains after 18 hours?',
      options: ['$1/2$', '$1/3$', '$1/6$', '$1/8$'],
      correctOption: 3,
      answer: 'D — $1/8$.',
      explanation:
        'Eighteen hours is three half-lives. The number of undecayed nuclei halves three times.',
      steps: [{ text: '$N/N_0=(\\frac12)^{18/6}=(\\frac12)^3=\\frac18$.', marks: 1 }],
    },
    {
      topicId: 'pA',
      subtopic: 'A.4 Rigid body mechanics',
      type: 'mcq',
      difficulty: 'Challenge',
      marks: 1,
      prompt:
        'A uniform solid disc rotates about its central axis with moment of inertia $I$. A constant resultant torque $\\tau$ acts on it. What is its angular acceleration?',
      options: ['$I/\\tau$', '$\\tau I$', '$\\tau/I$', '$\\tau/I^2$'],
      correctOption: 2,
      answer: 'C — $\\tau/I$.',
      explanation:
        'The rotational analogue of Newton’s second law is $\\tau=I\\alpha$. The moment of inertia is constant for this disc.',
      steps: [{ text: 'Rearrange $\\tau=I\\alpha$ to obtain $\\alpha=\\tau/I$.', marks: 1 }],
    },
    {
      topicId: 'pB',
      subtopic: 'B.5 Current and circuits',
      type: 'structured',
      difficulty: 'Standard',
      marks: 5,
      prompt:
        'A battery of emf $12\\,\\mathrm{V}$ and internal resistance $1.0\\,\\Omega$ is connected to a $5.0\\,\\Omega$ resistor.\n(a) Find the current in the circuit. [2]\n(b) Find the terminal potential difference of the battery. [2]\n(c) Find the power dissipated in the external resistor. [1]',
      answer: '$I=2.0\\,\\mathrm{A}$, $V=10\\,\\mathrm{V}$, and $P=20\\,\\mathrm{W}$.',
      explanation:
        'The internal resistance is in series with the external resistor. Some of the emf is lost across the internal resistance.',
      steps: [
        { text: '$I=\\frac{\\varepsilon}{R+r}=\\frac{12}{5+1}=2.0\\,\\mathrm{A}$.', marks: 2 },
        { text: '$V=\\varepsilon-Ir=12-2(1)=10\\,\\mathrm{V}$.', marks: 2 },
        { text: '$P=I^2R=2^2(5)=20\\,\\mathrm{W}$.', marks: 1 },
      ],
    },
    {
      topicId: 'pC',
      subtopic: 'C.1 Simple harmonic motion',
      type: 'mcq',
      difficulty: 'Standard',
      marks: 1,
      prompt:
        'An object undergoes simple harmonic motion with amplitude $A$ and angular frequency $\\omega$. What is the magnitude of its maximum acceleration?',
      options: ['$\\omega A$', '$\\omega^2A$', '$\\omega/A$', '$A/\\omega^2$'],
      correctOption: 1,
      answer: 'B — $\\omega^2A$.',
      explanation:
        'For SHM, $a=-\\omega^2x$. The magnitude of acceleration is greatest at the turning points, where $|x|=A$.',
      steps: [{ text: '$a_{\\max}=\\omega^2A$.', marks: 1 }],
    },
    {
      topicId: 'pD',
      subtopic: 'D.4 Induction',
      type: 'mcq',
      difficulty: 'Challenge',
      marks: 1,
      prompt:
        'The magnetic flux through each turn of a 200-turn coil changes uniformly from $0.030\\,\\mathrm{Wb}$ to $0.010\\,\\mathrm{Wb}$ in $0.50\\,\\mathrm{s}$. What is the magnitude of the induced emf?',
      options: [
        '$0.040\\,\\mathrm{V}$',
        '$4.0\\,\\mathrm{V}$',
        '$8.0\\,\\mathrm{V}$',
        '$16\\,\\mathrm{V}$',
      ],
      correctOption: 2,
      answer: 'C — $8.0\\,\\mathrm{V}$.',
      explanation:
        'Faraday’s law uses the rate of change of flux linkage, so multiply the flux change per turn by the number of turns.',
      steps: [
        {
          text: '$|\\varepsilon|=N|\\Delta\\Phi|/\\Delta t=200(0.020)/0.50=8.0\\,\\mathrm{V}$.',
          marks: 1,
        },
      ],
    },
    {
      topicId: 'pE',
      subtopic: 'E.2 Quantum physics',
      type: 'mcq',
      difficulty: 'Standard',
      marks: 1,
      prompt:
        'Light of frequency $f$ falls on a metal with work function $\\phi$. If $hf>\\phi$, what is the maximum kinetic energy of an emitted photoelectron?',
      options: ['$hf$', '$\\phi-hf$', '$hf+\\phi$', '$hf-\\phi$'],
      correctOption: 3,
      answer: 'D — $hf-\\phi$.',
      explanation:
        'A single photon transfers energy $hf$. The work function is the minimum energy required for the electron to escape; the remainder can become kinetic energy.',
      steps: [
        { text: 'Einstein’s photoelectric equation gives $E_{k,\\max}=hf-\\phi$.', marks: 1 },
      ],
    },
    {
      topicId: 'pA',
      subtopic: 'A.5 Galilean and special relativity',
      type: 'structured',
      difficulty: 'Challenge',
      marks: 5,
      prompt:
        'A spacecraft travels at speed $0.80c$ relative to Earth. Two events at the same position in the spacecraft are separated by $3.0\\,\\mathrm{\\mu s}$ according to its clock.\n(a) Calculate the Lorentz factor. [2]\n(b) Calculate the time interval measured in the Earth frame. [3]',
      answer: '$\\gamma=1.67$ and $\\Delta t=5.0\\,\\mathrm{\\mu s}$.',
      explanation:
        'The spacecraft measures proper time because the two events occur at the same position in that frame. Observers on Earth measure a longer interval.',
      steps: [
        { text: '$\\gamma=1/\\sqrt{1-0.80^2}=1/0.60\\approx1.67$.', marks: 2 },
        { text: '$\\Delta t=\\gamma\\Delta t_0=(5/3)(3.0)=5.0\\,\\mathrm{\\mu s}$.', marks: 3 },
      ],
    },
    {
      topicId: 'pB',
      subtopic: 'B.4 Thermodynamics',
      type: 'mcq',
      difficulty: 'Standard',
      marks: 1,
      prompt:
        'A gas absorbs $500\\,\\mathrm{J}$ of heat and does $200\\,\\mathrm{J}$ of work on its surroundings. What is the change in its internal energy?',
      options: [
        '$-700\\,\\mathrm{J}$',
        '$-300\\,\\mathrm{J}$',
        '$+300\\,\\mathrm{J}$',
        '$+700\\,\\mathrm{J}$',
      ],
      correctOption: 2,
      answer: 'C — $+300\\,\\mathrm{J}$.',
      explanation:
        'Use the first law with work done by the gas positive: the energy stored increases by the heat received minus the energy transferred out as work.',
      steps: [{ text: '$\\Delta U=Q-W=500-200=+300\\,\\mathrm{J}$.', marks: 1 }],
    },
    {
      topicId: 'pC',
      subtopic: 'C.4 Standing waves and resonance',
      type: 'structured',
      difficulty: 'Standard',
      marks: 4,
      prompt:
        'A string of length $0.80\\,\\mathrm{m}$ is fixed at both ends. Waves travel along it at $120\\,\\mathrm{m\\,s^{-1}}$.\n(a) Find the fundamental frequency. [2]\n(b) Find the frequency of the third harmonic. [2]',
      answer: '$f_1=75\\,\\mathrm{Hz}$ and $f_3=225\\,\\mathrm{Hz}$.',
      explanation:
        'The fundamental has half a wavelength along the string. For a string fixed at both ends, the harmonic frequencies are integer multiples of the fundamental.',
      steps: [
        {
          text: '$\\lambda_1=2L=1.60\\,\\mathrm{m}$, so $f_1=120/1.60=75\\,\\mathrm{Hz}$.',
          marks: 2,
        },
        { text: '$f_3=3f_1=225\\,\\mathrm{Hz}$.', marks: 2 },
      ],
    },
    {
      topicId: 'pD',
      subtopic: 'D.3 Motion in electromagnetic fields',
      type: 'structured',
      difficulty: 'Challenge',
      marks: 4,
      prompt:
        'A particle of mass $m$ and positive charge $q$ enters a uniform magnetic field of magnitude $B$ at speed $v$, perpendicular to the field. Show that the radius of its circular path is $r=\\frac{mv}{qB}$. Explain why its speed remains constant.',
      answer: '$qvB=mv^2/r$, hence $r=mv/(qB)$. The magnetic force does no work.',
      explanation:
        'The magnetic force provides the centripetal force. It is always perpendicular to the instantaneous velocity, so it changes direction without changing kinetic energy.',
      steps: [
        { text: 'Equate $F_B=qvB$ to $F_c=mv^2/r$.', marks: 2 },
        { text: 'Rearrange to $r=mv/(qB)$.', marks: 1 },
        {
          text: 'The force is perpendicular to motion, so no work is done and speed stays constant.',
          marks: 1,
        },
      ],
    },
    {
      topicId: 'pE',
      subtopic: 'E.1 Structure of the atom',
      type: 'structured',
      difficulty: 'Standard',
      marks: 4,
      prompt:
        'An electron in a hydrogen atom moves from an energy level of $-1.51\\,\\mathrm{eV}$ to one of $-3.40\\,\\mathrm{eV}$.\n(a) State whether a photon is absorbed or emitted. [1]\n(b) Calculate its wavelength. Use $hc=1240\\,\\mathrm{eV\\,nm}$. [3]',
      answer: 'A photon is emitted, with wavelength $656\\,\\mathrm{nm}$ (3 s.f.).',
      explanation:
        'The electron moves to a lower energy state, releasing the energy difference as a photon. Use $E=hc/\\lambda$.',
      steps: [
        { text: 'A photon is emitted because the atom loses energy.', marks: 1 },
        { text: '$E=(-1.51)-(-3.40)=1.89\\,\\mathrm{eV}$.', marks: 1 },
        { text: '$\\lambda=1240/1.89\\approx656\\,\\mathrm{nm}$.', marks: 2 },
      ],
    },
  ]),
];
