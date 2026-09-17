// Investor profile lists - investment types, investment focus - live in a JSON
// column that reaches the browser as text, e.g. '{"0": "equity", "1": "grants"}'.
// Treating that text as an object spreads it into single characters. These
// read it (or an array, an object, or plain comma-separated text) into a clean
// list with duplicates removed.

export const profileList = (value) => {
  let data = value;

  // Parse at most twice: some rows were stored as JSON inside a JSON string.
  for (let attempt = 0; attempt < 2 && typeof data === "string"; attempt += 1) {
    const text = data.trim();
    if (!text) return [];
    try {
      data = JSON.parse(text);
    } catch {
      data = text.split(",");
    }
  }

  if (typeof data === "string") data = [data];
  const items = Array.isArray(data) ? data : data && typeof data === "object" ? Object.values(data) : [];

  const seen = new Set();
  const list = [];
  for (const item of items) {
    const text = String(item ?? "").trim();
    const key = text.toLowerCase();
    if (text && !seen.has(key)) {
      seen.add(key);
      list.push(text);
    }
  }
  return list;
};

const titleCase = (text) => text.replace(/\b\w/g, (letter) => letter.toUpperCase());

// For display: "Equity, Convertible Notes", or the fallback when empty.
export const profileListText = (value, fallback = "") =>
  profileList(value).map(titleCase).join(", ") || fallback;
