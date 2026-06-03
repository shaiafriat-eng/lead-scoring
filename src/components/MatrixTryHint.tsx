import { useEffect, useState } from "react";

export function MatrixTryHint() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const cells = document.querySelectorAll(".matrix-cell");
    const dismiss = () => setVisible(false);

    cells.forEach((cell) => {
      cell.addEventListener("mouseenter", dismiss, { once: true });
      cell.addEventListener("focus", dismiss, { once: true });
    });

    return () => {
      cells.forEach((cell) => {
        cell.removeEventListener("mouseenter", dismiss);
        cell.removeEventListener("focus", dismiss);
      });
    };
  }, []);

  return (
    <div
      className={`matrix-try-hint${visible ? "" : " matrix-try-hint--hidden"}`}
      aria-hidden="true"
    >
      <div className="matrix-try-hint__bubble">
        <span className="matrix-try-hint__label">Try me</span>
      </div>
      <span className="matrix-try-hint__tail" />
    </div>
  );
}
