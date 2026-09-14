"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Paperclip } from "lucide-react";
import Loader from "@/components/common/Loader";
import { uploadFile } from "@/controllers/file_upload_controller";
import {
  getMyProgramTargets,
  saveMyProgramTargets,
} from "@/controllers/program_target_controller";
import {
  COMPLETION_OPTIONS,
  cellClass,
  completionLabel,
  formatDueDate,
  headClass,
  isLineEditable,
  kindLabel,
  lineStatus,
  missingForSubmit,
  pillClass,
  targetText,
} from "@/utils/programTargets";

const fieldClass =
  "w-full rounded-lg border border-black/10 bg-white px-2 py-1.5 text-xs outline-none transition focus:border-[#082d77]";
const empty = <span className="text-[#94a3b8]">—</span>;

const lineFrom = (submission) => ({
  value: submission?.value || "",
  completionStatus: submission?.completionStatus || "",
  narrative: submission?.narrative || "",
  evidenceUrls: submission?.evidenceUrls || [],
});

// The milestones and KPIs a startup's programmes ask of it: fill in each line,
// attach evidence, save as a draft and submit to the business development
// advisor for review.
const MyProgramTargets = () => {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [programUuid, setProgramUuid] = useState("");
  const [drafts, setDrafts] = useState({});
  const [uploadingUuid, setUploadingUuid] = useState("");
  const [saving, setSaving] = useState("");

  const load = async () => {
    const body = await getMyProgramTargets();
    if (body?.status === false) {
      toast.error(body.message);
      setPayload({ data: [] });
    } else {
      const data = Array.isArray(body?.data) ? body.data : [];
      const next = {};
      data.forEach((entry) =>
        entry.targets.forEach((target) => {
          next[target.uuid] = lineFrom(target.submission);
        }),
      );
      setDrafts(next);
      setPayload({ ...body, data });
      setProgramUuid((prev) =>
        prev && data.some((entry) => entry.program.uuid === prev)
          ? prev
          : data[0]?.program.uuid || "",
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const setLine = (targetUuid, patch) =>
    setDrafts((prev) => ({ ...prev, [targetUuid]: { ...prev[targetUuid], ...patch } }));

  const onUpload = async (targetUuid, files) => {
    if (!files.length) return;

    setUploadingUuid(targetUuid);
    const urls = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      const url = await uploadFile(formData);
      if (typeof url === "string" && url) urls.push(url);
      else toast.error(`Could not upload ${file.name}`);
    }
    setUploadingUuid("");

    if (urls.length) {
      setDrafts((prev) => ({
        ...prev,
        [targetUuid]: {
          ...prev[targetUuid],
          evidenceUrls: [...(prev[targetUuid]?.evidenceUrls || []), ...urls],
        },
      }));
    }
  };

  const removeEvidence = (targetUuid, index) =>
    setDrafts((prev) => ({
      ...prev,
      [targetUuid]: {
        ...prev[targetUuid],
        evidenceUrls: prev[targetUuid].evidenceUrls.filter((_, i) => i !== index),
      },
    }));

  if (loading) return <Loader />;

  const entries = payload?.data || [];
  const entry = entries.find((item) => item.program.uuid === programUuid);
  const targets = entry?.targets || [];
  const openTargets = targets.filter((target) => isLineEditable(target.submission));

  const onSave = async (submit) => {
    if (submit) {
      const incomplete = openTargets.find((target) => missingForSubmit(target, drafts[target.uuid]));
      if (incomplete) {
        toast.error(
          `"${incomplete.title}" needs ${missingForSubmit(incomplete, drafts[incomplete.uuid])} before you submit`,
        );
        return;
      }
    }

    setSaving(submit ? "submit" : "draft");
    const response = await saveMyProgramTargets(
      programUuid,
      openTargets.map((target) => ({ targetUuid: target.uuid, ...drafts[target.uuid] })),
      submit,
    );
    setSaving("");

    if (response?.status === false) {
      toast.error(response.message);
      return;
    }

    toast.success(submit ? "Submitted for review" : "Draft saved");
    load();
  };

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
            Programme Milestones & KPIs
          </span>
          <h1 className="mb-3 text-3xl font-bold leading-tight drop-shadow-lg md:text-4xl">
            {entry?.program.title || "Your programme"}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-white/85 drop-shadow-md">
            Report progress on the milestones and KPIs your business development
            advisor set for your programme, attach evidence and submit them for
            review.
          </p>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          You are not on a programme yet, so there are no milestones or KPIs to report.
        </div>
      ) : (
        <>
          {entries.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {entries.map((item) => (
                <button
                  key={item.program.uuid}
                  type="button"
                  onClick={() => setProgramUuid(item.program.uuid)}
                  className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                    item.program.uuid === programUuid
                      ? "bg-[#082d77] text-white"
                      : "border border-[#082d77]/20 bg-[#082d77]/5 text-[#082d77] hover:bg-[#082d77]/10"
                  }`}
                >
                  {item.program.title}
                </button>
              ))}
            </div>
          )}

          <div className="rounded-2xl border border-black/10 bg-white p-6">
            <h2 className="text-lg font-black tracking-tight text-[#111827]">Milestones & KPIs</h2>
            <p className="mb-4 text-sm text-[#64748b]">
              Fill in every line, then submit. Lines awaiting review or approved
              are locked; a line sent back for more information opens again.
            </p>

            {targets.length === 0 ? (
              <div className="rounded-xl border border-dashed border-black/20 p-6 text-center text-sm text-[#64748b]">
                Your business development advisor has not set milestones or KPIs
                for this programme yet.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-xl border border-black/10">
                  <table className="w-full min-w-[1200px] table-fixed border-collapse bg-white">
                    <thead>
                      <tr>
                        <th className={`${headClass} w-[4%]`}>#</th>
                        <th className={`${headClass} w-[8%]`}>Type</th>
                        <th className={`${headClass} w-[18%]`}>Milestone / KPI</th>
                        <th className={`${headClass} w-[11%]`}>Target</th>
                        <th className={`${headClass} w-[12%]`}>Your Update</th>
                        <th className={`${headClass} w-[18%]`}>Narrative</th>
                        <th className={`${headClass} w-[13%]`}>Evidence</th>
                        <th className={`${headClass} w-[16%]`}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {targets.map((target, index) => {
                        const line = drafts[target.uuid] || lineFrom(null);
                        const locked = !isLineEditable(target.submission);
                        const state = lineStatus(target.submission);

                        return (
                          <tr key={target.uuid}>
                            <td className={`${cellClass} font-bold`}>{index + 1}</td>
                            <td className={cellClass}>{kindLabel(target.kind)}</td>
                            <td className={cellClass}>
                              <p className="font-bold text-[#111827]">{target.title}</p>
                              {target.description && (
                                <p className="mt-1 whitespace-pre-line text-xs text-[#64748b]">
                                  {target.description}
                                </p>
                              )}
                              {target.dueDate && (
                                <p className="mt-1 text-xs font-semibold text-[#8a6500]">
                                  Due {formatDueDate(target.dueDate)}
                                </p>
                              )}
                            </td>
                            <td className={cellClass}>{targetText(target) || empty}</td>

                            <td className={cellClass}>
                              {target.kind === "kpi" ? (
                                locked ? (
                                  <span className="font-semibold">
                                    {line.value ? `${line.value}${target.unit ? ` ${target.unit}` : ""}` : empty}
                                  </span>
                                ) : (
                                  <div className="flex items-center gap-1">
                                    <input
                                      className={fieldClass}
                                      value={line.value}
                                      placeholder="Value"
                                      onChange={(e) => setLine(target.uuid, { value: e.target.value })}
                                    />
                                    {target.unit && (
                                      <span className="shrink-0 text-xs text-[#64748b]">{target.unit}</span>
                                    )}
                                  </div>
                                )
                              ) : locked ? (
                                <span className="font-semibold">
                                  {completionLabel(line.completionStatus) || empty}
                                </span>
                              ) : (
                                <select
                                  className={fieldClass}
                                  value={line.completionStatus}
                                  onChange={(e) =>
                                    setLine(target.uuid, { completionStatus: e.target.value })
                                  }
                                >
                                  <option value="">Select</option>
                                  {COMPLETION_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </td>

                            <td className={cellClass}>
                              {locked ? (
                                <span className="whitespace-pre-line text-xs">{line.narrative || empty}</span>
                              ) : (
                                <textarea
                                  className={`${fieldClass} min-h-[64px]`}
                                  placeholder="What was done, and any explanation"
                                  value={line.narrative}
                                  onChange={(e) => setLine(target.uuid, { narrative: e.target.value })}
                                />
                              )}
                            </td>

                            <td className={cellClass}>
                              {line.evidenceUrls.length > 0 && (
                                <div className="mb-2 flex flex-col gap-1">
                                  {line.evidenceUrls.map((url, i) => (
                                    <span key={`${url}-${i}`} className="flex items-center gap-2">
                                      <a
                                        href={url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs font-bold text-green-600 hover:underline"
                                      >
                                        Evidence {i + 1}
                                      </a>
                                      {!locked && (
                                        <button
                                          type="button"
                                          onClick={() => removeEvidence(target.uuid, i)}
                                          className="text-xs font-bold text-red-500 hover:underline"
                                        >
                                          Remove
                                        </button>
                                      )}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {!locked && (
                                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-green-600/40 bg-green-50 px-2 py-1.5 text-xs font-bold text-green-700 transition hover:bg-green-100">
                                  <Paperclip className="h-3.5 w-3.5" />
                                  {uploadingUuid === target.uuid ? "Uploading..." : "Attach"}
                                  <input
                                    type="file"
                                    multiple
                                    className="hidden"
                                    disabled={uploadingUuid === target.uuid}
                                    onChange={(e) => {
                                      onUpload(target.uuid, Array.from(e.target.files || []));
                                      e.target.value = "";
                                    }}
                                  />
                                </label>
                              )}
                              {locked && line.evidenceUrls.length === 0 && empty}
                              {target.evidenceRequired && !locked && (
                                <p className="mt-1 text-[11px] font-semibold text-[#8a6500]">Required</p>
                              )}
                            </td>

                            <td className={cellClass}>
                              <span className={pillClass(state.tone)}>{state.label}</span>
                              {target.submission?.reviewNotes && (
                                <p className="mt-2 whitespace-pre-line text-xs text-[#334155]">
                                  <span className="font-bold">Advisor: </span>
                                  {target.submission.reviewNotes}
                                </p>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {openTargets.length > 0 ? (
                  <div className="mt-5 flex flex-wrap justify-end gap-3">
                    <button
                      type="button"
                      disabled={!!saving}
                      onClick={() => onSave(false)}
                      className="rounded-xl border border-[#082d77]/30 px-5 py-3 text-sm font-bold text-[#082d77] transition hover:bg-[#082d77]/5 disabled:opacity-60"
                    >
                      {saving === "draft" ? "Saving..." : "Save draft"}
                    </button>
                    <button
                      type="button"
                      disabled={!!saving}
                      onClick={() => onSave(true)}
                      className="rounded-xl bg-[#16a34a] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#15803d] disabled:opacity-60"
                    >
                      {saving === "submit" ? "Submitting..." : "Submit for review"}
                    </button>
                  </div>
                ) : (
                  <p className="mt-4 text-right text-sm font-semibold text-[#64748b]">
                    Everything has been submitted.
                  </p>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default MyProgramTargets;
