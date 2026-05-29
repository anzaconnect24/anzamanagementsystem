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
  files,
) => {
  const formData = new FormData();

  const fileList = Array.isArray(files) ? files : [files];
  fileList.filter(Boolean).forEach((file) => {
    formData.append("files", file);
  });

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

export const deleteAssessmentAttachment = async (
  assessmentId,
  questionId,
  attachmentUrl,
) => {
  const query = new URLSearchParams({ attachmentUrl }).toString();

  const response = await axios.delete(
    `${server_url}/crat/assessments/${assessmentId}/answers/${questionId}/attachment?${query}`,
    {
      headers,
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

export const assignReviewer = async (assessmentId, reviewerIds) => {
  // Accept either a single number (legacy) or an array
  const ids = Array.isArray(reviewerIds) ? reviewerIds : [reviewerIds];
  const response = await axios.post(
    `${server_url}/crat/admin/assessments/${assessmentId}/assign`,
    {
      reviewerIds: ids,
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

// ─── Admin Catalog Management ─────────────────────────────────────────────────

export const getAdminCatalog = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const url = query
    ? `${server_url}/crat/admin/catalog-mgmt?${query}`
    : `${server_url}/crat/admin/catalog-mgmt`;
  const response = await axios.get(url, { headers });
  return unwrap(response) || [];
};

export const createCatalogQuestion = async (data) => {
  const response = await axios.post(
    `${server_url}/crat/admin/catalog-mgmt`,
    data,
    { headers },
  );
  return unwrap(response);
};

export const updateCatalogQuestion = async (questionId, data) => {
  const response = await axios.put(
    `${server_url}/crat/admin/catalog-mgmt/${questionId}`,
    data,
    { headers },
  );
  return unwrap(response);
};

export const toggleCatalogQuestion = async (questionId) => {
  const response = await axios.patch(
    `${server_url}/crat/admin/catalog-mgmt/${questionId}/toggle`,
    {},
    { headers },
  );
  return unwrap(response);
};

export const deleteCatalogQuestion = async (questionId) => {
  const response = await axios.delete(
    `${server_url}/crat/admin/catalog-mgmt/${questionId}`,
    { headers },
  );
  return unwrap(response);
};

export const getAvailableDomains = async () => {
  try {
    const response = await axios.get(`${server_url}/crat/available-domains`, {
      headers,
    });
    return unwrap(response) || [];
  } catch (error) {
    console.error("Failed to fetch available domains:", error);
    return [];
  }
};

// ─── Backend AI Review ────────────────────────────────────────────────────────

export const runAiReview = async (assessmentId) => {
  const response = await axios.post(
    `${server_url}/crat/admin/assessments/${assessmentId}/ai-review`,
    {},
    { headers },
  );
  return unwrap(response);
};
