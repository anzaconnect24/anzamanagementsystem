import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  ShieldCheck,
  User,
  Building2,
  FileText,
  UploadCloud,
  Eye,
  ArrowLeft,
} from "lucide-react";
import Loader from "@/components/common/Loader";
import { UserContext } from "@/layouts/DashboardLayout";
import { getStaffAssignedEntreprenuers } from "@/controllers/staffEntreprenuerController";
import { getPrograms } from "@/controllers/program_controller";
import {
  getMentorEnterpriseDetails,
  upsertMentorEnterprise,
  updateMentorEnterprise,
  getEntrepreneurTrackerDashboard,
  updateEntrepreneurEnterpriseKyc,
} from "@/controllers/trackerController";
import { uploadFile } from "@/controllers/file_upload_controller";
import { getBusiness } from "@/controllers/business_controller";
import { getCatalog, getCurrentAssessment } from "@/controllers/crat_controller";

// Fix Leaflet default marker icons (bundlers strip the relative asset paths).
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const DEFAULT_CENTER = [-6.369, 34.8888]; // Tanzania
const DEFAULT_ZOOM = 6;
const HERO_IMAGE_URL = "/images/mentor_hero.svg";

const REGIONS = [
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
  "Metal scraps aggregation",
  "Agriculture",
  "Retail",
  "Manufacturing",
  "Technology",
  "Services",
  "Education",
  "Healthcare",
];

const GENDERS = ["Female", "Male", "Other"];

const DOCUMENTS = [
  "Certificate of Incorporation",
  "TIN Certificate",
  "Memorandum & Articles of Association",
  "Shareholding Structure",
  "Founder IDs",
  "Pitch Deck",
  "Business Plan",
  "12–24 Month Financial Projections",
  "Last 6 Months Bank Statements",
  "Budget showing how the grant will be used",
  "Milestone-based implementation plan",
  "Key team CVs",
];

// Each required grant document is mapped from the CRAT assessment's
// "required attachments". Every catalog question declares the document(s)
// it requires (requiredAttachment / requiredAttachments) and the
// entrepreneur uploads files against it; we reuse those files here so a
// document already provided in CRAT shows up automatically.
const parseListValue = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    const raw = value.trim();
    if (!raw) return [];
    if (raw.startsWith("[")) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item || "").trim()).filter(Boolean);
        }
      } catch (_) {
        // fall through to delimiter parsing
      }
    }
    return raw
      .split(/[\n;]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const getQuestionRequiredAttachments = (question) => {
  const list = parseListValue(question?.requiredAttachments);
  if (list.length) return list;
  return parseListValue(question?.requiredAttachment);
};

// Build [{ label, url }] pairing each required-attachment label with the
// file the entrepreneur uploaded for that catalog question.
const buildCratAttachmentMap = (catalog, current) => {
  const attachmentsByQuestion = {};
  (current?.answers || []).forEach((answer) => {
    attachmentsByQuestion[answer.questionId] = parseListValue(
      answer.attachments || answer.attachment || answer.evidence,
    );
  });

  const entries = [];
  const domains = catalog?.domains || {};
  Object.values(domains).forEach((questionList) => {
    (Array.isArray(questionList) ? questionList : []).forEach((question) => {
      const labels = getQuestionRequiredAttachments(question);
      const attachments = attachmentsByQuestion[question.id] || [];
      if (!labels.length || !attachments.length) return;
      labels.forEach((label, index) => {
        const url = attachments[index] || attachments[0];
        if (url) entries.push({ label, url });
      });
    });
  });
  return entries;
};

const normalizeLabel = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const findCratAttachment = (documentName, entries) => {
  const target = normalizeLabel(documentName);
  if (!target) return null;
  const exact = entries.find((entry) => normalizeLabel(entry.label) === target);
  if (exact) return exact;
  return (
    entries.find((entry) => {
      const label = normalizeLabel(entry.label);
      return label && (label.includes(target) || target.includes(label));
    }) || null
  );
};

const TRACKER_CATEGORIES_MARKER = "__TRACKER_CATEGORIES__:";

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

const normalizeCategories = (categories = []) =>
  Array.from(
    new Set(
      categories
        .map((item) => String(item || "").trim())
        .filter((item) => item.length > 0),
    ),
  );

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

const formatDateForInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const parseDocuments = (value) => {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
};

const baseInputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#082d77] focus:ring-4 focus:ring-[#082d77]/20 disabled:bg-slate-50 disabled:text-slate-400";

const FieldLabel = ({ children }) => (
  <label className="mb-1.5 block text-xs font-bold tracking-wide text-slate-500">{children}</label>
);

const ProfileField = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
    <p className="text-xs font-bold tracking-wide text-slate-400">{label}</p>
    <p className="mt-1 text-sm font-bold text-slate-950">{value || "N/A"}</p>
  </div>
);

