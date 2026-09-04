import axios from "axios";
import { server_url } from "../utils/endpoint";
import { headers } from "../utils/headers";

// Surveys a programme runs. Staff write them from the programme page; the
// startups on that programme answer the published ones.

const BASE = () => `${server_url}/surveys`;

const failure = (error, fallback) =>
  error?.response?.data || { status: false, message: fallback };

export const SURVEY_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "closed", label: "Closed" },
];

export const QUESTION_TYPES = [
  { value: "text", label: "Written answer" },
  { value: "single_choice", label: "Choose one" },
  { value: "multiple_choice", label: "Choose several" },
  { value: "rating", label: "Rating (1-5)" },
];

export const questionTypeLabel = (value) =>
  QUESTION_TYPES.find((item) => item.value === value)?.label ||
  "Written answer";

// Staff pass the program uuid; a startup passes nothing and gets the published
// surveys of the program it is enrolled in.
export const getSurveys = async (cohortProgram) => {
  try {
    const query = cohortProgram
      ? `?cohortProgram=${encodeURIComponent(cohortProgram)}`
      : "";
    const response = await axios.get(`${BASE()}${query}`, { headers });
    return response.data.body;
  } catch (error) {
    console.log(error.response);
    throw error;
  }
};

export const getSurvey = async (uuid) => {
  try {
    const response = await axios.get(`${BASE()}/${encodeURIComponent(uuid)}`, {
      headers,
    });
    return response.data.body;
  } catch (error) {
    console.log(error.response);
    throw error;
  }
};

export const createSurvey = async (data) => {
  try {
    const response = await axios.post(BASE(), data, { headers });
    return response.data;
  } catch (error) {
    console.log(error.response);
    return failure(error, "Failed to create the survey");
  }
};

export const updateSurvey = async (uuid, data) => {
  try {
    const response = await axios.patch(
      `${BASE()}/${encodeURIComponent(uuid)}`,
      data,
      { headers },
    );
    return response.data;
  } catch (error) {
    console.log(error.response);
    return failure(error, "Failed to save the survey");
  }
};

export const deleteSurvey = async (uuid) => {
  try {
    const response = await axios.delete(
      `${BASE()}/${encodeURIComponent(uuid)}`,
      { headers },
    );
    return response.data;
  } catch (error) {
    console.log(error.response);
    return failure(error, "Failed to delete the survey");
  }
};

export const setSurveyStatus = async (uuid, status) => {
  try {
    const response = await axios.patch(
      `${BASE()}/${encodeURIComponent(uuid)}/status`,
      { status },
      { headers },
    );
    return response.data;
  } catch (error) {
    console.log(error.response);
    return failure(error, "Failed to update the survey");
  }
};

export const submitSurveyResponse = async (uuid, answers) => {
  try {
    const response = await axios.post(
      `${BASE()}/${encodeURIComponent(uuid)}/responses`,
      { answers },
      { headers },
    );
    return response.data;
  } catch (error) {
    console.log(error.response);
    return failure(error, "Failed to submit your answers");
  }
};

export const getSurveyResults = async (uuid) => {
  try {
    const response = await axios.get(
      `${BASE()}/${encodeURIComponent(uuid)}/results`,
      { headers },
    );
    return response.data.body;
  } catch (error) {
    console.log(error.response);
    throw error;
  }
};
