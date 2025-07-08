import axios from "axios";
import { server_url } from "../utils/endpoint";
import { headers } from "../utils/headers";
import { config } from "process";
import { getUser } from "../utils/local_storage";

export const sendMentorshipApplication = async (data) => {
  try {
    const user = getUser();
    const response = await axios.post(
      `${server_url}/mentorship-applications/`,
      data,
      {
        headers: {
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
export const getMentorReport = async (uuid) => {
  try {
    const user = getUser();
    const response = await axios.get(
      `${server_url}/mentorship-applications/${uuid}`,
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
export const getEntreprenuerMentors = async (uuid, page, limit, keyword) => {
  try {
    const user = getUser();
    const response = await axios.get(
      `${server_url}/mentorship-applications/entreprenuer/${uuid}?page=${page}&limit=${limit}&keyword=${keyword}`,
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

export const deleteMentorReport = async (uuid) => {
  try {
    const user = getUser();
    const response = await axios.delete(
      `${server_url}/mentorship-applications/${uuid}`,
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
