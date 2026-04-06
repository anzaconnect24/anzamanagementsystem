import axios from "axios";
import { server_url } from "@/utils/endpoint";
import { headers } from "@/utils/headers";

const api = axios.create({
  baseURL: server_url,
  headers,
});

const unwrap = (response) => response?.data?.body;

export const getUserBusiness = async (userUuid) => {
  const response = await api.get(`/user/${userUuid}/business`);
  const payload = unwrap(response);
  return payload?.Business || null;
};

export const getCatalog = async (businessId) => {
  const response = await api.get(`/crat/catalog/${businessId}`);
  return unwrap(response);
};

export const getCurrentAssessment = async (businessId) => {
  const response = await api.get(`/crat/assessments/${businessId}/current`);
  return unwrap(response);
};

export const saveAssessmentAnswers = async (assessmentId, answers) => {
  const response = await api.put(`/crat/assessments/${assessmentId}/answers`, {
    answers,
  });
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
  const response = await api.post(`/crat/assessments/${assessmentId}/submit`);
  return unwrap(response);
};

export const getAdminQueue = async (
  status = "submitted|assigned|review_submitted",
) => {
  const response = await api.get(`/crat/admin/queue?status=${status}`);
  return unwrap(response) || [];
};

export const assignReviewer = async (assessmentId, reviewerId) => {
  const response = await api.post(
    `/crat/admin/assessments/${assessmentId}/assign`,
    {
      reviewerId,
    },
  );
  return unwrap(response);
};

export const approveAssessment = async (assessmentId, adminDecisionNotes) => {
  const response = await api.post(
    `/crat/admin/assessments/${assessmentId}/approve`,
    {
      adminDecisionNotes,
    },
  );
  return unwrap(response);
};

export const rejectAssessment = async (assessmentId, adminDecisionNotes) => {
  const response = await api.post(
    `/crat/admin/assessments/${assessmentId}/reject`,
    {
      adminDecisionNotes,
    },
  );
  return unwrap(response);
};

export const getReviewerAssignments = async () => {
  const response = await api.get(`/crat/reviewer/assignments`);
  return unwrap(response) || [];
};

export const saveReviewerScores = async (assessmentId, scores) => {
  const response = await api.put(
    `/crat/reviewer/assessments/${assessmentId}/scores`,
    {
      scores,
    },
  );
  return unwrap(response);
};

export const submitReviewerAssessment = async (assessmentId) => {
  const response = await api.post(
    `/crat/reviewer/assessments/${assessmentId}/submit`,
  );
  return unwrap(response);
};

export const getInternalReport = async (businessId) => {
  const response = await api.get(`/crat/reports/${businessId}/internal`);
  return unwrap(response);
};

export const getPublishedReport = async (businessId) => {
  const response = await api.get(`/crat/reports/${businessId}/published`);
  return unwrap(response);
};
