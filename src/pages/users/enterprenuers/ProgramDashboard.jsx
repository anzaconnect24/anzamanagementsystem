"use client";

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaCalendarAlt,
  FaChartLine,
  FaCheckCircle,
  FaClipboardCheck,
  FaCoins,
  FaUsers,
} from "react-icons/fa";
import Loader from "@/components/common/Loader";
import { getProgramOverview } from "@/controllers/cohort_controller";

// The three states, each with its own word. The colour is never the only
// thing that distinguishes them - a dot plus the label, so the screen reads
// the same to someone who cannot separate red from green.
const LIGHT = {
  on_track: {
    label: "On Track",
    dot: "#1baf7a",
    chip: "bg-emerald-50 text-emerald-700",
    ring: "ring-emerald-200",
  },
  attention: {
    label: "Attention Required",
    dot: "#eda100",
    chip: "bg-amber-50 text-amber-700",
    ring: "ring-amber-200",
  },
  critical: {
    label: "Critical",
    dot: "#e34948",
    chip: "bg-rose-50 text-rose-700",
    ring: "ring-rose-200",
  },
};

const UNMEASURED = {
  label: "Not yet measured",
  dot: "#cbd5e1",
  chip: "bg-slate-100 text-slate-500",
  ring: "ring-slate-200",
};

const lightOf = (value) => LIGHT[value] || UNMEASURED;

const pretty = (value) =>
  String(value || "")
    .replace(/[_-]/g, " ")
    .replace(/^./, (c) => c.toUpperCase());

const day = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
};

const num = (value) =>
  value === null || value === undefined ? "—" : Number(value).toLocaleString();

const pct = (value) =>
  value === null || value === undefined ? "—" : `${value}%`;

// One measure with its light. The threshold that produced the light is shown
// underneath, so nobody has to guess why something is amber.
const Gauge = ({ label, value, light, rule }) => {
  const state = lightOf(light);

  return (
    <div
      className={`rounded-2xl bg-white p-5 shadow-sm shadow-slate-200/50 ring-1 ${state.ring}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-2xl font-black tracking-tight text-slate-950">
          {value}
        </p>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-bold ${state.chip}`}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: state.dot }}
          />
          {state.label}
        </span>
      </div>

      <p className="mt-2 text-sm font-medium text-slate-500">{label}</p>
      {rule ? <p className="mt-0.5 text-xs text-slate-400">{rule}</p> : null}
    </div>
  );
};

const Figure = ({ icon, label, value, note }) => (
  <div className="rounded-2xl bg-white p-5 shadow-sm shadow-slate-200/50">
    <div className="flex items-start justify-between gap-3">
      <p className="text-xl font-black tracking-tight text-slate-950">{value}</p>
      <span className="shrink-0 text-[#0b2b5c]">{icon}</span>
    </div>
    <p className="mt-2 text-sm font-medium text-slate-500">{label}</p>
    {note ? <p className="mt-0.5 text-xs text-slate-400">{note}</p> : null}
  </div>
);

