// A mentor's areas of expertise are stored as an index-keyed map — the profile
// editor writes {0: "Finance", 1: "Marketing"}. Accounts created before signup
// was fixed hold a plain comma-separated string instead, and reading those with
// Object.values() enumerates them one character at a time. Normalise both (and
// a plain array) to a list of strings.
export const expertiseList = (value) => {
  if (!value) return [];

  if (typeof value === "string") {
    return value
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
  }

  if (Array.isArray(value)) return value.map(String).filter(Boolean);

  return Object.values(value).map(String).filter(Boolean);
};
