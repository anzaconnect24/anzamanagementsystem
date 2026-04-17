import axios from "axios";
import { server_url } from "@/utils/endpoint";
import { headers } from "@/utils/headers";

const unwrap = (response) => response?.data?.body;

export const getUserBusiness = async (userUuid) => {
  const response = await axios.get(`${server_url}/user/${userUuid}/business`, {
    headers,
  });
  const payload = unwrap(response);
  return payload?.Business || null;
};

export const getCatalog = async (businessId) => {
  const response = await axios.get(`${server_url}/crat/catalog/${businessId}`, {
    headers,
  });
  return unwrap(response);
};

export const getCurrentAssessment = async (businessId) => {
  const response = await axios.get(
    `${server_url}/crat/assessments/${businessId}/current`,
    {
      headers,
    },
  );
  return unwrap(response);
};

export const saveAssessmentAnswers = async (assessmentId, answers) => {
  const response = await axios.put(
    `${server_url}/crat/assessments/${assessmentId}/answers`,
    {
      answers,
    },
    {
      headers,
    },
  );
  return unwrap(response);
};

export const uploadAssessmentAttachment = async (
  assessmentId,
  questionId,
  file,
) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axios.post(
    `${server_url}/crat/assessments/${assessmentId}/answers/${questionId}/attachment`,
    formData,
    {
      headers: {
        ...headers,
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return unwrap(response);
};

export const submitAssessment = async (assessmentId) => {
  const response = await axios.post(
    `${server_url}/crat/assessments/${assessmentId}/submit`,
    {},
    {
      headers,
    },
  );
  return unwrap(response);
};

export const getAdminQueue = async (
  status = "submitted|assigned|review_submitted",
) => {
  const response = await axios.get(
    `${server_url}/crat/admin/queue?status=${status}`,
    {
      headers,
    },
  );
  return unwrap(response) || [];
};

export const assignReviewer = async (assessmentId, reviewerId) => {
  const response = await axios.post(
    `${server_url}/crat/admin/assessments/${assessmentId}/assign`,
    {
      reviewerId,
    },
    {
      headers,
    },
  );
  return unwrap(response);
};

export const approveAssessment = async (assessmentId, adminDecisionNotes) => {
  const response = await axios.post(
    `${server_url}/crat/admin/assessments/${assessmentId}/approve`,
    {
      adminDecisionNotes,
    },
    {
      headers,
    },
  );
  return unwrap(response);
};

export const rejectAssessment = async (assessmentId, adminDecisionNotes) => {
  const response = await axios.post(
    `${server_url}/crat/admin/assessments/${assessmentId}/reject`,
    {
      adminDecisionNotes,
    },
    {
      headers,
    },
  );
  return unwrap(response);
};

export const getReviewerAssignments = async () => {
  const response = await axios.get(`${server_url}/crat/reviewer/assignments`, {
    headers,
  });
  return unwrap(response) || [];
};

export const saveReviewerScores = async (assessmentId, scores) => {
  const response = await axios.put(
    `${server_url}/crat/reviewer/assessments/${assessmentId}/scores`,
    {
      scores,
    },
    {
      headers,
    },
  );
  return unwrap(response);
};

export const submitReviewerAssessment = async (assessmentId) => {
  const response = await axios.post(
    `${server_url}/crat/reviewer/assessments/${assessmentId}/submit`,
    {},
    {
      headers,
    },
  );
  return unwrap(response);
};

export const getInternalReport = async (businessId) => {
  const response = await axios.get(
    `${server_url}/crat/reports/${businessId}/internal`,
    {
      headers,
    },
  );
  return unwrap(response);
};

export const getPublishedReport = async (businessId) => {
  const response = await axios.get(
    `${server_url}/crat/reports/${businessId}/published`,
    {
      headers,
    },
  );
  return unwrap(response);
};
