import axios from "axios";
import { headers } from "@/app/utils/headers";
import { server_url } from "../utils/endpoint";

export const createBusinessReview = async (data) => {
    try {
      const response = await axios.post(`${server_url}/business_review`,data,{
         headers
      });
      // alert(response.data.body.length)
     return response.data
    } catch (error) { 
      console.log(error)
      throw error
     
    }
  };
  export const getReviewerBusinessApplications = async () => {
    try {
      const response = await axios.get(`${server_url}/business_review/`,{
         headers
      });
      console.log(response.data.body)
     return response.data.body
    } catch (error) { 
      throw error
      
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