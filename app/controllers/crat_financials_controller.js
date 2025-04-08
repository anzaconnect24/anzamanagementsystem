import axios from "axios";
import { headers } from "@/app/utils/headers";
import { server_url } from "@/app/utils/endpoint";
import { getUser, storeUser } from "../utils/local_storage"; 


// Create financial data
export const createFinancialData = async (data) => {
    console.log('creating financials');
    try {
        const response = await axios.post(`${server_url}/crat_financial/create`, data, { headers });
        return response.data;
    } catch (error) {
        console.log('Error creating financial data:', error);
        throw error;
    }
};

// Fetch market data
export const getFinancialData = async () => {
    console.log('getting financials');

    try {
        const response = await axios.get(`${server_url}/crat_financial/data`, { headers });
        return response.data.body;
    } catch (error) {
        console.log('Error fetching financial data:', error.response);
        throw error;
    }
};

// Update market data
export const updateFinancialData = async (data) => {
    try {
        const response = await axios.post(`${server_url}/crat_financial/update`, data, { headers });
        return response.data;
    } catch (error) {
        console.log('Error updating financial data:', error.response);
        throw error;
    }
};

// Attach a document
export const attachDocument = async (data) => {
    console.log(data);
    try {
        const formData = new FormData();
        formData.append('file', data.file);
        formData.append('subDomain', data.subDomain);
        formData.append('userId', data.userId);
        delete data.file;
        delete data.subDomain; // Remove file and subDomain from the data object

        Object.keys(data).forEach((key) => {
            formData.append(key, data[key]);
        });

        console.log('imepita');


        const response = await axios.post(`${server_url}/crat_financial/attachment`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${getUser().ACCESS_TOKEN}`
            },
        });

        return response.data;
    } catch (error) {
        console.log('Error attaching document:', error.response);
        throw error;
    }
};

export const deleteAttachment = async (domain, userId, attachment) => {
    try {
        const response = await axios.post(`${server_url}/crat_financial/delete_attachment`, {
            subDomain: domain,
            userId,
            attachment
        }, {
            headers
        });
        return response.data;
    } catch (error) {
        console.log('Error deleting attachment:', error.response || error.message);
        throw error; // Rethrow the error for further handling if needed
    }
};

export   const initialDataTemplate = {
    profitability: [
      { subDomain: "Revenue", question: "Is revenue growing?", rating: "No", score: 0, description: "Management accounts", comments: "" },
      { subDomain: "Cost management", question: "Are unit costs declining?", rating: "No", score: 0, description: "Management accounts/projections",  comments: "" },
    ],
    balanceSheet: [
      { subDomain: "Working capital management", question: "Is WC well managed?", rating: "No", score: 0, description: "BS-Management accounts/liquidity ratios",  comments: "" },
      { subDomain: "Assets management", question: "Are assets well managed?", rating: "No", score: 0, description: "BS-Management accounts/assets turnover", comments: "" },
      { subDomain: "Debt manageability", question: "Is debt properly managed?", rating: "No", score: 0, description: "D/E ratios, Interest cover, Debt service ratios", comments: "" },
      { subDomain: "OBS Items", question: "Are OBS items in favor of the company?", rating: "No", score: 0, description: "OBS values vis-a-vis on-balance items", comments: "" },
    ],
    cashFlows: [
      { subDomain: "Operating cash flow", question: "Is OCF stable and growing?", rating: "No", score: 0, description: "Cash flows statement/Cash ratio/burn rate/run way", comments: "" },
      { subDomain: "Capital expenses", question: "Has the company made notable and necessary CAPEX?", rating: "No", score: 0, description: "Investment plans, Changes in Non-current assets", comments: "" },
    ],
    projections: [
      { subDomain: "Assumptions", question: "Are assumptions realistic (based on existing facts)?", rating: "No", score: 0, description: "Financial projections", comments: "" },
    ],
    financialManagement: [
      { subDomain: "Quality of financial records", question: "Does the company have proper financial records?", rating: "No", score: 0, description: "Accounting systems in use", comments: "" },
      { subDomain: "Financial reporting", question: "Are financials properly reported?", rating: "No", score: 0, description: "Accounting systems in use, Financial statements", comments: "" },
      { subDomain: "Internal controls", question: "Do internal controls exist?", rating: "No", score: 0, description: "Policies + Adherance to policies", comments: "" },
      { subDomain: "Tax liability", question: "Are all taxes fully paid?", rating: "No", score: 0, description: "Tax returns", comments: "" },
    ],
  };


  
  

