import axios from "axios";
import { server_url } from "../utils/endpoint";
import { getUser } from "../utils/local_storage";

// NOTE: The backend does not (yet) have dedicated /staff-entreprenuers routes.
// BDA (Staff) assignments reuse the existing, working /mentor-entreprenuers
// endpoints — the BDA's user id is stored as the "mentor". If dedicated staff
// endpoints are added later, only the URLs below need to change.

const authConfig = () => {
  const user = getUser();
  return {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${user && user.ACCESS_TOKEN}`,
    },
  };
};

// Admin assigns an entrepreneur to a BDA to track & manage milestones.
// Caller payload: { staff_uuid, entreprenuer_uuid }
// Throws on failure so the UI can report it (do not swallow the error here).
export const assignEntreprenuerToStaff = async ({ staff_uuid, entreprenuer_uuid }) => {
  const response = await axios.post(
    `${server_url}/mentor-entreprenuers/`,
    { mentor_uuid: staff_uuid, entreprenuer_uuid },
    authConfig(),
  );
  return response.data.body;
};

// Entrepreneurs assigned to a given BDA.
export const getStaffAssignedEntreprenuers = async (uuid) => {
  try {
    const response = await axios.get(
      `${server_url}/mentor-entreprenuers/mentor/${uuid}`,
      authConfig(),
    );
    return response.data.body;
  } catch (error) {
    console.log(error);
    return [];
  }
};

// The BDA assignment(s) for a given entrepreneur.
export const getEntreprenuerStaff = async (uuid) => {
  try {
    const response = await axios.get(
      `${server_url}/mentor-entreprenuers/entreprenuer/${uuid}`,
      authConfig(),
    );
    return response.data.body;
  } catch (error) {
    console.log(error);
    return [];
  }
};

// Remove a BDA <-> entrepreneur assignment.
export const unassignEntreprenuerFromStaff = async (uuid) => {
  const response = await axios.delete(
    `${server_url}/mentor-entreprenuers/${uuid}`,
    authConfig(),
  );
  return response.data.body;
};
