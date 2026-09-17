// A mentor's list answers — areas of expertise, industries, support types,
// mentoring format — are stored in JSON columns, and come back in several
// shapes:
//
//   ["Finance", "Marketing"]          a plain list
//   {0: "Finance", 1: "Marketing"}    an index-keyed map, written by the older
//                                     profile editor
//   '{"0": "Finance"}'                either of those as JSON text, which is
//                                     how the database returns a JSON column
//   "Finance, Marketing"              comma-separated text, from accounts
//                                     created before signup was fixed
//
// Normalise all of them to a list of strings. Reading a map with
// Object.values() enumerates a string one character at a time, and printing
// JSON text directly shows the braces and quotes to the reader, so both have
// to be handled here rather than at each place that displays them.
const fromObject = (value) => Object.values(value).map(String).filter(Boolean);

export const expertiseList = (value) => {
  if (!value) return [];

  if (Array.isArray(value)) return value.map(String).filter(Boolean);

  if (typeof value === "object") return fromObject(value);

  if (typeof value === "string") {
    const text = value.trim();
    if (!text) return [];

    if (text.startsWith("{") || text.startsWith("[")) {
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
        if (parsed && typeof parsed === "object") return fromObject(parsed);
      } catch {
        // Not valid JSON after all — fall through to comma-separated text.
      }
    }

    return text
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
  }

  return [];
};
