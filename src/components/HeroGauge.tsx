/** Gauge arc labels on the scale (center 110,100 · radius 86). */
function labelPos(value: number) {
  const cx = 110;
  const cy = 100;
  const r = 76;
  const t = (value - 25) / 75;
  const angle = Math.PI * (1 - t);
  return { x: cx + r * Math.cos(angle), y: cy - r * Math.sin(angle) };
}

function needleTip(score = 85) {
  const cx = 110;
  const cy = 100;
  const len = 62;
  const t = (score - 25) / 75;
  const angle = Math.PI * (1 - t);
  return { x2: cx + len * Math.cos(angle), y2: cy - len * Math.sin(angle) };
}

export function HeroGauge({ gradientId = "heroGaugeGrad" }: { gradientId?: string }) {
  const l25 = labelPos(25);
  const l50 = labelPos(50);
  const l75 = labelPos(75);
  const l100 = labelPos(100);
  const tip = needleTip(85);

  return (
    <svg className="guide-hero__gauge-svg" viewBox="0 0 220 120" role="presentation">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ffb3c6" />
          <stop offset="100%" stopColor="#ee164f" />
        </linearGradient>
      </defs>
      <path
        d="M 24 100 A 86 86 0 0 1 196 100"
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="14"
        strokeLinecap="round"
      />
      <text
        x={l25.x}
        y={l25.y}
        fill="rgba(255,255,255,0.85)"
        fontSize="11"
        fontFamily="Lato,sans-serif"
        fontWeight="700"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        25
      </text>
      <text
        x={l50.x}
        y={l50.y}
        fill="rgba(255,255,255,0.85)"
        fontSize="11"
        fontFamily="Lato,sans-serif"
        fontWeight="700"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        50
      </text>
      <text
        x={l75.x}
        y={l75.y}
        fill="rgba(255,255,255,0.85)"
        fontSize="11"
        fontFamily="Lato,sans-serif"
        fontWeight="700"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        75
      </text>
      <text
        x={l100.x}
        y={l100.y}
        fill="rgba(255,255,255,0.85)"
        fontSize="11"
        fontFamily="Lato,sans-serif"
        fontWeight="700"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        100
      </text>
      <line
        className="guide-hero__needle"
        x1="110"
        y1="100"
        x2={tip.x2}
        y2={tip.y2}
        stroke="#fff"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="110" cy="100" r="6" fill="#fff" />
    </svg>
  );
}
