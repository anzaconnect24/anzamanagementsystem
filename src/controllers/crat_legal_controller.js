import axios from "axios";
import { headers } from "@/utils/headers";
import { server_url } from "@/utils/endpoint";
import { getUser, storeUser } from "../utils/local_storage";

// Create financial data
export const createLegalData = async (data) => {
  console.log("creating legal");
  try {
    const response = await axios.post(`${server_url}/crat_legal/create`, data, {
      headers,
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
      headers,
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
      headers,
    });
    return response.data;
  } catch (error) {
    console.log("Error updating legal data:", error.response);
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

    console.log("imepita");

    const response = await axios.post(
      `${server_url}/crat_legal/attachment`,
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
      `${server_url}/crat_legal/delete_attachment`,
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
  corporateDocumentsCompliance: [
    {
      subDomain: t(
        "crat.legal.assessments.businessIncorporationSubDomain",
        "Business incorporation"
      ),
      question: t(
        "crat.legal.assessments.businessIncorporationQuestion",
        "Is the business incorporated/registered?"
      ),
      rating: t("crat.legal.assessments.ratingNo", "No"),
      score: 0,
      description: t(
        "crat.legal.assessments.businessIncorporationDescription",
        "BRELA incorporation Certificate, MEMART"
      ),
      comments: "",
    },
    {
      subDomain: t(
        "crat.legal.assessments.taxIdentificationSubDomain",
        "Tax Identification"
      ),
      question: t(
        "crat.legal.assessments.taxIdentificationQuestion",
        "Does the company have tax identification number?"
      ),
      rating: t("crat.legal.assessments.ratingNo", "No"),
      score: 0,
      description: t(
        "crat.legal.assessments.taxIdentificationDescription",
        "TIN Certificate"
      ),
      comments: "",
    },
    {
      subDomain: t(
        "crat.legal.assessments.taxComplianceSubDomain",
        "Tax compliance"
      ),
      question: t(
        "crat.legal.assessments.taxComplianceQuestion",
        "Is the business up to date with the required taxes?"
      ),
      rating: t("crat.legal.assessments.ratingNo", "No"),
      score: 0,
      description: t(
        "crat.legal.assessments.taxComplianceDescription",
        "Current tax fillings"
      ),
      comments: "",
    },
    {
      subDomain: t(
        "crat.legal.assessments.businessLicenceSubDomain",
        "Business Licence"
      ),
      question: t(
        "crat.legal.assessments.businessLicenceQuestion",
        "Does the business have required licenses?"
      ),
      rating: t("crat.legal.assessments.ratingNo", "No"),
      score: 0,
      description: t(
        "crat.legal.assessments.businessLicenceDescription",
        "Business licence certificate"
      ),
      comments: "",
    },
    {
      subDomain: t(
        "crat.legal.assessments.sectorSpecificComplianceSubDomain",
        "Sector specific compliance"
      ),
      question: t(
        "crat.legal.assessments.sectorSpecificComplianceQuestion",
        "Does the company have other certifications per the respective industry regulations?"
      ),
      rating: t("crat.legal.assessments.ratingNo", "No"),
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
      subDomain: t(
        "crat.legal.assessments.leaseAgreementsSubDomain",
        "Lease agreements"
      ),
      question: t(
        "crat.legal.assessments.leaseAgreementsQuestion",
        "Are lease agreements available and clear?"
      ),
      rating: t("crat.legal.assessments.ratingNo", "No"),
      score: 0,
      description: t(
        "crat.legal.assessments.leaseAgreementsDescription",
        "Contract"
      ),
      comments: "",
    },
    {
      subDomain: t(
        "crat.legal.assessments.customerContractsSubDomain",
        "Customer contracts"
      ),
      question: t(
        "crat.legal.assessments.customerContractsQuestion",
        "Are customer agreements available and clear?"
      ),
      rating: t("crat.legal.assessments.ratingNo", "No"),
      score: 0,
      description: t(
        "crat.legal.assessments.customerContractsDescription",
        "Contract"
      ),
      comments: "",
    },
    {
      subDomain: t(
        "crat.legal.assessments.supplierContractsSubDomain",
        "Supplier contracts"
      ),
      question: t(
        "crat.legal.assessments.supplierContractsQuestion",
        "Are supplier agreements available and clear?"
      ),
      rating: t("crat.legal.assessments.ratingNo", "No"),
      score: 0,
      description: t(
        "crat.legal.assessments.supplierContractsDescription",
        "Contract"
      ),
      comments: "",
    },
    {
      subDomain: t(
        "crat.legal.assessments.employeesContractsSubDomain",
        "Employees contracts"
      ),
      question: t(
        "crat.legal.assessments.employeesContractsQuestion",
        "Do employees have contracts (including the founders)?"
      ),
      rating: t("crat.legal.assessments.ratingNo", "No"),
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
      subDomain: t(
        "crat.legal.assessments.ipOwnershipSubDomain",
        "IP ownership"
      ),
      question: t(
        "crat.legal.assessments.ipOwnershipQuestion",
        "Does the company own copyrights to its source codes/or patent to its solution?"
      ),
      rating: t("crat.legal.assessments.ratingNo", "No"),
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
      subDomain: t(
        "crat.legal.assessments.entrepreneurialCharacterSubDomain",
        "Entrepreneurial character"
      ),
      question: t(
        "crat.legal.assessments.entrepreneurialCharacterQuestion",
        "Is the entrepreneur adaptable, resilient, and reliable?"
      ),
      rating: t("crat.legal.assessments.ratingNo", "No"),
      score: 0,
      description: t(
        "crat.legal.assessments.entrepreneurialCharacterDescription",
        "Track record, pitch, innovation in business"
      ),
      comments: "",
    },
    {
      subDomain: t(
        "crat.legal.assessments.personalLegalLiabilitySubDomain",
        "Personal legal liability"
      ),
      question: t(
        "crat.legal.assessments.personalLegalLiabilityQuestion",
        "Does the management team have any personal liability that would affect the company?"
      ),
      rating: t("crat.legal.assessments.ratingNo", "No"),
      score: 0,
      description: t(
        "crat.legal.assessments.personalLegalLiabilityDescription",
        "Credit reports"
      ),
      comments: "",
    },
    {
      subDomain: t(
        "crat.legal.assessments.successionPlanSubDomain",
        "Succession plan"
      ),
      question: t(
        "crat.legal.assessments.successionPlanQuestion",
        "Does the succession plan exist?"
      ),
      rating: t("crat.legal.assessments.ratingNo", "No"),
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
      subDomain: t(
        "crat.legal.assessments.boardOfDirectorsSubDomain",
        "Board of directors"
      ),
      question: t(
        "crat.legal.assessments.boardOfDirectorsQuestion",
        "Does the company have an active BOD?"
      ),
      rating: t("crat.legal.assessments.ratingNo", "No"),
      score: 0,
      description: t(
        "crat.legal.assessments.boardOfDirectorsDescription",
        "List of board members + CVs"
      ),
      comments: "",
    },
  ],
});
