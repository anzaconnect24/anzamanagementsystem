import axios from "axios";
import { server_url } from "../utils/endpoint";
import { getUser } from "../utils/local_storage";

export const getModules = async ({
  program_uuid,
  cohort_program_uuid,
  page,
  limit,
  keyword,
} = {}) => {
  try {
    const user = getUser();

    // Omitting every filter is meaningful: the API then returns the modules of
    // the caller's own program, which is what a startup sees in Class Rooms.
    const query = new URLSearchParams({
      page: page || 1,
      limit: limit || 8,
    });

    if (program_uuid) query.set("program_uuid", program_uuid);
    if (cohort_program_uuid)
      query.set("cohort_program_uuid", cohort_program_uuid);
    if (keyword) query.set("keyword", keyword);

    const response = await axios.get(
      `${server_url}/modules/?${query.toString()}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user && user.ACCESS_TOKEN}`,
        },
      },
    );
    return response.data.body;
  } catch (error) {
    console.log(error);
    return error.response;
  }
};
export const getModule = async (uuid) => {
  try {
    const user = getUser();
    const response = await axios.get(`${server_url}/modules/${uuid}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user && user.ACCESS_TOKEN}`,
      },
    });
    return response.data.body;
  } catch (error) {
    console.log(error);
    return error.response;
  }
};
export const createModule = async (data) => {
  try {
    const user = getUser();
    const response = await axios.post(`${server_url}/modules/`, data, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user && user.ACCESS_TOKEN}`,
      },
    });
    return response.data.body;
  } catch (error) {
    return error.response;
  }
};

export const editModule = async (uuid, data) => {
  try {
    const user = getUser();
    const response = await axios.patch(`${server_url}/modules/${uuid}`, data, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user && user.ACCESS_TOKEN}`,
      },
    });
    return response.data.body;
  } catch (error) {
    return error.response;
  }
};

// Returns the response envelope so callers can tell success from a refusal
// (deleting a module is staff-only).
export const deleteModule = async (uuid) => {
  try {
    const user = getUser();
    const response = await axios.delete(`${server_url}/modules/${uuid}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user && user.ACCESS_TOKEN}`,
      },
    });
    return response.data;
  } catch (error) {
    console.log(error.response);
    return (
      error.response?.data || {
        status: false,
        message: "Failed to delete the module",
      }
    );
  }
};

// Everything the staff record of a module shows, in one call: the module, its
// program, its slides, its quizzes and the program roster with read counts.
export const getModuleOverview = async (uuid) => {
  try {
    const user = getUser();
    const response = await axios.get(`${server_url}/modules/${uuid}/overview`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user && user.ACCESS_TOKEN}`,
      },
    });
    return response.data.body;
  } catch (error) {
    console.log(error.response);
    throw error;
  }
};
