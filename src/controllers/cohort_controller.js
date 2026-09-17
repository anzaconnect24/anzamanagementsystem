import axios from "axios";
import { server_url } from "../utils/endpoint";
import { headers } from "../utils/headers";

// "Startups by program". Backed by its own tables (cohort_programs,
// cohort_memberships) and its own /cohort-programs endpoints — independent of
// the shared /programs resource used by Class Rooms, Grant Management and the
// Mentorship Tracker.

const BASE = () => `${server_url}/cohort-programs`;

// Stands in for a programme uuid to mean "startups not in any programme".
export const UNASSIGNED_PROGRAM_KEY = "unassigned";

// Options for the "which program are you in?" dropdowns on sign-up and Edit
// Profile. Public on purpose — sign-up runs before an account exists.
export const getCohortProgramOptions = async () => {
  try {
    const response = await axios.get(`${BASE()}/public`);
    return Array.isArray(response.data.body) ? response.data.body : [];
  } catch (error) {
    console.log(error.response);
    return [];
  }
};

// Who runs a programme, plus everyone eligible to be added, so the picker
// needs one call. Business Development Advisors are the role that leads a
// programme; the API also allows Admin, Mentor and Finance.
export const getCohortLeads = async (uuid) => {
  try {
    const response = await axios.get(
      `${BASE()}/${encodeURIComponent(uuid)}/leads`,
      { headers },
    );
    return response.data.body;
  } catch (error) {
    console.log(error.response);
    throw error;
  }
};

// Replaces a programme’s leads with exactly these users. Admin only.
export const setCohortLeads = async (uuid, userUuids) => {
  try {
    const response = await axios.put(
      `${BASE()}/${encodeURIComponent(uuid)}/leads`,
      { userUuids },
      { headers },
    );
    return response.data;
  } catch (error) {
    console.log(error.response);
    return (
      error?.response?.data || {
        status: false,
        message: "Failed to save the program leads",
      }
    );
  }
};

// The programme workplan: outputs, their activities, and the month/week
// columns the timeline grid is drawn from. The columns are computed by the
// API so the screen and any later export agree on what a week is.
export const getProgramWorkplan = async (uuid) => {
  try {
    const response = await axios.get(
      `${BASE()}/${encodeURIComponent(uuid)}/workplan`,
      { headers },
    );
    return response.data.body;
  } catch (error) {
    console.log(error.response);
    throw error;
  }
};

// Saves the plan whole - rows reorder and move between outputs, so a partial
// save would be meaningless.
export const saveProgramWorkplan = async (uuid, outputs) => {
  try {
    const response = await axios.put(
      `${BASE()}/${encodeURIComponent(uuid)}/workplan`,
      { outputs },
      { headers },
    );
    return response.data;
  } catch (error) {
    console.log(error.response);
    return (
      error?.response?.data || {
        status: false,
        message: "Failed to save the workplan",
      }
    );
  }
};

// Who on this programme receives a grant. Every enrolled startup comes back
// as a candidate, with the ones already selected marked and their committed
// figure alongside. Disbursement is read-only here - that is the Finance
// Officer’s step.
export const getGrantRecipients = async (uuid) => {
  try {
    const response = await axios.get(
      `${BASE()}/${encodeURIComponent(uuid)}/grant-recipients`,
      { headers },
    );
    return response.data.body;
  } catch (error) {
    console.log(error.response);
    throw error;
  }
};

// Replaces the roster with exactly these startups. The Program Lead decides.
export const setGrantRecipients = async (uuid, recipients) => {
  try {
    const response = await axios.put(
      `${BASE()}/${encodeURIComponent(uuid)}/grant-recipients`,
      { recipients },
      { headers },
    );
    return response.data;
  } catch (error) {
    console.log(error.response);
    return (
      error?.response?.data || {
        status: false,
        message: "Failed to save the grant recipients",
      }
    );
  }
};

// The programme dashboard: cohort progress, delivery, finance, approvals and
// risks, with a traffic light over each and the thresholds that produced it.
// A measure with nothing behind it yet comes back null, not zero.
export const getProgramOverview = async (uuid) => {
  try {
    const response = await axios.get(
      `${BASE()}/${encodeURIComponent(uuid)}/overview`,
      { headers },
    );
    return response.data.body;
  } catch (error) {
    console.log(error.response);
    throw error;
  }
};

