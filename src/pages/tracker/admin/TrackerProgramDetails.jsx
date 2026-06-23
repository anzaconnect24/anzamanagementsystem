import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import Loader from "@/components/common/Loader";
import { getTrackerProgramOverview } from "@/controllers/trackerController";
import { editProgram } from "@/controllers/program_controller";
import { getReviewers } from "@/controllers/user_controller";

const TRACKER_CATEGORIES_MARKER = "__TRACKER_CATEGORIES__:";
const TRACKER_STARTUPS_MARKER = "__TRACKER_STARTUPS__:";

const parseMarkerJson = (text, marker) => {
  const idx = text.lastIndexOf(marker);
  if (idx === -1) return [];
  const line = text.slice(idx + marker.length).split("\n")[0].trim();
  try {
    const value = JSON.parse(line);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

const buildDescriptionWithMeta = (description, categories, startups) => {
  const clean = String(description || "").trim();
  const safeCats = Array.from(
    new Set((categories || []).map((c) => String(c || "").trim()).filter(Boolean)),
  );
  const safeStartups = Array.isArray(startups) ? startups.filter(Boolean) : [];
  return (
    `${clean}\n\n` +
    `${TRACKER_STARTUPS_MARKER}${JSON.stringify(safeStartups)}\n` +
    `${TRACKER_CATEGORIES_MARKER}${JSON.stringify(safeCats)}`
  );
};

const formatDateDisplay = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-GB");
};

const formatCurrency = (value) => {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) {
    return "$0";
  }
  return `$${amount.toLocaleString()}`;
};

const parseTrackerProgramMeta = (program) => {
  const rawDescription = String(program?.description || "");
  const indices = [
    rawDescription.indexOf(TRACKER_CATEGORIES_MARKER),
    rawDescription.indexOf(TRACKER_STARTUPS_MARKER),
  ].filter((i) => i >= 0);
  const firstMarker = indices.length ? Math.min(...indices) : -1;
  const cleanDescription =
    firstMarker === -1 ? rawDescription : rawDescription.slice(0, firstMarker).trim();

  return {
    cleanDescription,
    categories: Array.from(
      new Set(
        [...parseMarkerJson(rawDescription, TRACKER_CATEGORIES_MARKER), program?.programCategory]
          .map((item) => String(item || "").trim())
          .filter(Boolean),
      ),
    ),
    startups: parseMarkerJson(rawDescription, TRACKER_STARTUPS_MARKER),
  };
};

