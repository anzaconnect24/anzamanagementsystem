"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import dynamic from "@/utils/dynamic";
import {
  FaChartLine,
  FaLayerGroup,
  FaClipboardCheck,
  FaMapMarkerAlt,
  FaQuoteLeft,
  FaUsers,
  FaUserTie,
} from "react-icons/fa";
import Loader from "@/components/common/Loader";
import StatCard from "@/components/tracker/StatCard";
import { getMePortfolioDashboard } from "@/controllers/me_controller";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

// Categorical steps, one set per mode. These are the validated pairs: worst
// adjacent CVD ΔE 24.7 light / 26.8 dark, normal-vision ΔE 33.6 / 31.8, all
// above the 8 / 15 floors, so the two series stay apart for every reader.
const PALETTE = {
  light: { one: "#2a78d6", two: "#eb6834", ink: "#52514e", grid: "#e5e7eb" },
  dark: { one: "#3987e5", two: "#d95926", ink: "#c3c2b7", grid: "#333a48" },
};

// Reserved for state, never reused as a series colour, and always shipped
// alongside the status word rather than standing in for it.
const STATUS = {
  onTrack: { label: "On track", dot: "#1baf7a", chip: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" },
  atRisk: { label: "Needs attention", dot: "#eda100", chip: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" },
  behind: { label: "Behind schedule", dot: "#e34948", chip: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400" },
};

const statusFor = (rate) =>
  rate >= 70 ? STATUS.onTrack : rate >= 40 ? STATUS.atRisk : STATUS.behind;

const num = (value) => Number(value || 0).toLocaleString();

const monthLabel = (key) => {
  const [year, month] = String(key || "").split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return Number.isNaN(date.getTime())
    ? key
    : date.toLocaleDateString("en-GB", { month: "short" });
};

const shortDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

// The app toggles dark mode by putting `dark` on <body>, so the charts follow
// it the same way the Tailwind classes do.
const useIsDark = () => {
  const [isDark, setIsDark] = useState(
    () => typeof document !== "undefined" && document.body.classList.contains("dark"),
  );

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const observer = new MutationObserver(() =>
      setIsDark(document.body.classList.contains("dark")),
    );
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return isDark;
};

const Panel = ({ title, action, children, className = "" }) => (
  <section
    className={`rounded-2xl border border-stroke bg-white p-5 shadow-sm dark:border-strokedark dark:bg-boxdark ${className}`}
  >
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-lg font-bold text-black dark:text-white">{title}</h2>
      {action}
    </div>
    {children}
  </section>
);

// Shown wherever a panel has no records yet. It names the source rather than
// drawing an empty axis, so "nothing recorded" never reads as "zero impact".
const Empty = ({ children }) => (
  <div className="flex min-h-[180px] items-center justify-center rounded-xl border border-dashed border-stroke px-6 text-center text-sm text-[#6f6f72] dark:border-strokedark dark:text-bodydark">
    {children}
  </div>
);

const MEPortfolioDashboard = () => {
  const isDark = useIsDark();
  const colors = isDark ? PALETTE.dark : PALETTE.light;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  const load = useCallback(async (statusFilter) => {
    setLoading(true);
    const response = await getMePortfolioDashboard(
      statusFilter ? { status: statusFilter } : {},
    );
    if (response?.status === false) {
      toast.error(response.message || "Failed to load the M&E portfolio");
      setData(null);
    } else {
      setData(response?.body ?? response);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load("");
  }, [load]);

  const gender = data?.gender || { male: 0, female: 0 };
  const genderTotal = gender.male + gender.female;

  const workforce = data?.workforce || {};
  const workforceBars = useMemo(
    () => [
      { label: "Permanent", value: Number(workforce.permanent || 0) },
      { label: "Temporary", value: Number(workforce.temporary || 0) },
      { label: "Youth", value: Number(workforce.youth || 0) },
      { label: "With disabilities", value: Number(workforce.withDisabilities || 0) },
    ],
    [workforce.permanent, workforce.temporary, workforce.youth, workforce.withDisabilities],
  );
  const workforceTotal = workforceBars.reduce((sum, bar) => sum + bar.value, 0);

  const geography = data?.geography || { locations: 0, rows: [] };
  const topLocations = geography.rows.slice(0, 8);
  const locationMax = topLocations.reduce((max, row) => Math.max(max, row.businesses), 0);

  const collection = data?.dataCollection || { collected: 0, pending: 0, rate: 0 };
  const trend = data?.submissionTrend || [];
  const trendTotal = trend.reduce((sum, point) => sum + point.count, 0);

  const officers = data?.fieldOfficers || { active: 0, rows: [] };
  const feedback = data?.feedback || [];
  const programmes = data?.programmesData || [];

  // One series, so no legend: the panel title names what is plotted. A single
  // hue throughout - the bars differ by category, not by magnitude of meaning.
  const barOptions = {
    chart: { type: "bar", toolbar: { show: false }, fontFamily: "inherit", background: "transparent" },
    colors: [colors.one],
    plotOptions: { bar: { borderRadius: 4, borderRadiusApplication: "end", columnWidth: "45%" } },
    dataLabels: {
      enabled: true,
      formatter: (value) => num(value),
      offsetY: -20,
      style: { fontSize: "12px", fontWeight: 700, colors: [colors.ink] },
    },
    xaxis: {
      categories: workforceBars.map((bar) => bar.label),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: colors.ink, fontSize: "12px" } },
    },
    yaxis: { labels: { style: { colors: colors.ink } } },
    grid: { borderColor: colors.grid, strokeDashArray: 4, xaxis: { lines: { show: false } } },
    tooltip: { theme: isDark ? "dark" : "light", y: { formatter: (value) => `${num(value)} people` } },
    states: { active: { filter: { type: "none" } } },
  };

  const donutOptions = {
    chart: { type: "donut", fontFamily: "inherit", background: "transparent" },
    colors: [colors.one, colors.two],
    labels: ["Male", "Female"],
    legend: { position: "bottom", fontSize: "13px", labels: { colors: colors.ink }, markers: { radius: 12 } },
    dataLabels: {
      enabled: true,
      formatter: (percent) => `${Math.round(percent)}%`,
      style: { fontSize: "13px", fontWeight: 700 },
      dropShadow: { enabled: false },
    },
    // A 2px surface-coloured gap keeps the two arcs from touching.
    stroke: { width: 2, colors: [isDark ? "#24303f" : "#ffffff"] },
    plotOptions: { pie: { donut: { size: "68%" } } },
    tooltip: { theme: isDark ? "dark" : "light", y: { formatter: (value) => `${num(value)} jobs` } },
  };

  const lineOptions = {
    chart: { type: "area", toolbar: { show: false }, fontFamily: "inherit", background: "transparent" },
    colors: [colors.one],
    stroke: { curve: "smooth", width: 2 },
    fill: { type: "gradient", gradient: { opacityFrom: 0.3, opacityTo: 0.02 } },
    dataLabels: { enabled: false },
    markers: { size: 4, hover: { size: 7 }, strokeWidth: 2, strokeColors: isDark ? "#24303f" : "#ffffff" },
    xaxis: {
      categories: trend.map((point) => monthLabel(point.month)),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: colors.ink, fontSize: "12px" } },
    },
    yaxis: { labels: { style: { colors: colors.ink } }, min: 0 },
    grid: { borderColor: colors.grid, strokeDashArray: 4, xaxis: { lines: { show: false } } },
    tooltip: { theme: isDark ? "dark" : "light", x: { show: true }, y: { formatter: (value) => `${num(value)} reports` } },
  };

  const gaugeOptions = {
    chart: { type: "radialBar", fontFamily: "inherit", background: "transparent" },
    colors: [colors.one],
    plotOptions: {
      radialBar: {
        hollow: { size: "62%" },
        track: { background: colors.grid },
        dataLabels: {
          name: { offsetY: 22, color: colors.ink, fontSize: "13px" },
          value: {
            offsetY: -14,
            color: isDark ? "#ffffff" : "#111827",
            fontSize: "30px",
            fontWeight: 800,
            formatter: (value) => `${Math.round(value)}%`,
          },
        },
      },
    },
    labels: ["of periods collected"],
  };

  if (loading && !data) return <Loader />;

  if (!data) {
    return (
      <div className="px-6 py-10">
        <Empty>
          The portfolio could not be loaded. Refresh to try again.
        </Empty>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-4">
      {/* HERO — the same full-bleed treatment the programme pages use. */}
      <div className="relative mb-6 min-h-[240px] overflow-hidden rounded-2xl bg-black shadow-sm">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/mentor_hero.svg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-[#c9672b]/30" />

        <div className="relative z-10 max-w-3xl p-10 text-white">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-sm font-medium shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#f08a3c]" />
            Monitoring &amp; Evaluation
          </span>

          <h1 className="mb-3 text-3xl font-bold leading-tight drop-shadow-lg md:text-4xl">
            Programs M&amp;E Dashboard
          </h1>

          <p className="mb-4 max-w-2xl text-sm leading-6 text-white/85 drop-shadow-md">
            People, progress and stronger communities — portfolio-wide reach,
            reporting compliance and verified impact across every programme.
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-white/85">
            <span className="flex items-center gap-2">
              <FaLayerGroup />
              {num(data.programmes)}{" "}
              {data.programmes === 1 ? "programme" : "programmes"}
            </span>

            <span className="flex items-center gap-2">
              <FaUsers />
              {num(data.entrepreneursSupported)}{" "}
              {data.entrepreneursSupported === 1 ? "startup" : "startups"}
            </span>

            <span className="flex items-center gap-2">
              <FaMapMarkerAlt />
              {num(geography.locations)}{" "}
              {geography.locations === 1 ? "location" : "locations"}
            </span>
          </div>
        </div>
      </div>

      {/* FILTERS — one row above the panels, as on the programme pages. */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <label htmlFor="me-status" className="sr-only">
          Filter by programme status
        </label>
        <select
          id="me-status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm text-black outline-none focus:border-[#082d77] dark:border-strokedark dark:bg-boxdark dark:text-white"
        >
          <option value="">All programme statuses</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="planned">Planned</option>
        </select>

        <button
          type="button"
          onClick={() => load(status)}
          className="rounded-lg bg-[#082d77] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#082d77]/90"
        >
          Apply
        </button>

        {loading ? (
          <span className="text-sm text-[#6f6f72] dark:text-bodydark">
            Refreshing…
          </span>
        ) : null}
      </div>

      {/* HEADLINE FIGURES */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<FaUsers />}
          label="Startups reached"
          value={num(data.entrepreneursSupported)}
          tone="text-[#0b2b5c]"
          sub={
            <p className="mt-1 text-xs text-slate-400">
              {num(data.activeBusinesses)} active across{" "}
              {num(data.programmes)} programmes
            </p>
          }
        />

        <StatCard
          icon={<FaClipboardCheck />}
          label="Activities completed"
          value={num(data.activitiesCompleted)}
          tone="text-emerald-600"
          sub={
            <p className="mt-1 text-xs text-slate-400">
              {num(data.openRisks)} open risk flags
            </p>
          }
        />

        <StatCard
          icon={<FaMapMarkerAlt />}
          label="Geographic coverage"
          value={`${num(geography.locations)} ${
            geography.locations === 1 ? "location" : "locations"
          }`}
          tone="text-amber-500"
          sub={
            <p className="mt-1 text-xs text-slate-400">
              {num(data.entrepreneursSupported)} startups on the roster
            </p>
          }
        />

        <StatCard
          icon={<FaUserTie />}
          label="Programme leads"
          value={num(officers.active)}
          tone="text-rose-600"
          sub={
            <p className="mt-1 text-xs text-slate-400">
              Assigned across the portfolio
            </p>
          }
        />
      </div>

      {/* COVERAGE AND PEOPLE */}
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <Panel title="Geographic coverage">
          {topLocations.length ? (
            <ul className="space-y-3">
              {topLocations.map((row) => (
                <li key={row.location}>
                  <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate font-semibold text-black dark:text-white">
                      {row.location}
                    </span>
                    <span className="shrink-0 font-bold text-[#6f6f72] dark:text-bodydark">
                      {num(row.businesses)}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-strokedark">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${locationMax ? (row.businesses / locationMax) * 100 : 0}%`,
                        backgroundColor: colors.one,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>No startup has a location recorded yet.</Empty>
          )}
        </Panel>

        <Panel title="Jobs by gender">
          {genderTotal ? (
            <>
              <ReactApexChart
                options={donutOptions}
                series={[gender.male, gender.female]}
                type="donut"
                height={260}
              />
              <div className="mt-2 grid grid-cols-2 gap-2 text-center text-sm">
                <div>
                  <p className="font-black text-black dark:text-white">{num(gender.male)}</p>
                  <p className="text-xs text-[#6f6f72] dark:text-bodydark">Male</p>
                </div>
                <div>
                  <p className="font-black text-black dark:text-white">{num(gender.female)}</p>
                  <p className="text-xs text-[#6f6f72] dark:text-bodydark">Female</p>
                </div>
              </div>
            </>
          ) : (
            <Empty>
              No verified employment record yet. Gender is counted from the
              employment rows startups report and an M&amp;E Officer verifies.
            </Empty>
          )}
        </Panel>

        <Panel title="Workforce composition">
          {workforceTotal ? (
            <ReactApexChart
              options={barOptions}
              series={[{ name: "People", data: workforceBars.map((bar) => bar.value) }]}
              type="bar"
              height={300}
            />
          ) : (
            <Empty>
              No verified employment record yet. This counts permanent,
              temporary, youth and disability figures once they are verified.
            </Empty>
          )}
        </Panel>
      </div>

      {/* DELIVERY */}
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <Panel title="Programme progress" className="lg:col-span-1">
          {programmes.length ? (
            <div className="max-h-[320px] space-y-4 overflow-y-auto pr-1">
              {programmes.map((programme) => {
                const state = statusFor(programme.completionRate);
                return (
                  <div key={programme.uuid}>
                    <div className="mb-1 flex items-baseline justify-between gap-3">
                      <span className="truncate text-sm font-semibold text-black dark:text-white">
                        {programme.title}
                      </span>
                      <span className="shrink-0 text-sm font-bold text-[#6f6f72] dark:text-bodydark">
                        {programme.completionRate}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-strokedark">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${programme.completionRate}%`,
                          backgroundColor: state.dot,
                        }}
                      />
                    </div>
                    <div className="mt-1.5 flex items-center gap-2 text-xs">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-semibold ${state.chip}`}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: state.dot }}
                        />
                        {state.label}
                      </span>
                      <span className="text-[#6f6f72] dark:text-bodydark">
                        {num(programme.enrolled)} enrolled &middot; {num(programme.active)} active
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <Empty>No programme matches this filter.</Empty>
          )}
        </Panel>

        <Panel title="Data collection status">
          {collection.collected + collection.pending ? (
            <>
              <ReactApexChart
                options={gaugeOptions}
                series={[collection.rate]}
                type="radialBar"
                height={280}
              />
              <div className="grid grid-cols-2 gap-2 text-center">
                <div>
                  <p className="text-2xl font-black text-black dark:text-white">
                    {num(collection.collected)}
                  </p>
                  <p className="text-xs text-[#6f6f72] dark:text-bodydark">Collected</p>
                </div>
                <div>
                  <p className="text-2xl font-black" style={{ color: STATUS.atRisk.dot }}>
                    {num(collection.pending)}
                  </p>
                  <p className="text-xs text-[#6f6f72] dark:text-bodydark">Outstanding</p>
                </div>
              </div>
            </>
          ) : (
            <Empty>No reporting period has been opened yet.</Empty>
          )}
        </Panel>

        <Panel
          title="Report submissions"
          action={
            <span className="text-xs font-semibold text-[#6f6f72] dark:text-bodydark">
              Last 6 months
            </span>
          }
        >
          {trendTotal ? (
            <>
              <ReactApexChart
                options={lineOptions}
                series={[{ name: "Reports", data: trend.map((point) => point.count) }]}
                type="area"
                height={260}
              />
              <p className="mt-2 text-sm">
                <span className="text-2xl font-black text-black dark:text-white">
                  {num(trendTotal)}
                </span>{" "}
                <span className="text-[#6f6f72] dark:text-bodydark">
                  submitted in this period
                </span>
              </p>
            </>
          ) : (
            <Empty>No report has been submitted in the last six months.</Empty>
          )}
        </Panel>
      </div>

      {/* PEOPLE DOING THE WORK */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Programme lead reporting">
          {officers.rows.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead>
                  <tr className="border-b border-stroke text-xs font-bold uppercase tracking-wide text-[#6f6f72] dark:border-strokedark dark:text-bodydark">
                    <th className="px-2 py-3">Lead</th>
                    <th className="px-2 py-3">Sessions this month</th>
                    <th className="px-2 py-3">Last logged</th>
                  </tr>
                </thead>
                <tbody>
                  {officers.rows.map((officer) => (
                    <tr
                      key={officer.uuid}
                      className="border-b border-stroke last:border-0 dark:border-strokedark"
                    >
                      <td className="px-2 py-3">
                        <span className="font-semibold text-black dark:text-white">
                          {officer.name}
                        </span>
                      </td>
                      <td className="px-2 py-3 font-bold text-[#082d77] dark:text-white">
                        {num(officer.reportsThisMonth)}
                      </td>
                      <td className="px-2 py-3 text-[#6f6f72] dark:text-bodydark">
                        {shortDate(officer.lastSubmission)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty>
              No one is assigned to lead a programme yet. Leads are set per
              programme by an Admin.
            </Empty>
          )}
        </Panel>

        <Panel title="Qualitative feedback">
          {feedback.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {feedback.map((item) => (
                <figure
                  key={item.uuid}
                  className="rounded-xl border border-stroke bg-slate-50/60 p-4 dark:border-strokedark dark:bg-black/10"
                >
                  <FaQuoteLeft className="mb-2 text-lg text-[#082d77]/40 dark:text-white/30" />
                  <blockquote className="text-sm leading-6 text-black dark:text-white">
                    {item.text}
                  </blockquote>
                  <figcaption className="mt-3 text-xs text-[#6f6f72] dark:text-bodydark">
                    {item.business || "A startup"}
                    {item.period ? ` · ${item.period}` : ""}
                    <span className="ml-2 rounded-md bg-white px-2 py-0.5 font-semibold capitalize shadow-sm dark:bg-boxdark">
                      {item.kind}
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <Empty>
              Nothing written yet. These are the milestones and challenges
              startups write on their own verified progress reports.
            </Empty>
          )}
        </Panel>
      </div>

      <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-stroke pt-4 text-xs text-[#6f6f72] dark:border-strokedark dark:text-bodydark">
        <span className="inline-flex items-center gap-2">
          <FaChartLine /> Programs M&amp;E Dashboard
        </span>
        <span>People &middot; Evidence &middot; Lasting Change</span>
      </footer>
    </div>
  );
};

export default MEPortfolioDashboard;
