import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Building2 } from "lucide-react";
import Loader from "@/components/common/Loader";
import {
  getAdminBusinesses,
  getAdminMilestones,
  getAdminTrackerOverview,
  getAdminWeeklyLogs,
  listMentorEnterprises,
} from "@/controllers/trackerController";
import { getPrograms } from "@/controllers/program_controller";
import { isTrackerProgram } from "@/utils/programMeta";

const TRACKER_STARTUPS_MARKER = "__TRACKER_STARTUPS__:";

// Read the selected-startup members out of a program description.
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

const formatMoney = (value) => `TZS ${Number(value || 0).toLocaleString()}`;

// Per-program financial roll-up from the startups selected into the program.
// member shape: { grantUsd, disbursed, utilized, overdueReports }
const programFinancials = (program) => {
  const members = parseProgramStartups(program);
  let approved = 0;
  let disbursed = 0;
  let utilized = 0;
  let overdue = 0;
  members.forEach((m) => {
    const grant = Number(m?.grantUsd || 0);
    if (Number.isFinite(grant)) {
      approved += grant;
      if (m?.disbursed) disbursed += grant;
    }
    const util = Number(m?.utilized || 0);
    if (Number.isFinite(util)) utilized += util;
    overdue += Number(m?.overdueReports || 0);
  });
  return {
    startups: members.length,
    approved,
    disbursed,
    utilized,
    remaining: approved - utilized,
    undisbursed: approved - disbursed,
    pendingTranche: Math.max(disbursed - utilized, 0),
    overdue,
    risk: overdue > 0 ? "Critical" : "On track",
  };
};

const riskPillClass = (risk) => {
  if (risk === "Critical") return "bg-[#fde0e0] text-[#a11111]";
  if (risk === "At risk") return "bg-[#fdf1ce] text-[#8a6500]";
  return "bg-[#e1f0d8] text-[#2d6e1f]";
};

const getFlagPillClass = (flag) => {
  if (flag === "green") return "bg-[#e1f0d8] text-[#2d6e1f]";
  if (flag === "amber") return "bg-[#fdf1ce] text-[#8a6500]";
  return "bg-[#fde0e0] text-[#a11111]";
};

const getFlagLabel = (flag) => {
  if (flag === "green") return "On track";
  if (flag === "amber") return "At risk";
  if (flag === "red") return "Critical";
  return "Unknown";
};

const getMilestonePillClass = (status) => {
  if (status === "completed") return "bg-[#e1f0d8] text-[#2d6e1f]";
  if (status === "in_progress" || status === "submitted") {
    return "bg-[#dbe8ff] text-[#163b8f]";
  }
  if (status === "pending") return "bg-[#eef2f8] text-[#475569]";
  if (status === "overdue" || status === "rejected") {
    return "bg-[#fde0e0] text-[#a11111]";
  }
  return "bg-[#eef2f8] text-[#475569]";
};

const formatMilestoneStatus = (status) =>
  String(status || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatDateDisplay = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB");
};

