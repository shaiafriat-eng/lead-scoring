import { useState, type ReactNode } from "react";

export type AccordionItem = { id: string; title: string; content: ReactNode };

export function Accordion({ items }: { items: AccordionItem[] }) {
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);

  return (
    <div className="accordion" role="region">
      {items.map((item) => {
        const isOpen = open === item.id;
        return (
          <div key={item.id} className="accordion-item">
            <button
              type="button"
              className="accordion-trigger"
              aria-expanded={isOpen}
              aria-controls={`panel-${item.id}`}
              id={`trigger-${item.id}`}
              onClick={() => setOpen(isOpen ? null : item.id)}
            >
              {item.title}
              <span aria-hidden="true">{isOpen ? "−" : "+"}</span>
            </button>
            {isOpen && (
              <div
                className="accordion-panel"
                id={`panel-${item.id}`}
                role="region"
                aria-labelledby={`trigger-${item.id}`}
              >
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
