// Tracker / grant programs (created and managed by the Finance Officer in
// the Grant Management area) reuse the same `programs` table as the
// learn-and-grow courses, and embed metadata markers inside the program
// description. These helpers keep that tracker metadata out of the
// learn-and-grow course experience.
const TRACKER_MARKERS = ["__TRACKER_STARTUPS__:", "__TRACKER_CATEGORIES__:"];

// Mentorship programs are set up by a BDA on the Mentorship Tracker. They use
// the same table and markers as grant programs, but they are the BDA's own —
// Grant Management does not list them and their startups do not roll into the
// finance officer's grant figures.
const MENTORSHIP_MARKER = "__TRACKER_BDAS__:";

// Records which platform program a grant program was set up against, so the
// startup picker can be re-scoped when it is edited.
const COHORT_LINK_MARKER = "__TRACKER_COHORT__:";

// Markers from a removed course-access feature. They are only cleaned out of
// descriptions (never used to classify a program) so any rows that still carry
// them don't show the raw marker in the course text.
const LEGACY_MARKERS = ["__COURSE_CATEGORIES__:", "__COURSE_PROGRAMS__:"];

// Every marker that should be stripped from the human-readable description.
const CLEAN_MARKERS = [
  ...TRACKER_MARKERS,
  MENTORSHIP_MARKER,
  COHORT_LINK_MARKER,
  ...LEGACY_MARKERS,
];

// A program is a tracker/grant program (not a learn-and-grow course) when it
// is explicitly typed "grant" (authoritative), or — for legacy rows created
// before the `type` column existed — when its description carries the tracker
// markers.
export const isTrackerProgram = (program) => {
  const type = String(program?.type || "").toLowerCase();
  if (type === "grant" || type === "mentorship") return true;
  const text = String(program?.description || "");
  return (
    text.includes(MENTORSHIP_MARKER) ||
    TRACKER_MARKERS.some((marker) => text.includes(marker))
  );
};

// Startup cohorts moved to their own cohort_programs table and no longer live
// here. This stays only so that any row left typed "cohort" in an unmigrated
// environment is still kept out of the Class Rooms listing.
export const COHORT_PROGRAM_TYPE = "cohort";

export const isCohortProgram = (program) =>
  String(program?.type || "").toLowerCase() === COHORT_PROGRAM_TYPE;

// A BDA's own mentorship program — typed "mentorship", or carrying the BDA
// marker for backends that do not store the type.
export const isMentorshipProgram = (program) => {
  if (String(program?.type || "").toLowerCase() === "mentorship") return true;
  return String(program?.description || "").includes(MENTORSHIP_MARKER);
};

// A finance-officer grant program: a tracker program that is not one of the
// BDAs' mentorship programs. Grant Management lists these and only these.
export const isGrantProgram = (program) =>
  isTrackerProgram(program) && !isMentorshipProgram(program);

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
    .filter((program) => !isTrackerProgram(program) && !isCohortProgram(program))
    .map((program) => ({
      ...program,
      description: cleanProgramDescription(program.description),
    }));
