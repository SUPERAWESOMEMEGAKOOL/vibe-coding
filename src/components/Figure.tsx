export default function Figure({ type }: { type: 'velocity' | 'wave' | 'parabola' }) {
  if (type === 'velocity')
    return (
      <div className="question-figure">
        <svg
          viewBox="0 0 400 170"
          role="img"
          aria-label="Velocity–time graph: velocity increases linearly from 0 metres per second at time 0 to 8 metres per second at time 4 seconds."
        >
          <defs>
            <pattern id="grid" width="48" height="28" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 28" fill="none" stroke="#f3eae0" strokeWidth="1" />
            </pattern>
          </defs>
          <rect x="60" y="16" width="288" height="112" fill="url(#grid)" />
          <path d="M60 16V128H360" fill="none" stroke="#a88e70" strokeWidth="1.5" />
          <path d="M60 128 300 30" stroke="#ad9579" strokeWidth="2.5" fill="none" />
          <path d="M300 30V128M60 30H300" stroke="#cdbaa5" strokeDasharray="4 4" fill="none" />
          <text x="30" y="34">
            8.0
          </text>
          <text x="47" y="145">
            0
          </text>
          <text x="290" y="145">
            4.0
          </text>
          <text x="322" y="157">
            t / s
          </text>
          <text x="8" y="14">
            v / m s⁻¹
          </text>
        </svg>
      </div>
    );
  if (type === 'wave')
    return (
      <div className="question-figure">
        <svg
          viewBox="0 0 400 130"
          role="img"
          aria-label="Illustration of a transverse wave with a wavelength of 0.80 metres between two crests."
        >
          <path d="M30 78H375" stroke="#d9cbbb" strokeWidth="1" />
          <path
            d="M35 78C60 12 90 12 115 78S170 144 195 78S250 12 275 78S330 144 355 78"
            fill="none"
            stroke="#ad9579"
            strokeWidth="2.5"
          />
          <path d="M75 20H235M75 15V25M235 15V25" stroke="#b8a38c" fill="none" />
          <text x="130" y="13">
            λ = 0.80 m
          </text>
        </svg>
      </div>
    );
  return (
    <div className="question-figure">
      <svg
        viewBox="0 0 400 150"
        role="img"
        aria-label="Reference graph of y equals x squared before translation."
      >
        <path d="M70 115H340M200 15V133" stroke="#d9cbbb" fill="none" />
        <path d="M110 20Q200 210 290 20" fill="none" stroke="#ad9579" strokeWidth="2.5" />
        <text x="290" y="35">
          y = x²
        </text>
        <text x="330" y="133">
          x
        </text>
        <text x="210" y="19">
          y
        </text>
        <text x="185" y="132">
          0
        </text>
      </svg>
    </div>
  );
}
