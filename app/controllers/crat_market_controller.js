import axios from "axios";
import { headers } from "@/app/utils/headers";
import { server_url } from "@/app/utils/endpoint";
import { getUser, storeUser } from "../utils/local_storage"; 


// Create market data
export const createMarketData = async (data) => {
    try {
        const response = await axios.post(`${server_url}/crat_market/create`, data, { headers });
        return response.data;
    } catch (error) {
        console.log('Error creating market data:', error);
        throw error;
    }
};

// Fetch market data
export const getMarketData = async () => {
    console.log('marketData: ' + headers);
    try {
        const response = await axios.get(`${server_url}/crat_market/data`, { headers });
        return response.data.body;
    } catch (error) {
        console.log('Error fetching market data:', error.response);
        throw error;
    }
};

// Update market data
export const updateMarketData = async (data) => {
    console.log(headers);
    try {
        const response = await axios.post(`${server_url}/crat_market/update`, data, { headers });
        return response.data;
    } catch (error) {
        console.log('Error updating market data:', error.response);
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

        const response = await axios.post(`${server_url}/crat_market/attachment`, formData, {
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
    console.log('Deleting attachment:', domain, 'userID:' + userId, attachment);
    try {
        const response = await axios.post(`${server_url}/crat_market/delete_attachment`, {
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
    market: [
      { subDomain: "Demand", question: "Is there sufficient evidence for demand of your product?", rating: "No", score: 0, description: "Industry research reports, Stats citation, # of users", comments: "" },
      { subDomain: "Market share", question: "Is the market share growing?", rating: "No", score: 0, description: "Customer database, Competition reports, Industry reports", comments: "" },
    ],
    salesTraction: [
      { subDomain: "Sales", question: "Are sales growing on a monthly/quarterly/annual basis?", rating: "No", score: 0, description: "One year monthly sales report", comments: "" },
      { subDomain: "Customer segments", question: "Are there customer segments and clear focus?", rating: "No", score: 0, description: "Customer database", comments: "" },
      { subDomain: "Payment terms", question: "Are payment terms in favor of the company?", rating: "No", score: 0, description: "Check payment terms, invoices and or customer contracts", comments: "" },
      { subDomain: "Sales strategy", question: "Is the sales strategy consistent with growth plans?", rating: "No", score: 0, description: "Sales strategy document/Sales pitch/Customers or users or subscribers database", comments: "" },
    ],
    product: [
      { subDomain: "Product development", question: "Are there clear product road maps?", rating: "No", score: 0, description: "Product road map", comments: "" },
      { subDomain: "Product distribution", question: "Are products properly distributed?", rating: "No", score: 0, description: "Check delivery models", comments: "" },
      { subDomain: "Product pricing basis", question: "Are products properly priced?", rating: "No", score: 0, description: "Check pricing strategy/Do comparable analysis of competitors", comments: "" },
    ],
    competition: [
      { subDomain: "Level of competition", question: "Do you understand the level of competition and have you conducted analysis?", rating: "No", score: 0, description: "Competitors analysis report", comments: "" },
      { subDomain: "Competitive advantage", question: "Does the company have a clear competitive advantage?", rating: "No", score: 0, description: "Value proposition, any other supporting info", comments: "" },
    ],
    marketing: [
      { subDomain: "Marketing strategy", question: "Is the marketing strategy consistent with growth plans?", rating: "No", score: 0, description: "Marketing strategy doc vs projections", comments: "" },
      { subDomain: "Packaging & branding", question: "Are the company's products properly packed and branded?", rating: "No", score: 0, description: "Brand guidelines, packaging guidelines, product offering etc", comments: "" },
      { subDomain: "Product promotion", question: "Is there a clear promotion strategy?", rating: "No", score: 0, description: "Promotion strategy doc vs projections", comments: "" },
    ],
  };


  
  

