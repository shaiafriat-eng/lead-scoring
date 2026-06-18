#!/usr/bin/env python3
"""Verify pre-MQL test lead filter against postmql.csv (no Node required)."""

import csv
import hashlib
import json
import re
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSV_PATH = ROOT / "data" / "postmql.csv"
CONFIG_PATH = ROOT / "data" / "pre-mql-test-lead-exclusions.json"

FREE_EMAIL = {
    "gmail.com", "googlemail.com", "yahoo.com", "hotmail.com", "outlook.com",
    "live.com", "icloud.com", "me.com", "aol.com", "protonmail.com", "proton.me",
}


def domain_from_email(email: str):
    part = (email or "").split("@")[-1].strip().lower()
    if not part or part in FREE_EMAIL:
        return None
    return part


def mql_id(email: str, mql_date: str) -> str:
    key = f"{email.lower()}|{mql_date}"
    return hashlib.sha256(key.encode()).hexdigest()[:12]


def load_config():
    with open(CONFIG_PATH, encoding="utf-8") as f:
        raw = json.load(f)
    return {k: v for k, v in raw.items() if not k.startswith("_")}


def parse_email(email: str):
    raw = (email or "").strip().lower()
    at = raw.rfind("@")
    if at <= 0 or at == len(raw) - 1:
        return {"raw": raw, "local": raw, "domain": "", "valid": False}
    return {
        "raw": raw,
        "local": raw[:at],
        "domain": raw[at + 1 :],
        "valid": True,
    }


def is_whitelisted(journey, cfg):
    email = (journey.get("email") or "").strip().lower()
    if email in [e.lower() for e in cfg.get("allowedEmails", [])]:
        return True
    domain = parse_email(email)["domain"]
    if domain and domain in [d.lower() for d in cfg.get("allowedDomains", [])]:
        return True
    return False


def check_email_local(journey, cfg):
    parsed = parse_email(journey.get("email", ""))
    if not parsed["valid"]:
        return "malformed email (missing or invalid @)"

    local, domain, raw = parsed["local"], parsed["domain"], parsed["raw"]

    for pattern in cfg.get("emailLocalRegex", []):
        if re.search(pattern, local, re.I) or re.search(pattern, raw, re.I):
            return f"email local part matches /{pattern}/"

    for sub in cfg.get("emailSubstrings", []):
        if sub.lower() in local:
            return f'email local part contains "{sub}"'

    for pattern in cfg.get("syntheticEmailRegex", []):
        if re.search(pattern, raw, re.I):
            return f"synthetic email pattern /{pattern}/"

    tld = domain.split(".")[-1] if domain else ""
    if tld and tld.lower() in {x.lower() for x in cfg.get("invalidTlds", [])}:
        return f"invalid or test TLD .{tld}"

    if len(local) <= 2 and any(c.isdigit() for c in local):
        return "very short numeric local part"

    label = domain.split(".")[0] if domain else ""
    suspicious_domain = (
        len(label) >= 5
        and re.fullmatch(r"[bcdfghjklmnpqrstvwxyz0-9]+", label, re.I)
        and not re.search(r"[aeiou]", label, re.I)
    )
    keyboard_mash = (
        len(local) >= 6
        and re.fullmatch(r"[bcdfghjklmnpqrstvwxyz0-9._+-]+", local, re.I)
        and not re.search(r"[aeiou]", local, re.I)
    )
    if keyboard_mash and suspicious_domain:
        return "keyboard-mash email with suspicious domain"

    if domain in [d.lower() for d in cfg.get("blockedDomains", [])]:
        return f"blocked domain: {domain}"

    for sub in cfg.get("domainSubstrings", []):
        if sub.lower() in domain:
            return f'domain contains "{sub}"'

    return None


def check_company(journey, cfg):
    company = (journey.get("mainAccountName") or "").strip()
    if not company:
        return None
    for pattern in cfg.get("companyWordPatterns", []):
        if re.search(pattern, company, re.I):
            return f"company name matches /{pattern}/i ({company})"
    return None


def collect_weak(journey, cfg):
    weak = []
    local = parse_email(journey.get("email", ""))["local"]
    domain = parse_email(journey.get("email", ""))["domain"]
    for sub in cfg.get("emailSubstrings", []):
        if sub.lower() in local:
            weak.append(f'email contains "{sub}"')
    cr = check_company(journey, cfg)
    if cr:
        weak.append(cr)
    internal = [d.lower() for d in cfg.get("internalDomains", [])]
    if domain in internal:
        weak.append(f"internal domain {domain}")
    return weak


