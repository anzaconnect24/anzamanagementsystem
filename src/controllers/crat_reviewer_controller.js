import {
  getCurrentAssessment,
  getReviewerAssignments,
  saveReviewerScores,
  submitReviewerAssessment,
} from "./crat_controller";

export const initialData = {};

export const getApplicationList = async () => {
  const assignments = await getReviewerAssignments();
  return (assignments || []).map((item) => ({
    id: item.business_id,
    name: item.entrepreneur?.name || "Entrepreneur",
    totalPercentage: 0,
    readiness: item.status,
    reviewCount: 1,
    assessmentId: item.id,
  }));
};

export const getReport = async (businessId) => {
  const current = await getCurrentAssessment(businessId);
  return {
    status: true,
    body: (current?.answers || []).map((answer) => ({
      subDomain: answer.questionCode,
      score: answer.score || 0,
      comments: answer.entrepreneurComment || "",
      reviewer_comment: answer.reviewerComment || "",
      attachment: answer.evidence || null,
    })),
  };
};

export const publishChanges = async ({ assessmentId, scores }) => {
  return saveReviewerScores(assessmentId, scores || []);
};

export const publishUser = async ({ assessmentId }) => {
  return submitReviewerAssessment(assessmentId);
};
