import axios from "axios";
import { server_url } from "../utils/endpoint";
import { getUser } from "../utils/local_storage";

const authConfig = () => {
  const user = getUser();
  return {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${user && user.ACCESS_TOKEN}`,
    },
  };
};

// BDA/Staff logs a coaching session for any entrepreneur.
// payload: { entreprenuer_uuid, sessionDate, facilitator, sessionType,
//            issuesDiscussed, recommendationsGiven, actionsAgreed,
//            nextSessionDate, flag }
export const createCoachingSession = async (data) => {
  const response = await axios.post(
    `${server_url}/coaching-sessions/`,
    data,
    authConfig(),
  );
  return response.data.body;
};

// Coaching sessions for a given entrepreneur (by their user uuid).
export const getEntrepreneurCoachingSessions = async (entreprenuerUuid) => {
  try {
    const response = await axios.get(
      `${server_url}/coaching-sessions/entreprenuer/${entreprenuerUuid}`,
      authConfig(),
    );
    return response.data.body;
  } catch (error) {
    console.log(error);
    return [];
  }
};

export const deleteCoachingSession = async (uuid) => {
  const response = await axios.delete(
    `${server_url}/coaching-sessions/${uuid}`,
    authConfig(),
  );
  return response.data.body;
};
