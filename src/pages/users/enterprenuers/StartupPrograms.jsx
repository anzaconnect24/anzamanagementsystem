"use client";

import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import Loader from "@/components/common/Loader";
import {
  getCohortPrograms,
  createCohortProgram,
  updateCohortProgram,
  deleteCohortProgram,
  UNASSIGNED_PROGRAM_KEY,
} from "@/controllers/cohort_controller";
import { uploadFile } from "@/controllers/file_upload_controller";
import { UserContext } from "../../../layouts/DashboardLayout";
import {
  PROGRAM_CATEGORIES,
  UNCATEGORISED_LABEL,
} from "@/constants/programCategories";
import {
  FaLayerGroup,
  FaUsers,
  FaSearch,
  FaArrowRight,
  FaRegFolderOpen,
  FaPlus,
  FaExclamationTriangle,
  FaArrowLeft,
} from "react-icons/fa";

const DEFAULT_PROGRAM_IMAGE = "/images/ideation-classes.svg";

const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-GB");
};

// Only Admin creates programs or edits their details.
const CAN_EDIT_ROLES = ["Admin"];

// <input type="date"> needs YYYY-MM-DD; the API returns DATEONLY or null.
const toDateInput = (value) => (value ? String(value).slice(0, 10) : "");

const emptyDetails = {
  title: "",
  programCategory: PROGRAM_CATEGORIES[0],
  description: "",
  startDate: "",
  endDate: "",
  image: "",
};

