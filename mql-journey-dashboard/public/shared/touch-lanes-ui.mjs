const SOURCE_COLORS = {
  bing: "#008272",
  google: "#4285f4",
  linkedin: "#0a66c2",
  facebook: "#1877f2",
  email: "#fa8c16",
  organic: "#52c41a",
  direct: "#8c8c8c",
  "(direct)": "#8c8c8c",
};

const POST_COLORS = [
  "#e2004f",
  "#8b1d41",
  "#008272",
  "#4285f4",
  "#0a66c2",
  "#b86e00",
  "#2d8a4e",
  "#6b4c9a",
];

function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function colorForLane(lane, index = 0, phase = "pre") {
  if (phase === "post") {
    return POST_COLORS[index % POST_COLORS.length];
  }
  const key = (lane.source || lane.label || "(direct)").toLowerCase();
  return SOURCE_COLORS[key] ?? POST_COLORS[index % POST_COLORS.length];
}

function touchEventLabel(t) {
  return t.eventType?.trim() || t.action?.trim() || "Event";
}

function pathCategory(path) {
  const p = (path || "").toLowerCase();
  if (/pricing|plans|price/.test(p)) return "Pricing";
  if (/demo|book-a-demo|book-demo/.test(p)) return "Demo";
  if (/trial|free-trial/.test(p)) return "Trial";
  if (/product|platform|features|solutions/.test(p)) return "Product";
  if (/blog|resources|guide|ebook|webinar/.test(p)) return "Content";
  if (/careers|jobs/.test(p)) return "Careers";
  return "Other";
}

function pathIsHighIntent(path) {
  const p = (path || "").toLowerCase();
  return ["pricing", "book-a-demo", "book-demo", "free-trial", "/demo"].some(
    (frag) => p.includes(frag),
  );
}

function postMqlLaneTooltipHtml(t) {
  const highIntent = t.highIntent === "true" || t.highIntent === true;
  return [
    `<div class="lane-tooltip-title">${escapeHtml(t.path || "Page view")}</div>`,
    `<div class="lane-tooltip-time">${escapeHtml(fmtDate(t.at))}</div>`,
    `<div class="lane-tooltip-row"><span>Category</span><span>${escapeHtml(t.category || "Other")}</span></div>`,
    `<div class="lane-tooltip-row"><span>High intent</span><span>${highIntent ? "Yes" : "No"}</span></div>`,
  ].join("");
}

function laneTooltipHtml(t, sourceLabel) {
  const lines = [
    `<div class="lane-tooltip-title">${escapeHtml(touchEventLabel(t))}</div>`,
    `<div class="lane-tooltip-time">${escapeHtml(fmtDate(t.at))}</div>`,
    `<div class="lane-tooltip-row"><span>Page</span><span>${escapeHtml(t.path)}</span></div>`,
    `<div class="lane-tooltip-row"><span>Lane</span><span>${escapeHtml(sourceLabel)}</span></div>`,
  ];
  if (t.action?.trim() && t.eventType?.trim() && t.action !== t.eventType) {
    lines.push(
      `<div class="lane-tooltip-row"><span>Detail</span><span>${escapeHtml(t.action)}</span></div>`,
    );
  }
  if (t.formCategory) {
    lines.push(
      `<div class="lane-tooltip-row"><span>Form</span><span>${escapeHtml(t.formCategory)}</span></div>`,
    );
  }
  if (t.campaign) {
    lines.push(
      `<div class="lane-tooltip-row"><span>Campaign</span><span>${escapeHtml(t.campaign)}</span></div>`,
    );
  }
  return lines.join("");
}

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortPath(path, max = 42) {
  const p = String(path || "").trim() || "—";
  if (p.length <= max) return p;
  return `${p.slice(0, max - 1)}…`;
}

function sampleTouches(touches, maxDots) {
  const list = touches ?? [];
  if (list.length <= maxDots) return { dots: list, extra: 0 };
  const step = list.length / maxDots;
  const dots = Array.from({ length: maxDots }, (_, i) => list[Math.floor(i * step)]);
  return { dots, extra: list.length - maxDots };
}

function renderLaneDot(t, color, pctKey, fullLabel, phase) {
  const left = Number(t[pctKey] ?? t.pct ?? 0);
  if (phase === "post") {
    const category = pathCategory(t.path);
    const highIntent = pathIsHighIntent(t.path);
    return `<button
      type="button"
      class="lane-dot ff-lane-dot"
      style="left:${Math.min(96, Math.max(4, left)).toFixed(1)}%;background:${color}"
      data-at="${escapeHtml(t.at)}"
      data-path="${escapeHtml(t.path)}"
      data-category="${escapeHtml(category)}"
      data-high-intent="${highIntent ? "true" : "false"}"
      aria-label="Page view on ${escapeHtml(t.path)}"
    ></button>`;
  }
  const label = touchEventLabel(t);
  return `<button
    type="button"
    class="lane-dot ff-lane-dot"
    style="left:${left.toFixed(1)}%;background:${color}"
    data-at="${escapeHtml(t.at)}"
    data-event-type="${escapeHtml(t.eventType)}"
    data-action="${escapeHtml(t.action)}"
    data-path="${escapeHtml(t.path)}"
    data-form-category="${escapeHtml(t.formCategory)}"
    data-campaign="${escapeHtml(t.campaign)}"
    data-source-label="${escapeHtml(fullLabel)}"
    aria-label="${escapeHtml(label)} on ${escapeHtml(t.path)}"
  ></button>`;
}

