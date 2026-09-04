"use client";

import { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Loader from "@/components/common/Loader";
import { UserContext } from "../../../layouts/DashboardLayout";
import {
  getCohortModules,
  getCohortStartups,
  getCohortAnalytics,
} from "@/controllers/cohort_controller";
import { deleteModule } from "@/controllers/modules_controller";
import {
  FaArrowRight,
  FaUsers,
  FaBookOpen,
  FaSearch,
  FaTrash,
  FaThLarge,
} from "react-icons/fa";

// Staff author the modules a programme runs. "Staff" is stored as either
// "Staff" or "Reviewer" (see SignUp).
const CAN_MANAGE_ROLES = ["Admin", "Staff", "Reviewer"];

const formatEnrolled = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toISOString().slice(0, 10);
};

const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-GB");
};

const ProgramCourses = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const { userDetails } = useContext(UserContext);
  const canManage = CAN_MANAGE_ROLES.includes(userDetails?.role);

  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState(null);
  const [modules, setModules] = useState([]);
  const [enrolled, setEnrolled] = useState(0);
  const [keyword, setKeyword] = useState("");

  // "modules" | "members" | "analytics" | "certifications"
  const [tab, setTab] = useState("modules");
  const [members, setMembers] = useState(null);
  const [membersLoading, setMembersLoading] = useState(false);

  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const openAnalytics = () => {
    setTab("analytics");
    if (analytics !== null) return;

    setAnalyticsLoading(true);
    getCohortAnalytics(uuid)
      .then(setAnalytics)
      .catch(() => {
        toast.error("Failed to load analytics");
        setAnalytics({ summary: null, data: [] });
      })
      .finally(() => setAnalyticsLoading(false));
  };

  const openMembers = () => {
    setTab("members");
    if (members !== null) return;

    setMembersLoading(true);
    getCohortStartups(uuid)
      .then((body) => setMembers(Array.isArray(body?.data) ? body.data : []))
      .catch(() => {
        toast.error("Failed to load program members");
        setMembers([]);
      })
      .finally(() => setMembersLoading(false));
  };

  const load = () => {
    setLoading(true);

    getCohortModules(uuid)
      .then((body) => {
        setProgram(body?.program || null);
        setModules(Array.isArray(body?.data) ? body.data : []);
        setEnrolled(body?.enrolled || 0);
      })
      .catch((error) => {
        console.error(error);
        toast.error(
          error?.response?.status === 404
            ? "Program not found"
            : "Failed to load this program's modules",
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [uuid]);

  // Straight to the module form with this program already chosen — there is
  // no course to pick in between.
  const openCreateModule = () =>
    navigate(
      `/dashboard/modules/add/?cohortProgram=${encodeURIComponent(uuid)}`,
    );

  const remove = async (module) => {
    if (
      !window.confirm(
        `Delete "${module.title}"? Its slides are deleted with it.`,
      )
    )
      return;

    const response = await deleteModule(module.uuid);

    if (response?.status !== true) {
      toast.error(response?.message || "Failed to delete the module");
      return;
    }

    toast.success("Module deleted");
    load();
  };

  const search = keyword.trim().toLowerCase();
  const visible = search
    ? modules.filter((module) =>
        String(module.title || "")
          .toLowerCase()
          .includes(search),
      )
    : modules;

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen px-6 py-4">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* MAIN */}
        <div className="lg:col-span-2">
          <h1 className="mb-3 text-4xl font-black tracking-tight text-slate-950">
            {program?.title || "Program"}
          </h1>

          <p className="mb-6 text-lg leading-7 text-[#6f6f72]">
            {program?.description || "No description yet."}
          </p>

          <div className="mb-8 flex flex-wrap items-center gap-8 border-y border-slate-200 py-4 text-sm text-[#6f6f72]">
            <span className="flex items-center gap-2">
              <FaUsers className="text-slate-400" />
              <strong className="text-slate-950">{enrolled}</strong> Enrolled
            </span>
            <span className="flex items-center gap-2">
              <FaBookOpen className="text-slate-400" />
              <strong className="text-slate-950">{modules.length}</strong>{" "}
              {modules.length === 1 ? "Module" : "Modules"}
            </span>
          </div>

          {/* TABS — only what exists */}
          <div className="mb-8 inline-flex rounded-xl bg-slate-100 p-1 text-sm font-semibold">
            <button
              type="button"
              onClick={() => setTab("modules")}
              className={
                tab === "modules"
                  ? "rounded-lg bg-white px-4 py-2 text-slate-950 shadow-sm"
                  : "rounded-lg px-4 py-2 text-slate-500 transition hover:text-slate-800"
              }
            >
              Program Modules
            </button>
            <button
              type="button"
              onClick={openMembers}
              className={
                tab === "members"
                  ? "rounded-lg bg-white px-4 py-2 text-slate-950 shadow-sm"
                  : "rounded-lg px-4 py-2 text-slate-500 transition hover:text-slate-800"
              }
            >
              Program Members
            </button>
            <button
              type="button"
              onClick={openAnalytics}
              className={
                tab === "analytics"
                  ? "rounded-lg bg-white px-4 py-2 text-slate-950 shadow-sm"
                  : "rounded-lg px-4 py-2 text-slate-500 transition hover:text-slate-800"
              }
            >
              Analytics
            </button>
            <button
              type="button"
              onClick={() => setTab("certifications")}
              className={
                tab === "certifications"
                  ? "rounded-lg bg-white px-4 py-2 text-slate-950 shadow-sm"
                  : "rounded-lg px-4 py-2 text-slate-500 transition hover:text-slate-800"
              }
            >
              Certifications
            </button>
          </div>

          {tab === "modules" && (
            <>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-2xl font-black tracking-tight text-slate-950">
                  Modules in this Program
                </h2>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative min-w-[240px]">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8f98]" />
                    <input
                      type="text"
                      placeholder="Search modules by title..."
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      className="w-full rounded-lg border border-black/10 bg-white px-4 py-2.5 pl-10 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
                    />
                  </div>

                  {canManage && (
                    <button
                      type="button"
                      onClick={openCreateModule}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#16a34a] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#15803d]"
                    >
                      <FaThLarge className="text-sm" />
                      Add Module
                    </button>
                  )}
                </div>
              </div>

              {visible.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
                  {modules.length === 0
                    ? "No modules have been added to this program yet."
                    : "No modules match that search."}
                </div>
              ) : (
                <div className="space-y-4">
                  {visible.map((module, index) => (
                    <div
                      key={module.uuid}
                      className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-sm font-black text-teal-700">
                        {index + 1}
                      </span>

                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-black leading-snug text-slate-950">
                          {module.title}
                        </h3>

                        <p className="mt-1 text-xs text-[#98A2B3]">
                          {module.slides || 0}{" "}
                          {module.slides === 1 ? "slide" : "slides"}
                        </p>

                        {module.description && (
                          <p className="mt-1 line-clamp-2 text-sm text-[#6f6f72]">
                            {module.description}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/dashboard/programManagement/module/${module.uuid}`,
                          )
                        }
                        className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-[#082d77]"
                      >
                        View Module <FaArrowRight className="text-xs" />
                      </button>

                      {canManage && (
                        <button
                          type="button"
                          title="Delete this module"
                          onClick={() => remove(module)}
                          className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                        >
                          <FaTrash className="text-sm" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === "members" && (
            <>
              <h2 className="mb-6 text-2xl font-black tracking-tight text-slate-950">
                Members in this Program
              </h2>

              {membersLoading ? (
                <div className="rounded-2xl border border-slate-200/80 bg-white p-10 text-center text-sm text-slate-500">
                  Loading members...
                </div>
              ) : !members || members.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
                  No startups are in this program yet.
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[860px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-[#667085]">
                          <th className="px-6 py-4 font-medium">Startup</th>
                          <th className="px-6 py-4 font-medium">Email</th>
                          <th className="px-6 py-4 font-medium">
                            Enrollment Date
                          </th>
                          <th className="px-6 py-4 font-medium">Status</th>
                          <th className="px-6 py-4 font-medium">Progress</th>
                        </tr>
                      </thead>

                      <tbody>
                        {members.map((member) => {
                          const total = member.modulesTotal || 0;
                          const done = member.modulesCompleted || 0;
                          const percent = total
                            ? Math.round((done / total) * 100)
                            : 0;
                          const dropped =
                            member.membershipStatus === "dropped_out";

                          return (
                            <tr
                              key={member.uuid}
                              className="border-b border-slate-100 last:border-0"
                            >
                              <td className="px-6 py-4">
                                <span className="font-bold text-[#082d77]">
                                  {member.name ||
                                    member.Business?.name ||
                                    "Unnamed Business"}
                                </span>
                              </td>

                              <td className="px-6 py-4 text-slate-700">
                                {member.email || member.User?.email || "—"}
                              </td>

                              <td className="px-6 py-4 text-slate-700">
                                {formatEnrolled(member.enrolledAt)}
                              </td>

                              <td className="px-6 py-4">
                                <span
                                  className={
                                    dropped
                                      ? "inline-block rounded-full bg-slate-100 px-4 py-1.5 text-sm font-semibold text-slate-600"
                                      : "inline-block rounded-full bg-teal-500 px-4 py-1.5 text-sm font-semibold text-white"
                                  }
                                >
                                  {dropped ? "Dropped" : "Enrolled"}
                                </span>
                              </td>

                              <td className="px-6 py-4">
                                <p className="mb-1 text-sm text-slate-700">
                                  {percent}%
                                </p>
                                <div
                                  className="h-1.5 w-full max-w-[240px] overflow-hidden rounded-full bg-slate-100"
                                  role="progressbar"
                                  aria-valuenow={percent}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                >
                                  <div
                                    className="h-full rounded-full bg-teal-500"
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {tab === "analytics" && (
            <>
              {analyticsLoading ? (
                <div className="rounded-2xl border border-slate-200/80 bg-white p-10 text-center text-sm text-slate-500">
                  Loading analytics...
                </div>
              ) : (
                <>
                  {analytics?.summary && (
                    <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                      {[
                        {
                          key: "members",
                          label: "Enrolled Startups",
                          value: analytics.summary.members,
                        },
                        {
                          key: "active",
                          label: "Active Startups",
                          value: analytics.summary.active,
                        },
                        {
                          key: "modules",
                          label: "Modules",
                          value: analytics.summary.modules,
                        },
                        {
                          key: "progress",
                          label: "Average Progress",
                          value: `${analytics.summary.averageProgressPercent}%`,
                        },
                        {
                          key: "attempts",
                          label: "Quiz Attempts",
                          value: analytics.summary.quizAttempts,
                        },
                        {
                          key: "score",
                          label: "Average Quiz Score",
                          value:
                            analytics.summary.averageQuizScore === null
                              ? "—"
                              : `${analytics.summary.averageQuizScore}%`,
                        },
                      ].map((tile) => (
                        <div
                          key={tile.key}
                          className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm"
                        >
                          <p className="text-2xl font-black leading-tight text-slate-950">
                            {tile.value}
                          </p>
                          <p className="mt-1 text-xs font-medium leading-snug text-[#667085]">
                            {tile.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                    <div className="p-6">
                      <h2 className="text-2xl font-black tracking-tight text-slate-950">
                        Module-by-Module Analytics
                      </h2>
                      <p className="mt-1 text-sm text-[#667085]">
                        Metrics broken down by individual module in this
                        program.
                      </p>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[820px] text-left text-sm">
                        <thead>
                          <tr className="border-y border-slate-200 text-[#667085]">
                            <th className="px-6 py-4 font-medium">Module</th>
                            <th className="px-6 py-4 text-center font-medium">
                              Enrolled Students
                            </th>
                            <th className="px-6 py-4 text-center font-medium">
                              Average Progress
                            </th>
                            <th className="px-6 py-4 text-center font-medium">
                              Average Quiz Score
                            </th>
                            <th className="px-6 py-4 text-center font-medium">
                              Assignment Pass Rate
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {(analytics?.data || []).length === 0 ? (
                            <tr>
                              <td
                                colSpan={5}
                                className="px-6 py-10 text-center text-sm text-slate-500"
                              >
                                No modules have been added to this program yet.
                              </td>
                            </tr>
                          ) : (
                            analytics.data.map((row) => (
                              <tr
                                key={row.uuid}
                                className="border-b border-slate-100 last:border-0"
                              >
                                <td className="px-6 py-4">
                                  <p className="font-semibold leading-snug text-slate-900">
                                    {row.title}
                                  </p>
                                  <p className="mt-1 text-xs text-[#98A2B3]">
                                    Slides: {row.lessons}
                                  </p>
                                </td>

                                <td className="px-6 py-4 text-center text-slate-700">
                                  {analytics.summary?.members ?? 0}
                                </td>

                                <td className="px-6 py-4">
                                  <div className="flex items-center justify-center gap-2">
                                    <span className="font-bold text-slate-900">
                                      {row.averageProgressPercent}%
                                    </span>
                                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                                      <div
                                        className="h-full rounded-full bg-teal-500"
                                        style={{
                                          width: `${row.averageProgressPercent}%`,
                                        }}
                                      />
                                    </div>
                                  </div>
                                </td>

                                <td className="px-6 py-4 text-center">
                                  {row.quizAttempts === 0 ? (
                                    <span className="font-semibold text-[#d9622b]">
                                      No Attempts
                                    </span>
                                  ) : (
                                    <>
                                      <p className="font-bold text-[#d9622b]">
                                        {row.averageQuizScore}%
                                      </p>
                                      <p className="text-xs text-[#98A2B3]">
                                        Attempts: {row.quizAttempts}
                                      </p>
                                    </>
                                  )}
                                </td>

                                <td className="px-6 py-4 text-center">
                                  <span
                                    className="font-semibold text-[#2563EB]"
                                    title="Assignments are not tracked yet — modules have no assignments or submissions."
                                  >
                                    No Submissions
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {tab === "certifications" && (
            <>
              <h2 className="mb-6 text-2xl font-black tracking-tight text-slate-950">
                Certifications
              </h2>
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
                <FaBookOpen className="mx-auto mb-3 text-3xl text-slate-300" />
                <p className="text-sm text-slate-500">
                  No certificates have been issued for this program yet. Once
                  completing a module earns a startup a certificate, they will
                  be listed here.
                </p>
              </div>
            </>
          )}
        </div>

        {/* SIDEBAR */}
        <aside className="space-y-6">
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div
              className="flex h-44 items-center justify-center bg-slate-950 bg-cover bg-center"
              style={
                program?.image
                  ? { backgroundImage: `url('${program.image}')` }
                  : undefined
              }
            >
              {!program?.image && (
                <div className="text-center text-white/50">
                  <FaThLarge className="mx-auto mb-2 text-3xl" />
                  <p className="text-sm">Program Overview</p>
                </div>
              )}
            </div>

            <div className="p-6">
              <p className="mb-4 text-3xl font-black text-slate-950">
                {program?.category || "Program"}
              </p>

              <div className="space-y-3 border-t border-slate-100 pt-4 text-sm text-[#6f6f72]">
                <p className="flex items-center gap-2">
                  <FaBookOpen className="text-teal-600" />
                  <strong className="text-slate-950">
                    {modules.length}
                  </strong>{" "}
                  Structured {modules.length === 1 ? "Module" : "Modules"}
                </p>
                <p className="flex items-center gap-2">
                  <FaUsers className="text-teal-600" />
                  <strong className="text-slate-950">
                    {enrolled}
                  </strong> Active {enrolled === 1 ? "Startup" : "Startups"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-black tracking-tight text-slate-950">
              Program Details
            </h3>

            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-[#6f6f72]">Category</dt>
                <dd className="font-semibold text-slate-950">
                  {program?.category || "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-[#6f6f72]">Starts</dt>
                <dd className="font-semibold text-slate-950">
                  {formatDate(program?.startDate)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-[#6f6f72]">Ends</dt>
                <dd className="font-semibold text-slate-950">
                  {formatDate(program?.endDate)}
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ProgramCourses;
