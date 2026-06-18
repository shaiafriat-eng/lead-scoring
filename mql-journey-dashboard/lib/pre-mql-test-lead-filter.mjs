import { domainFromEmail } from "./account-logo.mjs";
import { normalizeConfig, DEFAULT_TEST_LEAD_CONFIG } from "./pre-mql-test-lead-config.mjs";

const DEFAULT_CFG = normalizeConfig(DEFAULT_TEST_LEAD_CONFIG);

function parseEmail(email) {
  const raw = String(email ?? "").trim().toLowerCase();
  const at = raw.lastIndexOf("@");
  if (at <= 0 || at === raw.length - 1) {
    return { raw, local: raw, domain: "", valid: false };
  }
  return {
    raw,
    local: raw.slice(0, at),
    domain: raw.slice(at + 1),
    valid: true,
  };
}

function isWhitelisted(journey, config) {
  const email = String(journey.email ?? "").trim().toLowerCase();
  if (config.allowedEmails.includes(email)) return true;
  const { domain } = parseEmail(email);
  if (domain && config.allowedDomains.includes(domain)) return true;
  return false;
}

function emailHasSubstring(local, sub) {
  return local.includes(sub);
}

function isSuspiciousDomain(domain) {
  if (!domain) return false;
  const label = domain.split(".")[0] ?? "";
  if (label.length < 5) return false;
  return /^[bcdfghjklmnpqrstvwxyz0-9]+$/i.test(label) && !/[aeiou]/i.test(label);
}

function isKeyboardMashLocal(local) {
  if (!local || local.length < 6) return false;
  return /^[bcdfghjklmnpqrstvwxyz0-9._+-]+$/i.test(local) && !/[aeiou]/i.test(local);
}

function domainMatchesBlocked(domain, config) {
  if (!domain) return null;
  if (config.blockedDomains.includes(domain)) {
    return `blocked domain: ${domain}`;
  }
  for (const sub of config.domainSubstrings) {
    if (domain.includes(sub)) {
      return `domain contains "${sub}"`;
    }
  }
  return null;
}

function checkEmailLocal(journey, config) {
  const { raw, local, domain, valid } = parseEmail(journey.email);
  if (!valid) {
    return "malformed email (missing or invalid @)";
  }

  for (const re of config.emailLocalRegex) {
    if (re.test(local) || re.test(raw)) {
      return `email local part matches /${re.source}/`;
    }
  }

  for (const sub of config.emailSubstrings) {
    if (emailHasSubstring(local, sub)) {
      return `email local part contains "${sub}"`;
    }
  }

  for (const re of config.syntheticEmailRegex) {
    if (re.test(raw)) {
      return `synthetic email pattern /${re.source}/`;
    }
  }

  const tld = domain.split(".").pop();
  if (tld && config.invalidTlds.has(tld)) {
    return `invalid or test TLD .${tld}`;
  }

  if (local.length <= 2 && /\d/.test(local)) {
    return "very short numeric local part";
  }

  if (isKeyboardMashLocal(local) && isSuspiciousDomain(domain)) {
    return "keyboard-mash email with suspicious domain";
  }

  const domainReason = domainMatchesBlocked(domain, config);
  if (domainReason) return domainReason;

  return null;
}

function checkCompanyName(journey, config) {
  const company = String(journey.mainAccountName ?? "").trim();
  if (!company) return null;

  for (const re of config.companyRegex) {
    if (re.test(company)) {
      return `company name matches /${re.source}/i (${company})`;
    }
  }
  return null;
}

function checkInternalDomain(journey, config, otherSignals) {
  const { domain } = parseEmail(journey.email);
  if (!domain || !config.internalDomains.includes(domain)) return null;
  if (otherSignals.length > 0) {
    return `internal domain ${domain} with test signal: ${otherSignals[0]}`;
  }
  return null;
}

function collectWeakSignals(journey, config) {
  const weak = [];
  const { local, domain } = parseEmail(journey.email);

  for (const sub of config.emailSubstrings) {
    if (local.includes(sub)) weak.push(`email contains "${sub}"`);
  }

  const companyReason = checkCompanyName(journey, config);
  if (companyReason) weak.push(companyReason);

  if (domain && config.internalDomains.includes(domain)) {
    weak.push(`internal domain ${domain}`);
  }

  return weak;
}

/**
 * Return exclusion reason string, or null if the journey should be kept.
 */
export function getTestLeadReason(journey, config = DEFAULT_CFG) {
  if (!journey?.email) return null;
  if (isWhitelisted(journey, config)) return null;

  const emailReason = checkEmailLocal(journey, config);
  if (emailReason) return emailReason;

  const companyReason = checkCompanyName(journey, config);
  if (companyReason) return companyReason;

  const weak = collectWeakSignals(journey, config);
  const internalReason = checkInternalDomain(journey, config, weak);
  if (internalReason) return internalReason;

  return null;
}

export function isTestLead(journey, config = DEFAULT_CFG) {
  return getTestLeadReason(journey, config) != null;
}

/**
 * Split journeys into kept vs excluded test leads.
 */
export function filterTestLeads(journeys, config = DEFAULT_CFG) {
  const kept = [];
  const excluded = [];
  const reasons = new Map();

  for (const journey of journeys) {
    const reason = getTestLeadReason(journey, config);
    if (reason) {
      excluded.push(journey);
      reasons.set(journey.id, reason);
    } else {
      kept.push(journey);
    }
  }

  return { kept, excluded, reasons };
}

