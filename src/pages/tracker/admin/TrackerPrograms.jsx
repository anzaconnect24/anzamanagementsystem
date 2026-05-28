import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  addProgram,
  deleteProgram,
  editProgram,
  getPrograms,
} from "@/controllers/program_controller";

const PROGRAM_CATEGORIES = [
  "Ideation",
  "Business Foundation",
  "Investment Readiness",
];

const DEFAULT_PROGRAM_IMAGE = "/images/ideation-classes.svg";
const TRACKER_CATEGORIES_MARKER = "__TRACKER_CATEGORIES__:";

const emptyForm = {
  title: "",
  description: "",
  programCategory: "Ideation",
  categories: ["Ideation"],
  startDate: "",
  endDate: "",
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

const parseTrackerProgramMeta = (program) => {
  const rawDescription = String(program?.description || "");
  const markerIndex = rawDescription.lastIndexOf(TRACKER_CATEGORIES_MARKER);

  if (markerIndex === -1) {
    const fallbackCategories = normalizeCategories([program?.programCategory]);
    return {
      cleanDescription: rawDescription,
      categories: fallbackCategories,
    };
  }

  const cleanDescription = rawDescription.slice(0, markerIndex).trim();
  const rawCategories = rawDescription
    .slice(markerIndex + TRACKER_CATEGORIES_MARKER.length)
    .trim();

  let parsedCategories = [];
  try {
    const parsedValue = JSON.parse(rawCategories);
    if (Array.isArray(parsedValue)) {
      parsedCategories = parsedValue;
    }
  } catch (error) {
    parsedCategories = [];
  }

  const categories = normalizeCategories([
    ...parsedCategories,
    program?.programCategory,
  ]);

  return {
    cleanDescription,
    categories,
  };
};

const buildDescriptionWithCategories = (description, categories) => {
  const cleanDescription = String(description || "").trim();
  const safeCategories = normalizeCategories(categories);

  return `${cleanDescription}\n\n${TRACKER_CATEGORIES_MARKER}${JSON.stringify(safeCategories)}`;
};

const TrackerPrograms = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [programs, setPrograms] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [categoryInput, setCategoryInput] = useState("");

  const loadPrograms = async () => {
    setLoading(true);
    try {
      const response = await getPrograms(1, 500);

      if (Array.isArray(response?.data)) {
        setPrograms(response.data);
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
      description: buildDescriptionWithCategories(
        form.description,
        form.categories,
      ),
      programCategory: form.programCategory,
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
      <div className="rounded-2xl bg-[#11358b] px-5 py-4 text-white">
        <h1 className="text-2xl font-bold">Tracker Programs</h1>
        <p className="text-sm text-white/80">
          Manage mentor-tracker programs used in enterprise enrollment.
        </p>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#111827]">
            Program List ({programs.length})
          </h2>
          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-lg bg-[#163b8f] px-4 py-2 text-sm font-semibold text-white"
          >
            Add Program
          </button>
        </div>

        {loading ? (
          <div className="rounded-xl border border-dashed border-black/20 p-6 text-sm text-black/60">
            Loading programs...
          </div>
        ) : programs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-black/20 p-6 text-sm text-black/60">
            No programs yet. Click Add Program to create one.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {programs.map((program) => {
              const parsedMeta = parseTrackerProgramMeta(program);

              return (
                <div
                  key={program.uuid}
                  className="rounded-xl border border-black/10 bg-white p-4"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="text-xl font-semibold text-[#111827]">
                      {program.title}
                    </h3>
                    <span className="rounded-full bg-[#dbe8ff] px-3 py-1 text-xs font-semibold text-[#163b8f]">
                      {program.programCategory || "N/A"}
                    </span>
                  </div>

                  <p className="mb-3 line-clamp-3 text-sm text-[#4b5563]">
                    {parsedMeta.cleanDescription || "N/A"}
                  </p>

                  <div className="mb-3 flex flex-wrap gap-2">
                    {parsedMeta.categories.map((category) => (
                      <span
                        key={`${program.uuid}-${category}`}
                        className="rounded-full bg-[#eef2ff] px-2.5 py-1 text-xs font-semibold text-[#1f3b88]"
                      >
                        {category}
                      </span>
                    ))}
                  </div>

                  <div className="mb-4 grid grid-cols-2 gap-2 text-sm text-[#374151]">
                    <div>
                      <span className="font-medium">Start:</span>{" "}
                      {formatDate(program.startDate)}
                    </div>
                    <div>
                      <span className="font-medium">End:</span>{" "}
                      {formatDate(program.endDate)}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(program)}
                      className="rounded-md border border-[#d0d7e8] px-3 py-1.5 text-sm font-medium text-[#1f3b88]"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(program)}
                      className="rounded-md bg-[#fee2e2] px-3 py-1.5 text-sm font-semibold text-[#b91c1c]"
                    >
                      Delete
                    </button>
                  </div>
                </div>
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
