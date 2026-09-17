"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaArrowDown, FaArrowUp, FaPlus, FaTrash } from "react-icons/fa";
import {
  CONTENT_TYPES,
  contentTypeLabel,
  getModuleContent,
  reorderContent,
} from "@/controllers/lesson_controller";
import { createSlide, deleteSlide } from "@/controllers/slides_controller";
import { uploadFile } from "@/controllers/file_upload_controller";
import { Field, Modal, inputClass } from "./formBits";

// The content of one module: its slides, in order. A module holds them
// directly — there is no lesson layer between the two.
const LessonBuilder = ({ moduleUuid, canManage }) => {
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState([]);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    getModuleContent(moduleUuid)
      .then((body) => setContent(Array.isArray(body?.data) ? body.data : []))
      .catch(() => toast.error("Failed to load the module content"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [moduleUuid]);

  const move = async (index, direction) => {
    const next = [...content];
    const target = index + direction;

    if (target < 0 || target >= next.length) return;

    [next[index], next[target]] = [next[target], next[index]];
    setContent(next);

    const response = await reorderContent(
      moduleUuid,
      next.map((item) => item.uuid),
    );

    if (response?.status !== true) {
      toast.error("Failed to save the new order");
      load();
    }
  };

  const save = async () => {
    if (!form.title.trim()) {
      toast.error("Give the content a title");
      return;
    }

    setSaving(true);

    const payload = {
      module_uuid: moduleUuid,
      title: form.title.trim(),
      type: form.type,
      description: form.description.trim() || null,
      downloadable: form.downloadable,
    };

    try {
      if (form.type === "text") {
        payload.content = form.content;
      } else if (form.type === "link") {
        payload.url = form.url.trim();
      } else if (form.useUrl) {
        payload.url = form.url.trim();
      } else if (form.file) {
        const data = new FormData();
        data.append("file", form.file);
        payload.file = await uploadFile(data);
      }

      if (form.type === "video" && form.durationSeconds) {
        payload.durationSeconds = Number(form.durationSeconds);
      }

      const response = await createSlide(payload);
      setSaving(false);

      if (response?.status !== true) {
        toast.error(response?.message || "Failed to add the content");
        return;
      }

      toast.success("Content added");
      setForm(null);
      load();
    } catch (error) {
      setSaving(false);
      console.error(error);
      toast.error("The file could not be uploaded");
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Delete "${item.title}" from this module?`)) return;

    await deleteSlide(item.uuid);
    toast.success("Content removed");
    load();
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-[#EAECF0] bg-white p-8 text-center text-sm text-[#667085]">
        Loading content...
      </div>
    );
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-black tracking-tight text-[#101828]">
          Content
        </h2>

        {canManage && (
          <button
            type="button"
            onClick={() =>
              setForm({
                title: "",
                type: "text",
                content: "",
                url: "",
                description: "",
                durationSeconds: "",
                downloadable: true,
                useUrl: false,
                file: null,
              })
            }
            className="inline-flex items-center gap-2 rounded-lg bg-[#16a34a] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#15803d]"
          >
            <FaPlus className="text-xs" />
            Add Content
          </button>
        )}
      </div>

      {content.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#EAECF0] bg-white p-8 text-center text-sm text-[#667085]">
          Nothing in this module yet.
        </div>
      ) : (
        <div className="space-y-3">
          {content.map((item, index) => (
            <div
              key={item.uuid}
              className="flex items-center gap-4 rounded-2xl border border-[#E4E7EC] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F2F4F7] text-sm font-semibold text-[#475467]">
                {index + 1}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-[#101828]">
                  {item.title}
                </span>
                <span className="text-xs text-[#98A2B3]">
                  {contentTypeLabel(item.type)}
                  {item.durationSeconds
                    ? ` · ${Math.round(item.durationSeconds / 60)} min`
                    : ""}
                </span>
              </span>

              {canManage && (
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    title="Move up"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 disabled:opacity-30"
                  >
                    <FaArrowUp className="text-xs" />
                  </button>

                  <button
                    type="button"
                    title="Move down"
                    disabled={index === content.length - 1}
                    onClick={() => move(index, 1)}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 disabled:opacity-30"
                  >
                    <FaArrowDown className="text-xs" />
                  </button>

                  <button
                    type="button"
                    onClick={() => remove(item)}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                  >
                    <FaTrash className="text-xs" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {form && (
        <Modal title="Add Content" onClose={() => setForm(null)}>
          <Field label="Title">
            <input
              type="text"
              value={form.title}
              onChange={(event) =>
                setForm({ ...form, title: event.target.value })
              }
              className={inputClass}
            />
          </Field>

          <Field label="Content type">
            <select
              value={form.type}
              onChange={(event) =>
                setForm({ ...form, type: event.target.value })
              }
              className={inputClass}
            >
              {CONTENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            <p className="mt-2 text-xs text-[#98A2B3]">
              {CONTENT_TYPES.find((type) => type.value === form.type)?.hint ||
                ""}
            </p>
          </Field>

          {form.type === "text" && (
            <Field label="Content">
              <textarea
                rows={8}
                value={form.content}
                onChange={(event) =>
                  setForm({ ...form, content: event.target.value })
                }
                placeholder="<h3>Heading</h3><p>Paragraph...</p>"
                className={inputClass}
              />
            </Field>
          )}

          {form.type === "link" && (
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
          )}

          {["video", "presentation", "document", "file"].includes(
            form.type,
          ) && (
            <>
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
                <Field label="URL">
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

              {form.type === "video" && (
                <Field label="Duration in seconds">
                  <input
                    type="number"
                    value={form.durationSeconds}
                    onChange={(event) =>
                      setForm({ ...form, durationSeconds: event.target.value })
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
            </>
          )}

          <button
            type="button"
            disabled={saving}
            onClick={save}
            className="w-full rounded-lg bg-[#16a34a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#15803d] disabled:opacity-60"
          >
            {saving ? "Saving..." : "Add content"}
          </button>
        </Modal>
      )}
    </>
  );
};

export default LessonBuilder;
