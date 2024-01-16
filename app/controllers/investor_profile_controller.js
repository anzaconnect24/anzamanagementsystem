import axios from "axios"
import { server_url } from "../utils/endpoint"
import { headers } from "../utils/headers";
import { config } from "process";
import { getUser } from "../utils/local_storage";


export const createInvestorProfile = async (data) => {
    try { 
    const user = getUser()
      const response = await axios.post(`${server_url}/investor_profile/`,data,{
        headers:{
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.ACCESS_TOKEN}`
        }
      });
     return response.data
    } catch (error) { 
      console.log(error)
      return error.response;
    }
  };
  export const getMyInvestorProfile = async()=>{
    try {
      const user = getUser()
     const response = await axios.get(`${server_url}/investor_profile/me`,{
        headers:{
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user && user.ACCESS_TOKEN}`
          }
     })
      return response.data.body
    } catch (error) {
     console.log(error)
    }
  }
  export const updateInvestorProfile = async (data) => {
    try { 
      const response = await axios.patch(`${server_url}/investor_profile/me`, data,{
         headers
      });
     return response.data
    } catch (error) { 
      console.log(error)
      return error.response;
    }
  };
  