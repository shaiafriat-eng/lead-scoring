import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DEFAULT_CONFIG_PATH = path.join(
  __dirname,
  "..",
  "data",
  "pre-mql-test-lead-exclusions.json",
);

/** Built-in defaults when JSON file is missing. */
export const DEFAULT_TEST_LEAD_CONFIG = {
  emailSubstrings: [
    "test",
    "demo",
    "dummy",
    "fake",
    "sample",
    "internal",
    "qa",
    "automation",
    "noreply",
    "no-reply",
  ],
  blockedDomains: [
    "example.com",
    "example.org",
    "test.com",
    "demo.com",
    "fake.com",
    "mailinator.com",
    "yopmail.com",
    "guerrillamail.com",
    "10minutemail.com",
    "tempmail.com",
    "throwaway.email",
  ],
  internalDomains: ["hibob.com", "bob.com"],
  domainSubstrings: [
    "mailinator",
    "yopmail",
    "guerrillamail",
    "tempmail",
    "fakename",
    "demomagic",
  ],
  companyWordPatterns: [
    "\\btest\\b",
    "\\bdemo\\b",
    "\\bdummy\\b",
    "\\bfake\\b",
    "\\bsample\\b",
    "\\binternal\\b",
    "\\bqa\\b",
    "\\bsandbox\\b",
  ],
  emailLocalRegex: [
    "^test([+._-]|@)",
    "[+._-]test([+._-]|@)",
    "^demo([+._-]|@)",
    "[+._-]demo([+._-]|@)",
    "^dummy",
    "^fake",
    "^sample",
    "^qa([+._-]|@)",
    "noreply",
    "no-reply",
  ],
  syntheticEmailRegex: [
    "^(errr|trty|asdf|qwerty|aaaa|bbbb|testtest|xxxx|zzzz)@",
  ],
  invalidTlds: ["gif", "localhost", "invalid", "test"],
  allowedEmails: [],
  allowedDomains: ["sandboxquantum.com"],
};

let cachedConfig = null;
let cachedConfigPath = null;

function stripMetaKeys(obj) {
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith("_")) continue;
    out[key] = value;
  }
  return out;
}

function compileRegexList(patterns = [], flags = "i") {
  return patterns
    .map((pattern) => {
      try {
        return new RegExp(pattern, flags);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

/**
 * Load test-lead exclusion config from JSON (cached).
 * @param {string} [configPath]
 */
export async function loadTestLeadConfig(configPath = DEFAULT_CONFIG_PATH) {
  if (cachedConfig && cachedConfigPath === configPath) {
    return cachedConfig;
  }
  try {
    const text = await fs.readFile(configPath, "utf8");
    const parsed = stripMetaKeys(JSON.parse(text));
    cachedConfig = normalizeConfig({ ...DEFAULT_TEST_LEAD_CONFIG, ...parsed });
    cachedConfigPath = configPath;
    return cachedConfig;
  } catch {
    cachedConfig = normalizeConfig(DEFAULT_TEST_LEAD_CONFIG);
    cachedConfigPath = configPath;
    return cachedConfig;
  }
}

export function normalizeConfig(config) {
  return {
    ...config,
    emailSubstrings: (config.emailSubstrings ?? []).map((s) => s.toLowerCase()),
    blockedDomains: (config.blockedDomains ?? []).map((s) => s.toLowerCase()),
    internalDomains: (config.internalDomains ?? []).map((s) => s.toLowerCase()),
    domainSubstrings: (config.domainSubstrings ?? []).map((s) => s.toLowerCase()),
    allowedEmails: (config.allowedEmails ?? []).map((s) => s.toLowerCase()),
    allowedDomains: (config.allowedDomains ?? []).map((s) => s.toLowerCase()),
    companyRegex: compileRegexList(config.companyWordPatterns ?? []),
    emailLocalRegex: compileRegexList(config.emailLocalRegex ?? []),
    syntheticEmailRegex: compileRegexList(config.syntheticEmailRegex ?? []),
    invalidTlds: new Set(
      (config.invalidTlds ?? []).map((s) => s.toLowerCase()),
    ),
  };
}

export function clearTestLeadConfigCache() {
  cachedConfig = null;
  cachedConfigPath = null;
}
