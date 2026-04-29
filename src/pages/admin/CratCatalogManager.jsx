import React, { useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import Breadcrumb from "@/component/Breadcrumb";
import { UserContext } from "@/layouts/DashboardLayout";
import {
  getAdminCatalog,
  createCatalogQuestion,
  updateCatalogQuestion,
  toggleCatalogQuestion,
} from "@/controllers/crat_controller";

const DOMAINS = [
  { value: "", label: "All Domains" },
  { value: "commercial_marketing", label: "Commercial & Marketing" },
  { value: "financial", label: "Financial" },
  { value: "legal_compliance", label: "Legal & Compliance" },
  { value: "operations", label: "Operations" },
];

const VARIANTS = [
  { value: "default", label: "Default" },
  { value: "fintech", label: "Fintech" },
];

const DOMAIN_LABELS = {
  commercial_marketing: "Commercial & Marketing",
  financial: "Financial",
  legal_compliance: "Legal & Compliance",
  operations: "Operations",
};

const emptyForm = {
  domain: "commercial_marketing",
  variant: "default",
  question_code: "",
  question_text_en: "",
  question_text_sw: "",
  guidance_en: "",
  guidance_sw: "",
  required_attachment: "",
  required_attachment_sw: "",
  ai_prompt: "",
  sort_order: 0,
};

const CratCatalogManager = () => {
  const { userDetails } = useContext(UserContext);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDomain, setFilterDomain] = useState("");
  const [filterVariant, setFilterVariant] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [expandedAiPrompt, setExpandedAiPrompt] = useState(null);

  const isAdmin = userDetails?.role === "Admin";

  const load = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterDomain) params.domain = filterDomain;
      if (filterVariant) params.variant = filterVariant;
      const data = await getAdminCatalog(params);
      setQuestions(data || []);
    } catch (err) {
      toast.error("Failed to load catalog.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [filterDomain, filterVariant, isAdmin]);

  const openCreate = () => {
    setEditingQuestion(null);
    setForm({ ...emptyForm });
    setShowModal(true);
  };

  const openEdit = (q) => {
    setEditingQuestion(q);
    setForm({
      domain: q.domain,
      variant: q.variant,
      question_code: q.question_code,
      question_text_en: q.question_text_en || "",
      question_text_sw: q.question_text_sw || "",
      guidance_en: q.guidance_en || "",
      guidance_sw: q.guidance_sw || "",
      required_attachment: q.required_attachment || "",
      required_attachment_sw: q.required_attachment_sw || "",
      ai_prompt: q.ai_prompt || "",
      sort_order: q.sort_order ?? 0,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingQuestion(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.question_code.trim() || !form.question_text_en.trim()) {
      toast.error("Question code and English text are required.");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        ...form,
        sort_order: Number(form.sort_order) || 0,
      };
      if (editingQuestion) {
        await updateCatalogQuestion(editingQuestion.id, payload);
        toast.success("Question updated.");
      } else {
        await createCatalogQuestion(payload);
        toast.success("Question created.");
      }
      closeModal();
      await load();
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to save question.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (q) => {
    try {
      await toggleCatalogQuestion(q.id);
      toast.success(
        q.is_active ? "Question deactivated." : "Question activated.",
      );
      await load();
    } catch {
      toast.error("Failed to toggle question status.");
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          This page is restricted to admin users.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 md:p-6">
      <Breadcrumb pageName="CRAT Catalog Manager" />

      <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">
              CRAT Question Catalog
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage questions, guidance notes, and per-question AI evaluation
              prompts.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
          >
            + New Question
          </button>
        </div>

        {/* Filters */}
        <div className="mt-5 flex flex-wrap gap-3">
          <select
            value={filterDomain}
            onChange={(e) => setFilterDomain(e.target.value)}
            className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary/40 focus:outline-none"
          >
            {DOMAINS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
          <select
            value={filterVariant}
            onChange={(e) => setFilterVariant(e.target.value)}
            className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary/40 focus:outline-none"
          >
            <option value="">All Variants</option>
            {VARIANTS.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="mt-5 overflow-hidden rounded-xl border border-black/10">
          {loading ? (
            <p className="p-5 text-sm text-slate-600">Loading catalog...</p>
          ) : questions.length === 0 ? (
            <p className="p-5 text-sm text-slate-600">No questions found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="border-b border-black/10 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                      Code
                    </th>
                    <th className="border-b border-black/10 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                      Domain / Variant
                    </th>
                    <th className="border-b border-black/10 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700 w-72">
                      Question (EN)
                    </th>
                    <th className="border-b border-black/10 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                      AI Prompt
                    </th>
                    <th className="border-b border-black/10 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                      Order
                    </th>
                    <th className="border-b border-black/10 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                      Status
                    </th>
                    <th className="border-b border-black/10 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((q) => (
                    <tr
                      key={q.id}
                      className={`align-top ${!q.is_active ? "opacity-50" : ""}`}
                    >
                      <td className="border-b border-black/10 px-3 py-3 text-xs font-mono text-slate-700">
                        {q.question_code}
                      </td>
                      <td className="border-b border-black/10 px-3 py-3">
                        <p className="text-xs font-semibold text-slate-800">
                          {DOMAIN_LABELS[q.domain] || q.domain}
                        </p>
                        <p className="text-xs text-slate-500 capitalize">
                          {q.variant}
                        </p>
                      </td>
                      <td className="border-b border-black/10 px-3 py-3 text-xs text-slate-700">
                        {q.question_text_en}
                      </td>
                      <td className="border-b border-black/10 px-3 py-3 text-xs text-slate-600 max-w-xs">
                        {q.ai_prompt ? (
                          <>
                            <p className="line-clamp-2">
                              {expandedAiPrompt === q.id
                                ? q.ai_prompt
                                : q.ai_prompt.slice(0, 80) +
                                  (q.ai_prompt.length > 80 ? "…" : "")}
                            </p>
                            {q.ai_prompt.length > 80 && (
                              <button
                                onClick={() =>
                                  setExpandedAiPrompt(
                                    expandedAiPrompt === q.id ? null : q.id,
                                  )
                                }
                                className="mt-1 text-primary text-xs underline"
                              >
                                {expandedAiPrompt === q.id
                                  ? "Show less"
                                  : "Show more"}
                              </button>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-400 italic">Not set</span>
                        )}
                      </td>
                      <td className="border-b border-black/10 px-3 py-3 text-xs text-slate-700 text-center">
                        {q.sort_order}
                      </td>
                      <td className="border-b border-black/10 px-3 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                            q.is_active
                              ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                              : "border-slate-200 bg-slate-100 text-slate-600"
                          }`}
                        >
                          {q.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="border-b border-black/10 px-3 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(q)}
                            className="rounded-lg border border-black/15 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-primary/40 hover:text-primary"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggle(q)}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                              q.is_active
                                ? "border-red-200 text-red-600 hover:bg-red-50"
                                : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                            }`}
                          >
                            {q.is_active ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-8 w-full max-w-2xl rounded-2xl border border-black/10 bg-white shadow-xl">
            <div className="border-b border-black/10 px-6 py-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">
                {editingQuestion ? "Edit Question" : "New Question"}
              </h2>
              <button
                onClick={closeModal}
                className="text-slate-500 hover:text-slate-800 text-lg font-bold"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Domain *
                  </label>
                  <select
                    value={form.domain}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, domain: e.target.value }))
                    }
                    disabled={!!editingQuestion}
                    className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary/40 focus:outline-none disabled:opacity-60"
                  >
                    {DOMAINS.filter((d) => d.value).map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Variant
                  </label>
                  <select
                    value={form.variant}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, variant: e.target.value }))
                    }
                    disabled={!!editingQuestion}
                    className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary/40 focus:outline-none disabled:opacity-60"
                  >
                    {VARIANTS.map((v) => (
                      <option key={v.value} value={v.value}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Question Code *
                  </label>
                  <input
                    type="text"
                    value={form.question_code}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, question_code: e.target.value }))
                    }
                    disabled={!!editingQuestion}
                    placeholder="e.g. CM-006"
                    className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary/40 focus:outline-none disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, sort_order: e.target.value }))
                    }
                    className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary/40 focus:outline-none"
                    min={0}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Question Text (English) *
                </label>
                <textarea
                  value={form.question_text_en}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, question_text_en: e.target.value }))
                  }
                  rows={3}
                  className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary/40 focus:outline-none"
                  placeholder="Enter question in English"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Question Text (Swahili)
                </label>
                <textarea
                  value={form.question_text_sw}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, question_text_sw: e.target.value }))
                  }
                  rows={2}
                  className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary/40 focus:outline-none"
                  placeholder="Swahili translation (optional)"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Guidance (English)
                </label>
                <textarea
                  value={form.guidance_en}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, guidance_en: e.target.value }))
                  }
                  rows={2}
                  className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary/40 focus:outline-none"
                  placeholder="Guidance notes for entrepreneurs"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Guidance (Swahili)
                </label>
                <textarea
                  value={form.guidance_sw}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, guidance_sw: e.target.value }))
                  }
                  rows={2}
                  className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary/40 focus:outline-none"
                  placeholder="Swahili guidance (optional)"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Required Attachment (English)
                </label>
                <input
                  type="text"
                  value={form.required_attachment}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      required_attachment: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary/40 focus:outline-none"
                  placeholder="e.g. Audited financial statements (optional)"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Required Attachment (Swahili)
                </label>
                <input
                  type="text"
                  value={form.required_attachment_sw}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      required_attachment_sw: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary/40 focus:outline-none"
                  placeholder="Tafsiri ya Kiswahili (hiari)"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  AI Evaluation Prompt
                  <span className="ml-1 font-normal text-slate-400">
                    (used by AI when scoring this question)
                  </span>
                </label>
                <textarea
                  value={form.ai_prompt}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, ai_prompt: e.target.value }))
                  }
                  rows={4}
                  className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary/40 focus:outline-none"
                  placeholder="Describe what the AI should look for when evaluating answers to this question. E.g. 'Assess whether the business has a documented go-to-market strategy with clear customer segments...'"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-black/15 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
                >
                  {saving ? "Saving…" : editingQuestion ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CratCatalogManager;
