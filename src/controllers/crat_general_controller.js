import {
  getInternalReport,
  getPublishedReport,
  getUserBusiness,
} from "./crat_controller";

const resolveBusinessId = async (uuid) => {
  if (!uuid) return null;
  const business = await getUserBusiness(uuid);
  return business?.id || null;
};

export const getScoreData = async ({ uuid }) => {
  const businessId = await resolveBusinessId(uuid);
  if (!businessId) return null;
  const report = await getPublishedReport(businessId);
  return report;
};

export const getReportData = async ({ user_uuid }) => {
  const businessId = await resolveBusinessId(user_uuid);
  if (!businessId) return null;

  try {
    return await getInternalReport(businessId);
  } catch (_) {
    return await getPublishedReport(businessId);
  }
};
