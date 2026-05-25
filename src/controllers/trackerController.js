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

export const submitTrackerMilestone = async (uuid, submissionNotes) => {
  try {
    const response = await axios.patch(
      `${server_url}/tracker/milestones/${uuid}/submit`,
      { submissionNotes },
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
} = {}) => {
  try {
    const params = new URLSearchParams();
    params.set("page", page);
    params.set("limit", limit);
    if (status) {
      params.set("status", status);
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