// The first screen a Program Lead opens: are we on track, and what needs
// attention today.
const ProgramDashboard = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProgramOverview(uuid)
      .then(setData)
      .catch((error) => {
        toast.error(
          error?.response?.status === 403
            ? "This program is not yours"
            : "Failed to load the dashboard",
        );
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [uuid]);

  if (loading) return <Loader />;

  if (!data) {
    return (
      <div className="px-6 py-10">
        <div className="mx-auto max-w-3xl rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          This dashboard is not open to you.
        </div>
      </div>
    );
  }

  const {
    program,
    overall,
    lights,
    thresholds,
    measures,
    cohort,
    activities,
    milestones,
    finance,
    approvals,
    indicators,
    needIntervention,
  } = data;

  const state = lightOf(overall);

  // How a light was decided, in words.
  const ruleFor = (key) => {
    const rule = thresholds[key];
    if (!rule) return null;
    if (rule.direction === "up") return `Amber under ${rule.amber}${rule.unit.startsWith("%") ? "%" : ""}, red under ${rule.red}`;
    if (rule.direction === "down") return `Amber from ${rule.amber}, red from ${rule.red}`;
    return "Amber outside 50–100%, red over 110%";
  };

  const go = (suffix) =>
    navigate(`/dashboard/programManagement/program/${uuid}${suffix}`);

  return (
    <div className="min-h-screen px-6 py-4">
      {/* HERO — the answer to "are we on track" before anything else. */}
      <div className="relative mb-8 min-h-[200px] overflow-hidden rounded-2xl bg-black shadow-sm">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/mentor_hero.svg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-[#c9672b]/30" />

        <div className="relative z-10 max-w-3xl p-10 text-white">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-sm font-medium shadow-sm">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: state.dot }}
            />
            {state.label}
          </span>

          <h1 className="mb-3 text-3xl font-bold leading-tight drop-shadow-lg md:text-4xl">
            {program.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 text-sm text-white/85">
            <span className="flex items-center gap-2">
              <FaUsers />
              {num(cohort.enrolled)} enrolled · {num(cohort.active)} active
            </span>

            {(program.startDate || program.endDate) && (
              <span className="flex items-center gap-2">
                <FaCalendarAlt />
                {day(program.startDate)} – {day(program.endDate)}
              </span>
            )}

            {program.status ? (
              <span className="flex items-center gap-2 capitalize">
                <FaCheckCircle />
                {pretty(program.status)}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* ARE WE ON TRACK */}
      <h2 className="mb-4 text-2xl font-extrabold tracking-tight text-[#111a2e]">
        Are we on track?
      </h2>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Gauge
          label="Cohort progress"
          value={pct(measures.cohortProgress)}
          light={lights.cohortProgress}
          rule={ruleFor("cohortProgress")}
        />
        <Gauge
          label="Participant attendance"
          value={pct(measures.attendance)}
          light={lights.attendance}
          rule={ruleFor("attendance")}
        />
        <Gauge
          label="Diagnostic improvement"
          value={pct(measures.diagnostic)}
          light={lights.diagnostic}
          rule="Share of the cohort with an endline"
        />
        <Gauge
          label="KPI achievement"
          value={pct(measures.kpiAchievement)}
          light={lights.kpiAchievement}
          rule="Indicators at or above target"
        />
        <Gauge
          label="Budget utilisation"
          value={pct(measures.budgetUtilisation)}
          light={lights.budget}
          rule={ruleFor("budget")}
        />
        <Gauge
          label="Open risks"
          value={num(measures.openRisks)}
          light={lights.risks}
          rule={ruleFor("risks")}
        />
      </div>

      {/* WHAT NEEDS ATTENTION */}
      <h2 className="mb-4 text-2xl font-extrabold tracking-tight text-[#111a2e]">
        What requires attention?
      </h2>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Gauge
          label="Overdue reports"
          value={num(measures.overdueReports)}
          light={lights.overdueReports}
          rule={ruleFor("overdueReports")}
        />
        <Gauge
          label="Overdue activities"
          value={num(measures.overdueActivities)}
          light={lights.overdueActivities}
          rule={ruleFor("overdueActivities")}
        />
        <Gauge
          label="Pending approvals"
          value={num(measures.pendingApprovals)}
          light={lights.pendingApprovals}
          rule={`${approvals.reportsAwaitingReview} reports · ${approvals.milestonesAwaitingReview} milestones · ${approvals.evidencePending} evidence`}
        />
        <Gauge
          label="Enterprises needing intervention"
          value={num(needIntervention.length)}
          light={needIntervention.some((row) => row.level === "critical")
            ? "critical"
            : needIntervention.length
              ? "attention"
              : "on_track"}
          rule="Carrying an open risk flag"
        />
      </div>

      {/* DELIVERY AND FINANCE */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Figure
          icon={<FaClipboardCheck />}
          label="Activities completed"
          value={num(activities.completed)}
          note={`of ${num(activities.total)} scheduled`}
        />
        <Figure
          icon={<FaCoins />}
          label="Grants disbursed"
          value={num(finance.grantsDisbursed)}
          note={`${milestones.disbursed} of ${milestones.total} tranches`}
        />
        <Figure
          icon={<FaChartLine />}
          label="Capital facilitated"
          value={num(finance.capitalFacilitated)}
          note="Received by enterprises"
        />
        <Figure
          icon={<FaUsers />}
          label="Participants reached"
          value={num(cohort.reached)}
          note="Across completed activities"
        />
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        {/* UPCOMING */}
        <section className="rounded-2xl bg-white p-5 shadow-sm shadow-slate-200/50">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold capitalize text-slate-700">
              Upcoming activities
            </h3>
            <button
              type="button"
              onClick={() => go("/calendar")}
              className="text-xs font-bold text-[#082d77] hover:underline"
            >
              Open program calendar
            </button>
          </div>

          {activities.upcoming.length === 0 ? (
            <p className="text-sm text-slate-400">Nothing scheduled ahead.</p>
          ) : (
            <ul className="space-y-2">
              {activities.upcoming.map((row) => (
                <li
                  key={row.uuid}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="min-w-0 truncate text-slate-900">
                    {row.name}
                    <span className="ml-2 text-xs text-slate-400">
                      {pretty(row.activityType)}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-[#667085]">
                    {day(row.when)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* INTERVENTION */}
        <section className="rounded-2xl bg-white p-5 shadow-sm shadow-slate-200/50">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold capitalize text-slate-700">
              Enterprises requiring intervention
            </h3>
            <button
              type="button"
              onClick={() => go("/coaching")}
              className="text-xs font-bold text-[#082d77] hover:underline"
            >
              Open coaching
            </button>
          </div>

          {needIntervention.length === 0 ? (
            <p className="text-sm text-slate-400">
              No enterprise is currently flagged.
            </p>
          ) : (
            <ul className="space-y-2">
              {needIntervention.slice(0, 6).map((row) => (
                <li key={row.name} className="text-sm">
                  <span className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">
                      {row.name}
                    </span>
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-bold ${lightOf(row.level).chip}`}
                    >
                      {lightOf(row.level).label}
                    </span>
                  </span>
                  {row.reasons.length ? (
                    <span className="mt-0.5 block text-xs text-[#667085]">
                      {row.reasons.join(", ")}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* INDICATORS */}
      {indicators.length ? (
        <section className="mb-8 overflow-x-auto rounded-2xl bg-white shadow-sm shadow-slate-200/50">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500">
                <th className="px-5 py-4">Indicator</th>
                <th className="px-5 py-4">Baseline</th>
                <th className="px-5 py-4">Current</th>
                <th className="px-5 py-4">Target</th>
              </tr>
            </thead>
            <tbody>
              {indicators.map((row) => (
                <tr key={row.name} className="border-b border-slate-100 last:border-0">
                  <td className="px-5 py-4 font-semibold text-slate-900">
                    {row.name}
                  </td>
                  <td className="px-5 py-4 text-[#667085]">{row.baseline ?? "—"}</td>
                  <td className="px-5 py-4 font-bold text-[#082d77]">
                    {row.current ?? "—"}
                  </td>
                  <td className="px-5 py-4 text-[#667085]">
                    {row.target ?? "—"} {row.unit || ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

    </div>
  );
};

export default ProgramDashboard;
