import axios from "axios";
import { server_url } from "../utils/endpoint";
import { headers } from "../utils/headers";

export const createStaffProfile = async (data) => {
  try {
    const response = await axios.post(`${server_url}/staff-profile/`, data, {
      headers,
    });
    return response.data;
  } catch (error) {
    console.log(error);
    return error.response;
  }
};
export const deleteStaffProfile = async (uuid) => {
  try {
    const response = await axios.delete(`${server_url}/staff-profile/${uuid}`, {
      headers,
    });
    return response.data;
  } catch (error) {
    console.log(error);
    return error.response;
  }
};
export const editStaffProfile = async (uuid, data) => {
  try {
    const response = await axios.patch(
      `${server_url}/staff-profile/${uuid}`,
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
export const getStaffProfile = async (uuid, data) => {
  try {
    const response = await axios.get(
      `${server_url}/staff-profile/${uuid}`,
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

export const getStaffProfiles = async (data, uuid) => {
  try {
    const response = await axios.get(`${server_url}/staff-profile`, {
      headers,
    });
    console.log(response.data.body);
    return response.data.body;
  } catch (error) {
    console.log(error);
  }
};
