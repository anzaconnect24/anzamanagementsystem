"use client";

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { FaPlus } from "react-icons/fa";
import Loader from "@/components/common/Loader";
import {
  createProgramTarget,
  getProgramTargets,
  removeProgramTarget,
  reviewProgramTargetSubmission,
  updateProgramTarget,
} from "@/controllers/program_target_controller";
import {
  TARGET_KINDS,
  cellClass,
  completionLabel,
  formatDueDate,
  headClass,
  kindLabel,
  lineStatus,
  pillClass,
  targetText,
} from "@/utils/programTargets";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-[#111a2e] outline-none focus:border-[#082d77]";
const labelClass = "mb-1 block text-xs font-bold text-slate-600";
const empty = <span className="text-[#94a3b8]">—</span>;

const emptyForm = () => ({
  uuid: "",
  kind: "milestone",
  title: "",
  description: "",
  targetValue: "",
  unit: "",
  dueDate: "",
  evidenceRequired: false,
});

const TABS = [
  { id: "setup", label: "Milestones & KPIs" },
  { id: "submissions", label: "Startup Submissions" },
];

// A programme's tailored milestones and KPIs. The advisor sets what every
// startup on the programme must report, then reviews what each one submits.
const ProgramTargets = () => {
  const { uuid } = useParams();

  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("setup");

  // The add/edit form; null while closed.
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [removingUuid, setRemovingUuid] = useState("");

  // The startup whose lines are open, and review drafts keyed by line uuid.
  const [openStartup, setOpenStartup] = useState("");
  const [reviews, setReviews] = useState({});
  const [reviewingUuid, setReviewingUuid] = useState("");

  const load = async () => {
    const body = await getProgramTargets(uuid);
    if (body?.status === false) {
      if (body.code !== 403) toast.error(body.message);
      setPayload(null);
    } else {
      setPayload(body);
    }
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uuid]);

  const setField = (key) => (e) =>
    setForm((prev) => ({
      ...prev,
      [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    }));

  const onSaveTarget = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Give the milestone or KPI a title");
      return;
    }

    setSaving(true);
    const { uuid: targetUuid, ...data } = form;
    const response = targetUuid
      ? await updateProgramTarget(uuid, targetUuid, data)
      : await createProgramTarget(uuid, data);
    setSaving(false);

    if (response?.status === false) {
      toast.error(response.message);
      return;
    }

    toast.success(targetUuid ? "Saved" : `${kindLabel(data.kind)} added`);
    setForm(null);
    load();
  };

  const onRemove = async (target) => {
    if (!window.confirm(`Remove "${target.title}" from this programme?`)) return;

    setRemovingUuid(target.uuid);
    const response = await removeProgramTarget(uuid, target.uuid);
    setRemovingUuid("");

    if (response?.status === false) {
      toast.error(response.message);
      return;
    }

    toast.success(
      response?.archived
        ? "Removed. Startups' existing submissions stay on record."
        : "Removed",
    );
    load();
  };

  const setReview = (submissionUuid, patch) =>
    setReviews((prev) => ({
      ...prev,
      [submissionUuid]: { decision: "", notes: "", ...(prev[submissionUuid] || {}), ...patch },
    }));

  const onReview = async (submission) => {
    const review = reviews[submission.uuid] || {};
    if (!review.decision) {
      toast.error("Choose an action");
      return;
    }
    if (review.decision === "revision_requested" && !String(review.notes || "").trim()) {
      toast.error("Say what further information is needed");
      return;
    }

    setReviewingUuid(submission.uuid);
    const response = await reviewProgramTargetSubmission(uuid, submission.uuid, review);
    setReviewingUuid("");

    if (response?.status === false) {
      toast.error(response.message);
      return;
    }

    toast.success(review.decision === "approved" ? "Approved" : "Further information requested");
    setReviews((prev) => {
      const next = { ...prev };
      delete next[submission.uuid];
      return next;
    });
    load();
  };

  if (loading) return <Loader />;

  if (!payload) {
    return (
      <div className="px-6 py-10">
        <div className="mx-auto max-w-3xl rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          This programme's milestones and KPIs are not open to you.
        </div>
      </div>
    );
  }

  const { program, canEdit, targets = [], startups = [] } = payload;
  const awaitingReview = startups.reduce((sum, s) => sum + s.counts.submitted, 0);
  const selected = startups.find((s) => s.businessUuid === openStartup);

  const renderForm = () => (
    <form
      onSubmit={onSaveTarget}
      className="mb-5 space-y-4 rounded-xl border border-[#082d77]/15 bg-[#f8fafc] p-5"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="target-kind">Type</label>
          <select
            id="target-kind"
            className={inputClass}
            value={form.kind}
            onChange={setField("kind")}
            disabled={!!form.uuid}
          >
            {TARGET_KINDS.map((kind) => (
              <option key={kind.value} value={kind.value}>{kind.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="target-title">Title</label>
          <input
            id="target-title"
            className={inputClass}
            value={form.title}
            onChange={setField("title")}
            placeholder={form.kind === "kpi" ? "e.g. Jobs created" : "e.g. Product prototype completed"}
          />
        </div>

        <div className="md:col-span-2">
          <label className={labelClass} htmlFor="target-description">Description</label>
          <textarea
            id="target-description"
            className={`${inputClass} min-h-[80px]`}
            value={form.description}
            onChange={setField("description")}
            placeholder="What the startup should report, and how it is measured"
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="target-value">
            {form.kind === "kpi" ? "Target value" : "Expected deliverable"}
          </label>
          <input
            id="target-value"
            className={inputClass}
            value={form.targetValue}
            onChange={setField("targetValue")}
            placeholder={form.kind === "kpi" ? "e.g. 20" : "e.g. Working prototype tested with 10 users"}
          />
        </div>

        {form.kind === "kpi" && (
          <div>
            <label className={labelClass} htmlFor="target-unit">Unit</label>
            <input
              id="target-unit"
              className={inputClass}
              value={form.unit}
              onChange={setField("unit")}
              placeholder="e.g. jobs, TZS, customers, %"
            />
          </div>
        )}

        <div>
          <label className={labelClass} htmlFor="target-due">Due date</label>
          <input
            id="target-due"
            type="date"
            className={inputClass}
            value={form.dueDate || ""}
            onChange={setField("dueDate")}
          />
        </div>

        <label className="flex items-center gap-2 self-end pb-2 text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={form.evidenceRequired}
            onChange={setField("evidenceRequired")}
            className="h-4 w-4"
          />
          Evidence must be attached
        </label>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[#082d77] px-5 py-2 text-sm font-bold text-white transition hover:bg-[#082d77]/90 disabled:opacity-60"
        >
          {saving ? "Saving..." : form.uuid ? "Save changes" : `Add ${kindLabel(form.kind)}`}
        </button>
        <button
          type="button"
          onClick={() => setForm(null)}
          className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );

  const renderSetup = () => (
    <div className="rounded-2xl border border-black/10 bg-white p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black tracking-tight text-[#111827]">Milestones & KPIs</h2>
          <p className="text-sm text-[#64748b]">
            What every startup on this programme is required to report and submit.
          </p>
        </div>
        {canEdit && !form && (
          <button
            type="button"
            onClick={() => setForm(emptyForm())}
            className="inline-flex items-center gap-2 rounded-lg bg-[#16a34a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#15803d]"
          >
            <FaPlus className="h-3.5 w-3.5" />
            Add milestone or KPI
          </button>
        )}
      </div>

      {form && renderForm()}

      {targets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-black/20 p-6 text-center text-sm text-[#64748b]">
          No milestones or KPIs set for this programme yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-black/10">
          <table className="w-full min-w-[900px] table-fixed border-collapse bg-white">
            <thead>
              <tr>
                <th className={`${headClass} w-[5%]`}>#</th>
                <th className={`${headClass} w-[10%]`}>Type</th>
                <th className={`${headClass} w-[33%]`}>Milestone / KPI</th>
                <th className={`${headClass} w-[16%]`}>Target</th>
                <th className={`${headClass} w-[11%]`}>Due Date</th>
                <th className={`${headClass} w-[10%]`}>Evidence</th>
                {canEdit && <th className={`${headClass} w-[15%]`}>Action</th>}
              </tr>
            </thead>
            <tbody>
              {targets.map((target, index) => (
                <tr key={target.uuid}>
                  <td className={`${cellClass} font-bold`}>{index + 1}</td>
                  <td className={cellClass}>
                    <span
                      className={pillClass(
                        target.kind === "kpi"
                          ? "bg-[#ede9fe] text-[#5b21b6]"
                          : "bg-[#eaf0fb] text-[#082d77]",
                      )}
                    >
                      {kindLabel(target.kind)}
                    </span>
                  </td>
                  <td className={cellClass}>
                    <p className="font-bold text-[#111827]">{target.title}</p>
                    {target.description && (
                      <p className="mt-1 whitespace-pre-line text-xs text-[#64748b]">
                        {target.description}
                      </p>
                    )}
                  </td>
                  <td className={cellClass}>{targetText(target) || empty}</td>
                  <td className={cellClass}>{formatDueDate(target.dueDate) || empty}</td>
                  <td className={cellClass}>{target.evidenceRequired ? "Required" : "Optional"}</td>
                  {canEdit && (
                    <td className={cellClass}>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setForm({
                              ...emptyForm(),
                              ...target,
                              dueDate: target.dueDate || "",
                            })
                          }
                          className="rounded-lg border border-[#082d77]/30 px-3 py-1 text-xs font-bold text-[#082d77] transition hover:bg-[#082d77]/5"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={removingUuid === target.uuid}
                          onClick={() => onRemove(target)}
                          className="rounded-lg border border-red-300 px-3 py-1 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                        >
                          {removingUuid === target.uuid ? "Removing..." : "Remove"}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderStartupList = () =>
    startups.length === 0 ? (
      <div className="rounded-xl border border-dashed border-black/20 p-6 text-center text-sm text-[#64748b]">
        No active startups on this programme.
      </div>
    ) : (
      <div className="overflow-x-auto rounded-xl border border-black/10">
        <table className="w-full min-w-[760px] table-fixed border-collapse bg-white">
          <thead>
            <tr>
              <th className={`${headClass} w-[28%]`}>Startup</th>
              <th className={`${headClass} w-[20%]`}>Founder</th>
              <th className={`${headClass} w-[13%] text-center`}>Approved</th>
              <th className={`${headClass} w-[13%] text-center`}>Awaiting Review</th>
              <th className={`${headClass} w-[14%] text-center`}>Information Requested</th>
              <th className={`${headClass} w-[12%]`}>Action</th>
            </tr>
          </thead>
          <tbody>
            {startups.map((startup) => (
              <tr key={startup.businessUuid}>
                <td className={`${cellClass} font-bold text-[#111827]`}>{startup.name}</td>
                <td className={cellClass}>{startup.founder || empty}</td>
                <td className={`${cellClass} text-center`}>
                  {startup.counts.approved}/{startup.counts.total}
                </td>
                <td className={`${cellClass} text-center`}>
                  {startup.counts.submitted > 0 ? (
                    <span className={pillClass("bg-[#dbe8ff] text-[#163b8f]")}>
                      {startup.counts.submitted}
                    </span>
                  ) : (
                    0
                  )}
                </td>
                <td className={`${cellClass} text-center`}>{startup.counts.revisionRequested}</td>
                <td className={cellClass}>
                  <button
                    type="button"
                    onClick={() => setOpenStartup(startup.businessUuid)}
                    className="rounded-lg bg-[#082d77] px-3 py-1 text-xs font-bold text-white transition hover:bg-[#082d77]/90"
                  >
                    {startup.counts.submitted > 0 && canEdit ? "Review" : "View"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

  const renderStartupLines = () => (
    <>
      <button
        type="button"
        onClick={() => setOpenStartup("")}
        className="mb-4 text-sm font-bold text-[#082d77] hover:underline"
      >
        ← All startups
      </button>
      <h3 className="mb-3 text-base font-black text-[#111827]">{selected.name}</h3>

      {targets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-black/20 p-6 text-center text-sm text-[#64748b]">
          No milestones or KPIs set for this programme yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-black/10">
          <table className="w-full min-w-[1200px] table-fixed border-collapse bg-white">
            <thead>
              <tr>
                <th className={`${headClass} w-[8%]`}>Type</th>
                <th className={`${headClass} w-[17%]`}>Milestone / KPI</th>
                <th className={`${headClass} w-[10%]`}>Target</th>
                <th className={`${headClass} w-[10%]`}>Reported</th>
                <th className={`${headClass} w-[17%]`}>Narrative</th>
                <th className={`${headClass} w-[9%]`}>Evidence</th>
                <th className={`${headClass} w-[11%]`}>Status</th>
                <th className={`${headClass} w-[18%]`}>Review</th>
              </tr>
            </thead>
            <tbody>
              {targets.map((target) => {
                const line = selected.submissions[target.uuid];
                const state = lineStatus(line);
                const review = (line && reviews[line.uuid]) || { decision: "", notes: "" };
                const reported =
                  target.kind === "kpi"
                    ? line?.value
                      ? `${line.value}${target.unit ? ` ${target.unit}` : ""}`
                      : ""
                    : completionLabel(line?.completionStatus);

                return (
                  <tr key={target.uuid}>
                    <td className={cellClass}>{kindLabel(target.kind)}</td>
                    <td className={cellClass}>
                      <p className="font-bold text-[#111827]">{target.title}</p>
                      {target.dueDate && (
                        <p className="mt-1 text-xs text-[#64748b]">Due {formatDueDate(target.dueDate)}</p>
                      )}
                    </td>
                    <td className={cellClass}>{targetText(target) || empty}</td>
                    <td className={`${cellClass} font-semibold`}>{reported || empty}</td>
                    <td className={`${cellClass} whitespace-pre-line text-xs`}>
                      {line?.narrative || empty}
                    </td>
                    <td className={cellClass}>
                      {line?.evidenceUrls?.length ? (
                        <div className="flex flex-col gap-1">
                          {line.evidenceUrls.map((url, i) => (
                            <a
                              key={`${url}-${i}`}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-bold text-green-600 hover:underline"
                            >
                              Evidence {i + 1}
                            </a>
                          ))}
                        </div>
                      ) : (
                        empty
                      )}
                    </td>
                    <td className={cellClass}>
                      <span className={pillClass(state.tone)}>{state.label}</span>
                    </td>
                    <td className={cellClass}>
                      {line?.status === "submitted" && canEdit ? (
                        <div className="flex flex-col gap-2">
                          <select
                            className={`${inputClass} py-1.5 text-xs`}
                            value={review.decision}
                            onChange={(e) => setReview(line.uuid, { decision: e.target.value })}
                          >
                            <option value="">Select action</option>
                            <option value="approved">Approve</option>
                            <option value="revision_requested">Request further information</option>
                          </select>
                          <textarea
                            className={`${inputClass} min-h-[56px] py-1.5 text-xs`}
                            placeholder="Comment"
                            value={review.notes}
                            onChange={(e) => setReview(line.uuid, { notes: e.target.value })}
                          />
                          <button
                            type="button"
                            disabled={reviewingUuid === line.uuid}
                            onClick={() => onReview(line)}
                            className="rounded-lg bg-[#082d77] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#082d77]/90 disabled:opacity-60"
                          >
                            {reviewingUuid === line.uuid ? "Saving..." : "Save review"}
                          </button>
                        </div>
                      ) : line?.reviewNotes ? (
                        <p className="whitespace-pre-line text-xs">
                          {line.reviewNotes}
                          {line.reviewer && (
                            <span className="mt-1 block text-[#94a3b8]">— {line.reviewer}</span>
                          )}
                        </p>
                      ) : (
                        empty
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen space-y-6 px-6 py-4">
      {/* HERO */}
      <div className="relative min-h-[200px] overflow-hidden rounded-2xl bg-black shadow-sm">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/mentor_hero.svg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-[#c9672b]/30" />

        <div className="relative z-10 max-w-3xl p-10 text-white">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-sm font-medium shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#f08a3c]" />
            Milestones & KPIs
          </span>
          <h1 className="mb-3 text-3xl font-bold leading-tight drop-shadow-lg md:text-4xl">
            {program?.title || "Program"}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-white/85 drop-shadow-md">
            Set the milestones and KPIs every startup on this programme must
            report, then review and approve what each one submits.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setTab(item.id);
              setOpenStartup("");
            }}
            className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
              tab === item.id
                ? "bg-[#082d77] text-white"
                : "border border-[#082d77]/20 bg-[#082d77]/5 text-[#082d77] hover:bg-[#082d77]/10"
            }`}
          >
            {item.label}
            {item.id === "submissions" && awaitingReview > 0 && (
              <span className="ml-2 rounded-full bg-[#f08a3c] px-2 py-0.5 text-xs text-white">
                {awaitingReview}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "setup" ? (
        renderSetup()
      ) : (
        <div className="rounded-2xl border border-black/10 bg-white p-6">
          <h2 className="text-lg font-black tracking-tight text-[#111827]">Startup Submissions</h2>
          <p className="mb-4 text-sm text-[#64748b]">
            What each startup has reported against the programme's milestones
            and KPIs. Approve a line or request further information.
          </p>
          {selected ? renderStartupLines() : renderStartupList()}
        </div>
      )}
    </div>
  );
};

export default ProgramTargets;
