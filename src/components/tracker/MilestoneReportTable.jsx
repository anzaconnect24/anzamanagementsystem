import { Fragment } from "react";
import { FileText, Paperclip } from "lucide-react";

import {
  COMPLETION_STATUS_OPTIONS,
  COMPLETION_STATUS_PILL,
  RECEIPT_OPTIONS,
  completionStatusLabel,
  computeVariance,
  formatReportAmount,
  receiptLabel,
} from "@/utils/milestoneReport";

// The milestone reporting grid used by both the startup (editable) and the
// finance officer (read-only), so a report is entered and reviewed in exactly
// the same layout:
//
//   Milestone | Timeline | Milestone status | Budgeted amount |
//   Actual amount | Variance | Receipt/evidence | Attach evidence | Narrative
//
// Props:
//   rows        - [{ uuid, title, activity, kpiImpact, timeline, report,
//                    attachments, pendingFiles, readOnly, action, detail,
//                    reviewComment }]
//   editable    - render inputs instead of text (startup side)
//   onChange    - (uuid, key, value) for edited cells
//   onAttach    - (uuid, files) when documents are picked in Attach evidence
//   showReview  - add the reviewer comment column
//   reviewLabel - that column's header
//
// `action` (evidence upload, submit button, waiting state) adds a trailing
// column, `showReview` adds the finance officer's verdict and comment, and
// `detail` renders full-width beneath its row — so the startup's whole
// reporting flow lives in this one table. Pass none of them for the plain
// eight-column template.
const cellClass =
  "border border-black/10 px-3 py-2 align-top text-sm break-words";
const headClass =
  "border border-black/10 bg-[#eaf0fb] px-3 py-2 text-left text-xs font-black text-[#111827]";
const fieldClass =
  "w-full rounded-lg border border-black/10 bg-white px-2 py-1.5 text-sm outline-none transition focus:border-[#082d77]";

const VarianceCell = ({ report }) => {
  const variance = computeVariance(report.plannedAmount, report.actualAmount);

  if (variance === null) return <span className="text-[#94a3b8]">—</span>;

  // Planned minus actual: spending less than planned is a surplus, more is an
  // overspend — the reason for it belongs in the narrative column.
  const tone =
    variance === 0
      ? "text-[#64748b]"
      : variance > 0
        ? "text-[#2d6e1f]"
        : "text-[#a11111]";

  return (
    <span className={`font-semibold ${tone}`}>
      {formatReportAmount(Math.abs(variance))}
      {variance === 0 ? "" : variance > 0 ? " under" : " over"}
    </span>
  );
};

