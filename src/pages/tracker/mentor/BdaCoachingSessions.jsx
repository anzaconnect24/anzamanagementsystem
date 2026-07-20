import { useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CalendarDays } from "lucide-react";
import Loader from "@/components/common/Loader";
import { UserContext } from "@/layouts/DashboardLayout";
import { getStaffAssignedEntreprenuers } from "@/controllers/staffEntreprenuerController";
import {
  createCoachingSession,
  getEntrepreneurCoachingSessions,
} from "@/controllers/coaching_session_controller";

const HERO_IMAGE_URL = "/images/mentor_hero.svg";

const FLAG_OPTIONS = [
  { value: "green", label: "Green - on track" },
  { value: "amber", label: "Amber - at risk" },
  { value: "red", label: "Red - critical" },
];

const EMPTY_SESSION = {
  sessionDate: "",
  facilitator: "",
  sessionType: "Weekly coaching",
  issuesDiscussed: "",
  recommendationsGiven: "",
  actionsAgreed: "",
  nextSessionDate: "",
  flag: "green",
};

const baseInputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#082d77] focus:ring-4 focus:ring-[#082d77]/20 disabled:bg-slate-50 disabled:text-slate-400";

const formatDateDisplay = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getFlagLabel = (flag) => {
  if (flag === "green") return "On track";
  if (flag === "amber") return "At risk";
  if (flag === "red") return "Critical";
  return "N/A";
};

const FieldLabel = ({ children }) => (
  <label className="mb-1.5 block text-xs font-bold tracking-wide text-slate-500">
    {children}
  </label>
);

const PortalCard = ({
  icon,
  title,
  subtitle,
  action,
  children,
  className = "",
}) => (
  <section
    className={`rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/70 ${className}`}
  >
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-6 py-5">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#082d77]/5 text-[#082d77]">
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-lg font-black tracking-tight text-slate-950">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p>
          )}
        </div>
      </div>
      {action}
    </div>
    <div className="p-6">{children}</div>
  </section>
);

const modalOverlayClass =
  "fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm";
const modalCardClass =
  "max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl shadow-slate-950/20";

