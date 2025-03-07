import axios from "axios";
import { headers } from "@/app/utils/headers";
import { server_url } from "@/app/utils/endpoint";
import { getUser, storeUser } from "../utils/local_storage"; 


// Create financial data
export const createLegalData = async (data) => {
    console.log('creating legal');
    try {
        const response = await axios.post(`${server_url}/crat_legal/create`, data, { headers });
        return response.data;
    } catch (error) {
        console.log('Error creating legal data:', error);
        throw error;
    }
};

// Fetch market data
export const getLegalData = async () => {
    console.log('getting legal');

    try {
        const response = await axios.get(`${server_url}/crat_legal/data`, { headers });
        return response.data.body;
    } catch (error) {
        console.log('Error fetching legal data:', error.response);
        throw error;
    }
};

// Update market data
export const updateLegalData = async (data) => {
    try {
        const response = await axios.post(`${server_url}/crat_legal/update`, data, { headers });
        return response.data;
    } catch (error) {
        console.log('Error updating legal data:', error.response);
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


        const response = await axios.post(`${server_url}/crat_legal/attachment`, formData, {
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
        const response = await axios.post(`${server_url}/crat_legal/delete_attachment`,{
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
    corporateDocumentsCompliance: [
      { subDomain: "Business incorporation", question: "Is the business incorporated/registered?", rating: "No", score: 0, description: "BRELA incorporation Certificate, MEMART", comments: "" },
      { subDomain: "Tax Identification", question: "Does the company have tax identification number?", rating: "No", score: 0, description: "TIN Certificate", comments: "" },
      { subDomain: "Tax compliance", question: "Is the business up to date with the required taxes?", rating: "No", score: 0, description: "Current tax fillings", comments: "" },
      { subDomain: "Business Licence", question: "Does the business have required licenses?", rating: "No", score: 0, description: "Business licence certificate" , comments: ""},
      { subDomain: "Sector specific compliance", question: "Does the company have other certifications per the respective industry regulations?", rating: "No", score: 0, description: "BOT Licence etc", comments: "" },
    ],
    contractsAgreements: [
      { subDomain: "Lease agreements", question: "Are lease agreements available and clear?", rating: "No", score: 0, description: "Contract", comments: "" },
      { subDomain: "Customer contracts", question: "Are customer agreements available and clear?", rating: "No", score: 0, description: "Contract", comments: "" },
      { subDomain: "Supplier contracts", question: "Are supplier agreements available and clear?", rating: "No", score: 0, description: "Contract", comments: "" },
      { subDomain: "Employees contracts", question: "Do employees have contracts (including the founders)?", rating: "No", score: 0, description: "Contract" , comments: ""},
    ],
    intellectualProperty: [
      { subDomain: "IP ownership", question: "Does the company own copyrights to its source codes/or patent to its solution?", rating: "No", score: 0, description: "Copyrights", comments: "" },
    ],
    entrepreneurFamily: [
      { subDomain: "Entrepreneurial character", question: "Is the entrepreneur adaptable, resilient, and reliable?", rating: "No", score: 0, description: "Track record, pitch, innovation in business", comments: "" },
      { subDomain: "Personal legal liability", question: "Does the management team have any personal liability that would affect the company?", rating: "No", score: 0, description: "Credit reports", comments: "" },
      { subDomain: "Succession plan", question: "Does the succession plan exist?", rating: "No", score: 0, description: "Succession plans/Contracts/JD", comments: "" },
    ],
    corporateGovernance: [
      { subDomain: "Board of directors", question: "Does the company have an active BOD?", rating: "No", score: 0, description: "List of board members + CVs", comments: "" },
    ],
  };
  
  