/** Compact full-funnel chart lanes — pre rows with touch counts, post rows with path captions. */
export function renderFullFunnelTouchLanes(container, lanes, options = {}) {
  if (!container) return;
  const {
    phase = "pre",
    maxLanes = 8,
    maxDots = 14,
    pctKey = "pct",
    emptyLabel = `No ${phase === "post" ? "post-MQL return" : "pre-MQL"} touches to show.`,
  } = options;
  const slice = (lanes ?? []).slice(0, maxLanes);
  if (!slice.length) {
    container.innerHTML = `<p class="touch-journey-empty">${escapeHtml(emptyLabel)}</p>`;
    return;
  }

  if (phase === "pre") {
    container.innerHTML = slice
      .map((lane, laneIndex) => {
        const color = colorForLane(lane, laneIndex, "pre");
        const fullLabel = lane.label || lane.source || "Unknown";
        const touches = lane.touches ?? [];
        const { dots, extra } = sampleTouches(touches, maxDots);
        const dotHtml = dots
          .map((t) => renderLaneDot(t, color, pctKey, fullLabel, "pre"))
          .join("");
        const more =
          extra > 0
            ? `<span class="ff-lane-more" title="${touches.length.toLocaleString()} touches">+${extra}</span>`
            : "";
        const countLabel = `${touches.length.toLocaleString()} touch${touches.length === 1 ? "" : "es"}`;
        return `
          <div class="ff-lane ff-lane--pre">
            <div class="ff-lane-source">
              <span class="ff-lane-label" title="${escapeHtml(fullLabel)}">${escapeHtml(fullLabel)}</span>
              <span class="ff-lane-count">${countLabel}</span>
            </div>
            <div class="lane-track ff-lane-track">${dotHtml}${more}</div>
          </div>`;
      })
      .join("");
    return;
  }

  container.innerHTML = slice
    .map((lane, laneIndex) => {
      const color = colorForLane(lane, laneIndex, "post");
      const pathLabel = lane.label || lane.source || "Unknown";
      const touches = lane.touches ?? [];
      const { dots, extra } = sampleTouches(touches, maxDots);
      const dotHtml = dots
        .map((t) => renderLaneDot(t, color, pctKey, pathLabel, "post"))
        .join("");
      const more =
        extra > 0
          ? `<span class="ff-lane-more" title="${touches.length.toLocaleString()} views">+${extra}</span>`
          : "";
      const viewLabel = `${touches.length.toLocaleString()} view${touches.length === 1 ? "" : "s"}`;
      return `
        <div class="ff-lane ff-lane--post">
          <div class="lane-track ff-lane-track ff-lane-track--post">${dotHtml}${more}</div>
          <div class="ff-lane-caption" title="${escapeHtml(pathLabel)}">${escapeHtml(shortPath(pathLabel))} · ${viewLabel}</div>
        </div>`;
    })
    .join("");
}

export function renderTouchLanes(container, lanes, options = {}) {
  if (!container) return;
  const {
    phase = "pre",
    maxLanes = 8,
    pctKey = "pct",
    emptyLabel = `No ${phase === "post" ? "post-MQL return" : "pre-MQL"} touches to show.`,
  } = options;
  const slice = (lanes ?? []).slice(0, maxLanes);
  if (!slice.length) {
    container.innerHTML = `<p class="touch-journey-empty">${escapeHtml(emptyLabel)}</p>`;
    return;
  }
  container.innerHTML = slice
    .map((lane, laneIndex) => {
      const color = colorForLane(lane, laneIndex, phase);
      const fullLabel = lane.label || lane.source || "Unknown";
      const dots = (lane.touches ?? [])
        .map((t) => {
          const label = touchEventLabel(t);
          const left = t[pctKey] ?? t.pct ?? 0;
          return `<button
            type="button"
            class="lane-dot"
            style="left:${Number(left).toFixed(1)}%;background:${color}"
            data-at="${escapeHtml(t.at)}"
            data-event-type="${escapeHtml(t.eventType)}"
            data-action="${escapeHtml(t.action)}"
            data-path="${escapeHtml(t.path)}"
            data-form-category="${escapeHtml(t.formCategory)}"
            data-campaign="${escapeHtml(t.campaign)}"
            data-source-label="${escapeHtml(fullLabel)}"
            aria-label="${escapeHtml(label)} on ${escapeHtml(t.path)}"
          ></button>`;
        })
        .join("");
      return `
        <div class="premql-lane">
          <span class="lane-label" title="${escapeHtml(fullLabel)}">${escapeHtml(fullLabel)}</span>
          <div class="lane-track">${dots}</div>
        </div>`;
    })
    .join("");
}

