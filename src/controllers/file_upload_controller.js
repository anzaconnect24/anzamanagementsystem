import axios from "axios";
import { server_url } from "../utils/endpoint";

export const uploadFile = async (data) => {
  try {
    const response = await axios.post(`${server_url}/upload-file/`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.body;
  } catch (error) {
    console.log(error);
    return error.response;
  }
};
