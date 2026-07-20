import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import Loader from "@/components/common/Loader";
import { getTrackerProgramOverview } from "@/controllers/trackerController";
import { getProgram } from "@/controllers/program_controller";
import { getEnterprenuers } from "@/controllers/user_controller";
import { parseTrackerProgramMeta } from "@/utils/trackerProgramMarkers";
import {
  FaBuilding,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaArrowRight,
  FaSearch,
} from "react-icons/fa";

// Module scope so it is not remounted on every keystroke in the search box,
// which would close an open menu mid-interaction.
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

const TrackerProgramDetails = () => {
  const navigate = useNavigate();
  const { programUuid } = useParams();

  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [members, setMembers] = useState([]);
  // entrepreneur uuid -> full entrepreneur record (image, email, business,
  // sector, location, join date) for the startup cards.
  const [entByUuid, setEntByUuid] = useState({});
  const [keyword, setKeyword] = useState("");
  const [sectorFilter, setSectorFilter] = useState("All Sectors");
  const [sortKey, setSortKey] = useState("name");
  const [openDropdown, setOpenDropdown] = useState("");

  useEffect(() => {
    const meta = parseTrackerProgramMeta(overview?.program);
    setMembers(Array.isArray(meta.startups) ? meta.startups : []);
  }, [overview]);

  // Build an entrepreneur-record map so the startup cards can show the picture,
  // sector, location and join date from the entrepreneur's business profile.
  useEffect(() => {
    getEnterprenuers(1000, 1, " ")
      .then((body) => {
        const list = Array.isArray(body)
          ? body
          : Array.isArray(body?.data)
            ? body.data
            : [];
        const map = {};
        list.forEach((user) => {
          if (user?.uuid) map[user.uuid] = user;
        });
        setEntByUuid(map);
      })
      .catch(() => setEntByUuid({}));
  }, []);

  const loadOverview = async () => {
    if (!programUuid) {
      return;
    }

    setLoading(true);
    try {
      let response = null;

      // Preferred: the tracker overview (program + tracked enterprises).
      try {
        response = await getTrackerProgramOverview(programUuid);
      } catch (overviewError) {
        response = null;
      }

      // Fallback: the grant-program data (startups, grants, BDA) lives in the
      // program description markers, so the program record alone is enough to
      // view the details. Use the open program endpoint when the tracker
      // overview is unavailable or forbidden for this role.
      if (!response?.program) {
        const program = await getProgram(programUuid);
        if (!program?.uuid) {
          throw new Error("Program not found");
        }
        response = {
          program,
          enterprises: [],
          summary: {
            enterprisesCount: 0,
            sessionsCount: 0,
            weeklyLogsCount: 0,
            milestonesCount: 0,
            mentorshipHours: 0,
          },
        };
      }

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

  const parsedProgramMeta = useMemo(
    () => parseTrackerProgramMeta(program),
    [program],
  );

  // Flatten each member's display fields once so the filters, the sort and the
  // card all read the same values.
  const cards = useMemo(
    () =>
      members.map((member, index) => {
        const item = entByUuid[member.entreprenuerUuid] || {};
        const business = item.Business || {};
        const joinedRaw = business?.createdAt || item?.createdAt;
        return {
          key: member.entreprenuerUuid || index,
          entreprenuerUuid: member.entreprenuerUuid,
          name: member.name || business.name || item.name || "Unnamed startup",
          sector: business?.BusinessSector?.name || member.sector || "",
          email: business?.email || item?.email || "",
          location: business?.location || member.district || "",
          joinedYear: joinedRaw ? new Date(joinedRaw).getFullYear() : null,
          coverImage: item?.image || "/images/default-avatar.png",
        };
      }),
    [members, entByUuid],
  );

  const sectorOptions = useMemo(
    () => [
      "All Sectors",
      ...Array.from(new Set(cards.map((c) => c.sector).filter(Boolean))).sort(),
    ],
    [cards],
  );

  const visibleCards = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return cards
      .filter((card) => {
        if (sectorFilter !== "All Sectors" && card.sector !== sectorFilter)
          return false;
        if (!q) return true;
        return [card.name, card.email, card.sector, card.location]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(q));
      })
      .sort((a, b) => {
        if (sortKey === "recent") return (b.joinedYear || 0) - (a.joinedYear || 0);
        if (sortKey === "sector")
          return String(a.sector).localeCompare(String(b.sector));
        return String(a.name).localeCompare(String(b.name));
      });
  }, [cards, sectorFilter, sortKey, keyword]);

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

      <section
        className="relative overflow-hidden rounded-2xl bg-slate-950 px-7 py-6 text-white shadow-sm shadow-slate-300/70 md:px-10 md:py-7"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.6) 50%, rgba(0, 0, 0, 0.2) 100%), url('/images/mentor_hero.svg')",
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-bold text-white shadow-sm backdrop-blur">
            <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
            Tracker Programs
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
            {program?.title || "Tracker Program"}
          </h1>
          <p className="mt-3 text-sm leading-7 text-white/85 md:text-base">
            {parsedProgramMeta.cleanDescription ||
              "No program description provided."}
          </p>
          {parsedProgramMeta.categories.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {parsedProgramMeta.categories.map((category) => (
                <span
                  key={category}
                  className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold"
                >
                  {category}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      <div>
        <h2 className="mb-6 text-2xl font-bold text-[#172033]">
          Available Entrepreneurs
        </h2>

        {members.length > 0 && (
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
        )}

        {members.length === 0 ? (
          <div className="rounded-xl border border-dashed border-black/20 bg-white p-6 text-sm text-[#64748b]">
            No startups added to this program yet. Edit the program to select startups from the pool.
          </div>
        ) : visibleCards.length === 0 ? (
          <div className="rounded-xl border border-dashed border-black/20 bg-white p-6 text-center text-sm text-[#64748b]">
            No entrepreneurs match your filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {visibleCards.map((member) => {
              const {
                name,
                email,
                location,
                joinedYear,
                coverImage,
              } = member;
              const sector = member.sector || "No Sector";
              const canOpen = Boolean(member.entreprenuerUuid);

              return (
                <div
                  key={member.key}
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    canOpen &&
                    navigate(
                      `/dashboard/trackerPrograms/${program.uuid}/startup/${member.entreprenuerUuid}`,
                    )
                  }
                  onKeyDown={(e) => {
                    if (canOpen && (e.key === "Enter" || e.key === " ")) {
                      navigate(
                        `/dashboard/trackerPrograms/${program.uuid}/startup/${member.entreprenuerUuid}`,
                      );
                    }
                  }}
                  className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="relative h-56 w-full overflow-hidden bg-black">
                    <div
                      className="absolute inset-0 bg-cover bg-center transition duration-300 group-hover:scale-105"
                      style={{ backgroundImage: `url(${coverImage})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 shadow-sm backdrop-blur-sm">
                        {sector}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="mb-2 line-clamp-2 text-lg font-bold text-[#111827]">
                      {name}
                    </h3>

                    <p className="mb-5 line-clamp-1 text-sm text-[#6f6f72]">
                      {email || "No email provided"}
                    </p>

                    <div className="space-y-3 text-sm text-[#6f6f72]">
                      {location && (
                        <div className="flex items-center gap-2">
                          <FaMapMarkerAlt className="shrink-0" />
                          <span className="line-clamp-1">{location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <FaCalendarAlt className="shrink-0" />
                        <span>Joined {joinedYear || "N/A"}</span>
                      </div>
                    </div>

                    <div className="mt-auto flex items-center justify-between border-t border-black/10 pt-4 text-xs text-[#8a8f98]">
                      <span className="flex items-center gap-1">
                        <FaBuilding />
                        Profile
                      </span>
                      <span className="flex items-center gap-1 font-medium text-green-600">
                        View Details
                        <FaArrowRight />
                      </span>
                    </div>
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

export default TrackerProgramDetails;
