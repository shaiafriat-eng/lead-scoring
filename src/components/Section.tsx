import type { ReactNode } from "react";

type Props = {
  id: string;
  label?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  subtitleWide?: boolean;
  children: ReactNode;
  alt?: boolean;
};

export function Section({ id, label, title, subtitle, subtitleWide, children, alt }: Props) {
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
            className={subtitleWide ? "section-subtitle section-subtitle--wide" : "section-subtitle"}
            style={{
              maxWidth: subtitleWide ? "none" : "42rem",
              width: subtitleWide ? "100%" : undefined,
              color: "var(--coffee-muted)",
              marginBottom: "1.5rem",
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