// What a report over this period would say, computed without being saved.
export const composeProgramReport = async (uuid, params = {}) => {
  try {
    const response = await axios.get(
      `${BASE()}/${encodeURIComponent(uuid)}/reports/compose`,
      { headers, params },
    );
    return response.data.body;
  } catch (error) {
    console.log(error.response);
    throw error;
  }
};

// The list, or one report in full when recordUuid is given.
export const getProgramReports = async (uuid, recordUuid) => {
  try {
    const path = recordUuid
      ? `${BASE()}/${encodeURIComponent(uuid)}/reports/${encodeURIComponent(recordUuid)}`
      : `${BASE()}/${encodeURIComponent(uuid)}/reports`;

    const response = await axios.get(path, { headers });
    return response.data.body;
  } catch (error) {
    console.log(error.response);
    throw error;
  }
};

// Creates a report with its figures frozen, or edits a draft. Pass
// { refresh: true } to re-base a draft on today’s figures.
export const saveProgramReport = async (uuid, data, recordUuid) => {
  try {
    const path = recordUuid
      ? `${BASE()}/${encodeURIComponent(uuid)}/reports/${encodeURIComponent(recordUuid)}`
      : `${BASE()}/${encodeURIComponent(uuid)}/reports`;

    const response = recordUuid
      ? await axios.patch(path, data, { headers })
      : await axios.post(path, data, { headers });

    return response.data;
  } catch (error) {
    console.log(error.response);
    return (
      error?.response?.data || {
        status: false,
        message: "Failed to save the report",
      }
    );
  }
};

// What the programme has sent its cohort, with the vocabularies the compose
// form needs and whether this caller may send at all.
export const getProgramAnnouncements = async (uuid) => {
  try {
    const response = await axios.get(
      `${BASE()}/${encodeURIComponent(uuid)}/announcements`,
      { headers },
    );
    return response.data.body;
  } catch (error) {
    console.log(error.response);
    throw error;
  }
};

export const sendProgramAnnouncement = async (uuid, data) => {
  try {
    const response = await axios.post(
      `${BASE()}/${encodeURIComponent(uuid)}/announcements`,
      data,
      { headers },
    );
    return response.data;
  } catch (error) {
    console.log(error.response);
    return (
      error?.response?.data || { status: false, message: "Failed to send" }
    );
  }
};

// What needs the team’s attention: overdue activities, reports awaiting
// review, participants falling behind, and open or escalated risks.
export const getProgramAlerts = async (uuid) => {
  try {
    const response = await axios.get(
      `${BASE()}/${encodeURIComponent(uuid)}/alerts`,
      { headers },
    );
    return response.data.body;
  } catch (error) {
    console.log(error.response);
    throw error;
  }
};

// Tell the programme’s staff about the current alerts. Deliberate, so the
// team is notified when the lead decides rather than on every page load.
export const raiseProgramAlerts = async (uuid) => {
  try {
    const response = await axios.post(
      `${BASE()}/${encodeURIComponent(uuid)}/alerts/raise`,
      {},
      { headers },
    );
    return response.data;
  } catch (error) {
    console.log(error.response);
    return (
      error?.response?.data || { status: false, message: "Failed to raise" }
    );
  }
};

// The programme document library. Each document carries its tags and its
// version history, with the authoritative file called out as "current".
export const getProgramDocuments = async (uuid, params = {}) => {
  try {
    const response = await axios.get(
      `${BASE()}/${encodeURIComponent(uuid)}/documents`,
      { headers, params },
    );
    return response.data.body;
  } catch (error) {
    console.log(error.response);
    throw error;
  }
};

