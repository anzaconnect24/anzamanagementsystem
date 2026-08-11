import { Fragment } from "react";

import {
  PLAN_STATUS,
  REPORT_STATUS,
  isPlanApproved,
} from "@/utils/trancheWorkflow";
import {
  formatReportAmount,
  milestonePlannedAmount,
  milestoneTimelineSpan,
} from "@/utils/milestoneReport";

// Where every milestone stands, at a glance: has the BDA approved the plan, and
// what has happened to the report filed against it. Shared by the business
// coach and the startup so both read the same two states in the same order.
const cellClass =
  "border border-black/10 px-3 py-2 align-top text-sm break-words text-[#334155]";
const headClass =
  "border border-black/10 bg-[#eaf0fb] px-3 py-2 text-left text-xs font-black text-[#111827]";

const pill = (tone) =>
  `inline-block rounded-full px-2.5 py-1 text-xs font-bold ${tone}`;

// The plan's approval state, reduced to what a reader cares about: did the BDA
// sign it off, is it still with them, or did it come back.
const bdaApproval = (planStatus) => {
  const ps = planStatus || "";

  if (isPlanApproved(ps)) return { label: "Approved", tone: "bg-[#e1f0d8] text-[#2d6e1f]" };
  if (ps === PLAN_STATUS.REJECTED)
    return { label: "Rejected", tone: "bg-[#fde0e0] text-[#a11111]" };
  if (ps === PLAN_STATUS.REVISION_REQUESTED)
    return { label: "Revision requested", tone: "bg-[#fdf1ce] text-[#8a6500]" };
  if (
    [PLAN_STATUS.SUBMITTED, PLAN_STATUS.UNDER_REVIEW, PLAN_STATUS.RESUBMITTED].includes(
      ps,
    )
  )
    return { label: "Awaiting BDA review", tone: "bg-[#dbe8ff] text-[#163b8f]" };

  return { label: "Not submitted", tone: "bg-slate-100 text-slate-600" };
};

// What happened to the report for this milestone.
const reportState = (status) => {
  const value = String(status || "").toLowerCase();

  if (value === REPORT_STATUS.COMPLETED)
    return { label: "Approved", tone: "bg-[#e1f0d8] text-[#2d6e1f]" };
  if (value === REPORT_STATUS.SUBMITTED)
    return { label: "Submitted", tone: "bg-[#dbe8ff] text-[#163b8f]" };
  if (value === REPORT_STATUS.REJECTED)
    return { label: "Declined", tone: "bg-[#fde0e0] text-[#a11111]" };
  // Back with the startup for more detail — not a rejection.
  if (value === REPORT_STATUS.INFO_REQUESTED)
    return { label: "Information requested", tone: "bg-[#fdf1ce] text-[#8a6500]" };

  return { label: "Not submitted", tone: "bg-slate-100 text-slate-600" };
};

// rows - milestones, in the order they should be listed
// showTranche - include the tranche column (drop it when already grouped)
// renderAction - (milestone) => node for a trailing Action column. Omit it and
//   the column is not rendered at all, which is how the read-only views (the
//   business coach's) get the plain six-column table.
// renderDetail - (milestone) => node rendered full width beneath its row, for
//   the revision form the action opens.
const MilestoneStatusTable = ({
  rows = [],
  showTranche = true,
  renderAction,
  renderDetail,
}) => {
  if (rows.length === 0) return null;

  const actions = rows.map((row) => renderAction?.(row) || null);
  const hasActions = actions.some(Boolean);
  const columnCount = 5 + (showTranche ? 1 : 0) + (hasActions ? 1 : 0);

  return (
    <div className="overflow-x-auto rounded-xl border border-black/10">
      <table
        className="w-full table-fixed border-collapse bg-white"
        style={{
          minWidth: `${(showTranche ? 900 : 780) + (hasActions ? 140 : 0)}px`,
        }}
      >
        <thead>
          <tr>
            <th className={`${headClass} w-[26%]`}>Milestone</th>
            {showTranche && <th className={`${headClass} w-[12%]`}>Tranche</th>}
            <th className={`${headClass} w-[14%]`}>Budgeted amount</th>
            <th className={`${headClass} w-[12%]`}>Timeline</th>
            <th className={`${headClass} w-[18%]`}>BDA approval</th>
            <th className={`${headClass} w-[18%]`}>Report</th>
            {hasActions && <th className={`${headClass} w-[12%]`}>Action</th>}
          </tr>
        </thead>

        <tbody>
          {rows.map((milestone, index) => {
            const approval = bdaApproval(milestone.planStatus);
            const report = reportState(milestone.status);
            const plannedAmount = milestonePlannedAmount(milestone);
            const timelineSpan = milestoneTimelineSpan(milestone);
            const detail = renderDetail?.(milestone);

            return (
              <Fragment key={milestone.uuid}>
              <tr className="odd:bg-white even:bg-[#f8fafc]">
                <td className={`${cellClass} font-bold text-[#111827]`}>
                  {milestone.title}
                  {milestone.tranchePlannedUse ? (
                    <span className="mt-1 block text-xs font-normal text-[#64748b]">
                      {milestone.tranchePlannedUse}
                    </span>
                  ) : null}
                </td>

                {showTranche && (
                  <td className={cellClass}>
                    {milestone.linkedTranche || (
                      <span className="text-[#94a3b8]">—</span>
                    )}
                  </td>
                )}

                <td className={cellClass}>{formatReportAmount(plannedAmount)}</td>

                <td className={cellClass}>
                  {timelineSpan || <span className="text-[#94a3b8]">—</span>}
                </td>

                <td className={cellClass}>
                  <span className={pill(approval.tone)}>{approval.label}</span>
                </td>

                <td className={cellClass}>
                  <span className={pill(report.tone)}>{report.label}</span>
                </td>

                {hasActions && (
                  <td className={cellClass}>{actions[index]}</td>
                )}
              </tr>

              {/* The revision form, full width so the columns above stay
                  readable. */}
              {detail && (
                <tr>
                  <td
                    colSpan={columnCount}
                    className="border border-black/10 bg-[#f8fafc] px-3 py-3"
                  >
                    {detail}
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

export default MilestoneStatusTable;
