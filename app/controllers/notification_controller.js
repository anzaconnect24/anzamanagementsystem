import axios from "axios";
import { server_url } from "../utils/endpoint";
import { headers } from "../utils/headers";
import { config } from "process";
import { getUser } from "../utils/local_storage";

export const getNotifications = async (page, limit) => {
  try {
    const user = getUser();
    const response = await axios.get(`${server_url}/notification/`, {
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

export const createNotification = async (data) => {
  try {
    const user = getUser();
    const response = await axios.post(`${server_url}/notification/`, data, {
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

export const addNotificationViewer = async (uuid) => {
  try {
    const user = getUser();
    const response = await axios.post(
      `${server_url}/notification/viewer/${uuid}`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user && user.ACCESS_TOKEN}`,
        },
      }
    );
    return response.data.body;
  } catch (error) {
    return error.response;
  }
};
