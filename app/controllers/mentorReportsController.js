import axios from "axios";
import { server_url } from "../utils/endpoint";
import { headers } from "../utils/headers";
import { config } from "process";
import { getUser } from "../utils/local_storage";

export const addMentorReport = async (data) => {
  try {
    const user = getUser();
    const response = await axios.post(`${server_url}/mentor-reports/`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${user && user.ACCESS_TOKEN}`,
      },
    });
    return response.data.body;
  } catch (error) {
    console.log(error);
    return error.response;
  }
};
export const getMentorReport = async (uuid) => {
  try {
    const user = getUser();
    const response = await axios.get(`${server_url}/mentor-reports/${uuid}`, {
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
export const getSpecificMentorReports = async (uuid) => {
  try {
    const user = getUser();
    const response = await axios.get(
      `${server_url}/mentor-reports/mentor/${uuid}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user && user.ACCESS_TOKEN}`,
        },
      }
    );
    return response.data.body;
  } catch (error) {
    console.log(error);
    return error.response;
  }
};
export const getSpecificEntreprenuerReports = async (uuid) => {
  try {
    const user = getUser();
    const response = await axios.get(
      `${server_url}/mentor-reports/entreprenuer/${uuid}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user && user.ACCESS_TOKEN}`,
        },
      }
    );
    return response.data.body;
  } catch (error) {
    console.log(error);
    return error.response;
  }
};
export const getAllReports = async (uuid) => {
  try {
    const user = getUser();
    const response = await axios.get(`${server_url}/mentor-reports/`, {
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
export const getSpecificReport = async (uuid) => {
  try {
    const user = getUser();
    const response = await axios.get(`${server_url}/mentor-reports/${uuid}`, {
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
export const deleteMentorReport = async (uuid) => {
  try {
    const user = getUser();
    const response = await axios.delete(
      `${server_url}/mentor-reports/${uuid}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user && user.ACCESS_TOKEN}`,
        },
      }
    );
    return response.data.body;
  } catch (error) {
    console.log(error);
    return error.response;
  }
};
