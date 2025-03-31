import axios from "axios";
import { server_url } from "../utils/endpoint";
import { headers } from "../utils/headers";

export const createMentorProfile = async (data) => {
  try {
    const response = await axios.post(`${server_url}/mentor-profile/`, data, {
      headers,
    });
    return response.data;
  } catch (error) {
    console.log(error);
    return error.response;
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
