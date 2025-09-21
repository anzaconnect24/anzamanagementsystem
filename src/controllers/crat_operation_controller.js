import axios from "axios";
import { headers } from "@/utils/headers";
import { server_url } from "@/utils/endpoint";
import { getUser, storeUser } from "../utils/local_storage";

// Create financial data
export const createOperationData = async (data) => {
  console.log("creating operations");
  try {
    const response = await axios.post(
      `${server_url}/crat_operation/create`,
      data,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.log("Error creating operation data:", error);
    throw error;
  }
};

// Fetch market data
export const getOperationData = async () => {
  console.log("getting operations");

  try {
    const response = await axios.get(`${server_url}/crat_operation/data`, {
      headers,
    });
    return response.data.body;
  } catch (error) {
    console.log("Error fetching operation data:", error.response);
    throw error;
  }
};

// Update market data
export const updateOperationData = async (data) => {
  try {
    const response = await axios.post(
      `${server_url}/crat_operation/update`,
      data,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.log("Error updating operation data:", error.response);
    throw error;
  }
};

// Attach a document
export const attachDocument = async (data) => {
  console.log(data);
  try {
    const formData = new FormData();
    formData.append("file", data.file);
    formData.append("subDomain", data.subDomain);
    formData.append("userId", data.userId);
    delete data.file;
    delete data.subDomain; // Remove file and subDomain from the data object

    Object.keys(data).forEach((key) => {
      formData.append(key, data[key]);
    });

    const response = await axios.post(
      `${server_url}/crat_operation/attachment`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${getUser().ACCESS_TOKEN}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.log("Error attaching document:", error.response);
    throw error;
  }
};

export const deleteAttachment = async (domain, userId, attachment) => {
  try {
    const response = await axios.post(
      `${server_url}/crat_operation/delete_attachment`,
      {
        subDomain: domain,
        userId,
        attachment,
      },
      {
        headers,
      }
    );

    return response.data;
  } catch (error) {
    console.log("Error deleting attachment:", error.response || error.message);
    throw error; // Rethrow the error for further handling if needed
  }
};

export const getInitialDataTemplate = (t) => ({
  managementCapacity: [
    {
      subDomain: t(
        "crat.operations.assessments.visionClaritySubDomain",
        "Vision clarity"
      ),
      question: t(
        "crat.operations.assessments.visionClarityQuestion",
        "Is the vision clear?"
      ),
      rating: t("crat.operations.assessments.ratingNo", "No"),
      score: 0,
      description: t(
        "crat.operations.assessments.visionClarityDescription",
        "Vision statement"
      ),
      comments: "",
    },
    {
      subDomain: t(
        "crat.operations.assessments.managementStructureSubDomain",
        "Management structure"
      ),
      question: t(
        "crat.operations.assessments.managementStructureQuestion",
        "Is the management structure clear?"
      ),
      rating: t("crat.operations.assessments.ratingNo", "No"),
      score: 0,
      description: t(
        "crat.operations.assessments.managementStructureDescription",
        "Organogram"
      ),
      comments: "",
    },
    {
      subDomain: t(
        "crat.operations.assessments.trackRecordSubDomain",
        "Track record"
      ),
      question: t(
        "crat.operations.assessments.trackRecordQuestion",
        "Does the team have credible track record?"
      ),
      rating: t("crat.operations.assessments.ratingNo", "No"),
      score: 0,
      description: t(
        "crat.operations.assessments.trackRecordDescription",
        "Management CVs"
      ),
      comments: "",
    },
    {
      subDomain: t(
        "crat.operations.assessments.managementCommitmentSubDomain",
        "Management commitment"
      ),
      question: t(
        "crat.operations.assessments.managementCommitmentQuestion",
        "Is the management fully committed?"
      ),
      rating: t("crat.operations.assessments.ratingNo", "No"),
      score: 0,
      description: t(
        "crat.operations.assessments.managementCommitmentDescription",
        "Works schedules and contracts"
      ),
      comments: "",
    },
    {
      subDomain: t(
        "crat.operations.assessments.teamCapacitySubDomain",
        "Team capacity"
      ),
      question: t(
        "crat.operations.assessments.teamCapacityQuestion",
        "Does the team have relevant technical competence?"
      ),
      rating: t("crat.operations.assessments.ratingNo", "No"),
      score: 0,
      description: t(
        "crat.operations.assessments.teamCapacityDescription",
        "CVs"
      ),
      comments: "",
    },
    {
      subDomain: t(
        "crat.operations.assessments.performanceMeasurementSubDomain",
        "Performance measurement"
      ),
      question: t(
        "crat.operations.assessments.performanceMeasurementQuestion",
        "Is performance measured?"
      ),
      rating: t("crat.operations.assessments.ratingNo", "No"),
      score: 0,
      description: t(
        "crat.operations.assessments.performanceMeasurementDescription",
        "KPIs"
      ),
      comments: "",
    },
    {
      subDomain: t(
        "crat.operations.assessments.professionalDevelopmentSubDomain",
        "Professional development"
      ),
      question: t(
        "crat.operations.assessments.professionalDevelopmentQuestion",
        "Does the company have a proper PD and or on-job training?"
      ),
      rating: t("crat.operations.assessments.ratingNo", "No"),
      score: 0,
      description: t(
        "crat.operations.assessments.professionalDevelopmentDescription",
        "Organization PD plans/Job training modules"
      ),
      comments: "",
    },
  ],
  mis: [
    {
      subDomain: t(
        "crat.operations.assessments.dataManagementSubDomain",
        "Data management"
      ),
      question: t(
        "crat.operations.assessments.dataManagementQuestion",
        "Is data collected and properly managed?"
      ),
      rating: t("crat.operations.assessments.ratingNo", "No"),
      score: 0,
      description: t(
        "crat.operations.assessments.dataManagementDescription",
        "Data protection policy"
      ),
      comments: "",
    },
    {
      subDomain: t(
        "crat.operations.assessments.systemUsedSubDomain",
        "System used"
      ),
      question: t(
        "crat.operations.assessments.systemUsedQuestion",
        "Is there an MIS for handling organization operations?"
      ),
      rating: t("crat.operations.assessments.ratingNo", "No"),
      score: 0,
      description: t(
        "crat.operations.assessments.systemUsedDescription",
        "MIS"
      ),
      comments: "",
    },
    {
      subDomain: t(
        "crat.operations.assessments.systemEffectivenessSubDomain",
        "System effectiveness"
      ),
      question: t(
        "crat.operations.assessments.systemEffectivenessQuestion",
        "Is the MIS used effective?"
      ),
      rating: t("crat.operations.assessments.ratingNo", "No"),
      score: 0,
      description: t(
        "crat.operations.assessments.systemEffectivenessDescription",
        "MIS"
      ),
      comments: "",
    },
  ],
  qualityManagement: [
    {
      subDomain: t(
        "crat.operations.assessments.qualityControlSubDomain",
        "Quality control"
      ),
      question: t(
        "crat.operations.assessments.qualityControlQuestion",
        "Is quality check a norm at the company?"
      ),
      rating: t("crat.operations.assessments.ratingNo", "No"),
      score: 0,
      description: t(
        "crat.operations.assessments.qualityControlDescription",
        "Quality manuals, quality control reports"
      ),
      comments: "",
    },
    {
      subDomain: t(
        "crat.operations.assessments.qualityManagementTeamSubDomain",
        "Quality management team"
      ),
      question: t(
        "crat.operations.assessments.qualityManagementTeamQuestion",
        "Are there personnel in charge of quality control?"
      ),
      rating: t("crat.operations.assessments.ratingNo", "No"),
      score: 0,
      description: t(
        "crat.operations.assessments.qualityManagementTeamDescription",
        "JD"
      ),
      comments: "",
    },
  ],
  overallOperations: [
    {
      subDomain: t(
        "crat.operations.assessments.platformUtilizationSubDomain",
        "Platform utilization"
      ),
      question: t(
        "crat.operations.assessments.platformUtilizationQuestion",
        "Is the platform optimally utilized?"
      ),
      rating: t("crat.operations.assessments.ratingNo", "No"),
      score: 0,
      description: t(
        "crat.operations.assessments.platformUtilizationDescription",
        "Actual vis-a-vis ideal"
      ),
      comments: "",
    },
    {
      subDomain: t(
        "crat.operations.assessments.customerRelationsSubDomain",
        "Customer relations"
      ),
      question: t(
        "crat.operations.assessments.customerRelationsQuestion",
        "Is customer relationship management organized?"
      ),
      rating: t("crat.operations.assessments.ratingNo", "No"),
      score: 0,
      description: t(
        "crat.operations.assessments.customerRelationsDescription",
        "CRM/Platform/MIS/Automated Real-Time Responses"
      ),
      comments: "",
    },
  ],
  strategyPlanning: [
    {
      subDomain: t(
        "crat.operations.assessments.businessStrategySubDomain",
        "Business strategy"
      ),
      question: t(
        "crat.operations.assessments.businessStrategyQuestion",
        "Does the company have a business strategy?"
      ),
      rating: t("crat.operations.assessments.ratingNo", "No"),
      score: 0,
      description: t(
        "crat.operations.assessments.businessStrategyDescription",
        "Strategy documents"
      ),
      comments: "",
    },
    {
      subDomain: t(
        "crat.operations.assessments.organizationPlanningSubDomain",
        "Organization Planning"
      ),
      question: t(
        "crat.operations.assessments.organizationPlanningQuestion",
        "Is there a formal planning process?"
      ),
      rating: t("crat.operations.assessments.ratingNo", "No"),
      score: 0,
      description: t(
        "crat.operations.assessments.organizationPlanningDescription",
        "Planning doc/tool"
      ),
      comments: "",
    },
  ],
});
