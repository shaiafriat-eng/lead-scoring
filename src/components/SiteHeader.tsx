import { useEffect, useState } from "react";
import { NAV_SECTIONS } from "../data/scoringContent";
import { HiBobLogo } from "./HiBobLogo";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        height: "var(--nav-height)",
        background: scrolled ? "rgba(255, 251, 244, 0.97)" : "var(--bg-warm)",
        backdropFilter: scrolled ? "blur(10px)" : undefined,
        borderBottom: `1px solid ${scrolled ? "var(--border)" : "transparent"}`,
        transition: "background 0.2s, border-color 0.2s",
      }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          padding: "0 1rem",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <a
          href="#overview"
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <HiBobLogo height={32} />
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
            Lead Scoring Guide
          </span>
        </a>

        <nav
          aria-label="Page sections"
          className="desktop-nav"
          style={{
            display: "flex",
            gap: "0.15rem",
            flexWrap: "wrap",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          {NAV_SECTIONS.slice(0, 5).map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              style={{
                fontSize: "0.8125rem",
                fontWeight: 700,
                textDecoration: "none",
                color: "var(--coffee-muted)",
                padding: "0.4rem 0.55rem",
                borderRadius: 8,
              }}
            >
              {s.label}
            </a>
          ))}
          <a
            href="#faq"
            style={{
              fontSize: "0.8125rem",
              fontWeight: 900,
              color: "var(--cherry-syrup)",
              textDecoration: "none",
              padding: "0.4rem 0.55rem",
            }}
          >
            FAQ
          </a>
          <a
            href="https://brand.hibob.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ padding: "0.45rem 0.9rem", fontSize: "0.75rem", marginLeft: "0.5rem" }}
          >
            Brand portal
          </a>
        </nav>
      </div>
    </header>
  );
}
