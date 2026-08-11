import axios from "axios";
import { server_url } from "../utils/endpoint";
import { getUser } from "../utils/local_storage";

const authHeaders = () => {
  const user = getUser();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user && user.ACCESS_TOKEN}`,
  };
};

export const getMentorOverview = async () => {
  try {
    const response = await axios.get(`${server_url}/tracker/mentor/overview`, {
      headers: authHeaders(),
    });
    return response.data.body;
  } catch (error) {
    return error.response;
  }
};

export const getEntrepreneurTrackerDashboard = async ({
  enterpriseUuid,
} = {}) => {
  try {
    const params = new URLSearchParams();
    if (enterpriseUuid) {
      params.set("enterpriseUuid", enterpriseUuid);
    }

    const response = await axios.get(
      `${server_url}/tracker/entrepreneur/dashboard${params.toString() ? `?${params.toString()}` : ""}`,
      {
        headers: authHeaders(),
      },
    );
    return response.data.body;
  } catch (error) {
    throw error;
  }
};

export const getTrackerProgramOverview = async (programUuid) => {
  try {
    const response = await axios.get(
      `${server_url}/tracker/programs/${programUuid}/overview`,
      {
        headers: authHeaders(),
      },
    );
    return response.data.body;
  } catch (error) {
    throw error;
  }
};

export const getMentorWeeklyLogs = async (page = 1, limit = 10) => {
  try {
    const response = await axios.get(
      `${server_url}/tracker/mentor/weekly-logs?page=${page}&limit=${limit}`,
      {
        headers: authHeaders(),
      },
    );
    return response.data.body;
  } catch (error) {
    return error.response;
  }
};

// Staff/BDA tracker reads. The backend has no /tracker/staff routes yet, so
// these reuse the working mentor-scoped endpoints (the logged-in BDA is the owner).
export const getStaffWeeklyLogs = async (page = 1, limit = 10) => {
  try {
    const response = await axios.get(
      `${server_url}/tracker/mentor/weekly-logs?page=${page}&limit=${limit}`,
      {
        headers: authHeaders(),
      },
    );
    return response.data.body;
  } catch (error) {
    return error.response;
  }
};

export const getStaffOverview = async () => {
  try {
    const response = await axios.get(`${server_url}/tracker/mentor/overview`, {
      headers: authHeaders(),
    });
    return response.data.body;
  } catch (error) {
    return error.response;
  }
};

export const createMentorWeeklyLog = async (data) => {
  try {
    const response = await axios.post(
      `${server_url}/tracker/mentor/weekly-logs`,
      data,
      {
        headers: authHeaders(),
      },
    );
    return response.data.body;
  } catch (error) {
    throw error;
  }
};

export const listMentorEnterprises = async () => {
  try {
    const response = await axios.get(`${server_url}/tracker/enterprises`, {
      headers: authHeaders(),
    });
    return response.data.body;
  } catch (error) {
    return error.response;
  }
};

export const upsertMentorEnterprise = async (data) => {
  try {
    const response = await axios.post(
      `${server_url}/tracker/enterprises`,
      data,
      {
        headers: authHeaders(),
      },
    );
    return response.data.body;
  } catch (error) {
    throw error;
  }
};

export const updateMentorEnterprise = async (uuid, data) => {
  try {
    const response = await axios.patch(
      `${server_url}/tracker/enterprises/${uuid}`,
      data,
      {
        headers: authHeaders(),
      },
    );
    return response.data.body;
  } catch (error) {
    throw error;
  }
};

// Entrepreneur self-service KYC update for their own enterprise.
export const updateEntrepreneurEnterpriseKyc = async (data) => {
  try {
    const response = await axios.patch(
      `${server_url}/tracker/entrepreneur/enterprise`,
      data,
      {
        headers: authHeaders(),
      },
    );
    return response.data.body;
  } catch (error) {
    throw error;
  }
};

export const deleteMentorEnterprise = async (uuid) => {
  try {
    const response = await axios.delete(
      `${server_url}/tracker/enterprises/${uuid}`,
      {
        headers: authHeaders(),
      },
    );
    return response.data.body;
  } catch (error) {
    throw error;
  }
};

export const getMentorEnterpriseDetails = async (uuid) => {
  try {
    const response = await axios.get(
      `${server_url}/tracker/enterprises/${uuid}`,
      {
        headers: authHeaders(),
      },
    );
    return response.data.body;
  } catch (error) {
    throw error;
  }
};

export const updateMentorEnterpriseKpis = async (uuid, data) => {
  try {
    const response = await axios.patch(
      `${server_url}/tracker/enterprises/${uuid}/kpis`,
      data,
      {
        headers: authHeaders(),
      },
    );
    return response.data.body;
  } catch (error) {
    throw error;
  }
};

export const updateMentorEnterpriseTrancheStages = async (uuid, data) => {
  try {
    const response = await axios.patch(
      `${server_url}/tracker/enterprises/${uuid}/tranche-stages`,
      data,
      {
        headers: authHeaders(),
      },
    );
    return response.data.body;
  } catch (error) {
    throw error;
  }
};

export const createMentorEnterpriseSession = async (uuid, data) => {
  try {
    const response = await axios.post(
      `${server_url}/tracker/enterprises/${uuid}/sessions`,
      data,
      {
        headers: authHeaders(),
      },
    );
    return response.data.body;
  } catch (error) {
    throw error;
  }
};

export const createMentorEnterpriseWeeklyLog = async (uuid, data) => {
  try {
    const response = await axios.post(
      `${server_url}/tracker/enterprises/${uuid}/weekly-logs`,
      data,
      {
        headers: authHeaders(),
      },
    );
    return response.data.body;
  } catch (error) {
    throw error;
  }
};

export const createMentorEnterpriseMilestone = async (uuid, data) => {
  try {
    const response = await axios.post(
      `${server_url}/tracker/enterprises/${uuid}/milestones`,
      data,
      {
        headers: authHeaders(),
      },
    );
    return response.data.body;
  } catch (error) {
    throw error;
  }
};

export const listTrackerMilestones = async () => {
  try {
    const response = await axios.get(`${server_url}/tracker/milestones`, {
      headers: authHeaders(),
    });
    return response.data.body;
  } catch (error) {
    return error.response;
  }
};

export const createTrackerMilestone = async (data) => {
  try {
    const response = await axios.post(
      `${server_url}/tracker/milestones`,
      data,
      {
        headers: authHeaders(),
      },
    );
    return response.data.body;
  } catch (error) {
    throw error;
  }
};

export const submitTrackerMilestone = async (
  uuid,
  { submissionNotes, submissionAttachments = [] } = {},
) => {
  try {
    const response = await axios.patch(
      `${server_url}/tracker/milestones/${uuid}/submit`,
      { submissionNotes, submissionAttachments },
      {
        headers: authHeaders(),
      },
    );
    return response.data.body;
  } catch (error) {
    throw error;
  }
};

// Entrepreneur edits their own milestone plan after submitting it. Distinct
// from /submit (which carries reports against a milestone) and from /review
// (the BDA's verdict on one) — this changes the plan itself.
//
// NOTE: needs `PATCH /tracker/milestones/:uuid` server-side; see
// docs/BDA_TRACKER_BACKEND_SPEC.md.
export const reviseTrackerMilestone = async (uuid, data) => {
  try {
    const response = await axios.patch(
      `${server_url}/tracker/milestones/${uuid}`,
      data,
      {
        headers: authHeaders(),
      },
    );
    return response.data.body;
  } catch (error) {
    throw error;
  }
};

export const reviewTrackerMilestone = async (uuid, data) => {
  try {
    const response = await axios.patch(
      `${server_url}/tracker/milestones/${uuid}/review`,
      data,
      {
        headers: authHeaders(),
      },
    );
    return response.data.body;
  } catch (error) {
    throw error;
  }
};

export const getAdminTrackerOverview = async () => {
  try {
    const response = await axios.get(`${server_url}/tracker/admin/overview`, {
      headers: authHeaders(),
    });
    return response.data.body;
  } catch (error) {
    return error.response;
  }
};

export const getAdminWeeklyLogs = async ({
  page = 1,
  limit = 20,
  flag = "",
  weekStart = "",
  businessUuid = "",
} = {}) => {
  try {
    const params = new URLSearchParams();
    params.set("page", page);
    params.set("limit", limit);
    if (flag) {
      params.set("flag", flag);
    }
    if (weekStart) {
      params.set("weekStart", weekStart);
    }
    if (businessUuid) {
      params.set("businessUuid", businessUuid);
    }

    const response = await axios.get(
      `${server_url}/tracker/admin/weekly-logs?${params.toString()}`,
      {
        headers: authHeaders(),
      },
    );
    return response.data.body;
  } catch (error) {
    return error.response;
  }
};

export const getAdminMilestones = async ({
  page = 1,
  limit = 20,
  status = "",
  businessUuid = "",
} = {}) => {
  try {
    const params = new URLSearchParams();
    params.set("page", page);
    params.set("limit", limit);
    if (status) {
      params.set("status", status);
    }
    if (businessUuid) {
      params.set("businessUuid", businessUuid);
    }

    const response = await axios.get(
      `${server_url}/tracker/admin/milestones?${params.toString()}`,
      {
        headers: authHeaders(),
      },
    );
    return response.data.body;
  } catch (error) {
    return error.response;
  }
};

export const downloadAdminTrackerCsv = async () => {
  try {
    const response = await axios.get(`${server_url}/tracker/admin/export-csv`, {
      headers: authHeaders(),
      responseType: "blob",
    });

    const blob = new Blob([response.data], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tracker-admin-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    throw error;
  }
};

export const getAdminBusinesses = async () => {
  try {
    const response = await axios.get(`${server_url}/tracker/admin/businesses`, {
      headers: authHeaders(),
    });
    return response.data.body;
  } catch (error) {
    return error.response;
  }
};
