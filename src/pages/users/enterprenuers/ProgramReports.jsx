"use client";

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaFileAlt,
  FaLock,
  FaPlus,
  FaSyncAlt,
  FaTimes,
} from "react-icons/fa";
import Loader from "@/components/common/Loader";
import {
  composeProgramReport,
  getProgramReports,
  saveProgramReport,
} from "@/controllers/cohort_controller";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-[#111a2e] outline-none focus:border-[#082d77] focus:ring-2 focus:ring-[#082d77]/20";

const labelClass = "mb-1.5 block text-sm font-semibold text-[#344054]";

const pretty = (value) =>
  String(value || "")
    .replace(/[_-]/g, " ")
    .replace(/^./, (c) => c.toUpperCase());

const day = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const num = (value) => Number(value || 0).toLocaleString();

// One figure from the snapshot.
const Figure = ({ label, value, note }) => (
  <div className="rounded-xl bg-white p-4 shadow-sm shadow-slate-200/50">
    <p className="text-xl font-black tracking-tight text-slate-950">{value}</p>
    <p className="mt-1 text-sm font-medium text-slate-500">{label}</p>
    {note ? <p className="mt-0.5 text-xs text-slate-400">{note}</p> : null}
  </div>
);

// The computed half of a report, rendered from a snapshot. Used both for the
// live preview and for reading a saved report, so what a lead approves is
// exactly what the report shows later.
const Snapshot = ({ snapshot }) => {
  if (!snapshot) return null;

  const { participants, activities, demographics, capital, grants, budget } =
    snapshot;

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
          Reach
        </h3>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Figure label="Enterprises enrolled" value={num(participants.enrolled)} />
          <Figure label="Active" value={num(participants.active)} />
          <Figure label="Completed the programme" value={num(participants.completed)} />
          <Figure
            label="Participants reached"
            value={num(participants.reached)}
            note="Across completed activities"
          />
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
          Activities
        </h3>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Figure label="Activities completed" value={num(activities.completed)} />
          <Figure label="Scheduled in period" value={num(activities.total)} />
          <Figure
            label="Budget utilisation"
            value={budget.utilisation === null ? "—" : `${budget.utilisation}%`}
            note={`${num(budget.spent)} of ${num(budget.planned)}`}
          />
          <Figure
            label="Reports verified"
            value={num(snapshot.reporting.verified)}
            note={`${num(snapshot.reporting.outstanding)} outstanding`}
          />
        </div>

        {Object.keys(activities.byType || {}).length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(activities.byType).map(([type, count]) => (
              <span
                key={type}
                className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
              >
                {pretty(type)} · {count}
              </span>
            ))}
          </div>
        ) : null}
      </section>

      <section>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
          Demographics
        </h3>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Figure label="Male" value={num(demographics.male)} />
          <Figure label="Female" value={num(demographics.female)} />
          <Figure label="Youth" value={num(demographics.youth)} />
          <Figure
            label="With disabilities"
            value={num(demographics.withDisabilities)}
          />
        </div>
        {/* Said plainly, because a split drawn only from verified rows is not
            a split of everybody. */}
        <p className="mt-2 text-xs text-slate-400">{demographics.basis}</p>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
          Finance
        </h3>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Figure
            label="Capital raised"
            value={num(capital.raised)}
            note={`${capital.deals} deal${capital.deals === 1 ? "" : "s"}`}
          />
          <Figure
            label="Grants disbursed"
            value={num(grants.disbursed)}
            note={`${grants.tranchesDisbursed} tranche${grants.tranchesDisbursed === 1 ? "" : "s"}`}
          />
          <Figure label="Grant committed" value={num(grants.committed)} />
          <Figure
            label="Tranches outstanding"
            value={num(grants.tranchesOutstanding)}
          />
        </div>
      </section>

      {snapshot.indicators?.length ? (
        <section>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
            Indicators
          </h3>
          <div className="overflow-x-auto rounded-xl bg-white shadow-sm shadow-slate-200/50">
            <table className="w-full min-w-[500px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500">
                  <th className="px-4 py-3">Indicator</th>
                  <th className="px-4 py-3">Baseline</th>
                  <th className="px-4 py-3">Current</th>
                  <th className="px-4 py-3">Target</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.indicators.map((row) => (
                  <tr key={row.name} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {row.name}
                    </td>
                    <td className="px-4 py-3 text-[#667085]">{row.baseline ?? "—"}</td>
                    <td className="px-4 py-3 text-[#667085]">{row.current ?? "—"}</td>
                    <td className="px-4 py-3 text-[#667085]">
                      {row.target ?? "—"} {row.unit || ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {[
        ["Challenges reported", snapshot.challenges],
        ["Case studies", snapshot.caseStudies],
      ].map(([title, rows]) =>
        rows?.length ? (
          <section key={title}>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
              {title}
            </h3>
            <ul className="space-y-2">
              {rows.map((row, index) => (
                <li
                  key={`${row.business}-${index}`}
                  className="rounded-xl bg-white p-4 shadow-sm shadow-slate-200/50"
                >
                  <p className="text-sm leading-6 text-[#667085]">{row.text}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {row.business || "A startup"}
                    {row.period ? ` · ${row.period}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null,
      )}

      {snapshot.risks?.length ? (
        <section>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
            Open risks
          </h3>
          <ul className="space-y-2">
            {snapshot.risks.map((row, index) => (
              <li
                key={`${row.business}-${index}`}
                className="rounded-xl bg-white p-4 shadow-sm shadow-slate-200/50"
              >
                <p className="text-sm font-semibold text-slate-900">
                  {row.business || "Unknown"}
                  <span
                    className={`ml-2 rounded-md px-2 py-0.5 text-xs font-bold ${
                      row.riskLevel === "critical"
                        ? "bg-rose-50 text-rose-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {pretty(row.riskLevel)}
                  </span>
                </p>
                <p className="mt-1 text-sm text-[#667085]">
                  {row.reasons.join(", ")}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
};

// Monthly, quarterly, donor and final reports, built from the programme's own
// records rather than rebuilt from a spreadsheet.
const ProgramReports = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();

  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(null);

  const [form, setForm] = useState({
    reportType: "monthly",
    title: "",
    periodStart: "",
    periodEnd: "",
  });
  const [preview, setPreview] = useState(null);
  const [narrative, setNarrative] = useState({});
  const [sections, setSections] = useState([]);

  const load = () =>
    getProgramReports(uuid)
      .then(setPayload)
      .catch((error) => {
        toast.error(
          error?.response?.status === 403
            ? "These reports are not open to you"
            : "Failed to load reports",
        );
        setPayload(null);
      })
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uuid]);

  const onCompose = async () => {
    setBuilding(true);
    try {
      const body = await composeProgramReport(uuid, {
        from: form.periodStart || undefined,
        to: form.periodEnd || undefined,
      });
      setPreview(body.snapshot);
      setSections(body.sections || []);
    } catch {
      toast.error("Could not build the figures");
    }
    setBuilding(false);
  };

  const onSave = async () => {
    if (!form.title.trim()) {
      toast.error("A report title is required");
      return;
    }

    setSaving(true);
    const response = await saveProgramReport(uuid, { ...form, narrative });
    setSaving(false);

    if (response?.status === false) {
      toast.error(response.message || "Failed to save");
      return;
    }

    toast.success("Report saved as a draft");
    setPreview(null);
    setNarrative({});
    setForm({ ...form, title: "" });
    load();
  };

  const openReport = async (row) => {
    try {
      const body = await getProgramReports(uuid, row.uuid);
      setOpen(body);
    } catch {
      toast.error("Could not open that report");
    }
  };

  const finalise = async () => {
    const response = await saveProgramReport(
      uuid,
      { status: "final" },
      open.report.uuid,
    );

    if (response?.status === false) {
      toast.error(response.message || "Failed to finalise");
      return;
    }

    toast.success("Report finalised");
    setOpen(null);
    load();
  };

  const refresh = async () => {
    const response = await saveProgramReport(
      uuid,
      { refresh: true },
      open.report.uuid,
    );

    if (response?.status === false) {
      toast.error(response.message || "Failed to refresh");
      return;
    }

    toast.success("Figures rebuilt from today's data");
    openReport(open.report);
  };

  if (loading) return <Loader />;

  if (!payload) {
    return (
      <div className="px-6 py-10">
        <div className="mx-auto max-w-3xl rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          These reports are not open to you.
        </div>
      </div>
    );
  }

  const { program, types, canSave, data } = payload;

  return (
    <div className="min-h-screen px-6 py-4">
      <button
        type="button"
        onClick={() => navigate(`/dashboard/programManagement/program/${uuid}`)}
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#082d77] transition hover:underline"
      >
        <FaArrowLeft /> Back to program
      </button>

      {/* HERO */}
      <div className="relative mb-8 min-h-[200px] overflow-hidden rounded-2xl bg-black shadow-sm">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/mentor_hero.svg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-[#c9672b]/30" />

        <div className="relative z-10 max-w-3xl p-10 text-white">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-sm font-medium shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#f08a3c]" />
            Report Builder
          </span>

          <h1 className="mb-3 text-3xl font-bold leading-tight drop-shadow-lg md:text-4xl">
            {program?.title || "Program"}
          </h1>

          <p className="max-w-2xl text-sm leading-6 text-white/85 drop-shadow-md">
            Monthly, quarterly, donor and final reports. The figures come from
            the programme&rsquo;s own records; you add the interpretation.
          </p>
        </div>
      </div>

      {/* BUILDER */}
      {canSave ? (
        <section className="mb-8 rounded-2xl bg-white p-6 shadow-sm shadow-slate-200/50">
          <h2 className="mb-4 text-xl font-black tracking-tight text-slate-950">
            Build a report
          </h2>

          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className={labelClass} htmlFor="rep-type">
                Type
              </label>
              <select
                id="rep-type"
                className={inputClass}
                value={form.reportType}
                onChange={(e) => setForm({ ...form, reportType: e.target.value })}
              >
                {types.map((type) => (
                  <option key={type} value={type}>
                    {pretty(type)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass} htmlFor="rep-from">
                Period from
              </label>
              <input
                id="rep-from"
                type="date"
                className={inputClass}
                value={form.periodStart}
                onChange={(e) =>
                  setForm({ ...form, periodStart: e.target.value })
                }
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="rep-to">
                Period to
              </label>
              <input
                id="rep-to"
                type="date"
                className={inputClass}
                value={form.periodEnd}
                onChange={(e) => setForm({ ...form, periodEnd: e.target.value })}
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={onCompose}
                disabled={building}
                className="w-full rounded-lg bg-[#16a34a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#15803d] disabled:opacity-60"
              >
                {building ? "Building..." : "Build figures"}
              </button>
            </div>
          </div>

          <p className="mt-2 text-xs text-[#8a8f98]">
            Leave the dates blank to cover the whole programme — which is what a
            final report usually wants.
          </p>

          {preview ? (
            <div className="mt-6 border-t border-slate-100 pt-6">
              <Snapshot snapshot={preview} />

              <div className="mt-8 border-t border-slate-100 pt-6">
                <h3 className="mb-1 text-lg font-black tracking-tight text-slate-950">
                  Narrative
                </h3>
                <p className="mb-4 text-sm text-[#8a8f98]">
                  The figures say what happened. These say what it meant.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className={labelClass} htmlFor="rep-title">
                      Report title
                    </label>
                    <input
                      id="rep-title"
                      className={inputClass}
                      placeholder="Q3 2026 quarterly report"
                      value={form.title}
                      onChange={(e) =>
                        setForm({ ...form, title: e.target.value })
                      }
                    />
                  </div>

                  {sections.map((section) => (
                    <div key={section.key}>
                      <label className={labelClass} htmlFor={`sec-${section.key}`}>
                        {section.label}
                      </label>
                      <textarea
                        id={`sec-${section.key}`}
                        rows={3}
                        className={inputClass}
                        value={narrative[section.key] || ""}
                        onChange={(e) =>
                          setNarrative({
                            ...narrative,
                            [section.key]: e.target.value,
                          })
                        }
                      />
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={onSave}
                  disabled={saving}
                  className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#082d77] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#061f54] disabled:opacity-60"
                >
                  <FaPlus />
                  {saving ? "Saving..." : "Save as draft"}
                </button>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* SAVED */}
      <h2 className="mb-4 text-2xl font-extrabold tracking-tight text-[#111a2e]">
        Reports
      </h2>

      {data.length === 0 ? (
        <div className="mx-auto max-w-3xl rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          No report has been built for this program yet.
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((row) => (
            <button
              key={row.uuid}
              type="button"
              onClick={() => openReport(row)}
              className="flex w-full flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-5 text-left shadow-sm shadow-slate-200/50 transition hover:shadow-md"
            >
              <span className="min-w-0">
                <span className="block truncate text-base font-black text-[#082d77]">
                  {row.title}
                </span>
                <span className="mt-1 block text-sm text-[#667085]">
                  {pretty(row.reportType)} ·{" "}
                  {row.periodStart || row.periodEnd
                    ? `${day(row.periodStart)} – ${day(row.periodEnd)}`
                    : "Whole programme"}
                  {row.createdBy ? ` · ${row.createdBy}` : ""}
                </span>
              </span>

              <span
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold ${
                  row.status === "final"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {row.status === "final" ? <FaLock /> : <FaFileAlt />}
                {pretty(row.status)}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* READ */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-slate-50 shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white p-6">
              <div className="min-w-0">
                <h3 className="text-xl font-black tracking-tight text-slate-950">
                  {open.report.title}
                </h3>
                <p className="mt-1 text-sm text-[#667085]">
                  {pretty(open.report.reportType)} ·{" "}
                  {open.report.periodStart || open.report.periodEnd
                    ? `${day(open.report.periodStart)} – ${day(open.report.periodEnd)}`
                    : "Whole programme"}{" "}
                  · figures as at {day(open.report.generatedAt)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(null)}
                aria-label="Close"
                className="text-slate-400 transition hover:text-slate-600"
              >
                <FaTimes />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <Snapshot snapshot={open.report.snapshot} />

              {open.sections?.some((s) => open.report.narrative?.[s.key]) ? (
                <div className="mt-8 border-t border-slate-200 pt-6">
                  <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">
                    Narrative
                  </h3>

                  <div className="space-y-4">
                    {open.sections
                      .filter((s) => open.report.narrative?.[s.key])
                      .map((s) => (
                        <section
                          key={s.key}
                          className="rounded-xl bg-white p-4 shadow-sm shadow-slate-200/50"
                        >
                          <h4 className="text-sm font-bold text-slate-900">
                            {s.label}
                          </h4>
                          <p className="mt-1 whitespace-pre-line text-sm leading-6 text-[#667085]">
                            {open.report.narrative[s.key]}
                          </p>
                        </section>
                      ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white p-6">
              <p className="text-xs text-[#8a8f98]">
                {open.report.status === "final"
                  ? "Final — these figures are fixed as they were when it was issued."
                  : "Draft — the figures are frozen at build time and can be rebuilt."}
              </p>

              {open.canSave && open.report.status !== "final" ? (
                <span className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={refresh}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#082d77]/20 px-4 py-2.5 text-sm font-semibold text-[#082d77] transition hover:bg-slate-50"
                  >
                    <FaSyncAlt /> Rebuild figures
                  </button>

                  <button
                    type="button"
                    onClick={finalise}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#082d77] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#061f54]"
                  >
                    <FaCheckCircle /> Finalise
                  </button>
                </span>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgramReports;
