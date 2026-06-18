import { countryForEmail } from "./email-country-index.mjs";
import { scoreGrade } from "./score-grade.mjs";

function primaryCampaignFromJourney(journey) {
  if (!journey) return null;
  for (const e of journey.events ?? []) {
    const c = e.campaign?.trim();
    if (c) return c;
  }
  return null;
}

/** Attach geo + score + campaign from joined sources onto account rows. */
export function enrichPreMqlAccounts(accounts, journeys, countryIndex) {
  const byId = new Map(journeys.map((j) => [j.id, j]));

  return accounts.map((acc) => {
    const primary = byId.get(acc.primaryJourneyId);
    const country = countryForEmail(countryIndex, primary?.email);

    return {
      ...acc,
      country: country ?? "(unknown)",
      scoreGrade: scoreGrade(acc.lastCombinedScore ?? primary?.lastCombinedScore),
      primaryCampaign:
        primaryCampaignFromJourney(primary) ?? acc.primaryCampaign ?? null,
    };
  });
}
