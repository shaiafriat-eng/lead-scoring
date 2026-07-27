(function () {
  var mount = document.getElementById("activity-points");
  if (!mount) return;

  var ACTIVITY_WEIGHTS = [
    {
      points: 100,
      tag: "Immediate tier 1",
      activities: [
        { name: "Request a demo form", aliases: "demo request filled form" },
        { name: "Pricing form", aliases: "pricing page filled form" },
        { name: "Contact form with Contact Sales as reason", aliases: "contact sales form" },
        { name: "Demo or learn-more request on webinars", aliases: "webinar demo learn more" },
        { name: "Demo or learn-more request at events", aliases: "event demo learn more" },
      ],
    },
    {
      points: 50,
      tag: "Immediate tier 2",
      activities: [
        { name: "Watch a Demo form", aliases: "wad watch demo" },
        { name: "Product tour", aliases: "tour" },
        { name: "ROI Calculator", aliases: "roi" },
        { name: "Attended a HiBob / Community event", aliases: "hibob community event attendance" },
      ],
    },
    {
      points: 35,
      tag: "6Sense booth bonus",
      activities: [
        {
          name: "Booth attendee with demographic A + Decision/Purchase stage",
          aliases: "6sense booth a decision purchase bonus",
        },
      ],
    },
    {
      points: 30,
      tag: "",
      activities: [{ name: "Watched 20+ seconds of the demo video", aliases: "demo video watch" }],
    },
    {
      points: 25,
      tag: "",
      activities: [{ name: "Pre-MQL bonus for visiting BOFU pages", aliases: "bofu pre-mql bonus" }],
    },
    {
      points: 15,
      tag: "Once per day cap",
      activities: [
        { name: "BOFU page visit or BOFU link click", aliases: "bofu visit click" },
        { name: "Content / Newsletter / Webinar form", aliases: "content newsletter webinar form nurture" },
        { name: "Influenced by a content syndication (CPL) campaign", aliases: "cpl content syndication" },
        { name: "Downloaded a High Value Asset", aliases: "hva high value asset download" },
      ],
    },
    {
      points: 10,
      tag: "Once per day cap",
      activities: [
        { name: "MOFU page visit", aliases: "mofu visit" },
        { name: "Attended at least 10 minutes on a live webinar", aliases: "webinar live 10 minutes" },
      ],
    },
    {
      points: 5,
      tag: "Max 3×/month — cannot reach MQL alone",
      activities: [{ name: "Clicked any link in an email", aliases: "email click link" }],
    },
  ];

  var ALL = ACTIVITY_WEIGHTS.flatMap(function (row) {
    return row.activities.map(function (activity) {
      return {
        points: row.points,
        tag: row.tag,
        name: activity.name,
        aliases: activity.aliases || "",
      };
    });
  });

  var POINT_OPTIONS = ACTIVITY_WEIGHTS.map(function (row) {
    return row.points;
  });

  var state = { query: "", points: "all" };

  function matches(item) {
    if (state.points !== "all" && String(item.points) !== String(state.points)) return false;
    var q = state.query.trim().toLowerCase();
    if (!q) return true;
    var hay = (item.name + " " + item.aliases + " +" + item.points + " " + item.tag).toLowerCase();
    return q.split(/\s+/).every(function (token) {
      return hay.indexOf(token) !== -1;
    });
  }

  function highlight(text, query) {
    if (!query.trim()) return escapeHtml(text);
    var tokens = query
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map(function (t) {
        return t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      });
    if (!tokens.length) return escapeHtml(text);
    var re = new RegExp("(" + tokens.join("|") + ")", "ig");
    return escapeHtml(text).replace(re, "<mark>$1</mark>");
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function render() {
    var filtered = ALL.filter(matches);
    var chips = ['<button type="button" class="activity-points__chip' + (state.points === "all" ? " is-active" : "") + '" data-points="all">All</button>']
      .concat(
        POINT_OPTIONS.map(function (pts) {
          var active = String(state.points) === String(pts) ? " is-active" : "";
          return (
            '<button type="button" class="activity-points__chip' +
            active +
            '" data-points="' +
            pts +
            '">+' +
            pts +
            "</button>"
          );
        }),
      )
      .join("");

    var list;
    if (!filtered.length) {
      list =
        '<p class="activity-points__empty">No activities match <strong>' +
        escapeHtml(state.query) +
        "</strong>. Try “demo”, “webinar”, “email”, or “BOFU”.</p>";
    } else {
      list =
        '<ul class="activity-points__list" role="list">' +
        filtered
          .map(function (item) {
            return (
              '<li class="activity-points__row">' +
              '<span class="activity-points__pts" aria-label="' +
              item.points +
              ' points">+' +
              item.points +
              "</span>" +
              '<div class="activity-points__copy">' +
              '<p class="activity-points__name">' +
              highlight(item.name, state.query) +
              "</p>" +
              (item.tag
                ? '<p class="activity-points__tag">' + escapeHtml(item.tag) + "</p>"
                : "") +
              "</div>" +
              "</li>"
            );
          })
          .join("") +
        "</ul>";
    }

    mount.innerHTML =
      '<div class="activity-points card">' +
      "<h3>Which activities earn points?</h3>" +
      '<p class="activity-points__lead">Search any marketing activity to see how many points it adds in Marketo’s Behavioral Score Calculation field.</p>' +
      '<label class="activity-points__search-label" for="activity-points-search">Search activities</label>' +
      '<div class="activity-points__search-wrap">' +
      '<svg class="activity-points__search-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>' +
      '<input id="activity-points-search" class="activity-points__search" type="search" placeholder="Try demo, webinar, email, BOFU, booth…" autocomplete="off" value="' +
      escapeHtml(state.query) +
      '" />' +
      "</div>" +
      '<div class="activity-points__chips" role="group" aria-label="Filter by points">' +
      chips +
      "</div>" +
      '<p class="activity-points__count" aria-live="polite">' +
      filtered.length +
      " activit" +
      (filtered.length === 1 ? "y" : "ies") +
      "</p>" +
      list +
      "</div>";

    var input = document.getElementById("activity-points-search");
    if (input) {
      input.addEventListener("input", function () {
        state.query = input.value;
        var start = input.selectionStart;
        var end = input.selectionEnd;
        render();
        var next = document.getElementById("activity-points-search");
        if (next) {
          next.focus();
          if (typeof start === "number") next.setSelectionRange(start, end);
        }
      });
    }

    mount.querySelectorAll("[data-points]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.points = btn.getAttribute("data-points");
        render();
        var next = document.getElementById("activity-points-search");
        if (next) next.focus();
      });
    });
  }

  render();
})();
