import axios from "axios";
import { server_url } from "../utils/endpoint";
import { headers } from "../utils/headers";

// Capital facilitation. Every function resolves to the API's own envelope -
// { status: true, body } on success, { status: false, message } on failure -
// and never throws, so a page checks `status` rather than wrapping calls.

const BASE = () => `${server_url}/capital`;

const call = async (method, path, { data, params, fallback = "Something went wrong" } = {}) => {
  try {
    const response = await axios({ method, url: `${BASE()}${path}`, data, params, headers });
    return response.data;
  } catch (error) {
    console.log(error.response);
    return error?.response?.data || { status: false, message: fallback };
  }
};

const enc = encodeURIComponent;

// A file upload. The JSON Content-Type from the shared headers would break the
// multipart boundary, so only the Authorization header is sent.
const uploadTo = async (path, file, fields = {}, fallback = "Upload failed") => {
  try {
    const form = new FormData();
    form.append("file", file);
    Object.entries(fields).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") form.append(key, value);
    });
    const response = await axios.post(`${BASE()}${path}`, form, {
      headers: { Authorization: headers.Authorization },
    });
    return response.data;
  } catch (error) {
    console.log(error.response);
    return error?.response?.data || { status: false, message: fallback };
  }
};

// ---- Who am I, and the lists every form chooses from -------------------------
export const getCapitalPermissions = () => call("get", "/me/permissions");
export const getCapitalOptions = () => call("get", "/options");
export const getCapitalNotifications = () => call("get", "/notifications");

// ---- Dashboard, reports, governance --------------------------------------------
export const getCapitalDashboard = (params) => call("get", "/dashboard", { params });
export const getCapitalReports = (params) => call("get", "/reports", { params });
export const getCapitalFacilitated = (params) => call("get", "/facilitated", { params });
export const getCapitalEnterprises = (params) => call("get", "/enterprises", { params });
export const getCapitalManagers = () => call("get", "/managers");
export const getCapitalAudit = (params) => call("get", "/audit", { params });
export const getCapitalSettings = () => call("get", "/settings");
export const updateCapitalSettings = (data) => call("patch", "/settings", { data, fallback: "Failed to save settings" });
export const getPermissionMatrix = () => call("get", "/permissions");
export const setRolePermission = (data) => call("put", "/permissions", { data, fallback: "Failed to change the permission" });

// ---- Capital requests --------------------------------------------------------------
export const listCapitalRequests = (params) => call("get", "/requests", { params });
export const getCapitalRequest = (uuid) => call("get", `/requests/${enc(uuid)}`);
export const reviewCapitalRequest = (uuid, data) => call("patch", `/requests/${enc(uuid)}/review`, { data, fallback: "Failed to update the request" });
export const uploadRequestDocument = (uuid, file, fields) => uploadTo(`/requests/${enc(uuid)}/documents`, file, fields);

// ---- Capital providers ---------------------------------------------------------------
export const listCapitalProviders = (params) => call("get", "/providers", { params });
export const getCapitalProvider = (uuid) => call("get", `/providers/${enc(uuid)}`);
export const createCapitalProvider = (data) => call("post", "/providers", { data, fallback: "Failed to create the provider" });
export const updateCapitalProvider = (uuid, data) => call("patch", `/providers/${enc(uuid)}`, { data, fallback: "Failed to save the provider" });
export const syncInvestorProviders = () => call("post", "/providers/sync-investors", { fallback: "Failed to sync investors" });

// ---- Matching --------------------------------------------------------------------------
export const getMatchingTable = (params) => call("get", "/matching", { params });
export const getRecommendations = (uuid, params) => call("get", `/matching/${enc(uuid)}`, { params });
export const selectCapitalProvider = (uuid, data) => call("post", `/matching/${enc(uuid)}/select`, { data, fallback: "Failed to select the provider" });
export const recordProviderResponse = (uuid, data) => call("patch", `/opportunities/${enc(uuid)}/provider-response`, { data, fallback: "Failed to record the response" });

// ---- Introductions ------------------------------------------------------------------------
export const listIntroductions = (params) => call("get", "/introductions", { params });
export const reviewIntroduction = (uuid, data) => call("patch", `/introductions/${enc(uuid)}/review`, { data, fallback: "Failed to update the introduction" });

// ---- Opportunities and pipeline --------------------------------------------------------------
export const listOpportunities = (params) => call("get", "/opportunities", { params });
export const getPipeline = (params) => call("get", "/pipeline", { params });
export const getOpportunity = (uuid) => call("get", `/opportunities/${enc(uuid)}`);
export const updateOpportunity = (uuid, data) => call("patch", `/opportunities/${enc(uuid)}`, { data, fallback: "Failed to save the opportunity" });
export const moveOpportunityStage = (uuid, data) => call("patch", `/opportunities/${enc(uuid)}/stage`, { data, fallback: "Failed to move the opportunity" });
export const setCommunicationMode = (uuid, data) => call("patch", `/opportunities/${enc(uuid)}/communication-mode`, { data, fallback: "Failed to change the communication mode" });
export const interveneOnOpportunity = (uuid, data) => call("post", `/opportunities/${enc(uuid)}/interventions`, { data, fallback: "Failed to record the intervention" });
export const reopenOpportunity = (uuid, data) => call("patch", `/opportunities/${enc(uuid)}/reopen`, { data, fallback: "Failed to reopen the opportunity" });
export const recordOpportunityOutcome = (uuid, data) => call("put", `/opportunities/${enc(uuid)}/outcome`, { data, fallback: "Failed to record the outcome" });
export const listCapitalNotes = (type, uuid) => call("get", `/notes/${enc(type)}/${enc(uuid)}`);
export const addCapitalNote = (type, uuid, data) => call("post", `/notes/${enc(type)}/${enc(uuid)}`, { data, fallback: "Failed to save the note" });

