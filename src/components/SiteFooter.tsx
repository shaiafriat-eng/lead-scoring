import { MIRO_BOARD_URL } from "../data/scoringContent";
import { HiBobLogo } from "./HiBobLogo";

export function SiteFooter() {
  return (
    <footer
      style={{
        padding: "2rem 0 3rem",
        borderTop: "1px solid var(--border)",
        background: "var(--white-cream)",
      }}
    >
      <div
        className="section-inner"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1.5rem",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <HiBobLogo height={28} />
          <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--coffee-muted)" }}>
            Internal use · Lead Scoring Guide ·{" "}
            <a href="https://brand.hibob.com/" target="_blank" rel="noopener noreferrer">
              brand.hibob.com
            </a>
          </p>
        </div>
        <a href={MIRO_BOARD_URL} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
          Miro board
        </a>
      </div>
    </footer>
  );
}
