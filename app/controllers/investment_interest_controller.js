import axios from "axios"
import { server_url } from "../utils/endpoint"
import { headers } from "../utils/headers";
// import { config } from "process";
import { getUser } from "../utils/local_storage";
export const sendInvestmentInterest = async (data) => {
    try { 
      const user = getUser() 
      const response = await axios.post(`${server_url}/investment_interest/`, data,{
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