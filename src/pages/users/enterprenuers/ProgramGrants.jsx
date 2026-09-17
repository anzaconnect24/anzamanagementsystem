"use client";

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaCheckCircle,
  FaCoins,
  FaHandHoldingUsd,
  FaSearch,
  FaUsers,
} from "react-icons/fa";
import Loader from "@/components/common/Loader";
import StatCard from "@/components/tracker/StatCard";
import {
  getGrantRecipients,
  setGrantRecipients,
} from "@/controllers/cohort_controller";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-[#111a2e] outline-none focus:border-[#082d77] focus:ring-2 focus:ring-[#082d77]/20";

const money = (value) => Number(value || 0).toLocaleString();

// Not every startup on a programme receives a grant. The Program Lead picks
// who does — the grant process starts here, and the Finance Officer disburses
// against this roster rather than assembling it themselves.
const ProgramGrants = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();

  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [keyword, setKeyword] = useState("");

  // Working copy, keyed by business uuid.
  const [draft, setDraft] = useState({});

  const load = () =>
    getGrantRecipients(uuid)
      .then((body) => {
        setPayload(body);
        setDraft(
          Object.fromEntries(
            (body.data || []).map((row) => [
              row.businessUuid,
              {
                isRecipient: row.isRecipient,
                grantUsd: row.grantUsd || "",
                grantPurpose: row.grantPurpose || "",
              },
            ]),
          ),
        );
      })
      .catch((error) => {
        toast.error(
          error?.response?.status === 403
            ? "This program is not yours"
            : "Failed to load the grant roster",
        );
        setPayload(null);
      })
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uuid]);

  const rows = payload?.data || [];

  const visible = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      [row.name, row.sector, row.location]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q)),
    );
  }, [rows, keyword]);

  const chosen = Object.values(draft).filter((row) => row.isRecipient);
  const committed = chosen.reduce(
    (total, row) => total + Number(row.grantUsd || 0),
    0,
  );

  const update = (businessUuid, patch) =>
    setDraft((prev) => ({
      ...prev,
      [businessUuid]: { ...prev[businessUuid], ...patch },
    }));

  const onSave = async () => {
    const recipients = Object.entries(draft)
      .filter(([, row]) => row.isRecipient)
      .map(([businessUuid, row]) => ({
        businessUuid,
        grantUsd: Number(row.grantUsd || 0),
        grantPurpose: row.grantPurpose || "",
      }));

    setSaving(true);
    const response = await setGrantRecipients(uuid, recipients);
    setSaving(false);

    if (response?.status === false) {
      toast.error(response.message || "Failed to save");
      return;
    }

    const body = response.body || response;
    toast.success(
      `${body.recipients} ${body.recipients === 1 ? "startup" : "startups"} on the grant roster`,
    );
    load();
  };

  if (loading) return <Loader />;

  if (!payload) {
    return (
      <div className="px-6 py-10">
        <div className="mx-auto max-w-3xl rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          This grant roster is not open to you.
        </div>
      </div>
    );
  }

  const { program, summary, canEdit } = payload;
  const grantProgramUuid = payload.grantProgram?.uuid || null;

  return (
    <div className="min-h-screen px-6 py-4">
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
            Grant Recipients
          </span>

          <h1 className="mb-3 text-3xl font-bold leading-tight drop-shadow-lg md:text-4xl">
            {program?.title || "Program"}
          </h1>

          <p className="max-w-2xl text-sm leading-6 text-white/85 drop-shadow-md">
            Not every startup on a programme receives a grant. Choose who does
            and what they are committed, then the Finance Officer disburses
            against this roster.
          </p>
        </div>
      </div>

      {/* FIGURES */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<FaUsers />}
          label="On the programme"
          value={summary.onProgramme}
          tone="text-[#0b2b5c]"
          sub={<p className="mt-1 text-xs text-slate-400">Eligible to be chosen</p>}
        />
        <StatCard
          icon={<FaHandHoldingUsd />}
          label="Grant recipients"
          value={chosen.length}
          tone="text-emerald-600"
          sub={
            <p className="mt-1 text-xs text-slate-400">
              {summary.recipients} saved
            </p>
          }
        />
        <StatCard
          icon={<FaCoins />}
          label="Committed"
          value={money(committed)}
          tone="text-amber-500"
          sub={<p className="mt-1 text-xs text-slate-400">Across the roster</p>}
        />
        <StatCard
          icon={<FaCheckCircle />}
          label="Disbursed"
          value={money(summary.disbursed)}
          tone="text-[#0b2b5c]"
          sub={
            <p className="mt-1 text-xs text-slate-400">
              Recorded by the finance officer
            </p>
          }
        />
      </div>

      {/* TOOLBAR */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative">
          <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#98A2B3]" />
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Search startups..."
            className="w-64 rounded-lg border border-slate-300 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-[#082d77]"
          />
        </div>

        {canEdit ? (
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="rounded-lg bg-[#082d77] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#061f54] disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save grant roster"}
          </button>
        ) : null}
      </div>

      {/* ROSTER */}
      {visible.length === 0 ? (
        <div className="mx-auto max-w-3xl rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          {rows.length === 0
            ? "No startup is enrolled on this program yet."
            : "No startup matches your search."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm shadow-slate-200/50">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500">
                <th className="px-5 py-4">Startup</th>
                <th className="px-5 py-4">Sector</th>
                {/* The decision sits next to the amount it governs: you say
                    yes, then you say how much. */}
                <th className="px-5 py-4">Receives a grant</th>
                <th className="px-5 py-4">Grant committed</th>
                <th className="px-5 py-4">Disbursement</th>
                <th className="px-5 py-4">Grant</th>
              </tr>
            </thead>

            <tbody>
              {visible.map((row) => {
                const state = draft[row.businessUuid] || {};

                return (
                  <tr
                    key={row.businessUuid}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-5 py-4">
                      {/* Sentence case in CSS rather than in the data: the
                          registered name is what it is — "PAYGUARD LIMITED" —
                          and rewriting it on the way in would lose the only
                          copy of how the company actually spells itself. */}
                      <span
                        title={row.name}
                        className="block font-bold lowercase text-slate-900 first-letter:uppercase"
                      >
                        {row.name}
                      </span>
                      {row.location ? (
                        <span className="mt-0.5 block text-xs text-[#8a8f98]">
                          {row.location}
                        </span>
                      ) : null}
                    </td>

                    <td className="px-5 py-4 text-[#6f6f72]">
                      {row.sector || "—"}
                    </td>

                    <td className="px-5 py-4">
                      <label className="inline-flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!!state.isRecipient}
                          disabled={!canEdit || row.disbursed}
                          onChange={(e) =>
                            update(row.businessUuid, {
                              isRecipient: e.target.checked,
                            })
                          }
                          className="h-4 w-4 accent-[#16a34a]"
                        />
                        <span className="text-xs font-semibold text-slate-600">
                          {state.isRecipient ? "Yes" : "No"}
                        </span>
                      </label>
                    </td>

                    <td className="px-5 py-4">
                      <input
                        type="number"
                        min="0"
                        className={inputClass}
                        disabled={!canEdit || !state.isRecipient}
                        value={state.grantUsd ?? ""}
                        onChange={(e) =>
                          update(row.businessUuid, { grantUsd: e.target.value })
                        }
                      />
                    </td>

                    {/* Read-only: disbursing is the finance officer's step, and
                        a startup already paid cannot be taken off the roster. */}
                    <td className="px-5 py-4">
                      {row.disbursed ? (
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
                          <FaCheckCircle />
                          {money(row.disbursedAmount || row.grantUsd)}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">
                          Not disbursed
                        </span>
                      )}
                    </td>

                    {/* The recipient’s own grant: contract, tranches and
                        milestone reporting. Only once they are actually on
                        the roster and the grant programme exists. */}
                    <td className="px-5 py-4">
                      {row.isRecipient && grantProgramUuid && (row.trackerEnterpriseUuid || row.entreprenuerUuid) ? (
                        <button
                          type="button"
                          onClick={() =>
                            // The recipient's grant workspace: milestones with
                            // every activity, comments and the plan verdict.
                            // Whoever cannot act on this programme reads it.
                            // A recipient without a tracker record yet falls
                            // back to the finance view of the grant.
                            navigate(
                              row.trackerEnterpriseUuid
                                ? `/dashboard/mentorTracker/enterprise/${row.trackerEnterpriseUuid}${canEdit ? "" : "?view=1"}`
                                : `/dashboard/trackerPrograms/${grantProgramUuid}/startup/${row.entreprenuerUuid}`,
                            )
                          }
                          className="whitespace-nowrap rounded-lg border border-[#082d77]/20 px-3 py-2 text-xs font-semibold text-[#082d77] transition hover:bg-slate-50"
                        >
                          Manage grant
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">
                          {row.isRecipient ? "Save to manage" : "—"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-[#8a8f98]">
        A startup whose grant has already been disbursed cannot be removed here
        — the payment is a record. Disbursement itself stays with the Finance
        Officer.
      </p>
    </div>
  );
};

export default ProgramGrants;