// Files a document, or another version of one when recordUuid is given.
// Multipart, so the auth header is set without the JSON content type.
export const uploadProgramDocument = async (uuid, form, recordUuid) => {
  try {
    const path = recordUuid
      ? `${BASE()}/${encodeURIComponent(uuid)}/documents/${encodeURIComponent(recordUuid)}/versions`
      : `${BASE()}/${encodeURIComponent(uuid)}/documents`;

    const response = await axios.post(path, form, {
      headers: { Authorization: headers.Authorization },
    });
    return response.data;
  } catch (error) {
    console.log(error.response);
    return (
      error?.response?.data || {
        status: false,
        message: "Failed to file the document",
      }
    );
  }
};

// Retag or rename a filed document — including moving it between folders.
// The files themselves are untouched; this is the label, not the contents.
export const updateProgramDocument = async (uuid, recordUuid, body) => {
  try {
    const response = await axios.patch(
      `${BASE()}/${encodeURIComponent(uuid)}/documents/${encodeURIComponent(recordUuid)}`,
      body,
      { headers },
    );
    return response.data;
  } catch (error) {
    console.log(error.response);
    return (
      error?.response?.data || {
        status: false,
        message: "Failed to update the document",
      }
    );
  }
};

// Folders within the library. They are read back with the documents, so there
// is no getter here. Without a folderUuid this creates one; with it, renames
// or recolours that folder.
export const saveProgramDocumentFolder = async (uuid, body, folderUuid) => {
  try {
    const path = `${BASE()}/${encodeURIComponent(uuid)}/document-folders`;

    const response = folderUuid
      ? await axios.patch(
          `${path}/${encodeURIComponent(folderUuid)}`,
          body,
          { headers },
        )
      : await axios.post(path, body, { headers });

    return response.data;
  } catch (error) {
    console.log(error.response);
    return (
      error?.response?.data || {
        status: false,
        message: "Failed to save the folder",
      }
    );
  }
};

// Removes the folder, never its documents: they return to Unfiled.
export const deleteProgramDocumentFolder = async (uuid, folderUuid) => {
  try {
    const response = await axios.delete(
      `${BASE()}/${encodeURIComponent(uuid)}/document-folders/${encodeURIComponent(folderUuid)}`,
      { headers },
    );
    return response.data;
  } catch (error) {
    console.log(error.response);
    return (
      error?.response?.data || {
        status: false,
        message: "Failed to remove the folder",
      }
    );
  }
};

export const archiveProgramDocument = async (uuid, recordUuid) => {
  try {
    const response = await axios.delete(
      `${BASE()}/${encodeURIComponent(uuid)}/documents/${encodeURIComponent(recordUuid)}`,
      { headers },
    );
    return response.data;
  } catch (error) {
    console.log(error.response);
    return (
      error?.response?.data || {
        status: false,
        message: "Failed to archive the document",
      }
    );
  }
};

// Who coaches whom on a programme: the assigned mentor and advisor, the
// agreed support areas, the next session, and each visit with its notes and
// action items. Private notes on a confidential session arrive as null with
// notesWithheld set, so the page can say so rather than show a blank.
export const getCohortCoaching = async (uuid) => {
  try {
    const response = await axios.get(
      `${BASE()}/${encodeURIComponent(uuid)}/coaching`,
      { headers },
    );
    return response.data.body;
  } catch (error) {
    console.log(error.response);
    throw error;
  }
};

// Assign the coach and advisor and record the agreed support areas. The
// programme lead decides this, not the coach.
export const setCohortCoaching = async (uuid, businessUuid, data) => {
  try {
    const response = await axios.patch(
      `${BASE()}/${encodeURIComponent(uuid)}/coaching/${encodeURIComponent(businessUuid)}`,
      data,
      { headers },
    );
    return response.data;
  } catch (error) {
    console.log(error.response);
    return (
      error?.response?.data || {
        status: false,
        message: "Failed to save the coaching assignment",
      }
    );
  }
};

// The Program Calendar: every dated piece of work, plus the
// type and status vocabularies, the people who can own an entry, and the
// headline figures. One call so the page needs no second round trip.
export const getCohortCalendar = async (uuid, params = {}) => {
  try {
    const response = await axios.get(
      `${BASE()}/${encodeURIComponent(uuid)}/calendar`,
      { headers, params },
    );
    return response.data.body;
  } catch (error) {
    console.log(error.response);
    throw error;
  }
};