const StartupPrograms = () => {
  const navigate = useNavigate();
  const { category } = useParams();
  const { userDetails } = useContext(UserContext);
  const canEdit = CAN_EDIT_ROLES.includes(userDetails?.role);

  // Second level of Startups: the programs inside one category.
  const activeCategory = decodeURIComponent(category || "");
  const isUncategorised = activeCategory === UNCATEGORISED_LABEL;

  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState([]);
  const [unassignedCount, setUnassignedCount] = useState(0);
  const [keyword, setKeyword] = useState("");

  // Programme details editor
  const [editing, setEditing] = useState(null);
  const [details, setDetails] = useState(emptyDetails);
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleting, setDeleting] = useState(null);
  const [removing, setRemoving] = useState(false);

  const loadPrograms = ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);

    return getCohortPrograms()
      .then(({ programs: list, unassignedCount: unassigned }) => {
        setPrograms(list);
        setUnassignedCount(unassigned);
      })
      .catch(() => {
        toast.error("Failed to load programs");
        setPrograms([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPrograms();
  }, []);

  const openEditor = (event, program) => {
    // The tile itself navigates into the program; editing must not.
    event.stopPropagation();

    setEditing(program);
    setDetails({
      title: program.title || "",
      programCategory: program.category || PROGRAM_CATEGORIES[0],
      description: program.description || "",
      startDate: toDateInput(program.startDate),
      endDate: toDateInput(program.endDate),
      image: program.image || "",
    });
    setImageFile(null);
  };

  // A new cohort. `editing` holds the sentinel "new" so the same modal serves
  // both paths.
  const openCreator = () => {
    setEditing("new");
    setDetails({
      ...emptyDetails,
      // Default to the category being browsed, so adding from inside a
      // category lands the program there.
      programCategory: PROGRAM_CATEGORIES.includes(activeCategory)
        ? activeCategory
        : PROGRAM_CATEGORIES[0],
    });
    setImageFile(null);
  };

  const closeEditor = () => {
    setEditing(null);
    setDetails(emptyDetails);
    setImageFile(null);
  };

  const openDeleteConfirm = (event, program) => {
    // The tile navigates into the program; deleting must not.
    event.stopPropagation();
    setDeleting(program);
  };

  const confirmDelete = async () => {
    setRemoving(true);

    try {
      const response = await deleteCohortProgram(deleting.uuid);

      // deleteProgram resolves to the response body on success and to the
      // axios error response on failure.
      if (response?.status === false || typeof response?.status === "number") {
        toast.error(response?.message || "Failed to delete program");
        return;
      }

      toast.success("Program deleted");
      setDeleting(null);
      await loadPrograms({ quiet: true });
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete program");
    } finally {
      setRemoving(false);
    }
  };

  const saveDetails = async () => {
    const isNew = editing === "new";

    if (isNew && !details.title.trim()) {
      toast.error("Program name is required");
      return;
    }

    if (
      details.startDate &&
      details.endDate &&
      details.startDate > details.endDate
    ) {
      toast.error("Start date cannot be after end date");
      return;
    }

    setSaving(true);

    try {
      let image = details.image;

      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        const uploaded = await uploadFile(formData);

        if (typeof uploaded !== "string" || !uploaded) {
          toast.error("Image upload failed. Nothing was saved.");
          return;
        }

        image = uploaded;
      }

      const payload = {
        description: details.description,
        startDate: details.startDate || null,
        endDate: details.endDate || null,
        image: image || DEFAULT_PROGRAM_IMAGE,
        // Editable on an existing program too — it decides which category
        // tile the program appears under.
        category: details.programCategory,
      };

      const response = isNew
        ? await createCohortProgram({
            ...payload,
            title: details.title.trim(),
          })
        : await updateCohortProgram(editing.uuid, payload);

      if (response?.status !== true) {
        toast.error(
          response?.message ||
            (isNew
              ? "Failed to create program"
              : "Failed to save program details"),
        );
        return;
      }

      toast.success(isNew ? "Program created" : "Program details saved");
      closeEditor();
      await loadPrograms({ quiet: true });
    } catch (error) {
      console.error(error);
      toast.error(
        isNew ? "Failed to create program" : "Failed to save details",
      );
    } finally {
      setSaving(false);
    }
  };

  const openProgram = (uuid) =>
    navigate(`/dashboard/programManagement/program/${uuid}`);

  // Only this category's programs. "Uncategorised" collects anything whose
  // category is missing or not one of the three.
  const categoryPrograms = programs.filter((program) =>
    isUncategorised
      ? !PROGRAM_CATEGORIES.includes(program.category || "")
      : (program.category || "") === activeCategory,
  );

  const search = keyword.trim().toLowerCase();
  const visiblePrograms = search
    ? categoryPrograms.filter((program) =>
        String(program.title || "")
          .toLowerCase()
          .includes(search),
      )
    : categoryPrograms;

  const totalInPrograms = categoryPrograms.reduce(
    (sum, program) => sum + (program.startupCount || 0),
    0,
  );

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen px-6 py-4">
      <button
        type="button"
        onClick={() => navigate("/dashboard/programManagement")}
        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[#082d77] transition hover:text-blue-700"
      >
        <FaArrowLeft /> Back to categories
      </button>

      {/* HERO */}
      <div className="relative mb-10 min-h-[320px] overflow-hidden rounded-2xl bg-black shadow-sm">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/mentor_hero.svg')" }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-[#c9672b]/30" />

        <div className="relative z-10 max-w-3xl p-10 text-white">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-sm font-medium shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#f08a3c]" />
            Program Category
          </span>

          <h2 className="mb-3 text-4xl font-bold leading-tight drop-shadow-lg">
            {activeCategory || "Programs"}
          </h2>

          <p className="mb-6 text-lg text-white/85 drop-shadow-md">
            {isUncategorised
              ? "These programs still need a category. Open one to set it."
              : "Pick a program to see the startups taking part in it."}
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-white/85">
            <span className="flex items-center gap-2">
              <FaLayerGroup />
              {categoryPrograms.length} Programs
            </span>

            <span className="flex items-center gap-2">
              <FaUsers />
              {totalInPrograms} Startups enrolled
            </span>

            <span className="flex items-center gap-2">
              <FaRegFolderOpen />
              {unassignedCount} Unassigned
            </span>
          </div>
        </div>
      </div>

      {/* SEARCH + ALL STARTUPS */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="relative min-w-[260px] flex-1">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8f98]" />
          <input
            type="text"
            placeholder="Search programs..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full rounded-md border border-black/10 bg-white px-4 py-3 pl-10 text-sm text-[#172033] outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {canEdit && (
            <button
              type="button"
              onClick={openCreator}
              className="inline-flex items-center gap-2 rounded-lg bg-[#16a34a] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#15803d] hover:shadow-md active:scale-[0.98]"
            >
              <FaPlus className="text-base text-green-100" />
              Add Program
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate("/dashboard/enterprenuers")}
            className="inline-flex items-center gap-2 rounded-lg bg-[#082d77] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md active:scale-[0.98]"
          >
            <FaUsers className="text-lg text-blue-200" />
            View all startups
          </button>
        </div>
      </div>

      {/* PROGRAM TILES */}
      {visiblePrograms.length === 0 && unassignedCount === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          {search
            ? "No programs match that search."
            : "No programs yet. Create one from the Programs area to start grouping startups."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visiblePrograms.map((program) => {
            const count = program.startupCount || 0;

            return (
              <div
                key={program.uuid}
                onClick={() => openProgram(program.uuid)}
                className="group cursor-pointer overflow-hidden rounded-xl bg-white shadow-md transition duration-200 hover:scale-[1.02] hover:shadow-lg"
              >
                <div className="relative h-40 overflow-hidden bg-black">
                  <img
                    src={program.image || DEFAULT_PROGRAM_IMAGE}
                    alt={program.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  <span className="absolute bottom-4 left-4 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 shadow-sm">
                    {program.category || "Program"}
                  </span>

                </div>

                <div className="flex min-h-[190px] flex-col p-5">
                  <h3 className="mb-2 line-clamp-2 text-lg font-bold text-[#111827]">
                    {program.title}
                  </h3>

                  <p className="mb-3 line-clamp-2 text-sm leading-6 text-[#6f6f72]">
                    {program.description || "No description yet."}
                  </p>

                  <div className="mb-4 flex items-center gap-2 text-sm text-[#6f6f72]">
                    <FaUsers className="shrink-0" />
                    <span>
                      {count} {count === 1 ? "startup" : "startups"}
                    </span>
                  </div>

                  {/* mb-4 keeps the dates off the footer divider when the
                      card is full height and mt-auto adds nothing. */}
                  <div className="mb-4 grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-2.5">
                      <p className="font-bold tracking-wide text-slate-400">
                        Start
                      </p>
                      <p className="mt-1 font-black text-slate-950">
                        {formatDate(program.startDate)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-2.5">
                      <p className="font-bold tracking-wide text-slate-400">
                        End
                      </p>
                      <p className="mt-1 font-black text-slate-950">
                        {formatDate(program.endDate)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-2 border-t border-black/10 pt-4 text-xs text-[#8a8f98]">
                    {canEdit ? (
                      <div className="flex items-center gap-3 font-bold">
                        <button
                          type="button"
                          onClick={(event) => openEditor(event, program)}
                          className="text-slate-500 transition hover:text-[#082d77]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={(event) => openDeleteConfirm(event, program)}
                          className="text-rose-600 transition hover:text-rose-700"
                        >
                          Delete
                        </button>
                      </div>
                    ) : (
                      <span className="flex items-center gap-1">
                        <FaLayerGroup />
                        Cohort
                      </span>
                    )}

                    <span className="flex items-center gap-1 font-semibold text-green-700">
                      View startups <FaArrowRight />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Startups not yet placed in any program. */}
          {unassignedCount > 0 && (
            <div
              onClick={() => openProgram(UNASSIGNED_PROGRAM_KEY)}
              className="group flex cursor-pointer flex-col overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-white p-5 shadow-sm transition duration-200 hover:scale-[1.02] hover:border-slate-400 hover:shadow-lg"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <FaRegFolderOpen className="text-xl" />
              </div>

              <h3 className="mb-2 text-lg font-bold text-[#111827]">
                Unassigned
              </h3>

              <p className="mb-4 text-sm text-[#6f6f72]">
                Startups that are not part of any program yet.
              </p>

              <div className="mb-4 flex items-center gap-2 text-sm text-[#6f6f72]">
                <FaUsers className="shrink-0" />
                <span>
                  {unassignedCount}{" "}
                  {unassignedCount === 1 ? "startup" : "startups"}
                </span>
              </div>

              <div className="mt-auto flex items-center justify-end border-t border-black/10 pt-4 text-xs font-semibold text-green-700">
                <span className="flex items-center gap-1">
                  View startups <FaArrowRight />
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DELETE CONFIRMATION (Admin) */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6">
            <div className="mb-4 flex items-start gap-3">
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                <FaExclamationTriangle />
              </span>

              <div>
                <h3 className="text-xl font-semibold text-[#111827]">
                  Delete {deleting.title}?
                </h3>
                <p className="mt-1 text-sm text-[#64748b]">
                  This cannot be undone.
                </p>
              </div>
            </div>

            {deleting.startupCount > 0 ? (
              <p className="mb-5 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {deleting.startupCount}{" "}
                {deleting.startupCount === 1 ? "startup is" : "startups are"} in
                this program. They will move to <strong>Unassigned</strong> —
                the startups themselves are not deleted.
              </p>
            ) : (
              <p className="mb-5 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
                No startups are in this program.
              </p>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleting(null)}
                className="rounded-lg border border-black/15 px-5 py-2 font-medium text-[#334155]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={removing}
                className="rounded-lg bg-rose-600 px-5 py-2 font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
              >
                {removing ? "Deleting..." : "Delete program"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROGRAM DETAILS EDITOR (Admin) */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white p-6">
            <h3 className="mb-1 text-2xl font-semibold text-[#111827]">
              {editing === "new" ? "Add Program" : editing.title}
            </h3>
            <p className="mb-5 text-sm text-[#64748b]">
              {editing === "new"
                ? "Startups can pick this program at sign-up and in Edit Profile as soon as it is saved."
                : "Program details. Its startups are managed on the program page."}
            </p>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {editing === "new" && (
                <>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-[#475569]">
                      Program name *
                    </label>
                    <input
                      className="w-full rounded-lg border border-[#b7c5e5] px-3 py-2"
                      value={details.title}
                      onChange={(e) =>
                        setDetails((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="e.g. Pesatech Accelerator 4"
                    />
                  </div>
                </>
              )}

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-[#475569]">
                  Category *
                </label>
                <select
                  className="w-full rounded-lg border border-[#b7c5e5] px-3 py-2 pr-10"
                  value={details.programCategory}
                  onChange={(e) =>
                    setDetails((prev) => ({
                      ...prev,
                      programCategory: e.target.value,
                    }))
                  }
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
                  Cover image
                </label>

                <div className="flex items-center gap-4">
                  <img
                    src={
                      imageFile
                        ? URL.createObjectURL(imageFile)
                        : details.image || DEFAULT_PROGRAM_IMAGE
                    }
                    alt={`${editing === "new" ? "New program" : editing.title} cover`}
                    className="h-20 w-32 shrink-0 rounded-lg border border-slate-200 object-cover"
                  />

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-[#475569] file:mr-3 file:rounded-lg file:border-0 file:bg-[#eef2ff] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#1f3b88]"
                  />
                </div>

                {imageFile && (
                  <p className="mt-2 text-xs text-[#64748b]">
                    {imageFile.name} will be uploaded when you save.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#475569]">
                  Start date
                </label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-[#b7c5e5] px-3 py-2"
                  value={details.startDate}
                  onChange={(e) =>
                    setDetails((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#475569]">
                  End date
                </label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-[#b7c5e5] px-3 py-2"
                  value={details.endDate}
                  onChange={(e) =>
                    setDetails((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-[#475569]">
                  Description
                </label>
                <textarea
                  className="min-h-[140px] w-full rounded-lg border border-[#b7c5e5] px-3 py-2"
                  value={details.description}
                  onChange={(e) =>
                    setDetails((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="What this program is about"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeEditor}
                className="rounded-lg border border-black/15 px-5 py-2 font-medium text-[#334155]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveDetails}
                disabled={saving}
                className="rounded-lg bg-[#163b8f] px-5 py-2 font-semibold text-white disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : editing === "new"
                    ? "Create program"
                    : "Save details"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StartupPrograms;
