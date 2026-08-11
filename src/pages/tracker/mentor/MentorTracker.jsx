import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  MapPin,
  Search,
} from "lucide-react";
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
import { parseProgramBdas } from "@/utils/trackerProgramMarkers";

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
  String(
    program?.title ||
      program?.name ||
      program?.programName ||
      program?.programCategory ||
      "",
  ).trim();

const isExcludedProgramStageLabel = (value) =>
  EXCLUDED_PROGRAM_STAGE_LABELS.includes(
    String(value || "")
      .trim()
      .toLowerCase(),
  );

const getEnterpriseProgramName = (enterprise) =>
  String(
    enterprise?.Program?.title ||
      enterprise?.program?.title ||
      enterprise?.programTitle ||
      enterprise?.programName ||
      enterprise?.category ||
      "",
  ).trim();



const formatProgramDate = (value) => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleDateString("en-GB");
};

// The program description carries the tracker markers; show only the prose.
const getProgramBlurb = (program) => {
  const text = String(program?.description || "");
  const idx = [
    text.indexOf(TRACKER_CATEGORIES_MARKER),
    text.indexOf(TRACKER_STARTUPS_MARKER),
  ].filter((i) => i >= 0);
  return (idx.length ? text.slice(0, Math.min(...idx)) : text).trim();
};

const getEnterpriseEntrepreneurUuid = (enterprise) =>
  enterprise?.Entreprenuer?.uuid || enterprise?.entreprenuer_uuid;

const getAssignedBusinessName = (assignment) => {
  const entrepreneur = assignment?.Entreprenuer;
  const directBusinessName =
    entrepreneur?.Business?.name || entrepreneur?.business?.name;
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
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};


