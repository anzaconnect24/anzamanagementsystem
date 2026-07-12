// Shared category matching for the General Resources section.
//
// Documents in the database have been tagged inconsistently over time
// ("Finance & Fundraising", "Finance and Fundraising", "Finance", "Fundraising",
// HTML-escaped "&amp;", different casing/spacing, etc.). To keep the six
// canonical category cards populated regardless of how a document was tagged,
// we resolve any raw category string to one canonical key using tolerant
// normalization first, then distinctive keyword matching.

export const RESOURCE_CATEGORY_KEYS = [
  "Finance & Fundraising",
  "Marketing & Sales",
  "Technology & Innovation",
  "Leadership & Personal Development",
  "Impact & Sustainability",
  "Legal & Compliance",
];

// Distinctive keywords (already normalized: lowercase, "&" -> "and") that map a
// raw category onto a canonical key.
const CATEGORY_KEYWORDS = {
  "Finance & Fundraising": ["financ", "fundrais", "fund rais", "capital"],
  "Marketing & Sales": ["market", "sales", "branding"],
  "Technology & Innovation": ["technolog", "innovat", "digital"],
  "Leadership & Personal Development": [
    "leadership",
    "personal develop",
    "leader",
  ],
  "Impact & Sustainability": ["impact", "sustainab", "esg"],
  "Legal & Compliance": ["legal", "complian", "governance", "regulator"],
};

export const normalizeCategory = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/&amp;/g, "and")
    .replace(/&/g, "and")
    .replace(/\s+/g, " ")
    .trim();

// Resolve a raw category string to one of the canonical keys, or return null if
// it doesn't match any known category.
export const resolveResourceCategory = (raw) => {
  const norm = normalizeCategory(raw);
  if (!norm) return null;

  // 1) exact (normalized) match against a canonical key
  const exact = RESOURCE_CATEGORY_KEYS.find(
    (key) => normalizeCategory(key) === norm,
  );
  if (exact) return exact;

  // 2) distinctive keyword match
  const byKeyword = RESOURCE_CATEGORY_KEYS.find((key) =>
    (CATEGORY_KEYWORDS[key] || []).some((kw) => norm.includes(kw)),
  );
  return byKeyword || null;
};