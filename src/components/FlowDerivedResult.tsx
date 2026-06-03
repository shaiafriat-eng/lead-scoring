type Props = {
  label: string;
  value: string;
  outcome: string;
  gradeClass?: string;
  toneClass?: string;
};

export function FlowDerivedResult({ label, value, outcome, gradeClass, toneClass }: Props) {
  return (
    <div
      className={`flow-derived ${gradeClass ?? ""} ${toneClass ?? ""}`.trim()}
      style={{ marginBottom: "1.25rem" }}
    >
      <p className="flow-derived__label">{label}</p>
      <p className="flow-derived__value" aria-live="polite">
        {value}
      </p>
      <p className="flow-derived__outcome">{outcome}</p>
    </div>
  );
}
