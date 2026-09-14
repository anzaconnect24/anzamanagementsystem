"use client";

import { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Loader from "@/components/common/Loader";
import NoData from "@/component/noData";
import Image from "@/utils/image";
import { UserContext } from "../../../layouts/DashboardLayout";
import { useTranslation } from "@/locales";
import {
  getCohortStartups,
  setCohortStartups,
  setStartupStatus,
  getCohortDashboard,
  statusLabel,
  MEMBERSHIP_STATUSES,
  UNASSIGNED_PROGRAM_KEY,
} from "@/controllers/cohort_controller";
import { getEnterprenuers } from "@/controllers/user_controller";
import { getCohortLeads, setCohortLeads } from "@/controllers/cohort_controller";
import SessionFormModal, {
  CAN_COACH_ROLES,
} from "@/components/programs/SessionFormModal";
import { cohortOf } from "@/controllers/cohort_controller";
import {
  FaBuilding,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaSearch,
  FaUsers,
  FaBookOpen,
  FaClipboardList,
  FaUserEdit,
  FaPlus,
  FaUserSlash,
  FaPlayCircle,
  FaBriefcase,
  FaHandHoldingUsd,
  FaChartLine,
  FaFileAlt,
  FaUserTie,
  FaFolderOpen,
  FaBell,
  FaBullseye,
} from "react-icons/fa";

// Roles allowed to change a program's roster.
const CAN_MANAGE_ROLES = ["Admin", "BDA"];

// Monitoring & Evaluation belongs to the M&E Officer ("ME") alone.
const CAN_VIEW_ME_ROLES = ["ME"];

// Every programme is run by a Business Development Advisor. Only an Admin
// decides who, which is what the API enforces on PUT /leads.
const CAN_ASSIGN_LEAD_ROLES = ["Admin"];

// The Program Calendar is run by whoever runs the programme. The
// API narrows this further to the advisor actually leading it.
const CAN_PLAN_ROLES = ["Admin", "BDA"];

// Coaching oversight is read by everyone who runs or delivers the
// programme. The API decides how much of it each of them sees.
const CAN_COACH_VIEW_ROLES = ["Admin", "BDA", "Mentor", "ME"];

// The document library is read by everyone who runs or reports on the
// programme; the API decides who may file into it.
const CAN_FILE_DOCUMENT_ROLES = ["Admin", "BDA", "ME", "Finance"];

// The M&E Officer opens a programme only to monitor it, so the learning
// delivery tools are not theirs. The course endpoints refuse them anyway;
// this keeps the button from being a dead end.
const HIDE_LEARNING_ROLES = ["ME"];

// Staff read the roster's Progress percentage, which is these same milestone
// counts expressed as a percentage, so the raw column is dropped for them.
const HIDE_MILESTONES_ROLES = ["BDA"];

// Surveys are an M&E instrument, so the M&E Officer is the only role that
// writes them. Mirrors AUTHOR_ROLES on the survey API.
const CAN_MANAGE_SURVEY_ROLES = ["ME"];

// The dashboard tiles. Each states its label in words, so the colour is not
// the only thing distinguishing at-risk from dropped out.
const STAT_TILES = [
  {
    key: "total",
    label: "Total startups",
    icon: FaUsers,
    tone: "text-[#082d77]",
    ring: "bg-[#082d77]/5",
  },
  {
    key: "active",
    label: "Active",
    icon: FaPlayCircle,
    tone: "text-emerald-600",
    ring: "bg-emerald-50",
  },
  {
    key: "droppedOut",
    label: "Dropped out",
    icon: FaUserSlash,
    tone: "text-rose-600",
    ring: "bg-rose-50",
  },
];

// Startup names are entered however the founder typed them — PAYGUARD
// LIMITED, ekomobility — so they are normalised for display rather than
// shouted back. Done here rather than with CSS `capitalize`, which leaves an
// all-caps name all-caps. Mirrors formatCourseName on the programmes page.
const startupName = (value) =>
  String(value || "")
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-GB");
};

