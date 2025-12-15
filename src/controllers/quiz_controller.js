import axios from "axios";
import { server_url } from "../utils/endpoint";
import { getUser } from "../utils/local_storage";

const authHeaders = () => {
  const user = getUser();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user && user.ACCESS_TOKEN}`,
  };
};

// Quiz CRUD
export const createQuiz = async (data) => {
  try {
    const response = await axios.post(`${server_url}/quiz/create`, data, {
      headers: authHeaders(),
    });
    return response.data;
  } catch (error) {
    console.log(error);
    throw error.response?.data || error;
  }
};

export const getQuizzesByModule = async (moduleId) => {
  try {
    const response = await axios.get(`${server_url}/quiz/module/${moduleId}`, {
      headers: authHeaders(),
    });
    return response.data;
  } catch (error) {
    console.log(error);
    throw error.response?.data || error;
  }
};

export const getQuizById = async (uuid) => {
  try {
    const response = await axios.get(`${server_url}/quiz/${uuid}`, {
      headers: authHeaders(),
    });
    return response.data;
  } catch (error) {
    console.log(error);
    throw error.response?.data || error;
  }
};

export const updateQuiz = async (uuid, data) => {
  try {
    const response = await axios.put(`${server_url}/quiz/${uuid}`, data, {
      headers: authHeaders(),
    });
    return response.data;
  } catch (error) {
    console.log(error);
    throw error.response?.data || error;
  }
};

export const togglePublishQuiz = async (uuid) => {
  try {
    const response = await axios.patch(
      `${server_url}/quiz/${uuid}/publish`,
      {},
      {
        headers: authHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    console.log(error);
    throw error.response?.data || error;
  }
};

export const deleteQuiz = async (uuid) => {
  try {
    const response = await axios.delete(`${server_url}/quiz/${uuid}`, {
      headers: authHeaders(),
    });
    return response.data;
  } catch (error) {
    console.log(error);
    throw error.response?.data || error;
  }
};

// Question Management
export const addQuestion = async (quizUuid, data) => {
  try {
    const response = await axios.post(
      `${server_url}/quiz/${quizUuid}/questions`,
      data,
      {
        headers: authHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    console.log(error);
    throw error.response?.data || error;
  }
};

export const updateQuestion = async (questionUuid, data) => {
  try {
    const response = await axios.put(
      `${server_url}/quiz/questions/${questionUuid}`,
      data,
      {
        headers: authHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    console.log(error);
    throw error.response?.data || error;
  }
};

export const deleteQuestion = async (questionUuid) => {
  try {
    const response = await axios.delete(
      `${server_url}/quiz/questions/${questionUuid}`,
      {
        headers: authHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    console.log(error);
    throw error.response?.data || error;
  }
};

// Quiz Taking
export const startQuizAttempt = async (quizUuid) => {
  try {
    const response = await axios.post(
      `${server_url}/quiz/${quizUuid}/start`,
      {},
      {
        headers: authHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    console.log(error);
    throw error.response?.data || error;
  }
};

export const submitQuiz = async (attemptUuid, answers) => {
  try {
    const response = await axios.post(
      `${server_url}/quiz/attempts/${attemptUuid}/submit`,
      { answers },
      {
        headers: authHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    console.log(error);
    throw error.response?.data || error;
  }
};

export const getUserAttempts = async (quizUuid = null) => {
  try {
    const url = quizUuid
      ? `${server_url}/quiz/attempts/user/${quizUuid}`
      : `${server_url}/quiz/attempts/user`;
    const response = await axios.get(url, {
      headers: authHeaders(),
    });
    return response.data;
  } catch (error) {
    console.log(error);
    throw error.response?.data || error;
  }
};

export const downloadCertificate = async (attemptUuid) => {
  try {
    const response = await axios.get(
      `${server_url}/quiz/attempts/${attemptUuid}/certificate`,
      {
        headers: authHeaders(),
        responseType: "blob",
      }
    );

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `certificate_${attemptUuid}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();

    return { success: true };
  } catch (error) {
    console.log(error);
    throw error.response?.data || error;
  }
};

// Admin endpoints
export const getAllAttempts = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const response = await axios.get(
      `${server_url}/quiz/admin/attempts?${params}`,
      {
        headers: authHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    console.log(error);
    throw error.response?.data || error;
  }
};

export const getAttemptDetails = async (attemptUuid) => {
  try {
    const response = await axios.get(
      `${server_url}/quiz/admin/attempts/${attemptUuid}`,
      {
        headers: authHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    console.log(error);
    throw error.response?.data || error;
  }
};

export const markDescriptionAnswer = async (answerUuid, data) => {
  try {
    const response = await axios.patch(
      `${server_url}/quiz/admin/answers/${answerUuid}/mark`,
      data,
      {
        headers: authHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    console.log(error);
    throw error.response?.data || error;
  }
};

export const bulkMarkAnswers = async (answers) => {
  try {
    const response = await axios.post(
      `${server_url}/quiz/admin/answers/bulk-mark`,
      { answers },
      {
        headers: authHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    console.log(error);
    throw error.response?.data || error;
  }
};

// Program Completion and Certificates
export const checkProgramCompletion = async (programUuid) => {
  try {
    const response = await axios.get(
      `${server_url}/quiz/programs/${programUuid}/completion`,
      {
        headers: authHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    console.log(error);
    throw error.response?.data || error;
  }
};

export const downloadProgramCertificate = async (programUuid, programTitle) => {
  try {
    const response = await axios.get(
      `${server_url}/quiz/programs/${programUuid}/certificate`,
      {
        headers: authHeaders(),
        responseType: "blob",
      }
    );

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `${programTitle || "Program"}_Certificate.pdf`
    );
    document.body.appendChild(link);
    link.click();
    link.remove();

    return response.data;
  } catch (error) {
    console.log(error);
    throw error.response?.data || error;
  }
};
