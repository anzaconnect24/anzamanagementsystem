import axios from "axios";
import { server_url } from "../utils/endpoint";
import { headers } from "../utils/headers";

// Programme milestones and KPIs: set by a Business Development Advisor on a
// programme, filled in and submitted by every startup on it.
//
// Every call resolves to the response body, or to `{ status: false, message }`
// when the API refused — callers check `status === false`.

const BASE = () => `${server_url}/program-targets`;

const failure = (error, fallback) => ({
  status: false,
  message: error?.response?.data?.message || fallback,
  code: error?.response?.status,
});

// ---- Advisor side ------------------------------------------------------------

export const getProgramTargets = async (programUuid) => {
  try {
    const response = await axios.get(`${BASE()}/${encodeURIComponent(programUuid)}`, { headers });
    return response.data.body;
  } catch (error) {
    return failure(error, "Failed to load milestones and KPIs");
  }
};

export const createProgramTarget = async (programUuid, data) => {
  try {
    const response = await axios.post(
      `${BASE()}/${encodeURIComponent(programUuid)}/targets`,
      data,
      { headers },
    );
    return response.data.body;
  } catch (error) {
    return failure(error, "Failed to save");
  }
};

export const updateProgramTarget = async (programUuid, targetUuid, data) => {
  try {
    const response = await axios.patch(
      `${BASE()}/${encodeURIComponent(programUuid)}/targets/${encodeURIComponent(targetUuid)}`,
      data,
      { headers },
    );
    return response.data.body;
  } catch (error) {
    return failure(error, "Failed to save");
  }
};

export const removeProgramTarget = async (programUuid, targetUuid) => {
  try {
    const response = await axios.delete(
      `${BASE()}/${encodeURIComponent(programUuid)}/targets/${encodeURIComponent(targetUuid)}`,
      { headers },
    );
    return response.data.body;
  } catch (error) {
    return failure(error, "Failed to remove");
  }
};

export const reviewProgramTargetSubmission = async (programUuid, submissionUuid, data) => {
  try {
    const response = await axios.patch(
      `${BASE()}/${encodeURIComponent(programUuid)}/submissions/${encodeURIComponent(submissionUuid)}/review`,
      data,
      { headers },
    );
    return response.data.body;
  } catch (error) {
    return failure(error, "Failed to save the review");
  }
};

// ---- Startup side ------------------------------------------------------------

export const getMyProgramTargets = async () => {
  try {
    const response = await axios.get(`${BASE()}/mine`, { headers });
    return response.data.body;
  } catch (error) {
    return failure(error, "Failed to load your milestones and KPIs");
  }
};

// items: [{ targetUuid, value, completionStatus, narrative, evidenceUrls }]
export const saveMyProgramTargets = async (programUuid, items, submit = false) => {
  try {
    const response = await axios.put(
      `${BASE()}/${encodeURIComponent(programUuid)}/mine`,
      { items, submit },
      { headers },
    );
    return response.data.body;
  } catch (error) {
    return failure(error, submit ? "Failed to submit" : "Failed to save");
  }
};
