import axios from "axios";
import { server_url } from "../utils/endpoint";
import { getUser } from "../utils/local_storage";

// Helper function to get auth headers
const authHeaders = () => {
  const user = getUser();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user && user.ACCESS_TOKEN}`,
  };
};

// Create a new program application
export const createProgramApplication = async (data) => {
  try {
    const response = await axios.post(
      `${server_url}/program-applications`,
      data,
      {
        headers: authHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error creating program application:", error);
    throw error.response?.data || error;
  }
};

// Get all program applications
export const getAllProgramApplications = async (params = {}) => {
  try {
    const { page = 1, limit = 10, includeExpired = false } = params;
    const response = await axios.get(`${server_url}/program-applications`, {
      params: { page, limit, includeExpired },
      headers: authHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching program applications:", error);
    throw error.response?.data || error;
  }
};

// Get a single program application by UUID
export const getProgramApplicationByUuid = async (uuid) => {
  try {
    const response = await axios.get(
      `${server_url}/program-applications/${uuid}`,
      {
        headers: authHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching program application:", error);
    throw error.response?.data || error;
  }
};

// Update a program application
export const updateProgramApplication = async (uuid, data) => {
  try {
    const response = await axios.put(
      `${server_url}/program-applications/${uuid}`,
      data,
      {
        headers: authHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating program application:", error);
    throw error.response?.data || error;
  }
};

// Delete a program application
export const deleteProgramApplication = async (uuid) => {
  try {
    const response = await axios.delete(
      `${server_url}/program-applications/${uuid}`,
      {
        headers: authHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting program application:", error);
    throw error.response?.data || error;
  }
};
