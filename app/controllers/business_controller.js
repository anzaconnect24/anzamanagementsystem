import axios from "axios"
import { server_url } from "../utils/endpoint"
import { headers } from "../utils/headers";
import { config } from "process";
import { getUser } from "../utils/local_storage";


export const createBusiness = async (data) => {
    try { 
      const user = getUser() 
      const response = await axios.post(`${server_url}/business/`, data,{
         headers:{
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user && user.ACCESS_TOKEN}`
        }
      });
     return response.data
    } catch (error) { 
      console.log(error)
      return error.response;
    }
  };

  export const uploadBusinessDocument = async (data) => {
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
      const response = await axios.post(`${server_url}/business_document/`, formData, {
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
  
  export const updateBusinessWithFile = async (uuid,data) => {
    try {
      const formData = new FormData();
      formData.append('file', data.file); 
      delete data.file;
      Object.keys(data).forEach((key) => {
        formData.append(key, data[key]);
      });
      const user = getUser()
      const response = await axios.patch(`${server_url}/business/file/${uuid}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data', 
          'Authorization': `Bearer ${user && user.ACCESS_TOKEN}`
        },
      });
     
     return response.data
    } catch (error) { 
      throw error
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

  export const getPendingBusinesses = async (page,limit) => {
    try {
      const response = await axios.get(`${server_url}/business/waiting/?page=${page}&limit=${limit}`,{
        headers
      });
      console.log(response.data)
      return response.data.body
    } catch (error) {
      console.log(error.response);
      return error.response
    }
  };
  export const getRejectedBusinesses = async (page,limit) => {
    try {
      const response = await axios.get(`${server_url}/business/rejected/?page=${page}&limit=${limit}`,{
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
      return response.data.body
    } catch (error) {
      console.log(error.response);
      return error.response
    }
  };

  export const deleteBusinessDocument = async (uuid) => {
    try {
      const response = await axios.delete(`${server_url}/business_document/${uuid}`,{
        headers
      });
      return response.data
    } catch (error) {
      console.log(error.response);
      return error.response
    }
  };
  export const getApprovedBusinesses = async (page,limit) => {
    try {
      const response = await axios.get(`${server_url}/business/approved/?page=${page}&limit=${limit}`,{
        headers
      });
      console.log(response.data)
      return response.data.body
    } catch (error) {
      console.log(error);
    }
  };
  export const getInvestorBusinesses = async (page,limit) => {
    try {
      const response = await axios.get(`${server_url}/business/investor/?page=${page}&limit=${limit}`,{
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
 