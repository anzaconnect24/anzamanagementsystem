import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import {
  Building2,
  CalendarCheck,
  ChevronDown,
  CircleCheck,
  Flag,
  OctagonAlert,
  Pencil,
  Plus,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { getEnterprenuers } from "@/controllers/user_controller";
import { getBusiness } from "@/controllers/business_controller";
import {
  addProgram,
  deleteProgram,
  editProgram,
  getPrograms,
} from "@/controllers/program_controller";
import { getEntrepreneurCoachingSessions } from "@/controllers/coaching_session_controller";
import {
  listTrackerMilestones,
  upsertMentorEnterprise,
} from "@/controllers/trackerController";
import {
  hasSessionReport,
  isSessionDeclined,
  isSessionRequested,
} from "@/components/tracker/CoachingSessionsPanel";
import {
  buildDescriptionWithMetaAndBdas,
  parseProgramBdas,
  parseTrackerProgramMeta,
} from "@/utils/trackerProgramMarkers";
import { isGrantProgram, isMentorshipProgram } from "@/utils/programMeta";

const HERO_IMAGE_URL = "/images/mentor_hero.svg";

// Portfolio status card: the number first, its label beneath, tinted icon on
// the right — the same shape the coaching sessions panel uses.
const StatCard = ({ label, value, icon, tone }) => (
  <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/50">
    <div className="flex items-start justify-between gap-3">
      <p className="min-w-0 truncate text-2xl font-black tracking-tight text-slate-950">
        {value}
      </p>
      <span className={`shrink-0 ${tone}`}>{icon}</span>
    </div>
    <p className="mt-2 text-sm font-medium text-slate-500">{label}</p>
  </div>
);

// Regions double as the district list, matching the enterprise KYC form.
const DISTRICTS = [
  "Arusha",
  "Dar es Salaam",
  "Dodoma",
  "Geita",
  "Iringa",
  "Kagera",
  "Katavi",
  "Kigoma",
  "Kilimanjaro",
  "Lindi",
  "Manyara",
  "Mara",
  "Mbeya",
  "Morogoro",
  "Mtwara",
  "Mwanza",
  "Njombe",
  "Pemba North",
  "Pemba South",
  "Pwani",
  "Rukwa",
  "Ruvuma",
  "Shinyanga",
  "Simiyu",
  "Singida",
  "Songwe",
  "Tabora",
  "Tanga",
  "Kaskazini Unguja",
  "Kusini Unguja",
  "Mjini Magharibi",
];

const CE_SECTORS = [
  "Plastic aggregation",
  "Metal scraps aggregation",
  "Organic waste",
  "E-waste",
  "Agriculture",
  "Retail",
  "Manufacturing",
  "Technology",
  "Services",
  "Education",
  "Healthcare",
];

const DEFAULT_PROGRAM_IMAGE = "/images/ideation-classes.svg";

const EMPTY_PROGRAM_FORM = {
  title: "",
  description: "",
  categories: "",
  startDate: "",
  endDate: "",
};

const EMPTY_ADD_FORM = {
  entreprenuerUuid: "",
  businessUuid: "",
  name: "",
  category: "",
  ceSector: "",
  district: "",
  leadContact: "",
  grantUsd: "",
  awardDate: "",
  description: "",
};

const addInputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#082d77] focus:ring-4 focus:ring-[#082d77]/20 disabled:bg-slate-50 disabled:text-slate-500";

const AddFieldLabel = ({ children }) => (
  <label className="mb-1.5 block text-xs font-bold tracking-wide text-slate-500">
    {children}
  </label>
);

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
  const [sessionsByUuid, setSessionsByUuid] = useState({});
  const [milestones, setMilestones] = useState([]);
  const [statsReady, setStatsReady] = useState(false);
  // Every startup on the platform, for the "add startup" picker, and every grant
  // program, so the form can read what finance already recorded.
  const [pool, setPool] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [poolSearch, setPoolSearch] = useState("");
  const [poolOpen, setPoolOpen] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_ADD_FORM);
  const [isAdding, setIsAdding] = useState(false);
  const [showProgram, setShowProgram] = useState(false);
  const [programForm, setProgramForm] = useState(EMPTY_PROGRAM_FORM);
  const [isSavingProgram, setIsSavingProgram] = useState(false);
  // Set when the modal is editing an existing program rather than creating one.
  const [editingProgram, setEditingProgram] = useState(null);

  const setProgramField = (key, value) =>
    setProgramForm((prev) => ({ ...prev, [key]: value }));

  const setAddField = (key, value) =>
    setAddForm((prev) => ({ ...prev, [key]: value }));

  // Only startups selected into a grant program and assigned to this BDA can be
  // coached — the same list their tracker shows. The names come from the
  // entrepreneur pool so they match the rest of the app.
  const loadStartups = ({ silent = false } = {}) => {
    const bdaUuid = String(userDetails?.uuid || "").trim();
    if (!bdaUuid) {
      setEnterprises([]);
      setLoading(false);
      return Promise.resolve();
    }

    if (!silent) setLoading(true);
    return Promise.all([getPrograms(1, 500), getEnterprenuers(1000, 1, " ")])
      .then(([programsResponse, poolBody]) => {
        const programs = Array.isArray(programsResponse?.data)
          ? programsResponse.data
          : [];
        setPrograms(programs);

        const pool = Array.isArray(poolBody)
          ? poolBody
          : Array.isArray(poolBody?.data)
            ? poolBody.data
            : [];
        // Every startup on the platform — what the "add startup" picker offers.
        setPool(pool.filter((user) => user?.uuid));
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
              // Carried so the sessions page can link to the business profile,
              // which is keyed by the business — not the entrepreneur.
              businessUuid: business?.uuid || member.businessUuid || "",
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
  };

  useEffect(() => {
    loadStartups();
  }, [userDetails?.uuid]);

  // Coaching data across the whole portfolio: each startup's sessions (for the
  // status cards and the request badges) and their milestones. Loaded after the
  // list renders, so a slow lookup never holds the page up.
  useEffect(() => {
    if (!enterprises.length) {
      setSessionsByUuid({});
      setMilestones([]);
      setStatsReady(false);
      return;
    }
    let cancelled = false;

    Promise.all([
      Promise.all(
        enterprises.map((item) =>
          getEntrepreneurCoachingSessions(item.uuid).then((sessions) => [
            item.uuid,
            Array.isArray(sessions) ? sessions : [],
          ]),
        ),
      ),
      listTrackerMilestones().catch(() => []),
    ]).then(([entries, milestoneBody]) => {
      if (cancelled) return;
      setSessionsByUuid(Object.fromEntries(entries));
      const list = Array.isArray(milestoneBody)
        ? milestoneBody
        : milestoneBody?.body || [];
      setMilestones(Array.isArray(list) ? list : []);
      setStatsReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [enterprises]);

  // Sessions each startup has asked for and not had an answer to.
  const requestsByUuid = useMemo(() => {
    const map = {};
    Object.entries(sessionsByUuid).forEach(([uuid, list]) => {
      const pending = list.filter(isSessionRequested).length;
      if (pending > 0) map[uuid] = pending;
    });
    return map;
  }, [sessionsByUuid]);

  const openCreateProgram = () => {
    setEditingProgram(null);
    setProgramForm(EMPTY_PROGRAM_FORM);
    setShowProgram(true);
  };

  const openEditProgram = (program) => {
    const meta = parseTrackerProgramMeta(program);
    setEditingProgram(program);
    setProgramForm({
      title: program?.title || "",
      description: meta.cleanDescription,
      categories: meta.categories.join(", "),
      startDate: String(program?.startDate || "").slice(0, 10),
      endDate: String(program?.endDate || "").slice(0, 10),
    });
    setShowProgram(true);
  };

  // Remove a program the BDA set up. The startups themselves are untouched —
  // only the program record and its membership list go.
  const onDeleteProgram = async (program) => {
    const startupCount = parseTrackerProgramMeta(program).startups.length;
    const shouldDelete = window.confirm(
      startupCount > 0
        ? `Delete "${program.title}"? Its ${startupCount} startup${startupCount === 1 ? "" : "s"} will no longer be listed under it.`
        : `Delete "${program.title}"?`,
    );
    if (!shouldDelete) return;

    try {
      await deleteProgram(program.uuid);
      toast.success(`${program.title} deleted`);
      if (openProgram === program.title) setOpenProgram("");
      await loadStartups({ silent: true });
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to delete the program",
      );
    }
  };

  // Set up (or update) a mentorship program. It is tagged with this BDA so it
  // shows in their list before any startup has been added to it.
  const onSubmitProgram = async (e) => {
    e.preventDefault();

    const title = programForm.title.trim();
    const description = programForm.description.trim();
    if (!title) {
      toast.error("Program title is required");
      return;
    }
    if (!description) {
      toast.error("Program description is required");
      return;
    }
    if (
      programForm.startDate &&
      programForm.endDate &&
      programForm.startDate > programForm.endDate
    ) {
      toast.error("Start date cannot be after end date");
      return;
    }

    const categories = programForm.categories
      .split(",")
      .map((category) => category.trim())
      .filter(Boolean);

    const bdaUuid = String(userDetails?.uuid || "");
    // Editing keeps the startups already in the program, and whoever runs it.
    const existingMeta = editingProgram
      ? parseTrackerProgramMeta(editingProgram)
      : null;
    const bdas = editingProgram
      ? Array.from(new Set([...parseProgramBdas(editingProgram), bdaUuid]))
      : [bdaUuid];

    const payload = {
      title,
      description: buildDescriptionWithMetaAndBdas(
        description,
        categories,
        existingMeta?.startups || [],
        bdas,
      ),
      programCategory: categories[0] || "Ideation",
      // The BDA's own program — kept out of Grant Management, which lists
      // only the finance officer's grant programs.
      type: "mentorship",
      startDate: programForm.startDate || null,
      endDate: programForm.endDate || null,
      image: editingProgram?.image || DEFAULT_PROGRAM_IMAGE,
    };

    setIsSavingProgram(true);
    try {
      const response = editingProgram?.uuid
        ? await editProgram(editingProgram.uuid, payload)
        : await addProgram(payload);

      if (response?.status !== true && response?.data?.status !== true) {
        toast.error(
          response?.message ||
            response?.data?.message ||
            `Failed to ${editingProgram ? "update" : "create"} the program`,
        );
        return;
      }

      // The open program is tracked by title, so a rename must follow it.
      if (editingProgram && openProgram === editingProgram.title) {
        setOpenProgram(title);
      }

      toast.success(`${title} ${editingProgram ? "updated" : "created"}`);
      setShowProgram(false);
      setEditingProgram(null);
      setProgramForm(EMPTY_PROGRAM_FORM);
      await loadStartups({ silent: true });
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          `Failed to ${editingProgram ? "update" : "create"} the program`,
      );
    } finally {
      setIsSavingProgram(false);
    }
  };

  // Add a startup to the open program and record what this BDA knows about
  // them. The startup itself is picked from the platform-wide pool, so the
  // record always points at a real account.
  const openAdd = () => {
    setAddForm(EMPTY_ADD_FORM);
    setPoolSearch("");
    setPoolOpen(false);
    setShowAdd(true);
  };

  // Picking a startup fills the form from their business profile — the name and
  // description come across as they are registered, and switching to a
  // different startup replaces them rather than leaving the previous one's.
  const pickPoolStartup = async (user) => {
    const business = user?.Business || user?.business || null;
    // Anything already on record for this startup — the grant finance set, the
    // category, the rest — comes across so it is not keyed in a second time.
    const onRecord = findMemberRecord(user.uuid)?.member || null;
    const finance =
      findMemberRecord(user.uuid, { onlyGrant: true })?.member || onRecord;

    setAddForm((prev) => ({
      ...prev,
      entreprenuerUuid: user.uuid,
      businessUuid: business?.uuid || "",
      name: business?.name || finance?.name || user?.name || "Unnamed startup",
      category: finance?.category || prev.category || "",
      ceSector:
        business?.BusinessSector?.name ||
        business?.sector ||
        finance?.sector ||
        prev.ceSector ||
        "",
      district: business?.location || finance?.district || prev.district || "",
      leadContact: user?.name || finance?.leadContact || prev.leadContact || "",
      grantUsd:
        finance?.grantUsd === undefined || finance?.grantUsd === null
          ? ""
          : String(finance.grantUsd),
      awardDate: finance?.awardDate || "",
      description: business?.description || finance?.description || "",
    }));

    // The list payload does not always carry the full business record, so fetch
    // the profile when the description is missing rather than leaving the BDA
    // to type what the startup already registered.
    if (business?.uuid && !business?.description) {
      try {
        const detail = await getBusiness(business.uuid);
        const full = detail?.uuid ? detail : detail?.Business || null;
        if (!full?.description && !full?.name) return;
        setAddForm((prev) =>
          // Ignore a late reply for a startup the BDA has moved on from.
          prev.entreprenuerUuid !== user.uuid
            ? prev
            : {
                ...prev,
                name: prev.name || full.name || "",
                description: prev.description || full.description || "",
                ceSector:
                  prev.ceSector ||
                  full.BusinessSector?.name ||
                  full.sector ||
                  "",
                district: prev.district || full.location || "",
              },
        );
      } catch {
        // Nothing to fill in — the BDA can still type the details.
      }
    }
  };

  const onSubmitAdd = async (e) => {
    e.preventDefault();

    const program = openProgramRecord;
    if (!program?.uuid) {
      toast.error("Open a program first");
      return;
    }
    if (!addForm.entreprenuerUuid) {
      toast.error("Pick the startup from the list");
      return;
    }

    setIsAdding(true);
    try {
      const meta = parseTrackerProgramMeta(program);
      const member = {
        entreprenuerUuid: addForm.entreprenuerUuid,
        businessUuid: addForm.businessUuid,
        name: addForm.name.trim() || "Unnamed startup",
        sector: addForm.ceSector,
        category: addForm.category,
        district: addForm.district,
        leadContact: addForm.leadContact.trim(),
        grantUsd: addForm.grantUsd,
        awardDate: addForm.awardDate,
        description: addForm.description.trim(),
        // The BDA adding the startup is the one who will coach them.
        bdaUuid: String(userDetails?.uuid || ""),
        bdaName: userDetails?.name || "",
      };

      const existing = meta.startups.find(
        (s) => s?.entreprenuerUuid === member.entreprenuerUuid,
      );
      // Keep whatever finance already recorded (tranches, disbursements) and
      // write this BDA's details on top.
      const startups = existing
        ? meta.startups.map((s) =>
            s?.entreprenuerUuid === member.entreprenuerUuid
              ? { ...s, ...member }
              : s,
          )
        : [...meta.startups, member];

      const response = await editProgram(program.uuid, {
        title: program.title,
        description: buildDescriptionWithMetaAndBdas(
          meta.cleanDescription,
          meta.categories,
          startups,
          // Keep whoever runs this program on the record — rewriting the
          // description would otherwise drop them.
          parseProgramBdas(program),
        ),
        programCategory: program.programCategory,
        type: program.type || "grant",
        startDate: program.startDate || null,
        endDate: program.endDate || null,
        image: program.image,
      });

      if (response?.status !== true && response?.data?.status !== true) {
        toast.error(
          response?.message ||
            response?.data?.message ||
            "Failed to add the startup to this program",
        );
        return;
      }

      // Give them a tracker workspace too, so their own dashboard has something
      // to show. Best effort — the program record is what this page reads.
      try {
        await upsertMentorEnterprise({
          entreprenuer_uuid: member.entreprenuerUuid,
          program_uuid: program.uuid,
          name: member.name,
          ceSector: member.sector || undefined,
          district: member.district || undefined,
          grantUsd: Number(member.grantUsd || 0),
          assignedBda: member.bdaName || undefined,
        });
      } catch {
        toast(
          "Added to the program. Their tracker workspace could not be created yet.",
        );
      }

      toast.success(
        existing ? "Startup details updated" : `${member.name} added to ${program.title}`,
      );
      setShowAdd(false);
      setAddForm(EMPTY_ADD_FORM);
      await loadStartups({ silent: true });
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to add the startup",
      );
    } finally {
      setIsAdding(false);
    }
  };

  // Selecting a startup opens its own coaching-session setup page. The name
  // rides along so that page can title itself without another lookup.
  const onSelectEnterprise = (item) => {
    navigate(
      `/dashboard/bdaCoachingSessions/${item.uuid}?name=${encodeURIComponent(
        item.name || "",
      )}&business=${encodeURIComponent(item.businessUuid || "")}`,
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

    // Programs this BDA set up themselves show even before a startup has been
    // added to them — otherwise a new program would vanish on save.
    const bdaUuid = String(userDetails?.uuid || "").trim();
    programs.forEach((program) => {
      const key = String(program?.title || "").trim();
      if (!key || map.has(key)) return;
      if (!parseProgramBdas(program).includes(bdaUuid)) return;
      map.set(key, { name: key, rows: [], program });
    });

    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  })();

  const openProgram = searchParams.get("program") || "";
  const openProgramCard = programCards.find((p) => p.name === openProgram);
  const openProgramRows = openProgramCard?.rows || [];
  const openProgramRecord = openProgramCard?.program || null;
  // Categories the finance officer defined on this program — what the "add
  // startup" form offers.
  const programCategories = openProgramRecord
    ? parseTrackerProgramMeta(openProgramRecord).categories
    : [];

  // Whatever is already on record for a startup, in the open program first and
  // then anywhere else they appear. `onlyGrant` restricts the search to the
  // finance officer's grant programs — a mentorship program's figures are the
  // BDA's own, not finance's.
  const findMemberRecord = (entreprenuerUuid, { onlyGrant = false } = {}) => {
    if (!entreprenuerUuid) return null;
    const candidates = [
      openProgramRecord,
      ...programs.filter((p) => p?.uuid && p?.uuid !== openProgramRecord?.uuid),
    ]
      .filter(Boolean)
      .filter((program) => !onlyGrant || isGrantProgram(program));

    for (const program of candidates) {
      const member = parseTrackerProgramMeta(program).startups.find(
        (s) => s?.entreprenuerUuid === entreprenuerUuid,
      );
      if (member) return { member, program };
    }
    return null;
  };

  const financeRecord = findMemberRecord(addForm.entreprenuerUuid, {
    onlyGrant: true,
  });
  // Only treat it as finance's figure when there is actually an amount on it.
  const financeGrant = Number(financeRecord?.member?.grantUsd || 0) > 0
    ? financeRecord
    : null;
  const setOpenProgram = (name) => {
    const next = new URLSearchParams(searchParams);
    if (name) next.set("program", name);
    else next.delete("program");
    setSearchParams(next);
  };

  // Status of the startups in the open program. A startup's standing is the
  // flag on its most recent reported session, so startups yet to be coached
  // count towards none of the three flags. Requested and declined sessions are
  // not "logged".
  const coachingStats = useMemo(() => {
    const assigned = new Set(openProgramRows.map((item) => item.uuid));
    let onTrack = 0;
    let atRisk = 0;
    let critical = 0;
    let sessionsLogged = 0;

    openProgramRows.forEach((item) => {
      const list = sessionsByUuid[item.uuid] || [];
      const logged = list.filter(
        (session) => !isSessionRequested(session) && !isSessionDeclined(session),
      );
      sessionsLogged += logged.length;

      const latestReported = logged
        .filter((session) => hasSessionReport(session) && session.flag)
        .sort(
          (a, b) => new Date(b.sessionDate || 0) - new Date(a.sessionDate || 0),
        )[0];

      const flag = String(latestReported?.flag || "").toLowerCase();
      if (flag === "green") onTrack += 1;
      else if (flag === "amber") atRisk += 1;
      else if (flag === "red") critical += 1;
    });

    const milestonesDone = milestones.filter((milestone) => {
      const owner =
        milestone?.Entreprenuer?.uuid || milestone?.entreprenuerUuid || "";
      return (
        assigned.has(owner) &&
        String(milestone?.status || "").toLowerCase() === "completed"
      );
    }).length;

    return {
      total: openProgramRows.length,
      onTrack,
      atRisk,
      critical,
      sessionsLogged,
      milestonesDone,
    };
  }, [openProgramRows, sessionsByUuid, milestones]);

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
              Mentorship Tracker
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
              Mentorship Tracker
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/85 md:text-base">
              Track mentee progress, upcoming sessions, goals, and key milestones
              in one place. Stay organized, monitor development, and provide
              timely support throughout the mentorship journey.
            </p>
          </div>
        </section>

        {/* Status of the open program's startups, directly under the hero. */}
        {openProgram && (
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
            {[
              {
                label: "Total Enterprises",
                value: coachingStats.total,
                icon: <Building2 className="h-6 w-6" />,
                tone: "text-[#0b2b5c]",
                always: true,
              },
              {
                label: "On Track",
                value: coachingStats.onTrack,
                icon: <CircleCheck className="h-6 w-6" />,
                tone: "text-emerald-500",
              },
              {
                label: "At Risk",
                value: coachingStats.atRisk,
                icon: <TriangleAlert className="h-6 w-6" />,
                tone: "text-amber-500",
              },
              {
                label: "Critical",
                value: coachingStats.critical,
                icon: <OctagonAlert className="h-6 w-6" />,
                tone: "text-rose-500",
              },
              {
                label: "Sessions Logged",
                value: coachingStats.sessionsLogged,
                icon: <CalendarCheck className="h-6 w-6" />,
                tone: "text-[#0b2b5c]",
              },
              {
                label: "Milestones Done",
                value: coachingStats.milestonesDone,
                icon: <Flag className="h-6 w-6" />,
                tone: "text-emerald-500",
              },
            ].map((card) => (
              <StatCard
                key={card.label}
                label={card.label}
                // Everything but the startup count needs the coaching lookup, so
                // show a placeholder rather than a wrong zero while it loads.
                value={statsReady || card.always ? card.value : "—"}
                icon={card.icon}
                tone={card.tone}
              />
            ))}
          </section>
        )}

        <div>
          {enterprises.length === 0 && programCards.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
              <p className="text-sm text-slate-500">
                No startups have been assigned to you in a grant program yet.
                Wait for a finance officer to select a startup into a program and
                assign you as their BDA, or set up your own mentorship program.
              </p>
              <button
                type="button"
                onClick={openCreateProgram}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#16a34a] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#15803d]"
              >
                <Plus className="h-4 w-4" />
                Add program
              </button>
            </div>
          ) : (
            <>
              {/* Title row — the program actions sit opposite it. */}
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-[#172033]">
                  {/* The list of programs, then the startups inside the one
                      that is open. */}
                  {openProgram ? "Available Startups" : "Mentorship Programs"}
                </h2>

                {openProgram ? (
                  <button
                    type="button"
                    onClick={openAdd}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#16a34a] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#15803d]"
                  >
                    <Plus className="h-4 w-4" />
                    Add startup
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={openCreateProgram}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#16a34a] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#15803d]"
                  >
                    <Plus className="h-4 w-4" />
                    Add program
                  </button>
                )}
              </div>

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

              {visible.length === 0 && programCards.length === 0 ? (
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
                          {(() => {
                            const pending = rows.reduce(
                              (sum, row) => sum + (requestsByUuid[row.uuid] || 0),
                              0,
                            );
                            return pending > 0 ? (
                              <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                                {pending} request{pending === 1 ? "" : "s"}
                              </span>
                            ) : null;
                          })()}
                        </span>
                        <div className="flex items-center gap-4">
                          {/* Only the BDA's own mentorship programs can be
                              changed here — finance owns the grant ones. */}
                          {isMentorshipProgram(program) && (
                            <>
                              <button
                                type="button"
                                onClick={() => openEditProgram(program)}
                                className="inline-flex items-center gap-1.5 text-sm font-bold text-[#082d77] transition hover:text-[#061f54]"
                              >
                                <Pencil className="h-4 w-4" />
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteProgram(program)}
                                className="inline-flex items-center gap-1.5 text-sm font-bold text-rose-600 transition hover:text-rose-700"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => setOpenProgram(name)}
                            className="flex items-center gap-1 text-sm font-bold text-green-600 transition hover:text-green-700"
                          >
                            View Details
                            <FaArrowRight />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
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
                        {requestsByUuid[item.uuid] > 0 && (
                          <span className="absolute right-4 top-4 rounded-full bg-[#F59E0B] px-3 py-1 text-xs font-bold text-white shadow-sm">
                            {requestsByUuid[item.uuid]} session request
                            {requestsByUuid[item.uuid] === 1 ? "" : "s"}
                          </span>
                        )}
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
                            Mentorship Sessions
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

      {/* Set up a mentorship program of your own. */}
      {showProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <form
            onSubmit={onSubmitProgram}
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl shadow-slate-950/20"
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white px-6 py-5">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#082d77]/5 text-[#082d77]">
                  <Flag className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-950">
                    {editingProgram ? "Edit program" : "Add program"}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {editingProgram
                      ? "Update the details of this mentorship program. The startups in it are unaffected."
                      : "Set up a mentorship program, then add the startups you will be coaching in it."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowProgram(false)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <AddFieldLabel>Program title *</AddFieldLabel>
                <input
                  className={addInputClass}
                  placeholder="e.g. Regenerative Economy Accelerator Tanzania"
                  value={programForm.title}
                  onChange={(e) => setProgramField("title", e.target.value)}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <AddFieldLabel>Description *</AddFieldLabel>
                <textarea
                  className={`${addInputClass} min-h-[110px]`}
                  placeholder="What the program is for and who it supports..."
                  value={programForm.description}
                  onChange={(e) =>
                    setProgramField("description", e.target.value)
                  }
                  required
                />
              </div>
              <div className="md:col-span-2">
                <AddFieldLabel>Categories</AddFieldLabel>
                <input
                  className={addInputClass}
                  placeholder="Separate with commas — e.g. Cat 1 – Early adopter, Cat 2 – Scaling"
                  value={programForm.categories}
                  onChange={(e) => setProgramField("categories", e.target.value)}
                />
                <p className="mt-1 text-xs text-slate-500">
                  These are the categories you can place each startup in.
                </p>
              </div>
              <div>
                <AddFieldLabel>Start date</AddFieldLabel>
                <input
                  className={addInputClass}
                  type="date"
                  value={programForm.startDate}
                  onChange={(e) => setProgramField("startDate", e.target.value)}
                />
              </div>
              <div>
                <AddFieldLabel>End date</AddFieldLabel>
                <input
                  className={addInputClass}
                  type="date"
                  value={programForm.endDate}
                  onChange={(e) => setProgramField("endDate", e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-5">
              <button
                type="button"
                onClick={() => setShowProgram(false)}
                disabled={isSavingProgram}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingProgram}
                className="rounded-xl bg-[#16a34a] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#15803d] disabled:opacity-60"
              >
                {isSavingProgram
                  ? editingProgram
                    ? "Saving..."
                    : "Creating..."
                  : editingProgram
                    ? "Save changes"
                    : "Create program"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add a startup to this program and record what you know about them. */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <form
            onSubmit={onSubmitAdd}
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl shadow-slate-950/20"
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white px-6 py-5">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#082d77]/5 text-[#082d77]">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-950">
                    Add startup
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Pick a startup registered on the platform and add them to{" "}
                    {openProgram} under your coaching.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 p-6">
              {/* Step 1 — who. Every startup on the platform is in this list. */}
              <div className="relative">
                <AddFieldLabel>Startup *</AddFieldLabel>
                <button
                  type="button"
                  onClick={() => setPoolOpen((prev) => !prev)}
                  className={`${addInputClass} flex items-center justify-between gap-3 text-left`}
                >
                  <span
                    className={`min-w-0 truncate ${
                      addForm.entreprenuerUuid
                        ? "font-semibold text-slate-900"
                        : "text-slate-400"
                    }`}
                  >
                    {addForm.entreprenuerUuid
                      ? addForm.name || "Selected startup"
                      : "Select a startup"}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-slate-400 transition ${
                      poolOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {poolOpen && (
                  <>
                    {/* Click anywhere else to close. */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setPoolOpen(false)}
                    />
                    <div className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                      <div className="relative border-b border-slate-100 p-2">
                        <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-[#8a8f98]" />
                        <input
                          autoFocus
                          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#082d77]"
                          placeholder="Search all startups by name..."
                          value={poolSearch}
                          onChange={(e) => setPoolSearch(e.target.value)}
                        />
                      </div>

                      <div className="max-h-56 space-y-1 overflow-y-auto p-2">
                        {(() => {
                          const query = poolSearch.trim().toLowerCase();
                          const inProgram = new Set(
                            (openProgramRecord
                              ? parseTrackerProgramMeta(openProgramRecord)
                                  .startups
                              : []
                            ).map((s) => s?.entreprenuerUuid),
                          );
                          const rows = pool.filter((user) => {
                            if (!query) return true;
                            const business =
                              user?.Business || user?.business || null;
                            return [business?.name, user?.name, user?.email]
                              .filter(Boolean)
                              .some((field) =>
                                String(field).toLowerCase().includes(query),
                              );
                          });

                          if (rows.length === 0)
                            return (
                              <p className="px-2 py-6 text-center text-sm text-slate-500">
                                No startups match that search.
                              </p>
                            );

                          return rows.slice(0, 60).map((user) => {
                            const business =
                              user?.Business || user?.business || null;
                            const label =
                              business?.name || user?.name || "Unnamed startup";
                            const picked =
                              addForm.entreprenuerUuid === user.uuid;
                            const already = inProgram.has(user.uuid) && !picked;
                            return (
                              <button
                                key={user.uuid}
                                type="button"
                                onClick={() => {
                                  pickPoolStartup(user);
                                  setPoolOpen(false);
                                  setPoolSearch("");
                                }}
                                className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                                  picked
                                    ? "bg-[#082d77]/10 font-bold text-[#082d77]"
                                    : "hover:bg-slate-50"
                                }`}
                              >
                                <span className="min-w-0 truncate font-semibold text-slate-900">
                                  {label}
                                </span>
                                {already && (
                                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">
                                    In this program
                                  </span>
                                )}
                              </button>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Step 2 — what the BDA knows about them. */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <AddFieldLabel>Enterprise name *</AddFieldLabel>
                  <input
                    className={addInputClass}
                    placeholder="e.g. Libe Green Innovation Co. Ltd"
                    value={addForm.name}
                    onChange={(e) => setAddField("name", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <AddFieldLabel>Category</AddFieldLabel>
                  <select
                    className={addInputClass}
                    value={addForm.category}
                    onChange={(e) => setAddField("category", e.target.value)}
                  >
                    <option value="">Not set</option>
                    {programCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <AddFieldLabel>CE sector</AddFieldLabel>
                  <select
                    className={addInputClass}
                    value={addForm.ceSector}
                    onChange={(e) => setAddField("ceSector", e.target.value)}
                  >
                    <option value="">Not set</option>
                    {Array.from(
                      new Set(
                        [addForm.ceSector, ...CE_SECTORS].filter(Boolean),
                      ),
                    ).map((sector) => (
                      <option key={sector} value={sector}>
                        {sector}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <AddFieldLabel>Assigned BDA</AddFieldLabel>
                  <input
                    className={addInputClass}
                    value={userDetails?.name || "You"}
                    disabled
                    readOnly
                  />
                </div>
                <div>
                  <AddFieldLabel>District</AddFieldLabel>
                  <select
                    className={addInputClass}
                    value={addForm.district}
                    onChange={(e) => setAddField("district", e.target.value)}
                  >
                    <option value="">Not set</option>
                    {Array.from(
                      new Set([addForm.district, ...DISTRICTS].filter(Boolean)),
                    ).map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <AddFieldLabel>Lead contact</AddFieldLabel>
                  <input
                    className={addInputClass}
                    placeholder="Contact person"
                    value={addForm.leadContact}
                    onChange={(e) => setAddField("leadContact", e.target.value)}
                  />
                </div>
                <div>
                  <AddFieldLabel>Grant amount (USD)</AddFieldLabel>
                  <input
                    className={addInputClass}
                    type="number"
                    min="0"
                    placeholder="0"
                    value={addForm.grantUsd}
                    onChange={(e) => setAddField("grantUsd", e.target.value)}
                    // The grant is the finance officer's figure — shown, not
                    // editable, once they have recorded one.
                    disabled={Boolean(financeGrant)}
                    readOnly={Boolean(financeGrant)}
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    {financeGrant
                      ? `From the finance officer's record on ${financeGrant.program?.title || "this program"}.`
                      : "Finance has not recorded a grant for this startup yet."}
                  </p>
                </div>
                <div>
                  <AddFieldLabel>Award date</AddFieldLabel>
                  <input
                    className={addInputClass}
                    type="date"
                    value={addForm.awardDate}
                    onChange={(e) => setAddField("awardDate", e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <AddFieldLabel>Business description</AddFieldLabel>
                  <textarea
                    className={`${addInputClass} min-h-[110px]`}
                    placeholder="Brief description of the business model and CE contribution..."
                    value={addForm.description}
                    onChange={(e) => setAddField("description", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-5">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                disabled={isAdding}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isAdding}
                className="rounded-xl bg-[#082d77] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#061f54] disabled:opacity-60"
              >
                {isAdding ? "Saving..." : "Save startup"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default BdaCoachingSessions;
