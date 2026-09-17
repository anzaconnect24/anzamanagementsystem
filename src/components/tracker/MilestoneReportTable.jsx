import { Fragment } from "react";
import { FileText, Paperclip } from "lucide-react";

import {
  COMPLETION_STATUS_OPTIONS,
  COMPLETION_STATUS_PILL,
  RECEIPT_OPTIONS,
  completionStatusLabel,
  computeVariance,
  formatReportAmount,
  milestonePlannedAmount,
  receiptLabel,
} from "@/utils/milestoneReport";
import {
  activityReportAt,
  milestoneActivityRows,
} from "@/utils/milestoneActivities";

// The milestone reporting grid, used by the startup (editable), the business
// coach and the finance officer, so a report is entered and reviewed in exactly
// the same layout. Every activity of a milestone is reported on its own line:
//
//   Milestone | Activity | KPI | Impact | Timeline | Milestone status |
//   Planned amount | Actual amount | Variance | Receipt/evidence |
//   Attach evidence | Narrative | Comment | Action
//
// Props:
//   rows        - [{ uuid, milestone, title, report, attachments, pendingFiles,
//                    readOnly, action, detail, reviewComment }]
//                 `milestone` is the raw milestone its activities are read from;
//                 `pendingFiles` is { [activityIndex]: File[] }.
//   editable    - render inputs instead of text (startup side)
//   onChange    - (uuid, key, value, activityIndex) for edited cells
//   onAttach    - (uuid, files, activityIndex) when documents are picked
//   showReview  - add the reviewer comment column
//   reviewLabel - that column's header
//
// The comment, the action and `detail` belong to the milestone as a whole, so
// they span its activity lines.
const cellClass =
  "border border-black/10 px-3 py-2 align-top text-sm break-words";
const headClass =
  "border border-black/10 bg-[#eaf0fb] px-3 py-2 text-left text-xs font-black text-[#111827]";
const fieldClass =
  "w-full rounded-lg border border-black/10 bg-white px-2 py-1.5 text-xs outline-none transition focus:border-[#082d77]";
const empty = <span className="text-[#94a3b8]">—</span>;

const VarianceCell = ({ planned, actual }) => {
  const variance = computeVariance(planned, actual);

  if (variance === null) return empty;

  // Planned minus actual: spending less than planned is a surplus, more is an
  // overspend — the reason for it belongs in the narrative column.
  const tone =
    variance === 0
      ? "text-[#64748b]"
      : variance > 0
        ? "text-[#2d6e1f]"
        : "text-[#a11111]";

  return (
    <span className={`text-xs font-semibold ${tone}`}>
      {formatReportAmount(Math.abs(variance))}
      {variance === 0 ? "" : variance > 0 ? " under" : " over"}
    </span>
  );
};