// Module scope so it is not remounted on every keystroke in the search box,
// which would close an open menu mid-interaction.
const TrackerFilterDropdown = ({
  id,
  label,
  value,
  options,
  onPick,
  open,
  setOpen,
}) => (
  <div className="relative inline-block">
    <button
      type="button"
      onClick={() => setOpen((prev) => (prev === id ? "" : id))}
      className={`inline-flex items-center gap-2 rounded-md border px-4 py-3 text-sm transition-colors ${
        label !== "Sort" && value !== options[0]
          ? "border-green-600 bg-green-50 text-green-700"
          : "border-black/10 bg-white text-[#6f6f72] hover:border-green-600"
      }`}
    >
      <span>{label === "Sort" ? `Sort: ${value}` : value}</span>
      <span>{open === id ? "⌃" : "⌄"}</span>
    </button>

    {open === id && (
      <div className="absolute z-20 mt-2 max-h-64 w-64 overflow-y-auto rounded-xl border border-black/10 bg-white shadow-lg">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => {
              onPick(option);
              setOpen("");
            }}
            className={`block w-full px-4 py-2 text-left text-sm ${
              value === option
                ? "bg-green-50 text-green-700"
                : "text-[#6f6f72] hover:bg-[#f8f8f6]"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    )}
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
  const [keyword, setKeyword] = useState("");
  const [sectorFilter, setSectorFilter] = useState("All Sectors");
  const [sortKey, setSortKey] = useState("name");
  const [openDropdown, setOpenDropdown] = useState("");
  const [deletingEnterpriseUuid, setDeletingEnterpriseUuid] = useState(null);
  // The open program lives in the URL so it is its own view and the browser's
  // back button returns to the program list.
  const [searchParams, setSearchParams] = useSearchParams();
  const setOpenProgram = (name) => {
    const next = new URLSearchParams(searchParams);
    if (name) next.set("program", name);
    else next.delete("program");
    setSearchParams(next);
  };

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
        .filter((program) =>
          Boolean(
            program.uuid &&
            program.name &&
            !isExcludedProgramStageLabel(program.name),
          ),
        ),
    [programs],
  );

  const filterCategories = useMemo(() => {
    return Array.from(
      new Set(
        enterprises
          .map((item) => getEnterpriseProgramName(item))
          .filter((value) =>
            Boolean(
              value && value.trim() && !isExcludedProgramStageLabel(value),
            ),
          ),
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
  // Every startup on a program this BDA runs — not only the ones finance named
  // them against. A startup's milestones must reach their BDA as soon as they
  // are submitted, so review cannot wait on finance filling in an assignment.
  //
  // "Runs" means the program's BDA roster lists them, or (for programs saved
  // before that roster existed) they are the named BDA for at least one startup
  // on it.
  const programAssignedStartups = useMemo(() => {
    const bdaUuid = String(userDetails?.uuid || "").trim();
    if (!bdaUuid) return [];

    const result = [];
    programs.forEach((program) => {
      const members = parseProgramStartups(program);
      const runsProgram =
        parseProgramBdas(program).includes(bdaUuid) ||
        members.some(
          (member) => String(member?.bdaUuid || "").trim() === bdaUuid,
        );
      if (!runsProgram) return;

      members.forEach((member) => {
        if (member?.entreprenuerUuid) result.push(member);
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
      if (uuid && !enterpriseByEnt.has(uuid))
        enterpriseByEnt.set(uuid, enterprise);
    });

    const rows = [];
    const seen = new Set();

    entrepreneurs.forEach((assignment) => {
      const ent = assignment?.Entreprenuer;
      if (!ent?.uuid || seen.has(ent.uuid)) return;
      seen.add(ent.uuid);
      rows.push({
        key: ent.uuid,
        entrepreneur: ent,
        enterprise: enterpriseByEnt.get(ent.uuid) || null,
      });
    });

    // Include any registered enterprise whose entrepreneur isn't in the assigned list.
    enterprises.forEach((enterprise) => {
      const uuid = getEnterpriseEntrepreneurUuid(enterprise);
      if (uuid && seen.has(uuid)) return;
      if (uuid) seen.add(uuid);
      rows.push({
        key: enterprise.uuid || uuid || enterprise.id,
        entrepreneur:
          enterprise.Entreprenuer || enterprise.entreprenuer || null,
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

  // Flatten each row's display fields once, so filtering, sorting and the card
  // all read the same values.
  const cardRows = useMemo(
    () =>
      trackedList.map((row) => {
        const { entrepreneur, enterprise } = row;
        const business = entrepreneur?.Business || entrepreneur?.business || {};
        const joined = new Date(
          enterprise?.awardDate ||
            business?.createdAt ||
            entrepreneur?.createdAt ||
            enterprise?.createdAt ||
            "",
        );
        return {
          ...row,
          name:
            enterprise?.name || business?.name || entrepreneur?.name || "Unnamed startup",
          email: entrepreneur?.email || business?.email || "",
          sector: enterprise?.ceSector || business?.BusinessSector?.name || "",
          region: enterprise?.district || business?.location || "",
          program: enterprise ? getEnterpriseProgramName(enterprise) : "",
          coverImage:
            entrepreneur?.image || enterprise?.image || business?.image || HERO_IMAGE_URL,
          joinedYear: Number.isNaN(joined.getTime()) ? null : joined.getFullYear(),
        };
      }),
    [trackedList],
  );

  const sectorOptions = useMemo(
    () => [
      "All Sectors",
      ...Array.from(new Set(cardRows.map((r) => r.sector).filter(Boolean))).sort(),
    ],
    [cardRows],
  );

  const filteredTracked = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return cardRows
      .filter((row) => {
        if (enterpriseFilter !== "all" && row.program !== enterpriseFilter)
          return false;
        if (sectorFilter !== "All Sectors" && row.sector !== sectorFilter)
          return false;
        if (!q) return true;
        return [row.name, row.email, row.sector, row.region, row.program]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(q));
      })
      .sort((a, b) => {
        if (sortKey === "recent") return (b.joinedYear || 0) - (a.joinedYear || 0);
        if (sortKey === "sector")
          return String(a.sector).localeCompare(String(b.sector));
        return String(a.name).localeCompare(String(b.name));
      });
  }, [cardRows, enterpriseFilter, sectorFilter, sortKey, keyword]);

  // Startups are grouped under the program they were selected into: the page
  // lists the programs first, and opening one shows its startups.
  const groupedByProgram = useMemo(() => {
    const map = new Map();
    filteredTracked.forEach((row) => {
      // A startup only appears once it has been selected into a program; there
      // is no catch-all group for unassigned ones.
      const key = String(row.program || "").trim();
      if (!key) return;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(row);
    });
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredTracked]);

  // Program cards, carrying the full record so the card can show its blurb,
  // category and dates. Only programs this BDA actually has startups in.
  const programCards = useMemo(() => {
    const byName = new Map(
      programs.map((program) => [getProgramDisplayName(program), program]),
    );
    return groupedByProgram.map(([name, rows]) => ({
      name,
      rows,
      program: byName.get(name) || null,
    }));
  }, [groupedByProgram, programs]);

  const openProgram = searchParams.get("program") || "";
  const openProgramRows =
    programCards.find((p) => p.name === openProgram)?.rows || [];

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
      setPrograms(
        Array.isArray(programsResponse?.data) ? programsResponse.data : [],
      );
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
          <div className="relative z-10 flex min-h-[120px] flex-col justify-between gap-6">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-bold text-white shadow-sm backdrop-blur">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
                  Business Development Advisor
                </div>
                <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
                  Startup Portfolio
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/85 md:text-base">
                  Monitor startup progress, milestones, evidence, and grant
                  governance for the entrepreneurs assigned to you.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div>
          <h2 className="mb-6 text-2xl font-bold text-[#172033]">
            Available Programs
          </h2>

          <div className="mb-8 rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-1 flex-wrap items-center gap-3">
                <TrackerFilterDropdown
                  id="sector"
                  label="Sector"
                  value={sectorFilter}
                  options={sectorOptions}
                  onPick={setSectorFilter}
                  open={openDropdown}
                  setOpen={setOpenDropdown}
                />
                <TrackerFilterDropdown
                  id="program"
                  label="Program"
                  value={enterpriseFilter === "all" ? "All Programs" : enterpriseFilter}
                  options={["All Programs", ...filterCategories]}
                  onPick={(value) =>
                    setEnterpriseFilter(value === "All Programs" ? "all" : value)
                  }
                  open={openDropdown}
                  setOpen={setOpenDropdown}
                />
                <TrackerFilterDropdown
                  id="sort"
                  label="Sort"
                  value={sortKey}
                  options={["name", "sector", "recent"]}
                  onPick={setSortKey}
                  open={openDropdown}
                  setOpen={setOpenDropdown}
                />
              </div>

              <div className="relative ml-auto w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a8f98]" />
                <input
                  type="text"
                  placeholder="Search entrepreneurs..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full rounded-md border border-black/10 bg-white px-4 py-3 pl-10 text-sm text-[#172033] outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
                />
              </div>
            </div>
          </div>

          {filteredTracked.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-500">
              No entrepreneurs assigned to you yet.
            </div>
          ) : !openProgram ? (
            /* Programs first — opening one shows the startups inside it. */
            <div className="space-y-6">
              {programCards.map(({ name, rows, program }) => {
                const categories = program ? getProgramCategories(program) : [];
                return (
                  <article
                    key={name}
                    className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h3 className="text-xl font-black tracking-tight text-[#172033]">
                        {name}
                      </h3>
                      {categories[0] && (
                        <span className="rounded-full bg-[#082d77]/5 px-3 py-1 text-xs font-bold text-[#082d77]">
                          {categories[0]}
                        </span>
                      )}
                    </div>

                    {program?.description && (
                      <p className="mt-3 text-sm leading-6 text-[#6f6f72]">
                        {getProgramBlurb(program)}
                      </p>
                    )}

                    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-bold text-slate-400">Start</p>
                        <p className="mt-1 text-sm font-black text-slate-950">
                          {formatProgramDate(program?.startDate)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-bold text-slate-400">End</p>
                        <p className="mt-1 text-sm font-black text-slate-950">
                          {formatProgramDate(program?.endDate)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-black/10 pt-4">
                      <span className="text-xs font-bold text-[#8a8f98]">
                        {rows.length} startup{rows.length === 1 ? "" : "s"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setOpenProgram(name)}
                        className="flex items-center gap-1 text-sm font-bold text-green-600 transition hover:text-green-700"
                      >
                        View Details
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-black tracking-tight text-[#172033]">
                  {openProgram}
                </h3>
                <button
                  type="button"
                  onClick={() => setOpenProgram("")}
                  className="text-sm font-semibold text-[#082d77]"
                >
                  All programs
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {openProgramRows.map((row) => {
                const { entrepreneur, enterprise } = row;
                const entUuid = entrepreneur?.uuid || getEnterpriseEntrepreneurUuid(enterprise || {});

                return (
                  <article
                    key={row.key}
                    className="group flex flex-col overflow-hidden rounded-xl bg-white shadow-md transition duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className="relative h-56 w-full overflow-hidden bg-black">
                      <div
                        className="absolute inset-0 bg-cover bg-center transition duration-300 group-hover:scale-105"
                        style={{ backgroundImage: `url(${row.coverImage})` }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                      <span className="absolute bottom-4 left-4 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 shadow-sm backdrop-blur-sm">
                        {row.sector || "No Sector"}
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="mb-2 line-clamp-2 text-lg font-bold text-[#111827]">
                        {row.name}
                      </h3>
                      <p className="mb-5 line-clamp-1 text-sm text-[#6f6f72]">
                        {row.email || "No email provided"}
                      </p>

                      <div className="space-y-3 text-sm text-[#6f6f72]">
                        {row.program && (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 shrink-0" />
                            <span className="line-clamp-1">{row.program}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 shrink-0" />
                          <span className="line-clamp-1">{row.region || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 shrink-0" />
                          <span>
                            {row.joinedYear
                              ? `Joined ${row.joinedYear}`
                              : "Join date not set"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {enterprise ? (
                      <div className="mx-5 flex items-center justify-between border-t border-black/10 py-4 text-xs text-[#8a8f98]">
                        {/* The management actions live where the reference shows
                            a static "Profile" label — dropping them would remove
                            the only way to open KYC or delete a startup. */}
                        <div className="flex flex-wrap items-center gap-3 font-bold">
                          <button
                            type="button"
                            onClick={() => navigate(`/dashboard/mentorTracker/enterprise-kyc/${enterprise.uuid}?view=1`)}
                            className="flex items-center gap-1 transition hover:text-[#082d77]"
                          >
                            <Building2 className="h-3.5 w-3.5" />
                            Profile
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/dashboard/mentorTracker/enterprise-kyc/${enterprise.uuid}`)}
                            className="transition hover:text-[#082d77]"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteEnterprise(enterprise)}
                            disabled={
                              deletingEnterpriseUuid === enterprise.uuid
                            }
                            className="text-rose-600 transition hover:text-rose-700 disabled:opacity-60"
                          >
                            {deletingEnterpriseUuid === enterprise.uuid
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate(`/dashboard/mentorTracker/enterprise/${enterprise.uuid}`)}
                          className="flex items-center gap-1 font-medium text-green-600 transition hover:text-green-700"
                        >
                          View Details
                          <ArrowRight className="h-3.5 w-3.5" />
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
                                business?.uuid
                                  ? `&business=${business.uuid}`
                                  : ""
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
                              )}${business?.uuid ? `&business=${business.uuid}` : ""}${enterprise?.uuid ? `&enterprise=${enterprise.uuid}` : ""}`,
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
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MentorTracker;
