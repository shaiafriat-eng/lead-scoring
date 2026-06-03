import { MqlDiagnosticBotAvatar } from "./MqlDiagnosticBotAvatar";

export function MqlDiagnosticThinking() {
  return (
    <div className="mql-diagnostic__msg mql-diagnostic__msg--guide mql-diagnostic__msg--thinking">
      <MqlDiagnosticBotAvatar />
      <div className="mql-diagnostic__bubble mql-diagnostic__bubble--thinking" aria-busy="true">
        <span className="mql-diagnostic__thinking-text">Thinking</span>
        <span className="mql-diagnostic__thinking-dots" aria-hidden>
          <span />
          <span />
          <span />
        </span>
      </div>
    </div>
  );
}
