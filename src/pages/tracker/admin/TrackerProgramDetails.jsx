import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import Loader from "@/components/common/Loader";
import { getTrackerProgramOverview } from "@/controllers/trackerController";
import { getProgram } from "@/controllers/program_controller";
import { getEnterprenuers } from "@/controllers/user_controller";
import { parseTrackerProgramMeta } from "@/utils/trackerProgramMarkers";
import { FaBuilding, FaMapMarkerAlt, FaCalendarAlt, FaArrowRight } from "react-icons/fa";

const TrackerProgramDetails = () => {
  const navigate = useNavigate();
  const { programUuid } = useParams();

  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [members, setMembers] = useState([]);
  // entrepreneur uuid -> full entrepreneur record (image, email, business,
  // sector, location, join date) for the startup cards.
  const [entByUuid, setEntByUuid] = useState({});

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
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-[#111827]">
            Program startups ({members.length})
          </h2>
          <p className="text-sm text-[#64748b]">
            Open a startup to manage its grant, assigned BDA, contract and reports.
          </p>
        </div>

        {members.length === 0 ? (
          <div className="rounded-xl border border-dashed border-black/20 bg-white p-6 text-sm text-[#64748b]">
            No startups added to this program yet. Edit the program to select startups from the pool.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {members.map((member, index) => {
              const item = entByUuid[member.entreprenuerUuid] || {};
              const business = item.Business || {};
              const name = member.name || business.name || item.name || "Unnamed startup";
              const sector =
                business?.BusinessSector?.name || member.sector || "No Sector";
              const email = business?.email || item?.email || "No email provided";
              const location = business?.location || member.district || "";
              const joinedRaw = business?.createdAt || item?.createdAt;
              const joinedYear = joinedRaw ? new Date(joinedRaw).getFullYear() : null;
              const coverImage = item?.image || "/images/default-avatar.png";
              const canOpen = Boolean(member.entreprenuerUuid);

              return (
                <div
                  key={member.entreprenuerUuid || index}
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
                  <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                    <div
                      className="absolute inset-0 bg-cover bg-center transition duration-300 group-hover:scale-105"
                      style={{ backgroundImage: `url(${coverImage})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
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

                    <p className="mb-5 line-clamp-1 text-sm text-[#6f6f72]">{email}</p>

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
