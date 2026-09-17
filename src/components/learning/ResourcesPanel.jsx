"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaDownload, FaExternalLinkAlt, FaPlus, FaTrash } from "react-icons/fa";
import {
  RESOURCE_TYPES,
  archiveResource,
  createResource,
  getResources,
  resourceTypeLabel,
} from "@/controllers/workshop_controller";
import { getCourseOutline } from "@/controllers/lesson_controller";
import { uploadFile } from "@/controllers/file_upload_controller";
import { Field, Modal, inputClass } from "./formBits";

// Templates, guides, case studies and checklists a programme shares. A
// resource can sit at programme level or be pinned to a lesson.
const ResourcesPanel = ({ programUuid, courseUuid, canManage }) => {
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState([]);
  const [modules, setModules] = useState([]);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("all");

  const load = () => {
    setLoading(true);
    getResources(programUuid, courseUuid)
      .then((body) => setResources(Array.isArray(body?.data) ? body.data : []))
      .catch(() => toast.error("Failed to load the resources"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [programUuid, courseUuid]);

  const openForm = async () => {
    try {
      const outline = await getCourseOutline(courseUuid || programUuid);
      setModules(outline.modules || []);
    } catch {
      setModules([]);
    }

    setForm({
      title: "",
      description: "",
      type: "template",
      category: "",
      tags: "",
      url: "",
      file: null,
      useUrl: true,
      moduleUuid: "",
      downloadable: true,
    });
  };

  const save = async () => {
    if (!form.title.trim()) {
      toast.error("Give the resource a title");
      return;
    }

    if (form.useUrl ? !form.url.trim() : !form.file) {
      toast.error("Add a link or choose a file");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        type: form.type,
        category: form.category.trim() || null,
        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        moduleUuid: form.moduleUuid || undefined,
        downloadable: form.downloadable,
      };

      if (form.useUrl) {
        payload.url = form.url.trim();
      } else {
        const data = new FormData();
        data.append("file", form.file);
        payload.file = await uploadFile(data);
      }

      const response = await createResource(programUuid, {
        ...payload,
        courseUuid,
      });
      setSaving(false);

      if (response?.status !== true) {
        toast.error(response?.message || "Failed to save the resource");
        return;
      }

      toast.success("Resource added");
      setForm(null);
      load();
    } catch {
      setSaving(false);
      toast.error("The file could not be uploaded");
    }
  };

  const remove = async (resource) => {
    if (!window.confirm(`Remove "${resource.title}" from the library?`)) return;

    const response = await archiveResource(resource.uuid);

    if (response?.status !== true) {
      toast.error(response?.message || "Failed to remove the resource");
      return;
    }

    toast.success("Resource removed");
    load();
  };

  const types = [...new Set(resources.map((row) => row.type))];

  const visible =
    filter === "all"
      ? resources
      : resources.filter((row) => row.type === filter);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-10 text-center text-sm text-slate-500">
        Loading resources...
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-950">
            Learning Resources
          </h2>
          <p className="mt-1 text-sm text-[#667085]">
            Templates, guides and case studies for this program.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={openForm}
            className="inline-flex items-center gap-2 rounded-lg bg-[#16a34a] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#15803d]"
          >
            <FaPlus className="text-xs" />
            Add Resource
          </button>
        )}
      </div>

      {types.length > 1 && (
        <div className="mb-6 inline-flex flex-wrap gap-2 rounded-xl bg-slate-100 p-1 text-sm font-semibold">
          {["all", ...types].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFilter(type)}
              className={
                filter === type
                  ? "rounded-lg bg-white px-4 py-2 text-slate-950 shadow-sm"
                  : "rounded-lg px-4 py-2 text-slate-500 transition hover:text-slate-800"
              }
            >
              {type === "all" ? "All" : resourceTypeLabel(type)}
            </button>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          {resources.length === 0
            ? "No resources have been shared with this program yet."
            : "No resources of that type."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((resource) => (
            <div
              key={resource.uuid}
              className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#EEF4FF] px-3 py-1 text-xs font-bold text-[#3538CD]">
                  {resourceTypeLabel(resource.type)}
                </span>

                {resource.category && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {resource.category}
                  </span>
                )}
              </div>

              <h3 className="text-base font-black leading-snug text-slate-950">
                {resource.title}
              </h3>

              {resource.description && (
                <p className="mt-1 line-clamp-3 flex-1 text-sm text-[#6f6f72]">
                  {resource.description}
                </p>
              )}

              {resource.module && (
                <p className="mt-2 text-xs text-[#98A2B3]">
                  Used in {resource.module.title}
                </p>
              )}

              {resource.tags?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {resource.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded bg-[#F9FAFB] px-2 py-0.5 text-[11px] text-[#667085]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-auto flex items-center gap-3 border-t border-slate-100 pt-4">
                <a
                  href={resource.file || resource.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#082d77] px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
                >
                  {resource.downloadable ? (
                    <>
                      <FaDownload className="text-xs" /> Download
                    </>
                  ) : (
                    <>
                      <FaExternalLinkAlt className="text-xs" /> Open
                    </>
                  )}
                </a>

                {canManage && (
                  <button
                    type="button"
                    onClick={() => remove(resource)}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                  >
                    <FaTrash className="text-sm" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {form && (
        <Modal title="Add Resource" onClose={() => setForm(null)}>
          <Field label="Title">
            <input
              type="text"
              value={form.title}
              onChange={(event) =>
                setForm({ ...form, title: event.target.value })
              }
              placeholder="Cash flow forecast template"
              className={inputClass}
            />
          </Field>

          <Field label="Description">
            <textarea
              rows={2}
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Type">
              <select
                value={form.type}
                onChange={(event) =>
                  setForm({ ...form, type: event.target.value })
                }
                className={inputClass}
              >
                {RESOURCE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Category">
              <input
                type="text"
                value={form.category}
                onChange={(event) =>
                  setForm({ ...form, category: event.target.value })
                }
                placeholder="Financial Management"
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Tags, comma separated">
            <input
              type="text"
              value={form.tags}
              onChange={(event) =>
                setForm({ ...form, tags: event.target.value })
              }
              placeholder="finance, forecasting"
              className={inputClass}
            />
          </Field>

          {modules.length > 0 && (
            <Field label="Attach to a module (optional)">
              <select
                value={form.moduleUuid}
                onChange={(event) =>
                  setForm({ ...form, moduleUuid: event.target.value })
                }
                className={inputClass}
              >
                <option value="">Program-wide</option>
                {modules.map((module) => (
                  <option key={module.uuid} value={module.uuid}>
                    {module.title}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <label className="mb-3 flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.useUrl}
              onChange={(event) =>
                setForm({ ...form, useUrl: event.target.checked })
              }
            />
            Use a link instead of uploading
          </label>

          {form.useUrl ? (
            <Field label="Link">
              <input
                type="url"
                value={form.url}
                onChange={(event) =>
                  setForm({ ...form, url: event.target.value })
                }
                placeholder="https://"
                className={inputClass}
              />
            </Field>
          ) : (
            <Field label="File">
              <input
                type="file"
                onChange={(event) =>
                  setForm({ ...form, file: event.target.files[0] })
                }
                className={inputClass}
              />
            </Field>
          )}

          <label className="mb-4 flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.downloadable}
              onChange={(event) =>
                setForm({ ...form, downloadable: event.target.checked })
              }
            />
            Learners may download this
          </label>

          <button
            type="button"
            disabled={saving}
            onClick={save}
            className="w-full rounded-lg bg-[#16a34a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#15803d] disabled:opacity-60"
          >
            {saving ? "Saving..." : "Add resource"}
          </button>
        </Modal>
      )}
    </>
  );
};

export default ResourcesPanel;
