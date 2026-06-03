import { Link, useLocation } from "react-router-dom";
import { SITE_NAV } from "../data/scoringContent";
import { HiBobLogo } from "./HiBobLogo";

export function SiteHeader() {
  const { pathname } = useLocation();

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname === path || pathname.startsWith(path + "/");
  };

  return (
    <header className="site-header-sticky">
      <div
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          padding: "0.75rem 1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <Link
          to="/"
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <HiBobLogo height={35} />
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 700,
              color: "var(--coffee-muted)",
              fontSize: "0.8125rem",
              borderLeft: "1px solid var(--border)",
              paddingLeft: "1rem",
            }}
          >
            Marketing Ops
          </span>
        </Link>

        <nav
          aria-label="Main navigation"
          style={{
            display: "flex",
            gap: "0.15rem",
            flexWrap: "wrap",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          {SITE_NAV.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                textDecoration: "none",
                color: isActive(item.path) ? "var(--dark-wine)" : "var(--coffee-muted)",
                padding: "0.35rem 0.5rem",
                borderRadius: 8,
                background: isActive(item.path) ? "var(--cappuccino-foam)" : "transparent",
                boxShadow: isActive(item.path)
                  ? "inset 0 0 0 2px var(--cherry-syrup)"
                  : undefined,
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