// Creates when recordUuid is absent, edits when it is given.
export const saveCohortCalendarEntry = async (uuid, data, recordUuid) => {
  try {
    const path = recordUuid
      ? `${BASE()}/${encodeURIComponent(uuid)}/calendar/${encodeURIComponent(recordUuid)}`
      : `${BASE()}/${encodeURIComponent(uuid)}/calendar`;

    const response = recordUuid
      ? await axios.patch(path, data, { headers })
      : await axios.post(path, data, { headers });

    return response.data;
  } catch (error) {
    console.log(error.response);
    return (
      error?.response?.data || {
        status: false,
        message: "Failed to save the calendar entry",
      }
    );
  }
};

export const deleteCohortCalendarEntry = async (uuid, recordUuid) => {
  try {
    const response = await axios.delete(
      `${BASE()}/${encodeURIComponent(uuid)}/calendar/${encodeURIComponent(recordUuid)}`,
      { headers },
    );
    return response.data;
  } catch (error) {
    console.log(error.response);
    return (
      error?.response?.data || {
        status: false,
        message: "Failed to remove the calendar entry",
      }
    );
  }
};

export const getMyCohortPrograms = async () => {
  try {
    const response = await axios.get(`${BASE()}/mine`, { headers });
    return response.data.body || { business: null, data: [], count: 0 };
  } catch (error) {
    console.log(error.response);
    return { business: null, data: [], count: 0 };
  }
};

// The programme grid, with roster counts and the unassigned tally.
export const getCohortPrograms = async () => {
  try {
    const response = await axios.get(BASE(), { headers });
    const body = response.data.body;
    return {
      programs: Array.isArray(body?.data) ? body.data : [],
      unassignedCount: body?.unassignedCount || 0,
    };
  } catch (error) {
    console.log(error.response);
    return { programs: [], unassignedCount: 0 };
  }
};

const failure = (error, fallback) =>
  error?.response?.data || { status: false, message: fallback };

export const createCohortProgram = async (data) => {
  try {
    const response = await axios.post(BASE(), data, { headers });
    return response.data;
  } catch (error) {
    console.log(error.response);
    return failure(error, "Failed to create program");
  }
};

export const updateCohortProgram = async (uuid, data) => {
  try {
    const response = await axios.patch(
      `${BASE()}/${encodeURIComponent(uuid)}`,
      data,
      { headers },
    );
    return response.data;
  } catch (error) {
    console.log(error.response);
    return failure(error, "Failed to save program details");
  }
};

export const deleteCohortProgram = async (uuid) => {
  try {
    const response = await axios.delete(
      `${BASE()}/${encodeURIComponent(uuid)}`,
      {
        headers,
      },
    );
    return response.data;
  } catch (error) {
    console.log(error.response);
    return failure(error, "Failed to delete program");
  }
};

// Startups in one programme. Pass UNASSIGNED_PROGRAM_KEY for those in none.
export const getCohortStartups = async (uuid, keyword = "") => {
  try {
    const search = keyword ? `?keyword=${encodeURIComponent(keyword)}` : "";
    const response = await axios.get(
      `${BASE()}/${encodeURIComponent(uuid)}/startups${search}`,
      { headers },
    );
    return response.data.body;
  } catch (error) {
    console.log(error.response);
    throw error;
  }
};

// Replace a programme's roster with exactly `businessUuids`. Startups left out
// are released to "Unassigned"; they are never deleted.
export const setCohortStartups = async (uuid, businessUuids) => {
  try {
    const response = await axios.put(
      `${BASE()}/${encodeURIComponent(uuid)}/startups`,
      { businessUuids },
      { headers },
    );
    return response.data;
  } catch (error) {
    console.log(error.response);
    return failure(error, "Failed to update the program roster");
  }
};

// Where a startup stands within its programme.
export const MEMBERSHIP_STATUSES = [
  { value: "active", label: "Active" },
  { value: "dropped_out", label: "Dropout" },
];

export const statusLabel = (value) =>
  MEMBERSHIP_STATUSES.find((item) => item.value === value)?.label || "Active";