// ---- Communications ----------------------------------------------------------------------------
export const getCommunicationCentre = (params) => call("get", "/communications", { params });
export const getModerationQueue = () => call("get", "/communications/queue");
export const moderateCapitalMessage = (uuid, data) => call("patch", `/messages/${enc(uuid)}/moderate`, { data, fallback: "Failed to moderate the message" });
export const getOpportunityThreads = (uuid) => call("get", `/opportunities/${enc(uuid)}/threads`);
export const getCapitalThread = (uuid) => call("get", `/threads/${enc(uuid)}`);
export const postCapitalMessage = (uuid, data) => call("post", `/threads/${enc(uuid)}/messages`, { data, fallback: "Failed to send the message" });

// ---- Deal rooms and documents -----------------------------------------------------------------------
export const listDealRooms = () => call("get", "/deal-rooms");
export const createDealRoom = (uuid, data) => call("post", `/opportunities/${enc(uuid)}/deal-room`, { data, fallback: "Failed to open the deal room" });
export const getOpportunityDocuments = (uuid) => call("get", `/opportunities/${enc(uuid)}/documents`);
export const uploadOpportunityDocument = (uuid, file, fields) => uploadTo(`/opportunities/${enc(uuid)}/documents`, file, fields);
export const changeDocumentVisibility = (uuid, data) => call("patch", `/documents/${enc(uuid)}/visibility`, { data, fallback: "Failed to change who can see the document" });
export const replaceCapitalDocument = (uuid, file, fields) => uploadTo(`/documents/${enc(uuid)}/replace`, file, fields, "Failed to replace the document");
export const deleteCapitalDocument = (uuid, data) => call("delete", `/documents/${enc(uuid)}`, { data, fallback: "Failed to delete the document" });

// Opens or downloads a protected document. The file is fetched with the
// session's token (a plain link would carry none), then handed to the browser.
export const openCapitalDocument = async (uuid, { download = false, name = "document" } = {}) => {
  try {
    const response = await axios.get(`${BASE()}/documents/${enc(uuid)}`, {
      params: download ? { mode: "download" } : {},
      headers: { Authorization: headers.Authorization },
      responseType: "blob",
    });
    const url = URL.createObjectURL(response.data);
    if (download) {
      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } else {
      window.open(url, "_blank", "noopener");
    }
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    return { status: true };
  } catch (error) {
    // The body of a failed blob request is a Blob holding the JSON message.
    let message = "Could not open the document";
    try {
      const text = await error?.response?.data?.text?.();
      message = JSON.parse(text).message || message;
    } catch {
      // keep the default
    }
    return { status: false, message };
  }
};

// ---- Due diligence --------------------------------------------------------------------------------------
export const listDueDiligence = (params) => call("get", "/due-diligence", { params });
export const getDueDiligenceChecklist = (uuid) => call("get", `/opportunities/${enc(uuid)}/due-diligence`);
export const applyDueDiligenceTemplate = (uuid, data) => call("post", `/opportunities/${enc(uuid)}/due-diligence/template`, { data, fallback: "Failed to apply the checklist" });
export const createDueDiligenceItem = (uuid, data) => call("post", `/opportunities/${enc(uuid)}/due-diligence`, { data, fallback: "Failed to add the item" });
export const updateDueDiligenceItem = (uuid, data) => call("patch", `/due-diligence/${enc(uuid)}`, { data, fallback: "Failed to save the item" });
export const deleteDueDiligenceItem = (uuid) => call("delete", `/due-diligence/${enc(uuid)}`, { fallback: "Failed to remove the item" });
export const submitDueDiligenceItem = (uuid, data) => call("patch", `/due-diligence/${enc(uuid)}/submit`, { data, fallback: "Failed to submit the document" });

// ---- Enterprise side ----------------------------------------------------------------------------------------
export const getMyCapitalRequests = () => call("get", "/my/requests");
export const createMyCapitalRequest = (data) => call("post", "/my/requests", { data, fallback: "Failed to submit the request" });
export const updateMyCapitalRequest = (uuid, data) => call("patch", `/my/requests/${enc(uuid)}`, { data, fallback: "Failed to save the request" });
export const getProviderDirectory = (params) => call("get", "/my/providers", { params });
export const getMyIntroductions = () => call("get", "/my/introductions");
export const requestCapitalIntroduction = (data) => call("post", "/my/introductions", { data, fallback: "Failed to request the introduction" });
export const respondToInformationRequest = (uuid, data) => call("patch", `/my/introductions/${enc(uuid)}/permission`, { data, fallback: "Failed to record your decision" });
export const getMyCapitalOpportunities = () => call("get", "/my/opportunities");

// ---- Capital provider side --------------------------------------------------------------------------------------
export const getEnterpriseDirectory = () => call("get", "/provider/enterprises");
export const getProviderIntroductions = () => call("get", "/provider/introductions");
export const expressCapitalInterest = (data) => call("post", "/provider/interests", { data, fallback: "Failed to send your interest" });
export const getProviderOpportunities = () => call("get", "/provider/opportunities");
