import axios from "axios";
import { server_url } from "../utils/endpoint";
import { getUser } from "../utils/local_storage";

// Workshops, learning enrolments and the resource library. All programme
// scoped, matching the server, which enforces the same scoping and roles.

const BASE = () => `${server_url}/learning`;

const authHeaders = () => {
  const user = getUser();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user && user.ACCESS_TOKEN}`,
  };
};

const failure = (error, fallback) =>
  error?.response?.data || { status: false, message: fallback };

export const DELIVERY_MODES = [
  { value: "online", label: "Online" },
  { value: "physical", label: "Physical" },
  { value: "hybrid", label: "Hybrid" },
  { value: "recorded", label: "Recorded" },
];

export const ATTENDANCE_STATUSES = [
  {
    value: "present",
    label: "Present",
    className: "bg-emerald-50 text-emerald-700",
  },
  { value: "late", label: "Late", className: "bg-amber-50 text-amber-700" },
  {
    value: "partial",
    label: "Partially attended",
    className: "bg-amber-50 text-amber-700",
  },
  {
    value: "excused",
    label: "Excused",
    className: "bg-slate-100 text-slate-600",
  },
  { value: "absent", label: "Absent", className: "bg-rose-50 text-rose-700" },
];

export const attendanceMeta = (value) =>
  ATTENDANCE_STATUSES.find((item) => item.value === value) || {
    label: "Not recorded",
    className: "bg-slate-100 text-slate-500",
  };

export const ENROLLMENT_STATUSES = {
  not_started: {
    label: "Not started",
    className: "bg-slate-100 text-slate-600",
  },
  in_progress: {
    label: "In progress",
    className: "bg-[#EEF4FF] text-[#2563EB]",
  },
  completed: {
    label: "Completed",
    className: "bg-emerald-50 text-emerald-700",
  },
  overdue: { label: "Overdue", className: "bg-rose-50 text-rose-700" },
  archived: { label: "Archived", className: "bg-slate-100 text-slate-500" },
};

export const enrollmentMeta = (value) =>
  ENROLLMENT_STATUSES[value] || ENROLLMENT_STATUSES.not_started;

export const RESOURCE_TYPES = [
  { value: "template", label: "Template" },
  { value: "guide", label: "Guide" },
  { value: "case_study", label: "Case study" },
  { value: "checklist", label: "Checklist" },
  { value: "presentation", label: "Presentation" },
  { value: "video", label: "Video" },
  { value: "link", label: "Link" },
  { value: "other", label: "Other" },
];

export const resourceTypeLabel = (value) =>
  RESOURCE_TYPES.find((item) => item.value === value)?.label || "Resource";

// --- workshops -------------------------------------------------------------

// courseUuid narrows the list to one course of the programme.
export const getWorkshops = async (uuid, courseUuid) => {
  try {
    const response = await axios.get(
      `${BASE()}/programs/${encodeURIComponent(uuid)}/workshops` +
        (courseUuid ? `?course=${encodeURIComponent(courseUuid)}` : ""),
      { headers: authHeaders() },
    );
    return response.data.body;
  } catch (error) {
    console.log(error.response);
    throw error;
  }
};

export const createWorkshop = async (uuid, data) => {
  try {
    const response = await axios.post(
      `${BASE()}/programs/${encodeURIComponent(uuid)}/workshops`,
      data,
      { headers: authHeaders() },
    );
    return response.data;
  } catch (error) {
    console.log(error.response);
    return failure(error, "Failed to create the workshop");
  }
};

export const updateWorkshop = async (workshopUuid, data) => {
  try {
    const response = await axios.patch(
      `${BASE()}/workshops/${encodeURIComponent(workshopUuid)}`,
      data,
      { headers: authHeaders() },
    );
    return response.data;
  } catch (error) {
    console.log(error.response);
    return failure(error, "Failed to save the workshop");
  }
};

export const deleteWorkshop = async (workshopUuid) => {
  try {
    const response = await axios.delete(
      `${BASE()}/workshops/${encodeURIComponent(workshopUuid)}`,
      { headers: authHeaders() },
    );
    return response.data;
  } catch (error) {
    console.log(error.response);
    return failure(error, "Failed to delete the workshop");
  }
};

// --- attendance ------------------------------------------------------------

export const getAttendance = async (workshopUuid) => {
  try {
    const response = await axios.get(
      `${BASE()}/workshops/${encodeURIComponent(workshopUuid)}/attendance`,
      { headers: authHeaders() },
    );
    return response.data.body;
  } catch (error) {
    console.log(error.response);
    throw error;
  }
};

export const recordAttendance = async (workshopUuid, attendance) => {
  try {
    const response = await axios.put(
      `${BASE()}/workshops/${encodeURIComponent(workshopUuid)}/attendance`,
      { attendance },
      { headers: authHeaders() },
    );
    return response.data;
  } catch (error) {
    console.log(error.response);
    return failure(error, "Failed to save the register");
  }
};

// A learner opening the meeting link. Also records that they joined, so the
// register has a starting point without anyone typing it in.
export const joinWorkshop = async (workshopUuid) => {
  try {
    const response = await axios.post(
      `${BASE()}/workshops/${encodeURIComponent(workshopUuid)}/join`,
      {},
      { headers: authHeaders() },
    );
    return response.data;
  } catch (error) {
    console.log(error.response);
    return failure(error, "Could not join the workshop");
  }
};

// --- recordings ------------------------------------------------------------

export const addRecording = async (workshopUuid, data) => {
  try {
    const response = await axios.post(
      `${BASE()}/workshops/${encodeURIComponent(workshopUuid)}/recordings`,
      data,
      { headers: authHeaders() },
    );
    return response.data;
  } catch (error) {
    console.log(error.response);
    return failure(error, "Failed to add the recording");
  }
};

// Publishes the recording into a module, pointing at the same media rather
// than uploading it a second time.
export const publishRecording = async (recordingUuid, moduleUuid) => {
  try {
    const response = await axios.post(
      `${BASE()}/recordings/${encodeURIComponent(recordingUuid)}/publish`,
      { moduleUuid },
      { headers: authHeaders() },
    );
    return response.data;
  } catch (error) {
    console.log(error.response);
    return failure(error, "Failed to publish the recording");
  }
};

export const deleteRecording = async (recordingUuid) => {
  try {
    const response = await axios.delete(
      `${BASE()}/recordings/${encodeURIComponent(recordingUuid)}`,
      { headers: authHeaders() },
    );
    return response.data;
  } catch (error) {
    console.log(error.response);
    return failure(error, "Failed to delete the recording");
  }
};

// --- enrolments ------------------------------------------------------------

export const getEnrollments = async (uuid) => {
  try {
    const response = await axios.get(
      `${BASE()}/programs/${encodeURIComponent(uuid)}/enrollments`,
      { headers: authHeaders() },
    );
    return response.data.body;
  } catch (error) {
    console.log(error.response);
    throw error;
  }
};

export const updateEnrollment = async (enrollmentUuid, data) => {
  try {
    const response = await axios.patch(
      `${BASE()}/enrollments/${encodeURIComponent(enrollmentUuid)}`,
      data,
      { headers: authHeaders() },
    );
    return response.data;
  } catch (error) {
    console.log(error.response);
    return failure(error, "Failed to update the enrollment");
  }
};

// --- resources -------------------------------------------------------------

export const getResources = async (uuid, courseUuid) => {
  try {
    const response = await axios.get(
      `${BASE()}/programs/${encodeURIComponent(uuid)}/resources` +
        (courseUuid ? `?course=${encodeURIComponent(courseUuid)}` : ""),
      { headers: authHeaders() },
    );
    return response.data.body;
  } catch (error) {
    console.log(error.response);
    throw error;
  }
};

export const createResource = async (uuid, data) => {
  try {
    const response = await axios.post(
      `${BASE()}/programs/${encodeURIComponent(uuid)}/resources`,
      data,
      { headers: authHeaders() },
    );
    return response.data;
  } catch (error) {
    console.log(error.response);
    return failure(error, "Failed to save the resource");
  }
};

export const archiveResource = async (resourceUuid) => {
  try {
    const response = await axios.delete(
      `${BASE()}/resources/${encodeURIComponent(resourceUuid)}`,
      { headers: authHeaders() },
    );
    return response.data;
  } catch (error) {
    console.log(error.response);
    return failure(error, "Failed to remove the resource");
  }
};

// --- shared formatting -----------------------------------------------------

export const formatWhen = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatDay = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// Whether the Join button should be live: inside the window before the start
// and before the workshop has finished. Mirrors the server, which is the
// authority — this only decides whether the button looks clickable.
export const joinWindowState = (workshop) => {
  if (!workshop?.startsAt) return "closed";

  const start = new Date(workshop.startsAt).getTime();
  const opens = start - (workshop.joinWindowMinutes || 15) * 60000;
  const ends = workshop.endsAt
    ? new Date(workshop.endsAt).getTime()
    : start + 4 * 3600000;

  const now = Date.now();

  if (now < opens) return "early";
  if (now > ends) return "finished";
  return "open";
};