function reasonCategory(reason) {
  if (!reason) return "other";
  if (reason.includes("domain")) return "domain";
  if (reason.includes("company")) return "company";
  if (reason.includes("synthetic") || reason.includes("malformed") || reason.includes("TLD") || reason.includes("keyboard")) {
    return "synthetic_email";
  }
  if (reason.includes("internal domain")) return "internal_domain";
  if (reason.includes("email")) return "email";
  return "other";
}

function summarizeReasons(reasonsMap, excluded) {
  const breakdown = new Map();
  for (const journey of excluded) {
    const reason = reasonsMap.get(journey.id) ?? "unknown";
    const cat = reasonCategory(reason);
    const entry = breakdown.get(cat) ?? { category: cat, count: 0, examples: [] };
    entry.count += 1;
    if (entry.examples.length < 3) entry.examples.push(reason);
    breakdown.set(cat, entry);
  }
  return [...breakdown.values()].sort((a, b) => b.count - a.count);
}

function countDiscoveryCalls(journeys) {
  return journeys.filter((j) => /discovery\s*call/i.test(j.leadStatus || "")).length;
}

function countCalendarPresented(journeys) {
  return journeys.filter((j) => j.cpCalendarPresented ?? j.meetingOffered).length;
}

function countBookedAfterOffer(journeys) {
  return journeys.filter((j) => j.cpBookedAfterOffer ?? false).length;
}

function sampleExcludedRecord(journey, reason) {
  const { domain } = parseEmail(journey.email);
  return {
    email: journey.email,
    account: journey.mainAccountName || "—",
    domain: domain || domainFromEmail(journey.email) || "—",
    reason,
    primarySource: journey.primarySource || "—",
    mqlDate: journey.mqlDate,
    cpStatus: journey.cpStatus ?? journey.conciergeStatus ?? null,
    leadStatus: journey.leadStatus ?? null,
  };
}

/**
 * Near-miss journeys: weak signals present but below exclusion threshold.
 */
export function findBorderlineLeads(journeys, config = DEFAULT_CFG, limit = 15) {
  const borderline = [];
  for (const journey of journeys) {
    if (isTestLead(journey, config)) continue;
    const weak = collectWeakSignals(journey, config);
    if (weak.length === 1) {
      borderline.push({
        email: journey.email,
        account: journey.mainAccountName,
        weakSignals: weak,
      });
    }
    if (borderline.length >= limit) break;
  }
  return borderline;
}

/**
 * Build exclusion report with before/after KPI impact.
 */
export function buildTestLeadExclusionReport({
  allJourneys,
  kept,
  excluded,
  reasons,
  beforeCpKpis = null,
  afterCpKpis = null,
  borderline = [],
}) {
  const reasonBreakdown = summarizeReasons(reasons, excluded);
  const excludedAccountKeys = new Set(
    excluded.map((j) =>
      `${String(j.mainAccountName ?? "").toLowerCase()}|${domainFromEmail(j.email) ?? ""}`,
    ),
  );

  const before = {
    mqlContacts: allJourneys.length,
    calendarPresented:
      beforeCpKpis?.counts?.calendarPresented ?? countCalendarPresented(allJourneys),
    bookedAfterOffer:
      beforeCpKpis?.counts?.bookedAfterOffer ?? countBookedAfterOffer(allJourneys),
    discoveryCall: countDiscoveryCalls(allJourneys),
  };

  const after = {
    mqlContacts: kept.length,
    calendarPresented:
      afterCpKpis?.counts?.calendarPresented ?? countCalendarPresented(kept),
    bookedAfterOffer:
      afterCpKpis?.counts?.bookedAfterOffer ?? countBookedAfterOffer(kept),
    discoveryCall: countDiscoveryCalls(kept),
  };

  const samples = excluded.slice(0, 20).map((j) =>
    sampleExcludedRecord(j, reasons.get(j.id)),
  );

  return {
    totalExcludedLeads: excluded.length,
    totalExcludedAccounts: excludedAccountKeys.size,
    totalKeptLeads: kept.length,
    totalRawLeads: allJourneys.length,
    reasonBreakdown: reasonBreakdown.map((r) => ({
      category: r.category,
      count: r.count,
      examples: r.examples,
    })),
    topReasons: topReasonsList({
      topReasons: [...reasons.values()].reduce((map, reason) => {
        map.set(reason, (map.get(reason) ?? 0) + 1);
        return map;
      }, new Map()),
    }),
    before,
    after,
    delta: {
      mqlContacts: before.mqlContacts - after.mqlContacts,
      calendarPresented: before.calendarPresented - after.calendarPresented,
      bookedAfterOffer: before.bookedAfterOffer - after.bookedAfterOffer,
      discoveryCall: before.discoveryCall - after.discoveryCall,
    },
    samples,
    borderline,
    excludedLeads: excluded.map((j) => ({
      id: j.id,
      email: j.email,
      account: j.mainAccountName,
      reason: reasons.get(j.id),
    })),
  };
}

export function topReasonsList(report) {
  const entries = report.topReasons instanceof Map
    ? [...report.topReasons.entries()]
    : Object.entries(report.topReasons ?? {});
  return entries
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);
}
