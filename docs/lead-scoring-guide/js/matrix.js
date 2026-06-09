(function () {
  const heat = (p) =>
    p <= 2 ? "#ee164f" : p <= 5 ? "#f36488" : p <= 8 ? "#faa32b" : p <= 10 ? "#febb59" : "#e3ddd3";
  const pri = {
    A1: 1, A2: 2, A3: 3, A4: 4, B1: 2, B2: 5, B3: 6, B4: 7,
    C1: 2, C2: 8, C3: 9, C4: 10, D1: 11, D2: 12, D3: 13, D4: 14,
  };
  const textColor = (p) => (p <= 8 ? "#fff" : "var(--black-coffee)");

  const examples = {
    A1: "VP People at a 400-employee ICP tech company requests a demo on the website (105 pts).",
    A2: "ICP CHRO attends a live webinar and downloads the pricing guide (~72 pts).",
    A3: "ICP People Ops Manager engages with MOFU emails and product pages (~30 pts).",
    A4: "ICP champion clicks newsletter links only; no high-intent actions (~8 pts).",
    B1: "ICP People Manager submits a WAD pricing form at a strong-fit account (102 pts).",
    B2: "ICP HR Manager downloads an implementation guide plus a BOFU asset (~58 pts).",
    B3: "ICP HRBP visits the booth at an event and consumes MOFU content (~24 pts).",
    B4: "Strong-fit manager subscribes to the blog with light TOFU only (~11 pts).",
    C1: "Non-ICP 800-EE account; C-level champion reaches 100+ pts on an executive brief.",
    C2: "Non-ICP HR Generalist replays a BOFU webinar and downloads an asset (~55 pts).",
    C3: "Non-ICP event attendee in a target region; MOFU engagement only (~25 pts).",
    C4: "Workable persona at a non-ICP firm; single whitepaper view (~9 pts).",
    D1: "Sales job function at an otherwise relevant account; 100+ pts but demographic D.",
    D2: "Design intern at an ICP account with some content engagement (~18 pts).",
    D3: "Competitor- or restricted-country-flagged account with moderate engagement (~32 pts).",
    D4: "Irrelevant persona with TOFU only—e.g. student or ops junk-adjacent lead (~5 pts).",
  };

  function makeCell(code) {
    const p = pri[code] || 14;
    const cell = document.createElement("div");
    cell.className = "matrix-cell" + (code[0] === "A" ? " matrix-cell--flip" : "");
    cell.setAttribute("tabindex", "0");
    cell.setAttribute("aria-label", code + ": " + examples[code]);

    const label = document.createElement("span");
    label.className = "matrix-cell__code";
    label.textContent = code;
    cell.appendChild(label);

    const tip = document.createElement("span");
    tip.className = "matrix-cell__tooltip";
    tip.setAttribute("role", "tooltip");

    const tipCode = document.createElement("span");
    tipCode.className = "matrix-cell__tooltip-code";
    tipCode.textContent = code;
    tip.appendChild(tipCode);

    const tipText = document.createElement("span");
    tipText.className = "matrix-cell__tooltip-text";
    tipText.textContent = examples[code];
    tip.appendChild(tipText);

    cell.appendChild(tip);

    cell.style.background = heat(p);
    cell.style.color = textColor(p);
    return cell;
  }

  const g = document.getElementById("matrix-grid");
  if (g) {
    g.appendChild(document.createElement("div"));
    [1, 2, 3, 4].forEach((b) => {
      const d = document.createElement("div");
      d.className = "matrix-axis";
      d.textContent = b;
      g.appendChild(d);
    });
    "ABCD".split("").forEach((demo) => {
      const l = document.createElement("div");
      l.className = "matrix-axis matrix-axis--row";
      l.textContent = demo;
      g.appendChild(l);
      [1, 2, 3, 4].forEach((b) => {
        g.appendChild(makeCell(demo + b));
      });
    });
  }

  const hint = document.getElementById("matrix-try-hint");
  if (hint) {
    function dismissHint() {
      hint.classList.add("matrix-try-hint--hidden");
    }
    document.querySelectorAll(".matrix-cell").forEach(function (cell) {
      cell.addEventListener("mouseenter", dismissHint, { once: true });
      cell.addEventListener("focus", dismissHint, { once: true });
    });
  }
})();
