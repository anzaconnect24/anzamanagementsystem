import axios from "axios";
import { server_url } from "../utils/endpoint";
import { headers } from "@/app/utils/headers";


export const getReviewerProgramApplications = async (page,limit) => {
  try {
    const response = await axios.get(`${server_url}/program_application_review/?page=${page}&limit=${limit}`,{
       headers
    });
   return response.data.body
  } catch (error) { 
    throw error
    
  }
};

export const assignProgramApplicationReviewer = async (data) => {
    try {
      const response = await axios.post(`${server_url}/program_application_review/`,data,{
         headers
      });
     return response.data
    } catch (error) { 
      throw error
      
    }
  };

  

  export const deleteProgramApplicationReviewer = async (uuid) => {
    try {
      const response = await axios.delete(`${server_url}/program_application_review/${uuid}`,{
         headers
      });
    
     return response.data
    } catch (error) { 
      throw error
      
    }
  };