import axios from "axios"
import { server_url } from "../utils/endpoint"
import { headers } from "../utils/headers";
import { config } from "process";
import { getUser } from "../utils/local_storage";

export const getConversations = async (page,limit) => {
    try {
      const user = getUser() 
      const response = await axios.get(`${server_url}/conversation/?page=${page}&limit=${limit}`,{
         headers:{
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user && user.ACCESS_TOKEN}`
        }
      });
     return response.data.body
    } catch (error) { 
      throw error
      return error.response;
    }
  };

  export const createConversation = async (data) => {
    try {
      const user = getUser() 
      const response = await axios.post(`${server_url}/conversation/`,data,{
         headers:{
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user && user.ACCESS_TOKEN}`
        }
      });
     return response.data.body
    } catch (error) { 
      console.log(error)
      return error.response;
    }
  };