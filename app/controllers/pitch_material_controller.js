import axios from "axios";
import { server_url } from "../utils/endpoint";
import { headers } from "../utils/headers";
import { getUser } from "../utils/local_storage";



  export const uploadPitchMaterial = async (data) => {
    try {
      const formData = new FormData();
      console.log(data.file)
      formData.append('file', data.file); 
      delete data.file;
      Object.keys(data).forEach((key) => {
        formData.append(key, data[key]);
      });
    //   console.log(data)
    //   console.log(formData)
      const user = getUser()
      const response = await axios.post(`${server_url}/pitch_material/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data', 
          'Authorization': `Bearer ${user && user.ACCESS_TOKEN}`
        },
      });
     
     return response.data
    } catch (error) { 
      console.log(error.response)
      return error.response;
    }
  };
  
  export const getVideos = async (page,limit) => {
    try {
        const response = await axios.get(`${server_url}/pitch_material/video/?page=${page}&limit=${limit}`,{
           headers
        });
       return response.data.body
      } catch (error) { 
        console.log(error.response)
        return error.response;
      }
  };

  
  export const getDocuments = async (page,limit) => {
    try {
        const response = await axios.get(`${server_url}/pitch_material/document/?page=${page}&limit=${limit}`,{
           headers
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
      console.log(response)
     return response.data.body
    } catch (error) { 
      console.log(error.response)
      return error.response;
    }
  };
    
  export const getAcceptedProgramApplications = async (page,limit) => {
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