(function () {
  const NAV = [
    { href: "index.html", label: "Home" },
    { href: "mqling-flow.html", label: "ICP definition" },
    { href: "scoring-flow.html", label: "Explore the Flow" },
    { href: "mql-routing.html", label: "MQL Policy" },
    { href: "guide.html", label: "Support and Trust" },
  ];

  const SITE_LOGO =
    '<img src="assets/hibob-logo.png" alt="HiBob" class="site-brand-logo" height="35" />';

  const FOOTER_LOGO =
    '<img src="assets/hibob-logo.png" alt="HiBob" class="site-brand-logo site-brand-logo--footer" height="28" />';

  const current = (function () {
    const path = window.location.pathname;
    const file = path.split("/").pop() || "index.html";
    return file === "" ? "index.html" : file;
  })();

  const header = document.getElementById("site-header");
  if (header) {
    const navLinks = NAV.map(
      (item) =>
        '<a href="' +
        item.href +
        '" class="' +
        (item.href === current ? "is-active" : "") +
        '">' +
        item.label +
        "</a>",
    ).join("");

    header.innerHTML =
      '<header class="site"><div class="wrap">' +
      '<a class="logo" href="index.html">' +
      SITE_LOGO +
      '<span class="logo-tag">Marketing Ops</span></a>' +
      '<nav class="site-nav" aria-label="Main">' +
      navLinks +
      "</nav></div></header>";
  }

  const footer = document.getElementById("site-footer");
  if (footer) {
    footer.innerHTML =
      '<footer class="site-footer"><div class="wrap">' +
      '<div class="logo-row">' +
      FOOTER_LOGO +
      "<span>Internal use · Lead Scoring Guide</span></div>" +
      "</div></footer>";
  }
})();