const AdminTrackerOverview = () => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [weeklyLogs, setWeeklyLogs] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [weeklyPagination, setWeeklyPagination] = useState({
    page: 1,
    totalPages: 1,
  });
  const [milestonePagination, setMilestonePagination] = useState({
    page: 1,
    totalPages: 1,
  });
  const [flagFilter, setFlagFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [businesses, setBusinesses] = useState([]);
  const [weeklyBusinessFilter, setWeeklyBusinessFilter] = useState("");
  const [milestoneBusinessFilter, setMilestoneBusinessFilter] = useState("");
  const [selectedWeeklyLog, setSelectedWeeklyLog] = useState(null);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [enterprises, setEnterprises] = useState([]);
  const [programs, setPrograms] = useState([]);

  const navigate = useNavigate();

  const loadOverview = async () => {
    const data = await getAdminTrackerOverview();
    setOverview(data || null);
  };

  const loadEnterprises = async () => {
    const data = await listMentorEnterprises();
    setEnterprises(Array.isArray(data) ? data : []);
  };

  const loadPrograms = async () => {
    const response = await getPrograms(1, 500);
    // Only grant programs count here — learn-and-grow courses (BFA, IR, etc.)
    // are excluded from the Grant Management dashboard.
    const all = Array.isArray(response?.data) ? response.data : [];
    setPrograms(all.filter((program) => isTrackerProgram(program)));
  };

  // Grant metrics computed from the startups selected into each program.
  const grantStats = (() => {
    const beneficiaries = new Set();
    let totalGrants = 0;
    let disbursed = 0;
    programs.forEach((program) => {
      parseProgramStartups(program).forEach((member) => {
        if (member?.entreprenuerUuid) beneficiaries.add(member.entreprenuerUuid);
        const amount = Number(member?.grantUsd || 0);
        if (Number.isFinite(amount)) {
          totalGrants += amount;
          if (member?.disbursed) disbursed += amount;
        }
      });
    });
    return {
      beneficiaries: beneficiaries.size,
      programs: programs.length,
      totalGrants,
      disbursed,
    };
  })();

  const loadBusinesses = async () => {
    const data = await getAdminBusinesses();
    setBusinesses(Array.isArray(data) ? data : []);
  };

  const loadWeeklyLogs = async (
    page = 1,
    currentFlag = flagFilter,
    currentBusinessUuid = weeklyBusinessFilter,
  ) => {
    const data = await getAdminWeeklyLogs({
      page,
      limit: 10,
      flag: currentFlag,
      businessUuid: currentBusinessUuid,
    });
    setWeeklyLogs(data?.weeklyLogs || []);
    setWeeklyPagination({
      page: data?.pagination?.page || 1,
      totalPages: data?.pagination?.totalPages || 1,
    });
  };

  const loadMilestones = async (
    page = 1,
    currentStatus = statusFilter,
    currentBusinessUuid = milestoneBusinessFilter,
  ) => {
    const data = await getAdminMilestones({
      page,
      limit: 10,
      status: currentStatus,
      businessUuid: currentBusinessUuid,
    });
    setMilestones(data?.milestones || []);
    setMilestonePagination({
      page: data?.pagination?.page || 1,
      totalPages: data?.pagination?.totalPages || 1,
    });
  };

  const load = async () => {
    setLoading(true);
    await Promise.all([loadOverview(), loadEnterprises(), loadPrograms()]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="space-y-6 px-6 py-6">
      <section
        className="relative overflow-hidden rounded-2xl bg-slate-950 px-7 py-6 text-white shadow-sm shadow-slate-300/70 md:px-10 md:py-7"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.6) 50%, rgba(0, 0, 0, 0.2) 100%), url('/images/mentor_hero.svg')",
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-bold text-white shadow-sm backdrop-blur">
              <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
              Grant Management
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">Grant Management</h1>
            <p className="mt-3 text-sm leading-7 text-white/85 md:text-base">
              Programs, beneficiaries, grants, and disbursement snapshot.
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-black/10 bg-white p-4">
          <div className="text-3xl font-semibold">{grantStats.beneficiaries}</div>
          <div className="mt-1 text-sm text-black/60">Total beneficiaries</div>
        </div>
        <div className="rounded-lg border border-black/10 bg-white p-4">
          <div className="text-3xl font-semibold">{grantStats.programs}</div>
          <div className="mt-1 text-sm text-black/60">Programs</div>
        </div>
        <div className="rounded-lg border border-black/10 bg-white p-4">
          <div className="text-3xl font-semibold text-[#082d77]">
            {formatMoney(grantStats.totalGrants)}
          </div>
          <div className="mt-1 text-sm text-black/60">Total grants</div>
        </div>
        <div className="rounded-lg border border-black/10 bg-white p-4">
          <div className="text-3xl font-semibold text-[#2d6e1f]">
            {formatMoney(grantStats.disbursed)}
          </div>
          <div className="mt-1 text-sm text-black/60">Amount disbursed</div>
        </div>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#082d77]/5 text-[#082d77]">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#111827]">Program-Level Financial Summary</h2>
            <p className="text-sm text-black/60">
              Approved budget, disbursement, utilization, and reporting risk per program.
            </p>
          </div>
        </div>

        {programs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-black/20 p-6 text-center text-sm text-black/60">
            No programs yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead>
                <tr className="border-b border-black/10 text-xs text-black/50">
                  <th className="py-3 pr-4 font-semibold">Program</th>
                  <th className="px-3 py-3 text-right font-semibold">Startups</th>
                  <th className="px-3 py-3 text-right font-semibold">Approved</th>
                  <th className="px-3 py-3 text-right font-semibold">Disbursed</th>
                  <th className="px-3 py-3 text-right font-semibold">Utilized</th>
                  <th className="px-3 py-3 text-right font-semibold">Balance</th>
                  <th className="px-3 py-3 text-right font-semibold">Undisbursed</th>
                  <th className="px-3 py-3 text-right font-semibold">Pending tranches</th>
                  <th className="px-3 py-3 text-right font-semibold">Overdue reports</th>
                  <th className="px-3 py-3 text-center font-semibold">Risk</th>
                </tr>
              </thead>
              <tbody>
                {programs.map((program) => {
                  const f = programFinancials(program);
                  return (
                    <tr key={program.uuid} className="border-b border-black/5 text-[#111827]">
                      <td className="py-3 pr-4">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/dashboard/trackerPrograms/${program.uuid}/details`)
                          }
                          className="font-semibold text-[#163b8f] hover:underline"
                        >
                          {program.title || "Untitled program"}
                        </button>
                      </td>
                      <td className="px-3 py-3 text-right">{f.startups}</td>
                      <td className="px-3 py-3 text-right">{f.approved.toLocaleString()}</td>
                      <td className="px-3 py-3 text-right">{f.disbursed.toLocaleString()}</td>
                      <td className="px-3 py-3 text-right">{f.utilized.toLocaleString()}</td>
                      <td className="px-3 py-3 text-right">{f.remaining.toLocaleString()}</td>
                      <td className="px-3 py-3 text-right">{f.undisbursed.toLocaleString()}</td>
                      <td className="px-3 py-3 text-right">{f.pendingTranche.toLocaleString()}</td>
                      <td className="px-3 py-3 text-right">{f.overdue}</td>
                      <td className="px-3 py-3 text-center">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${riskPillClass(f.risk)}`}>
                          {f.risk}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminTrackerOverview;
