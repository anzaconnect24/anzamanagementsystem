import axios from "axios";
import { getUser } from "../utils/local_storage";
import { server_url } from "../utils/endpoint";

export const getMentorOverviewStats = async () => {
  try {
    const user = getUser();
    const response = await axios.get(`${server_url}/stats/mentor/`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user && user.ACCESS_TOKEN}`,
      },
    });
    return response.data.body;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
