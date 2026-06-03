import { useEffect, useState } from "react";

function PointerIcon() {
  return (
    <svg
      className="matrix-try-hint__icon"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M5.5 3.2v12.8l3.2-2.9 2.4 6.1 2.2-0.9-2.4-6.3 4.8 0.1L5.5 3.2z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
        <PointerIcon />
        <span className="matrix-try-hint__label">Try me</span>
      </div>
      <span className="matrix-try-hint__tail" />
    </div>
  );
}
