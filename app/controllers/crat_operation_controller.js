import axios from "axios";
import { headers } from "@/app/utils/headers";
import { server_url } from "@/app/utils/endpoint";
import { getUser, storeUser } from "../utils/local_storage"; 


// Create financial data
export const createOperationData = async (data) => {
    console.log('creating operations');
    try {
        const response = await axios.post(`${server_url}/crat_operation/create`, data, { headers });
        return response.data;
    } catch (error) {
        console.log('Error creating operation data:', error);
        throw error;
    }
};

// Fetch market data
export const getOperationData = async () => {
    console.log('getting operations');

    try {
        const response = await axios.get(`${server_url}/crat_operation/data`, { headers });
        return response.data.body;
    } catch (error) {
        console.log('Error fetching operation data:', error.response);
        throw error;
    }
};

// Update market data
export const updateOperationData = async (data) => {
    try {
        const response = await axios.post(`${server_url}/crat_operation/update`, data, { headers });
        return response.data;
    } catch (error) {
        console.log('Error updating operation data:', error.response);
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

        const response = await axios.post(`${server_url}/crat_operation/attachment`, formData, {
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
        const response = await axios.post(`${server_url}/crat_operation/delete_attachment`, {
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

export const initialDataTemplate = {
    managementCapacity: [
      { subDomain: "Vision clarity", question: "Is the vision clear?", rating: "No", score: 0, description: "Vision statement", comments: "" },
      { subDomain: "Management structure", question: "Is the management structure clear?", rating: "No", score: 0, description: "Organogram", comments: "" },
      { subDomain: "Track record", question: "Does the team have credible track record?", rating: "No", score: 0, description: "Management CVs" , comments: ""},
      { subDomain: "Management commitment", question: "Is the management fully committed?", rating: "No", score: 0, description: "Works schedules and contracts", comments: "" },
      { subDomain: "Team capacity", question: "Does the team have relevant technical competence?", rating: "No", score: 0, description: "CVs" , comments: ""},
      { subDomain: "Performance measurement", question: "Is performance measured?", rating: "No", score: 0, description: "KPIs", comments: "" },
      { subDomain: "Professional development", question: "Does the company have a proper PD and or on-job training?", rating: "No", score: 0, description: "Organization PD plans/Job training modules", comments: "" },
    ],
    mis: [
      { subDomain: "Data management", question: "Is data collected and properly managed?", rating: "No", score: 0, description: "Data protection policy", comments: "" },
      { subDomain: "System used", question: "Is there an MIS for handling organization operations?", rating: "No", score: 0, description: "MIS", comments: "" },
      { subDomain: "System effectiveness", question: "Is the MIS used effective?", rating: "No", score: 0, description: "MIS", comments: "" },
    ],
    qualityManagement: [
      { subDomain: "Quality control", question: "Is quality check a norm at the company?", rating: "No", score: 0, description: "Quality manuals, quality control reports", comments: "" },
      { subDomain: "Quality management team", question: "Are there personnel in charge of quality control?", rating: "No", score: 0, description: "JD", comments: "" },
    ],
    overallOperations: [
      { subDomain: "Platform utilization", question: "Is the platform optimally utilized?", rating: "No", score: 0, description: "Actual vis-a-vis ideal", comments: "" },
      { subDomain: "Customer relations", question: "Is customer relationship management organized?", rating: "No", score: 0, description: "CRM/Platform/MIS/Automated Real-Time Responses", comments: "" },
    ],
    strategyPlanning: [
      { subDomain: "Business strategy", question: "Does the company have a business strategy?", rating: "No", score: 0, description: "Strategy documents", comments: "" },
      { subDomain: "Organization Planning", question: "Is there a formal planning process?", rating: "No", score: 0, description: "Planning doc/tool", comments: "" },
    ],
  };
  
  

