import { IcpDefinitionCard } from "./IcpDefinitionCard";
import { Section } from "./Section";

export function MqlingFlowSection() {
  return (
    <Section
      id="mqling-flow"
      label="Routing"
      title="MQLing flow"
      subtitle="How fit, engagement, and channel rules combine before a lead becomes an MQL. ICP is the account-level gate for demographic scoring."
    >
      <IcpDefinitionCard />
    </Section>
  );
}
