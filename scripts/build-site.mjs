#!/usr/bin/env node
import { cpSync, mkdirSync, writeFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { heroSection } from "./hero-html.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const siteDir = join(root, "site");

function page(title, body, scripts = []) {
  const scriptTags = ["js/site-shell.js", ...scripts]
    .map((s) => `  <script src="${s}"></script>`)
    .join("\n");
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} | HiBob Lead Scoring</title>
  <link rel="icon" type="image/png" href="assets/favicon.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Domine:wght@500;600;700&family=Lato:wght@400;700;900&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="css/site.css" />
</head>
<body>
  <div id="site-header"></div>
  <main>
${body}
  </main>
  <div id="site-footer"></div>
${scriptTags}
</body>
</html>`;
}

function howItWorksSection({ onHome = false } = {}) {
  const h = onHome ? "h2" : "h1";
  const nav = onHome
    ? ""
    : `        <div class="page-nav-links">
          <a class="btn btn-primary" href="scoring-flow.html">Explore scoring flow →</a>
          <a class="btn btn-secondary" href="dimensions.html">Fit & behavior details →</a>
        </div>`;
  return `    <section class="page${onHome ? " page--alt" : ""}" id="how-it-works">
      <div class="wrap">
        <${h}>How the score works</${h}>
        <div class="intro-grid">
          <p class="lead">Two dimensions—fit and engagement—combine into a score code used for prioritization and MQL routing.</p>
          <div class="grid-2">
            <div class="card"><h3>Demographic (A–D)</h3><p style="color:var(--muted)">Person (function, seniority) + Account (ICP, status, geo, EE count) → grade A–D.</p></div>
            <div class="card"><h3>Behavioral (1–4)</h3><p style="color:var(--muted)">Activities earn Marketo points → bucketed into tiers 1 (100+) through 4 (0–14).</p></div>
          </div>
        </div>
        <p style="margin-top:1.5rem"><strong>Systems:</strong> Marketo (scoring & MQL), Salesforce (ICP), 6Sense (intent & booth bonus). <strong>MQL threshold: 100 points.</strong></p>
${nav}
      </div>
    </section>`;
}

function dimensionsFitBlock({ onHome = false } = {}) {
  const h = onHome ? "h2" : "h1";
  return `        <div class="dimension-block" id="demographic">
        <p class="label">Dimension 1 · Fit</p>
        <${h}>Demographic score (A–D)</${h}>
        <div class="grid-2">
          <div class="card"><h3><span style="color:var(--cherry-syrup)">A</span> Best fit</h3><p style="color:var(--muted);margin:0">ICP + decision maker/champion (incl. 50–99 EE when ICP flag lags).</p></div>
          <div class="card"><h3><span style="color:var(--cherry-syrup)">B</span> Strong fit</h3><p style="color:var(--muted);margin:0">ICP + relevant function, or non-ICP + decision maker.</p></div>
          <div class="card"><h3>C Workable</h3><p style="color:var(--muted);margin:0">Non-ICP workable persona or ICP validating function.</p></div>
          <div class="card"><h3>D Lowest / DQ</h3><p style="color:var(--muted);margin:0">Irrelevant fit, junk, bad geo, competitor, customer, EE out of range.</p></div>
        </div>
        <h3 style="margin-top:2rem">Grade D — full rules</h3>
        <details><summary>Person-level disqualifiers</summary><div class="inner"><ul class="dq-person-list">
          <li><details class="details-in-list"><summary>Junk/bounced/private/invalid email</summary><div class="details-in-list__body">
          <p style="color:var(--muted);margin:0 0 0.75rem">Classified as junk if <strong>one or more</strong> apply:</p>
          <ul style="color:var(--muted);margin:0;padding-left:1.25rem">
            <li>Test/fake data in names, company, notes, or email</li>
            <li>Invalid, disposable, or bounced email</li>
            <li>Internal QA/UAT from non-production environments</li>
            <li>Restricted/high-risk countries</li>
            <li>Fails qualification (e.g. missing referral form)</li>
            <li>Flagged via operational junk-lead processes</li>
            <li>Low-quality email validation signals</li>
          </ul>
          </div></details></li>
          <li>Unsubscribed</li><li>Student, Design, intern, professor</li><li>Job function: Sales</li><li>HiBob employees</li></ul></div></details>
        <details><summary>Account-level disqualifiers</summary><div class="inner"><ul class="dq-person-list">
          <li>Account status is Not Relevant</li>
          <li><details class="details-in-list"><summary>Bad country</summary><div class="details-in-list__body"><p style="margin:0;font-size:0.875rem;line-height:1.8;color:var(--muted)">Iran, Lebanon, North Korea, Somalia, Cuba, Syria, Sudan, Libya, Pakistan, India, Iraq, Palestine, Syrian Arab Republic, China, Palestinian Territory (Occupied), Palestinian Territory</p></div></details></li>
          <li>Competitor or Customer</li><li>Account has fewer than 20 or more than 8,000 employees, and Update MQL Process = FALSE in Salesforce (standard auto-MQL is off for that size band)</li></ul></div></details>
        </div>`;
}

function dimensionsBehaviorBlock({ onHome = false, showNav = true } = {}) {
  const h = onHome ? "h2" : "h1";
  const nav = showNav
    ? `        <div class="page-nav-links"><a class="btn btn-secondary" href="matrix.html">Score matrix →</a></div>`
    : "";
  return `        <div class="dimension-block dimension-block--follow" id="behavioral">
        <p class="label">Dimension 2 · Behavior</p>
        <${h}>Behavioral score (1–4)</${h}>
        <div class="card" style="overflow-x:auto">
          <table>
            <tr><th>Tier</th><th>Points (Marketo)</th><th>Typical activities</th></tr>
            <tr><td><strong>1</strong></td><td>100+</td><td>Demo, pricing, explicit sales contact</td></tr>
            <tr><td><strong>2</strong></td><td>50–99</td><td>WAD, product tour, BOFU, events</td></tr>
            <tr><td><strong>3</strong></td><td>15–49</td><td>Nurture forms, MOFU, CPL</td></tr>
            <tr><td><strong>4</strong></td><td>0–14</td><td>TOFU only</td></tr>
          </table>
        </div>
        <div class="card" style="margin-top:1rem;border-left:4px solid var(--orange-juice)">
          <h3>Top weights</h3>
          <p style="margin:0;color:var(--muted)"><strong style="color:var(--cherry-syrup)">+100</strong> Demo, pricing, contact sales · <strong style="color:var(--cherry-syrup)">+50</strong> WAD, tour, ROI, events · <strong style="color:var(--cherry-syrup)">+35</strong> A-tier booth + Decision/Purchase · <strong style="color:var(--cherry-syrup)">+5</strong> Email click (max 3/mo)</p>
        </div>
${nav}
        </div>`;
}

function dimensionsSection({ onHome = false, showNav = true } = {}) {
  return `    <section class="page" id="dimensions">
      <div class="wrap">
${dimensionsFitBlock({ onHome })}
${dimensionsBehaviorBlock({ onHome, showNav })}
      </div>
    </section>`;
}

function matrixSection({ embedded = false } = {}) {
  const heading = embedded ? "h2" : "h1";
  const sectionClass = embedded ? "page" : "page page--alt";
  const pageNav = embedded
    ? ""
    : '<div class="page-nav-links"><a class="btn btn-secondary" href="mql-routing.html">MQL Policy →</a></div>';
  return `    <section class="${sectionClass}" id="matrix">
      <div class="wrap">
        <${heading}>Score matrix</${heading}>
        <p class="lead">Darker = higher priority. A1 top → D4 lowest. Hover a cell for an example lead.</p>
        <div class="matrix-wrap matrix-wrap--with-hint">
          <div class="matrix-try-hint" id="matrix-try-hint" aria-hidden="true">
            <div class="matrix-try-hint__bubble">
              <svg class="matrix-try-hint__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5.5 3.2v12.8l3.2-2.9 2.4 6.1 2.2-0.9-2.4-6.3 4.8 0.1L5.5 3.2z" fill="currentColor" stroke="currentColor" stroke-width="0.5" stroke-linejoin="round"/>
              </svg>
              <span class="matrix-try-hint__label">Try me</span>
            </div>
            <span class="matrix-try-hint__tail"></span>
          </div>
          <div class="card matrix" id="matrix-grid"></div>
        </div>
        ${pageNav}
      </div>
    </section>`;
}

const pages = {
  "index.html": page(
    "Home",
    heroSection() +
    `    <section class="page">
      <div class="wrap overview-columns">
        <article class="overview-item">
          <h3 class="overview-item__title">What it is</h3>
          <p class="overview-item__text">A method to rank leads by <strong>demographic fit</strong> (A–D) and <strong>behavioral engagement</strong> (1–4), combined into codes like A1 or B3.</p>
        </article>
        <article class="overview-item">
          <h3 class="overview-item__title">Why it exists</h3>
          <p class="overview-item__text">Prioritize sales outreach, reduce MQL noise, and route leads using conversion data—not treating every <strong>100-point</strong> MQL equally.</p>
        </article>
      </div>
    </section>
${howItWorksSection({ onHome: true })}
${dimensionsSection({ onHome: true, showNav: false })}`,
  ),

  "how-it-works.html": page("How it works", howItWorksSection()),

  "scoring-flow.html": page(
    "Scoring flow",
    `    <section class="page page--alt">
      <div class="wrap">
        <h1>Explore the scoring flow</h1>
        <div class="scoring-flow-block">
        <p class="lead scoring-flow-block__intro">Step through the process below. On branching steps, pick a path—step 4 chooses the activity, step 5 maps it to a behavioral tier, including <strong>Grade D</strong> when persona and account are not a fit.</p>
        <p class="scoring-flow-block__miro">Full diagram: <a href="https://miro.com/app/board/uXjVIkUIQp0=/?share_link_id=79974080622" target="_blank" rel="noopener">Open Miro board →</a></p>
        <div class="card scoring-flow-block__card" style="padding:0">
          <div class="flow-step-dots" id="flow-dots"></div>
          <div class="flow-panel" id="flow-panel"></div>
        </div>
        </div>
      </div>
    </section>
${matrixSection({ embedded: true })}`,
    ["js/scoring-flow.js", "js/matrix.js"],
  ),

  "mqling-flow.html": page(
    "ICP definition",
    `    <section class="page">
      <div class="wrap">
        <h1>ICP definition</h1>
        <div class="card icp-definition">
          <p class="icp-definition__summary">An account is ICP when it meets size, technology, industry, and geography rules—or is manually overridden in Salesforce.</p>
          <p style="color:var(--muted);margin:0 0 0.65rem;font-size:0.875rem">Account must meet <strong>all</strong> criteria below (unless overridden):</p>
          <ul class="icp-definition__list">
            <li>100–5,000 employees</li>
            <li>At least one modern technology in tech stack</li>
            <li>Industry is NOT colleges/universities, government, federal, or schools</li>
            <li>US-based companies must be international</li>
            <li>OR manually flagged via ICP override field</li>
          </ul>
          <p class="icp-disclaimer">Disclaimer: We may still MQL accounts with 5,000–8,000 employees under current policy, even though they fall outside the standard ICP employee range.</p>
          <a class="btn btn-secondary icp-doc-link" href="https://docs.google.com/document/d/1RLKQBVBYxgLHPT3YOboqpobUEW0yQZDwkt67vONTTto/edit?tab=t.0" target="_blank" rel="noopener" style="margin-top:1rem"><span class="icp-doc-link__label">Open full ICP doc (Google)</span><span class="icp-doc-link__note"> — full rules maintained by MIS →</span></a>
        </div>
      </div>
    </section>`,
  ),

  "dimensions.html": page("Fit & behavior", dimensionsSection()),

  "matrix.html": page("Score matrix", matrixSection()),

  "mql-routing.html": page(
    "MQL Policy",
    `    <section class="page" id="policy">
      <div class="wrap">
        <h1>MQL policy <span class="heading-date">last updated on March 2025</span></h1>
        <div class="tabs">
          <button class="tab active" data-tab="hr">Hand raiser</button>
          <button class="tab" data-tab="wad">WAD</button>
          <button class="tab" data-tab="act">Activity-based</button>
          <button class="tab" data-tab="oth">Other</button>
        </div>
        <div class="card tab-panel active" id="tab-hr"><h3>Hand raiser — always auto-MQL</h3><p style="color:var(--muted)">Request Demo, Pricing, Contact Sales · ~18% MQL-to-SQA CVR</p></div>
        <div class="card tab-panel" id="tab-wad"><h3>WAD — combo-based</h3><ul style="color:var(--muted)"><li>Auto-MQL: A1–A4, B1–B3, C1</li><li>C3: Americas, UK, APJ (no Micro)</li><li>No D3</li></ul></div>
        <div class="card tab-panel" id="tab-act"><h3>Activity-based — A1 & B1 only</h3><p style="color:var(--muted)">1,874 → 86 MQLs; 4% → 17% CR</p></div>
        <div class="card tab-panel" id="tab-oth"><h3>Other</h3><ul style="color:var(--muted)"><li>Keep PPL/directories</li><li>No ROI calculator MQL</li></ul></div>
        <div class="card banner" style="margin-top:1.25rem"><h3>Key metric</h3><p style="margin:0">MQL-to-SQA conversion rate drives routing decisions.</p></div>
      </div>
    </section>
    <section class="page page--alt" id="non-mql-reasons">
      <div class="wrap">
        <p class="label">Qualification issues</p>
        <h1>Common MQL Qualification Issues</h1>
        <div class="grid-2" style="margin-top:1.25rem">
          <div class="card"><h3>Employee Count Discrepancies</h3><p style="color:var(--muted);margin:0;font-size:0.9375rem;line-height:1.55">Company size data is often inaccurate, mainly due to reliance on ZoomInfo without Apollo as a secondary source.</p></div>
          <div class="card"><h3>Job Title Classification</h3><p style="color:var(--muted);margin:0;font-size:0.9375rem;line-height:1.55">Most title-related issues involve broad roles such as student, intern, sales, or marketing.</p></div>
          <div class="card"><h3 class="qualification-issue__title"><span>WAD vs. Scoring Misalignment</span><span class="qualification-issue__wip">WIP</span></h3><p style="color:var(--muted);margin:0;font-size:0.9375rem;line-height:1.55">Some WAD completions have strong titles but receive a low score due to company attributes, preventing MQL qualification.</p></div>
          <div class="card"><h3>Conversions on Irrelevant Accounts</h3><p style="color:var(--muted);margin:0;font-size:0.9375rem;line-height:1.55">Leads converting on accounts already marked as not relevant are not assigned to sales and lose MQL status.</p></div>
        </div>
        <div class="card" style="margin-top:1.5rem;border-left:4px solid var(--dark-wine);background:linear-gradient(90deg,var(--white-cream) 0%,var(--cappuccino-foam) 100%)">
          <h3>Quick check before escalating</h3>
          <p style="margin:0;color:var(--muted)">Confirm employee count sources, job title classification, WAD vs demographic grade alignment, and account relevance before opening a manual review. See the <a href="mql-routing.html#manual-review">MQL diagnostic</a> below or <a href="scoring-flow.html">scoring flow</a> for full policy detail.</p>
        </div>
      </div>
    </section>
    <section class="page" id="manual-review">
      <div class="wrap">
        <h1>Why wasn't this lead MQL'd?</h1>
        <p class="lead lead--full-width">Walk through employee size, ICP, job function, and seniority—the same inputs Marketo uses for demographic grade—then engagement and MQL channel rules.</p>
        <div class="card mql-diagnostic" id="mql-diagnostic"></div>
        <div class="page-nav-links" style="margin-top:1.5rem">
          <a class="btn btn-primary" href="https://form.asana.com/?k=VjhxKo900uMGso834pxKXg&d=103035621276259" target="_blank" rel="noopener">Request manual MQL review (Marketing Ops) →</a>
        </div>
        <p style="margin:0.75rem 0 0;font-size:0.875rem;color:var(--muted);max-width:52rem">Use this form when the guide shows the lead should have MQL'd but did not—Marketing Ops can review and force MQL if appropriate.</p>
      </div>
    </section>`,
    ["js/mql-policy.js", "js/mql-diagnostic.js"],
  ),

  "guide.html": page(
    "Support and Trust",
    `    <section class="page">
      <div class="wrap">
        <p class="label">Support</p>
        <h1>FAQ</h1>
        <details><summary>What is lead scoring?</summary><div class="inner">Fit (A–D) + engagement (1–4) for prioritization and MQL routing—not points alone.</div></details>
        <details><summary>What is the MQL point threshold?</summary><div class="inner">100 points in Behavioral Score Calculation, plus demographic grade and channel-specific auto-MQL rules.</div></details>
        <details><summary>Why wasn't my lead MQL'd?</summary><div class="inner">See <a href="mql-routing.html">MQL routing</a>. Still wrong? <a href="mql-routing.html#manual-review">Manual MQL review</a>.</div></details>
        <details><summary>ICP shows FALSE for new contacts?</summary><div class="inner">SFDC ICP can take ~24h; Marketo ICP used interim.</div></details>
      </div>
    </section>
    <section class="page page--alt">
      <div class="wrap">
        <p class="label">Trust</p>
        <h1>Methodology & limitations</h1>
        <ul style="color:var(--muted)">
          <li>Behavioral tiers and point buckets describe the same dimension.</li>
          <li>ICP and score updates have operational lag.</li>
          <li>Demographics are rule-based, not ML.</li>
          <li>Confirm live rules in Marketo before major campaigns.</li>
        </ul>
        <p><a href="https://miro.com/app/board/uXjVIkUIQp0=/?share_link_id=79974080622" target="_blank" rel="noopener">Miro process board →</a></p>
      </div>
    </section>`,
  ),
};

mkdirSync(join(siteDir, "assets"), { recursive: true });
cpSync(join(root, "assets"), join(siteDir, "assets"), { recursive: true });
writeFileSync(join(siteDir, ".nojekyll"), "");

for (const [file, html] of Object.entries(pages)) {
  writeFileSync(join(siteDir, file), html);
}

// Legacy single-file redirect
writeFileSync(
  join(root, "OPEN-THIS-FILE.html"),
  `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta http-equiv="refresh" content="0;url=site/index.html"><title>Redirect</title></head><body><p><a href="site/index.html">Open Lead Scoring Guide</a></p></body></html>`,
);

console.log("Built", Object.keys(pages).length, "pages in site/");
