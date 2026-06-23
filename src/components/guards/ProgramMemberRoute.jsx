import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { UserContext } from "@/layouts/DashboardLayout";
import { getPrograms } from "@/controllers/program_controller";
import Loader from "@/components/common/Loader";

const TRACKER_STARTUPS_MARKER = "__TRACKER_STARTUPS__:";

const parseProgramStartups = (program) => {
  const text = String(program?.description || "");
  const idx = text.lastIndexOf(TRACKER_STARTUPS_MARKER);
  if (idx === -1) return [];
  const line = text.slice(idx + TRACKER_STARTUPS_MARKER.length).split("\n")[0].trim();
  try {
    const value = JSON.parse(line);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

// Only entrepreneurs selected into a program (by the Finance Officer) can open
// the Enterprise Growth Dashboard routes. Other roles pass through unchanged.
const ProgramMemberRoute = ({ children }) => {
  const { userDetails } = useContext(UserContext);
  const navigate = useNavigate();
  const [status, setStatus] = useState("checking"); // checking | allowed | denied

  useEffect(() => {
    if (!userDetails) return;

    if (userDetails.role !== "Enterprenuer") {
      setStatus("allowed");
      return;
    }
    if (!userDetails.uuid) return;

    let isMounted = true;
    getPrograms(1, 500)
      .then((response) => {
        const programs = Array.isArray(response?.data) ? response.data : [];
        const member = programs.some((program) =>
          parseProgramStartups(program).some(
            (m) => m?.entreprenuerUuid === userDetails.uuid,
          ),
        );
        if (!isMounted) return;
        if (member) {
          setStatus("allowed");
        } else {
          setStatus("denied");
          toast.error("This dashboard is available once you are added to a program.");
          navigate("/dashboard");
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setStatus("denied");
        navigate("/dashboard");
      });

    return () => {
      isMounted = false;
    };
  }, [userDetails?.role, userDetails?.uuid]);

  if (status === "checking") return <Loader />;
  if (status === "denied") return null;
  return children;
};

export default ProgramMemberRoute;
