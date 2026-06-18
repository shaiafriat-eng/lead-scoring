import crypto from "node:crypto";

const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "protonmail.com",
  "proton.me",
  "mail.com",
  "gmx.com",
  "yandex.com",
  "zoho.com",
  "hey.com",
  "pm.me",
]);

export function domainFromEmail(email) {
  const part = String(email ?? "")
    .split("@")[1]
    ?.trim()
    .toLowerCase();
  if (!part || FREE_EMAIL_DOMAINS.has(part)) return null;
  return part;
}

export function accountDisplayName(name) {
  const trimmed = String(name ?? "").trim();
  return trimmed || "Unknown account";
}

export function accountGroupKey(mainAccountName, domain) {
  const name = accountDisplayName(mainAccountName).toLowerCase();
  return `${name}|${domain || "no-domain"}`;
}

export function accountGroupId(key) {
  return crypto.createHash("sha256").update(key).digest("hex").slice(0, 12);
}

export function logoUrlForDomain(domain) {
  if (!domain) return null;
  return `https://logo.clearbit.com/${encodeURIComponent(domain)}`;
}

export function faviconUrlForDomain(domain) {
  if (!domain) return null;
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
}

export function initialsForAccount(name) {
  const words = accountDisplayName(name)
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function pickBestDomain(emails) {
  const counts = new Map();
  for (const email of emails) {
    const domain = domainFromEmail(email);
    if (!domain) continue;
    counts.set(domain, (counts.get(domain) ?? 0) + 1);
  }
  if (counts.size === 0) return null;
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}
