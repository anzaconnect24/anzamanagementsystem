import axios from "axios"
import { server_url } from "../utils/endpoint"
import { getUser, storeUser } from "../utils/local_storage"; 
import { headers } from "../utils/headers";
import { config } from "process";


export const createSector = async (data) => {
    try { 
      const response = await axios.post(`${server_url}/sector/`, data,{
         headers
      });
     return response.data
    } catch (error) { 
      console.log(error)
      return error.response;
    }
  };
  export const deleteSector = async (uuid) => {
    try { 
      const response = await axios.delete(`${server_url}/sector/${uuid}`,{
         headers
      });
     return response.data
    } catch (error) { 
      console.log(error)
      return error.response;
    }
  };
  export const getSectors = async (data,uuid) => {
    try {
      const response = await axios.get(`${server_url}/sector/`, {
        headers
      });
      console.log(response.data.body)
      return response.data.body
    } catch (error) {
      console.log(error);
    }
  };

  export const deleteUser = async (uuid) => {
    try {
      const response = await axios.delete(`${server_url}/user/${uuid}`,{
        headers
      });
     return response.data.status
    } catch (error) {
      console.log(error);
    }
  };
 