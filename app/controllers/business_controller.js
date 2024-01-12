import axios from "axios"
import { server_url } from "../utils/endpoint"
import { headers } from "../utils/headers";
import { config } from "process";


export const createBusiness = async (data) => {
    try { 
      const response = await axios.post(`${server_url}/business/`, data,{
         headers
      });
     return response.data
    } catch (error) { 
      console.log(error)
      return error.response;
    }
  };
  
  export const updateBusiness = async (data,uuid) => {
    try {
      const response = await axios.patch(`${server_url}/business/${uuid}`, data,{
        headers
      });
      return response.data.status
    } catch (error) {
      console.log(error);
    }
  };

  export const getPendingBusinesses = async () => {
    try {
      const response = await axios.get(`${server_url}/business/waiting/`,{
        headers
      });
      console.log(response.data)
      return response.data.body
    } catch (error) {
      console.log(error.response);
      return error.response
    }
  };
  export const getRejectedBusinesses = async () => {
    try {
      const response = await axios.get(`${server_url}/business/rejected/`,{
        headers
      });
      console.log(response.data)
      return response.data.body
    } catch (error) {
      console.log(error.response);
      return error.response
    }
  };
  export const getBusiness = async (uuid) => {
    try {
      const response = await axios.get(`${server_url}/business/${uuid}`,{
        headers
      });
      console.log(response.data.body)
      return response.data.body
    } catch (error) {
      console.log(error.response);
      return error.response
    }
  };
  export const getApprovedBusinesses = async () => {
    try {
      const response = await axios.get(`${server_url}/business/approved/`,{
        headers
      });
      console.log(response.data)
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
 