/** Post-MQL journey chart — path column + timeline with MQL-aligned lanes. */
export function renderPostMqlTouchLanes(container, lanes, options = {}) {
  if (!container) return;
  const { maxLanes = 12, emptyLabel = "No post-MQL return page views to show." } =
    options;
  const slice = (lanes ?? []).slice(0, maxLanes);
  if (!slice.length) {
    container.innerHTML = `<p class="touch-journey-empty">${escapeHtml(emptyLabel)}</p>`;
    return;
  }
  container.innerHTML = slice
    .map((lane, laneIndex) => {
      const color = colorForLane(lane, laneIndex, "post");
      const pathLabel = lane.label || lane.source || "Unknown";
      const dots = (lane.touches ?? [])
        .map((t) => {
          const left = Math.min(96, Math.max(4, Number(t.pct ?? 0)));
          const category = pathCategory(t.path);
          const highIntent = pathIsHighIntent(t.path);
          return `<button
            type="button"
            class="postmql-lane-dot"
            style="left:${left.toFixed(1)}%;background:${color}"
            data-at="${escapeHtml(t.at)}"
            data-path="${escapeHtml(t.path)}"
            data-category="${escapeHtml(category)}"
            data-high-intent="${highIntent ? "true" : "false"}"
            aria-label="Page view on ${escapeHtml(t.path)}"
          ></button>`;
        })
        .join("");
      return `
        <div class="postmql-lane-row">
          <div class="postmql-lane-path" title="${escapeHtml(pathLabel)}">${escapeHtml(pathLabel)}</div>
          <div class="postmql-timeline-col">
            <div class="postmql-lane-track">${dots}</div>
          </div>
        </div>`;
    })
    .join("");
}

export function wirePostMqlLaneTooltips(container, tooltipEl) {
  if (!container || !tooltipEl) return () => {};

  const hide = () => {
    tooltipEl.hidden = true;
  };

  const show = (dot) => {
    const d = dot.dataset;
    tooltipEl.innerHTML = postMqlLaneTooltipHtml({
      at: d.at,
      path: d.path,
      category: d.category,
      highIntent: d.highIntent,
    });
    tooltipEl.hidden = false;
    const rect = dot.getBoundingClientRect();
    const tipRect = tooltipEl.getBoundingClientRect();
    let left = rect.left + rect.width / 2 - tipRect.width / 2;
    let top = rect.top - tipRect.height - 10;
    left = Math.max(8, Math.min(left, window.innerWidth - tipRect.width - 8));
    if (top < 8) top = rect.bottom + 10;
    tooltipEl.style.left = `${left}px`;
    tooltipEl.style.top = `${top}px`;
  };

  container.querySelectorAll(".postmql-lane-dot").forEach((dot) => {
    if (dot.dataset.wired) return;
    dot.dataset.wired = "1";
    const activate = () => {
      show(dot);
      dot.classList.add("active");
    };
    const deactivate = () => {
      hide();
      dot.classList.remove("active");
    };
    dot.addEventListener("mouseenter", activate);
    dot.addEventListener("mouseleave", deactivate);
    dot.addEventListener("focus", activate);
    dot.addEventListener("blur", deactivate);
  });

  return hide;
}

export function wireLaneTooltips(container, tooltipEl) {
  if (!container || !tooltipEl) return () => {};

  const hide = () => {
    tooltipEl.hidden = true;
  };

  const show = (dot) => {
    const d = dot.dataset;
    if (d.highIntent !== undefined) {
      tooltipEl.innerHTML = postMqlLaneTooltipHtml({
        at: d.at,
        path: d.path,
        category: d.category,
        highIntent: d.highIntent,
      });
    } else {
      tooltipEl.innerHTML = laneTooltipHtml(
        {
          at: d.at,
          eventType: d.eventType,
          action: d.action,
          path: d.path,
          formCategory: d.formCategory,
          campaign: d.campaign,
        },
        d.sourceLabel || "",
      );
    }
    tooltipEl.hidden = false;
    const rect = dot.getBoundingClientRect();
    const tipRect = tooltipEl.getBoundingClientRect();
    let left = rect.left + rect.width / 2 - tipRect.width / 2;
    let top = rect.top - tipRect.height - 10;
    left = Math.max(8, Math.min(left, window.innerWidth - tipRect.width - 8));
    if (top < 8) top = rect.bottom + 10;
    tooltipEl.style.left = `${left}px`;
    tooltipEl.style.top = `${top}px`;
  };

  container.querySelectorAll(".lane-dot").forEach((dot) => {
    if (dot.dataset.wired) return;
    dot.dataset.wired = "1";
    const activate = () => {
      show(dot);
      dot.classList.add("active");
    };
    const deactivate = () => {
      hide();
      dot.classList.remove("active");
    };
    dot.addEventListener("mouseenter", activate);
    dot.addEventListener("mouseleave", deactivate);
    dot.addEventListener("focus", activate);
    dot.addEventListener("blur", deactivate);
  });

  return hide;
}

export function renderMqlMarker(markerEl, mqlPct) {
  if (!markerEl) return;
  markerEl.style.left = `${Math.min(99, Math.max(1, mqlPct))}%`;
  markerEl.hidden = false;
}
