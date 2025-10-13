import axios from "axios";
import { headers } from "@/utils/headers";
import { server_url } from "@/utils/endpoint";
import { getUser, storeUser } from "../utils/local_storage";

// Build Authorization headers from current local storage at call time to avoid stale tokens
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getUser() && getUser().ACCESS_TOKEN}`,
});

// Create market data
export const createMarketData = async (data) => {
  try {
    const response = await axios.post(
      `${server_url}/crat_market/create`,
      data,
      { headers: authHeaders() }
    );
    return response.data;
  } catch (error) {
    console.log("Error creating market data:", error);
    throw error;
  }
};

// Fetch market data
export const getMarketData = async () => {
  console.log("marketData: " + headers);
  try {
    const response = await axios.get(`${server_url}/crat_market/data`, {
      headers: authHeaders(),
    });
    return response.data.body;
  } catch (error) {
    console.log("Error fetching market data:", error.response);
    throw error;
  }
};

// Update market data
export const updateMarketData = async (data) => {
  console.log(headers);
  try {
    const response = await axios.post(
      `${server_url}/crat_market/update`,
      data,
      { headers: authHeaders() }
    );
    return response.data;
  } catch (error) {
    console.log("Error updating market data:", error.response);
    throw error;
  }
};

// Update a single market item by uuid (partial patch)
export const updateSingleMarketItem = async (uuid, payload) => {
  try {
    const response = await axios.patch(
      `${server_url}/crat_market/${uuid}`,
      payload,
      { headers: authHeaders() }
    );
    return response.data;
  } catch (error) {
    console.log("Error updating single market item:", error.response || error);
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
      `${server_url}/crat_market/attachment`,
      formData,
      {
        headers: { ...authHeaders(), "Content-Type": "multipart/form-data" },
      }
    );

    return response.data;
  } catch (error) {
    console.log("Error attaching document:", error.response);
    throw error;
  }
};

export const deleteAttachment = async (domain, userId, attachment) => {
  console.log("Deleting attachment:", domain, "userID:" + userId, attachment);
  try {
    const response = await axios.post(
      `${server_url}/crat_market/delete_attachment`,
      { subDomain: domain, userId, attachment },
      { headers: authHeaders() }
    );

    return response.data;
  } catch (error) {
    console.log("Error deleting attachment:", error.response || error.message);
    throw error; // Rethrow the error for further handling if needed
  }
};

export const getInitialDataTemplate = (t) => ({
  market: [
    {
      subDomain: "Demand", // canonical key stored in DB
      label: t("crat.market.assessments.demandSubDomain", "Demand"),
      question: t(
        "crat.market.assessments.demandQuestion",
        "Is there sufficient evidence for demand of your product?"
      ),
      rating: "No",
      score: 0,
      description: t(
        "crat.market.assessments.demandDescription",
        "Industry research reports, Stats citation, # of users"
      ),
      comments: "",
    },
    {
      subDomain: "Market share",
      label: t("crat.market.assessments.marketShareSubDomain", "Market share"),
      question: t(
        "crat.market.assessments.marketShareQuestion",
        "Is the market share growing?"
      ),
      rating: "No",
      score: 0,
      description: t(
        "crat.market.assessments.marketShareDescription",
        "Customer database, Competition reports, Industry reports"
      ),
      comments: "",
    },
  ],
  salesTraction: [
    {
      subDomain: "Sales",
      label: t("crat.market.assessments.salesSubDomain", "Sales"),
      question: t(
        "crat.market.assessments.salesQuestion",
        "Are sales growing on a monthly/quarterly/annual basis?"
      ),
      rating: "No",
      score: 0,
      description: t(
        "crat.market.assessments.salesDescription",
        "One year monthly sales report"
      ),
      comments: "",
    },
    {
      subDomain: "Customer segments",
      label: t(
        "crat.market.assessments.customerSegmentsSubDomain",
        "Customer segments"
      ),
      question: t(
        "crat.market.assessments.customerSegmentsQuestion",
        "Are there customer segments and clear focus?"
      ),
      rating: "No",
      score: 0,
      description: t(
        "crat.market.assessments.customerSegmentsDescription",
        "Customer database"
      ),
      comments: "",
    },
    {
      subDomain: "Payment terms",
      label: t(
        "crat.market.assessments.paymentTermsSubDomain",
        "Payment terms"
      ),
      question: t(
        "crat.market.assessments.paymentTermsQuestion",
        "Are payment terms in favor of the company?"
      ),
      rating: "No",
      score: 0,
      description: t(
        "crat.market.assessments.paymentTermsDescription",
        "Check payment terms, invoices and or customer contracts"
      ),
      comments: "",
    },
    {
      subDomain: "Sales strategy",
      label: t(
        "crat.market.assessments.salesStrategySubDomain",
        "Sales strategy"
      ),
      question: t(
        "crat.market.assessments.salesStrategyQuestion",
        "Is the sales strategy consistent with growth plans?"
      ),
      rating: "No",
      score: 0,
      description: t(
        "crat.market.assessments.salesStrategyDescription",
        "Sales strategy document/Sales pitch/Customers or users or subscribers database"
      ),
      comments: "",
    },
  ],
  product: [
    {
      subDomain: "Product development",
      label: t(
        "crat.market.assessments.productDevelopmentSubDomain",
        "Product development"
      ),
      question: t(
        "crat.market.assessments.productDevelopmentQuestion",
        "Are there clear product road maps?"
      ),
      rating: "No",
      score: 0,
      description: t(
        "crat.market.assessments.productDevelopmentDescription",
        "Product road map"
      ),
      comments: "",
    },
    {
      subDomain: "Product distribution",
      label: t(
        "crat.market.assessments.productDistributionSubDomain",
        "Product distribution"
      ),
      question: t(
        "crat.market.assessments.productDistributionQuestion",
        "Are products properly distributed?"
      ),
      rating: "No",
      score: 0,
      description: t(
        "crat.market.assessments.productDistributionDescription",
        "Check delivery models"
      ),
      comments: "",
    },
    {
      subDomain: "Product pricing basis",
      label: t(
        "crat.market.assessments.productPricingBasisSubDomain",
        "Product pricing basis"
      ),
      question: t(
        "crat.market.assessments.productPricingBasisQuestion",
        "Are products properly priced?"
      ),
      rating: "No",
      score: 0,
      description: t(
        "crat.market.assessments.productPricingBasisDescription",
        "Check pricing strategy/Do comparable analysis of competitors"
      ),
      comments: "",
    },
  ],
  competition: [
    {
      subDomain: "Level of competition",
      label: t(
        "crat.market.assessments.levelOfCompetitionSubDomain",
        "Level of competition"
      ),
      question: t(
        "crat.market.assessments.levelOfCompetitionQuestion",
        "Do you understand the level of competition and have you conducted analysis?"
      ),
      rating: "No",
      score: 0,
      description: t(
        "crat.market.assessments.levelOfCompetitionDescription",
        "Competitors analysis report"
      ),
      comments: "",
    },
    {
      subDomain: "Competitive advantage",
      label: t(
        "crat.market.assessments.competitiveAdvantageSubDomain",
        "Competitive advantage"
      ),
      question: t(
        "crat.market.assessments.competitiveAdvantageQuestion",
        "Does the company have a clear competitive advantage?"
      ),
      rating: "No",
      score: 0,
      description: t(
        "crat.market.assessments.competitiveAdvantageDescription",
        "Value proposition, any other supporting info"
      ),
      comments: "",
    },
  ],
  marketing: [
    {
      subDomain: "Marketing strategy",
      label: t(
        "crat.market.assessments.marketingStrategySubDomain",
        "Marketing strategy"
      ),
      question: t(
        "crat.market.assessments.marketingStrategyQuestion",
        "Is the marketing strategy consistent with growth plans?"
      ),
      rating: "No",
      score: 0,
      description: t(
        "crat.market.assessments.marketingStrategyDescription",
        "Marketing strategy doc vs projections"
      ),
      comments: "",
    },
    {
      subDomain: "Packaging & branding",
      label: t(
        "crat.market.assessments.packagingBrandingSubDomain",
        "Packaging & branding"
      ),
      question: t(
        "crat.market.assessments.packagingBrandingQuestion",
        "Are the company's products properly packed and branded?"
      ),
      rating: "No",
      score: 0,
      description: t(
        "crat.market.assessments.packagingBrandingDescription",
        "Brand guidelines, packaging guidelines, product offering etc"
      ),
      comments: "",
    },
    {
      subDomain: "Product promotion",
      label: t(
        "crat.market.assessments.productPromotionSubDomain",
        "Product promotion"
      ),
      question: t(
        "crat.market.assessments.productPromotionQuestion",
        "Is there a clear promotion strategy?"
      ),
      rating: "No",
      score: 0,
      description: t(
        "crat.market.assessments.productPromotionDescription",
        "Promotion strategy doc vs projections"
      ),
      comments: "",
    },
  ],
});
