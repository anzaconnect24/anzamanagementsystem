import axios from "axios"
import { server_url } from "../utils/endpoint"
import { getUser, storeUser } from "../utils/local_storage"; 
import { headers } from "../utils/headers";

export const register = async (data) => {
    try { 
      const formData = new FormData();
      console.log(data.file)
      formData.append('file', data.file); 
      delete data.file;
      Object.keys(data).forEach((key) => {
        formData.append(key, data[key]);
      });
      const response = await axios.post(`${server_url}/user/register`, formData,{
        headers: {
          'Content-Type': 'multipart/form-data'
        },
      });
      console.log(response.data)
      storeUser(response.data.tokens)
       console.log(getUser())
     return response.data
    } catch (error) { 
      console.log(error)
      return error.response.data;
    }
  };
  export const updateUser = async (data,uuid) => {
    try {
      const response = await axios.patch(`${server_url}/user/${uuid}`, data,{
        headers
      });
      return response.data.status
    } catch (error) {
      console.log(error);
    }
  };

    export const updateMyInfo = async (data) => {
    try {
      const response = await axios.patch(`${server_url}/user/me`, data,{
        headers
      });
      return response.data.status
    } catch (error) {
      console.log(error);
    }
  };
  
  export const updateUserInformation = async (data) => {
    try {
      const formData = new FormData();
      console.log(data.file)
      formData.append('file', data.file); 
      delete data.file;
      Object.keys(data).forEach((key) => {
        formData.append(key, data[key]);
      });
  
      const user = getUser()
      const response = await axios.patch(`${server_url}/user/image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data', 
          'Authorization': `Bearer ${user && user.ACCESS_TOKEN}`
        },
      });
     
     return response.data
    } catch (error) { 
      console.log(error.response)
      throw error
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
 

export const login = async(data)=>{
    try {
     const response = await axios.post(`${server_url}/user/login`,data)
    //  alert(response.data.tokens)
    storeUser(response.data.tokens)
     return response.data
    } catch (error) {
      console.log(error)
      return error.response.data;

      // throw error
    }
 }

 
 export const resetPassword = async(data)=>{
  try {
   const response = await axios.post(`${server_url}/user/reset-password`,data)
   return response.data;
  } catch (error) {
    return error.response.data;
  }
}
export const inviteUser = async(data)=>{
  try {
   const response = await axios.post(`${server_url}/user/inviteUser`,data)
   return response.data;
  } catch (error) {

    throw error;
    return error.response.data;
  }
}
export const newPassword = async(data,uuid)=>{
  try {
   const response = await axios.patch(`${server_url}/user/password/${uuid}`,data)
  //  console.log(response.data.response)
   return response.data
  } catch (error) {
    return error.response.data;
  }
}

 export const getUserInfo = async(uuid)=>{
  try {
    console.log(headers)
   const response = await axios.get(`${server_url}/user/${uuid}`,{
    headers
   })
   console.log(response.data)
    return response.data.body
  } catch (error) {
    throw error
  }
}
export const getMyInfo = async()=>{
  try {
    const user = getUser()
   const response = await axios.get(`${server_url}/user/me`,{
      headers:{
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user && user.ACCESS_TOKEN}`
        }
   })
   console.log(user.ACCESS_TOKEN)
    return response.data.body
  } catch (error) {
   console.log(error)
   throw error

  }
}

 export const getAllUsers = async(limit,page,keyword)=>{
  try {
    const user = getUser()
   const response = await axios.get(`${server_url}/user/?page=${page}&limit=${limit}&keyword=${keyword??" "}`,{
    headers:{
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${user && user.ACCESS_TOKEN}`
    }
   })
   console.log(response.data)
    return response.data.body
  } catch (error) {
   console.log(error)
  }
}

export const getInvestors = async(limit,page,keyword)=>{
  try {
   
   const response = await axios.get(`${server_url}/user/investors/?page=${page}&limit=${limit}&keyword=${keyword??" "}`,{
    headers
   })
   console.log(response.data)
    return response.data.body
  } catch (error) {
   console.log(error)
  }
}

export const getEnterprenuers = async(limit,page,keyword)=>{
  try {
  const user = getUser()
   const response = await axios.get(`${server_url}/user/enterprenuers/?page=${page}&limit=${limit}&keyword=${keyword??" "}`,{
    headers:{
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${user && user.ACCESS_TOKEN}`
    }
   })
   console.log(response.data)
    return response.data.body
  } catch (error) {
   console.log(error)
  }
}
export const getUsersWithSharedDocuments = async(limit,page)=>{
  try {
  
   const response = await axios.get(`${server_url}/user/withSharedDocuments/?page=${page}&limit=${limit}`,{
    headers
   })
   console.log(response.data)
    return response.data.body
  } catch (error) {
   console.log(error)
  }
}

export const getAdmins = async(limit,page)=>{
  try {
   
   const response = await axios.get(`${server_url}/user/admins/?page=${page}&limit=${limit}`,{
    headers
   })
   console.log(response.data)
    return response.data.body
  } catch (error) {
   console.log(error)
  }
}

export const getReviewers = async(limit,page)=>{
  try {
   
   const response = await axios.get(`${server_url}/user/reviewers/?page=${page}&limit=${limit}`,{
    headers
   })
   console.log(response.data)
    return response.data.body
  } catch (error) {
   console.log(error)
  }
}

 