def get_reason(journey, cfg):
    if not journey.get("email"):
        return None
    if is_whitelisted(journey, cfg):
        return None
    email_reason = check_email_local(journey, cfg)
    if email_reason:
        return email_reason
    company_reason = check_company(journey, cfg)
    if company_reason:
        return company_reason
    weak = collect_weak(journey, cfg)
    domain = parse_email(journey.get("email", ""))["domain"]
    internal = [d.lower() for d in cfg.get("internalDomains", [])]
    if domain in internal and weak:
        return f"internal domain {domain} with test signal: {weak[0]}"
    return None


def load_journeys():
    groups = {}
    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            email = (row.get("MQL_EMAIL") or "").strip()
            mql_date = (row.get("DATE_MQL") or "").strip()
            if not email or not mql_date:
                continue
            jid = mql_id(email, mql_date)
            if jid not in groups:
                groups[jid] = {
                    "id": jid,
                    "email": email,
                    "mqlDate": mql_date,
                    "mainAccountName": (row.get("MAIN_ACCOUNT_NAME") or "").strip(),
                    "leadStatus": (row.get("LEAD_STATUS") or "").strip(),
                    "meetingOffered": False,
                    "meetingBooked": False,
                    "primarySource": "",
                }
            g = groups[jid]
            if (row.get("WAS_MEETING_OFFERED") or "").strip().upper() == "TRUE":
                g["meetingOffered"] = True
            if (row.get("IS_MEETING_BOOKED") or "").strip().upper() == "TRUE":
                g["meetingBooked"] = True
            src = (row.get("UTM_SOURCE_FILLED") or "").strip()
            med = (row.get("UTM_MEDIUM_FILLED") or "").strip()
            if src and not g["primarySource"]:
                g["primarySource"] = f"{src} / {med}" if med else src
    return list(groups.values())


def main():
    cfg = load_config()
    journeys = load_journeys()
    excluded = []
    kept = []
    reasons = {}
    for j in journeys:
        reason = get_reason(j, cfg)
        if reason:
            excluded.append(j)
            reasons[j["id"]] = reason
        else:
            kept.append(j)

    reason_counts = Counter(reasons.values())
    account_keys = {
        f"{(j.get('mainAccountName') or '').lower()}|{domain_from_email(j.get('email', '')) or ''}"
        for j in excluded
    }

    def discovery(jlist):
        return sum(1 for j in jlist if re.search(r"discovery\s*call", j.get("leadStatus", ""), re.I))

    def calendar(jlist):
        return sum(1 for j in jlist if j.get("meetingOffered"))

    before = {
        "mqlContacts": len(journeys),
        "calendarPresented": calendar(journeys),
        "discoveryCall": discovery(journeys),
    }
    after = {
        "mqlContacts": len(kept),
        "calendarPresented": calendar(kept),
        "discoveryCall": discovery(kept),
    }

    borderline = []
    for j in kept:
        weak = collect_weak(j, cfg)
        if len(weak) == 1:
            borderline.append({"email": j["email"], "account": j["mainAccountName"], "weak": weak})

    print("=== Pre-MQL test lead filter verification ===")
    print(f"Dataset: {CSV_PATH}")
    print(f"Total journeys: {len(journeys)}")
    print(f"Excluded test leads: {len(excluded)}")
    print(f"Excluded accounts: {len(account_keys)}")
    print(f"Kept: {len(kept)}")
    print()
    print("Top exclusion reasons:")
    for reason, count in reason_counts.most_common(10):
        print(f"  {count:4d}  {reason}")
    print()
    print("KPI impact (CSV flags; CP enrichment not run in this script):")
    print(f"  MQL contacts:        {before['mqlContacts']} -> {after['mqlContacts']} (-{before['mqlContacts'] - after['mqlContacts']})")
    print(f"  Calendar presented:  {before['calendarPresented']} -> {after['calendarPresented']} (-{before['calendarPresented'] - after['calendarPresented']})")
    print(f"  Discovery Call:      {before['discoveryCall']} -> {after['discoveryCall']} (-{before['discoveryCall'] - after['discoveryCall']})")
    print()
    print("Sample excluded:")
    for j in excluded[:20]:
        print(f"  {j['email']} | {j['mainAccountName']} | {reasons[j['id']]}")
    print()
    if borderline:
        print("Borderline (kept, 1 weak signal):")
        for b in borderline[:10]:
            print(f"  {b['email']} | {b['account']} | {b['weak']}")


if __name__ == "__main__":
    main()
