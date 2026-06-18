/** Shared dashboard nav — journey views first, then operational dashboards. */

const NAV_LINKS = [
  { id: "pre-mql", href: "/pre-mql.html", label: "Pre-MQL journey", match: ["/pre-mql.html"] },
  { id: "post-mql", href: "/", label: "Post-MQL Journey", match: ["/", "/index.html"] },
  {
    id: "full-funnel",
    href: "/full-funnel.html",
    label: "Full funnel",
    match: ["/full-funnel.html"],
  },
  { id: "meetings", href: "/meetings.html", label: "Meetings", match: ["/meetings.html"] },
  {
    id: "calendar",
    href: "/calendar-funnel.html",
    label: "Lead → calendar",
    match: ["/calendar-funnel.html"],
  },
  { id: "routing", href: "/routing.html", label: "Routing rules", match: ["/routing.html"] },
];

function normalizePath(pathname) {
  if (!pathname || pathname === "/index.html") return "/";
  return pathname.endsWith("/") && pathname.length > 1
    ? pathname.slice(0, -1)
    : pathname;
}

export function currentNavId(pathname = window.location.pathname) {
  const path = normalizePath(pathname);
  return NAV_LINKS.find((link) => link.match.includes(path))?.id ?? null;
}

export function mountNav(container, activeId = currentNavId()) {
  if (!container) return;
  container.innerHTML = NAV_LINKS.map((link) => {
    const active = link.id === activeId;
    return `<a class="nav-dashboard-link${active ? " is-active" : ""}" href="${link.href}"${
      active ? ' aria-current="page"' : ""
    }>${link.label}</a>`;
  }).join("");
}
