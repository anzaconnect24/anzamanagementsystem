import axios from "axios";
import { server_url } from "../utils/endpoint";
import { headers } from "../utils/headers";

// The live feed: one board shared by everyone signed in, newest first.
// There is no role in any of these calls on purpose — a startup, a mentor,
// an investor and the programme team all read and write the same feed.

const BASE = () => `${server_url}/feed`;

export const getFeed = async (params = {}) => {
  try {
    const response = await axios.get(BASE(), { headers, params });
    return response.data.body;
  } catch (error) {
    console.log(error.response);
    throw error;
  }
};

// Multipart, so a post can carry one image. The auth header is set without
// the JSON content type so the browser writes its own boundary.
export const createFeedPost = async (form) => {
  try {
    const response = await axios.post(BASE(), form, {
      headers: { Authorization: headers.Authorization },
    });
    return response.data;
  } catch (error) {
    console.log(error.response);
    return (
      error?.response?.data || { status: false, message: "Failed to post" }
    );
  }
};

export const removeFeedPost = async (uuid) => {
  try {
    const response = await axios.delete(
      `${BASE()}/${encodeURIComponent(uuid)}`,
      { headers },
    );
    return response.data;
  } catch (error) {
    console.log(error.response);
    return (
      error?.response?.data || {
        status: false,
        message: "Failed to remove the post",
      }
    );
  }
};

// Like (1), dislike (-1), or take it back (0). Sending the value that is
// already set also takes it back, which is what tapping a lit button means.
// The response carries the recounted totals, so the page never has to guess.
export const reactToFeedPost = async (uuid, value) => {
  try {
    const response = await axios.put(
      `${BASE()}/${encodeURIComponent(uuid)}/reaction`,
      { value },
      { headers },
    );
    return response.data;
  } catch (error) {
    console.log(error.response);
    return (
      error?.response?.data || { status: false, message: "Failed to react" }
    );
  }
};

export const getFeedComments = async (uuid) => {
  try {
    const response = await axios.get(
      `${BASE()}/${encodeURIComponent(uuid)}/comments`,
      { headers },
    );
    return response.data.body;
  } catch (error) {
    console.log(error.response);
    throw error;
  }
};

export const createFeedComment = async (uuid, body) => {
  try {
    const response = await axios.post(
      `${BASE()}/${encodeURIComponent(uuid)}/comments`,
      { body },
      { headers },
    );
    return response.data;
  } catch (error) {
    console.log(error.response);
    return (
      error?.response?.data || { status: false, message: "Failed to reply" }
    );
  }
};

export const removeFeedComment = async (commentUuid) => {
  try {
    const response = await axios.delete(
      `${BASE()}/comments/${encodeURIComponent(commentUuid)}`,
      { headers },
    );
    return response.data;
  } catch (error) {
    console.log(error.response);
    return (
      error?.response?.data || {
        status: false,
        message: "Failed to remove the comment",
      }
    );
  }
};

// Who else is here — the faces beside the feed.
export const getFeedMembers = async () => {
  try {
    const response = await axios.get(`${BASE()}/members`, { headers });
    return response.data.body;
  } catch (error) {
    console.log(error.response);
    return { members: 0, recent: [], mostActive: [] };
  }
};
