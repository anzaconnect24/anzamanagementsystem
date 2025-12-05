import axios from "axios";
import { server_url } from "../utils/endpoint";
import { headers } from "../utils/headers";

export const addProgram = async (data) => {
  try {
    const response = await axios.post(`${server_url}/programs`, data, {
      headers,
    });
    return response.data;
  } catch (error) {
    console.log(error.response);
    return error.response;
  }
};

export const getBFAPrograms = async (page, limit) => {
  try {
    const response = await axios.get(
      `${server_url}/programs/bfa/?page=${page}&limit=${limit}`,
      {
        headers,
      }
    );
    return response.data.body;
  } catch (error) {
    console.log(error.response);
    return error.response;
  }
};
export const getPrograms = async (page, limit, programCategory) => {
  try {
    const categoryParam = programCategory
      ? `&programCategory=${encodeURIComponent(programCategory)}`
      : "";
    const response = await axios.get(
      `${server_url}/programs/?page=${page}&limit=${limit}${categoryParam}`,
      {
        headers,
      }
    );
    return response.data.body;
  } catch (error) {
    console.log(error.response);
    return error.response;
  }
};
export const getConsultancePrograms = async (page, limit) => {
  try {
    const response = await axios.get(
      `${server_url}/programs/consultance/?page=${page}&limit=${limit}`,
      {
        headers,
      }
    );
    return response.data.body;
  } catch (error) {
    console.log(error.response);
    return error.response;
  }
};

export const getIRAPrograms = async (page, limit) => {
  try {
    console.log(headers);
    const response = await axios.get(
      `${server_url}/programs/ira/?page=${page}&limit=${limit}`,
      {
        headers,
      }
    );
    return response.data.body;
  } catch (error) {
    console.log(error.response);
    return error.response;
  }
};

export const getProgram = async (uuid) => {
  try {
    const response = await axios.get(`${server_url}/programs/${uuid}`, {
      headers,
    });
    console.log(response);
    return response.data.body;
  } catch (error) {
    console.log(error.response);
    return error.response;
  }
};

export const deleteProgram = async (uuid) => {
  try {
    const response = await axios.delete(`${server_url}/programs/${uuid}`, {
      headers,
    });
    console.log(response);
    return response.data.body;
  } catch (error) {
    console.log(error.response);
    return error.response;
  }
};

export const editProgram = async (uuid, data) => {
  try {
    const response = await axios.patch(`${server_url}/programs/${uuid}`, data, {
      headers,
    });
    return response.data;
  } catch (error) {
    console.log(error.response);
    return error.response;
  }
};
export const deleteProgramRequirement = async (uuid) => {
  try {
    const response = await axios.delete(
      `${server_url}/programs/program_requirement/${uuid}`,
      {
        headers,
      }
    );
    return response.data;
  } catch (error) {
    console.log(error.response);
    return error.response;
  }
};

export const addProgramRequirements = async (uuid, data) => {
  try {
    const response = await axios.post(
      `${server_url}/programs/program_requirement/${uuid}`,
      data,
      {
        headers,
      }
    );
    return response.data;
  } catch (error) {
    console.log(error.response);
    throw error;
  }
};
export const deleteBusinessReview = async (uuid) => {
  try {
    const response = await axios.delete(
      `${server_url}/business_review/${uuid}`,
      {
        headers,
      }
    );
    return response.data;
  } catch (error) {
    console.log(error.response);
    return error.response;
  }
};
