import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  addProgram,
  deleteProgram,
  editProgram,
  getPrograms,
} from "@/controllers/program_controller";
import {
  getCohortPrograms,
  getCohortStartups,
} from "@/controllers/cohort_controller";
import { isGrantProgram } from "@/utils/programMeta";
import {
  buildDescriptionWithMeta,
  parseTrackerProgramMeta,
} from "@/utils/trackerProgramMarkers";

const PROGRAM_CATEGORIES = [
  "Ideation",
  "Business Foundation",
  "Investment Readiness",
];

const DEFAULT_PROGRAM_IMAGE = "/images/ideation-classes.svg";

const emptyForm = {
  // The platform program this grant tracking is for.
  cohortUuid: "",
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
  const [poolSearch, setPoolSearch] = useState("");
  const [poolLoading, setPoolLoading] = useState(false);

  // The programs that exist on the platform. Grant tracking is attached to one
  // of these rather than to a free-text title, so the startups offered below
  // are exactly that program's cohort.
  const [cohorts, setCohorts] = useState([]);
  const [cohortsLoading, setCohortsLoading] = useState(true);

  useEffect(() => {
    getCohortPrograms()
      .then(({ programs: list }) => setCohorts(list))
      .catch(() => setCohorts([]))
      .finally(() => setCohortsLoading(false));
  }, []);

  // Load the chosen program's startups. Changing the program clears any
  // startups picked from the previous one — they are not in this cohort.
  const loadCohortStartups = (cohortUuid) => {
    if (!cohortUuid) {
      setPool([]);
      return;
    }

    setPoolLoading(true);
    getCohortStartups(cohortUuid)
      .then((body) => setPool(Array.isArray(body?.data) ? body.data : []))
      .catch(() => {
        toast.error("Failed to load this program's startups");
        setPool([]);
      })
      .finally(() => setPoolLoading(false));
  };

  const selectCohort = (cohortUuid) => {
    const cohort = cohorts.find((item) => item.uuid === cohortUuid);

    setForm((prev) => ({
      ...prev,
      cohortUuid,
      // The grant program takes its name from the platform program.
      title: cohort?.title || "",
      startups: [],
    }));

    setPoolSearch("");
    loadCohortStartups(cohortUuid);
  };

  // Pool rows are Businesses (from the cohort roster), not Users.
  const toStartupMember = (item) => ({
    entreprenuerUuid: item?.User?.uuid || "",
    businessUuid: item?.uuid || "",
    name: item?.name || "Unnamed startup",
    sector: item?.BusinessSector?.name || "",
    grantUsd: "",
    disbursedAmount: "",
    grantPurpose: "",
    bdaUuid: "",
    bdaName: "",
    utilized: "",
    reportDate: "",
    disbursed: false,
    overdueReports: 0,
  });

  // Keyed on the business, which is what the cohort roster identifies.
  const isStartupSelected = (businessUuid) =>
    (form.startups || []).some((s) => s.businessUuid === businessUuid);

  const toggleStartup = (item) =>
    setForm((prev) => {
      const exists = (prev.startups || []).some(
        (s) => s.businessUuid === item.uuid,
      );
      return {
        ...prev,
        startups: exists
          ? prev.startups.filter((s) => s.businessUuid !== item.uuid)
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
        setPrograms(response.data.filter((program) => isGrantProgram(program)));
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

    // Re-scope the picker to the program this grant tracking was set up
    // against. Rows created before the cohort marker existed fall back to
    // matching the platform program by title.
    const cohortUuid =
      parsedMeta.cohortUuid ||
      cohorts.find((item) => item.title === program?.title)?.uuid ||
      "";

    setPoolSearch("");
    loadCohortStartups(cohortUuid);

    setForm({
      cohortUuid,
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

    if (!form.cohortUuid || !form.title.trim()) {
      toast.error("Select the program this grant tracking is for");
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
        form.cohortUuid,
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
          <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">Tracker Programs</h1>
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
                      {parsedMeta.cleanDescription || "No description provided."}
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
                        <p className="text-xs font-bold tracking-wide text-slate-400">Start</p>
                        <p className="mt-1 text-sm font-black text-slate-950">{formatDate(program.startDate)}</p>
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                        <p className="text-xs font-bold tracking-wide text-slate-400">End</p>
                        <p className="mt-1 text-sm font-black text-slate-950">{formatDate(program.endDate)}</p>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={onSubmit}
            className="w-full max-w-2xl rounded-2xl bg-white p-6"
          >
            <h3 className="mb-4 text-2xl font-semibold text-[#111827]">
              {editingProgram ? "Edit Program" : "Add Program"}
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-[#475569]">
                  Program *
                </label>
                <select
                  className="w-full rounded-lg border border-[#b7c5e5] px-3 py-2 pr-10"
                  value={form.cohortUuid}
                  onChange={(e) => selectCohort(e.target.value)}
                  required
                >
                  <option value="">
                    {cohortsLoading
                      ? "Loading programs..."
                      : "Select a program on the platform"}
                  </option>

                  {cohorts.map((cohort) => (
                    <option key={cohort.uuid} value={cohort.uuid}>
                      {cohort.title}
                      {cohort.startupCount
                        ? ` (${cohort.startupCount} startup${cohort.startupCount === 1 ? "" : "s"})`
                        : " (no startups yet)"}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-[#64748b]">
                  Grant tracking is set up against a program that already
                  exists on the platform. Only that program&apos;s startups can
                  be added below.
                </p>
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
                  Startups in this program ({(form.startups || []).length} selected)
                </label>
                <input
                  className="mb-2 w-full rounded-lg border border-[#b7c5e5] px-3 py-2"
                  placeholder="Search startups from the pool..."
                  value={poolSearch}
                  onChange={(e) => setPoolSearch(e.target.value)}
                />
                <div className="max-h-56 space-y-1 overflow-auto rounded-lg border border-[#b7c5e5] p-2">
                  {!form.cohortUuid && (
                    <p className="p-2 text-sm text-[#64748b]">
                      Select a program above to see its startups.
                    </p>
                  )}

                  {form.cohortUuid && poolLoading && (
                    <p className="p-2 text-sm text-[#64748b]">
                      Loading startups...
                    </p>
                  )}

                  {form.cohortUuid && !poolLoading && pool.length === 0 && (
                    <p className="p-2 text-sm text-[#64748b]">
                      No startups are in this program yet. Add them from
                      Startups &rarr; Programs first.
                    </p>
                  )}

                  {!poolLoading &&
                    pool
                      .filter((item) => {
                        const name = String(item?.name || "").toLowerCase();
                        return (
                          !poolSearch ||
                          name.includes(poolSearch.toLowerCase())
                        );
                      })
                      .map((item) => (
                        <label
                          key={item.uuid}
                          className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-[#f1f5f9]"
                        >
                          <input
                            type="checkbox"
                            checked={isStartupSelected(item.uuid)}
                            onChange={() => toggleStartup(item)}
                          />
                          <span className="font-medium text-[#111827]">
                            {item?.name || "Unnamed startup"}
                          </span>
                          {item?.email && (
                            <span className="text-xs text-[#64748b]">
                              {item.email}
                            </span>
                          )}
                        </label>
                      ))}
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
