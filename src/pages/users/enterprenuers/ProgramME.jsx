"use client";

import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaCalendarAlt,
  FaChartLine,
  FaCheckCircle,
  FaClipboardCheck,
  FaExclamationTriangle,
  FaLayerGroup,
  FaPlus,
  FaShieldAlt,
  FaTimesCircle,
  FaUsers,
} from "react-icons/fa";
import Loader from "@/components/common/Loader";
import { UserContext } from "../../../layouts/DashboardLayout";
import {
  archiveMeIndicator,
  archiveMeResult,
  basisMeta,
  createMeIndicator,
  createMeResult,
  formatValue,
  getMeCatalogue,
  getMeFramework,
  getMeIndicators,
  getMeOverview,
  prettyLabel,
  statusMeta,
  submitMeIndicatorValue,
  updateMeFramework,
  updateMeIndicator,
} from "@/controllers/me_controller";

// Configuring the framework is M&E Manager / Programme Manager work. The
// platform stores those staff as "Staff" or "Reviewer" (see SignUp).
const CAN_MANAGE_ROLES = ["Admin", "Staff", "Reviewer"];

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "framework", label: "Results Framework" },
  { key: "indicators", label: "Indicators" },
];

const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-GB");
};

const emptyIndicator = {
  name: "",
  code: "",
  description: "",
  definition: "",
  resultLevel: "outcome",
  indicatorType: "number",
  unit: "",
  baselineValue: "",
  targetValue: "",
  targetDate: "",
  frequency: "quarterly",
  dataSource: "manual",
  responsiblePerson: "",
  verificationMethod: "",
  calculationMethod: "",
  higherIsBetter: true,
  notes: "",
  resultUuid: "",
};

