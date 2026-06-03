import type { ScoringFlowBranch, ScoringFlowStep } from "../data/scoringContent";

type Props = {
  step: ScoringFlowStep;
  selectedId: string | null;
  onSelect: (branchId: string) => void;
};

export function FlowStepBranches({ step, selectedId, onSelect }: Props) {
  if (!step.branches?.length) return null;

  const isChoose = step.branchMode === "choose-one";

  return (
    <div className="flow-branches" style={{ marginBottom: "1.25rem" }}>
      {step.branchPrompt && (
        <p style={{ fontWeight: 700, fontSize: "0.875rem", marginBottom: "0.65rem" }}>
          {step.branchPrompt}
        </p>
      )}
      <ul className="flow-branches__list">
        {step.branches.map((branch) => (
          <FlowBranchItem
            key={branch.id}
            branch={branch}
            interactive={isChoose}
            selected={selectedId === branch.id}
            onSelect={() => onSelect(branch.id)}
          />
        ))}
      </ul>
      {isChoose && selectedId && (
        <p
          className="flow-branches__selected"
          style={{
            marginTop: "0.75rem",
            padding: "0.75rem 1rem",
            background: "var(--cappuccino-foam)",
            borderRadius: 8,
            fontSize: "0.875rem",
            marginBottom: 0,
          }}
        >
          {step.branches.find((b) => b.id === selectedId)?.outcome}
        </p>
      )}
    </div>
  );
}

function FlowBranchItem({
  branch,
  interactive,
  selected,
  onSelect,
}: {
  branch: ScoringFlowBranch;
  interactive: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  const gradeClass = branch.grade ? `flow-branches__item--grade-${branch.grade.charAt(0)}` : "";

  if (interactive) {
    return (
      <li className={`flow-branches__item flow-branches__item--btn ${gradeClass} ${selected ? "is-selected" : ""}`}>
        <button type="button" className="flow-branches__trigger" onClick={onSelect}>
          {branch.grade && (
            <span className="flow-branches__badge" aria-hidden>
              {branch.grade}
            </span>
          )}
          <span className="flow-branches__label">{branch.label}</span>
        </button>
        <p className="flow-branches__outcome">{branch.outcome}</p>
      </li>
    );
  }

  return (
    <li className={`flow-branches__item ${gradeClass}`}>
      {branch.grade && (
        <span className="flow-branches__badge" aria-hidden>
          {branch.grade}
        </span>
      )}
      <div>
        <strong className="flow-branches__label">{branch.label}</strong>
        <p className="flow-branches__outcome">{branch.outcome}</p>
      </div>
    </li>
  );
}
