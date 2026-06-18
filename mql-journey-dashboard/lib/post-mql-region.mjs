import { normalizeKey } from "./world-locations.mjs";
import { countryForEmail } from "./email-country-index.mjs";

export const UNKNOWN_REGION = "Unknown region";

/** HiBob sales regions (aligned with weekly booking / routing taxonomy). */
export const REGION_LABELS = [
  "United States",
  "Canada",
  "LATAM",
  "UKI & ROW",
  "NEB / Iberia",
  "DACH",
  "IL & CEE",
  "APJ",
  UNKNOWN_REGION,
];

const US_STATE_KEYS = new Set(
  [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
    "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
    "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
    "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
    "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
    "New Hampshire", "New Jersey", "New Mexico", "New York",
    "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
    "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
    "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington",
    "West Virginia", "Wisconsin", "Wyoming", "District of Columbia",
  ].map(normalizeKey),
);

const CA_PROVINCE_KEYS = new Set(
  [
    "Alberta", "British Columbia", "Manitoba", "New Brunswick",
    "Newfoundland and Labrador", "Nova Scotia", "Ontario",
    "Prince Edward Island", "Quebec", "Saskatchewan",
    "Northwest Territories", "Nunavut", "Yukon",
  ].map(normalizeKey),
);

/** country normalized key → region label */
const COUNTRY_TO_REGION = new Map();

function assignCountries(region, names) {
  for (const name of names) {
    COUNTRY_TO_REGION.set(normalizeKey(name), region);
  }
}

assignCountries("United States", ["United States"]);
assignCountries("Canada", ["Canada"]);

assignCountries("LATAM", [
  "Mexico", "Brazil", "Argentina", "Chile", "Colombia", "Peru", "Venezuela",
  "Ecuador", "Uruguay", "Paraguay", "Bolivia", "Costa Rica", "Panama",
  "Guatemala", "Honduras", "El Salvador", "Nicaragua", "Dominican Republic",
  "Puerto Rico", "Cuba", "Jamaica", "Trinidad and Tobago", "Bahamas",
  "Barbados", "Belize", "Guyana", "Suriname", "Haiti",
]);

assignCountries("DACH", ["Germany", "Austria", "Switzerland"]);

assignCountries("UKI & ROW", [
  "United Kingdom", "Ireland", "South Africa", "Nigeria", "Kenya", "Ghana",
  "Egypt", "Morocco", "Tunisia", "Algeria", "United Arab Emirates",
  "Saudi Arabia", "Qatar", "Kuwait", "Bahrain", "Oman", "Jordan", "Lebanon",
]);

assignCountries("NEB / Iberia", [
  "France", "Spain", "Portugal", "Italy", "Netherlands", "Belgium", "Luxembourg",
  "Sweden", "Norway", "Denmark", "Finland", "Iceland", "Greece", "Cyprus",
  "Malta", "Monaco", "Andorra", "San Marino",
]);

assignCountries("IL & CEE", [
  "Israel", "Poland", "Czech Republic", "Hungary", "Romania", "Bulgaria",
  "Slovakia", "Slovenia", "Croatia", "Serbia", "Bosnia and Herzegovina",
  "North Macedonia", "Albania", "Moldova", "Ukraine", "Belarus", "Lithuania",
  "Latvia", "Estonia", "Georgia", "Armenia", "Azerbaijan", "Kazakhstan",
]);

assignCountries("APJ", [
  "Australia", "New Zealand", "Japan", "South Korea", "Singapore", "Hong Kong",
  "Taiwan", "China", "Malaysia", "Indonesia", "Thailand", "Vietnam",
  "Philippines", "Cambodia", "Myanmar", "Brunei", "Macao", "Fiji",
  "Papua New Guinea", "India", "Pakistan", "Bangladesh", "Sri Lanka", "Nepal",
]);

assignCountries("IL & CEE", ["Turkey"]);

const REGION_ALIASES = new Map(
  Object.entries({
    us: "United States",
    usa: "United States",
    "united states of america": "United States",
    uk: "UKI & ROW",
    emea: "NEB / Iberia",
    apac: "APJ",
    apj: "APJ",
    neb: "NEB / Iberia",
    iberia: "NEB / Iberia",
    "uki & row": "UKI & ROW",
    "il & cee": "IL & CEE",
  }).map(([k, v]) => [normalizeKey(k), v]),
);

export function normalizeRegionLabel(raw) {
  const v = String(raw ?? "").trim();
  if (!v) return UNKNOWN_REGION;
  const alias = REGION_ALIASES.get(normalizeKey(v));
  if (alias) return alias;
  if (REGION_LABELS.includes(v)) return v;
  return v;
}

export function regionFromCountry(country) {
  const raw = String(country ?? "").trim();
  if (!raw) return UNKNOWN_REGION;

  const key = normalizeKey(raw);
  if (US_STATE_KEYS.has(key)) return "United States";
  if (CA_PROVINCE_KEYS.has(key)) return "Canada";

  return COUNTRY_TO_REGION.get(key) ?? UNKNOWN_REGION;
}

/**
 * Attach region (+ country when derived) to post-MQL journeys.
 * @param {Array<Record<string, unknown>>} journeys
 * @param {Map<string, string>} countryIndex
 */
export function enrichPostMqlJourneys(journeys, countryIndex) {
  let directCount = 0;
  let derivedCount = 0;
  let unknownCount = 0;

  for (const journey of journeys) {
    if (journey.region?.trim()) {
      journey.region = normalizeRegionLabel(journey.region);
      journey.regionSource = "direct";
      directCount += 1;
    } else {
      const country = countryForEmail(countryIndex, journey.email);
      journey.country = country ?? null;
      journey.region = regionFromCountry(country);
      journey.regionSource = "derived";
      derivedCount += 1;
    }
    if (journey.region === UNKNOWN_REGION) unknownCount += 1;
  }

  return {
    journeys,
    meta: buildRegionMeta(journeys, { directCount, derivedCount, unknownCount }),
  };
}

export function buildRegionMeta(journeys, counts = {}) {
  const byRegion = new Map();
  for (const j of journeys) {
    const label = j.region ?? UNKNOWN_REGION;
    byRegion.set(label, (byRegion.get(label) ?? 0) + 1);
  }

  const unknownSamples = journeys
    .filter((j) => j.region === UNKNOWN_REGION)
    .slice(0, 5)
    .map((j) => ({
      email: j.email,
      country: j.country ?? null,
      segment: j.mainSegment ?? null,
    }));

  const method =
    (counts.directCount ?? 0) > 0 && (counts.derivedCount ?? 0) > 0
      ? "mixed"
      : (counts.directCount ?? 0) > 0
        ? "direct"
        : "derived";

  return {
    sourceField: "country (email join from lead calendar / Chili Piper meetings)",
    method,
    mappingNote:
      method === "direct"
        ? "Region read from export column when present."
        : "Region is derived from country mapping because no native Region field exists in the source CSV aligned to HiBob sales regions.",
    countsByRegion: [...byRegion.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
    unknownCount: counts.unknownCount ?? byRegion.get(UNKNOWN_REGION) ?? 0,
    directCount: counts.directCount ?? 0,
    derivedCount: counts.derivedCount ?? 0,
    unknownSamples,
  };
}

export const REGION_FILTER_TOOLTIP_DERIVED =
  "Region is derived from country mapping because no native Region field exists in the source CSV. Use with Segment to create regional manager views.";

export const REGION_FILTER_TOOLTIP_DIRECT =
  "Filter returning MQL contacts by sales/marketing region. Use with Segment to create regional manager views.";
