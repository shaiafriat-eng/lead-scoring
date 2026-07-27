#!/usr/bin/env node
/**
 * Build one self-contained HTML file for stakeholders (no GitHub, no zip folder).
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { dirname, join, extname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const siteDir = join(root, "site");
const outDir = join(root, "share");
const outFile = join(outDir, "HiBob-Lead-Scoring-Guide.html");
const downloadsFile = join(process.env.HOME || "", "Downloads", "HiBob-Lead-Scoring-Guide.html");

const MIME = {
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};

function syncSite() {
  execSync(`bash "${join(root, "scripts/sync-docs.sh")}"`, {
    cwd: root,
    stdio: "inherit",
    env: {
      ...process.env,
      PATH: `/Users/shai.afriat/.local/share/cursor-agent/versions/2026.06.03-0bbb28e:/opt/homebrew/bin:/usr/local/bin:${process.env.PATH || ""}`,
    },
  });
}

function dataUri(relPath) {
  const abs = join(siteDir, relPath);
  if (!existsSync(abs)) return relPath;
  const ext = extname(abs).toLowerCase();
  const mime = MIME[ext] || "application/octet-stream";
  const b64 = readFileSync(abs).toString("base64");
  return `data:${mime};base64,${b64}`;
}

function extractMain(html) {
  const m = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  return m ? m[1].trim() : "";
}

function extractScripts(html) {
  const scripts = [];
  const re = /<script\s+src="([^"]+)"><\/script>/gi;
  let match;
  while ((match = re.exec(html))) {
    if (!match[1].includes("site-shell.js")) scripts.push(match[1]);
  }
  return scripts;
}

function rewriteAssets(html) {
  return html.replace(/(src|href)="(assets\/[^"]+)"/g, (_, attr, path) => {
    return `${attr}="${dataUri(path)}"`;
  });
}

const PAGES = [
  { file: "index.html", id: "home", label: "Home" },
  { file: "mqling-flow.html", id: "icp", label: "ICP definition" },
  { file: "scoring-flow.html", id: "flow", label: "Explore the Flow" },
  { file: "mql-routing.html", id: "mql", label: "MQL Policy" },
  { file: "guide.html", id: "guide", label: "Support and Trust" },
];

const FILE_TO_ID = {
  "index.html": "home",
  "mqling-flow.html": "icp",
  "scoring-flow.html": "flow",
  "matrix.html": "flow",
  "dimensions.html": "home",
  "how-it-works.html": "home",
  "mql-routing.html": "mql",
  "guide.html": "guide",
};

function rewriteInternalLinks(html) {
  return html
    .replace(/href="([a-z0-9-]+\.html)(#[^"]*)?"/gi, (_, file, hash = "") => {
      const id = FILE_TO_ID[file] || "home";
      return `href="#${id}${hash || ""}" data-page-link="${id}"`;
    })
    .replace(/href="#([^"]+)"/g, (full, anchor) => {
      if (anchor.startsWith("home") || PAGES.some((p) => p.id === anchor.split("#")[0])) return full;
      // in-page anchors stay; page router handles hashchange
      return full;
    });
}

syncSite();

const logoUri = dataUri("assets/hibob-logo.png");
const faviconUri = dataUri("assets/favicon.png");
const css = readFileSync(join(siteDir, "css/site.css"), "utf8");

const neededJs = new Set(["js/site-shell.js"]);
const pageBlocks = PAGES.map((page, index) => {
  const raw = readFileSync(join(siteDir, page.file), "utf8");
  extractScripts(raw).forEach((s) => neededJs.add(s));
  let main = extractMain(raw);
  main = rewriteAssets(main);
  main = rewriteInternalLinks(main);
  return `<section class="share-page${index === 0 ? " is-active" : ""}" id="${page.id}" data-page="${page.id}" ${index === 0 ? "" : "hidden"}>
${main}
</section>`;
}).join("\n");

// Adapt site-shell for single-file hash nav
const shellJs = `
(function () {
  var NAV = ${JSON.stringify(PAGES.map((p) => ({ id: p.id, label: p.label })))};
  var LOGO = ${JSON.stringify(logoUri)};

  function showPage(id, hash) {
    var pages = document.querySelectorAll(".share-page");
    pages.forEach(function (el) {
      var on = el.getAttribute("data-page") === id;
      el.classList.toggle("is-active", on);
      if (on) el.removeAttribute("hidden");
      else el.setAttribute("hidden", "");
    });
    document.querySelectorAll(".site-nav a").forEach(function (a) {
      a.classList.toggle("is-active", a.getAttribute("data-page-link") === id);
    });
    if (hash) {
      var target = document.getElementById(hash);
      if (target) setTimeout(function () { target.scrollIntoView({ behavior: "smooth", block: "start" }); }, 40);
    } else {
      window.scrollTo(0, 0);
    }
  }

  function parseHash() {
    var raw = (location.hash || "#home").replace(/^#/, "");
    var parts = raw.split("#");
    // support #mql and #mql#score-reduction style via #mql/score-reduction or just in-page ids on active page
    if (raw.indexOf("/") !== -1) {
      parts = raw.split("/");
      return { id: parts[0] || "home", hash: parts[1] || "" };
    }
    var known = NAV.some(function (n) { return n.id === parts[0]; });
    if (known) return { id: parts[0], hash: "" };
    // bare section id — keep current page if possible
    var active = document.querySelector(".share-page.is-active");
    return { id: active ? active.getAttribute("data-page") : "home", hash: raw };
  }

  var header = document.getElementById("site-header");
  if (header) {
    var links = NAV.map(function (item) {
      return '<a href="#' + item.id + '" data-page-link="' + item.id + '">' + item.label + "</a>";
    }).join("");
    header.innerHTML =
      '<header class="site"><div class="wrap">' +
      '<a class="logo" href="#home" data-page-link="home">' +
      '<img src="' + LOGO + '" alt="HiBob" class="site-brand-logo" height="35" />' +
      '<span class="logo-tag">Marketing Ops</span></a>' +
      '<nav class="site-nav" aria-label="Main">' + links + "</nav></div></header>";
  }

  var footer = document.getElementById("site-footer");
  if (footer) {
    footer.innerHTML =
      '<footer class="site-footer"><div class="wrap">' +
      '<div class="logo-row">' +
      '<img src="' + LOGO + '" alt="HiBob" class="site-brand-logo site-brand-logo--footer" height="28" />' +
      "<span>Lead Scoring Guide · offline share copy</span></div>" +
      "<p>For internal HiBob Marketing, Sales, and RevOps use.</p></div></footer>";
  }

  document.addEventListener("click", function (e) {
    var a = e.target.closest("a[data-page-link]");
    if (!a) return;
    e.preventDefault();
    var id = a.getAttribute("data-page-link");
    var href = a.getAttribute("href") || "";
    var hash = "";
    // href="#mql#score-reduction" becomes tricky; support #mql and separate in-page links
    if (href.indexOf("#") !== -1) {
      var bits = href.replace(/^#/, "").split("#");
      if (bits[0] && NAV.some(function (n) { return n.id === bits[0]; })) {
        id = bits[0];
        hash = bits[1] || "";
      } else if (bits.length === 1 && !NAV.some(function (n) { return n.id === bits[0]; })) {
        hash = bits[0];
      }
    }
    location.hash = hash ? id + "/" + hash : id;
  });

  window.addEventListener("hashchange", function () {
    var parsed = parseHash();
    showPage(parsed.id, parsed.hash);
  });

  var initial = parseHash();
  showPage(initial.id, initial.hash);
})();
`;

const otherJs = [...neededJs]
  .filter((s) => s !== "js/site-shell.js")
  .map((s) => readFileSync(join(siteDir, s), "utf8"))
  .join("\n\n");

const singleCss = `
${css}

.share-page[hidden] { display: none !important; }
.share-page.is-active { display: block; }
.share-banner {
  background: var(--cappuccino-foam);
  border-bottom: 1px solid var(--border);
  padding: 0.55rem 0;
  font-size: 0.8125rem;
  color: var(--muted);
  text-align: center;
}
`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>HiBob Lead Scoring Guide</title>
  <link rel="icon" type="image/png" href="${faviconUri}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Domine:wght@500;600;700&family=Lato:wght@400;700;900&display=swap" rel="stylesheet" />
  <style>
${singleCss}
  </style>
</head>
<body>
  <div class="share-banner">Offline HTML copy · no GitHub access needed · open this one file in any browser</div>
  <div id="site-header"></div>
  <main>
${pageBlocks}
  </main>
  <div id="site-footer"></div>
  <script>
${shellJs}
  </script>
  <script>
${otherJs}
  </script>
</body>
</html>
`;

mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, html);
if (process.env.HOME) writeFileSync(downloadsFile, html);

const kb = Math.round(Buffer.byteLength(html) / 1024);
console.log(`Single-file guide written (${kb} KB):`);
console.log(`  ${downloadsFile}`);
console.log(`  ${outFile}`);
