import axios from "axios";
import { server_url } from "../utils/endpoint";
import { headers } from "next/dist/client/components/headers";

export const createBusinessReview = async (data) => {
    try {
      const response = await axios.post(`${server_url}/business_review`,data,{
         headers
      });
     return response.data
    } catch (error) { 
      console.log(error.response)
      return error.response;
    }
  };
  
  export const getReviewers = async (uuid,page,limit) => {
    try {
      const response = await axios.get(`${server_url}/business_review/reviewers/${uuid}/?page=${page}&limit=${limit}`,{
         headers
      });
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