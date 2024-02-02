import axios from "axios"
import { server_url } from "../utils/endpoint"
import { headers } from "../utils/headers";
// import { config } from "process";
import { getUser } from "../utils/local_storage";
export const sendInvestmentRequest = async (data) => {
    try { 
      const user = getUser() 
      const response = await axios.post(`${server_url}/business_investment_request/`, data,{
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
  export const assignInvestmentRequestReviewer = async (data) => {
    try { 
      const user = getUser() 
      const response = await axios.post(`${server_url}/business_investment_request_review/`, data,{
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
  export const deleteInvestmentReviewerAssignment = async (uuid) => {
    try { 
      // alert("Hello")
      const user = getUser() 
      const response = await axios.delete(`${server_url}/business_investment_request_review/${uuid}`,{
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

  export const getReviewerInvestmentRequests = async (page,limit) => {
    try {
      const user = getUser() 
      const response = await axios.get(`${server_url}/business_investment_request_review/?page=${page}&limit=${limit}`,{
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


  

  export const getBusinessInvestmentRequestReviewers = async (uuid,page,limit) => {
    try {
      const response = await axios.get(`${server_url}/business_investment_request/reviewers/${uuid}/?page=${page}&limit=${limit}`,{
         headers
      });
     return response.data.body
    } catch (error) { 
      console.log(error.response)
      return error.response;
    }
  };
  export const updateInvestmentRequest = async (uuid,data) => {
    try { 
      const user = getUser() 
      const response = await axios.patch(`${server_url}/business_investment_request/${uuid}`, data,{
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

  export const investmentRequestDetails = async (uuid) => {
    try { 
      const user = getUser() 
      const response = await axios.get(`${server_url}/business_investment_request/${uuid}`,{
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

  
  export const getMyInvestmentRequests = async (page,limit) => {
    try { 
      const user = getUser() 
      const response = await axios.get(`${server_url}/business_investment_request/?page=${page}&limit=${limit}`,{
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


  export const getPendingInvestmentRequest = async (page,limit) => {
    try { 
      const user = getUser() 
      const response = await axios.get(`${server_url}/business_investment_request/waiting/?page=${page}&limit=${limit}`,{
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


  export const getAcceptedInvestmentRequest = async (page,limit) => {
    try { 
      const user = getUser()
      const response = await axios.get(`${server_url}/business_investment_request/accepted/?page=${page}&limit=${limit}`,{
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

  
  export const getRejectedInvestmentRequest = async (page,limit) => {
    try { 
      const user = getUser() 
      const response = await axios.get(`${server_url}/business_investment_request/rejected/?page=${page}&limit=${limit}`,{
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