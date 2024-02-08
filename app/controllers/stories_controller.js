import axios from "axios";
import { headers } from "@/app/utils/headers";
import { server_url } from "../utils/endpoint";
import { getUser } from "../utils/local_storage";

export const createSuccessStory = async (data) => {
    try {
        console.log(data)
      const response = await axios.post(`${server_url}/success_story/`,data,{
         headers
      });
     return response.data
    } catch (error) { 
      console.log(error)
      throw error
     
    }
  };
  export const updateSuccessStory = async (uuid,data) => {
    try {
        console.log(data)
      const response = await axios.patch(`${server_url}/success_story/${uuid}`,data,{
         headers
      });
     return response.data
    } catch (error) { 
      console.log(error)
      throw error
     
    }
  };
  export const deleteSuccessStory = async (uuid) => {
    try {
      const response = await axios.delete(`${server_url}/success_story/${uuid}`,{
         headers
      });
     return response.data
    } catch (error) { 
      console.log(error)
      throw error
     
    }
  };

  export const getSuccessStory = async (page,limit) => {
    try {
      const user = getUser() 
      const response = await axios.get(`${server_url}/success_story/?page=${page}&limit=${limit}`,{
        headers:{
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user && user.ACCESS_TOKEN}`
        }
      });
     return response.data.body
    } catch (error) { 
      console.log(error)
      throw error
     
    }
  };

  export const getStoryDetails = async (uuid) => {
    try {
      const response = await axios.get(`${server_url}/success_story/${uuid}`,{
         headers
      });
     return response.data.body
    } catch (error) { 
      console.log(error)
      throw error
     
    }
  };