// A row passed without its milestone still renders, as a single line.
const activitiesOf = (row) =>
  row.milestone
    ? milestoneActivityRows(row.milestone)
    : [{ text: row.activity || "", plannedAmount: "", timeline: "", kpiImpact: row.kpiImpact || "" }];

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
  const columnCount = 11 + (showReview ? 1 : 0) + (hasActions ? 1 : 0);
  // Floor for legibility — cells wrap, so this only has to keep the columns
  // from collapsing.
  const minWidth = 1700 + (showReview ? 220 : 0) + (hasActions ? 130 : 0);

  return (
    <div className="overflow-x-auto rounded-xl border border-black/10">
      <table
        className="w-full table-fixed border-collapse bg-white"
        style={{ minWidth: `${minWidth}px` }}
      >
        <thead>
          <tr>
            <th className={`${headClass} w-[11%]`}>Milestone</th>
            <th className={`${headClass} w-[12%]`}>Activity</th>
            <th className={`${headClass} w-[10%]`}>KPI | Impact</th>
            <th className={`${headClass} w-[6%]`}>Timeline</th>
            <th className={`${headClass} w-[7%]`}>Milestone status</th>
            <th className={`${headClass} w-[7%] text-right`}>Planned amount</th>
            <th className={`${headClass} w-[7%]`}>Actual amount</th>
            <th className={`${headClass} w-[7%]`}>Variance (if any)</th>
            <th className={`${headClass} w-[7%]`}>Receipt/evidence</th>
            <th className={`${headClass} w-[8%]`}>Attach evidence</th>
            <th className={`${headClass} w-[9%]`}>Narrative</th>
            {showReview && <th className={`${headClass} w-[10%]`}>{reviewLabel}</th>}
            {hasActions && <th className={`${headClass} w-[6%]`}>Action</th>}
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => {
            const report = row.report || {};
            // Finance and the coach always read; the startup's own milestone
            // locks once the report is with a reviewer.
            const locked = !editable || row.readOnly;
            const activities = activitiesOf(row);
            const span = activities.length;
            const single = span === 1;

            // Evidence attached before activities had their own lines belongs
            // to the milestone, and is listed with its first activity.
            const activityUrls = new Set(
              activities.flatMap((_, index) => activityReportAt(report, index).attachments),
            );
            const looseAttachments = (row.attachments || []).filter(
              (url) => !activityUrls.has(url),
            );

            return (
              <Fragment key={row.uuid}>
                {activities.map((activity, index) => {
                  const line = activityReportAt(report, index);
                  const planned =
                    activity.plannedAmount ||
                    (single ? report.plannedAmount || (row.milestone ? milestonePlannedAmount(row.milestone) : "") : "");
                  const timeline = activity.timeline || (single ? row.timeline : "");
                  const attachments = [
                    ...line.attachments,
                    ...(index === 0 ? looseAttachments : []),
                  ];
                  const pending = row.pendingFiles?.[index] || [];
                  const set = (key) => (e) =>
                    onChange?.(row.uuid, key, e.target.value, index);

                  return (
                    <tr
                      key={`${row.uuid}-${index}`}
                      className={index % 2 ? "bg-[#f8fafc]" : "bg-white"}
                    >
                      {index === 0 && (
                        <td
                          rowSpan={span}
                          className={`${cellClass} bg-white font-bold text-[#111827]`}
                        >
                          {row.title}
                        </td>
                      )}

                      <td className={`${cellClass} text-xs font-semibold text-[#334155]`}>
                        {activity.text || empty}
                      </td>

                      <td className={`${cellClass} text-xs text-[#334155]`}>
                        {activity.kpiImpact || empty}
                      </td>

                      <td className={`${cellClass} text-xs text-[#334155]`}>
                        {timeline || empty}
                      </td>

                      <td className={cellClass}>
                        {locked ? (
                          <span
                            className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${
                              COMPLETION_STATUS_PILL[line.completionStatus] ||
                              "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {completionStatusLabel(line.completionStatus)}
                          </span>
                        ) : (
                          <select
                            className={fieldClass}
                            value={line.completionStatus || ""}
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

                      {/* Planned when the milestone was created — never retyped. */}
                      <td className={`${cellClass} text-right text-xs font-semibold text-[#334155]`}>
                        {formatReportAmount(planned)}
                      </td>

                      <td className={cellClass}>
                        {locked ? (
                          <span className="text-xs text-[#334155]">
                            {formatReportAmount(line.actualAmount)}
                          </span>
                        ) : (
                          <input
                            className={fieldClass}
                            type="number"
                            min="0"
                            placeholder="0"
                            value={line.actualAmount || ""}
                            onChange={set("actualAmount")}
                          />
                        )}
                      </td>

                      {/* Always derived from planned vs actual — never typed. */}
                      <td className={cellClass}>
                        <VarianceCell planned={planned} actual={line.actualAmount} />
                      </td>

                      <td className={cellClass}>
                        {locked ? (
                          line.receiptEvidence ? (
                            <span className="text-xs text-[#334155]">
                              {receiptLabel(line.receiptEvidence)}
                            </span>
                          ) : (
                            empty
                          )
                        ) : (
                          <select
                            className={fieldClass}
                            value={line.receiptEvidence || ""}
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

                      <td className={cellClass}>
                        {attachments.length > 0 && (
                          <div className="mb-2 flex flex-wrap gap-2">
                            {attachments.map((url, i) => (
                              <a
                                key={`${url}-${i}`}
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
                          attachments.length === 0 && empty
                        ) : (
                          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-green-600/40 bg-green-50 px-2 py-1.5 text-xs font-bold text-green-700 transition hover:bg-green-100">
                            <Paperclip className="h-3.5 w-3.5" />
                            {pending.length > 0 ? `${pending.length} file(s)` : "Attach"}
                            <input
                              type="file"
                              multiple
                              className="hidden"
                              onChange={(e) =>
                                onAttach?.(row.uuid, Array.from(e.target.files || []), index)
                              }
                            />
                          </label>
                        )}
                      </td>

                      <td className={cellClass}>
                        {locked ? (
                          line.narrative ? (
                            <span className="whitespace-pre-line text-xs text-[#334155]">
                              {line.narrative}
                            </span>
                          ) : (
                            empty
                          )
                        ) : (
                          <textarea
                            className={`${fieldClass} min-h-[56px]`}
                            placeholder="Reason for the variance"
                            value={line.narrative || ""}
                            onChange={set("narrative")}
                          />
                        )}
                      </td>

                      {index === 0 && showReview && (
                        <td rowSpan={span} className={`${cellClass} bg-white text-xs`}>
                          {row.reviewComment || empty}
                        </td>
                      )}

                      {index === 0 && hasActions && (
                        <td rowSpan={span} className={`${cellClass} bg-white`}>
                          <div className="flex flex-col gap-2">{row.action}</div>
                        </td>
                      )}
                    </tr>
                  );
                })}

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