const ProfileText = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
    <p className="text-xs font-bold tracking-wide text-slate-400">{label}</p>
    <p className="mt-1 whitespace-pre-line text-sm leading-7 text-slate-600">{value || "N/A"}</p>
  </div>
);

const Card = ({ icon, title, subtitle, action, children, className = "" }) => (
  <section className={`rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/70 ${className}`}>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#082d77]/5 text-[#082d77]">
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-lg font-black tracking-tight text-slate-950">{title}</h2>
          {subtitle && <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
    <div className="mt-6">{children}</div>
  </section>
);

const MapClickHandler = ({ onSelect }) => {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const INITIAL_FORM = {
  entreprenuer_uuid: "",
  program_uuid: "",
  category: "",
  ceSector: "",
  assignedBda: "",
  grantUsd: "",
  awardDate: "",
  // Personal KYC
  firstName: "",
  lastName: "",
  representativeEmail: "",
  representativePhone: "",
  gender: "",
  nationalId: "",
  tin: "",
  // Business information
  registeredBusinessName: "",
  displayName: "",
  businessPhone: "",
  country: "TANZANIA",
  district: "",
  latitude: "",
  longitude: "",
  businessDescription: "",
  // Documents: map of document label -> uploaded file URL
  documents: {},
};

const EnterpriseKyc = ({ audience = "staff" }) => {
  const { enterpriseUuid } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userDetails } = useContext(UserContext);
  const isEntrepreneur = audience === "entrepreneur";
  const readOnly = searchParams.get("view") === "1";
  // BDA/staff viewing an assigned entrepreneur's KYC before tracking is set up.
  const viewEntrepreneurUuid =
    !isEntrepreneur && readOnly && !enterpriseUuid ? searchParams.get("entreprenuer") || "" : "";
  const isEntrepreneurKycView = Boolean(viewEntrepreneurUuid);

  // KYC (personal / business / documents) is filled by the entrepreneur only.
  // The mentor registers funding/program details and reviews KYC read-only.
  const kycEditable = isEntrepreneur && !readOnly;
  const fundingEditable = !isEntrepreneur && !readOnly && !isEntrepreneurKycView;
  const showFunding = !isEntrepreneur && !isEntrepreneurKycView;
  // Show KYC cards for the entrepreneur, an existing enterprise, or an
  // assigned-entrepreneur KYC view.
  const showKyc = isEntrepreneur || Boolean(enterpriseUuid) || isEntrepreneurKycView;
  // BDA registering a brand-new startup (Set up tracking).
  const isRegisterFlow = !isEntrepreneur && !readOnly && !enterpriseUuid;
  // `back` lets whoever opened this page say where Back should return to — the
  // Mentorship Tracker sends the BDA to the startup's sessions, not to Grant
  // Management.
  const backTarget =
    searchParams.get("back") ||
    (isEntrepreneur ? "/dashboard/myMilestones" : "/dashboard/mentorTracker");

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState("");
  const [entrepreneurs, setEntrepreneurs] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [ownEnterpriseUuid, setOwnEnterpriseUuid] = useState("");
  const [form, setForm] = useState(INITIAL_FORM);
  const [businessProfile, setBusinessProfile] = useState(null);
  // Required grant documents that were auto-filled from a CRAT attachment.
  const [cratSourced, setCratSourced] = useState({});
  // [{ label, url }] of CRAT required attachments the entrepreneur uploaded.
  const [cratAttachments, setCratAttachments] = useState([]);

  // Load the entrepreneur's CRAT catalog + assessment and pair every
  // required-attachment label with the file uploaded for it.
  useEffect(() => {
    const businessId = businessProfile?.id;
    if (!businessId) {
      setCratAttachments([]);
      return;
    }
    let active = true;
    (async () => {
      try {
        const [catalog, current] = await Promise.all([
          getCatalog(businessId),
          getCurrentAssessment(businessId),
        ]);
        if (active) setCratAttachments(buildCratAttachmentMap(catalog, current));
      } catch (_) {
        if (active) setCratAttachments([]);
      }
    })();
    return () => {
      active = false;
    };
  }, [businessProfile?.id]);

  // Reuse CRAT required attachments for any grant document that is still
  // empty, so a document already provided in CRAT shows up here
  // automatically. Manual uploads (existing or new) are never overwritten.
  useEffect(() => {
    if (!cratAttachments.length) return;
    setForm((prev) => {
      const nextDocuments = { ...prev.documents };
      const sourced = {};
      let changed = false;
      DOCUMENTS.forEach((name) => {
        if (nextDocuments[name]) return;
        const match = findCratAttachment(name, cratAttachments);
        if (match) {
          nextDocuments[name] = match.url;
          sourced[name] = true;
          changed = true;
        }
      });
      if (!changed) return prev;
      setCratSourced((current) => ({ ...current, ...sourced }));
      return { ...prev, documents: nextDocuments };
    });
  }, [cratAttachments]);

  const isEditing = isEntrepreneur ? Boolean(ownEnterpriseUuid) : Boolean(enterpriseUuid);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const assignedEntrepreneurOptions = useMemo(
    () =>
      entrepreneurs
        .filter((item) => Boolean(item?.Entreprenuer?.uuid))
        .map((item) => ({
          uuid: item.Entreprenuer.uuid,
          name: getAssignedBusinessName(item),
        })),
    [entrepreneurs],
  );

  const programOptions = useMemo(
    () =>
      programs
        .map((program) => ({ uuid: program.uuid, name: getProgramDisplayName(program) }))
        .filter((program) => Boolean(program.uuid && program.name && !isExcludedProgramStageLabel(program.name))),
    [programs],
  );

  const fillFormFromEnterprise = (enterprise, programList = []) => {
    const matchingProgram = programList.find((program) => {
      const name = getProgramDisplayName(program);
      return (
        name === getEnterpriseProgramName(enterprise) ||
        getProgramCategories(program).includes(enterprise.category)
      );
    });

    setForm({
      entreprenuer_uuid: getEnterpriseEntrepreneurUuid(enterprise) || "",
      program_uuid: matchingProgram?.uuid || "",
      category: enterprise.category || "",
      ceSector: enterprise.ceSector || "",
      assignedBda: enterprise.assignedBda || "",
      grantUsd: String(enterprise.grantUsd ?? ""),
      awardDate: formatDateForInput(enterprise.awardDate),
      firstName: enterprise.firstName || "",
      lastName: enterprise.lastName || "",
      representativeEmail: enterprise.representativeEmail || enterprise.leadContact || "",
      representativePhone: enterprise.representativePhone || "",
      gender: enterprise.gender || "",
      nationalId: enterprise.nationalId || "",
      tin: enterprise.tin || "",
      registeredBusinessName: enterprise.registeredBusinessName || enterprise.name || "",
      displayName: enterprise.displayName || enterprise.name || "",
      businessPhone: enterprise.businessPhone || "",
      country: enterprise.country || "TANZANIA",
      district: enterprise.district || "",
      latitude: enterprise.latitude != null ? String(enterprise.latitude) : "",
      longitude: enterprise.longitude != null ? String(enterprise.longitude) : "",
      businessDescription: enterprise.businessDescription || "",
      documents: parseDocuments(enterprise.documents),
    });
  };

  // Pre-fill personal/business KYC from the signup data so the entrepreneur
  // does not re-enter information already captured at registration.
  // Existing (saved) KYC values take precedence; only empty fields are filled.
  const applySignupDefaults = (user, business) => {
    if (!user && !business) return;
    const parts = String(user?.name || "").trim().split(/\s+/).filter(Boolean);
    const firstName = parts[0] || "";
    const lastName = parts.slice(1).join(" ");
    const biz = business || {};
    setForm((prev) => ({
      ...prev,
      firstName: prev.firstName || firstName,
      lastName: prev.lastName || lastName,
      representativeEmail: prev.representativeEmail || user?.email || "",
      representativePhone: prev.representativePhone || user?.phone || "",
      registeredBusinessName: prev.registeredBusinessName || biz.name || "",
      displayName: prev.displayName || biz.name || "",
      businessPhone: prev.businessPhone || biz.phone || "",
      district: prev.district || biz.location || "",
      businessDescription: prev.businessDescription || biz.description || "",
    }));
  };

  const onUploadDocument = async (name, file) => {
    if (!file) return;
    setUploadingDoc(name);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const url = await uploadFile(formData);
      if (typeof url === "string" && url.trim()) {
        setForm((prev) => ({
          ...prev,
          documents: { ...prev.documents, [name]: url.trim() },
        }));
        // A manual upload replaces any CRAT-sourced file for this document.
        setCratSourced((current) => ({ ...current, [name]: false }));
        toast.success(`${name} uploaded`);
      } else {
        toast.error("Failed to upload document");
      }
    } catch {
      toast.error("Failed to upload document");
    } finally {
      setUploadingDoc("");
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (isEntrepreneur) {
          // A tracker enterprise may not exist yet — don't let that block the
          // signup pre-fill below.
          let business = null;
          try {
            const dashboard = await getEntrepreneurTrackerDashboard({});
            const enterprise = dashboard?.enterprise;
            if (enterprise) {
              setOwnEnterpriseUuid(enterprise.uuid || "");
              fillFormFromEnterprise(enterprise);
            }
            business = enterprise?.Entreprenuer?.Business || null;
          } catch {
            // no tracker enterprise yet — fall back to signup data only
          }

          // No double entry: always pull personal/business details from signup.
          const businessUuid = userDetails?.Business?.uuid || business?.uuid;
          if (businessUuid) {
            try {
              business = await getBusiness(businessUuid);
            } catch {
              // keep whatever we already have
            }
          }
          setBusinessProfile(business);
          applySignupDefaults(userDetails, business);
        } else {
          const [ents, programsResponse, enterpriseResponse] = await Promise.all([
            userDetails?.uuid ? getStaffAssignedEntreprenuers(userDetails.uuid) : Promise.resolve([]),
            getPrograms(1, 500),
            enterpriseUuid ? getMentorEnterpriseDetails(enterpriseUuid) : Promise.resolve(null),
          ]);

          setEntrepreneurs(Array.isArray(ents) ? ents : []);
          const programList = Array.isArray(programsResponse?.data) ? programsResponse.data : [];
          setPrograms(programList);

          const enterprise = enterpriseResponse?.enterprise;
          if (enterprise) {
            fillFormFromEnterprise(enterprise, programList);
          } else if (isEntrepreneurKycView) {
            // Read-only KYC = the business details the entrepreneur entered.
            const match = (Array.isArray(ents) ? ents : []).find(
              (a) => (a?.Entreprenuer?.uuid || a?.entreprenuer_uuid) === viewEntrepreneurUuid,
            );
            const ent = match?.Entreprenuer || null;
            let business = ent?.Business || ent?.business || null;
            const businessUuid = searchParams.get("business") || business?.uuid;
            if (businessUuid) {
              try {
                business = await getBusiness(businessUuid);
              } catch {
                // keep what we have
              }
            }
            setBusinessProfile(business);
            applySignupDefaults(ent || business?.User || null, business);
          } else {
            // Pre-select the entrepreneur when arriving from "Set up tracking".
            const preselect = searchParams.get("entreprenuer");
            if (preselect) {
              setForm((prev) => ({ ...prev, entreprenuer_uuid: preselect }));
            }
          }
        }
      } catch (error) {
        toast.error(error?.response?.data?.message || "Failed to load KYC data");
        if (!isEntrepreneur && enterpriseUuid) navigate("/dashboard/mentorTracker");
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enterpriseUuid, userDetails?.uuid, isEntrepreneur]);

  const onCoordinatesText = (text) => {
    const [latRaw, lngRaw] = String(text).split(",");
    setForm((prev) => ({
      ...prev,
      latitude: latRaw !== undefined ? latRaw.trim() : "",
      longitude: lngRaw !== undefined ? lngRaw.trim() : "",
    }));
  };

  const onMapSelect = (lat, lng) => {
    setForm((prev) => ({
      ...prev,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
    }));
  };

  const onSave = async (e) => {
    e.preventDefault();
    if (isSaving) return;

    const payload = {
      ...form,
      leadContact: form.representativeEmail || form.representativePhone || form.leadContact || "",
      representativeName: `${form.firstName} ${form.lastName}`.trim(),
    };

    try {
      setIsSaving(true);

      if (isEntrepreneur) {
        await updateEntrepreneurEnterpriseKyc({ ...payload, enterpriseUuid: ownEnterpriseUuid });
        toast.success("KYC saved");
        navigate("/dashboard/myMilestones");
        return;
      }

      if (!enterpriseUuid && !form.entreprenuer_uuid) {
        toast.error("Please select the assigned entrepreneur");
        return;
      }
      if (!enterpriseUuid && !form.program_uuid) {
        toast.error("Please select the Anza program");
        return;
      }

      if (enterpriseUuid) {
        await updateMentorEnterprise(enterpriseUuid, payload);
      } else {
        await upsertMentorEnterprise(payload);
      }
      toast.success(enterpriseUuid ? "Startup updated" : "Startup registered");
      navigate("/dashboard/mentorTracker");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <Loader />;

  const lat = Number(form.latitude);
  const lng = Number(form.longitude);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng) && form.latitude !== "" && form.longitude !== "";
  const mapCenter = hasCoords ? [lat, lng] : DEFAULT_CENTER;
  const coordinatesText = form.latitude && form.longitude ? `${form.latitude}, ${form.longitude}` : "";

  const heroTitle = isEntrepreneur
    ? "Complete your KYC"
    : isEntrepreneurKycView
      ? "Entrepreneur KYC"
      : enterpriseUuid
        ? readOnly
          ? "Startup KYC"
          : "Update startup"
        : "Set up tracking";
  const heroSubtitle = readOnly
    ? "Read-only view of the entrepreneur's KYC, identity, and business details."
    : isEntrepreneur
      ? "Provide your business identity, ownership, and documents for funding verification."
      : enterpriseUuid
        ? "Update the funding and program details for this startup."
        : "Register the startup and set up funding and milestone tracking.";

  return (
    <div className="min-h-screen bg-[#f3f6fb] px-4 py-6 text-slate-950 md:px-8 xl:px-12">
      <form onSubmit={onSave} className="mx-auto max-w-[1480px] space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate(backTarget)}
            className="inline-flex items-center gap-2 text-sm font-bold text-[#082d77] transition hover:text-[#061f54]"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          {!readOnly && !isRegisterFlow && (
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-[#082d77] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#061f54] disabled:opacity-60"
            >
              {isSaving ? "Saving..." : isEntrepreneur ? "Save KYC" : "Update startup"}
            </button>
          )}
        </div>

        <section
          className="relative overflow-hidden rounded-2xl bg-slate-950 px-7 py-6 text-white shadow-sm shadow-slate-300/70 md:px-10 md:py-7"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.6) 50%, rgba(0, 0, 0, 0.2) 100%), url(${HERO_IMAGE_URL})`,
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        >
          <div className="relative z-10 min-h-[140px]">
            <div className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-bold text-white shadow-sm backdrop-blur">
              <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
              {isEntrepreneur ? "Enterprise Growth" : "Portfolio Support"}
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">{heroTitle}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/85 md:text-base">{heroSubtitle}</p>
          </div>
        </section>

        <div className={`grid grid-cols-1 gap-6 ${showKyc ? "xl:grid-cols-[1fr_360px]" : ""}`}>
          <div className="space-y-6">
            {showKyc && (
            <fieldset disabled={!kycEditable} className="contents">
            <Card
              icon={<User className="h-5 w-5" />}
              title="Personal KYC"
              subtitle="Your personal identity and verification status."
              action={
                kycEditable ? (
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#16a34a] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#15803d] disabled:opacity-60"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    {isSaving ? "Saving..." : "Save Personal Details"}
                  </button>
                ) : null
              }
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <FieldLabel>First Name</FieldLabel>
                  <input className={baseInputClass} value={form.firstName} onChange={(e) => setField("firstName", e.target.value)} placeholder="First name" />
                </div>
                <div>
                  <FieldLabel>Last Name</FieldLabel>
                  <input className={baseInputClass} value={form.lastName} onChange={(e) => setField("lastName", e.target.value)} placeholder="Last name" />
                </div>
                <div>
                  <FieldLabel>Email Address</FieldLabel>
                  <input type="email" className={baseInputClass} value={form.representativeEmail} onChange={(e) => setField("representativeEmail", e.target.value)} placeholder="name@gmail.com" />
                </div>
                <div>
                  <FieldLabel>Primary Phone</FieldLabel>
                  <input className={baseInputClass} value={form.representativePhone} onChange={(e) => setField("representativePhone", e.target.value)} placeholder="+255..." />
                </div>
                <div>
                  <FieldLabel>Gender</FieldLabel>
                  <select className={baseInputClass} value={form.gender} onChange={(e) => setField("gender", e.target.value)}>
                    <option value="">Select gender</option>
                    {GENDERS.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel>National ID</FieldLabel>
                  <input className={baseInputClass} value={form.nationalId} onChange={(e) => setField("nationalId", e.target.value)} placeholder="NIDA number" />
                </div>
                <div>
                  <FieldLabel>TRA PIN</FieldLabel>
                  <input className={baseInputClass} value={form.tin} onChange={(e) => setField("tin", e.target.value)} placeholder="TRA PIN / TIN" />
                </div>
              </div>
            </Card>

            {businessProfile && (
              <Card
                icon={<FileText className="h-5 w-5" />}
                title="Business Profile"
                subtitle="Details from the entrepreneur's business profile."
                className="mt-12"
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <ProfileField label="Business name" value={businessProfile.name} />
                  <ProfileField label="Country" value={businessProfile.country || "Tanzania"} />
                  <ProfileField label="Region" value={businessProfile.location} />
                  <ProfileField
                    label="Sector"
                    value={businessProfile.BusinessSector?.name || businessProfile.sector}
                  />
                  <ProfileField label="Stage" value={businessProfile.stage} />
                  <ProfileField label="Registration" value={businessProfile.registration} />
                  <ProfileField label="Annual revenue" value={businessProfile.revenue} />
                  <ProfileField label="Team size" value={businessProfile.team} />
                  <ProfileField label="Customers" value={businessProfile.numberOfCustomers} />
                </div>
                <div className="mt-4 space-y-3">
                  <ProfileText label="Bio" value={businessProfile.description} />
                  <ProfileText label="Problem" value={businessProfile.problem} />
                  <ProfileText label="Solution" value={businessProfile.solution} />
                  <ProfileText label="Traction" value={businessProfile.traction} />
                  <ProfileText label="Target market" value={businessProfile.market} />
                  <ProfileText label="Impact" value={businessProfile.impact} />
                  <ProfileText label="Growth plan" value={businessProfile.growthPlan} />
                  <ProfileText
                    label="Fundraising needs"
                    value={businessProfile.fundraisingNeeds}
                  />
                </div>
              </Card>
            )}
            </fieldset>
            )}

            {showFunding && (
            <fieldset disabled={!fundingEditable} className="contents">
            <Card
              icon={<FileText className="h-5 w-5" />}
              title="Program & Funding"
              subtitle="Funding context required to register this startup."
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel>Assigned entrepreneur *</FieldLabel>
                  <select
                    className={baseInputClass}
                    value={form.entreprenuer_uuid}
                    onChange={(e) => setField("entreprenuer_uuid", e.target.value)}
                    disabled={isEditing}
                    required={!isEditing}
                  >
                    <option value="">Select assigned entrepreneur</option>
                    {assignedEntrepreneurOptions.map((item) => (
                      <option key={item.uuid} value={item.uuid}>{item.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel>Anza program undergone *</FieldLabel>
                  <select
                    className={baseInputClass}
                    value={form.program_uuid}
                    onChange={(e) => {
                      const nextProgramUuid = e.target.value;
                      const nextProgram = programs.find((item) => item.uuid === nextProgramUuid) || null;
                      setForm((prev) => ({
                        ...prev,
                        program_uuid: nextProgramUuid,
                        category: getProgramDisplayName(nextProgram),
                      }));
                    }}
                    required={!isEditing}
                  >
                    <option value="">Select program</option>
                    {programOptions.map((item) => (
                      <option key={item.uuid} value={item.uuid}>{item.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel>Sector</FieldLabel>
                  <select className={baseInputClass} value={form.ceSector} onChange={(e) => setField("ceSector", e.target.value)}>
                    <option value="">Select sector</option>
                    {CE_SECTORS.map((sector) => (
                      <option key={sector} value={sector}>{sector}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel>Assigned BDA</FieldLabel>
                  <input className={baseInputClass} value={form.assignedBda} onChange={(e) => setField("assignedBda", e.target.value)} placeholder="Assigned BDA" />
                </div>
                <div>
                  <FieldLabel>Grant (TZS)</FieldLabel>
                  <input type="number" min="0" className={baseInputClass} value={form.grantUsd} onChange={(e) => setField("grantUsd", e.target.value)} placeholder="0" />
                </div>
                <div>
                  <FieldLabel>Award date</FieldLabel>
                  <input type="date" className={baseInputClass} value={formatDateForInput(form.awardDate)} onChange={(e) => setField("awardDate", e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <FieldLabel>Business description</FieldLabel>
                  <textarea className={`${baseInputClass} min-h-[110px] resize-y`} value={form.businessDescription} onChange={(e) => setField("businessDescription", e.target.value)} placeholder="Brief description of the business" />
                </div>
              </div>
            </Card>
            </fieldset>
            )}
          </div>

          {showKyc && (
          <aside>
            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/70">
              <h2 className="text-lg font-black tracking-tight text-slate-950">Documents</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                {kycEditable
                  ? "Upload clear digital copies of your official documents."
                  : "Documents submitted by the entrepreneur."}
              </p>

              <div className="mt-5 space-y-3">
                {DOCUMENTS.map((name) => {
                  const url = form.documents?.[name];
                  const isUploading = uploadingDoc === name;
                  const statusLabel = isUploading
                    ? "Uploading..."
                    : url
                      ? "Attached"
                      : "Not attached";
                  return (
                    <div
                      key={name}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#082d77]/5 text-[#082d77]">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-950">{name}</p>
                          <p
                            className={`text-[10px] font-black tracking-wide ${url ? "text-[#16a34a]" : "text-slate-400"}`}
                          >
                            {statusLabel}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {kycEditable && (
                          <label
                            className="grid h-7 w-7 cursor-pointer place-items-center rounded-lg text-[#16a34a] transition hover:bg-slate-50"
                            title={url ? "Replace" : "Upload"}
                          >
                            <UploadCloud className="h-4 w-4" />
                            <input
                              type="file"
                              className="hidden"
                              disabled={isUploading}
                              onChange={(e) => onUploadDocument(name, e.target.files?.[0])}
                            />
                          </label>
                        )}
                        {url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="grid h-7 w-7 place-items-center rounded-lg text-[#082d77] transition hover:bg-slate-50"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </a>
                        ) : (
                          <span className="grid h-7 w-7 place-items-center rounded-lg text-slate-300" title="No file">
                            <Eye className="h-4 w-4" />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </aside>
          )}
        </div>

        {isRegisterFlow && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-[#16a34a] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#15803d] disabled:opacity-60"
            >
              {isSaving ? "Registering..." : "Register startup"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default EnterpriseKyc;
