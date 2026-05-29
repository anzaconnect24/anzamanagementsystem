import { useMemo, useEffect, useState } from "react";
import toast from "react-hot-toast";
import Loader from "@/components/common/Loader";
import {
  createTrackerMilestone,
  getEntrepreneurTrackerDashboard,
  submitTrackerMilestone,
} from "@/controllers/trackerController";
import { uploadFile } from "@/controllers/file_upload_controller";

const TRACKER_CATEGORIES_MARKER = "__TRACKER_CATEGORIES__:";

const formatDateDisplay = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-GB");
};

const formatStatusLabel = (value) =>
  String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const parseSubmissionAttachments = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
};

const formatCurrency = (value) => {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) {
    return "$0";
  }
  return `$${amount.toLocaleString()}`;
};

const getMilestoneStatusClass = (status) => {
  if (status === "completed") return "bg-[#e1f0d8] text-[#2d6e1f]";
  if (status === "submitted" || status === "in_progress") {
    return "bg-[#dbe8ff] text-[#163b8f]";
  }
  if (status === "overdue" || status === "rejected") {
    return "bg-[#fde0e0] text-[#a11111]";
  }
  return "bg-[#eef2f8] text-[#475569]";
};

const getFlagClass = (flag) => {
  if (flag === "green") return "bg-[#e1f0d8] text-[#2d6e1f]";
  if (flag === "amber") return "bg-[#fdf1ce] text-[#8a6500]";
  return "bg-[#fde0e0] text-[#a11111]";
};

const getProgramDescription = (program) => {
  const description = String(program?.description || "");
  const markerIndex = description.lastIndexOf(TRACKER_CATEGORIES_MARKER);
  if (markerIndex === -1) {
    return description;
  }
  return description.slice(0, markerIndex).trim();
};

const TABS = [
  { id: "milestones", label: "Milestones" },
  { id: "logs", label: "Logs" },
  { id: "kpis", label: "KPIs" },
  { id: "tranches", label: "Tranches" },
];

