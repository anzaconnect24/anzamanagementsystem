import axios from "axios";
import { server_url } from "../utils/endpoint";
import { headers } from "../utils/headers";

// Called during sign-up, before the new mentor has signed in, so it must not
// depend on a stored session.
export const createMentorProfile = async (data) => {
  try {
    const response = await axios.post(`${server_url}/mentor-profile/`, data, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error) {
    console.log(error);
    return error.response?.data || { status: false, message: "Failed to save mentor profile" };
  }
};

// The signed-in mentor's own profile; saving creates it if missing.
export const getMyMentorProfile = async () => {
  try {
    const response = await axios.get(`${server_url}/mentor-profile/me`, { headers });
    return response.data.body;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const saveMyMentorProfile = async (data) => {
  try {
    const response = await axios.patch(`${server_url}/mentor-profile/me`, data, { headers });
    return response.data;
  } catch (error) {
    console.log(error);
    return error.response?.data || { status: false, message: "Failed to save mentor profile" };
  }
};
export const deleteMentorProfile = async (uuid) => {
  try {
    const response = await axios.delete(
      `${server_url}/mentor-profile/${uuid}`,
      {
        headers,
      }
    );
    return response.data;
  } catch (error) {
    console.log(error);
    return error.response;
  }
};
export const editMentorProfile = async (uuid, data) => {
  try {
    const response = await axios.patch(
      `${server_url}/mentor-profile/${uuid}`,
      data,
      {
        headers,
      }
    );
    return response.data;
  } catch (error) {
    console.log(error);
    return error.response;
  }
};
export const getMentorProfile = async (uuid, data) => {
  try {
    const response = await axios.get(
      `${server_url}/mentor-profile/${uuid}`,
      data,
      {
        headers,
      }
    );
    return response.data.body;
  } catch (error) {
    console.log(error);
    return error.response;
  }
};

export const getMentorProfiles = async (data, uuid) => {
  try {
    const response = await axios.get(`${server_url}/mentor-profile`, {
      headers,
    });
    console.log(response.data.body);
    return response.data.body;
  } catch (error) {
    console.log(error);
  }
};
