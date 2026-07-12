// Grant/tracker programs embed their per-startup metadata (selected startups,
// grants, assigned BDAs) and categories inside the program description using
// markers. These helpers read and write that metadata. Shared by the program
// details list and the per-startup detail page so both stay in sync.
export const TRACKER_CATEGORIES_MARKER = "__TRACKER_CATEGORIES__:";
export const TRACKER_STARTUPS_MARKER = "__TRACKER_STARTUPS__:";

export const parseMarkerJson = (text, marker) => {
  const raw = String(text || "");
  const idx = raw.lastIndexOf(marker);
  if (idx === -1) return [];
  const line = raw.slice(idx + marker.length).split("\n")[0].trim();
  try {
    const value = JSON.parse(line);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

export const buildDescriptionWithMeta = (description, categories, startups) => {
  const clean = String(description || "").trim();
  const safeCats = Array.from(
    new Set((categories || []).map((c) => String(c || "").trim()).filter(Boolean)),
  );
  const safeStartups = Array.isArray(startups) ? startups.filter(Boolean) : [];
  return (
    `${clean}\n\n` +
    `${TRACKER_STARTUPS_MARKER}${JSON.stringify(safeStartups)}\n` +
    `${TRACKER_CATEGORIES_MARKER}${JSON.stringify(safeCats)}`
  );
};

export const parseTrackerProgramMeta = (program) => {
  const rawDescription = String(program?.description || "");
  const indices = [
    rawDescription.indexOf(TRACKER_CATEGORIES_MARKER),
    rawDescription.indexOf(TRACKER_STARTUPS_MARKER),
  ].filter((i) => i >= 0);
  const firstMarker = indices.length ? Math.min(...indices) : -1;
  const cleanDescription =
    firstMarker === -1 ? rawDescription : rawDescription.slice(0, firstMarker).trim();

  return {
    cleanDescription,
    categories: Array.from(
      new Set(
        [...parseMarkerJson(rawDescription, TRACKER_CATEGORIES_MARKER), program?.programCategory]
          .map((item) => String(item || "").trim())
          .filter(Boolean),
      ),
    ),
    startups: parseMarkerJson(rawDescription, TRACKER_STARTUPS_MARKER),
  };
};