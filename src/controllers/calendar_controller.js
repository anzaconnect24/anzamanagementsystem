import axios from "axios";
import { server_url } from "../utils/endpoint";
import { headers } from "../utils/headers";

// Everyone's calendar: the events published to them, plus the reminders they
// keep for themselves. Which is which is decided by the server — the page
// only reads the `personal` flag it sends back.

const BASE = () => `${server_url}/calendar`;

export const getCalendarEvents = async (params = {}) => {
  try {
    const response = await axios.get(BASE(), { headers, params });
    return response.data.body;
  } catch (error) {
    console.log(error.response);
    throw error;
  }
};

// Two numbers for the dot in the top bar: invitations still waiting on this
// person, and what is on today. Counted by the server so the header never
// fetches a calendar it is not going to show.
//
// The day is sent from here because only the browser knows which day it is
// where the reader is sitting.
export const getCalendarSummary = async () => {
  try {
    const now = new Date();
    const on = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");

    const response = await axios.get(`${BASE()}/summary`, {
      headers,
      params: { on },
    });

    return response.data.body;
  } catch (error) {
    console.log(error.response);
    return { invites: 0, today: 0 };
  }
};

// The programmes and people an event can be addressed to. Refused with a 403
// for anyone who cannot publish, which is the honest answer rather than an
// empty list.
export const getCalendarAudiences = async () => {
  try {
    const response = await axios.get(`${BASE()}/audiences`, { headers });
    return response.data.body;
  } catch (error) {
    console.log(error.response);
    return { programs: [], users: [] };
  }
};

// Creates an event, or edits the one named by recordUuid.
export const saveCalendarEvent = async (body, recordUuid) => {
  try {
    const response = recordUuid
      ? await axios.patch(
          `${BASE()}/${encodeURIComponent(recordUuid)}`,
          body,
          { headers },
        )
      : await axios.post(BASE(), body, { headers });

    return response.data;
  } catch (error) {
    console.log(error.response);
    return (
      error?.response?.data || {
        status: false,
        message: "Failed to save the event",
      }
    );
  }
};

// Answering an invitation addressed to you by name: "accepted", "declined"
// or "tentative". Anything published to a whole programme has nothing to
// answer, and the server says so rather than pretending otherwise.
export const respondToCalendarEvent = async (recordUuid, response) => {
  try {
    const result = await axios.post(
      `${BASE()}/${encodeURIComponent(recordUuid)}/respond`,
      { response },
      { headers },
    );
    return result.data;
  } catch (error) {
    console.log(error.response);
    return (
      error?.response?.data || {
        status: false,
        message: "Failed to send your answer",
      }
    );
  }
};

// This person's own subscription URL, for Google, Outlook or Apple Calendar.
// The token in it is a credential, so it is fetched when the panel is opened
// rather than held anywhere it could be read from.
export const getCalendarFeed = async () => {
  try {
    const response = await axios.get(`${BASE()}/feed`, { headers });
    return response.data.body;
  } catch (error) {
    console.log(error.response);
    return null;
  }
};

// Rolls the token. Every calendar already subscribed to the old URL stops
// updating — which is the point of asking for it.
export const resetCalendarFeed = async () => {
  try {
    const response = await axios.post(`${BASE()}/feed/reset`, {}, { headers });
    return response.data.body;
  } catch (error) {
    console.log(error.response);
    return null;
  }
};

export const deleteCalendarEvent = async (recordUuid) => {
  try {
    const response = await axios.delete(
      `${BASE()}/${encodeURIComponent(recordUuid)}`,
      { headers },
    );
    return response.data;
  } catch (error) {
    console.log(error.response);
    return (
      error?.response?.data || {
        status: false,
        message: "Failed to remove the event",
      }
    );
  }
};
