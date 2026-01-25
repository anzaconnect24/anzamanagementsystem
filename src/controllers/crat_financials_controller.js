import axios from "axios";
import { headers } from "@/utils/headers";
import { server_url } from "@/utils/endpoint";
import { getUser, storeUser } from "../utils/local_storage";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getUser() && getUser().ACCESS_TOKEN}`,
});

// Create financial data
export const createFinancialData = async (data) => {
  console.log("creating financials");
  try {
    const response = await axios.post(
      `${server_url}/crat_financial/create`,
      data,
      { headers: authHeaders() }
    );
    return response.data;
  } catch (error) {
    console.log("Error creating financial data:", error);
    throw error;
  }
};

// Fetch market data
export const getFinancialData = async () => {
  console.log("getting financials");

  try {
    const response = await axios.get(`${server_url}/crat_financial/data`, {
      headers: authHeaders(),
    });
    return response.data.body;
  } catch (error) {
    console.log("Error fetching financial data:", error.response);
    throw error;
  }
};

// Update market data
export const updateFinancialData = async (data) => {
  try {
    const response = await axios.post(
      `${server_url}/crat_financial/update`,
      data,
      { headers: authHeaders() }
    );
    return response.data;
  } catch (error) {
    console.log("Error updating financial data:", error.response);
    throw error;
  }
};

// Attach a document
export const attachDocument = async (data) => {
  try {
    const formData = new FormData();
    formData.append("file", data.file);
    if (data.uuid) formData.append("uuid", data.uuid);
    else if (data.subDomain) formData.append("subDomain", data.subDomain);
    formData.append("userId", data.userId);
    delete data.file;
    delete data.subDomain;
    Object.keys(data).forEach((k) => {
      if (data[k] !== undefined && data[k] !== null)
        formData.append(k, data[k]);
    });
    const response = await axios.post(
      `${server_url}/crat_financial/attachment`,
      formData,
      { headers: { ...authHeaders(), "Content-Type": "multipart/form-data" } }
    );
    return response.data;
  } catch (error) {
    console.log("Error attaching document:", error.response || error.message);
    throw error;
  }
};

export const deleteAttachment = async ({
  uuid,
  subDomain,
  userId,
  attachment,
}) => {
  try {
    const payload = { userId, attachment };
    if (uuid) payload.uuid = uuid;
    else if (subDomain) payload.subDomain = subDomain;
    const response = await axios.post(
      `${server_url}/crat_financial/delete_attachment`,
      payload,
      { headers: authHeaders() }
    );
    return response.data;
  } catch (error) {
    console.log("Error deleting attachment:", error.response || error.message);
    throw error;
  }
};

// Single item patch
export const updateSingleFinancialItem = async (uuid, payload) => {
  try {
    const response = await axios.patch(
      `${server_url}/crat_financial/${uuid}`,
      payload,
      { headers: authHeaders() }
    );
    return response.data;
  } catch (error) {
    console.log(
      "Error updating single financial item:",
      error.response || error
    );
    throw error;
  }
};

export const getInitialDataTemplate = (t) => ({
  profitability: [
    {
      subDomain: "Revenue", // canonical key stored in DB
      label: t("crat.financial.assessments.revenueSubDomain", "Revenue"),
      question: t(
        "crat.financial.assessments.revenueQuestion",
        "Is revenue growing?"
      ),
      rating: t("crat.financial.assessments.ratingNo", "No"),
      score: 0,
      description: t(
        "crat.financial.assessments.revenueDescription",
        "Management accounts"
      ),
      comments: "",
    },
    {
      subDomain: "Cost management",
      label: t(
        "crat.financial.assessments.costManagementSubDomain",
        "Cost management"
      ),
      question: t(
        "crat.financial.assessments.costManagementQuestion",
        "Are unit costs declining?"
      ),
      rating: t("crat.financial.assessments.ratingNo", "No"),
      score: 0,
      description: t(
        "crat.financial.assessments.costManagementDescription",
        "Management accounts/projections"
      ),
      comments: "",
    },
  ],
  balanceSheet: [
    {
      subDomain: "Working capital management",
      label: t(
        "crat.financial.assessments.workingCapitalManagementSubDomain",
        "Working capital management"
      ),
      question: t(
        "crat.financial.assessments.workingCapitalQuestion",
        "Is WC well managed?"
      ),
      rating: t("crat.financial.assessments.ratingNo", "No"),
      score: 0,
      description: t(
        "crat.financial.assessments.workingCapitalDescription",
        "BS-Management accounts/liquidity ratios"
      ),
      comments: "",
    },
    {
      subDomain: "Assets management",
      label: t(
        "crat.financial.assessments.assetsManagementSubDomain",
        "Assets management"
      ),
      question: t(
        "crat.financial.assessments.assetsManagementQuestion",
        "Are assets well managed?"
      ),
      rating: t("crat.financial.assessments.ratingNo", "No"),
      score: 0,
      description: t(
        "crat.financial.assessments.assetsManagementDescription",
        "BS-Management accounts/assets turnover"
      ),
      comments: "",
    },
    {
      subDomain: "Debt manageability",
      label: t(
        "crat.financial.assessments.debtManageabilitySubDomain",
        "Debt manageability"
      ),
      question: t(
        "crat.financial.assessments.debtManageabilityQuestion",
        "Is debt properly managed?"
      ),
      rating: t("crat.financial.assessments.ratingNo", "No"),
      score: 0,
      description: t(
        "crat.financial.assessments.debtManageabilityDescription",
        "D/E ratios, Interest cover, Debt service ratios"
      ),
      comments: "",
    },
    {
      subDomain: "OBS Items",
      label: t("crat.financial.assessments.obsItemsSubDomain", "OBS Items"),
      question: t(
        "crat.financial.assessments.obsItemsQuestion",
        "Are OBS items in favor of the company?"
      ),
      rating: t("crat.financial.assessments.ratingNo", "No"),
      score: 0,
      description: t(
        "crat.financial.assessments.obsItemsDescription",
        "OBS values vis-a-vis on-balance items"
      ),
      comments: "",
    },
  ],
  cashFlows: [
    {
      subDomain: "Operating cash flow",
      label: t(
        "crat.financial.assessments.operatingCashFlowSubDomain",
        "Operating cash flow"
      ),
      question: t(
        "crat.financial.assessments.operatingCashFlowQuestion",
        "Is OCF stable and growing?"
      ),
      rating: t("crat.financial.assessments.ratingNo", "No"),
      score: 0,
      description: t(
        "crat.financial.assessments.operatingCashFlowDescription",
        "Cash flows statement/Cash ratio/burn rate/run way"
      ),
      comments: "",
    },
    {
      subDomain: "Capital expenses",
      label: t(
        "crat.financial.assessments.capitalExpensesSubDomain",
        "Capital expenses"
      ),
      question: t(
        "crat.financial.assessments.capitalExpensesQuestion",
        "Has the company made notable and necessary CAPEX?"
      ),
      rating: t("crat.financial.assessments.ratingNo", "No"),
      score: 0,
      description: t(
        "crat.financial.assessments.capitalExpensesDescription",
        "Investment plans, Changes in Non-current assets"
      ),
      comments: "",
    },
  ],
  projections: [
    {
      subDomain: "Assumptions",
      label: t(
        "crat.financial.assessments.assumptionsSubDomain",
        "Assumptions"
      ),
      question: t(
        "crat.financial.assessments.assumptionsQuestion",
        "Are assumptions realistic (based on existing facts)?"
      ),
      rating: t("crat.financial.assessments.ratingNo", "No"),
      score: 0,
      description: t(
        "crat.financial.assessments.assumptionsDescription",
        "Financial projections"
      ),
      comments: "",
    },
  ],
  financialManagement: [
    {
      subDomain: "Quality of financial records",
      label: t(
        "crat.financial.assessments.qualityOfFinancialRecordsSubDomain",
        "Quality of financial records"
      ),
      question: t(
        "crat.financial.assessments.qualityOfFinancialRecordsQuestion",
        "Does the company have proper financial records?"
      ),
      rating: t("crat.financial.assessments.ratingNo", "No"),
      score: 0,
      description: t(
        "crat.financial.assessments.qualityOfFinancialRecordsDescription",
        "Accounting systems in use"
      ),
      comments: "",
    },
    {
      subDomain: "Financial reporting",
      label: t(
        "crat.financial.assessments.financialReportingSubDomain",
        "Financial reporting"
      ),
      question: t(
        "crat.financial.assessments.financialReportingQuestion",
        "Are financials properly reported?"
      ),
      rating: t("crat.financial.assessments.ratingNo", "No"),
      score: 0,
      description: t(
        "crat.financial.assessments.financialReportingDescription",
        "Accounting systems in use, Financial statements"
      ),
      comments: "",
    },
    {
      subDomain: "Internal controls",
      label: t(
        "crat.financial.assessments.internalControlsSubDomain",
        "Internal controls"
      ),
      question: t(
        "crat.financial.assessments.internalControlsQuestion",
        "Do internal controls exist?"
      ),
      rating: t("crat.financial.assessments.ratingNo", "No"),
      score: 0,
      description: t(
        "crat.financial.assessments.internalControlsDescription",
        "Policies + Adherence to policies"
      ),
      comments: "",
    },
    {
      subDomain: "Tax liability",
      label: t(
        "crat.financial.assessments.taxLiabilitySubDomain",
        "Tax liability"
      ),
      question: t(
        "crat.financial.assessments.taxLiabilityQuestion",
        "Are all taxes fully paid?"
      ),
      rating: t("crat.financial.assessments.ratingNo", "No"),
      score: 0,
      description: t(
        "crat.financial.assessments.taxLiabilityDescription",
        "Tax returns"
      ),
      comments: "",
    },
  ],
});

export const initialDataTemplate = {
  profitability: [
    {
      subDomain: "Revenue",
      question: "Is revenue growing?",
      rating: "No",
      score: 0,
      description: "Management accounts",
      comments: "",
    },
    {
      subDomain: "Cost management",
      question: "Are unit costs declining?",
      rating: "No",
      score: 0,
      description: "Management accounts/projections",
      comments: "",
    },
  ],
  balanceSheet: [
    {
      subDomain: "Working capital management",
      question: "Is WC well managed?",
      rating: "No",
      score: 0,
      description: "BS-Management accounts/liquidity ratios",
      comments: "",
    },
    {
      subDomain: "Assets management",
      question: "Are assets well managed?",
      rating: "No",
      score: 0,
      description: "BS-Management accounts/assets turnover",
      comments: "",
    },
    {
      subDomain: "Debt manageability",
      question: "Is debt properly managed?",
      rating: "No",
      score: 0,
      description: "D/E ratios, Interest cover, Debt service ratios",
      comments: "",
    },
    {
      subDomain: "OBS Items",
      question: "Are OBS items in favor of the company?",
      rating: "No",
      score: 0,
      description: "OBS values vis-a-vis on-balance items",
      comments: "",
    },
  ],
  cashFlows: [
    {
      subDomain: "Operating cash flow",
      question: "Is OCF stable and growing?",
      rating: "No",
      score: 0,
      description: "Cash flows statement/Cash ratio/burn rate/run way",
      comments: "",
    },
    {
      subDomain: "Capital expenses",
      question: "Has the company made notable and necessary CAPEX?",
      rating: "No",
      score: 0,
      description: "Investment plans, Changes in Non-current assets",
      comments: "",
    },
  ],
  projections: [
    {
      subDomain: "Assumptions",
      question: "Are assumptions realistic (based on existing facts)?",
      rating: "No",
      score: 0,
      description: "Financial projections",
      comments: "",
    },
  ],
  financialManagement: [
    {
      subDomain: "Quality of financial records",
      question: "Does the company have proper financial records?",
      rating: "No",
      score: 0,
      description: "Accounting systems in use",
      comments: "",
    },
    {
      subDomain: "Financial reporting",
      question: "Are financials properly reported?",
      rating: "No",
      score: 0,
      description: "Accounting systems in use, Financial statements",
      comments: "",
    },
    {
      subDomain: "Internal controls",
      question: "Do internal controls exist?",
      rating: "No",
      score: 0,
      description: "Policies + Adherence to policies",
      comments: "",
    },
    {
      subDomain: "Tax liability",
      question: "Are all taxes fully paid?",
      rating: "No",
      score: 0,
      description: "Tax returns",
      comments: "",
    },
  ],
};
