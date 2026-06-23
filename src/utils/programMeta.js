// Tracker / grant programs (created and managed by the Finance Officer in
// the Grant Management area) reuse the same `programs` table as the
// learn-and-grow courses, and embed metadata markers inside the program
// description. These helpers keep that tracker metadata out of the
// learn-and-grow course experience.
const TRACKER_MARKERS = ["__TRACKER_STARTUPS__:", "__TRACKER_CATEGORIES__:"];

// A program is a tracker/grant program (not a learn-and-grow course) when
// its description carries the tracker markers.
export const isTrackerProgram = (program) => {
  const text = String(program?.description || "");
  return TRACKER_MARKERS.some((marker) => text.includes(marker));
};

// Strip the tracker metadata markers from a description so only the
// human-written text remains.
export const cleanProgramDescription = (description) => {
  let text = String(description || "");
  const markerIndexes = TRACKER_MARKERS.map((marker) =>
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
