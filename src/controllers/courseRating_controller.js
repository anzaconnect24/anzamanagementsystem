import axios from "axios";
import { server_url } from "../utils/endpoint";
import { getUser } from "../utils/local_storage";

const authHeaders = () => {
  const user = getUser();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user && user.ACCESS_TOKEN}`,
  };
};

export const upsertCourseRating = async (programUuid, rating) => {
  try {
    const response = await axios.post(
      `${server_url}/course-ratings`,
      { programUuid, rating },
      {
        headers: authHeaders(),
      },
    );
    return response.data.body;
  } catch (error) {
    throw error;
  }
};

export const getMyCourseRatings = async (programUuids = []) => {
  try {
    const params = new URLSearchParams();
    if (programUuids.length > 0) {
      params.set("programUuids", programUuids.join(","));
    }

    const response = await axios.get(
      `${server_url}/course-ratings${params.toString() ? `?${params.toString()}` : ""}`,
      {
        headers: authHeaders(),
      },
    );
    return response.data.body;
  } catch (error) {
    throw error;
  }
};

export const getAverageCourseRatings = async (programUuids = []) => {
  try {
    const params = new URLSearchParams();
    if (programUuids.length > 0) {
      params.set("programUuids", programUuids.join(","));
    }

    const response = await axios.get(
      `${server_url}/course-ratings/average${params.toString() ? `?${params.toString()}` : ""}`,
      {
        headers: authHeaders(),
      },
    );
    return response.data.body;
  } catch (error) {
    throw error;
  }
};

export const deleteCourseRating = async (programUuid) => {
  try {
    const response = await axios.delete(
      `${server_url}/course-ratings/${programUuid}`,
      {
        headers: authHeaders(),
      },
    );
    return response.data.body;
  } catch (error) {
    throw error;
  }
};
