import type { ReactNode } from "react";

type Props = {
  id: string;
  label?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  alt?: boolean;
};

export function Section({ id, label, title, subtitle, children, alt }: Props) {
  return (
    <section
      id={id}
      style={{ background: alt ? "var(--white-cream)" : "var(--bg-page)" }}
      aria-labelledby={`${id}-heading`}
    >
      <div className="section-inner">
        {label && <span className="section-label">{label}</span>}
        <h2 id={`${id}-heading`}>{title}</h2>
        {subtitle && (
          <p
            style={{
              maxWidth: "42rem",
              color: "var(--coffee-muted)",
              marginBottom: "2rem",
              textTransform: "none",
              fontWeight: 400,
              fontSize: "1.0625rem",
            }}
          >
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}
