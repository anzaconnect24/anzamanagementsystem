import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Loader from "@/components/common/Loader";
import GrantSummaryCards from "@/components/tracker/GrantSummaryCards";
import { listTrackerMilestones } from "@/controllers/trackerController";
import { PLAN_STATUS } from "@/utils/trancheWorkflow";
import { ArrowLeft, ClipboardList } from "lucide-react";

const isMilestoneDisbursed = (m) =>
  String(m?.planStatus) === PLAN_STATUS.DISBURSED || Boolean(m?.disbursed);

// Read-only page a BDA opens to review a startup's milestones together with the
// grant financial summary cards.
const StaffStartupMilestones = () => {
  const navigate = useNavigate();
  const { entUuid } = useParams();
  const [searchParams] = useSearchParams();
  const businessUuid = searchParams.get("business") || "";
  const name = searchParams.get("name") || "Startup";

  const [loading, setLoading] = useState(true);
  const [milestones, setMilestones] = useState([]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const data = await listTrackerMilestones();
        const list = Array.isArray(data) ? data : data?.body || [];
        if (active) setMilestones(Array.isArray(list) ? list : []);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Milestones this startup created, matched by entrepreneur/business uuid.
  const rows = useMemo(
    () =>
      (Array.isArray(milestones) ? milestones : []).filter((m) => {
        const mEnt = m?.Entreprenuer?.uuid || m?.entreprenuerUuid;
        const mBiz = m?.Business?.uuid || m?.businessUuid;
        return (
          (entUuid && mEnt === entUuid) ||
          (businessUuid && mBiz === businessUuid)
        );
      }),
    [milestones, entUuid, businessUuid],
  );

  // Derive the financial summary from the milestone-linked tranches.
  const stats = useMemo(() => {
    const byTranche = new Map();
    rows.forEach((m) => {
      const key = m.linkedTranche || m.title || "";
      if (!key || byTranche.has(key)) return;
      byTranche.set(key, {
        title: key,
        amount: Number(m.trancheAmount || 0),
        date: m.dueDate || null,
        disbursed: isMilestoneDisbursed(m),
      });
    });
    const tranches = [...byTranche.values()];
    const committed = tranches.reduce((s, t) => s + t.amount, 0);
    const disbursed = tranches
      .filter((t) => t.disbursed)
      .reduce((s, t) => s + t.amount, 0);
    const remaining = Math.max(0, committed - disbursed);
    const disbursedPct = committed > 0 ? (disbursed / committed) * 100 : 0;
    const remainingPct = committed > 0 ? (remaining / committed) * 100 : 0;
    const next = tranches.find((t) => !t.disbursed) || null;
    return { committed, disbursed, remaining, disbursedPct, remainingPct, next };
  }, [rows]);

  if (loading) return <Loader />;

  return (
    <div className="space-y-6 bg-[#eef2f8] px-6 py-6">
      <button
        type="button"
        onClick={() => navigate("/dashboard/mentorTracker")}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#163b8f]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to startups
      </button>

      <section
        className="relative overflow-hidden rounded-2xl bg-slate-950 px-7 py-6 text-white shadow-sm shadow-slate-300/70 md:px-10 md:py-7"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.6) 50%, rgba(0, 0, 0, 0.2) 100%), url('/images/mentor_hero.svg')",
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-bold text-white shadow-sm backdrop-blur">
              <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
              Startup Milestones
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
              {name}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={!entUuid}
              onClick={() =>
                navigate(
                  `/dashboard/mentorTracker/enterprise-kyc?entreprenuer=${entUuid}${
                    businessUuid ? `&business=${businessUuid}` : ""
                  }&view=1`,
                )
              }
              className="rounded-lg bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/25 disabled:opacity-50"
            >
              View KYC
            </button>
          </div>
        </div>
      </section>

      <GrantSummaryCards
        committed={stats.committed}
        disbursed={stats.disbursed}
        remaining={stats.remaining}
        disbursedPct={stats.disbursedPct}
        remainingPct={stats.remainingPct}
        next={stats.next}
        programName={name}
      />

      <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-[#082d77]" />
          <h2 className="text-lg font-black tracking-tight text-slate-950">
            Milestones
          </h2>
        </div>

        <div className="space-y-3">
          {rows.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
              No milestones submitted by this startup yet.
            </div>
          )}

          {/* Same shape as the startup's own milestone list: the name, with key
              activities (stored on tranchePlannedUse) as the description. */}
          {rows.map((m, index) => {
            const normalizedStatus = String(m.status || "pending").toLowerCase();
            const waitingForApproval = ["pending", "draft"].includes(
              normalizedStatus,
            );

            return (
              <div
                key={m.uuid || m.id}
                className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
              >
                <div className="flex gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-black text-slate-700">
                    {m.status === "completed" ? "✓" : index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-slate-950">{m.title}</p>

                    {m.tranchePlannedUse ? (
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {m.tranchePlannedUse}
                      </p>
                    ) : null}

                    {waitingForApproval && (
                      <p className="mt-2 text-sm font-semibold text-slate-700">
                        Waiting for mentor approval before report submission.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default StaffStartupMilestones;