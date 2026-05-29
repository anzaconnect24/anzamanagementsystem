import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import Loader from "@/components/common/Loader";
import { getTrackerProgramOverview } from "@/controllers/trackerController";

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
  const marker = "__TRACKER_CATEGORIES__:";
  const rawDescription = String(program?.description || "");
  const markerIndex = rawDescription.lastIndexOf(marker);

  if (markerIndex === -1) {
    return {
      cleanDescription: rawDescription,
      categories: [program?.programCategory].filter(Boolean),
    };
  }

  const cleanDescription = rawDescription.slice(0, markerIndex).trim();
  const rawCategories = rawDescription
    .slice(markerIndex + marker.length)
    .trim();

  let parsedCategories = [];
  try {
    const parsedValue = JSON.parse(rawCategories);
    if (Array.isArray(parsedValue)) {
      parsedCategories = parsedValue;
    }
  } catch (error) {
    parsedCategories = [];
  }

  return {
    cleanDescription,
    categories: Array.from(
      new Set(
        [...parsedCategories, program?.programCategory]
          .map((item) => String(item || "").trim())
          .filter(Boolean),
      ),
    ),
  };
};

const TrackerProgramDetails = () => {
  const navigate = useNavigate();
  const { programUuid } = useParams();

  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [expandedEnterpriseUuid, setExpandedEnterpriseUuid] = useState(null);

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

      <div className="grid grid-cols-2 gap-3 rounded-2xl border border-black/10 bg-white p-4 lg:grid-cols-5">
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
          <div className="text-xs text-[#64748b]">Weekly logs</div>
          <div className="text-2xl font-semibold text-[#0f172a]">
            {summary.weeklyLogsCount}
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
                      <div className="text-xs text-[#64748b]">Weekly logs</div>
                      <div className="font-semibold">
                        {item.stats?.weeklyLogsCount || 0}
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
                    <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-3">
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

                      <div className="rounded-xl border border-black/10 p-3">
                        <h4 className="mb-2 text-sm font-semibold text-[#111827]">
                          Weekly logs ({item.weeklyLogs?.length || 0})
                        </h4>
                        <div className="max-h-64 space-y-2 overflow-auto text-sm text-[#475569]">
                          {(item.weeklyLogs || []).length === 0 && (
                            <div>No weekly logs yet.</div>
                          )}
                          {(item.weeklyLogs || []).map((log) => (
                            <div
                              key={log.uuid}
                              className="rounded-lg bg-[#f8fafc] p-2"
                            >
                              <div className="font-medium text-[#111827]">
                                Week {formatDateDisplay(log.weekStart)}
                              </div>
                              <div>
                                {Number(log.hours || 0)} hrs |{" "}
                                {Number(log.touchpoints || 0)} touchpoints
                              </div>
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
