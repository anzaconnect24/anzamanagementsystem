// Summary tile used across the tracker screens: the figure first and large,
// a small tinted icon top-right, the label beneath it, and an optional note
// under that for context the number alone does not carry.
//
// Lifted out of CoachingSessionsPanel so the pages that show these summaries
// share one definition rather than drifting apart.
const StatCard = ({ label, value, sub, icon, tone = "text-[#0b2b5c]" }) => (
  <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50">
    <div className="flex items-start justify-between gap-3">
      <p className="min-w-0 truncate text-xl font-black tracking-tight text-slate-950">
        {value}
      </p>
      <span className={`shrink-0 ${tone}`}>{icon}</span>
    </div>

    <p className="mt-3 text-sm font-medium text-slate-500">{label}</p>
    {sub}
  </div>
);

export default StatCard;
