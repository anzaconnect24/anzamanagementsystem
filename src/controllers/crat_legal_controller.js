import axios from "axios";
import { headers } from "@/utils/headers";
import { server_url } from "@/utils/endpoint";
import { getUser, storeUser } from "../utils/local_storage";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getUser() && getUser().ACCESS_TOKEN}`,
});

// Create financial data
export const createLegalData = async (data) => {
  console.log("creating legal");
  try {
    const response = await axios.post(`${server_url}/crat_legal/create`, data, {
      headers: authHeaders(),
    });
    return response.data;
  } catch (error) {
    console.log("Error creating legal data:", error);
    throw error;
  }
};

// Fetch market data
export const getLegalData = async () => {
  console.log("getting legal");

  try {
    const response = await axios.get(`${server_url}/crat_legal/data`, {
      headers: authHeaders(),
    });
    return response.data.body;
  } catch (error) {
    console.log("Error fetching legal data:", error.response);
    throw error;
  }
};

// Update market data
export const updateLegalData = async (data) => {
  try {
    const response = await axios.post(`${server_url}/crat_legal/update`, data, {
      headers: authHeaders(),
    });
    return response.data;
  } catch (error) {
    console.log("Error updating legal data:", error.response);
    throw error;
  }
};

// Attach a document
export const attachDocument = async (data) => {
  try {
    const formData = new FormData();
    formData.append("file", data.file);
    if (data.uuid) {
      formData.append("uuid", data.uuid);
    } else if (data.subDomain) {
      // legacy fallback
      formData.append("subDomain", data.subDomain);
    }
    formData.append("userId", data.userId);

    // Remove fields we manually appended
    delete data.file;
    delete data.subDomain;

    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key]);
      }
    });

    const response = await axios.post(
      `${server_url}/crat_legal/attachment`,
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
      `${server_url}/crat_legal/delete_attachment`,
      payload,
      { headers: authHeaders() }
    );
    return response.data;
  } catch (error) {
    console.log("Error deleting attachment:", error.response || error.message);
    throw error;
  }
};

export const getInitialDataTemplate = (t) => ({
  corporateDocumentsCompliance: [
    {
      subDomain: "Business incorporation",
      label: t(
        "crat.legal.assessments.businessIncorporationSubDomain",
        "Business incorporation"
      ),
      question: t(
        "crat.legal.assessments.businessIncorporationQuestion",
        "Is the business incorporated/registered?"
      ),
      rating: "No",
      score: 0,
      description: t(
        "crat.legal.assessments.businessIncorporationDescription",
        "BRELA incorporation Certificate, MEMART"
      ),
      comments: "",
    },
    {
      subDomain: "Tax Identification",
      label: t(
        "crat.legal.assessments.taxIdentificationSubDomain",
        "Tax Identification"
      ),
      question: t(
        "crat.legal.assessments.taxIdentificationQuestion",
        "Does the company have tax identification number?"
      ),
      rating: "No",
      score: 0,
      description: t(
        "crat.legal.assessments.taxIdentificationDescription",
        "TIN Certificate"
      ),
      comments: "",
    },
    {
      subDomain: "Tax compliance",
      label: t(
        "crat.legal.assessments.taxComplianceSubDomain",
        "Tax compliance"
      ),
      question: t(
        "crat.legal.assessments.taxComplianceQuestion",
        "Is the business up to date with the required taxes?"
      ),
      rating: "No",
      score: 0,
      description: t(
        "crat.legal.assessments.taxComplianceDescription",
        "Current tax fillings"
      ),
      comments: "",
    },
    {
      subDomain: "Business Licence",
      label: t(
        "crat.legal.assessments.businessLicenceSubDomain",
        "Business Licence"
      ),
      question: t(
        "crat.legal.assessments.businessLicenceQuestion",
        "Does the business have required licenses?"
      ),
      rating: "No",
      score: 0,
      description: t(
        "crat.legal.assessments.businessLicenceDescription",
        "Business licence certificate"
      ),
      comments: "",
    },
    {
      subDomain: "Sector specific compliance",
      label: t(
        "crat.legal.assessments.sectorSpecificComplianceSubDomain",
        "Sector specific compliance"
      ),
      question: t(
        "crat.legal.assessments.sectorSpecificComplianceQuestion",
        "Does the company have other certifications per the respective industry regulations?"
      ),
      rating: "No",
      score: 0,
      description: t(
        "crat.legal.assessments.sectorSpecificComplianceDescription",
        "BOT Licence etc"
      ),
      comments: "",
    },
  ],
  contractsAgreements: [
    {
      subDomain: "Lease agreements",
      label: t(
        "crat.legal.assessments.leaseAgreementsSubDomain",
        "Lease agreements"
      ),
      question: t(
        "crat.legal.assessments.leaseAgreementsQuestion",
        "Are lease agreements available and clear?"
      ),
      rating: "No",
      score: 0,
      description: t(
        "crat.legal.assessments.leaseAgreementsDescription",
        "Contract"
      ),
      comments: "",
    },
    {
      subDomain: "Customer contracts",
      label: t(
        "crat.legal.assessments.customerContractsSubDomain",
        "Customer contracts"
      ),
      question: t(
        "crat.legal.assessments.customerContractsQuestion",
        "Are customer agreements available and clear?"
      ),
      rating: "No",
      score: 0,
      description: t(
        "crat.legal.assessments.customerContractsDescription",
        "Contract"
      ),
      comments: "",
    },
    {
      subDomain: "Supplier contracts",
      label: t(
        "crat.legal.assessments.supplierContractsSubDomain",
        "Supplier contracts"
      ),
      question: t(
        "crat.legal.assessments.supplierContractsQuestion",
        "Are supplier agreements available and clear?"
      ),
      rating: "No",
      score: 0,
      description: t(
        "crat.legal.assessments.supplierContractsDescription",
        "Contract"
      ),
      comments: "",
    },
    {
      subDomain: "Employees contracts",
      label: t(
        "crat.legal.assessments.employeesContractsSubDomain",
        "Employees contracts"
      ),
      question: t(
        "crat.legal.assessments.employeesContractsQuestion",
        "Do employees have contracts (including the founders)?"
      ),
      rating: "No",
      score: 0,
      description: t(
        "crat.legal.assessments.employeesContractsDescription",
        "Contract"
      ),
      comments: "",
    },
  ],
  intellectualProperty: [
    {
      subDomain: "IP ownership",
      label: t("crat.legal.assessments.ipOwnershipSubDomain", "IP ownership"),
      question: t(
        "crat.legal.assessments.ipOwnershipQuestion",
        "Does the company own copyrights to its source codes/or patent to its solution?"
      ),
      rating: "No",
      score: 0,
      description: t(
        "crat.legal.assessments.ipOwnershipDescription",
        "Copyrights"
      ),
      comments: "",
    },
  ],
  entrepreneurFamily: [
    {
      subDomain: "Entrepreneurial character",
      label: t(
        "crat.legal.assessments.entrepreneurialCharacterSubDomain",
        "Entrepreneurial character"
      ),
      question: t(
        "crat.legal.assessments.entrepreneurialCharacterQuestion",
        "Is the entrepreneur adaptable, resilient, and reliable?"
      ),
      rating: "No",
      score: 0,
      description: t(
        "crat.legal.assessments.entrepreneurialCharacterDescription",
        "Track record, pitch, innovation in business"
      ),
      comments: "",
    },
    {
      subDomain: "Personal legal liability",
      label: t(
        "crat.legal.assessments.personalLegalLiabilitySubDomain",
        "Personal legal liability"
      ),
      question: t(
        "crat.legal.assessments.personalLegalLiabilityQuestion",
        "Does the management team have any personal liability that would affect the company?"
      ),
      rating: "No",
      score: 0,
      description: t(
        "crat.legal.assessments.personalLegalLiabilityDescription",
        "Credit reports"
      ),
      comments: "",
    },
    {
      subDomain: "Succession plan",
      label: t(
        "crat.legal.assessments.successionPlanSubDomain",
        "Succession plan"
      ),
      question: t(
        "crat.legal.assessments.successionPlanQuestion",
        "Does the succession plan exist?"
      ),
      rating: "No",
      score: 0,
      description: t(
        "crat.legal.assessments.successionPlanDescription",
        "Succession plans/Contracts/JD"
      ),
      comments: "",
    },
  ],
  corporateGovernance: [
    {
      subDomain: "Board of directors",
      label: t(
        "crat.legal.assessments.boardOfDirectorsSubDomain",
        "Board of directors"
      ),
      question: t(
        "crat.legal.assessments.boardOfDirectorsQuestion",
        "Does the company have an active BOD?"
      ),
      rating: "No",
      score: 0,
      description: t(
        "crat.legal.assessments.boardOfDirectorsDescription",
        "List of board members + CVs"
      ),
      comments: "",
    },
  ],
});

// Single item patch
export const updateSingleLegalItem = async (uuid, payload) => {
  try {
    const response = await axios.patch(
      `${server_url}/crat_legal/${uuid}`,
      payload,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.log("Error updating single legal item:", error.response || error);
    throw error;
  }
};
