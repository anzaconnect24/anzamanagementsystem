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
import {
  commentsFromNotes,
  milestoneActivityRows,
} from "@/utils/milestoneActivities";

// Where every milestone stands: the plan as the startup submitted it, one row
// per activity with the business coach's comment beside it, then the plan's
// status and what has happened to its report. Shared by the business coach,
// the finance officer and the startup, so all three read the same table.
const cellClass =
  "border border-black/10 px-3 py-2 align-top text-sm break-words text-[#334155]";
const headClass =
  "border border-black/10 bg-[#eaf0fb] px-3 py-2 text-left text-xs font-black text-[#111827]";
const empty = <span className="text-[#94a3b8]">—</span>;

const pill = (tone) =>
  `inline-block rounded-full px-2.5 py-1 text-xs font-bold ${tone}`;

// The plan's approval state, reduced to what a reader cares about: did the BDA
// sign it off, is it still with them, or did it come back.
const planState = (planStatus) => {
  const ps = planStatus || "";

  if (isPlanApproved(ps)) return { label: "Approved", tone: "bg-[#e1f0d8] text-[#2d6e1f]" };
  if (ps === PLAN_STATUS.REJECTED)
    return { label: "Rejected", tone: "bg-[#fde0e0] text-[#a11111]" };
  if (ps === PLAN_STATUS.REVISION_REQUESTED)
    return { label: "Further information requested", tone: "bg-[#fdf1ce] text-[#8a6500]" };
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
//   the column is not rendered at all, which is how the read-only views get the
//   plain table.
// renderDetail - (milestone) => node rendered full width beneath the milestone,
//   for the revision form the action opens.
const MilestoneStatusTable = ({
  rows = [],
  showTranche = true,
  renderAction,
  renderDetail,
}) => {
  if (rows.length === 0) return null;

  const actions = rows.map((row) => renderAction?.(row) || null);
  const hasActions = actions.some(Boolean);
  const columnCount = 8 + (showTranche ? 1 : 0) + (hasActions ? 1 : 0);

  return (
    <div className="overflow-x-auto rounded-xl border border-black/10">
      <table
        className="w-full table-fixed border-collapse bg-white"
        style={{
          minWidth: `${1180 + (showTranche ? 120 : 0) + (hasActions ? 130 : 0)}px`,
        }}
      >
        <thead>
          <tr>
            <th className={`${headClass} w-[16%]`}>Milestone</th>
            {showTranche && <th className={`${headClass} w-[8%]`}>Tranche</th>}
            <th className={`${headClass} w-[16%]`}>Activity</th>
            <th className={`${headClass} w-[10%] text-right`}>Planned Amount (TZS)</th>
            <th className={`${headClass} w-[8%]`}>Timeline</th>
            <th className={`${headClass} w-[11%]`}>KPI | Impact</th>
            <th className={`${headClass} w-[15%]`}>Comments</th>
            <th className={`${headClass} w-[12%] text-center`}>Status</th>
            <th className={`${headClass} w-[12%] text-center`}>Report</th>
            {hasActions && <th className={`${headClass} w-[9%]`}>Action</th>}
          </tr>
        </thead>

        <tbody>
          {rows.map((milestone, milestoneIndex) => {
            const plan = planState(milestone.planStatus);
            const report = reportState(milestone.status);
            const activities = milestoneActivityRows(milestone);
            const comments = commentsFromNotes(milestone.mentorReviewNotes, activities);
            const detail = renderDetail?.(milestone);
            const span = activities.length;
            // A milestone planned before activities carried their own figures
            // still shows its total and timeline on its one row.
            const single = span === 1;

            return (
              <Fragment key={milestone.uuid}>
                {activities.map((activity, index) => {
                  const amount =
                    activity.plannedAmount || (single ? milestonePlannedAmount(milestone) : "");
                  const timeline =
                    activity.timeline || (single ? milestoneTimelineSpan(milestone) : "");

                  return (
                    <tr key={`${milestone.uuid}-${index}`} className="bg-white">
                      {index === 0 && (
                        <td rowSpan={span} className={cellClass}>
                          <div className="flex items-start gap-3">
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#eaf0fb] text-sm font-black text-[#082d77]">
                              {milestoneIndex + 1}
                            </span>
                            <p className="min-w-0 font-bold text-[#111827]">
                              {milestone.title}
                            </p>
                          </div>
                        </td>
                      )}

                      {index === 0 && showTranche && (
                        <td rowSpan={span} className={cellClass}>
                          {milestone.linkedTranche || empty}
                        </td>
                      )}

                      <td className={`${cellClass} text-xs`}>{activity.text || empty}</td>

                      <td
                        className={`${cellClass} text-right text-xs ${
                          index === 0 ? "font-bold text-[#111827]" : ""
                        }`}
                      >
                        {formatReportAmount(amount)}
                      </td>

                      <td className={`${cellClass} text-xs`}>{timeline || empty}</td>

                      <td className={`${cellClass} text-xs`}>{activity.kpiImpact || empty}</td>

                      <td className={`${cellClass} whitespace-pre-line text-xs`}>
                        {comments[index] || empty}
                      </td>

                      {index === 0 && (
                        <td rowSpan={span} className={`${cellClass} text-center`}>
                          <span className={pill(plan.tone)}>{plan.label}</span>
                        </td>
                      )}

                      {index === 0 && (
                        <td rowSpan={span} className={`${cellClass} text-center`}>
                          <span className={pill(report.tone)}>{report.label}</span>
                        </td>
                      )}

                      {index === 0 && hasActions && (
                        <td rowSpan={span} className={cellClass}>
                          {actions[milestoneIndex]}
                        </td>
                      )}
                    </tr>
                  );
                })}

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
