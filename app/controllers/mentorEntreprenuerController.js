import axios from "axios";
import { server_url } from "../utils/endpoint";
import { headers } from "../utils/headers";
import { config } from "process";
import { getUser } from "../utils/local_storage";

export const assignEntreprenuerToMentor = async (data) => {
  try {
    const user = getUser();
    const response = await axios.post(
      `${server_url}/mentor-entreprenuers/`,
      data,
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
export const getMentorAssignedEntreprenuers = async (uuid) => {
  try {
    const user = getUser();
    const response = await axios.get(
      `${server_url}/mentor-entreprenuers/mentor/${uuid}`,
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
export const unassignEntreprenuerToMentor = async (uuid) => {
  try {
    const user = getUser();
    const response = await axios.delete(
      `${server_url}/mentor-entreprenuers/${uuid}`,
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
