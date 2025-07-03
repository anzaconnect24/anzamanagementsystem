import axios from "axios";
import { server_url } from "../utils/endpoint";
import { getUser } from "../utils/local_storage";

export const getComments = async ({ module_uuid, page, limit, keyword }) => {
  try {
    const user = getUser();
    const response = await axios.get(
      `${server_url}/comments/?module_uuid=${module_uuid}&page=${
        page || 1
      }&limit=${limit || 8}&keyword=${keyword || ""}`,
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

export const createComment = async (data) => {
  try {
    const user = getUser();
    const response = await axios.post(`${server_url}/comments/`, data, {
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

export const editComment = async (uuid, data) => {
  try {
    const user = getUser();
    const response = await axios.patch(`${server_url}/comments/${uuid}`, data, {
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

export const deleteComment = async (uuid) => {
  try {
    const user = getUser();
    const response = await axios.delete(`${server_url}/comments/${uuid}`, {
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
