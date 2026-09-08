import axios from "axios";
import { server_url } from "../utils/endpoint";
import { headers } from "../utils/headers";

// Monitoring & Evaluation. Every call is scoped to one programme, matching the
// server, which enforces the same scoping and the role rules behind it.

const BASE = () => `${server_url}/me`;

const failure = (error, fallback) =>
  error?.response?.data || { status: false, message: fallback };

// Indicator status as the calculation engine reports it, with the colours the
// spec asks for: green on track, amber attention, red behind, grey not due.
export const STATUS_META = {
  on_track: {
    label: "On Track",
    className: "bg-emerald-50 text-emerald-700",
    bar: "bg-emerald-500",
  },
  attention: {
    label: "Attention",
    className: "bg-amber-50 text-amber-700",
    bar: "bg-amber-500",
  },
  behind: {
    label: "Behind",
    className: "bg-rose-50 text-rose-700",
    bar: "bg-rose-500",
  },
  not_due: {
    label: "Not Yet Due",
    className: "bg-slate-100 text-slate-600",
    bar: "bg-slate-300",
  },
};

export const statusMeta = (status) =>
  STATUS_META[status] || STATUS_META.not_due;

// Where a figure came from, so an unverified number is never shown as though
// it were an official result.
export const BASIS_META = {
  automatic: {
    label: "Calculated",
    hint: "Computed from platform records, so it is always current.",
  },
  verified: {
    label: "Verified",
    hint: "Reported and confirmed against evidence.",
  },
  self_reported: {
    label: "Self-reported",
    hint: "Reported but not yet verified. Included because this program allows self-reported data.",
  },
  unverified_excluded: {
    label: "Awaiting verification",
    hint: "A figure was reported but is not counted until it is verified.",
  },
  none: { label: "No data", hint: "Nothing has been reported yet." },
};

export const basisMeta = (basis) => BASIS_META[basis] || BASIS_META.none;

export const getMeOverview = async (uuid) => {
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

export const getMeFramework = async (uuid) => {
  try {
    const response = await axios.get(
      `${BASE()}/${encodeURIComponent(uuid)}/framework`,
      { headers },
    );
    return response.data.body;
  } catch (error) {
    console.log(error.response);
    throw error;
  }
};

export const updateMeFramework = async (uuid, data) => {
  try {
    const response = await axios.patch(
      `${BASE()}/${encodeURIComponent(uuid)}/framework`,
      data,
      { headers },
    );
    return response.data;
  } catch (error) {
    console.log(error.response);
    return failure(error, "Failed to save the framework");
  }
};

export const createMeResult = async (uuid, data) => {
  try {
    const response = await axios.post(
      `${BASE()}/${encodeURIComponent(uuid)}/results`,
      data,
      { headers },
    );
    return response.data;
  } catch (error) {
    console.log(error.response);
    return failure(error, "Failed to save");
  }
};

export const updateMeResult = async (uuid, resultUuid, data) => {
  try {
    const response = await axios.patch(
      `${BASE()}/${encodeURIComponent(uuid)}/results/${encodeURIComponent(
        resultUuid,
      )}`,
      data,
      { headers },
    );
    return response.data;
  } catch (error) {
    console.log(error.response);
    return failure(error, "Failed to save");
  }
};

// Archives rather than deletes: the framework has to stay readable for audit.
export const archiveMeResult = async (uuid, resultUuid) => {
  try {
    const response = await axios.delete(
      `${BASE()}/${encodeURIComponent(uuid)}/results/${encodeURIComponent(
        resultUuid,
      )}`,
      { headers },
    );
    return response.data;
  } catch (error) {
    console.log(error.response);
    return failure(error, "Failed to archive");
  }
};

export const getMeCatalogue = async () => {
  try {
    const response = await axios.get(`${BASE()}/catalogue`, { headers });
    return response.data.body;
  } catch (error) {
    console.log(error.response);
    return null;
  }
};

export const getMeIndicators = async (uuid) => {
  try {
    const response = await axios.get(
      `${BASE()}/${encodeURIComponent(uuid)}/indicators`,
      { headers },
    );
    return response.data.body;
  } catch (error) {
    console.log(error.response);
    throw error;
  }
};

export const createMeIndicator = async (uuid, data) => {
  try {
    const response = await axios.post(
      `${BASE()}/${encodeURIComponent(uuid)}/indicators`,
      data,
      { headers },
    );
    return response.data;
  } catch (error) {
    console.log(error.response);
    return failure(error, "Failed to save the indicator");
  }
};

export const updateMeIndicator = async (uuid, indicatorUuid, data) => {
  try {
    const response = await axios.patch(
      `${BASE()}/${encodeURIComponent(uuid)}/indicators/${encodeURIComponent(
        indicatorUuid,
      )}`,
      data,
      { headers },
    );
    return response.data;
  } catch (error) {
    console.log(error.response);
    return failure(error, "Failed to save the indicator");
  }
};

export const archiveMeIndicator = async (uuid, indicatorUuid) => {
  try {
    const response = await axios.delete(
      `${BASE()}/${encodeURIComponent(uuid)}/indicators/${encodeURIComponent(
        indicatorUuid,
      )}`,
      { headers },
    );
    return response.data;
  } catch (error) {
    console.log(error.response);
    return failure(error, "Failed to archive the indicator");
  }
};

export const submitMeIndicatorValue = async (uuid, indicatorUuid, data) => {
  try {
    const response = await axios.post(
      `${BASE()}/${encodeURIComponent(uuid)}/indicators/${encodeURIComponent(
        indicatorUuid,
      )}/values`,
      data,
      { headers },
    );
    return response.data;
  } catch (error) {
    console.log(error.response);
    return failure(error, "Failed to record the value");
  }
};

export const getMeIndicatorHistory = async (uuid, indicatorUuid) => {
  try {
    const response = await axios.get(
      `${BASE()}/${encodeURIComponent(uuid)}/indicators/${encodeURIComponent(
        indicatorUuid,
      )}/history`,
      { headers },
    );
    return response.data.body;
  } catch (error) {
    console.log(error.response);
    throw error;
  }
};

// Labels for the enumerations the API returns as snake_case keys.
const titleise = (value) =>
  String(value || "")
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export const prettyLabel = titleise;

// A figure rendered the way its indicator type asks for.
export const formatValue = (value, type, unit) => {
  if (value === null || value === undefined) return "—";

  const number = Number(value);
  if (!Number.isFinite(number)) return "—";

  if (type === "percentage") return `${number}%`;

  if (type === "currency") {
    return `${unit ? unit + " " : ""}${number.toLocaleString()}`;
  }

  return number.toLocaleString();
};
