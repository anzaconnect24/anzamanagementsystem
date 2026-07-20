import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  addProgram,
  deleteProgram,
  editProgram,
  getPrograms,
} from "@/controllers/program_controller";
import { assignEntreprenuerToStaff } from "@/controllers/staffEntreprenuerController";
import { getEnterprenuers, getReviewers } from "@/controllers/user_controller";
import { isTrackerProgram } from "@/utils/programMeta";

const PROGRAM_CATEGORIES = [
  "Ideation",
  "Business Foundation",
  "Investment Readiness",
];

const DEFAULT_PROGRAM_IMAGE = "/images/ideation-classes.svg";
const TRACKER_CATEGORIES_MARKER = "__TRACKER_CATEGORIES__:";
const TRACKER_STARTUPS_MARKER = "__TRACKER_STARTUPS__:";

const emptyForm = {
  title: "",
  description: "",
  programCategory: "Ideation",
  categories: ["Ideation"],
  startDate: "",
  endDate: "",
  startups: [],
};

const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-GB");
};

const isApiSuccess = (response) => {
  if (response?.status === true) return true;
  if (response?.data?.status === true) return true;
  return false;
};

const getApiMessage = (response, fallbackMessage) => {
  return (
    response?.message ||
    response?.data?.message ||
    response?.response?.data?.message ||
    fallbackMessage
  );
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

// Read a marker's single-line JSON value out of a program description.
const parseMarkerJson = (text, marker) => {
  const idx = text.lastIndexOf(marker);
  if (idx === -1) return [];
  const line = text
    .slice(idx + marker.length)
    .split("\n")[0]
    .trim();
  try {
    const value = JSON.parse(line);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

const parseTrackerProgramMeta = (program) => {
  const rawDescription = String(program?.description || "");
  const indices = [
    rawDescription.indexOf(TRACKER_CATEGORIES_MARKER),
    rawDescription.indexOf(TRACKER_STARTUPS_MARKER),
  ].filter((i) => i >= 0);
  const firstMarker = indices.length ? Math.min(...indices) : -1;
  const cleanDescription =
    firstMarker === -1
      ? rawDescription
      : rawDescription.slice(0, firstMarker).trim();

  const categories = normalizeCategories([
    ...parseMarkerJson(rawDescription, TRACKER_CATEGORIES_MARKER),
    program?.programCategory,
  ]);
  const startups = parseMarkerJson(rawDescription, TRACKER_STARTUPS_MARKER);

  return { cleanDescription, categories, startups };
};

// Encode categories + selected startups into the description. STARTUPS is
// written before CATEGORIES so the legacy categories parser (lastIndexOf) is
// unaffected.
const buildDescriptionWithMeta = (description, categories, startups) => {
  const cleanDescription = String(description || "").trim();
  const safeCategories = normalizeCategories(categories);
  const safeStartups = Array.isArray(startups) ? startups.filter(Boolean) : [];

  return (
    `${cleanDescription}\n\n` +
    `${TRACKER_STARTUPS_MARKER}${JSON.stringify(safeStartups)}\n` +
    `${TRACKER_CATEGORIES_MARKER}${JSON.stringify(safeCategories)}`
  );
};

const TrackerPrograms = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [programs, setPrograms] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [categoryInput, setCategoryInput] = useState("");
  const [pool, setPool] = useState([]);
  const [staffs, setStaffs] = useState([]);
  const [poolSearch, setPoolSearch] = useState("");

  useEffect(() => {
    Promise.all([getEnterprenuers(1000, 1, " "), getReviewers(50, 1)])
      .then(([entrepreneurBody, staffBody]) => {
        const startupList = Array.isArray(entrepreneurBody)
          ? entrepreneurBody
          : Array.isArray(entrepreneurBody?.data)
            ? entrepreneurBody.data
            : [];
        const staffList = Array.isArray(staffBody)
          ? staffBody
          : Array.isArray(staffBody?.data)
            ? staffBody.data
            : [];

        setPool(startupList);
        setStaffs(staffList);
      })
      .catch(() => {
        setPool([]);
        setStaffs([]);
      });
  }, []);

  const toStartupMember = (item) => ({
    entreprenuerUuid: item?.uuid,
    businessUuid: item?.Business?.uuid || "",
    name: item?.Business?.name || item?.name || "Unnamed startup",
    sector:
      item?.Business?.BusinessSector?.name || item?.Business?.sector || "",
    grantUsd: "",
    disbursedAmount: "",
    grantPurpose: "",
    mentorUuid: "",
    mentorName: "",
    bdaUuid: "",
    bdaName: "",
    utilized: "",
    reportDate: "",
    disbursed: false,
    overdueReports: 0,
  });

  const isStartupSelected = (uuid) =>
    (form.startups || []).some((s) => s.entreprenuerUuid === uuid);

  const setStartupStaff = (entreprenuerUuid, staff) => {
    const staffUuid = staff?.uuid || "";
    const staffName = staff?.name || staff?.email || "";

    setForm((prev) => ({
      ...prev,
      startups: (prev.startups || []).map((startup) =>
        startup.entreprenuerUuid === entreprenuerUuid
          ? {
              ...startup,
              mentorUuid: staffUuid,
              mentorName: staffName,
              // Keep legacy BDA fields in sync for existing pages.
              bdaUuid: staffUuid,
              bdaName: staffName,
            }
          : startup,
      ),
    }));
  };

  const toggleStartup = (item) =>
    setForm((prev) => {
      const exists = (prev.startups || []).some(
        (s) => s.entreprenuerUuid === item.uuid,
      );
      return {
        ...prev,
        startups: exists
          ? prev.startups.filter((s) => s.entreprenuerUuid !== item.uuid)
          : [...(prev.startups || []), toStartupMember(item)],
      };
    });

  const loadPrograms = async () => {
    setLoading(true);
    try {
      const response = await getPrograms(1, 500);

      // Grant Management only lists grant programs (those created here, which
      // carry the tracker metadata markers). Learn-and-grow courses such as
      // BFA and Investment Readiness are excluded — they live under Classes.
      if (Array.isArray(response?.data)) {
        setPrograms(
          response.data.filter((program) => isTrackerProgram(program)),
        );
      } else {
        setPrograms([]);
      }
    } catch (error) {
      toast.error("Failed to load programs");
      setPrograms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrograms();
  }, []);

  const openCreateModal = () => {
    setEditingProgram(null);
    setForm(emptyForm);
    setCategoryInput("");
    setShowModal(true);
  };

  const openEditModal = (program) => {
    const parsedMeta = parseTrackerProgramMeta(program);
    setEditingProgram(program);
    setForm({
      title: program?.title || "",
      description: parsedMeta.cleanDescription,
      programCategory: program?.programCategory || "Ideation",
      categories:
        parsedMeta.categories.length > 0
          ? parsedMeta.categories
          : [program?.programCategory || "Ideation"],
      startDate: program?.startDate || "",
      endDate: program?.endDate || "",
      startups: Array.isArray(parsedMeta.startups) ? parsedMeta.startups : [],
    });
    setCategoryInput("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProgram(null);
    setForm(emptyForm);
    setCategoryInput("");
  };

  const addCategoryToForm = () => {
    const nextCategory = categoryInput.trim();
    if (!nextCategory) return;

    setForm((prev) => ({
      ...prev,
      categories: normalizeCategories([...prev.categories, nextCategory]),
    }));
    setCategoryInput("");
  };

  const removeCategoryFromForm = (category) => {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.filter((item) => item !== category),
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error("Program title is required");
      return;
    }

    if (!form.description.trim()) {
      toast.error("Program description is required");
      return;
    }

    if (!Array.isArray(form.categories) || form.categories.length === 0) {
      toast.error("Add at least one category for this program");
      return;
    }

    if (form.startDate && form.endDate && form.startDate > form.endDate) {
      toast.error("Start date cannot be after end date");
      return;
    }

    setSaving(true);

    const payload = {
      title: form.title.trim(),
      description: buildDescriptionWithMeta(
        form.description,
        form.categories,
        form.startups,
      ),
      programCategory: form.programCategory,
      // Explicitly mark this as a grant-management program (kept separate
      // from learn-and-grow courses on the backend).
      type: "grant",
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      image: editingProgram?.image || DEFAULT_PROGRAM_IMAGE,
    };

    try {
      let response;
      if (editingProgram?.uuid) {
        response = await editProgram(editingProgram.uuid, payload);
        if (!isApiSuccess(response)) {
          toast.error(getApiMessage(response, "Failed to update program"));
          return;
        }
        toast.success("Program updated");
      } else {
        response = await addProgram(payload);
        if (!isApiSuccess(response)) {
          toast.error(getApiMessage(response, "Failed to create program"));
          return;
        }
        toast.success("Program created");
      }

      const assignmentTargets = (form.startups || []).filter(
        (startup) => startup?.entreprenuerUuid && startup?.bdaUuid,
      );

      if (assignmentTargets.length > 0) {
        const assignmentResults = await Promise.allSettled(
          assignmentTargets.map((startup) =>
            assignEntreprenuerToStaff({
              staff_uuid: startup.bdaUuid,
              entreprenuer_uuid: startup.entreprenuerUuid,
            }),
          ),
        );

        const failedAssignments = assignmentResults.filter(
          (result) => result.status === "rejected",
        );

        if (failedAssignments.length > 0) {
          toast.error(
            "Program saved, but some BDA assignments failed to sync.",
          );
        }
      }

      closeModal();
      loadPrograms();
    } catch (error) {
      toast.error("Failed to save program");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (program) => {
    const shouldDelete = window.confirm(
      `Delete program \"${program?.title || "this program"}\"?`,
    );

    if (!shouldDelete) return;

    try {
      const response = await deleteProgram(program.uuid);
      if (response?.status === false || response?.data?.status === false) {
        toast.error(getApiMessage(response, "Failed to delete program"));
        return;
      }
      toast.success("Program deleted");
      loadPrograms();
    } catch (error) {
      toast.error("Failed to delete program");
    }
  };

  return (
    <div className="space-y-6 bg-[#eef2f8] px-6 py-6">
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
            Tracker Programs
          </h1>
          <p className="mt-3 text-sm leading-7 text-white/85 md:text-base">
            Manage BDA-tracker programs used in enterprise enrollment.
          </p>
        </div>
      </section>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/70">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-black tracking-tight text-slate-950">
            Available Programs
          </h2>
          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-xl bg-[#16a34a] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#15803d]"
          >
            + Add Program
          </button>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
            Loading programs...
          </div>
        ) : programs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
            No programs yet. Click Add Program to create one.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {programs.map((program) => {
              const parsedMeta = parseTrackerProgramMeta(program);

              return (
                <article
                  key={program.uuid}
                  className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#082d77]/10"
                >
                  <div className="flex-1 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-black tracking-tight text-slate-950">
                        {program.title}
                      </h3>
                      <span className="shrink-0 rounded-full bg-[#082d77]/5 px-3 py-1 text-xs font-bold text-[#082d77]">
                        {program.programCategory || "N/A"}
                      </span>
                    </div>

                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
                      {parsedMeta.cleanDescription ||
                        "No description provided."}
                    </p>

                    {parsedMeta.categories.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {parsedMeta.categories.map((category) => (
                          <span
                            key={`${program.uuid}-${category}`}
                            className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600"
                          >
                            {category}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                        <p className="text-xs font-bold tracking-wide text-slate-400">
                          Start
                        </p>
                        <p className="mt-1 text-sm font-black text-slate-950">
                          {formatDate(program.startDate)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                        <p className="text-xs font-bold tracking-wide text-slate-400">
                          End
                        </p>
                        <p className="mt-1 text-sm font-black text-slate-950">
                          {formatDate(program.endDate)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-5 py-3">
                    <div className="flex items-center gap-3 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => openEditModal(program)}
                        className="text-slate-500 transition hover:text-[#082d77]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(program)}
                        className="text-rose-600 transition hover:text-rose-700"
                      >
                        Delete
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/dashboard/trackerPrograms/${program.uuid}/details`,
                        )
                      }
                      className="flex items-center gap-1.5 text-sm font-bold text-emerald-600 transition hover:text-emerald-700"
                    >
                      View Details <span aria-hidden>&rarr;</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4 md:p-6">
          <form
            onSubmit={onSubmit}
            className="mx-auto my-4 w-full max-w-2xl rounded-2xl bg-white p-6 md:my-8 md:max-h-[88vh] md:overflow-y-auto"
          >
            <h3 className="mb-4 text-2xl font-semibold text-[#111827]">
              {editingProgram ? "Edit Program" : "Add Program"}
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-[#475569]">
                  Title *
                </label>
                <input
                  className="w-full rounded-lg border border-[#b7c5e5] px-3 py-2"
                  value={form.title}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Program title"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#475569]">
                  Program group *
                </label>
                <select
                  className="w-full rounded-lg border border-[#b7c5e5] px-3 py-2 pr-10"
                  value={form.programCategory}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      programCategory: e.target.value,
                    }))
                  }
                  required
                >
                  {PROGRAM_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-[#475569]">
                  Categories in this program *
                </label>
                <div className="flex gap-2">
                  <input
                    className="w-full rounded-lg border border-[#b7c5e5] px-3 py-2"
                    value={categoryInput}
                    onChange={(e) => setCategoryInput(e.target.value)}
                    placeholder="Add category and click Add"
                  />
                  <button
                    type="button"
                    onClick={addCategoryToForm}
                    className="rounded-lg border border-[#d0d7e8] px-4 py-2 text-sm font-semibold text-[#1f3b88]"
                  >
                    Add
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {form.categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => removeCategoryFromForm(category)}
                      className="rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-semibold text-[#1f3b88]"
                    >
                      {category} x
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#475569]">
                  Timeline start
                </label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-[#b7c5e5] px-3 py-2"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, startDate: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#475569]">
                  Timeline end
                </label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-[#b7c5e5] px-3 py-2"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-[#475569]">
                  Description *
                </label>
                <textarea
                  className="min-h-[120px] w-full rounded-lg border border-[#b7c5e5] px-3 py-2"
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Program description"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-[#475569]">
                  Startups in this program ({(form.startups || []).length}{" "}
                  selected)
                </label>
                <input
                  className="mb-2 w-full rounded-lg border border-[#b7c5e5] px-3 py-2"
                  placeholder="Search startups from the pool..."
                  value={poolSearch}
                  onChange={(e) => setPoolSearch(e.target.value)}
                />
                <div className="max-h-56 space-y-1 overflow-auto rounded-lg border border-[#b7c5e5] p-2">
                  {pool.length === 0 && (
                    <p className="p-2 text-sm text-[#64748b]">
                      No startups available in the pool.
                    </p>
                  )}
                  {pool
                    .filter((item) => {
                      const name = (
                        item?.Business?.name ||
                        item?.name ||
                        ""
                      ).toLowerCase();
                      return (
                        !poolSearch || name.includes(poolSearch.toLowerCase())
                      );
                    })
                    .map((item) => {
                      const selectedStartup = (form.startups || []).find(
                        (startup) => startup.entreprenuerUuid === item.uuid,
                      );
                      const selectedStaffUuid =
                        selectedStartup?.mentorUuid ||
                        selectedStartup?.bdaUuid ||
                        "";

                      return (
                        <div
                          key={item.uuid}
                          className="rounded-md border border-transparent px-2 py-2 text-sm hover:border-[#dbe5ff] hover:bg-[#f8faff]"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <label className="flex cursor-pointer items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isStartupSelected(item.uuid)}
                                onChange={() => toggleStartup(item)}
                              />
                              <span className="font-medium text-[#111827]">
                                {item?.Business?.name ||
                                  item?.name ||
                                  "Unnamed startup"}
                              </span>
                              {item?.email && (
                                <span className="text-xs text-[#64748b]">
                                  {item.email}
                                </span>
                              )}
                            </label>

                            <select
                              className="min-w-[210px] rounded-lg border border-[#d0d7e8] bg-white px-2 py-1.5 text-xs text-[#334155] disabled:bg-[#f8fafc] disabled:text-[#94a3b8]"
                              value={selectedStaffUuid}
                              disabled={!selectedStartup}
                              onChange={(e) => {
                                const staff = staffs.find(
                                  (staffItem) =>
                                    staffItem.uuid === e.target.value,
                                );
                                setStartupStaff(item.uuid, staff || null);
                              }}
                            >
                              <option value="">Assign BDA</option>
                              {staffs.map((staffItem) => (
                                <option
                                  key={staffItem.uuid}
                                  value={staffItem.uuid}
                                >
                                  {staffItem.name ||
                                    staffItem.email ||
                                    "Unnamed staff"}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-black/15 px-5 py-2 font-medium text-[#334155]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-[#163b8f] px-5 py-2 font-semibold text-white disabled:opacity-60"
              >
                {saving
                  ? editingProgram
                    ? "Updating..."
                    : "Saving..."
                  : editingProgram
                    ? "Update Program"
                    : "Save Program"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default TrackerPrograms;
