/** Gauge arc labels positioned on the scale (center 110,100 · radius 86). */
function labelPos(value) {
  const cx = 110;
  const cy = 100;
  const r = 76;
  const t = (value - 25) / 75;
  const angle = Math.PI * (1 - t);
  return {
    x: Math.round((cx + r * Math.cos(angle)) * 10) / 10,
    y: Math.round((cy - r * Math.sin(angle)) * 10) / 10,
  };
}

/** Needle tip for score 85. */
function needleTip(score = 85) {
  const cx = 110;
  const cy = 100;
  const len = 62;
  const t = (score - 25) / 75;
  const angle = Math.PI * (1 - t);
  return {
    x2: Math.round((cx + len * Math.cos(angle)) * 10) / 10,
    y2: Math.round((cy - len * Math.sin(angle)) * 10) / 10,
  };
}

export function gaugeSvgMarkup({ gradientId = "gaugeGrad" } = {}) {
  const l25 = labelPos(25);
  const l50 = labelPos(50);
  const l75 = labelPos(75);
  const l100 = labelPos(100);
  const tip = needleTip(85);
  const textAttrs =
    'fill="rgba(255,255,255,0.85)" font-size="11" font-family="Lato,sans-serif" font-weight="700" text-anchor="middle" dominant-baseline="middle"';

  return `<svg class="guide-hero__gauge-svg" viewBox="0 0 220 120" role="presentation">
              <defs>
                <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#ffb3c6"/>
                  <stop offset="100%" stop-color="#ee164f"/>
                </linearGradient>
              </defs>
              <path d="M 24 100 A 86 86 0 0 1 196 100" fill="none" stroke="url(#${gradientId})" stroke-width="14" stroke-linecap="round"/>
              <text x="${l25.x}" y="${l25.y}" ${textAttrs}>25</text>
              <text x="${l50.x}" y="${l50.y}" ${textAttrs}>50</text>
              <text x="${l75.x}" y="${l75.y}" ${textAttrs}>75</text>
              <text x="${l100.x}" y="${l100.y}" ${textAttrs}>100</text>
              <line class="guide-hero__needle" x1="110" y1="100" x2="${tip.x2}" y2="${tip.y2}" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
              <circle cx="110" cy="100" r="6" fill="#fff"/>
            </svg>`;
}