const TrackerProgramDetails = () => {
  const navigate = useNavigate();
  const { programUuid } = useParams();

  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [expandedEnterpriseUuid, setExpandedEnterpriseUuid] = useState(null);
  const [members, setMembers] = useState([]);
  const [bdaList, setBdaList] = useState([]);
  const [savingMembers, setSavingMembers] = useState(false);

  useEffect(() => {
    const meta = parseTrackerProgramMeta(overview?.program);
    setMembers(Array.isArray(meta.startups) ? meta.startups : []);
  }, [overview]);

  useEffect(() => {
    getReviewers(1000, 1)
      .then((body) => {
        const all = Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : [];
        const staffOnly = all.filter((u) => u.role === "Staff");
        setBdaList(staffOnly.length ? staffOnly : all);
      })
      .catch(() => setBdaList([]));
  }, []);

  const updateMember = (idx, key, value) =>
    setMembers((prev) => prev.map((m, i) => (i === idx ? { ...m, [key]: value } : m)));

  const onSetMemberBda = (idx, bdaUuid) => {
    const bda = bdaList.find((b) => b.uuid === bdaUuid);
    setMembers((prev) =>
      prev.map((m, i) =>
        i === idx ? { ...m, bdaUuid, bdaName: bda?.name || bda?.email || "" } : m,
      ),
    );
  };

  const loadOverview = async () => {
    if (!programUuid) {
      return;
    }

    setLoading(true);
    try {
      const response = await getTrackerProgramOverview(programUuid);
      setOverview(response);
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "Failed to load tracker program details",
      );
      navigate("/dashboard/trackerPrograms");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, [programUuid]);

  const program = overview?.program;
  const enterprises = Array.isArray(overview?.enterprises)
    ? overview.enterprises
    : [];
  const summary = overview?.summary || {
    enterprisesCount: 0,
    sessionsCount: 0,
    weeklyLogsCount: 0,
    milestonesCount: 0,
    mentorshipHours: 0,
  };

  const parsedProgramMeta = useMemo(
    () => parseTrackerProgramMeta(program),
    [program],
  );

  const onSaveMembers = async () => {
    if (!program) return;
    setSavingMembers(true);
    try {
      const description = buildDescriptionWithMeta(
        parsedProgramMeta.cleanDescription,
        parsedProgramMeta.categories,
        members,
      );
      await editProgram(program.uuid, {
        title: program.title,
        description,
        programCategory: program.programCategory,
        startDate: program.startDate || null,
        endDate: program.endDate || null,
        image: program.image,
      });
      toast.success("Program startups updated");
      loadOverview();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save program startups");
    } finally {
      setSavingMembers(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="space-y-6 bg-[#eef2f8] px-6 py-6">
      <button
        type="button"
        onClick={() => navigate("/dashboard/trackerPrograms")}
        className="text-sm font-semibold text-[#163b8f]"
      >
        Back to tracker programs
      </button>

      <div className="rounded-2xl bg-[#11358b] px-5 py-4 text-white">
        <h1 className="text-2xl font-bold">
          {program?.title || "Tracker Program"}
        </h1>
        <p className="mt-1 text-sm text-white/80">
          {parsedProgramMeta.cleanDescription ||
            "No program description provided."}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {parsedProgramMeta.categories.map((category) => (
            <span
              key={category}
              className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold"
            >
              {category}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[#111827]">
              Program startups ({members.length})
            </h2>
            <p className="text-sm text-[#64748b]">
              View each startup, assign a BDA, and set the grant for this program.
            </p>
          </div>
          {members.length > 0 && (
            <button
              type="button"
              onClick={onSaveMembers}
              disabled={savingMembers}
              className="rounded-lg bg-[#163b8f] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {savingMembers ? "Saving..." : "Save changes"}
            </button>
          )}
        </div>

        {members.length === 0 ? (
          <div className="rounded-xl border border-dashed border-black/20 p-6 text-sm text-[#64748b]">
            No startups added to this program yet. Edit the program to select startups from the pool.
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member, index) => (
              <div
                key={member.entreprenuerUuid || index}
                className="rounded-xl border border-black/10 p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="truncate text-sm font-semibold text-[#111827]">{member.name}</p>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm font-medium text-[#334155]">
                      <input
                        type="checkbox"
                        checked={Boolean(member.disbursed)}
                        onChange={(e) => updateMember(index, "disbursed", e.target.checked)}
                      />
                      Disbursed
                    </label>
                    <button
                      type="button"
                      disabled={!member.businessUuid}
                      onClick={() =>
                        navigate(`/dashboard/enterprenuers/businessDetails/${member.businessUuid}`)
                      }
                      className="rounded-lg border border-[#b7c5e5] px-3 py-2 text-sm font-semibold text-[#163b8f] disabled:opacity-50"
                    >
                      View profile
                    </button>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#64748b]">Grant (TZS)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Grant"
                      className="w-full rounded-lg border border-[#b7c5e5] px-3 py-2 text-sm"
                      value={member.grantUsd || ""}
                      onChange={(e) => updateMember(index, "grantUsd", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#64748b]">Utilized / accounted (TZS)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Utilized"
                      className="w-full rounded-lg border border-[#b7c5e5] px-3 py-2 text-sm"
                      value={member.utilized || ""}
                      onChange={(e) => updateMember(index, "utilized", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#64748b]">Assigned BDA</label>
                    <select
                      className="w-full rounded-lg border border-[#b7c5e5] px-3 py-2 text-sm"
                      value={member.bdaUuid || ""}
                      onChange={(e) => onSetMemberBda(index, e.target.value)}
                    >
                      <option value="">Assign BDA</option>
                      {bdaList.map((bda) => (
                        <option key={bda.uuid} value={bda.uuid}>
                          {bda.name || bda.email || "Unnamed advisor"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-2xl border border-black/10 bg-white p-4 lg:grid-cols-4">
        <div>
          <div className="text-xs text-[#64748b]">Enterprises</div>
          <div className="text-2xl font-semibold text-[#0f172a]">
            {summary.enterprisesCount}
          </div>
        </div>
        <div>
          <div className="text-xs text-[#64748b]">Sessions</div>
          <div className="text-2xl font-semibold text-[#0f172a]">
            {summary.sessionsCount}
          </div>
        </div>
        <div>
          <div className="text-xs text-[#64748b]">Milestones</div>
          <div className="text-2xl font-semibold text-[#0f172a]">
            {summary.milestonesCount}
          </div>
        </div>
        <div>
          <div className="text-xs text-[#64748b]">Mentorship hrs</div>
          <div className="text-2xl font-semibold text-[#0f172a]">
            {Number(summary.mentorshipHours || 0).toFixed(1)}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-4">
        <h2 className="mb-4 text-lg font-semibold text-[#111827]">
          Enterprises under this program ({enterprises.length})
        </h2>

        {enterprises.length === 0 ? (
          <div className="rounded-xl border border-dashed border-black/20 p-6 text-sm text-black/60">
            No enterprises are currently linked to this program.
          </div>
        ) : (
          <div className="space-y-3">
            {enterprises.map((item) => {
              const enterprise = item.enterprise || {};
              const isExpanded = expandedEnterpriseUuid === enterprise.uuid;

              return (
                <div
                  key={enterprise.uuid}
                  className="rounded-xl border border-black/10 p-4"
                >
                  <button
                    type="button"
                    className="flex w-full flex-wrap items-start justify-between gap-3 text-left"
                    onClick={() =>
                      setExpandedEnterpriseUuid((prev) =>
                        prev === enterprise.uuid ? null : enterprise.uuid,
                      )
                    }
                  >
                    <div>
                      <h3 className="text-xl font-semibold text-[#111827]">
                        {enterprise.name || "Enterprise"}
                      </h3>
                      <p className="text-sm text-[#475569]">
                        Mentor: {enterprise.Mentor?.name || "N/A"} |
                        Entrepreneur: {enterprise.Entreprenuer?.name || "N/A"}
                      </p>
                    </div>
                    <div className="text-right text-sm text-[#475569]">
                      <div>Grant: {formatCurrency(enterprise.grantUsd)}</div>
                      <div>Category: {enterprise.category || "N/A"}</div>
                    </div>
                  </button>

                  <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-[#f8fafc] p-3 text-sm md:grid-cols-4 xl:grid-cols-8">
                    <div>
                      <div className="text-xs text-[#64748b]">Revenue</div>
                      <div className="font-semibold">
                        {formatCurrency(enterprise.monthlyRevenue)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-[#64748b]">Employees</div>
                      <div className="font-semibold">
                        {Number(enterprise.employees || 0)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-[#64748b]">Waste</div>
                      <div className="font-semibold">
                        {Number(enterprise.wasteDiverted || 0)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-[#64748b]">CE score</div>
                      <div className="font-semibold">
                        {enterprise.ceReadinessScore === null ||
                        enterprise.ceReadinessScore === undefined
                          ? "-"
                          : Number(enterprise.ceReadinessScore)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-[#64748b]">Capital</div>
                      <div className="font-semibold">
                        {formatCurrency(enterprise.capitalMobilised)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-[#64748b]">Sessions</div>
                      <div className="font-semibold">
                        {item.stats?.sessionsCount || 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-[#64748b]">Milestones</div>
                      <div className="font-semibold">
                        {item.stats?.milestonesCount || 0} (
                        {item.stats?.milestonesProgress || 0}%)
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-2">
                      <div className="rounded-xl border border-black/10 p-3">
                        <h4 className="mb-2 text-sm font-semibold text-[#111827]">
                          Milestones ({item.milestones?.length || 0})
                        </h4>
                        <div className="max-h-64 space-y-2 overflow-auto text-sm text-[#475569]">
                          {(item.milestones || []).length === 0 && (
                            <div>No milestones yet.</div>
                          )}
                          {(item.milestones || []).map((milestone) => (
                            <div
                              key={milestone.uuid}
                              className="rounded-lg bg-[#f8fafc] p-2"
                            >
                              <div className="font-medium text-[#111827]">
                                {milestone.title}
                              </div>
                              <div>
                                {String(milestone.status || "").replaceAll(
                                  "_",
                                  " ",
                                )}{" "}
                                | Due {formatDateDisplay(milestone.dueDate)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-xl border border-black/10 p-3">
                        <h4 className="mb-2 text-sm font-semibold text-[#111827]">
                          Sessions ({item.sessions?.length || 0})
                        </h4>
                        <div className="max-h-64 space-y-2 overflow-auto text-sm text-[#475569]">
                          {(item.sessions || []).length === 0 && (
                            <div>No sessions yet.</div>
                          )}
                          {(item.sessions || []).map((session) => (
                            <div
                              key={session.uuid}
                              className="rounded-lg bg-[#f8fafc] p-2"
                            >
                              <div className="font-medium text-[#111827]">
                                {formatDateDisplay(session.sessionDate)}
                              </div>
                              <div>{session.sessionType || "Session"}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackerProgramDetails;
