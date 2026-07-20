import { useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CalendarDays } from "lucide-react";
import Loader from "@/components/common/Loader";
import { UserContext } from "@/layouts/DashboardLayout";
import { getStaffAssignedEntreprenuers } from "@/controllers/staffEntreprenuerController";
import {
  FaArrowRight,
  FaBuilding,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaSearch,
} from "react-icons/fa";
import Loader from "@/components/common/Loader";
import { UserContext } from "@/layouts/DashboardLayout";
import { getEnterprenuers } from "@/controllers/user_controller";
import { getPrograms } from "@/controllers/program_controller";
import { parseTrackerProgramMeta } from "@/utils/trackerProgramMarkers";

const HERO_IMAGE_URL = "/images/mentor_hero.svg";

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
    text.indexOf("__TRACKER_CATEGORIES__:"),
    text.indexOf("__TRACKER_STARTUPS__:"),
  ].filter((i) => i >= 0);
  return (idx.length ? text.slice(0, Math.min(...idx)) : text).trim();
};

// Defined at module scope so it is not remounted on every keystroke in the
// search box, which would close an open menu mid-interaction.
const FilterDropdown = ({ id, label, value, options, onPick, open, setOpen }) => (
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

// Startup picker for coaching sessions. Selecting one opens its own setup page;
// the sessions themselves live there, not here.
const BdaCoachingSessions = () => {
  const { userDetails } = useContext(UserContext);
  const navigate = useNavigate();
  // The open program lives in the URL so it is its own view and the browser's
  // back button returns to the program list.
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [enterprises, setEnterprises] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [sectorFilter, setSectorFilter] = useState("All Sectors");
  const [programFilter, setProgramFilter] = useState("All Programs");
  const [sortKey, setSortKey] = useState("name");
  const [openDropdown, setOpenDropdown] = useState("");

  useEffect(() => {
    // Only startups selected into a grant program and assigned to this BDA can
    // be coached — the same list their tracker shows. The names come from the
    // entrepreneur pool so they match the rest of the app.
    const bdaUuid = String(userDetails?.uuid || "").trim();
    if (!bdaUuid) {
      setEnterprises([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all([getPrograms(1, 500), getEnterprenuers(1000, 1, " ")])
      .then(([programsResponse, poolBody]) => {
        const programs = Array.isArray(programsResponse?.data)
          ? programsResponse.data
          : [];

        const pool = Array.isArray(poolBody)
          ? poolBody
          : Array.isArray(poolBody?.data)
            ? poolBody.data
            : [];
        const poolByUuid = new Map(
          pool.filter((u) => u?.uuid).map((u) => [u.uuid, u]),
        );

        const seen = new Set();
        const assigned = [];
        programs.forEach((program) => {
          parseTrackerProgramMeta(program).startups.forEach((member) => {
            const uuid = member?.entreprenuerUuid;
            if (!uuid || seen.has(uuid)) return;
            if (String(member?.bdaUuid || "").trim() !== bdaUuid) return;
            seen.add(uuid);

            const poolUser = poolByUuid.get(uuid);
            const business = poolUser?.Business || poolUser?.business || null;
            const joined = business?.createdAt || poolUser?.createdAt;

            assigned.push({
              uuid,
              name:
                business?.name || poolUser?.name || member.name || "Unnamed startup",
              email: poolUser?.email || "",
              image: poolUser?.image || "",
              sector:
                business?.BusinessSector?.name ||
                business?.sector ||
                member.sector ||
                "",
              location: business?.location || "",
              joined: joined ? new Date(joined).getFullYear() : null,
              program: program?.title || "",
              // Kept so the program card can show its blurb and dates.
              programRecord: program || null,
            });
          });
        });

        setEnterprises(assigned);
      })
      .catch(() => toast.error("Failed to load your startups"))
      .finally(() => setLoading(false));
  }, [userDetails?.uuid]);

  // Selecting a startup opens its own coaching-session setup page. The name
  // rides along so that page can title itself without another lookup.
  const onSelectEnterprise = (item) => {
    navigate(
      `/dashboard/bdaCoachingSessions/${item.uuid}?name=${encodeURIComponent(
        item.name || "",
      )}`,
    );
  };

  // Filter options are built from the startups actually assigned to this BDA, so
  // the lists never offer a sector or program that yields nothing.
  const sectorOptions = [
    "All Sectors",
    ...Array.from(new Set(enterprises.map((e) => e.sector).filter(Boolean))).sort(),
  ];
  const programOptions = [
    "All Programs",
    ...Array.from(new Set(enterprises.map((e) => e.program).filter(Boolean))).sort(),
  ];

  const visible = enterprises
    .filter((item) => {
      if (sectorFilter !== "All Sectors" && item.sector !== sectorFilter) return false;
      if (programFilter !== "All Programs" && item.program !== programFilter)
        return false;
      const q = keyword.trim().toLowerCase();
      if (!q) return true;
      return [item.name, item.email, item.sector, item.location, item.program]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q));
    })
    .sort((a, b) => {
      if (sortKey === "recent") return (b.joined || 0) - (a.joined || 0);
      if (sortKey === "sector")
        return String(a.sector).localeCompare(String(b.sector));
      return String(a.name).localeCompare(String(b.name));
    });

  // Startups are grouped under the program they were selected into: the page
  // lists the programs first, and opening one shows its startups.
  const programCards = (() => {
    const map = new Map();
    visible.forEach((item) => {
      // A startup only appears once it has been selected into a program; there
      // is no catch-all group for unassigned ones.
      const key = String(item.program || "").trim();
      if (!key) return;
      if (!map.has(key)) {
        map.set(key, { name: key, rows: [], program: item.programRecord });
      }
      map.get(key).rows.push(item);
    });
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  })();

  const openProgram = searchParams.get("program") || "";
  const openProgramRows =
    programCards.find((p) => p.name === openProgram)?.rows || [];
  const setOpenProgram = (name) => {
    const next = new URLSearchParams(searchParams);
    if (name) next.set("program", name);
    else next.delete("program");
    setSearchParams(next);
  };

  if (loading) return <Loader />;

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

        <div>
          {enterprises.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
              No startups have been assigned to you in a grant program yet. Once a
              finance officer selects a startup into a program and assigns you as
              their BDA, they will appear here.
            </div>
          ) : (
            <>
              <h2 className="mb-6 text-2xl font-bold text-[#172033]">
                Available Programs
              </h2>

              <div className="mb-8 rounded-2xl bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex flex-1 flex-wrap items-center gap-3">
                    <FilterDropdown
                      id="sector"
                      label="Sector"
                      value={sectorFilter}
                      options={sectorOptions}
                      onPick={setSectorFilter}
                      open={openDropdown}
                      setOpen={setOpenDropdown}
                    />
                    <FilterDropdown
                      id="program"
                      label="Program"
                      value={programFilter}
                      options={programOptions}
                      onPick={setProgramFilter}
                      open={openDropdown}
                      setOpen={setOpenDropdown}
                    />
                    <FilterDropdown
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
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8f98]" />
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

              {visible.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                  No entrepreneurs match your filters.
                </div>
              ) : !openProgram ? (
                /* Programs first — opening one shows the startups inside it. */
                <div className="space-y-6">
                  {programCards.map(({ name, rows, program }) => (
                    <article
                      key={name}
                      className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm"
                    >
                      <h3 className="text-xl font-black tracking-tight text-[#172033]">
                        {name}
                      </h3>

                      {getProgramBlurb(program) && (
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
                          <FaArrowRight />
                        </button>
                      </div>
                    </article>
                  ))}
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

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {openProgramRows.map((item) => (
                    <button
                      key={item.uuid}
                      type="button"
                      onClick={() => onSelectEnterprise(item)}
                      className="group overflow-hidden rounded-xl bg-white text-left shadow-md transition duration-200 hover:scale-[1.02] hover:shadow-lg"
                    >
                      <div className="relative h-56 overflow-hidden bg-black">
                        <img
                          src={item.image || "/images/default-avatar.png"}
                          alt={`${item.name} profile`}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                        <div className="absolute bottom-4 left-4">
                          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 shadow-sm backdrop-blur-sm">
                            {item.sector || "No Sector"}
                          </span>
                        </div>
                      </div>

                      <div className="flex min-h-[230px] flex-col p-5">
                        <h3 className="mb-2 line-clamp-2 text-lg font-bold text-[#111827]">
                          {item.name}
                        </h3>
                        <p className="mb-5 line-clamp-1 text-sm text-[#6f6f72]">
                          {item.email || "No email provided"}
                        </p>

                        <div className="space-y-3 text-sm text-[#6f6f72]">
                          {item.program && (
                            <div className="flex items-center gap-2">
                              <FaBuilding className="shrink-0" />
                              <span className="line-clamp-1">{item.program}</span>
                            </div>
                          )}
                          {item.location && (
                            <div className="flex items-center gap-2">
                              <FaMapMarkerAlt className="shrink-0" />
                              <span className="line-clamp-1">{item.location}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <FaCalendarAlt className="shrink-0" />
                            <span>Joined {item.joined || "N/A"}</span>
                          </div>
                        </div>

                        <div className="mt-auto flex items-center justify-between border-t border-black/10 pt-4 text-xs text-[#8a8f98]">
                          <span className="flex items-center gap-1">
                            <FaBuilding />
                            Profile
                          </span>
                          <span className="flex items-center gap-1 font-medium text-green-600">
                            Coaching Sessions
                            <FaArrowRight />
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default BdaCoachingSessions;