const MilestoneReportTable = ({
  rows = [],
  editable = false,
  showReview = false,
  reviewLabel = "Finance officer comment",
  onChange,
  onAttach,
}) => {
  if (rows.length === 0) return null;

  const hasActions = rows.some((row) => row.action);
  const columnCount = 9 + (showReview ? 1 : 0) + (hasActions ? 1 : 0);
  // Floor for legibility — cells wrap, so this only has to keep the columns
  // from collapsing. Kept as low as it can go so the full grid fits on a
  // desktop without scrolling.
  const minWidth = 1140 + (showReview ? 240 : 0) + (hasActions ? 160 : 0);

  return (
    <div className="overflow-x-auto rounded-xl border border-black/10">
      {/* Fixed layout so the widths below are honoured rather than treated as
          hints — the status and money columns hold short values and give their
          space to the comment column. */}
      <table
        className="w-full table-fixed border-collapse bg-white"
        style={{ minWidth: `${minWidth}px` }}
      >
        <thead>
          <tr>
            <th className={`${headClass} w-[20%]`}>Milestone</th>
            <th className={`${headClass} w-[8%]`}>Timeline</th>
            <th className={`${headClass} w-[8%]`}>Milestone status</th>
            <th className={`${headClass} w-[8%]`}>Budgeted amount</th>
            <th className={`${headClass} w-[8%]`}>Actual amount</th>
            <th className={`${headClass} w-[8%]`}>Variance (if any)</th>
            <th className={`${headClass} w-[8%]`}>Receipt/evidence</th>
            <th className={`${headClass} w-[10%]`}>Attach evidence</th>
            <th className={`${headClass} w-[12%]`}>Narrative</th>
            {showReview && <th className={`${headClass} w-[24%]`}>{reviewLabel}</th>}
            {hasActions && <th className={`${headClass} w-[10%]`}>Action</th>}
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => {
            const report = row.report || {};
            // Finance always reads; the startup's own row locks once the report
            // is with a reviewer.
            const locked = !editable || row.readOnly;
            const set = (key) => (e) => onChange?.(row.uuid, key, e.target.value);

            return (
              <Fragment key={row.uuid}>
              <tr className="odd:bg-white even:bg-[#f8fafc]">
                {/* Same shape as the Milestone Status table: the name with the
                    key activities beneath it. */}
                <td className={`${cellClass} font-bold text-[#111827]`}>
                  {row.title}
                  {row.activity ? (
                    <span className="mt-1 block text-xs font-normal text-[#64748b]">
                      {row.activity}
                    </span>
                  ) : null}
                  {row.kpiImpact ? (
                    <span className="mt-1 block text-xs font-normal text-emerald-700">
                      KPI/Impact: {row.kpiImpact}
                    </span>
                  ) : null}
                </td>

                <td className={`${cellClass} text-[#334155]`}>
                  {row.timeline || <span className="text-[#94a3b8]">—</span>}
                </td>

                <td className={cellClass}>
                  {locked ? (
                    <span
                      className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${
                        COMPLETION_STATUS_PILL[report.completionStatus] ||
                        "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {completionStatusLabel(report.completionStatus)}
                    </span>
                  ) : (
                    <select
                      className={fieldClass}
                      value={report.completionStatus || ""}
                      onChange={set("completionStatus")}
                    >
                      <option value="">Select</option>
                      {COMPLETION_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}
                </td>

                <td className={cellClass}>
                  {locked ? (
                    <span className="text-[#334155]">
                      {formatReportAmount(report.plannedAmount)}
                    </span>
                  ) : (
                    <input
                      className={fieldClass}
                      type="number"
                      min="0"
                      placeholder="0"
                      value={report.plannedAmount || ""}
                      onChange={set("plannedAmount")}
                    />
                  )}
                </td>

                <td className={cellClass}>
                  {locked ? (
                    <span className="text-[#334155]">
                      {formatReportAmount(report.actualAmount)}
                    </span>
                  ) : (
                    <input
                      className={fieldClass}
                      type="number"
                      min="0"
                      placeholder="0"
                      value={report.actualAmount || ""}
                      onChange={set("actualAmount")}
                    />
                  )}
                </td>

                {/* Always derived from planned vs actual — never typed. */}
                <td className={cellClass}>
                  <VarianceCell report={report} />
                </td>

                <td className={cellClass}>
                  {locked ? (
                    <span className="text-[#334155]">
                      {receiptLabel(report.receiptEvidence)}
                    </span>
                  ) : (
                    <select
                      className={fieldClass}
                      value={report.receiptEvidence || ""}
                      onChange={set("receiptEvidence")}
                    >
                      <option value="">Select</option>
                      {RECEIPT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}
                </td>

                {/* Documents already attached to the report, and — while the
                    row is open — the control to attach more. */}
                <td className={cellClass}>
                  {(row.attachments || []).length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-2">
                      {row.attachments.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-green-600 transition hover:text-green-700"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Evidence {i + 1}
                        </a>
                      ))}
                    </div>
                  )}

                  {locked ? (
                    (row.attachments || []).length === 0 && (
                      <span className="text-[#94a3b8]">—</span>
                    )
                  ) : (
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-green-600/40 bg-green-50 px-3 py-2 text-xs font-bold text-green-700 transition hover:bg-green-100">
                      <Paperclip className="h-4 w-4" />
                      {(row.pendingFiles || []).length > 0
                        ? `${row.pendingFiles.length} file(s) selected`
                        : "Attach document"}
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) =>
                          onAttach?.(row.uuid, Array.from(e.target.files || []))
                        }
                      />
                    </label>
                  )}
                </td>

                <td className={cellClass}>
                  {locked ? (
                    <span className="text-[#334155]">
                      {report.narrative || <span className="text-[#94a3b8]">—</span>}
                    </span>
                  ) : (
                    <textarea
                      className={`${fieldClass} min-h-[64px]`}
                      placeholder="Reason for the variance"
                      value={report.narrative || ""}
                      onChange={set("narrative")}
                    />
                  )}
                </td>

                {showReview && (
                  <td className={cellClass}>
                    {row.reviewComment || <span className="text-[#94a3b8]">—</span>}
                  </td>
                )}

                {hasActions && (
                  <td className={cellClass}>
                    <div className="flex flex-col gap-2">{row.action}</div>
                  </td>
                )}
              </tr>

              {/* Review feedback and KPI progress for this milestone, full
                  width so the columns above stay readable. */}
              {row.detail && (
                <tr>
                  <td
                    colSpan={columnCount}
                    className="border border-black/10 bg-[#f8fafc] px-3 py-3"
                  >
                    {row.detail}
                  </td>
                </tr>
              )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default MilestoneReportTable;
