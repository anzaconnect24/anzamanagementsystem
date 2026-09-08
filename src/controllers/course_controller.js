import axios from "axios";
import { server_url } from "../utils/endpoint";
import { getUser } from "../utils/local_storage";

// Courses sit between a programme and its content:
//
//   Programme -> Course -> Modules / Workshops / Resources
//
// Startups enrol in a course, so one programme can run several with their own
// rosters.

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

export const COURSE_STATUSES = [
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
];

// Pass "mine" as the programme to get the signed-in startup's own courses
// without knowing its uuid.
export const getCourses = async (programUuid) => {
  try {
    const response = await axios.get(
      `${BASE()}/programs/${encodeURIComponent(programUuid)}/courses`,
      { headers: authHeaders() },
    );
    return response.data.body;
  } catch (error) {
    console.log(error.response);
    throw error;
  }
};

// How many published courses on the learner's programme they have not taken
// up yet — what the Class Rooms badge counts. Returns 0 rather than throwing,
// so a badge can never break the sidebar.
export const getNewCourseCount = async () => {
  try {
    const response = await axios.get(`${BASE()}/courses/new/count`, {
      headers: authHeaders(),
    });
    return response.data.body?.count || 0;
  } catch (error) {
    console.log(error.response);
    return 0;
  }
};

export const getCourse = async (courseUuid) => {
  try {
    const response = await axios.get(
      `${BASE()}/courses/${encodeURIComponent(courseUuid)}`,
      { headers: authHeaders() },
    );
    return response.data.body;
  } catch (error) {
    console.log(error.response);
    throw error;
  }
};

export const createCourse = async (programUuid, data) => {
  try {
    const response = await axios.post(
      `${BASE()}/programs/${encodeURIComponent(programUuid)}/courses`,
      data,
      { headers: authHeaders() },
    );
    return response.data;
  } catch (error) {
    console.log(error.response);
    return failure(error, "Failed to create the course");
  }
};

export const updateCourse = async (courseUuid, data) => {
  try {
    const response = await axios.patch(
      `${BASE()}/courses/${encodeURIComponent(courseUuid)}`,
      data,
      { headers: authHeaders() },
    );
    return response.data;
  } catch (error) {
    console.log(error.response);
    return failure(error, "Failed to save the course");
  }
};

// Archives rather than deletes: enrolments and progress must survive.
export const archiveCourse = async (courseUuid) => {
  try {
    const response = await axios.delete(
      `${BASE()}/courses/${encodeURIComponent(courseUuid)}`,
      { headers: authHeaders() },
    );
    return response.data;
  } catch (error) {
    console.log(error.response);
    return failure(error, "Failed to archive the course");
  }
};

// A startup enrolling itself, where the course allows it.
// Destroys the course and everything under it: modules, content, learner
// progress, workshops, attendance, recordings, resources and enrolments.
// Admin only, and irreversible — archiveCourse is the safe alternative.
export const deleteCourse = async (courseUuid) => {
  try {
    const response = await axios.delete(
      `${BASE()}/courses/${encodeURIComponent(courseUuid)}/permanent`,
      { headers: authHeaders() },
    );
    return response.data;
  } catch (error) {
    console.log(error.response);
    return failure(error, "Failed to delete the course");
  }
};

export const enrollInCourse = async (courseUuid) => {
  try {
    const response = await axios.post(
      `${BASE()}/courses/${encodeURIComponent(courseUuid)}/enroll`,
      {},
      { headers: authHeaders() },
    );
    return response.data;
  } catch (error) {
    console.log(error.response);
    return failure(error, "Could not enroll in this course");
  }
};

export const getCourseEnrollments = async (courseUuid) => {
  try {
    const response = await axios.get(
      `${BASE()}/courses/${encodeURIComponent(courseUuid)}/enrollments`,
      { headers: authHeaders() },
    );
    return response.data.body;
  } catch (error) {
    console.log(error.response);
    throw error;
  }
};

// Replaces the course roster with exactly these startups.
export const setCourseEnrollments = async (courseUuid, businessUuids) => {
  try {
    const response = await axios.put(
      `${BASE()}/courses/${encodeURIComponent(courseUuid)}/enrollments`,
      { businessUuids },
      { headers: authHeaders() },
    );
    return response.data;
  } catch (error) {
    console.log(error.response);
    return failure(error, "Failed to update the roster");
  }
};
