import {
  getSalesQueueTiers,
  heatColorForPriority,
  MATRIX_CELLS,
  textColorForPriority,
} from "../data/scoringContent";

function priorityForCode(code: string): number {
  const demo = code[0];
  const beh = Number(code[1]);
  return MATRIX_CELLS.find((c) => c.demo === demo && c.beh === beh)?.priority ?? 14;
}

export function SalesPriorityOrder() {
  const tiers = getSalesQueueTiers();

  return (
    <div className="sales-order" aria-label="Sales queue order from highest to lowest priority">
      <div className="sales-order__header">
        <h3 className="sales-order__title">Sales queue order</h3>
        <span className="sales-order__caption">Highest priority first</span>
      </div>

      <div className="sales-order__ladder">
        {tiers.map((tier) => (
          <div key={tier.rank} className="sales-order__row">
            <span className="sales-order__rank" aria-label={`Priority rank ${tier.rank}`}>
              {tier.rank}
            </span>
            <div className="sales-order__codes">
              {tier.codes.map((code) => {
                const p = priorityForCode(code);
                return (
                  <span
                    key={code}
                    className="sales-order__code"
                    style={{
                      background: heatColorForPriority(p),
                      color: textColorForPriority(p),
                    }}
                    title={`${code} — priority ${p}`}
                  >
                    {code}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <p className="sales-order__foot">
        Work the queue from <strong>A1</strong> down to <strong>D4</strong> as capacity allows. Tied ranks
        (e.g. A2, B1, C1 at rank 2) are equivalent in sequence.
      </p>
    </div>
  );
}