// Risk is read off the startup's status in the programme — the only risk
// signal actually recorded today.
// Money and counts are shown as "—" when unset, so a blank never reads as a
// real zero.
const money = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
};

const count = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString("en-US") : "—";
};

const readinessChip = (percent) =>
  percent >= 70
    ? "bg-emerald-50 text-emerald-700"
    : percent >= 50
      ? "bg-amber-50 text-amber-700"
      : "bg-rose-50 text-rose-700";

const riskOf = (status) =>
  status === "dropped_out"
    ? { label: "High", chip: "bg-rose-50 text-rose-700" }
    : { label: "Low", chip: "bg-emerald-50 text-emerald-700" };

const statusChip = (status) => ({
  label:
    MEMBERSHIP_STATUSES.find((item) => item.value === status)?.label ||
    "Active",
  chip:
    status === "dropped_out"
      ? "bg-rose-50 text-rose-700"
      : "bg-emerald-50 text-emerald-700",
});

const ProgramStartups = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const { t, isSwahili } = useTranslation();
  const { userDetails } = useContext(UserContext);

  const isUnassigned = uuid === UNASSIGNED_PROGRAM_KEY;
  const canManage =
    !isUnassigned && CAN_MANAGE_ROLES.includes(userDetails?.role);

  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState(null);
  const [startups, setStartups] = useState([]);
  // Roster split and overall progress, computed by the API so the definition
  // of "progress" lives in one place.
  const [stats, setStats] = useState(null);
  const [keyword, setKeyword] = useState("");

  // The startup a coaching session is being set up for; null closes the form.
  const [sessionFor, setSessionFor] = useState(null);
  const canCoach = !isUnassigned && CAN_COACH_ROLES.includes(userDetails?.role);
  const canViewMe = CAN_VIEW_ME_ROLES.includes(userDetails?.role);
  const canAssignLead = CAN_ASSIGN_LEAD_ROLES.includes(userDetails?.role);
  const canPlan = CAN_PLAN_ROLES.includes(userDetails?.role);
  const canCoachView = CAN_COACH_VIEW_ROLES.includes(userDetails?.role);
  const canFileDocuments = CAN_FILE_DOCUMENT_ROLES.includes(userDetails?.role);

  // Programme leads: who runs it, and everyone who could.
  const [leads, setLeads] = useState([]);
  const [leadCandidates, setLeadCandidates] = useState([]);
  const [leadPicker, setLeadPicker] = useState(false);
  const [leadPicked, setLeadPicked] = useState([]);
  const [savingLeads, setSavingLeads] = useState(false);
  const canViewLearning = !HIDE_LEARNING_ROLES.includes(userDetails?.role);
  const showMilestones = !HIDE_MILESTONES_ROLES.includes(userDetails?.role);
  const canManageSurveys = CAN_MANAGE_SURVEY_ROLES.includes(userDetails?.role);

  // Roster editor
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pool, setPool] = useState([]);
  const [poolLoading, setPoolLoading] = useState(false);
  const [poolSearch, setPoolSearch] = useState("");
  const [selected, setSelected] = useState([]);

  const loadStats = () => {
    if (isUnassigned) return;

    getCohortDashboard(uuid)
      .then(setStats)
      .catch(() => setStats(null));
  };

  // Who runs this programme. Everyone on the page sees the lead; only an
  // Admin can change it.
  const loadLeads = () => {
    if (isUnassigned) return;

    getCohortLeads(uuid)
      .then((body) => {
        setLeads(Array.isArray(body?.data) ? body.data : []);
        setLeadCandidates(
          Array.isArray(body?.candidates) ? body.candidates : [],
        );
      })
      .catch(() => {
        setLeads([]);
        setLeadCandidates([]);
      });
  };

  const saveLeads = async () => {
    setSavingLeads(true);
    const response = await setCohortLeads(uuid, leadPicked);
    setSavingLeads(false);

    if (response?.status === false) {
      toast.error(response.message || "Failed to save the program lead");
      return;
    }

    toast.success("Program lead saved");
    setLeadPicker(false);
    loadLeads();
  };

  const loadRoster = () => {
    setLoading(true);
    loadStats();

    getCohortStartups(uuid)
      .then((body) => {
        setProgram(body?.program || null);
        setStartups(Array.isArray(body?.data) ? body.data : []);
      })
      .catch((error) => {
        console.error(error);
        toast.error(
          error?.response?.status === 404
            ? "Program not found"
            : "Failed to load startups for this program",
        );
        setStartups([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uuid]);

  useEffect(() => {
    loadRoster();
  }, [uuid]);

  const openProfile = (businessUuid) =>
    navigate(`/dashboard/enterprenuers/businessDetails/${businessUuid}`);

  // The tools this programme is run with. Declared as data so the grid is a
  // plain map and each entry states, in one place, who may see it and where it
  // goes. Tints cycle through the palette so no two neighbours look alike.
  const goTo = (suffix) =>
    navigate(`/dashboard/programManagement/program/${uuid}${suffix}`);

  const tools = [
    {
      show: canFileDocuments,
      label: "Dashboard",
      note: "Are we on track?",
      icon: <FaChartLine />,
      
      ink: "text-blue-700",
      onClick: () => goTo("/dashboard"),
    },
    {
      show: canFileDocuments,
      label: "Grant recipients",
      note: "Who receives a grant",
      icon: <FaHandHoldingUsd />,
      
      ink: "text-emerald-700",
      onClick: () => goTo("/grants"),
    },
    {
      show: canPlan,
      label: "Workplan",
      note: "Outputs and activities",
      icon: <FaClipboardList />,
      ink: "text-indigo-700",
      onClick: () => goTo("/workplan"),
    },
    {
      show: canFileDocuments,
      label: "Milestones & KPIs",
      note: "What startups must report",
      icon: <FaBullseye />,
      ink: "text-orange-700",
      onClick: () => goTo("/milestones-kpis"),
    },
    {
      show: canPlan,
      label: "Program Calendar",
      note: "Dated delivery work",
      icon: <FaCalendarAlt />,

      ink: "text-cyan-700",
      onClick: () => goTo("/calendar"),
    },
    {
      show: canCoachView,
      label: "Coaching",
      note: "Who coaches whom",
      icon: <FaUserTie />,
      
      ink: "text-violet-700",
      onClick: () => goTo("/coaching"),
    },
    {
      show: canFileDocuments,
      label: "Documents",
      note: "Contracts and evidence",
      icon: <FaFolderOpen />,
      
      ink: "text-amber-700",
      onClick: () => goTo("/documents"),
    },
    {
      show: canFileDocuments,
      label: "Communications",
      note: "Announcements and alerts",
      icon: <FaBell />,
      
      ink: "text-pink-700",
      onClick: () => goTo("/communications"),
    },
    {
      show: canFileDocuments,
      label: "Reports",
      note: "Monthly to donor",
      icon: <FaFileAlt />,
      
      ink: "text-sky-700",
      onClick: () => goTo("/reports"),
    },
    {
      show: canViewLearning,
      label: "Learning hub",
      note: "Courses on this program",
      icon: <FaBookOpen />,
      
      ink: "text-teal-700",
      onClick: () => goTo("/courses"),
    },
    {
      show: canManageSurveys,
      label: "Surveys",
      note: "Ask the cohort",
      icon: <FaClipboardList />,
      
      ink: "text-purple-700",
      onClick: () => goTo("/surveys"),
    },
    {
      show: canViewMe,
      label: "M&E",
      note: "Indicators and impact",
      icon: <FaChartLine />,
      
      ink: "text-rose-700",
      onClick: () => goTo("/me"),
    },
    {
      show: canAssignLead,
      label: leads.length ? "Change lead" : "Assign lead",
      note: leads.length
        ? leads.map((person) => person.name).join(", ")
        : "Nobody assigned yet",
      icon: <FaUserTie />,
      
      ink: "text-slate-700",
      onClick: () => {
        setLeadPicked(leads.map((person) => person.uuid));
        setLeadPicker(true);
      },
    },
  ].filter((tool) => tool.show);

  const openRosterEditor = () => {
    setSelected(startups.map((item) => item.uuid));
    setPoolSearch("");
    setShowModal(true);

    // The pool is every startup on the platform, so a startup can be pulled
    // in from another cohort or from the unassigned pile. The keyword must be
    // empty, not " " — the backend LIKEs "% %" against the business name, so a
    // space drops every startup whose name has no space in it.
    setPoolLoading(true);
    getEnterprenuers(1000, 1, "")
      .then((body) => {
        const list = Array.isArray(body?.data) ? body.data : [];
        setPool(
          list
            .filter((item) => item?.Business?.uuid)
            .map((item) => ({
              uuid: item.Business.uuid,
              name: item.Business.name || item.name || "Unnamed startup",
              email: item.Business.email || item.email || "",
              currentProgram: cohortOf(item.Business)?.title || "",
            })),
        );
      })
      .catch(() => {
        toast.error("Failed to load the startup pool");
        setPool([]);
      })
      .finally(() => setPoolLoading(false));
  };

  const toggleSelected = (businessUuid) =>
    setSelected((prev) =>
      prev.includes(businessUuid)
        ? prev.filter((item) => item !== businessUuid)
        : [...prev, businessUuid],
    );

  const saveRoster = async () => {
    setSaving(true);

    const response = await setCohortStartups(uuid, selected);

    setSaving(false);

    if (response?.status !== true) {
      toast.error(response?.message || "Failed to update the roster");
      return;
    }

    toast.success("Program roster updated");
    setShowModal(false);
    loadRoster();
  };

  // Where a startup stands in this program. Feeds the Program Dashboard.
  const changeStatus = async (businessUuid, status) => {
    const response = await setStartupStatus(uuid, businessUuid, status);

    if (response?.status !== true) {
      toast.error(response?.message || "Failed to update status");
      return;
    }

    toast.success("Status updated");
    loadRoster();
  };

  const search = keyword.trim().toLowerCase();
  const visible = search
    ? startups.filter((item) =>
        `${item.name || ""} ${item.email || ""}`.toLowerCase().includes(search),
      )
    : startups;

  const title = isUnassigned
    ? "Unassigned startups"
    : program?.title || "Program";

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen px-6 py-4">
      {/* HERO */}
      <div className="relative mb-8 min-h-[240px] overflow-hidden rounded-2xl bg-black shadow-sm">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('${program?.image || "/images/mentor_hero.svg"}')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-[#c9672b]/30" />

        <div className="relative z-10 max-w-3xl p-10 text-white">
          {!isUnassigned && program?.category && (
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-sm font-medium shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[#f08a3c]" />
              {program.category}
            </span>
          )}

          <h2 className="mb-3 text-3xl font-bold leading-tight drop-shadow-lg md:text-4xl">
            {title}
          </h2>

          {!isUnassigned && program?.description && (
            <p className="mb-4 max-w-2xl text-sm leading-6 text-white/85 drop-shadow-md">
              {program.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-6 text-sm text-white/85">
            <span className="flex items-center gap-2">
              <FaUsers />
              {startups.length} {startups.length === 1 ? "startup" : "startups"}{" "}
              in this {isUnassigned ? "list" : "program"}
            </span>

            {/* Who runs the programme, so it is answerable to someone on
                sight rather than only inside the picker. */}
            {!isUnassigned && (
              <span className="flex items-center gap-2">
                <FaUserTie />
                {leads.length
                  ? leads.map((person) => person.name).join(", ")
                  : "No program lead assigned"}
              </span>
            )}

            {!isUnassigned && (program?.startDate || program?.endDate) && (
              <span className="flex items-center gap-2">
                <FaCalendarAlt />
                {formatDate(program?.startDate)} &ndash;{" "}
                {formatDate(program?.endDate)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* PROGRAM DASHBOARD */}
      {!isUnassigned && stats && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {[
              ...STAT_TILES.map((tile) => ({
                key: tile.key,
                label: tile.label,
                icon: tile.icon,
                tone: tile.tone,
                ring: tile.ring,
                value: count(stats.totals[tile.key] ?? 0),
                valueTone: "text-slate-950",
              })),
              {
                key: "jobsCreated",
                label: "Jobs created",
                icon: FaBriefcase,
                tone: "text-sky-700",
                ring: "bg-sky-50",
                value: count(stats.totals.jobsCreated),
                valueTone: "text-slate-950",
              },
              {
                key: "capitalMobilised",
                label: "Capital mobilised",
                icon: FaHandHoldingUsd,
                tone: "text-indigo-700",
                ring: "bg-indigo-50",
                value: money(stats.totals.capitalMobilised),
                valueTone: "text-slate-950",
              },
              {
                key: "revenueGrowth",
                label: "Revenue growth",
                icon: FaChartLine,
                tone: "text-emerald-700",
                ring: "bg-emerald-50",
                value:
                  stats.revenueGrowthPercent === null ||
                  stats.revenueGrowthPercent === undefined
                    ? "—"
                    : `${stats.revenueGrowthPercent >= 0 ? "+" : ""}${stats.revenueGrowthPercent}%`,
                valueTone:
                  stats.revenueGrowthPercent === null ||
                  stats.revenueGrowthPercent === undefined
                    ? "text-slate-400"
                    : stats.revenueGrowthPercent >= 0
                      ? "text-emerald-600"
                      : "text-rose-600",
                hint: stats.revenueGrowthBasis,
              },
            ].map((tile) => {
              const Icon = tile.icon;

              return (
                <div
                  key={tile.key}
                  className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm"
                  title={tile.hint || undefined}
                >
                  <span
                    className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full ${tile.ring} ${tile.tone}`}
                  >
                    <Icon className="text-sm" />
                  </span>

                  {/* Long values (money) wrap rather than overflow the card. */}
                  <p
                    className={`break-words text-lg font-black leading-tight ${tile.valueTone}`}
                  >
                    {tile.value}
                  </p>
                  <p className="mt-1 text-xs font-medium leading-snug text-[#6f6f72]">
                    {tile.label}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mb-8 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="text-lg font-black tracking-tight text-slate-950">
                  Overall program progress
                </h3>
                <p className="mt-1 text-sm text-[#6f6f72]">
                  Milestones completed across the program. Startups that dropped
                  out are left out, so leaving does not drag progress down.
                </p>
              </div>

              <span className="text-3xl font-black text-[#082d77]">
                {stats.progressPercent}%
              </span>
            </div>

            <div
              className="h-3 w-full overflow-hidden rounded-full bg-slate-100"
              role="progressbar"
              aria-valuenow={stats.progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Overall program progress"
            >
              <div
                className="h-full rounded-full bg-[#16a34a] transition-all"
                style={{ width: `${stats.progressPercent}%` }}
              />
            </div>

            <p className="mt-3 text-sm text-[#6f6f72]">
              {stats.totals.total === 0
                ? "No startups in this program yet."
                : stats.progressBasis}
            </p>
          </div>
        </>
      )}

      {/* PROGRAM TOOLS
          Everything the lead runs this programme with, as one set of cards
          rather than a wrapping row of look-alike buttons. The cards are
          white; the colour is carried by the icon alone, so a tool is picked
          out by its mark and position without the grid turning into a
          patchwork. */}
      {!isUnassigned && tools.length > 0 && (
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
          {tools.map((tool) => (
            <button
              key={tool.label}
              type="button"
              onClick={tool.onClick}
              className="rounded-2xl bg-white p-5 text-left shadow-sm shadow-slate-200/50 ring-1 ring-slate-200/70 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className={`text-xl ${tool.ink}`}>{tool.icon}</span>

              <span className="mt-4 block text-sm font-bold text-slate-900">
                {tool.label}
              </span>

              <span className="mt-1 block text-sm text-[#667085]">
                {tool.note}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* TOOLBAR */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="relative min-w-[260px] flex-1">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8f98]" />
          <input
            type="text"
            placeholder="Search startups..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full rounded-md border border-black/10 bg-white px-4 py-3 pl-10 text-sm text-[#172033] outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
          />
        </div>

        {canManage && (
          <button
            type="button"
            onClick={openRosterEditor}
            className="inline-flex items-center gap-2 rounded-lg bg-[#16a34a] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#15803d] hover:shadow-md active:scale-[0.98]"
          >
            <FaUserEdit className="text-lg text-emerald-100" />
            Manage startups
          </button>
        )}
      </div>

      {/* STARTUP PORTFOLIO */}
      {visible.length < 1 ? (
        <NoData />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          {/* The table scrolls inside its own box so the page never scrolls
              sideways on a narrow screen. */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1400px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold tracking-wide text-slate-500">
                  <th className="px-5 py-4">Startup</th>
                  <th className="px-5 py-4">Sector</th>
                  <th className="px-5 py-4">Region</th>
                  <th className="px-5 py-4">Progress</th>
                  {showMilestones && (
                    <th className="px-5 py-4">Milestones</th>
                  )}
                  <th className="px-5 py-4">Modules</th>
                  <th className="px-5 py-4">Revenue Growth</th>
                  <th className="px-5 py-4">Jobs</th>
                  <th className="px-5 py-4">Capital Raised</th>
                  <th className="px-5 py-4">Capital Readiness</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Risk</th>
                  <th className="px-5 py-4">Action</th>
                </tr>
              </thead>

              <tbody>
                {visible.map((item) => {
                  const total = item.milestonesTotal || 0;
                  const done = item.milestonesCompleted || 0;
                  const progress = total
                    ? Math.round((done / total) * 100)
                    : null;
                  const risk = riskOf(item.membershipStatus);
                  const status = statusChip(item.membershipStatus);

                  return (
                    <tr
                      key={item.uuid}
                      onClick={() => openProfile(item.uuid)}
                      // A clickable row is not reachable by keyboard on its
                      // own, so it is exposed as a button and responds to
                      // Enter and Space like one.
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openProfile(item.uuid);
                        }
                      }}
                      className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50/70 focus:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#082d77]"
                    >
                      <td className="px-5 py-4">
                        <span className="font-bold text-slate-900">
                          {startupName(item.name) ||
                            t("users.unnamedBusiness", "Unnamed business")}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-[#6f6f72]">
                        {(isSwahili
                          ? item?.BusinessSector?.swName
                          : item?.BusinessSector?.name) || "—"}
                      </td>

                      <td className="px-5 py-4 text-[#6f6f72]">
                        {item.location || "—"}
                      </td>

                      <td className="px-5 py-4">
                        {progress === null ? (
                          <span className="text-slate-400">—</span>
                        ) : (
                          <span
                            className={`rounded-md px-2.5 py-1 text-xs font-bold ${
                              progress >= 75
                                ? "bg-emerald-50 text-emerald-700"
                                : progress >= 50
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            {progress}%
                          </span>
                        )}
                      </td>

                      {showMilestones && (
                        <td className="px-5 py-4 text-[#6f6f72]">
                          {total ? `${done} / ${total}` : "—"}
                        </td>
                      )}

                      <td className="px-5 py-4">
                        {item.modulesTotal ? (
                          <span
                            className={`rounded-md px-2.5 py-1 text-xs font-bold ${
                              item.modulesCompleted >= item.modulesTotal
                                ? "bg-emerald-50 text-emerald-700"
                                : item.modulesCompleted > 0
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-slate-100 text-slate-600"
                            }`}
                            title="Modules created for this program that the startup has finished"
                          >
                            {item.modulesCompleted} / {item.modulesTotal}
                          </span>
                        ) : (
                          <span
                            className="text-slate-400"
                            title="No modules have been added to this program yet"
                          >
                            —
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {item.revenueGrowthPercent === null ||
                        item.revenueGrowthPercent === undefined ? (
                          <span className="text-slate-400">—</span>
                        ) : (
                          <span
                            className={
                              item.revenueGrowthPercent >= 0
                                ? "font-bold text-emerald-600"
                                : "font-bold text-rose-600"
                            }
                          >
                            {item.revenueGrowthPercent >= 0 ? "+" : ""}
                            {item.revenueGrowthPercent}%{" "}
                            {item.revenueGrowthPercent >= 0 ? "↑" : "↓"}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-[#6f6f72]">
                        {count(item.jobsCreated)}
                      </td>

                      <td className="px-5 py-4 text-[#6f6f72]">
                        {money(item.capitalRaised)}
                      </td>

                      <td className="px-5 py-4">
                        {item.capitalReadinessPercent === null ||
                        item.capitalReadinessPercent === undefined ? (
                          <span
                            className="text-slate-400"
                            title="No published CRAT assessment yet"
                          >
                            —
                          </span>
                        ) : (
                          <span
                            className={`rounded-md px-2.5 py-1 text-xs font-bold ${readinessChip(item.capitalReadinessPercent)}`}
                            title="Overall score from the startup's latest published CRAT assessment"
                          >
                            {item.capitalReadinessPercent}%
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {canManage ? (
                          <select
                            value={item.membershipStatus || "active"}
                            onClick={(event) => event.stopPropagation()}
                            onChange={(event) => {
                              event.stopPropagation();
                              changeStatus(item.uuid, event.target.value);
                            }}
                            className="rounded-md border border-black/10 bg-white px-2 py-1 text-xs font-semibold text-[#172033]"
                          >
                            {MEMBERSHIP_STATUSES.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span
                            className={`rounded-md px-2.5 py-1 text-xs font-bold ${status.chip}`}
                          >
                            {status.label}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-md px-2.5 py-1 text-xs font-bold ${risk.chip}`}
                        >
                          {risk.label}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">{canViewMe && (<button type="button" onClick={(event)=>{event.stopPropagation();navigate(`/dashboard/programManagement/program/${uuid}/me?businessUuid=${encodeURIComponent(item.uuid)}`)}} className="rounded-lg border border-[#082d77]/20 px-3 py-2 text-xs font-semibold text-[#082d77]">M&amp;E profile</button>)}{canCoach && (
                          <button
                            type="button"
                            onClick={(event) => {
                              // Row click opens the profile; this must not.
                              event.stopPropagation();
                              setSessionFor({
                                uuid: item.uuid,
                                name: item.name,
                              });
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#16a34a] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#15803d]"
                          >
                            <FaPlus className="text-[10px]" />
                            Set up session
                          </button>
                        )}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {sessionFor && (
        <SessionFormModal
          programUuid={uuid}
          programTitle={program?.title}
          startup={sessionFor}
          onClose={() => setSessionFor(null)}
          onSaved={() => setSessionFor(null)}
        />
      )}

      {/* ROSTER EDITOR */}
      {/* PROGRAM LEAD */}
      {leadPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="border-b border-slate-100 p-6">
              <h3 className="text-xl font-black tracking-tight text-slate-950">
                Program lead
              </h3>
              <p className="mt-1 text-sm text-[#667085]">
                The Business Development Advisor who runs {program?.title || "this program"}.
                Leads are notified about their cohort and can reach it in the tracker.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {leadCandidates.length === 0 ? (
                <p className="p-6 text-center text-sm text-slate-500">
                  No one is eligible to lead a program yet.
                </p>
              ) : (
                leadCandidates.map((person) => {
                  const picked = leadPicked.includes(person.uuid);

                  return (
                    <button
                      key={person.uuid}
                      type="button"
                      aria-pressed={picked}
                      onClick={() =>
                        setLeadPicked((prev) =>
                          prev.includes(person.uuid)
                            ? prev.filter((item) => item !== person.uuid)
                            : [...prev, person.uuid],
                        )
                      }
                      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition ${
                        picked ? "bg-[#f0fdf4]" : "hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`grid h-4 w-4 shrink-0 place-items-center rounded border text-[10px] text-white ${
                          picked
                            ? "border-[#16a34a] bg-[#16a34a]"
                            : "border-slate-300"
                        }`}
                      >
                        {picked ? "✓" : null}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-slate-900">
                          {person.name}
                        </span>
                        <span className="block truncate text-xs text-[#667085]">
                          {person.email}
                        </span>
                      </span>

                      <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                        {person.role === "BDA"
                          ? "Business Development Advisor"
                          : person.role}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 p-6">
              <button
                type="button"
                onClick={() => setLeadPicker(false)}
                disabled={savingLeads}
                className="rounded-lg bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-200 disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveLeads}
                disabled={savingLeads}
                className="rounded-lg bg-[#082d77] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#061f54] disabled:opacity-60"
              >
                {savingLeads ? "Saving..." : "Save lead"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6">
            <h3 className="mb-1 text-2xl font-semibold text-[#111827]">
              Startups in {program?.title || "this program"}
            </h3>
            <p className="mb-4 text-sm text-[#64748b]">
              {selected.length} selected. Unticking a startup removes it from
              this program — it is never deleted.
            </p>

            <input
              className="mb-2 w-full rounded-lg border border-[#b7c5e5] px-3 py-2"
              placeholder="Search startups..."
              value={poolSearch}
              onChange={(e) => setPoolSearch(e.target.value)}
            />

            <div className="max-h-72 space-y-1 overflow-auto rounded-lg border border-[#b7c5e5] p-2">
              {poolLoading && (
                <p className="p-2 text-sm text-[#64748b]">
                  Loading startups...
                </p>
              )}

              {!poolLoading && pool.length === 0 && (
                <p className="p-2 text-sm text-[#64748b]">
                  No startups available.
                </p>
              )}

              {!poolLoading &&
                pool
                  .filter((item) => {
                    const term = poolSearch.trim().toLowerCase();
                    if (!term) return true;
                    return `${item.name} ${item.email}`
                      .toLowerCase()
                      .includes(term);
                  })
                  .map((item) => {
                    // Flag startups currently sitting in a different cohort —
                    // ticking them here moves them out of that one.
                    const movingFrom =
                      item.currentProgram &&
                      item.currentProgram !== program?.title
                        ? item.currentProgram
                        : "";

                    return (
                      <label
                        key={item.uuid}
                        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-[#f1f5f9]"
                      >
                        <input
                          type="checkbox"
                          checked={selected.includes(item.uuid)}
                          onChange={() => toggleSelected(item.uuid)}
                        />
                        <span className="font-medium text-[#111827]">
                          {item.name}
                        </span>
                        {item.email && (
                          <span className="text-xs text-[#64748b]">
                            {item.email}
                          </span>
                        )}
                        {movingFrom && (
                          <span className="ml-auto shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                            in {movingFrom}
                          </span>
                        )}
                      </label>
                    );
                  })}
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg border border-black/15 px-5 py-2 font-medium text-[#334155]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveRoster}
                disabled={saving || poolLoading}
                className="rounded-lg bg-[#163b8f] px-5 py-2 font-semibold text-white disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save roster"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgramStartups;
