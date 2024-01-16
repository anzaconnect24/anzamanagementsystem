import axios from "axios";
import { headers } from "@/app/utils/headers";
import { server_url } from "../utils/endpoint";

export const createProgramUpdate = async (data) => {
    try {
      const response = await axios.post(`${server_url}/program_update`,data,{
         headers
      });
     return response.data
    } catch (error) { 
      console.log(error)
      throw error
     
    }
  };

  export const getProgramUpdates = async (uuid,page,limit) => {
    try {
      const response = await axios.get(`${server_url}/program_update/program/${uuid}/?page=${page}&limit=${limit}`,{
         headers
      });
     return response.data.body
    } catch (error) { 
      console.log(error)
      throw error
     
    }
  };