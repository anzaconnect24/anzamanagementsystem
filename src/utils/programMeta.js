// Tracker / grant programs (created and managed by the Finance Officer in
// the Grant Management area) reuse the same `programs` table as the
// learn-and-grow courses, and embed metadata markers inside the program
// description. These helpers keep that tracker metadata out of the
// learn-and-grow course experience.
const TRACKER_MARKERS = ["__TRACKER_STARTUPS__:", "__TRACKER_CATEGORIES__:"];

// Markers from a removed course-access feature. They are only cleaned out of
// descriptions (never used to classify a program) so any rows that still carry
// them don't show the raw marker in the course text.
const LEGACY_MARKERS = ["__COURSE_CATEGORIES__:", "__COURSE_PROGRAMS__:"];

// Every marker that should be stripped from the human-readable description.
const CLEAN_MARKERS = [...TRACKER_MARKERS, ...LEGACY_MARKERS];

// A program is a tracker/grant program (not a learn-and-grow course) when it
// is explicitly typed "grant" (authoritative), or — for legacy rows created
// before the `type` column existed — when its description carries the tracker
// markers.
export const isTrackerProgram = (program) => {
  if (String(program?.type || "").toLowerCase() === "grant") return true;
  const text = String(program?.description || "");
  return TRACKER_MARKERS.some((marker) => text.includes(marker));
};

// Strip the metadata markers from a description so only the human-written text
// remains.
export const cleanProgramDescription = (description) => {
  let text = String(description || "");
  const markerIndexes = CLEAN_MARKERS.map((marker) =>
    text.indexOf(marker),
  ).filter((index) => index !== -1);

  if (markerIndexes.length > 0) {
    text = text.slice(0, Math.min(...markerIndexes));
  }

  return text.trim();
};

// Keep only genuine learn-and-grow courses (drop tracker/grant programs)
// and clean their descriptions.
export const onlyCourses = (programs = []) =>
  (Array.isArray(programs) ? programs : [])
    .filter((program) => !isTrackerProgram(program))
    .map((program) => ({
      ...program,
      description: cleanProgramDescription(program.description),
    }));
