import axios from "axios";
import { server_url } from "../utils/endpoint";
import { headers } from "../utils/headers";
import { config } from "process";
import { getUser } from "../utils/local_storage";

export const getModules = async ({ course, page, limit, keyword }) => {
  try {
    const user = getUser();
    const response = await axios.get(
      `${server_url}/modules/?course=${course}&page=${page || 1}&limit=${
        limit || 8
      }&keyword=${keyword || ""}`,
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

export const deleteModule = async (uuid) => {
  try {
    const user = getUser();
    const response = await axios.delete(`${server_url}/modules/${uuid}`, {
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
