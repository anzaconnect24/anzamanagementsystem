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