const EntrepreneurMilestones = () => {
  const [loading, setLoading] = useState(true);
  const [isCreatingMilestone, setIsCreatingMilestone] = useState(false);
  const [activeTab, setActiveTab] = useState("milestones");
  const [dashboard, setDashboard] = useState(null);
  const [selectedEnterpriseUuid, setSelectedEnterpriseUuid] = useState("");
  const [milestones, setMilestones] = useState([]);
  const [weeklyLogs, setWeeklyLogs] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [trancheStages, setTrancheStages] = useState([]);
  const [notesById, setNotesById] = useState({});
  const [filesById, setFilesById] = useState({});
  const [submittingById, setSubmittingById] = useState({});
  const [milestoneForm, setMilestoneForm] = useState({
    title: "",
    dueDate: "",
    linkedTranche: "",
    description: "",
  });

  const loadDashboard = async (enterpriseUuid) => {
    setLoading(true);
    try {
      const data = await getEntrepreneurTrackerDashboard({
        enterpriseUuid: enterpriseUuid || undefined,
      });
      setDashboard(data || null);
      setMilestones(Array.isArray(data?.milestones) ? data.milestones : []);
      setWeeklyLogs(Array.isArray(data?.weeklyLogs) ? data.weeklyLogs : []);
      setSessions(Array.isArray(data?.sessions) ? data.sessions : []);
      setTrancheStages(
        Array.isArray(data?.trancheStages) ? data.trancheStages : [],
      );

      if (!selectedEnterpriseUuid && data?.selectedEnterpriseUuid) {
        setSelectedEnterpriseUuid(data.selectedEnterpriseUuid);
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to load tracker dashboard",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard(selectedEnterpriseUuid);
  }, [selectedEnterpriseUuid]);

  const onSubmitMilestone = async (uuid) => {
    const targetMilestone = milestones.find((item) => item.uuid === uuid);

    if (targetMilestone?.status === "completed") {
      toast.error("Completed milestones do not need report submission");
      return;
    }

    if (!String(notesById[uuid] || "").trim()) {
      toast.error("Please add a report before submitting for mentor review");
      return;
    }

    setSubmittingById((prev) => ({ ...prev, [uuid]: true }));

    try {
      const selectedFiles = Array.from(filesById[uuid] || []);
      const uploadedAttachmentUrls = [];

      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("file", file);
        const fileUrl = await uploadFile(formData);
        if (typeof fileUrl === "string" && fileUrl.trim()) {
          uploadedAttachmentUrls.push(fileUrl.trim());
        }
      }

      await submitTrackerMilestone(uuid, {
        submissionNotes: notesById[uuid] || "",
        submissionAttachments: uploadedAttachmentUrls,
      });
      toast.success("Report submitted for mentor review");
      setFilesById((prev) => ({ ...prev, [uuid]: [] }));
      loadDashboard(selectedEnterpriseUuid);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to submit milestone",
      );
    } finally {
      setSubmittingById((prev) => ({ ...prev, [uuid]: false }));
    }
  };

  const onCreateMilestone = async (e) => {
    e.preventDefault();

    if (!milestoneForm.title.trim()) {
      toast.error("Milestone title is required");
      return;
    }

    setIsCreatingMilestone(true);
    try {
      await createTrackerMilestone({
        title: milestoneForm.title.trim(),
        dueDate: milestoneForm.dueDate || null,
        linkedTranche: milestoneForm.linkedTranche.trim() || null,
        description: milestoneForm.description.trim() || null,
      });

      setMilestoneForm({
        title: "",
        dueDate: "",
        linkedTranche: "",
        description: "",
      });
      toast.success("Milestone created and sent to mentor workflow");
      loadDashboard(selectedEnterpriseUuid);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to create milestone",
      );
    } finally {
      setIsCreatingMilestone(false);
    }
  };

  const enterprise = dashboard?.enterprise || {};
  const program = dashboard?.program || enterprise?.Program || null;
  const availableEnterprises = Array.isArray(dashboard?.availableEnterprises)
    ? dashboard.availableEnterprises
    : [];
  const stats = dashboard?.stats || {
    sessionsCount: 0,
    weeklyLogsCount: 0,
    milestonesCount: 0,
    milestonesProgress: 0,
    mentorshipHours: 0,
  };

  const programDescription =
    getProgramDescription(program) || "No program description available.";

  const completedTranches = useMemo(() => {
    if (!Array.isArray(trancheStages) || trancheStages.length === 0) {
      return 0;
    }

    const completedTrancheNames = new Set(
      milestones
        .filter((item) => item.status === "completed" && item.linkedTranche)
        .map((item) => item.linkedTranche),
    );

    return trancheStages.filter((item) => completedTrancheNames.has(item.title))
      .length;
  }, [milestones, trancheStages]);

  const trancheProgress = trancheStages.length
    ? Math.round((completedTranches / trancheStages.length) * 100)
    : stats.milestonesProgress || 0;

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="space-y-5 bg-[#eef2f8] px-6 py-6">
      <div className="rounded-2xl border border-[#cad5ea] bg-white p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {availableEnterprises.length > 1 && (
              <div className="mb-3 w-full max-w-sm">
                <label className="mb-1 block text-xs font-semibold text-[#64748b]">
                  Switch Program / Enterprise
                </label>
                <select
                  className="w-full rounded-lg border border-[#b7c5e5] px-3 py-2 text-sm"
                  value={selectedEnterpriseUuid || enterprise?.uuid || ""}
                  onChange={(e) => setSelectedEnterpriseUuid(e.target.value)}
                >
                  {availableEnterprises.map((item) => (
                    <option key={item.uuid} value={item.uuid}>
                      {item.programTitle} - {item.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <h1 className="text-3xl font-semibold text-[#111827]">
              {program?.title || "My Program Tracker"}
            </h1>
            <p className="mt-1 text-sm text-[#475569]">{programDescription}</p>
            <p className="mt-2 text-xs text-[#64748b]">
              Enterprise: {enterprise?.name || "N/A"} | Mentor:{" "}
              {enterprise?.Mentor?.name || "N/A"}
            </p>
          </div>

          <div className="min-w-[220px] rounded-xl bg-[#f8fafc] p-3">
            <div className="text-xs font-semibold text-[#334155]">
              Program progress
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[#dbe5f4]">
              <div
                className="h-full rounded-full bg-[#163b8f]"
                style={{
                  width: `${Math.min(100, Math.max(0, trancheProgress))}%`,
                }}
              />
            </div>
            <div className="mt-2 text-sm font-semibold text-[#163b8f]">
              {trancheProgress}% complete
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
          <div className="rounded-xl bg-[#eef2f8] p-3">
            <div className="text-xs text-[#64748b]">Revenue / month</div>
            <div className="text-xl font-semibold text-[#111827]">
              {formatCurrency(enterprise?.monthlyRevenue)}
            </div>
          </div>
          <div className="rounded-xl bg-[#eef2f8] p-3">
            <div className="text-xs text-[#64748b]">Employees</div>
            <div className="text-xl font-semibold text-[#111827]">
              {Number(enterprise?.employees || 0)}
            </div>
          </div>
          <div className="rounded-xl bg-[#eef2f8] p-3">
            <div className="text-xs text-[#64748b]">Milestones</div>
            <div className="text-xl font-semibold text-[#111827]">
              {stats.milestonesCount || 0}
            </div>
          </div>
          <div className="rounded-xl bg-[#eef2f8] p-3">
            <div className="text-xs text-[#64748b]">Sessions</div>
            <div className="text-xl font-semibold text-[#111827]">
              {stats.sessionsCount || 0}
            </div>
          </div>
          <div className="rounded-xl bg-[#eef2f8] p-3">
            <div className="text-xs text-[#64748b]">Weekly logs</div>
            <div className="text-xl font-semibold text-[#111827]">
              {stats.weeklyLogsCount || 0}
            </div>
          </div>
          <div className="rounded-xl bg-[#eef2f8] p-3">
            <div className="text-xs text-[#64748b]">Mentorship hrs</div>
            <div className="text-xl font-semibold text-[#111827]">
              {Number(stats.mentorshipHours || 0).toFixed(1)}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#cad5ea] bg-white p-5">
        <div className="mb-4 border-b border-[#d4dbe8]">
          <div className="flex flex-wrap gap-4">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`border-b-2 pb-2 text-sm font-medium ${
                  activeTab === tab.id
                    ? "border-[#163b8f] text-[#163b8f]"
                    : "border-transparent text-[#475569]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "milestones" && (
          <div className="space-y-4">
            <form
              onSubmit={onCreateMilestone}
              className="rounded-xl border border-black/10 p-4"
            >
              <h2 className="mb-3 text-lg font-semibold text-[#111827]">
                Add milestone
              </h2>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <input
                  className="rounded-md border border-black/10 p-2 text-sm"
                  placeholder="Milestone title"
                  value={milestoneForm.title}
                  onChange={(e) =>
                    setMilestoneForm((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  required
                />

                <input
                  className="rounded-md border border-black/10 p-2 text-sm"
                  type="date"
                  value={milestoneForm.dueDate}
                  onChange={(e) =>
                    setMilestoneForm((prev) => ({
                      ...prev,
                      dueDate: e.target.value,
                    }))
                  }
                />

                <select
                  className="rounded-md border border-black/10 p-2 text-sm"
                  value={milestoneForm.linkedTranche}
                  onChange={(e) =>
                    setMilestoneForm((prev) => ({
                      ...prev,
                      linkedTranche: e.target.value,
                    }))
                  }
                >
                  <option value="">Target tranche stage (optional)</option>
                  {trancheStages.map((item, index) => (
                    <option key={`${item.title}-${index}`} value={item.title}>
                      {item.title}
                    </option>
                  ))}
                </select>

                <textarea
                  className="md:col-span-2 min-h-[88px] rounded-md border border-black/10 p-2 text-sm"
                  placeholder="Milestone details"
                  value={milestoneForm.description}
                  onChange={(e) =>
                    setMilestoneForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={isCreatingMilestone}
                  className="rounded-md bg-[#163b8f] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isCreatingMilestone ? "Saving..." : "Create milestone"}
                </button>
              </div>
            </form>

            <div className="space-y-3">
              {milestones.length === 0 && (
                <div className="rounded-lg border border-black/10 p-4 text-sm text-black/60">
                  No milestones yet.
                </div>
              )}

              {milestones.map((item) => (
                <div
                  key={item.uuid}
                  className="rounded-lg border border-black/10 p-4"
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold">{item.title}</h2>
                      <p className="text-xs text-black/60">
                        Mentor: {item?.Mentor?.name || "N/A"}
                      </p>
                      <p className="text-xs text-black/60">
                        Due: {formatDateDisplay(item?.dueDate)}
                      </p>
                      <p className="text-xs text-black/60">
                        Tranche stage: {item?.linkedTranche || "N/A"}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getMilestoneStatusClass(item.status)}`}
                    >
                      {formatStatusLabel(item.status)}
                    </span>
                  </div>

                  <p className="mb-3 text-sm text-black/70">
                    {item.description || "No description"}
                  </p>

                  {item.submissionNotes && (
                    <div className="mb-3 rounded-md bg-black/5 p-2 text-xs text-black/70">
                      <span className="font-semibold">Submitted report:</span>{" "}
                      {item.submissionNotes}
                    </div>
                  )}

                  {item.mentorReviewNotes && (
                    <div className="mb-3 rounded-md bg-black/5 p-2 text-xs text-black/70">
                      <span className="font-semibold">Mentor feedback:</span>{" "}
                      {item.mentorReviewNotes}
                    </div>
                  )}

                  {parseSubmissionAttachments(item.submissionAttachments)
                    .length > 0 && (
                    <div className="mb-3 rounded-md bg-black/5 p-2 text-xs text-black/70">
                      <span className="font-semibold">Attachments sent:</span>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {parseSubmissionAttachments(
                          item.submissionAttachments,
                        ).map((url, idx) => (
                          <a
                            key={`${item.uuid}-attachment-${idx}`}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded bg-[#dbe8ff] px-2 py-1 text-[#163b8f] underline"
                          >
                            Attachment {idx + 1}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {item.status !== "completed" &&
                    item.status !== "submitted" && (
                      <>
                        <div className="mb-2">
                          <label className="mb-1 block text-xs font-semibold text-[#475569]">
                            Upload attachment(s) for mentor
                          </label>
                          <input
                            type="file"
                            multiple
                            onChange={(e) =>
                              setFilesById((prev) => ({
                                ...prev,
                                [item.uuid]: Array.from(e.target.files || []),
                              }))
                            }
                            className="w-full rounded-md border border-black/10 p-2 text-sm"
                          />
                          {Array.isArray(filesById[item.uuid]) &&
                            filesById[item.uuid].length > 0 && (
                              <div className="mt-1 text-xs text-[#475569]">
                                {filesById[item.uuid].length} file(s) selected
                              </div>
                            )}
                        </div>

                        <textarea
                          className="w-full rounded-md border border-black/10 p-2 text-sm"
                          placeholder="Submit tranche-stage report for mentor review"
                          value={notesById[item.uuid] || ""}
                          onChange={(e) =>
                            setNotesById((prev) => ({
                              ...prev,
                              [item.uuid]: e.target.value,
                            }))
                          }
                        />

                        <div className="mt-3 flex justify-end">
                          <button
                            onClick={() => onSubmitMilestone(item.uuid)}
                            className="rounded-md bg-[#163b8f] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                            disabled={
                              item.status === "submitted" ||
                              item.status === "completed" ||
                              submittingById[item.uuid]
                            }
                          >
                            {submittingById[item.uuid]
                              ? "Submitting..."
                              : "Submit report"}
                          </button>
                        </div>
                      </>
                    )}

                  {item.status === "submitted" && (
                    <div className="rounded-md bg-[#dbe8ff] p-2 text-xs font-semibold text-[#163b8f]">
                      Report already submitted. Waiting for mentor review.
                    </div>
                  )}

                  {item.status === "completed" && (
                    <div className="rounded-md bg-[#e1f0d8] p-2 text-xs font-semibold text-[#2d6e1f]">
                      Milestone completed. No further report submission needed.
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "logs" && (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="rounded-xl border border-black/10 p-4">
              <h3 className="mb-3 text-base font-semibold text-[#111827]">
                Sessions ({sessions.length})
              </h3>
              <div className="space-y-2">
                {sessions.length === 0 && (
                  <div className="text-sm text-black/60">
                    No sessions logged yet.
                  </div>
                )}
                {sessions.map((item) => (
                  <div
                    key={item.uuid}
                    className="rounded-lg bg-[#f8fafc] p-3 text-sm"
                  >
                    <div className="font-semibold text-[#111827]">
                      {formatDateDisplay(item.sessionDate)}
                    </div>
                    <div className="text-[#475569]">
                      {item.sessionType || "Session"}
                    </div>
                    <span
                      className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${getFlagClass(item.flag)}`}
                    >
                      {formatStatusLabel(item.flag)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-black/10 p-4">
              <h3 className="mb-3 text-base font-semibold text-[#111827]">
                Weekly Logs ({weeklyLogs.length})
              </h3>
              <div className="space-y-2">
                {weeklyLogs.length === 0 && (
                  <div className="text-sm text-black/60">
                    No weekly logs yet.
                  </div>
                )}
                {weeklyLogs.map((item) => (
                  <div
                    key={item.uuid}
                    className="rounded-lg bg-[#f8fafc] p-3 text-sm"
                  >
                    <div className="font-semibold text-[#111827]">
                      Week {formatDateDisplay(item.weekStart)}
                    </div>
                    <div className="text-[#475569]">
                      {Number(item.hours || 0)} hrs |{" "}
                      {Number(item.touchpoints || 0)} touchpoints
                    </div>
                    <span
                      className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${getFlagClass(item.flag)}`}
                    >
                      {formatStatusLabel(item.flag)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "kpis" && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-xl bg-[#eef2f8] p-4">
              <div className="text-xs text-[#64748b]">Monthly revenue</div>
              <div className="text-2xl font-semibold text-[#111827]">
                {formatCurrency(enterprise?.monthlyRevenue)}
              </div>
            </div>
            <div className="rounded-xl bg-[#eef2f8] p-4">
              <div className="text-xs text-[#64748b]">Employees</div>
              <div className="text-2xl font-semibold text-[#111827]">
                {Number(enterprise?.employees || 0)}
              </div>
            </div>
            <div className="rounded-xl bg-[#eef2f8] p-4">
              <div className="text-xs text-[#64748b]">Waste diverted</div>
              <div className="text-2xl font-semibold text-[#111827]">
                {Number(enterprise?.wasteDiverted || 0)} kg/mo
              </div>
            </div>
            <div className="rounded-xl bg-[#eef2f8] p-4">
              <div className="text-xs text-[#64748b]">CE readiness</div>
              <div className="text-2xl font-semibold text-[#111827]">
                {enterprise?.ceReadinessScore === null ||
                enterprise?.ceReadinessScore === undefined
                  ? "-"
                  : Number(enterprise.ceReadinessScore)}
              </div>
            </div>
            <div className="rounded-xl bg-[#eef2f8] p-4">
              <div className="text-xs text-[#64748b]">Capital mobilised</div>
              <div className="text-2xl font-semibold text-[#111827]">
                {formatCurrency(enterprise?.capitalMobilised)}
              </div>
            </div>
            <div className="rounded-xl bg-[#eef2f8] p-4">
              <div className="text-xs text-[#64748b]">Active customers</div>
              <div className="text-2xl font-semibold text-[#111827]">
                {Number(enterprise?.activeCustomers || 0)}
              </div>
            </div>
          </div>
        )}

        {activeTab === "tranches" && (
          <div className="space-y-3">
            {trancheStages.length === 0 && (
              <div className="rounded-xl border border-dashed border-black/20 p-6 text-sm text-black/60">
                No tranche stages have been set yet.
              </div>
            )}

            {trancheStages.map((item, index) => {
              const linkedMilestone = milestones.find(
                (milestone) => milestone.linkedTranche === item.title,
              );

              return (
                <div
                  key={`${item.title}-${index}`}
                  className="rounded-xl border border-black/10 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-[#111827]">
                        {item.title}
                      </h3>
                      <p className="text-sm text-[#475569]">
                        Target date: {formatDateDisplay(item.date)} | Amount:{" "}
                        {formatCurrency(item.amount)}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getMilestoneStatusClass(
                        linkedMilestone?.status || "pending",
                      )}`}
                    >
                      {formatStatusLabel(linkedMilestone?.status || "pending")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default EntrepreneurMilestones;
