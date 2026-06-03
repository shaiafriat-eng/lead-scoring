/** Avatar for the conversational MQL diagnostic (Marketing Ops bot). */
export function MqlDiagnosticBotAvatar() {
  return (
    <span className="mql-diagnostic__avatar" aria-hidden title="Marketing Ops bot">
      <svg
        viewBox="0 0 24 24"
        width="14"
        height="14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M12 8V4H8" />
        <rect x="4" y="8" width="16" height="12" rx="2" />
        <path d="M2 14h2" />
        <path d="M20 14h2" />
        <path d="M9 13v2" />
        <path d="M15 13v2" />
      </svg>
    </span>
  );
}
