"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FaArrowRight, FaFileContract, FaLayerGroup, FaMapMarkerAlt, FaMoneyBillWave, FaSearch } from "react-icons/fa";
import { getMyCapitalRequests, getMyIntroductions, getProviderDirectory } from "@/controllers/capital_controller";
import Loader from "@/components/common/Loader";
import { CapitalRequestModal, CLOSED, IntroductionModal } from "@/components/capital/EnterpriseCapitalForms";
import { EmptyState, FilterDropdown, RaiseHero, StatusPill, pageClass } from "@/components/capital/RaiseCapitalUI";
import { FINANCING_LABELS, PROVIDER_TYPE_LABELS, financingLabel, money, providerTypeLabel } from "@/utils/capital_labels";

const PER_PAGE = 12;
const OPEN_INTRODUCTION = ["pending_review", "changes_requested", "clarification_requested", "awaiting_enterprise_permission"];

const ticket = (row) => {
  if (row.minTicketUsd && row.maxTicketUsd) return `${money(row.minTicketUsd)} – ${money(row.maxTicketUsd)}`;
  if (row.maxTicketUsd) return `Up to ${money(row.maxTicketUsd)}`;
  if (row.minTicketUsd) return `From ${money(row.minTicketUsd)}`;
  return "Ticket size not specified";
};

// Where the startup stands with an investor, if anywhere.
const relationship = (introductions) => {
  if (!introductions.length) return null;
  if (introductions.some((row) => ["approved", "scheduled"].includes(row.status))) return { tone: "green", label: "Introduced" };
  if (introductions.some((row) => OPEN_INTRODUCTION.includes(row.status))) return { tone: "yellow", label: "Introduction requested" };
  return null;
};

