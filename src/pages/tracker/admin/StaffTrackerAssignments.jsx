import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Users, UserCheck, Building2 } from "lucide-react";
import Loader from "@/components/common/Loader";
import { getReviewers, getEnterprenuers } from "@/controllers/user_controller";
import {
  assignEntreprenuerToStaff,
  getStaffAssignedEntreprenuers,
  unassignEntreprenuerFromStaff,
} from "@/controllers/staffEntreprenuerController";

const HERO_IMAGE_URL = "/images/mentor_hero.svg";

const asArray = (value) =>
  Array.isArray(value) ? value : Array.isArray(value?.data) ? value.data : [];

const getEntrepreneurName = (entrepreneur) =>
  entrepreneur?.Business?.name || entrepreneur?.name || entrepreneur?.email || "Unnamed entrepreneur";

const baseSelectClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#082d77] focus:ring-4 focus:ring-[#082d77]/20 disabled:bg-slate-50 disabled:text-slate-400";

const Card = ({ icon, title, subtitle, action, children }) => (
  <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/70">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#082d77]/5 text-[#082d77]">
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-lg font-black tracking-tight text-slate-950">{title}</h2>
          {subtitle && <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
    <div className="mt-6">{children}</div>
  </section>
);

const StaffTrackerAssignments = () => {
  const [loading, setLoading] = useState(true);
  const [staffList, setStaffList] = useState([]);
  const [entrepreneurs, setEntrepreneurs] = useState([]);
  const [selectedStaffUuid, setSelectedStaffUuid] = useState("");
  const [selectedEntrepreneurUuid, setSelectedEntrepreneurUuid] = useState("");
  const [assignments, setAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [removingUuid, setRemovingUuid] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [staffResponse, entrepreneurResponse] = await Promise.all([
          getReviewers(1000, 1),
          getEnterprenuers(1000, 1, " "),
        ]);
        // Staff-role users are the Business Development Advisors (BDAs).
        // "Staff" is displayed for users stored with role "Reviewer".
        const allStaff = asArray(staffResponse);
        const staffOnly = allStaff.filter((user) => ["Staff", "Reviewer"].includes(user.role));
        setStaffList(staffOnly.length ? staffOnly : allStaff);
        setEntrepreneurs(asArray(entrepreneurResponse));
      } catch (error) {
        toast.error(error?.response?.data?.message || "Failed to load staff and entrepreneurs");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const loadAssignments = async (staffUuid) => {
    if (!staffUuid) {
      setAssignments([]);
      return;
    }
    setLoadingAssignments(true);
    try {
      const response = await getStaffAssignedEntreprenuers(staffUuid);
      setAssignments(asArray(response));
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load assignments");
    } finally {
      setLoadingAssignments(false);
    }
  };

  const onSelectStaff = (uuid) => {
    setSelectedStaffUuid(uuid);
    setSelectedEntrepreneurUuid("");
    loadAssignments(uuid);
  };

  const assignedEntrepreneurUuids = useMemo(
    () =>
      new Set(
        assignments
          .map((item) => item?.Entreprenuer?.uuid || item?.entreprenuer_uuid)
          .filter(Boolean),
      ),
    [assignments],
  );

  const availableEntrepreneurs = useMemo(
    () => entrepreneurs.filter((item) => !assignedEntrepreneurUuids.has(item.uuid)),
    [entrepreneurs, assignedEntrepreneurUuids],
  );

  const onAssign = async (e) => {
    e.preventDefault();
    if (!selectedStaffUuid) {
      toast.error("Select a staff member first");
      return;
    }
    if (!selectedEntrepreneurUuid) {
      toast.error("Select an entrepreneur to assign");
      return;
    }
    setIsAssigning(true);
    try {
      await assignEntreprenuerToStaff({
        staff_uuid: selectedStaffUuid,
        entreprenuer_uuid: selectedEntrepreneurUuid,
      });
      toast.success("Entrepreneur assigned to staff");
      setSelectedEntrepreneurUuid("");
      loadAssignments(selectedStaffUuid);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to assign entrepreneur");
    } finally {
      setIsAssigning(false);
    }
  };

  const onUnassign = async (assignment) => {
    const shouldRemove = window.confirm("Remove this entrepreneur from the advisor?");
    if (!shouldRemove) return;
    setRemovingUuid(assignment.uuid);
    try {
      await unassignEntreprenuerFromStaff(assignment.uuid);
      toast.success("Assignment removed");
      loadAssignments(selectedStaffUuid);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to remove assignment");
    } finally {
      setRemovingUuid("");
    }
  };

  if (loading) return <Loader />;

  const selectedStaff = staffList.find((item) => item.uuid === selectedStaffUuid);

  return (
    <div className="min-h-screen bg-[#f3f6fb] px-4 py-6 text-slate-950 md:px-8 xl:px-12">
      <main className="mx-auto max-w-[1480px] space-y-8">
        <section
          className="relative overflow-hidden rounded-2xl bg-slate-950 px-7 py-6 text-white shadow-sm shadow-slate-300/70 md:px-10 md:py-7"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.6) 50%, rgba(0, 0, 0, 0.2) 100%), url(${HERO_IMAGE_URL})`,
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        >
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-bold text-white shadow-sm backdrop-blur">
              <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
              BDA Tracking Assignments
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">Assign Entrepreneurs to a Business Development Advisor</h1>
            <p className="mt-3 text-sm leading-7 text-white/85 md:text-base">
              Choose a Business Development Advisor (BDA) and assign the entrepreneurs they will track and manage milestones for.
            </p>
          </div>
        </section>

        <Card
          icon={<Users className="h-5 w-5" />}
          title="Select Business Development Advisor"
          subtitle="Pick the BDA who will track the assigned entrepreneurs."
        >
          <select
            className={baseSelectClass}
            value={selectedStaffUuid}
            onChange={(e) => onSelectStaff(e.target.value)}
          >
            <option value="">Select Business Development Advisor</option>
            {staffList.map((item) => (
              <option key={item.uuid} value={item.uuid}>
                {item.name || item.email || "Unnamed advisor"}
              </option>
            ))}
          </select>
          {staffList.length === 0 && (
            <p className="mt-3 text-sm text-slate-500">No Business Development Advisors found.</p>
          )}
        </Card>

        {selectedStaffUuid && (
          <>
            <Card
              icon={<UserCheck className="h-5 w-5" />}
              title="Assign an entrepreneur"
              subtitle={`Assign a new entrepreneur to ${selectedStaff?.name || selectedStaff?.email || "this advisor"}.`}
            >
              <form onSubmit={onAssign} className="flex flex-wrap items-end gap-3">
                <div className="min-w-[260px] flex-1">
                  <select
                    className={baseSelectClass}
                    value={selectedEntrepreneurUuid}
                    onChange={(e) => setSelectedEntrepreneurUuid(e.target.value)}
                  >
                    <option value="">Select entrepreneur</option>
                    {availableEntrepreneurs.map((item) => (
                      <option key={item.uuid} value={item.uuid}>
                        {getEntrepreneurName(item)}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={isAssigning}
                  className="rounded-xl bg-[#082d77] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#061f54] disabled:opacity-60"
                >
                  {isAssigning ? "Assigning..." : "Assign"}
                </button>
              </form>
              {availableEntrepreneurs.length === 0 && (
                <p className="mt-3 text-sm text-slate-500">
                  All entrepreneurs are already assigned to this staff member.
                </p>
              )}
            </Card>

            <Card
              icon={<Building2 className="h-5 w-5" />}
              title="Assigned entrepreneurs"
              subtitle="Entrepreneurs this advisor is currently tracking."
            >
              {loadingAssignments ? (
                <p className="text-sm text-slate-500">Loading assignments...</p>
              ) : assignments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                  No entrepreneurs assigned yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {assignments.map((assignment) => {
                    const entrepreneur = assignment?.Entreprenuer || assignment?.entreprenuer || {};
                    return (
                      <div
                        key={assignment.uuid}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-950">
                            {getEntrepreneurName(entrepreneur)}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {entrepreneur?.email || "No email"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onUnassign(assignment)}
                          disabled={removingUuid === assignment.uuid}
                          className="rounded-xl bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
                        >
                          {removingUuid === assignment.uuid ? "Removing..." : "Remove"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </>
        )}
      </main>
    </div>
  );
};

export default StaffTrackerAssignments;
