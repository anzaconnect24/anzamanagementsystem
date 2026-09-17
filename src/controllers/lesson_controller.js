import axios from "axios";
import { server_url } from "../utils/endpoint";
import { getUser } from "../utils/local_storage";

// Learning content is Course -> Module -> Slides. A module holds its slides
// directly, so there is no lesson layer here.

const BASE = () => `${server_url}/learning`;

const authHeaders = () => {
  const user = getUser();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user && user.ACCESS_TOKEN}`,
  };
};

const failure = (error, fallback) =>
  error?.response?.data || { status: false, message: fallback };

// What a module can hold. Each type says how a learner finishes it, which is
// what stops a video counting as done the moment the page opens.
export const CONTENT_TYPES = [
  {
    value: "text",
    label: "Text",
    hint: "Written material the learner reads.",
  },
  {
    value: "video",
    label: "Video",
    hint: "Counted as done once 90% has been watched.",
  },
  {
    value: "presentation",
    label: "Presentation",
    hint: "Slide deck (PDF, PPT or PPTX).",
  },
  {
    value: "document",
    label: "Document",
    hint: "A template, guide or case study to read or download.",
  },
  { value: "link", label: "External link", hint: "Material hosted elsewhere." },
  { value: "file", label: "File", hint: "Any other uploaded file." },
];

export const contentTypeLabel = (value) =>
  CONTENT_TYPES.find((item) => item.value === value)?.label || "Content";

// How much of a video counts as watched. Mirrors the server, which is the
// authority — this is only used to draw the progress bar.
export const VIDEO_COMPLETION_PERCENT = 90;

// A whole course: its modules, the slides inside each, and the caller's own
// progress. The uuid may name a course, a programme, or "mine".
export const getCourseOutline = async (uuid) => {
  try {
    const response = await axios.get(
      `${BASE()}/courses/${encodeURIComponent(uuid)}/outline`,
      { headers: authHeaders() },
    );
    return response.data.body;
  } catch (error) {
    console.log(error.response);
    throw error;
  }
};

// How far every enterprise on a programme has got.
export const getCourseProgress = async (uuid) => {
  try {
    const response = await axios.get(
      `${BASE()}/courses/${encodeURIComponent(uuid)}/progress`,
      { headers: authHeaders() },
    );
    return response.data.body;
  } catch (error) {
    console.log(error.response);
    throw error;
  }
};

// The slides of one module.
export const getModuleContent = async (moduleUuid) => {
  try {
    const response = await axios.get(
      `${BASE()}/modules/${encodeURIComponent(moduleUuid)}/content`,
      { headers: authHeaders() },
    );
    return response.data.body;
  } catch (error) {
    console.log(error.response);
    throw error;
  }
};

export const reorderContent = async (moduleUuid, contentUuids) => {
  try {
    const response = await axios.put(
      `${BASE()}/modules/${encodeURIComponent(moduleUuid)}/content/order`,
      { contentUuids },
      { headers: authHeaders() },
    );
    return response.data;
  } catch (error) {
    console.log(error.response);
    return failure(error, "Failed to reorder");
  }
};

// A learner reporting how far through a slide they got. Videos send how much
// was watched; everything else just reports that it was opened.
export const recordProgress = async (contentUuid, data = {}) => {
  try {
    const response = await axios.post(
      `${BASE()}/content/${encodeURIComponent(contentUuid)}/progress`,
      data,
      { headers: authHeaders() },
    );
    return response.data.body;
  } catch (error) {
    console.log(error.response);
    return null;
  }
};
