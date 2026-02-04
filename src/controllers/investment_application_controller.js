import axios from "axios";
import { server_url } from "../utils/endpoint";
import { getUser } from "../utils/local_storage";

/**
 * Get all investment applications for the current entrepreneur
 * @param {number} page - Page number for pagination
 * @param {number} limit - Number of items per page
 * @param {string} status - Filter by status (pending, approved, rejected) - optional
 * @returns {Promise} Response data
 */
export const getMyInvestmentApplications = async (
  page = 1,
  limit = 10,
  status = null,
) => {
  try {
    const user = getUser();
    let url = `${server_url}/investment-applications?page=${page}&limit=${limit}`;

    if (status) {
      url += `&status=${status}`;
    }

    const response = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.ACCESS_TOKEN}`,
      },
    });
    return response.data.body;
  } catch (error) {
    console.error("Error fetching investment applications:", error);
    return { data: [], count: 0 };
  }
};

/**
 * Get a single investment application by UUID
 * @param {string} uuid - Application UUID
 * @returns {Promise} Response data
 */
export const getInvestmentApplication = async (uuid) => {
  try {
    const user = getUser();
    const response = await axios.get(
      `${server_url}/investment-applications/${uuid}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.ACCESS_TOKEN}`,
        },
      },
    );
    return response.data.body;
  } catch (error) {
    console.error("Error fetching investment application:", error);
    return null;
  }
};

/**
 * Create a new investment application
 * @param {Object} data - Application data
 * @returns {Promise} Response data
 */
export const createInvestmentApplication = async (data) => {
  try {
    const user = getUser();
    const response = await axios.post(
      `${server_url}/investment-applications`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.ACCESS_TOKEN}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error creating investment application:", error);
    return error.response;
  }
};

/**
 * Update an investment application
 * @param {string} uuid - Application UUID
 * @param {Object} data - Updated data
 * @returns {Promise} Response data
 */
export const updateInvestmentApplication = async (uuid, data) => {
  try {
    const user = getUser();
    const response = await axios.patch(
      `${server_url}/investment-applications/${uuid}`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.ACCESS_TOKEN}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error updating investment application:", error);
    return error.response;
  }
};

/**
 * Delete an investment application
 * @param {string} uuid - Application UUID
 * @returns {Promise} Response data
 */
export const deleteInvestmentApplication = async (uuid) => {
  try {
    const user = getUser();
    const response = await axios.delete(
      `${server_url}/investment-applications/${uuid}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.ACCESS_TOKEN}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting investment application:", error);
    return error.response;
  }
};

/**
 * Investor shows interest in an application
 * @param {string} uuid - Application UUID
 * @returns {Promise} Response data
 */
export const investorShowInterest = async (uuid) => {
  try {
    const user = getUser();
    const response = await axios.patch(
      `${server_url}/investment-applications/${uuid}/show-interest`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.ACCESS_TOKEN}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error showing interest:", error);
    return error.response;
  }
};

/**
 * Investor approves an application
 * @param {string} uuid - Application UUID
 * @param {string} investorResponse - Response message
 * @returns {Promise} Response data
 */
export const investorApproveApplication = async (uuid, investorResponse) => {
  try {
    const user = getUser();
    const response = await axios.patch(
      `${server_url}/investment-applications/${uuid}/approve`,
      { investorResponse },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.ACCESS_TOKEN}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error approving application:", error);
    return error.response;
  }
};

/**
 * Investor rejects an application
 * @param {string} uuid - Application UUID
 * @param {string} investorResponse - Response message
 * @returns {Promise} Response data
 */
export const investorRejectApplication = async (uuid, investorResponse) => {
  try {
    const user = getUser();
    const response = await axios.patch(
      `${server_url}/investment-applications/${uuid}/reject`,
      { investorResponse },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.ACCESS_TOKEN}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error rejecting application:", error);
    return error.response;
  }
};

/**
 * Mark investment as completed
 * @param {string} uuid - Application UUID
 * @returns {Promise} Response data
 */
export const markInvestmentCompleted = async (uuid) => {
  try {
    const user = getUser();
    const response = await axios.patch(
      `${server_url}/investment-applications/${uuid}/complete`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.ACCESS_TOKEN}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error marking investment completed:", error);
    return error.response;
  }
};

/**
 * Get interested investors for entrepreneur's businesses (investors who sent requests)
 * @param {number} page - Page number for pagination
 * @param {number} limit - Number of items per page
 * @param {string} status - Filter by status (waiting, accepted, rejected) - optional
 * @returns {Promise} Response data
 */
export const getInterestedInvestors = async (
  page = 1,
  limit = 10,
  status = null,
) => {
  try {
    const user = getUser();
    let url = `${server_url}/business_investment_request?page=${page}&limit=${limit}`;

    if (status) {
      url += `&status=${status}`;
    }

    const response = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.ACCESS_TOKEN}`,
      },
    });
    return response.data.body;
  } catch (error) {
    console.error("Error fetching interested investors:", error);
    return { data: [], count: 0 };
  }
};

/**
 * Accept investor's request (entrepreneur approves investor)
 * @param {string} uuid - Request UUID
 * @returns {Promise} Response data
 */
export const acceptInvestorInterest = async (uuid) => {
  try {
    const user = getUser();
    const response = await axios.patch(
      `${server_url}/business_investment_request/entrepreneur/approve/${uuid}`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.ACCESS_TOKEN}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error accepting investor request:", error);
    return error.response;
  }
};

/**
 * Reject investor's request (entrepreneur rejects investor)
 * @param {string} uuid - Request UUID
 * @param {string} reason - Optional rejection reason
 * @returns {Promise} Response data
 */
export const rejectInvestorInterest = async (uuid, reason = null) => {
  try {
    const user = getUser();
    const response = await axios.patch(
      `${server_url}/business_investment_request/entrepreneur/reject/${uuid}`,
      { reason },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.ACCESS_TOKEN}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error rejecting investor request:", error);
    return error.response;
  }
};
