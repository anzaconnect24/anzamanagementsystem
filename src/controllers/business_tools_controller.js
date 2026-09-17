import axios from "axios";
import { server_url } from "../utils/endpoint";
import { getUser } from "../utils/local_storage";

export const getAllBusinessTools = async () => {
  try {
    const user = getUser();
    const response = await axios.get(`${server_url}/business_tools`, {
      headers: {
        Authorization: `Bearer ${user && user.ACCESS_TOKEN}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getBusinessTool = async (uuid) => {
  try {
    const user = getUser();
    const response = await axios.get(`${server_url}/business_tools/${uuid}`, {
      headers: {
        Authorization: `Bearer ${user && user.ACCESS_TOKEN}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createBusinessTool = async (data) => {
  try {
    const user = getUser();
    const response = await axios.post(`${server_url}/business_tools`, data, {
      headers: {
        Authorization: `Bearer ${user && user.ACCESS_TOKEN}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateBusinessTool = async (uuid, data) => {
  try {
    const user = getUser();
    const response = await axios.put(
      `${server_url}/business_tools/${uuid}`,
      data,
      {
        headers: {
          Authorization: `Bearer ${user && user.ACCESS_TOKEN}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteBusinessTool = async (uuid) => {
  try {
    const user = getUser();
    const response = await axios.delete(`${server_url}/business_tools/${uuid}`, {
      headers: {
        Authorization: `Bearer ${user && user.ACCESS_TOKEN}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const generateBusinessTool = async (uuid, data) => {
  try {
    const user = getUser();
    const response = await axios.post(
      `${server_url}/business_tools/${uuid}/generate`,
      data,
      {
        headers: {
          Authorization: `Bearer ${user && user.ACCESS_TOKEN}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Not a business-tools endpoint — reuses the existing GET /business/user
// (derived from the authenticated user, no client-supplied business id),
// which had no frontend wrapper yet. Kept here since the AI generation page
// is currently its only caller.
export const getMyBusiness = async () => {
  try {
    const user = getUser();
    const response = await axios.get(`${server_url}/business/user`, {
      headers: {
        Authorization: `Bearer ${user && user.ACCESS_TOKEN}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
