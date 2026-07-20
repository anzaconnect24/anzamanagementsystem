import { Briefcase, Layers, Wallet, CalendarDays } from "lucide-react";

// Grant financial summary stat cards shown below the hero on the finance
// officer's startup page and the startup's own dashboard.
//
// Props (a computed stats object):
//   committed, disbursed, remaining, disbursedPct, remainingPct
//   next        - the next (not-yet-disbursed) tranche { title, amount }
//   programName - shown on the committed card
const fmtTZS = (value) => `TZS ${Number(value || 0).toLocaleString()}`;

const StatCard = ({ icon, tint, label, value, sub }) => (
  <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
    <div className="flex items-start gap-3">
      <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tint}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-[#64748b]">{label}</p>
        <p className="mt-1 text-xl font-black tracking-tight text-[#111827]">{value}</p>
        {sub ? <p className="mt-1 text-xs text-[#94a3b8]">{sub}</p> : null}
      </div>
    </div>
  </div>
);

const GrantSummaryCards = ({
  committed = 0,
  disbursed = 0,
  remaining = 0,
  disbursedPct = 0,
  remainingPct = 0,
  next = null,
  programName,
}) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <StatCard
      icon={<Briefcase className="h-5 w-5" />}
      tint="bg-emerald-50 text-emerald-600"
      label="Total Grant Committed"
      value={fmtTZS(committed)}
      sub={`Committed under ${programName || "this program"}`}
    />
    <StatCard
      icon={<Layers className="h-5 w-5" />}
      tint="bg-blue-50 text-blue-600"
      label="Total Disbursed"
      value={fmtTZS(disbursed)}
      sub={`${Number(disbursedPct || 0).toFixed(2)}% of committed`}
    />
    <StatCard
      icon={<Wallet className="h-5 w-5" />}
      tint="bg-amber-50 text-amber-600"
      label="Remaining Balance"
      value={fmtTZS(remaining)}
      sub={`${Number(remainingPct || 0).toFixed(2)}% remaining`}
    />
    <StatCard
      icon={<CalendarDays className="h-5 w-5" />}
      tint="bg-violet-50 text-violet-600"
      label="Next Disbursement"
      value={fmtTZS(next?.amount || 0)}
      sub={next ? next.title || "Next tranche" : "No upcoming tranche"}
    />
  </div>
);

export default GrantSummaryCards;