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
//            nextSessionDate, flag, status, materials }
// `materials` is a JSON array of learning materials the BDA shares with the
// startup — each `{ kind: "file" | "link", name, description, url, fileType,
// size, addedAt }`. Files are uploaded first via `/upload-file/`, so only the
// resulting URLs are stored here. Reads tolerate an array or a JSON string.
// `status` is "scheduled" when a session is first set up, and "completed" once
// the post-session report has been filed (see updateCoachingSession).
export const createCoachingSession = async (data) => {
  const response = await axios.post(
    `${server_url}/coaching-sessions/`,
    data,
    authConfig(),
  );
  return response.data.body;
};

// Update an existing session — used to file the post-session report against a
// scheduled session (issues, recommendations, actions, flag) and mark it
// "completed".
export const updateCoachingSession = async (uuid, data) => {
  const response = await axios.patch(
    `${server_url}/coaching-sessions/${uuid}`,
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
