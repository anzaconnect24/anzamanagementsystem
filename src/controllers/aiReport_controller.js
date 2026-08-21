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

export const createAiReport = async (data) => {
  try {
    const response = await axios.post(`${server_url}/ai-reports`, data, {
      headers: authHeaders(),
    });
    return response.data.body;
  } catch (error) {
    throw error;
  }
};

export const getAiReports = async (page = 1, limit = 20) => {
  try {
    const response = await axios.get(
      `${server_url}/ai-reports?page=${page}&limit=${limit}`,
      {
        headers: authHeaders(),
      },
    );
    return response.data.body;
  } catch (error) {
    throw error;
  }
};

export const getAiReport = async (uuid) => {
  try {
    const response = await axios.get(`${server_url}/ai-reports/${uuid}`, {
      headers: authHeaders(),
    });
    return response.data.body;
  } catch (error) {
    throw error;
  }
};

export const deleteAiReport = async (uuid) => {
  try {
    const response = await axios.delete(`${server_url}/ai-reports/${uuid}`, {
      headers: authHeaders(),
    });
    return response.data.body;
  } catch (error) {
    throw error;
  }
};

export const getAiReportStats = async () => {
  try {
    const response = await axios.get(`${server_url}/ai-reports/stats`, {
      headers: authHeaders(),
    });
    return response.data.body;
  } catch (error) {
    throw error;
  }
};
