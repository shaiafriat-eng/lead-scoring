import { FAQ_ITEMS } from "../data/scoringContent";
import { Section } from "./Section";
import { Accordion } from "./Accordion";

export function FAQ() {
  return (
    <Section id="faq" label="Support" title="Frequently asked questions" alt>
      <Accordion
        items={FAQ_ITEMS.map((item) => ({
          id: item.q.slice(0, 24),
          title: item.q,
          content: <p style={{ margin: 0 }}>{item.a}</p>,
        }))}
      />
    </Section>
  );
}
