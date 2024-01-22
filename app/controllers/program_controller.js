import axios from "axios";
import { server_url } from "../utils/endpoint";
import { headers } from "../utils/headers";

export const addProgram = async (data) => {
    try {
      const response = await axios.post(`${server_url}/program`,data,{
         headers
      });
     return response.data
    } catch (error) { 
      console.log(error.response)
      return error.response;
    }
  };
  
  export const getBFAPrograms = async (page,limit) => {
    try {
      const response = await axios.get(`${server_url}/program/bfa/?page=${page}&limit=${limit}`,{
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
    console.log(headers)
      const response = await axios.get(`${server_url}/program/ira/?page=${page}&limit=${limit}`,{
         headers
      });
     return response.data.body
    } catch (error) { 
      console.log(error.response)
      return error.response;
    }
  };

  export const getProgram = async (uuid) => {
    try {
      const response = await axios.get(`${server_url}/program/${uuid}`,{
         headers
      });
      console.log(response)
     return response.data.body
    } catch (error) { 
      console.log(error.response)
      return error.response;
    }
  };

  export const deleteProgram = async (uuid) => {
    try {
      const response = await axios.delete(`${server_url}/program/${uuid}`,{
         headers
      });
      console.log(response)
     return response.data.body
    } catch (error) { 
      console.log(error.response)
      return error.response;
    }
  };

  export const editProgram = async (uuid,data) => {
    try {
      const response = await axios.patch(`${server_url}/program/${uuid}`,data,{
         headers
      });
     return response.data
    } catch (error) { 
      console.log(error.response)
      return error.response;
    }
  };
  export const deleteProgramRequirement = async (uuid) => {
    try {
      const response = await axios.delete(`${server_url}/program/program_requirement/${uuid}`,{
         headers
      });
     return response.data
    } catch (error) { 
      console.log(error.response)
      return error.response;
    }
  };

  export const addProgramRequirements = async (uuid,data) => {
    try {
      const response = await axios.post(`${server_url}/program/program_requirement/${uuid}`,data,{
         headers
      });
     return response.data
    } catch (error) { 
      console.log(error.response)
      throw error
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

  