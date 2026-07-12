import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, MapPin, CalendarDays } from "lucide-react";
import toast from "react-hot-toast";
import Loader from "@/components/common/Loader";
import { UserContext } from "@/layouts/DashboardLayout";
import { getStaffAssignedEntreprenuers } from "@/controllers/staffEntreprenuerController";
import { getPrograms } from "@/controllers/program_controller";
import { getEnterprenuers } from "@/controllers/user_controller";
import {
  deleteMentorEnterprise,
  listMentorEnterprises,
  getStaffWeeklyLogs,
  listTrackerMilestones,
} from "@/controllers/trackerController";

const FLAG_LABEL_MAP = {
  green: "On track",
  amber: "At risk",
  red: "Critical",
};




const TRACKER_CATEGORIES_MARKER = "__TRACKER_CATEGORIES__:";
const TRACKER_STARTUPS_MARKER = "__TRACKER_STARTUPS__:";

// Startups (with their per-startup assigned BDA) selected into a grant
// program by the Finance Officer are stored as JSON in the program
// description markers.
const parseProgramStartups = (program) => {
  const text = String(program?.description || "");
  const idx = text.lastIndexOf(TRACKER_STARTUPS_MARKER);
  if (idx === -1) return [];
  const line = text
    .slice(idx + TRACKER_STARTUPS_MARKER.length)
    .split("\n")[0]
    .trim();
  try {
    const value = JSON.parse(line);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

const HERO_IMAGE_URL = "/images/mentor_hero.svg";

const EXCLUDED_PROGRAM_STAGE_LABELS = [
  "stage 1",
  "stage 2",
  "stage 3",
  "stage 4",
  "investment readiness",
  "business foundation accelerator",
  "ideation",
];

const getProgramDisplayName = (program) =>
  String(program?.title || program?.name || program?.programName || program?.programCategory || "").trim();

const isExcludedProgramStageLabel = (value) =>
  EXCLUDED_PROGRAM_STAGE_LABELS.includes(String(value || "").trim().toLowerCase());

const getEnterpriseProgramName = (enterprise) =>
  String(
    enterprise?.Program?.title ||
      enterprise?.program?.title ||
      enterprise?.programTitle ||
      enterprise?.programName ||
      enterprise?.category ||
      "",
  ).trim();


const formatHours = (value) => {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed.toFixed(1) : "0.0";
};

const formatMoney = (value, currency = "TZS") => {
  const parsed = Number(value || 0);
  if (!Number.isFinite(parsed)) return `${currency} 0`;
  return `${currency} ${parsed.toLocaleString()}`;
};


const getEnterpriseEntrepreneurUuid = (enterprise) =>
  enterprise?.Entreprenuer?.uuid || enterprise?.entreprenuer_uuid;

const getAssignedBusinessName = (assignment) => {
  const entrepreneur = assignment?.Entreprenuer;
  const directBusinessName = entrepreneur?.Business?.name || entrepreneur?.business?.name;
  if (directBusinessName) return directBusinessName;

  const businessList = Array.isArray(entrepreneur?.Businesses)
    ? entrepreneur.Businesses
    : Array.isArray(entrepreneur?.businesses)
      ? entrepreneur.businesses
      : [];

  const approvedBusiness = businessList.find(
    (item) => item?.status === "accepted" || item?.status === "approved",
  );

  return approvedBusiness?.name || businessList[0]?.name || entrepreneur?.name;
};

const normalizeCategories = (categories = []) => {
  return Array.from(
    new Set(
      categories
        .map((item) => String(item || "").trim())
        .filter((item) => item.length > 0),
    ),
  );
};

const getProgramCategories = (program) => {
  if (!program) return [];

  const rawDescription = String(program.description || "");
  const markerIndex = rawDescription.lastIndexOf(TRACKER_CATEGORIES_MARKER);

  if (markerIndex === -1) {
    return normalizeCategories([program.programCategory]);
  }

  const rawCategories = rawDescription
    .slice(markerIndex + TRACKER_CATEGORIES_MARKER.length)
    .trim();

  let parsedCategories = [];
  try {
    const parsedValue = JSON.parse(rawCategories);
    if (Array.isArray(parsedValue)) parsedCategories = parsedValue;
  } catch {
    parsedCategories = [];
  }

  return normalizeCategories([...parsedCategories, program.programCategory]);
};

const getInitials = (name = "") => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "--";
  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
};

const PortalCard = ({ icon, title, subtitle, action, children, className = "" }) => (
  <section className={`rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/70 ${className}`}>
    {(title || subtitle || action || icon) && (
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {icon && (
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#082d77]/5 text-[#082d77]">
              {icon}
            </div>
          )}
          <div>
            {title && <h2 className="text-lg font-black tracking-tight text-slate-950">{title}</h2>}
            {subtitle && <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
    )}
    <div className={title || subtitle || action || icon ? "mt-6" : ""}>{children}</div>
  </section>
);


const DataTile = ({ label, value, helper }) => (
  <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-200/70">
    <p className="text-xs font-bold tracking-wide text-slate-400">{label}</p>
    <p className="mt-1 text-base font-black text-slate-950">{value}</p>
    {helper && <p className="mt-1 text-xs text-slate-500">{helper}</p>}
  </div>
);

const MentorTracker = () => {
  const { userDetails } = useContext(UserContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [weeklyLogs, setWeeklyLogs] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [entrepreneurs, setEntrepreneurs] = useState([]);
  const [enterprises, setEnterprises] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [enterpriseFilter, setEnterpriseFilter] = useState("all");
  const [deletingEnterpriseUuid, setDeletingEnterpriseUuid] = useState(null);

  // Entrepreneur pool (each carries the signup profile image + business
  // detail) used to fill the program-assigned startup cards.
  const [entrepreneurPool, setEntrepreneurPool] = useState([]);

  // Entrepreneur uuid -> their signup user record (image, Business, etc.).
  const poolByUuid = useMemo(() => {
    const map = {};
    entrepreneurPool.forEach((user) => {
      if (user?.uuid) map[user.uuid] = user;
    });
    return map;
  }, [entrepreneurPool]);

  const assignedEntrepreneurOptions = useMemo(
    () =>
      entrepreneurs
        .filter((item) => Boolean(item?.Entreprenuer?.uuid))
        .map((item) => ({
          uuid: item.Entreprenuer.uuid,
          name: getAssignedBusinessName(item),
          entrepreneurName: item.Entreprenuer.name,
          email: item.Entreprenuer.email,
        })),
    [entrepreneurs],
  );

  const programOptions = useMemo(
    () =>
      programs
        .map((program) => ({
          uuid: program.uuid,
          name: getProgramDisplayName(program),
        }))
        .filter((program) => Boolean(program.uuid && program.name && !isExcludedProgramStageLabel(program.name))),
    [programs],
  );

  const filterCategories = useMemo(() => {
    return Array.from(
      new Set(
        enterprises
          .map((item) => getEnterpriseProgramName(item))
          .filter((value) => Boolean(value && value.trim() && !isExcludedProgramStageLabel(value))),
      ),
    );
  }, [enterprises]);

  const filteredEnterprises = useMemo(() => {
    return enterprises.filter((item) => {
      const programName = getEnterpriseProgramName(item);
      return enterpriseFilter === "all" || programName === enterpriseFilter;
    });
  }, [enterprises, enterpriseFilter]);

  // Map entrepreneur uuid -> their registration profile (image, email, business).
  const entrepreneurByUuid = useMemo(() => {
    const map = {};
    entrepreneurs.forEach((assignment) => {
      const ent = assignment?.Entreprenuer;
      if (ent?.uuid) map[ent.uuid] = ent;
    });
    return map;
  }, [entrepreneurs]);

  // Startups this BDA was assigned to inside Finance grant programs, derived
  // directly from the program markers (so they appear as soon as the Finance
  // Officer saves the program — independent of the assignment table).
  const programAssignedStartups = useMemo(() => {
    const bdaUuid = String(userDetails?.uuid || "").trim();
    if (!bdaUuid) return [];
    const result = [];
    programs.forEach((program) => {
      parseProgramStartups(program).forEach((member) => {
        if (
          member?.entreprenuerUuid &&
          String(member?.bdaUuid || "").trim() === bdaUuid
        ) {
          result.push(member);
        }
      });
    });
    return result;
  }, [programs, userDetails?.uuid]);

  // The people shown are the entrepreneurs assigned to this BDA. Each is paired
  // with their tracker enterprise once one has been set up (registered).
  const trackedList = useMemo(() => {
    const enterpriseByEnt = new Map();
    enterprises.forEach((enterprise) => {
      const uuid = getEnterpriseEntrepreneurUuid(enterprise);
      if (uuid && !enterpriseByEnt.has(uuid)) enterpriseByEnt.set(uuid, enterprise);
    });

    const rows = [];
    const seen = new Set();

    entrepreneurs.forEach((assignment) => {
      const ent = assignment?.Entreprenuer;
      if (!ent?.uuid || seen.has(ent.uuid)) return;
      seen.add(ent.uuid);
      rows.push({ key: ent.uuid, entrepreneur: ent, enterprise: enterpriseByEnt.get(ent.uuid) || null });
    });

    // Include any registered enterprise whose entrepreneur isn't in the assigned list.
    enterprises.forEach((enterprise) => {
      const uuid = getEnterpriseEntrepreneurUuid(enterprise);
      if (uuid && seen.has(uuid)) return;
      if (uuid) seen.add(uuid);
      rows.push({
        key: enterprise.uuid || uuid || enterprise.id,
        entrepreneur: enterprise.Entreprenuer || enterprise.entreprenuer || null,
        enterprise,
      });
    });

    // Include startups assigned to this BDA via a grant program (markers).
    // Their KYC opens read-only using the entrepreneur + business uuids, and
    // the card fields (signup picture, sector, region, join date) come from
    // the entrepreneur's signup record in the pool.
    programAssignedStartups.forEach((member) => {
      const uuid = member.entreprenuerUuid;
      if (!uuid || seen.has(uuid)) return;
      seen.add(uuid);
      const poolUser = poolByUuid[uuid];
      const business = poolUser?.Business || poolUser?.business || null;
      rows.push({
        key: uuid,
        entrepreneur: {
          uuid,
          name: business?.name || poolUser?.name || member.name,
          image: poolUser?.image,
          createdAt: poolUser?.createdAt,
          Business:
            business ||
            (member.businessUuid
              ? { uuid: member.businessUuid, name: member.name }
              : undefined),
        },
        enterprise: enterpriseByEnt.get(uuid) || null,
      });
    });

    return rows;
  }, [entrepreneurs, enterprises, programAssignedStartups, poolByUuid]);

  const filteredTracked = useMemo(() => {
    return trackedList.filter((row) => {
      if (enterpriseFilter === "all") return true;
      const programName = row.enterprise ? getEnterpriseProgramName(row.enterprise) : "";
      return programName === enterpriseFilter;
    });
  }, [trackedList, enterpriseFilter]);


  const portfolioStats = useMemo(() => {
    const all = enterprises.length;
    const onTrack = enterprises.filter((e) => e.flag === "green").length;
    const atRisk = enterprises.filter((e) => e.flag === "amber").length;
    const critical = enterprises.filter((e) => e.flag === "red").length;
    const mentorshipHours = weeklyLogs.reduce((sum, log) => sum + Number(log.hours || 0), 0);
    const totalGrant = enterprises.reduce((sum, item) => sum + Number(item.grantUsd || 0), 0);

    return {
      all,
      onTrack,
      atRisk,
      critical,
      mentorshipHours,
      totalGrant,
      milestones: milestones.length,
    };
  }, [enterprises, weeklyLogs, milestones]);

  const loadData = async () => {
    setLoading(true);
    try {
      // One failing endpoint (e.g. a BDA-only route that isn't deployed yet)
      // must not blank the whole portfolio — program-assigned startups only
      // need getPrograms + getEnterprenuers, which are always available.
      const [wlR, msR, entsR, enterpriseR, programsR, poolR] =
        await Promise.allSettled([
          getStaffWeeklyLogs(),
          listTrackerMilestones(),
          getStaffAssignedEntreprenuers(userDetails.uuid),
          listMentorEnterprises(),
          getPrograms(1, 500),
          getEnterprenuers(1000, 1, " "),
        ]);

      const valueOf = (result, fallback) =>
        result.status === "fulfilled" ? result.value : fallback;

      const wl = valueOf(wlR, null);
      const ms = valueOf(msR, []);
      const ents = valueOf(entsR, []);
      const enterpriseList = valueOf(enterpriseR, []);
      const programsResponse = valueOf(programsR, null);
      const poolResponse = valueOf(poolR, null);

      setWeeklyLogs(wl?.weeklyLogs || []);
      setMilestones(Array.isArray(ms) ? ms : []);
      setEntrepreneurs(Array.isArray(ents) ? ents : []);
      setEnterprises(Array.isArray(enterpriseList) ? enterpriseList : []);
      setPrograms(Array.isArray(programsResponse?.data) ? programsResponse.data : []);
      setEntrepreneurPool(
        Array.isArray(poolResponse)
          ? poolResponse
          : Array.isArray(poolResponse?.data)
            ? poolResponse.data
            : [],
      );
    } catch {
      toast.error("Failed to load tracker data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userDetails?.uuid) loadData();
  }, [userDetails?.uuid]);


  const onDeleteEnterprise = async (enterprise) => {
    const shouldDelete = window.confirm(`Delete startup "${enterprise.name}"?`);
    if (!shouldDelete) return;

    try {
      setDeletingEnterpriseUuid(enterprise.uuid);
      await deleteMentorEnterprise(enterprise.uuid);
      toast.success("Startup deleted");
      loadData();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete startup");
    } finally {
      setDeletingEnterpriseUuid(null);
    }
  };

  if (loading) return <Loader />;


  return (
    <div className="min-h-screen px-4 py-6 text-slate-950 md:px-8 xl:px-12">
      <main className="mx-auto max-w-[1480px] space-y-6">
        <section
          className="relative overflow-hidden rounded-2xl bg-slate-950 px-6 py-5 text-white shadow-sm shadow-slate-300/70 md:px-8 md:py-6"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.6) 50%, rgba(0, 0, 0, 0.2) 100%), url(${HERO_IMAGE_URL})`,
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        >
          <div className="relative z-10 flex min-h-[220px] flex-col justify-between gap-6">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-bold text-white shadow-sm backdrop-blur">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
                  Business Development Advisor
                </div>
                <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">Startup Portfolio</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/85 md:text-base">
                  Monitor startup progress, milestones, evidence, and grant governance for the entrepreneurs assigned to you.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-6 text-sm font-bold text-white/90">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/15 text-white backdrop-blur">◈</span>
                Startups
              </div>
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/15 text-white backdrop-blur">□</span>
                Milestones
              </div>
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/15 text-white backdrop-blur">$</span>
                Grant Governance
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <DataTile label="Startups" value={portfolioStats.all} />
          <DataTile label="On track" value={portfolioStats.onTrack} />
          <DataTile label="Mentorship hours" value={formatHours(portfolioStats.mentorshipHours)} />
          <DataTile label="Approved grants" value={formatMoney(portfolioStats.totalGrant)} />
        </section>

        <PortalCard
          icon={<Building2 className="h-5 w-5" />}
          title="Startups"
          subtitle="Select a startup to open its milestone-linked funds dashboard."
        >
          <div className="mb-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setEnterpriseFilter("all")}
              className={`rounded-full border px-4 py-2 text-sm font-bold transition ${enterpriseFilter === "all" ? "border-[#082d77] bg-[#082d77] text-white" : "border-slate-200 bg-white text-slate-600 hover:border-[#082d77]/20 hover:text-[#082d77]"}`}
            >
              All
            </button>
            {filterCategories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setEnterpriseFilter(category)}
                className={`rounded-full border px-4 py-2 text-sm font-bold transition ${enterpriseFilter === category ? "border-[#082d77] bg-[#082d77] text-white" : "border-slate-200 bg-white text-slate-600 hover:border-[#082d77]/20 hover:text-[#082d77]"}`}
              >
                {category}
              </button>
            ))}
          </div>

          {filteredTracked.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-500">
              No entrepreneurs assigned to you yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {filteredTracked.map((row) => {
                const { entrepreneur, enterprise } = row;
                const business = entrepreneur?.Business || entrepreneur?.business || {};
                const name = enterprise?.name || business?.name || entrepreneur?.name || "Unnamed startup";
                const sector = enterprise?.ceSector || business?.BusinessSector?.name || "Sector";
                const region = enterprise?.district || business?.location || "N/A";
                const coverImage =
                  entrepreneur?.image || enterprise?.image || business?.image || HERO_IMAGE_URL;
                const joined = new Date(
                  enterprise?.awardDate || business?.createdAt || entrepreneur?.createdAt || enterprise?.createdAt || "",
                );
                const joinedYear = Number.isNaN(joined.getTime()) ? null : joined.getFullYear();
                const entUuid = entrepreneur?.uuid || getEnterpriseEntrepreneurUuid(enterprise || {});

                return (
                  <article
                    key={row.key}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#082d77]/10"
                  >
                    <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                      <div
                        className="absolute inset-0 bg-cover bg-center transition duration-300 group-hover:scale-105"
                        style={{ backgroundImage: `url(${coverImage})` }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                      <span className="absolute bottom-3 left-3 rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-600 shadow-sm">
                        {sector}
                      </span>
                    </div>

                    <div className="p-5">
                      <h3 className="truncate text-xl font-black text-slate-950">{name}</h3>

                      <div className="mt-4 space-y-2 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-slate-400" />
                          {region}
                        </div>
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-slate-400" />
                          {joinedYear ? `Joined ${joinedYear}` : "Join date not set"}
                        </div>
                      </div>
                    </div>

                    {enterprise ? (
                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3">
                        <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
                          <button
                            type="button"
                            onClick={() => navigate(`/dashboard/mentorTracker/enterprise-kyc/${enterprise.uuid}?view=1`)}
                            className="text-slate-500 transition hover:text-[#082d77]"
                          >
                            View KYC
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/dashboard/mentorTracker/enterprise-kyc/${enterprise.uuid}`)}
                            className="text-slate-500 transition hover:text-[#082d77]"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteEnterprise(enterprise)}
                            disabled={deletingEnterpriseUuid === enterprise.uuid}
                            className="text-rose-600 transition hover:text-rose-700 disabled:opacity-60"
                          >
                            {deletingEnterpriseUuid === enterprise.uuid ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate(`/dashboard/mentorTracker/enterprise/${enterprise.uuid}`)}
                          className="flex items-center gap-1.5 text-sm font-bold text-emerald-600 transition hover:text-emerald-700"
                        >
                          View Details <span aria-hidden>&rarr;</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 px-5 py-3">
                        <button
                          type="button"
                          disabled={!entUuid}
                          onClick={() =>
                            navigate(
                              `/dashboard/mentorTracker/enterprise-kyc?entreprenuer=${entUuid}${
                                business?.uuid ? `&business=${business.uuid}` : ""
                              }&view=1`,
                            )
                          }
                          className="text-xs font-bold text-slate-500 transition hover:text-[#082d77] disabled:opacity-50"
                        >
                          View KYC
                        </button>
                        <button
                          type="button"
                          disabled={!entUuid}
                          onClick={() =>
                            navigate(
                              `/dashboard/mentorTracker/startup/${entUuid}/milestones?name=${encodeURIComponent(
                                name || "",
                              )}${business?.uuid ? `&business=${business.uuid}` : ""}`,
                            )
                          }
                          className="text-xs font-bold text-slate-500 transition hover:text-[#082d77] disabled:opacity-50"
                        >
                          View milestones
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </PortalCard>
      </main>
    </div>
  );
};

export default MentorTracker;