// Raise Capital › Investors: every capital provider the startup can ask Anza to
// introduce it to. What they back is shown; how to reach them is not, until an
// introduction is approved.
const CapitalInvestors = () => {
  const navigate = useNavigate();
  const [providers, setProviders] = useState(null);
  const [requests, setRequests] = useState([]);
  const [introductions, setIntroductions] = useState([]);
  const [filters, setFilters] = useState({ sector: "", type: "", instrument: "" });
  const [sort, setSort] = useState("name");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [introducing, setIntroducing] = useState(null);
  const [applying, setApplying] = useState(false);

  const load = useCallback(async () => {
    const [directory, mine, intros] = await Promise.all([getProviderDirectory(), getMyCapitalRequests(), getMyIntroductions()]);
    if (directory?.status === false) toast.error(directory.message || "Failed to load investors");
    setProviders(directory?.status === false ? [] : directory.body.data);
    if (mine?.status !== false) setRequests(mine.body.data || []);
    if (intros?.status !== false) setIntroductions(intros.body.data || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sectors = useMemo(() => [...new Set((providers || []).flatMap((row) => row.preferredSectors || []))].sort(), [providers]);

  const visible = useMemo(() => {
    const term = keyword.trim().toLowerCase();
    const rows = (providers || []).filter(
      (row) =>
        (!term || [row.name, providerTypeLabel(row.providerType), ...(row.preferredSectors || []), ...(row.preferredGeographies || [])].some((value) => String(value || "").toLowerCase().includes(term))) &&
        (!filters.sector || (row.preferredSectors || []).includes(filters.sector)) &&
        (!filters.type || row.providerType === filters.type) &&
        (!filters.instrument || (row.instruments || []).includes(filters.instrument)),
    );
    return rows.sort((a, b) => (sort === "ticket" ? Number(b.maxTicketUsd || 0) - Number(a.maxTicketUsd || 0) : String(a.name).localeCompare(String(b.name))));
  }, [providers, keyword, filters, sort]);

  useEffect(() => setPage(1), [keyword, filters, sort]);

  if (!providers) return <Loader />;

  const openRequests = requests.filter((row) => !CLOSED.includes(row.status));
  const pages = Math.max(1, Math.ceil(visible.length / PER_PAGE));
  const shown = visible.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const introductionsWith = (uuid) => introductions.filter((row) => row.provider?.uuid === uuid);
  const set = (key) => (value) => setFilters((prev) => ({ ...prev, [key]: value }));

  return (
    <div className={pageClass}>
      <div className="mx-auto max-w-7xl">
        <RaiseHero
          badge="Investor Network"
          title="Investors"
          description="Discover investors backing growth-focused businesses through equity, debt, grants, convertible notes and revenue-share financing. Ask Anza to introduce you - your contact details are shared once the introduction is approved."
          highlights={[{ icon: FaLayerGroup, label: `${providers.length} Investors` }, { icon: FaMoneyBillWave, label: "Funding Profiles" }]}
        />

        <h2 className="mb-6 text-2xl font-bold text-[#172033]">Available Investors</h2>

        <div className="mb-8 rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <FilterDropdown value={filters.sector} onChange={set("sector")} allLabel="All Sectors" options={sectors.map((value) => ({ value, label: value }))} />
            <FilterDropdown value={filters.type} onChange={set("type")} allLabel="All Investor Types" options={Object.entries(PROVIDER_TYPE_LABELS).map(([value, label]) => ({ value, label }))} />
            <FilterDropdown value={filters.instrument} onChange={set("instrument")} allLabel="All Structures" options={Object.entries(FINANCING_LABELS).map(([value, label]) => ({ value, label }))} />
            <FilterDropdown value={sort === "name" ? "" : sort} onChange={(value) => setSort(value || "name")} allLabel="Sort By: Name" options={[{ value: "ticket", label: "Sort By: Largest ticket" }]} />
            <div className="relative ml-auto w-full sm:w-72">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8f98]" />
              <input
                type="text"
                placeholder="Search investors..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full rounded-md border border-black/10 bg-white px-4 py-3 pl-10 text-sm text-[#172033] outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
              />
            </div>
          </div>
        </div>

        {shown.length ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {shown.map((investor) => {
              const status = relationship(introductionsWith(investor.uuid));
              return (
                <div key={investor.uuid} className="group flex flex-col overflow-hidden rounded-xl bg-white shadow-md transition duration-200 hover:scale-[1.02] hover:shadow-lg">
                  <div className="relative h-56 overflow-hidden bg-black">
                    <img
                      src={investor.image || "/images/user.png"}
                      alt={investor.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        // Swap once to the placeholder; never loop on a missing file.
                        if (!e.currentTarget.src.endsWith("/images/user.png")) e.currentTarget.src = "/images/user.png";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 shadow-sm">{(investor.preferredSectors || [])[0] || "Any sector"}</span>
                      {status ? <StatusPill tone={status.tone}>{status.label}</StatusPill> : null}
                    </div>
                  </div>

                  <div className="flex min-h-[250px] flex-1 flex-col p-5">
                    <h3 className="mb-2 line-clamp-2 text-lg font-bold text-[#111827]">{investor.name}</h3>
                    <p className="mb-5 line-clamp-1 text-sm text-[#6f6f72]">{providerTypeLabel(investor.providerType)}</p>

                    <div className="space-y-3 text-sm text-[#6f6f72]">
                      <div className="flex items-center gap-2"><FaMoneyBillWave className="shrink-0" /><span className="line-clamp-1">{ticket(investor)}</span></div>
                      <div className="flex items-center gap-2"><FaFileContract className="shrink-0" /><span className="line-clamp-1">{(investor.instruments || []).map(financingLabel).join(", ") || "Structure not specified"}</span></div>
                      {(investor.preferredGeographies || []).length ? <div className="flex items-center gap-2"><FaMapMarkerAlt className="shrink-0" /><span className="line-clamp-1">{investor.preferredGeographies.join(", ")}</span></div> : null}
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-3 border-t border-black/10 pt-4 text-xs">
                      {investor.accountUuid ? (
                        <button type="button" onClick={() => navigate(`/dashboard/investors/details/${investor.accountUuid}`)} className="flex items-center gap-1 font-medium text-[#8a8f98] hover:text-[#172033]">
                          View Profile
                        </button>
                      ) : (
                        <span className="flex items-center gap-1 text-[#8a8f98]"><FaMoneyBillWave />Investor</span>
                      )}
                      {status?.label === "Introduced" ? (
                        <button type="button" onClick={() => navigate("/dashboard/capital")} className="flex items-center gap-1 font-semibold text-green-600">My Deals <FaArrowRight /></button>
                      ) : status ? (
                        <span className="font-medium text-yellow-700">Waiting for Anza</span>
                      ) : (
                        <button type="button" onClick={() => setIntroducing(investor)} className="flex items-center gap-1 font-semibold text-green-600 hover:text-green-700">Request Introduction <FaArrowRight /></button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState title="No investors found">Try a different search or filter.</EmptyState>
        )}

        {visible.length > PER_PAGE ? (
          <div className="mt-10 rounded-2xl bg-white px-6 py-5 shadow-sm">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <p className="text-sm text-[#6f6f72]">Showing {(page - 1) * PER_PAGE + 1} - {Math.min(page * PER_PAGE, visible.length)} of {visible.length} Investors</p>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => setPage(page - 1)} disabled={page === 1} className="rounded-lg border border-black/10 bg-white px-5 py-2.5 text-sm text-[#6f6f72] disabled:opacity-50">Previous</button>
                {Array.from({ length: pages }, (_, index) => index + 1).map((number) => (
                  <button key={number} type="button" onClick={() => setPage(number)} className={`rounded-lg px-4 py-2.5 text-sm font-medium ${page === number ? "bg-[#082d77] text-white" : "border border-black/10 bg-white text-[#6f6f72]"}`}>{number}</button>
                ))}
                <button type="button" onClick={() => setPage(page + 1)} disabled={page === pages} className="rounded-lg border border-black/10 bg-white px-5 py-2.5 text-sm text-[#6f6f72] disabled:opacity-50">Next</button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <IntroductionModal
        provider={introducing}
        openRequests={openRequests}
        onClose={() => setIntroducing(null)}
        onSent={() => {
          setIntroducing(null);
          load();
        }}
        onNewApplication={() => {
          setIntroducing(null);
          setApplying(true);
        }}
      />
      <CapitalRequestModal
        open={applying}
        request={null}
        onClose={() => setApplying(false)}
        onSaved={() => {
          setApplying(false);
          load();
        }}
      />
    </div>
  );
};

export default CapitalInvestors;
