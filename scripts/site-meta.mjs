/** Shared metadata for static HTML and social link previews. */
export const SITE_BASE = "https://hibobio.github.io/marketing-ops-general";
export const SITE_SLUG = "lead-scoring-guide";
export const SITE_URL = `${SITE_BASE}/${SITE_SLUG}`;

export const SITE_NAME = "HiBob Lead Scoring";

export const DEFAULT_DESCRIPTION =
  "The ultimate guide to HiBob lead scoring: demographic fit (A–D) × behavioral engagement (1–4), MQL policy, and routing for Marketing, Sales, and RevOps.";

export const DEFAULT_OG_IMAGE = "assets/hero-banner.png";

export function escapeMeta(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

export function socialMeta({ title, shareTitle, description = DEFAULT_DESCRIPTION, path = "" }) {
  const pageTitle = shareTitle ? `${shareTitle} | ${SITE_NAME}` : `${title} | ${SITE_NAME}`;
  const pagePath = path || "index.html";
  const pageUrl = pagePath === "index.html" ? `${SITE_URL}/` : `${SITE_URL}/${pagePath}`;
  const imageUrl = `${SITE_URL}/${DEFAULT_OG_IMAGE}`;
  const safeTitle = escapeMeta(pageTitle);
  const safeDescription = escapeMeta(description);

  return `  <meta name="description" content="${safeDescription}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="${SITE_NAME}" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDescription}" />
  <meta property="og:url" content="${pageUrl}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:image:alt" content="HiBob lead scoring guide" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDescription}" />
  <meta name="twitter:image" content="${imageUrl}" />`;
}