// Roster split and overall progress for one programme.
export const getCohortDashboard = async (uuid) => {
  try {
    const response = await axios.get(
      `${BASE()}/${encodeURIComponent(uuid)}/dashboard`,
      { headers },
    );
    return response.data.body;
  } catch (error) {
    console.log(error.response);
    throw error;
  }
};

export const setStartupStatus = async (uuid, businessUuid, status) => {
  try {
    const response = await axios.patch(
      `${BASE()}/${encodeURIComponent(uuid)}/startups/${encodeURIComponent(
        businessUuid,
      )}/status`,
      { status },
      { headers },
    );
    return response.data;
  } catch (error) {
    console.log(error.response);
    return failure(error, "Failed to update the startup's status");
  }
};

// Whether a startup is up to date with its reporting on this programme.
export const REPORTING_STATUSES = [
  { value: "up_to_date", label: "Up to date" },
  { value: "pending", label: "Pending" },
  { value: "overdue", label: "Overdue" },
];

export const reportingLabel = (value) =>
  REPORTING_STATUSES.find((item) => item.value === value)?.label || "Pending";

export const setReportingStatus = async (
  uuid,
  businessUuid,
  reportingStatus,
) => {
  try {
    const response = await axios.patch(
      `${BASE()}/${encodeURIComponent(uuid)}/startups/${encodeURIComponent(
        businessUuid,
      )}/reporting-status`,
      { reportingStatus },
      { headers },
    );
    return response.data;
  } catch (error) {
    console.log(error.response);
    return failure(error, "Failed to update the reporting status");
  }
};

// The modules a programme runs. Modules are created and deleted through the
// modules resource; this only lists the ones belonging to a programme.
export const getCohortModules = async (uuid) => {
  try {
    const response = await axios.get(
      `${BASE()}/${encodeURIComponent(uuid)}/modules`,
      { headers },
    );
    return response.data.body;
  } catch (error) {
    console.log(error.response);
    throw error;
  }
};

// Coaching sessions run under a programme.
export const getCohortSessions = async (uuid) => {
  try {
    const response = await axios.get(
      `${BASE()}/${encodeURIComponent(uuid)}/sessions`,
      { headers },
    );
    return response.data.body;
  } catch (error) {
    console.log(error.response);
    throw error;
  }
};

export const createCohortSession = async (uuid, data) => {
  try {
    const response = await axios.post(
      `${BASE()}/${encodeURIComponent(uuid)}/sessions`,
      data,
      { headers },
    );
    return response.data;
  } catch (error) {
    console.log(error.response);
    return failure(error, "Failed to set up the coaching session");
  }
};

export const deleteCohortSession = async (uuid, sessionUuid) => {
  try {
    const response = await axios.delete(
      `${BASE()}/${encodeURIComponent(uuid)}/sessions/${encodeURIComponent(
        sessionUuid,
      )}`,
      { headers },
    );
    return response.data;
  } catch (error) {
    console.log(error.response);
    return failure(error, "Failed to delete the session");
  }
};

// Every cohort a startup belongs to, given a Business payload from the API.
// Membership is its own table, so it arrives nested — as an array, since a
// startup can be on several programmes at once.
//
// CohortMembership (singular) is still read as a fallback: older responses,
// and anything cached from before the association became hasMany, carry the
// single-object shape.
export const cohortsOf = (business) => {
  const memberships =
    business?.CohortMemberships ||
    (business?.CohortMembership ? [business.CohortMembership] : []);

  // Most recently joined first. The API does not order the nested rows, so
  // without this the "one cohort" callers below would show whichever the
  // database happened to return first, and it could change between requests.
  return [...memberships]
    .sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0))
    .map((row) => row?.CohortProgram)
    .filter(Boolean);
};

// The cohort to show where only one fits — the most recently joined, matching
// what the API resolves "mine" to.
export const cohortOf = (business) => cohortsOf(business)[0] || null;

// Programme analytics: summary figures plus a row per course.
export const getCohortAnalytics = async (uuid) => {
  try {
    const response = await axios.get(
      `${BASE()}/${encodeURIComponent(uuid)}/analytics`,
      { headers },
    );
    return response.data.body;
  } catch (error) {
    console.log(error.response);
    throw error;
  }
};
