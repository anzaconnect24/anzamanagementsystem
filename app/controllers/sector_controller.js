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
  export const editSector = async (uuid,data) => {
    try { 
      const response = await axios.patch(`${server_url}/sector/${uuid}`,data,{
         headers
      });
     return response.data
    } catch (error) { 
      console.log(error)
      return error.response;
    }
  };
  export const getSector = async (uuid,data) => {
    try { 
      const response = await axios.get(`${server_url}/sector/${uuid}`,data,{
         headers
      });
     return response.data.body
    } catch (error) { 
      console.log(error)
      return error.response;
    }
  };

  export const getSectorBusinesses = async (uuid) => {
    try { 
      const response = await axios.get(`${server_url}/sector/businesses/${uuid}`,{
         headers
      });
     return response.data.body
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

 
 