const BdaCoachingSessions = () => {
  const { userDetails } = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const [enterprises, setEnterprises] = useState([]);
  const [selectedUuid, setSelectedUuid] = useState("");
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sessionForm, setSessionForm] = useState(EMPTY_SESSION);

  const setField = (key, value) =>
    setSessionForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (!userDetails?.uuid) {
      setLoading(false);
      return;
    }

    // Load only entrepreneurs assigned to this BDA/Staff.
    getStaffAssignedEntreprenuers(userDetails.uuid)
      .then((body) => {
        const list = Array.isArray(body) ? body : [];
        setEnterprises(
          list
            .filter((assignment) => Boolean(assignment?.Entreprenuer?.uuid))
            .map((assignment) => ({
              uuid: assignment.Entreprenuer.uuid,
              name:
                assignment.Entreprenuer.Business?.name ||
                assignment.Entreprenuer.name ||
                "Unnamed startup",
            })),
        );
      })
      .catch(() => toast.error("Failed to load assigned entrepreneurs"))
      .finally(() => setLoading(false));
  }, [userDetails?.uuid]);

  const loadSessions = async (uuid) => {
    if (!uuid) {
      setSessions([]);
      return;
    }
    setLoadingSessions(true);
    try {
      const data = await getEntrepreneurCoachingSessions(uuid);
      setSessions(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to load coaching sessions",
      );
    } finally {
      setLoadingSessions(false);
    }
  };

  const onSelectEnterprise = (uuid) => {
    setSelectedUuid(uuid);
    loadSessions(uuid);
  };

  const onSubmitSession = async (e) => {
    e.preventDefault();
    if (!selectedUuid) {
      toast.error("Select an entrepreneur first");
      return;
    }
    setIsSaving(true);
    try {
      await createCoachingSession({
        entreprenuer_uuid: selectedUuid,
        ...sessionForm,
      });
      toast.success("Coaching session saved");
      setShowModal(false);
      setSessionForm(EMPTY_SESSION);
      loadSessions(selectedUuid);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to save coaching session",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <Loader />;

  const selectedEnterprise = enterprises.find(
    (item) => item.uuid === selectedUuid,
  );

  return (
    <div className="min-h-screen bg-[#f3f6fb] px-4 py-6 text-slate-950 md:px-8 xl:px-12">
      <main className="mx-auto max-w-[1480px] space-y-8">
        <section
          className="relative overflow-hidden rounded-2xl bg-slate-950 px-7 py-6 text-white shadow-sm shadow-slate-300/70 md:px-10 md:py-7"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.6) 50%, rgba(0, 0, 0, 0.2) 100%), url(${HERO_IMAGE_URL})`,
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        >
          <div className="relative z-10 min-h-[160px]">
            <div className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-bold text-white shadow-sm backdrop-blur">
              <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
              Coaching Sessions
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
              Coaching Sessions
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/85 md:text-base">
              Log and review coaching sessions for the entrepreneurs assigned to
              you.
            </p>
          </div>
        </section>

        <PortalCard
          icon={<CalendarDays className="h-5 w-5" />}
          title="Coaching Sessions"
          subtitle="Select an entrepreneur to log and review their coaching sessions."
          action={
            <button
              type="button"
              disabled={!selectedUuid}
              onClick={() => {
                setSessionForm(EMPTY_SESSION);
                setShowModal(true);
              }}
              className="rounded-xl border border-[#082d77]/20 bg-[#082d77]/5 px-4 py-2.5 text-sm font-bold text-[#082d77] transition hover:bg-[#082d77]/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              + Coaching Session
            </button>
          }
        >
          <div className="mb-5 max-w-md">
            <FieldLabel>Entrepreneur</FieldLabel>
            <select
              className={baseInputClass}
              value={selectedUuid}
              onChange={(e) => onSelectEnterprise(e.target.value)}
            >
              <option value="">Select an entrepreneur</option>
              {enterprises.map((item) => (
                <option key={item.uuid} value={item.uuid}>
                  {item.name || "Unnamed startup"}
                </option>
              ))}
            </select>
          </div>

          {!selectedUuid ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
              Select an entrepreneur to view their coaching sessions.
            </div>
          ) : loadingSessions ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
              Loading sessions...
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                  No coaching sessions logged yet for{" "}
                  {selectedEnterprise?.name || "this entrepreneur"}.
                </div>
              )}

              {sessions.map((item) => (
                <div
                  key={item.uuid}
                  className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-slate-950">
                        {formatDateDisplay(item.sessionDate)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.sessionType || "Coaching session"}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-slate-700">
                      {getFlagLabel(item.flag)}
                    </span>
                  </div>
                  <div className="mt-4 space-y-1 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                    <p>
                      <span className="font-bold text-slate-950">
                        Facilitator:
                      </span>{" "}
                      {item.facilitator || "N/A"}
                    </p>
                    <p>
                      <span className="font-bold text-slate-950">
                        Issues discussed:
                      </span>{" "}
                      {item.issuesDiscussed || "N/A"}
                    </p>
                    <p>
                      <span className="font-bold text-slate-950">
                        Recommendations:
                      </span>{" "}
                      {item.recommendationsGiven || "N/A"}
                    </p>
                    <p>
                      <span className="font-bold text-slate-950">
                        Actions agreed:
                      </span>{" "}
                      {item.actionsAgreed || "N/A"}
                    </p>
                    <p>
                      <span className="font-bold text-slate-950">
                        Next session:
                      </span>{" "}
                      {item.nextSessionDate
                        ? formatDateDisplay(item.nextSessionDate)
                        : "N/A"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </PortalCard>
      </main>

      {showModal && (
        <div className={modalOverlayClass}>
          <form onSubmit={onSubmitSession} className={modalCardClass}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
              <div>
                <h3 className="text-2xl font-black text-slate-950">
                  Log a coaching session
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  For {selectedEnterprise?.name || "the selected entrepreneur"}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
              <div>
                <FieldLabel>Session date</FieldLabel>
                <input
                  className={baseInputClass}
                  type="date"
                  value={sessionForm.sessionDate}
                  onChange={(e) => setField("sessionDate", e.target.value)}
                  required
                />
              </div>
              <div>
                <FieldLabel>BDA / Facilitator</FieldLabel>
                <input
                  className={baseInputClass}
                  placeholder="BDA / Facilitator"
                  value={sessionForm.facilitator}
                  onChange={(e) => setField("facilitator", e.target.value)}
                />
              </div>
              <div>
                <FieldLabel>Session type</FieldLabel>
                <select
                  className={baseInputClass}
                  value={sessionForm.sessionType}
                  onChange={(e) => setField("sessionType", e.target.value)}
                >
                  <option value="Weekly coaching">Weekly coaching</option>
                  <option value="Financial advisory">Financial advisory</option>
                  <option value="Milestone review">Milestone review</option>
                </select>
              </div>
              <div>
                <FieldLabel>Session status</FieldLabel>
                <select
                  className={baseInputClass}
                  value={sessionForm.flag}
                  onChange={(e) => setField("flag", e.target.value)}
                >
                  {FLAG_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <FieldLabel>Issues discussed</FieldLabel>
                <textarea
                  className={`${baseInputClass} min-h-[90px]`}
                  placeholder="Issues discussed"
                  value={sessionForm.issuesDiscussed}
                  onChange={(e) => setField("issuesDiscussed", e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <FieldLabel>Recommendations given</FieldLabel>
                <textarea
                  className={`${baseInputClass} min-h-[90px]`}
                  placeholder="Recommendations given"
                  value={sessionForm.recommendationsGiven}
                  onChange={(e) =>
                    setField("recommendationsGiven", e.target.value)
                  }
                />
              </div>
              <div className="md:col-span-2">
                <FieldLabel>Actions agreed</FieldLabel>
                <textarea
                  className={`${baseInputClass} min-h-[90px]`}
                  placeholder="Actions agreed"
                  value={sessionForm.actionsAgreed}
                  onChange={(e) => setField("actionsAgreed", e.target.value)}
                />
              </div>
              <div>
                <FieldLabel>Next session date</FieldLabel>
                <input
                  className={baseInputClass}
                  type="date"
                  value={sessionForm.nextSessionDate}
                  onChange={(e) => setField("nextSessionDate", e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-5">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={isSaving}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-xl bg-[#082d77] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#061f54] disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save coaching session"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default BdaCoachingSessions;
