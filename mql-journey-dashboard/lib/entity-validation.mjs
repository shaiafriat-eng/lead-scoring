import { accountGroupKey } from "./account-logo.mjs";
import { postMqlByEmail } from "./full-funnel.mjs";

/**
 * Global entity-level counts for KPI validation (unfiltered).
 * Post-MQL export includes only contacts with tracked website activity after MQL.
 */
export function computeEntityValidation(preJourneys, postJourneys, accounts) {
  const postMap = postMqlByEmail(postJourneys);
  const returningContacts = postJourneys.filter(
    (p) => (p.visits?.length ?? 0) > 0,
  );

  const preEmails = new Set(
    preJourneys.map((j) => j.email?.toLowerCase()).filter(Boolean),
  );

  const contactsWithTrackedReturns = preJourneys.filter((j) => {
    const post = postMap.get(j.email?.toLowerCase());
    return (post?.visits?.length ?? 0) > 0;
  }).length;

  const returningContactsInPreExport = returningContacts.filter((p) =>
    preEmails.has(p.email?.toLowerCase()),
  ).length;

  const returningContactsNotInPreExport =
    returningContacts.length - returningContactsInPreExport;

  let returningAccountsPrimary = 0;
  const journeysByKey = new Map();
  for (const j of preJourneys) {
    const key = accountGroupKey(j.mainAccountName, j.logoDomain ?? null);
    if (!journeysByKey.has(key)) journeysByKey.set(key, []);
    journeysByKey.get(key).push(j);
  }

  let returningAccountsAnyContact = 0;
  let accountsPrimaryMiss = 0;

  for (const acc of accounts) {
    const key = accountGroupKey(acc.accountName, acc.logoDomain ?? null);
    const journeys = journeysByKey.get(key) ?? [];
    const primary = preJourneys.find((j) => j.id === acc.primaryJourneyId);
    const hasReturn = (email) =>
      (postMap.get(email?.toLowerCase())?.visits?.length ?? 0) > 0;
    const any = journeys.some((j) => hasReturn(j.email));
    const prim = hasReturn(primary?.email);
    if (prim) returningAccountsPrimary += 1;
    if (any) returningAccountsAnyContact += 1;
    if (any && !prim) accountsPrimaryMiss += 1;
  }

  const mqlContacts = preJourneys.length;
  const accountCount = accounts.length;

  return {
    mqlContacts,
    accountCount,
    returningMqlContacts: returningContacts.length,
    returningAccounts: returningAccountsAnyContact,
    returningAccountsPrimary,
    returningAccountsAnyContact,
    contactsWithoutTrackedReturns: mqlContacts - contactsWithTrackedReturns,
    contactsNotInPostMqlExport: mqlContacts - returningContactsInPreExport,
    accountsWithoutTrackedReturns: accountCount - returningAccountsAnyContact,
    returningContactsNotInPreExport: returningContactsNotInPreExport,
    accountsPrimaryMiss,
    gapContactsMinusAccounts:
      returningContacts.length - returningAccountsAnyContact,
    notes: [
      "Post-MQL tab uses the post-MQL website export; every row has ≥1 tracked return visit after MQL.",
      "Full Funnel KPI uses any-contact account logic: an account counts as returned if any MQL contact on the account had tracked post-MQL activity.",
      "Primary-contact-only count is kept for validation (historical join via highest pre-MQL touches).",
      "Do not interpret missing rows as “did not return” — only “no tracked post-MQL return activity in the current dataset.”",
      "Website page views after MQL only; email, ads, sales touches, and logged-out gaps are not included.",
    ],
  };
}