const ProgramME = () => {
  const { uuid } = useParams();
  const { userDetails } = useContext(UserContext);
  const canManage = CAN_MANAGE_ROLES.includes(userDetails?.role);

  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);

  const [framework, setFramework] = useState(null);
  const [frameworkLoading, setFrameworkLoading] = useState(false);

  const [indicators, setIndicators] = useState(null);
  const [indicatorsLoading, setIndicatorsLoading] = useState(false);

  const [catalogue, setCatalogue] = useState(null);

  // Editors
  const [goalDraft, setGoalDraft] = useState("");
  const [editingGoal, setEditingGoal] = useState(false);
  const [resultForm, setResultForm] = useState(null);
  const [indicatorForm, setIndicatorForm] = useState(null);
  const [valueForm, setValueForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadOverview = () => {
    setLoading(true);
    getMeOverview(uuid)
      .then((body) => {
        setOverview(body);
        setGoalDraft(body?.framework?.goal || "");
      })
      .catch((error) => {
        console.error(error);
        toast.error(
          error?.response?.status === 404
            ? "Program not found"
            : "Failed to load Monitoring & Evaluation",
        );
      })
      .finally(() => setLoading(false));
  };

  const loadFramework = () => {
    setFrameworkLoading(true);
    getMeFramework(uuid)
      .then(setFramework)
      .catch(() => toast.error("Failed to load the results framework"))
      .finally(() => setFrameworkLoading(false));
  };

  const loadIndicators = () => {
    setIndicatorsLoading(true);
    getMeIndicators(uuid)
      .then((body) => setIndicators(Array.isArray(body?.data) ? body.data : []))
      .catch(() => toast.error("Failed to load the indicators"))
      .finally(() => setIndicatorsLoading(false));
  };

  useEffect(() => {
    loadOverview();
    getMeCatalogue().then(setCatalogue);
  }, [uuid]);

  const openTab = (key) => {
    setTab(key);
    if (key === "framework" && framework === null) loadFramework();
    if (key === "indicators" && indicators === null) loadIndicators();
  };

  // Any write refreshes every view that could now be stale, so the KPI cards
  // never disagree with the table underneath them.
  const refreshAll = () => {
    loadOverview();
    if (framework !== null) loadFramework();
    if (indicators !== null) loadIndicators();
  };

  const saveGoal = async () => {
    setSaving(true);
    const response = await updateMeFramework(uuid, { goal: goalDraft });
    setSaving(false);

    if (response?.status !== true) {
      toast.error(response?.message || "Failed to save the goal");
      return;
    }

    toast.success("Programme goal saved");
    setEditingGoal(false);
    refreshAll();
  };

  const saveResult = async () => {
    if (!resultForm.title.trim()) {
      toast.error("Give it a title");
      return;
    }

    setSaving(true);
    const response = await createMeResult(uuid, {
      title: resultForm.title.trim(),
      code: resultForm.code.trim() || null,
      description: resultForm.description.trim() || null,
      parentUuid: resultForm.parentUuid || null,
      level: resultForm.parentUuid ? "output" : "outcome",
    });
    setSaving(false);

    if (response?.status !== true) {
      toast.error(response?.message || "Failed to save");
      return;
    }

    toast.success(resultForm.parentUuid ? "Output added" : "Outcome added");
    setResultForm(null);
    refreshAll();
  };

  const removeResult = async (result) => {
    if (
      !window.confirm(
        `Archive "${result.title}"? Its indicators are kept and detached, not deleted.`,
      )
    )
      return;

    const response = await archiveMeResult(uuid, result.uuid);

    if (response?.status !== true) {
      toast.error(response?.message || "Failed to archive");
      return;
    }

    toast.success("Archived");
    refreshAll();
  };

  const saveIndicator = async () => {
    const form = indicatorForm;

    if (!form.name.trim()) {
      toast.error("Give the indicator a name");
      return;
    }

    const payload = {
      ...form,
      name: form.name.trim(),
      baselineValue: form.baselineValue === "" ? null : form.baselineValue,
      targetValue: form.targetValue === "" ? null : form.targetValue,
      targetDate: form.targetDate || null,
      resultUuid: form.resultUuid || null,
    };

    setSaving(true);
    const response = form.uuid
      ? await updateMeIndicator(uuid, form.uuid, payload)
      : await createMeIndicator(uuid, payload);
    setSaving(false);

    if (response?.status !== true) {
      toast.error(response?.message || "Failed to save the indicator");
      return;
    }

    toast.success(form.uuid ? "Indicator updated" : "Indicator added");
    setIndicatorForm(null);
    refreshAll();
  };

  const removeIndicator = async (indicator) => {
    if (
      !window.confirm(
        `Archive "${indicator.name}"? Past figures are kept for audit.`,
      )
    )
      return;

    const response = await archiveMeIndicator(uuid, indicator.uuid);

    if (response?.status !== true) {
      toast.error(response?.message || "Failed to archive");
      return;
    }

    toast.success("Indicator archived");
    refreshAll();
  };

  const saveValue = async () => {
    setSaving(true);
    const response = await submitMeIndicatorValue(uuid, valueForm.uuid, {
      value: valueForm.value,
      narrative: valueForm.narrative || null,
    });
    setSaving(false);

    if (response?.status !== true) {
      toast.error(response?.message || "Failed to record the value");
      return;
    }

    toast.success("Figure recorded and awaiting verification");
    setValueForm(null);
    refreshAll();
  };

  if (loading) return <Loader />;

  const program = overview?.program;
  const summary = overview?.summary || {};

  const cards = [
    {
      key: "indicators",
      label: "Total Indicators",
      value: summary.totalIndicators ?? 0,
      icon: FaLayerGroup,
      tone: "text-[#082d77]",
      ring: "bg-[#082d77]/5",
    },
    {
      key: "onTrack",
      label: "Indicators On Track",
      value: `${summary.onTrack ?? 0} / ${summary.totalIndicators ?? 0}`,
      icon: FaCheckCircle,
      tone: "text-emerald-600",
      ring: "bg-emerald-50",
    },
    {
      key: "behind",
      label: "Behind Target",
      value: summary.behind ?? 0,
      icon: FaTimesCircle,
      tone: "text-rose-600",
      ring: "bg-rose-50",
    },
    {
      key: "attention",
      label: "Needs Attention",
      value: summary.attention ?? 0,
      icon: FaExclamationTriangle,
      tone: "text-amber-600",
      ring: "bg-amber-50",
    },
    {
      key: "enterprises",
      label: "Enterprises",
      value: summary.enterprises ?? 0,
      icon: FaUsers,
      tone: "text-[#082d77]",
      ring: "bg-[#082d77]/5",
    },
    {
      key: "verification",
      label: "Verification Pending",
      value: summary.pendingVerification ?? 0,
      icon: FaClipboardCheck,
      tone: "text-amber-600",
      ring: "bg-amber-50",
    },
    {
      key: "progress",
      label: "Programme Progress",
      value:
        summary.programmeProgress === null ||
        summary.programmeProgress === undefined
          ? "—"
          : `${summary.programmeProgress}%`,
      icon: FaChartLine,
      tone: "text-emerald-600",
      ring: "bg-emerald-50",
      hint:
        summary.programmeProgress === null
          ? "No indicator is due yet, so there is nothing to score."
          : "Share of the indicators that are due and on track.",
    },
    {
      key: "quality",
      label: "Data Quality",
      value:
        summary.dataQuality === null || summary.dataQuality === undefined
          ? "—"
          : `${summary.dataQuality}%`,
      icon: FaShieldAlt,
      tone: "text-[#082d77]",
      ring: "bg-[#082d77]/5",
      hint: "How complete and how verified the indicator figures are.",
    },
  ];

  const rows = overview?.indicators || [];

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
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-sm font-medium shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#f08a3c]" />
            Monitoring &amp; Evaluation
          </span>

          <h2 className="mb-3 text-3xl font-bold leading-tight drop-shadow-lg md:text-4xl">
            {program?.title || "Program"}
          </h2>

          <p className="mb-4 max-w-2xl text-sm leading-6 text-white/85 drop-shadow-md">
            Track programme performance, enterprise outcomes, reporting
            compliance and verified impact.
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-white/85">
            <span className="flex items-center gap-2">
              <FaUsers />
              {summary.enterprises}{" "}
              {summary.enterprises === 1 ? "enterprise" : "enterprises"}
            </span>

            {(program?.startDate || program?.endDate) && (
              <span className="flex items-center gap-2">
                <FaCalendarAlt />
                {formatDate(program?.startDate)} &ndash;{" "}
                {formatDate(program?.endDate)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="mb-8 inline-flex rounded-xl bg-slate-100 p-1 text-sm font-semibold">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => openTab(item.key)}
            className={
              tab === item.key
                ? "rounded-lg bg-white px-4 py-2 text-slate-950 shadow-sm"
                : "rounded-lg px-4 py-2 text-slate-500 transition hover:text-slate-800"
            }
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* ------------------------------------------------------- OVERVIEW */}
      {tab === "overview" && (
        <>
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {cards.map((card) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.key}
                  className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm"
                  title={card.hint || undefined}
                >
                  <span
                    className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full ${card.ring} ${card.tone}`}
                  >
                    <Icon className="text-sm" />
                  </span>

                  <p className="break-words text-lg font-black leading-tight text-slate-950">
                    {card.value}
                  </p>
                  <p className="mt-1 text-xs font-medium leading-snug text-[#6f6f72]">
                    {card.label}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-950">
                Programme Performance
              </h2>
              <p className="mt-1 text-sm text-[#667085]">
                Target against actual for every indicator. Figures marked
                Calculated come straight from platform records.
              </p>
            </div>
          </div>

          {rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
              No indicators have been defined for this program yet. Add them on
              the Indicators tab.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-bold tracking-wide text-slate-500">
                      <th className="px-5 py-4">Indicator</th>
                      <th className="px-5 py-4 text-right">Target</th>
                      <th className="px-5 py-4 text-right">Actual</th>
                      <th className="px-5 py-4 text-right">Achievement</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">Basis</th>
                    </tr>
                  </thead>

                  <tbody>
                    {rows.map((row) => {
                      const meta = statusMeta(row.status);
                      const basis = basisMeta(row.basis);

                      return (
                        <tr
                          key={row.uuid}
                          className="border-b border-slate-100 last:border-0"
                        >
                          <td className="px-5 py-4">
                            <p className="font-bold text-slate-950">
                              {row.name}
                            </p>
                            <p className="mt-0.5 text-xs text-[#98A2B3]">
                              {row.code ? row.code + " · " : ""}
                              {prettyLabel(row.resultLevel)} ·{" "}
                              {row.dataSourceLabel}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-right text-slate-700">
                            {formatValue(
                              row.target,
                              row.indicatorType,
                              row.unit,
                            )}
                          </td>

                          <td className="px-5 py-4 text-right font-bold text-slate-950">
                            {formatValue(
                              row.actual,
                              row.indicatorType,
                              row.unit,
                            )}
                          </td>

                          <td className="px-5 py-4 text-right">
                            {row.achievement === null ? (
                              <span className="text-slate-400">—</span>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                <span className="font-bold text-slate-900">
                                  {row.achievement}%
                                </span>
                                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                                  <div
                                    className={`h-full rounded-full ${meta.bar}`}
                                    style={{
                                      width: `${Math.min(row.achievement, 100)}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${meta.className}`}
                            >
                              {meta.label}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className="text-xs font-semibold text-[#667085]"
                              title={basis.hint}
                            >
                              {basis.label}
                            </span>
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

      {/* ---------------------------------------------- RESULTS FRAMEWORK */}
      {tab === "framework" && (
        <>
          {frameworkLoading || framework === null ? (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-10 text-center text-sm text-slate-500">
              Loading the results framework...
            </div>
          ) : (
            <>
              <div className="mb-4">
                <h2 className="text-2xl font-black tracking-tight text-slate-950">
                  Results Framework
                </h2>
                <p className="mt-1 text-sm text-[#667085]">
                  Goal, outcomes, outputs and the indicators measuring each.
                </p>
              </div>

              {/* GOAL */}
              <div className="mb-6 rounded-2xl border-l-4 border-[#082d77] bg-white p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-[#98A2B3]">
                  Programme Goal
                </p>

                {editingGoal ? (
                  <>
                    <textarea
                      rows={3}
                      value={goalDraft}
                      onChange={(event) => setGoalDraft(event.target.value)}
                      placeholder="What is this programme ultimately trying to achieve?"
                      className="mt-2 w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
                    />

                    <div className="mt-3 flex flex-wrap gap-3">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={saveGoal}
                        className="rounded-lg bg-[#16a34a] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#15803d] disabled:opacity-60"
                      >
                        {saving ? "Saving..." : "Save goal"}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingGoal(false);
                          setGoalDraft(framework.framework?.goal || "");
                        }}
                        className="rounded-lg border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="mt-2 text-lg font-bold leading-snug text-slate-950">
                      {framework.framework?.goal || "No goal set yet."}
                    </p>

                    {canManage && (
                      <button
                        type="button"
                        onClick={() => {
                          setGoalDraft(framework.framework?.goal || "");
                          setEditingGoal(true);
                        }}
                        className="mt-3 text-sm font-semibold text-[#082d77] hover:underline"
                      >
                        {framework.framework?.goal ? "Edit goal" : "Set goal"}
                      </button>
                    )}
                  </>
                )}
              </div>

              {canManage && (
                <button
                  type="button"
                  onClick={() =>
                    setResultForm({
                      title: "",
                      code: "",
                      description: "",
                      parentUuid: "",
                    })
                  }
                  className="mb-6 inline-flex items-center gap-2 rounded-lg bg-[#16a34a] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#15803d]"
                >
                  <FaPlus className="text-xs" />
                  Add Outcome
                </button>
              )}

              {framework.outcomes.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
                  No outcomes yet. Add the first one to start building the
                  framework.
                </div>
              ) : (
                <div className="space-y-4">
                  {framework.outcomes.map((outcome) => (
                    <div
                      key={outcome.uuid}
                      className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold uppercase tracking-wide text-teal-700">
                            {outcome.code || "Outcome"}
                          </p>
                          <h3 className="mt-1 text-lg font-black leading-snug text-slate-950">
                            {outcome.title}
                          </h3>
                        </div>

                        {canManage && (
                          <div className="flex shrink-0 flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setResultForm({
                                  title: "",
                                  code: "",
                                  description: "",
                                  parentUuid: outcome.uuid,
                                })
                              }
                              className="rounded-lg bg-[#EEF4FF] px-3 py-1.5 text-xs font-semibold text-[#2563EB] transition hover:bg-[#DCE7FF]"
                            >
                              Add output
                            </button>

                            <button
                              type="button"
                              onClick={() => removeResult(outcome)}
                              className="rounded-lg bg-[#FEF3F2] px-3 py-1.5 text-xs font-semibold text-[#B42318] transition hover:bg-[#FEE4E2]"
                            >
                              Archive
                            </button>
                          </div>
                        )}
                      </div>

                      <IndicatorChips items={outcome.indicators} />

                      {outcome.children.length > 0 && (
                        <div className="mt-4 space-y-3 border-l-2 border-slate-100 pl-5">
                          {outcome.children.map((output) => (
                            <div key={output.uuid}>
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold uppercase tracking-wide text-[#98A2B3]">
                                    {output.code || "Output"}
                                  </p>
                                  <p className="mt-0.5 font-bold leading-snug text-slate-800">
                                    {output.title}
                                  </p>
                                </div>

                                {canManage && (
                                  <button
                                    type="button"
                                    onClick={() => removeResult(output)}
                                    className="shrink-0 rounded-lg bg-[#FEF3F2] px-3 py-1.5 text-xs font-semibold text-[#B42318] transition hover:bg-[#FEE4E2]"
                                  >
                                    Archive
                                  </button>
                                )}
                              </div>

                              <IndicatorChips items={output.indicators} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {framework.goalIndicators.length > 0 && (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white p-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#98A2B3]">
                    Measuring the goal directly
                  </p>
                  <IndicatorChips items={framework.goalIndicators} />
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ----------------------------------------------------- INDICATORS */}
      {tab === "indicators" && (
        <>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-950">
                Indicator Registry
              </h2>
              <p className="mt-1 text-sm text-[#667085]">
                Every indicator this programme tracks, with its definition,
                target and where its data comes from.
              </p>
            </div>

            {canManage && (
              <button
                type="button"
                onClick={() => setIndicatorForm({ ...emptyIndicator })}
                className="inline-flex items-center gap-2 rounded-lg bg-[#16a34a] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#15803d]"
              >
                <FaPlus className="text-xs" />
                Add Indicator
              </button>
            )}
          </div>

          {indicatorsLoading || indicators === null ? (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-10 text-center text-sm text-slate-500">
              Loading indicators...
            </div>
          ) : indicators.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
              No indicators yet.
            </div>
          ) : (
            <div className="space-y-4">
              {indicators.map((indicator) => {
                const meta = statusMeta(indicator.status);
                const basis = basisMeta(indicator.basis);

                return (
                  <div
                    key={indicator.uuid}
                    className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${meta.className}`}
                          >
                            {meta.label}
                          </span>

                          <span
                            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                            title={basis.hint}
                          >
                            {basis.label}
                          </span>

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            {prettyLabel(indicator.frequency)}
                          </span>
                        </div>

                        <h3 className="text-lg font-black leading-snug text-slate-950">
                          {indicator.code ? indicator.code + " · " : ""}
                          {indicator.name}
                        </h3>

                        <p className="mt-1 text-sm text-[#6f6f72]">
                          {indicator.description || indicator.dataSourceLabel}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-3">
                        {[
                          {
                            label: "Baseline",
                            value: formatValue(
                              indicator.baseline,
                              indicator.indicatorType,
                              indicator.unit,
                            ),
                          },
                          {
                            label: "Target",
                            value: formatValue(
                              indicator.target,
                              indicator.indicatorType,
                              indicator.unit,
                            ),
                          },
                          {
                            label: "Actual",
                            value: formatValue(
                              indicator.actual,
                              indicator.indicatorType,
                              indicator.unit,
                            ),
                          },
                          {
                            label: "Achievement",
                            value:
                              indicator.achievement === null
                                ? "—"
                                : `${indicator.achievement}%`,
                          },
                        ].map((box) => (
                          <div
                            key={box.label}
                            className="min-w-[110px] rounded-2xl bg-[#F9FAFB] p-4"
                          >
                            <p className="text-xs text-[#98A2B3]">
                              {box.label}
                            </p>
                            <p className="mt-1 break-words text-base font-bold text-slate-950">
                              {box.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {canManage && (
                      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
                        <button
                          type="button"
                          onClick={() =>
                            setIndicatorForm({
                              ...emptyIndicator,
                              ...indicator,
                              baselineValue:
                                indicator.baseline === null
                                  ? ""
                                  : indicator.baseline,
                              targetValue:
                                indicator.target === null
                                  ? ""
                                  : indicator.target,
                              targetDate: indicator.targetDate || "",
                              resultUuid: indicator.resultUuid || "",
                            })
                          }
                          className="rounded-xl bg-[#EEF4FF] px-4 py-2 text-sm font-semibold text-[#2563EB] transition hover:bg-[#DCE7FF]"
                        >
                          Edit
                        </button>

                        {!indicator.automatic && (
                          <button
                            type="button"
                            onClick={() =>
                              setValueForm({
                                uuid: indicator.uuid,
                                name: indicator.name,
                                value: "",
                                narrative: "",
                              })
                            }
                            className="rounded-xl bg-[#ECFDF3] px-4 py-2 text-sm font-semibold text-[#027A48] transition hover:bg-[#D1FADF]"
                          >
                            Record figure
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => removeIndicator(indicator)}
                          className="rounded-xl bg-[#FEF3F2] px-4 py-2 text-sm font-semibold text-[#B42318] transition hover:bg-[#FEE4E2]"
                        >
                          Archive
                        </button>

                        {indicator.automatic && (
                          <span className="text-xs text-[#98A2B3]">
                            Calculated from {indicator.dataSourceLabel} — it
                            cannot be typed in by hand.
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ---------------------------------------------------------- MODALS */}
      {resultForm && (
        <Modal
          title={resultForm.parentUuid ? "Add Output" : "Add Outcome"}
          onClose={() => setResultForm(null)}
        >
          <Field label={resultForm.parentUuid ? "Output code" : "Outcome code"}>
            <input
              type="text"
              value={resultForm.code}
              onChange={(event) =>
                setResultForm({ ...resultForm, code: event.target.value })
              }
              placeholder={resultForm.parentUuid ? "Output 1.1" : "Outcome 1"}
              className="w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
            />
          </Field>

          <Field label="Statement">
            <textarea
              rows={3}
              value={resultForm.title}
              onChange={(event) =>
                setResultForm({ ...resultForm, title: event.target.value })
              }
              placeholder="Enterprises improve business management capabilities."
              className="w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
            />
          </Field>

          <button
            type="button"
            disabled={saving}
            onClick={saveResult}
            className="mt-2 w-full rounded-lg bg-[#16a34a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#15803d] disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </Modal>
      )}

      {indicatorForm && (
        <Modal
          title={indicatorForm.uuid ? "Edit Indicator" : "Add Indicator"}
          onClose={() => setIndicatorForm(null)}
          wide
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Code">
              <input
                type="text"
                value={indicatorForm.code || ""}
                onChange={(event) =>
                  setIndicatorForm({
                    ...indicatorForm,
                    code: event.target.value,
                  })
                }
                placeholder="OC2b"
                className="w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
              />
            </Field>

            <Field label="Indicator name">
              <input
                type="text"
                value={indicatorForm.name}
                onChange={(event) =>
                  setIndicatorForm({
                    ...indicatorForm,
                    name: event.target.value,
                  })
                }
                placeholder="Jobs created"
                className="w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
              />
            </Field>

            <Field label="Result level" full={false}>
              <Select
                value={indicatorForm.resultLevel}
                options={catalogue?.resultLevels || []}
                onChange={(value) =>
                  setIndicatorForm({ ...indicatorForm, resultLevel: value })
                }
              />
            </Field>

            <Field label="Indicator type">
              <Select
                value={indicatorForm.indicatorType}
                options={catalogue?.types || []}
                onChange={(value) =>
                  setIndicatorForm({ ...indicatorForm, indicatorType: value })
                }
              />
            </Field>

            <Field label="Unit of measurement">
              <input
                type="text"
                value={indicatorForm.unit || ""}
                onChange={(event) =>
                  setIndicatorForm({
                    ...indicatorForm,
                    unit: event.target.value,
                  })
                }
                placeholder="jobs, USD, %"
                className="w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
              />
            </Field>

            <Field label="Reporting frequency">
              <Select
                value={indicatorForm.frequency}
                options={catalogue?.frequencies || []}
                onChange={(value) =>
                  setIndicatorForm({ ...indicatorForm, frequency: value })
                }
              />
            </Field>

            <Field label="Baseline">
              <input
                type="number"
                value={indicatorForm.baselineValue}
                onChange={(event) =>
                  setIndicatorForm({
                    ...indicatorForm,
                    baselineValue: event.target.value,
                  })
                }
                className="w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
              />
            </Field>

            <Field label="Target">
              <input
                type="number"
                value={indicatorForm.targetValue}
                onChange={(event) =>
                  setIndicatorForm({
                    ...indicatorForm,
                    targetValue: event.target.value,
                  })
                }
                className="w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
              />
            </Field>

            <Field label="Target date">
              <input
                type="date"
                value={indicatorForm.targetDate || ""}
                onChange={(event) =>
                  setIndicatorForm({
                    ...indicatorForm,
                    targetDate: event.target.value,
                  })
                }
                className="w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
              />
            </Field>

            <Field label="Responsible person">
              <input
                type="text"
                value={indicatorForm.responsiblePerson || ""}
                onChange={(event) =>
                  setIndicatorForm({
                    ...indicatorForm,
                    responsiblePerson: event.target.value,
                  })
                }
                className="w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
              />
            </Field>
          </div>

          <Field label="Data source">
            <select
              value={indicatorForm.dataSource}
              onChange={(event) =>
                setIndicatorForm({
                  ...indicatorForm,
                  dataSource: event.target.value,
                })
              }
              className="w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
            >
              {(catalogue?.sources || []).map((source) => (
                <option key={source.value} value={source.value}>
                  {source.label}
                  {source.automatic ? " (calculated)" : ""}
                </option>
              ))}
            </select>

            <p className="mt-2 text-xs text-[#98A2B3]">
              {(catalogue?.sources || []).find(
                (source) => source.value === indicatorForm.dataSource,
              )?.describes || ""}
            </p>
          </Field>

          <Field label="Definition">
            <textarea
              rows={2}
              value={indicatorForm.definition || ""}
              onChange={(event) =>
                setIndicatorForm({
                  ...indicatorForm,
                  definition: event.target.value,
                })
              }
              placeholder="Exactly what counts, and what does not."
              className="w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
            />
          </Field>

          <Field label="Means of verification">
            <textarea
              rows={2}
              value={indicatorForm.verificationMethod || ""}
              onChange={(event) =>
                setIndicatorForm({
                  ...indicatorForm,
                  verificationMethod: event.target.value,
                })
              }
              placeholder="Payroll records, signed investment agreements..."
              className="w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
            />
          </Field>

          <label className="mb-4 flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={!indicatorForm.higherIsBetter}
              onChange={(event) =>
                setIndicatorForm({
                  ...indicatorForm,
                  higherIsBetter: !event.target.checked,
                })
              }
            />
            A lower figure is the better result (dropout rate, days to
            disbursement)
          </label>

          <button
            type="button"
            disabled={saving}
            onClick={saveIndicator}
            className="w-full rounded-lg bg-[#16a34a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#15803d] disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save indicator"}
          </button>
        </Modal>
      )}

      {valueForm && (
        <Modal title="Record a figure" onClose={() => setValueForm(null)}>
          <p className="mb-4 text-sm text-[#667085]">
            {valueForm.name}. The figure is recorded as reported and counts
            towards official results once it has been verified.
          </p>

          <Field label="Value">
            <input
              type="number"
              value={valueForm.value}
              onChange={(event) =>
                setValueForm({ ...valueForm, value: event.target.value })
              }
              className="w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
            />
          </Field>

          <Field label="Note">
            <textarea
              rows={3}
              value={valueForm.narrative}
              onChange={(event) =>
                setValueForm({ ...valueForm, narrative: event.target.value })
              }
              placeholder="Where this figure came from."
              className="w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
            />
          </Field>

          <button
            type="button"
            disabled={saving}
            onClick={saveValue}
            className="w-full rounded-lg bg-[#16a34a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#15803d] disabled:opacity-60"
          >
            {saving ? "Saving..." : "Record figure"}
          </button>
        </Modal>
      )}
    </div>
  );
};

// The indicators attached to one outcome or output, shown inline in the tree.
const IndicatorChips = ({ items = [] }) => {
  if (items.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {items.map((indicator) => {
        const meta = statusMeta(indicator.status);

        return (
          <span
            key={indicator.uuid}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-[#F9FAFB] px-3 py-1.5 text-xs"
            title={indicator.dataSourceLabel}
          >
            <span className={`h-2 w-2 rounded-full ${meta.bar}`} />
            <span className="font-semibold text-slate-700">
              {indicator.name}
            </span>
            <span className="text-[#98A2B3]">
              {indicator.actual === null ? "—" : indicator.actual}
              {indicator.target === null ? "" : ` / ${indicator.target}`}
            </span>
          </span>
        );
      })}
    </div>
  );
};

const Field = ({ label, children }) => (
  <div className="mb-4">
    <label className="mb-2 block text-sm font-semibold text-slate-900">
      {label}
    </label>
    {children}
  </div>
);

const Select = ({ value, options, onChange }) => (
  <select
    value={value}
    onChange={(event) => onChange(event.target.value)}
    className="w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
  >
    {options.map((option) => (
      <option key={option} value={option}>
        {prettyLabel(option)}
      </option>
    ))}
  </select>
);

const Modal = ({ title, children, onClose, wide = false }) => (
  <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
    <div
      className={`my-8 w-full rounded-2xl bg-white p-6 shadow-xl ${
        wide ? "max-w-3xl" : "max-w-lg"
      }`}
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <h3 className="text-xl font-black tracking-tight text-slate-950">
          {title}
        </h3>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-3 py-1 text-sm font-semibold text-slate-500 transition hover:bg-slate-100"
        >
          Close
        </button>
      </div>

      {children}
    </div>
  </div>
);

export default ProgramME;
