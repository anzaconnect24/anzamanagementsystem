import axios from "axios";
import { server_url } from "../utils/endpoint";
import { headers } from "../utils/headers";
import { getUser } from "../utils/local_storage";

export const sendProgramApplication = async (data) => {
    try {
      console.log(headers)
      const response = await axios.post(`${server_url}/program_application`,data,{
         headers
      });
     return response.data.body
    } catch (error) { 
      console.log(error.response)
      return error.response;
    }
  };

  export const sendProgramApplicationDocument = async (uuid,data) => {
    try {
      const formData = new FormData();
      formData.append('file', data.file); 
      delete data.file;
      Object.keys(data).forEach((key) => {
        formData.append(key, data[key]);
      });
      const user = getUser()
      const response = await axios.post(`${server_url}/program_application/document/${uuid}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data', 
          'Authorization': `Bearer ${user && user.ACCESS_TOKEN}`
        },
      });
     
     return response.data.body
    } catch (error) { 
      console.log(error.response)
      return error.response;
    }
  };

  export const getProgramApplicationReviewers = async (uuid,page,limit) => {
    try {
      const response = await axios.get(`${server_url}/program_application/reviewers/${uuid}/?page=${page}&limit=${limit}`,{
         headers
      });
     return response.data.body
    } catch (error) { 
      console.log(error.response)
      return error.response;
    }
  };
  
  export const getWaitingProgramApplications = async (page,limit) => {
    try {
      const response = await axios.get(`${server_url}/program_application/waiting/?page=${page}&limit=${limit}`,{
         headers
      });

     return response.data.body
    } catch (error) { 
      console.log(error.response)
      return error.response;
    }
  };
    
  export const getAcceptedProgramApplications = async (page,limit) => {
    try {

      const response = await axios.get(`${server_url}/program_application/accepted/?page=${page}&limit=${limit}`,{
         headers
      });
      console.log(response.data)
     return response.data.body
    } catch (error) { 
      console.log(error.response)
      return error.response;
    }
  };

    
  export const getRejectedProgramApplications = async (page,limit) => {
    try {
      const response = await axios.get(`${server_url}/program_application/rejected/?page=${page}&limit=${limit}`,{
         headers
      });
     return response.data.body
    } catch (error) { 
      console.log(error.response)
      return error.response;
    }
  };


  export const getIRAPrograms = async (page,limit) => {
    try {
      const response = await axios.get(`${server_url}/program/ira/?page=${page}&limit=${limit}`,{
         headers
      });
     return response.data.body
    } catch (error) { 
      console.log(error.response)
      return error.response;
    }
  };

  export const getProgramApplication = async (uuid) => {
    try {
      const response = await axios.get(`${server_url}/program_application/${uuid}`,{
         headers
      });
      console.log(response)
     return response.data.body
    } catch (error) { 
      console.log(error.response)
      return error.response;
    }
  };
  export const getUserProgramApplication = async (uuid) => {
    try {
      const response = await axios.get(`${server_url}/program_application/user/${uuid}`,{
         headers
      });
     return response.data.body
    } catch (error) { 
      console.log(error.response)
      return error.response;
    }
  };
  export const updateProgramApplication = async (uuid,data) => {
    try {
      const response = await axios.patch(`${server_url}/program_application/${uuid}`,data,{
         headers
      });
     return response.data
    } catch (error) { 
      console.log(error.response)
      return error.response;
    }
  };
  export const deleteBusinessReview = async (uuid) => {
    try {
      const response = await axios.delete(`${server_url}/business_review/${uuid}`,{
         headers
      });
     return response.data
    } catch (error) { 
      console.log(error.response)
      return error.response;
    }
  };