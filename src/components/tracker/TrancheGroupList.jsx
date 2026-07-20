import { ChevronRight, ClipboardCheck } from "lucide-react";

// A list of tranches rendered as tappable rows — "Tranche 1 Milestones" and so
// on — used as the entry point into a tranche's milestones or reports. Selecting
// a row drills into that tranche; "View All" drops the filter.
//
// Props:
//   groups   - [{ key, title, subtitle, count, disabled }]
//   onSelect - called with a group's key
//   onViewAll- called when "View All" is pressed (omit to hide it)
//   title    - section heading
//   emptyText- shown when there are no groups
const TrancheGroupList = ({
  title,
  groups = [],
  onSelect,
  onViewAll,
  activeKey = "",
  emptyText = "Nothing here yet.",
}) => (
  <div>
    <div className="mb-4 flex items-center justify-between gap-3">
      <h3 className="text-lg font-black tracking-tight text-[#111827]">{title}</h3>
      {onViewAll && groups.length > 0 && (
        <button
          type="button"
          onClick={onViewAll}
          className="text-sm font-semibold text-green-600 transition hover:text-green-700"
        >
          View All
        </button>
      )}
    </div>

    {groups.length === 0 ? (
      <div className="rounded-2xl border border-dashed border-black/15 bg-white p-8 text-center text-sm text-[#64748b]">
        {emptyText}
      </div>
    ) : (
      <div className="space-y-3">
        {groups.map((group) => (
          <button
            key={group.key}
            type="button"
            onClick={() => !group.disabled && onSelect?.(group.key)}
            disabled={group.disabled}
            className={`flex w-full items-center gap-4 rounded-2xl border bg-white px-6 py-5 text-left shadow-sm transition ${
              group.disabled
                ? "cursor-not-allowed border-black/5 opacity-60"
                : activeKey === group.key
                  ? "border-green-600 shadow-md"
                  : "border-black/5 hover:border-black/10 hover:shadow-md"
            }`}
          >
            <ClipboardCheck
              className={`h-6 w-6 shrink-0 ${
                group.disabled ? "text-slate-400" : "text-[#111827]"
              }`}
            />

            <div className="min-w-0 flex-1">
              <p
                className={`truncate text-base font-bold ${
                  group.disabled ? "text-slate-500" : "text-[#111827]"
                }`}
              >
                {group.title}
              </p>
              {group.subtitle && (
                <p className="mt-0.5 truncate text-sm text-[#94a3b8]">
                  {group.subtitle}
                </p>
              )}
            </div>

            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-50 text-slate-400">
              <ChevronRight className="h-5 w-5" />
            </span>
          </button>
        ))}
      </div>
    )}
  </div>
);

// Group milestones by their linked tranche, in the order the tranches were
// configured. Milestones with no tranche fall into a trailing "Unassigned"
// group so nothing is hidden.
export const groupMilestonesByTranche = (milestones = [], trancheStages = []) => {
  const byTitle = new Map();

  trancheStages.forEach((stage) => {
    const title = String(stage?.title || "").trim();
    if (title) byTitle.set(title, []);
  });

  const unassigned = [];
  milestones.forEach((m) => {
    const linked = String(m?.linkedTranche || "").trim();
    if (linked && byTitle.has(linked)) byTitle.get(linked).push(m);
    else if (linked) byTitle.set(linked, [m]);
    else unassigned.push(m);
  });

  const groups = [...byTitle.entries()].map(([title, items]) => ({
    key: title,
    title,
    items,
  }));

  if (unassigned.length) {
    groups.push({ key: "__unassigned__", title: "Unassigned", items: unassigned });
  }

  return groups;
};

export default TrancheGroupList;
