import React, { useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import Breadcrumb from "@/component/Breadcrumb";
import { UserContext } from "@/layouts/DashboardLayout";
import { useTranslation } from "@/locales";
import {
  getAdminCatalog,
  createCatalogQuestion,
  updateCatalogQuestion,
  toggleCatalogQuestion,
  deleteCatalogQuestion,
} from "@/controllers/crat_controller";
import { getCohortProgramOptions } from "@/controllers/cohort_controller";

const DOMAIN_LABELS_EN = {
  commercial_marketing: "Commercial & Marketing",
  financial: "Financial",
  legal_compliance: "Legal & Compliance",
  operations: "Operations",
};

const DOMAIN_LABELS_SW = {
  commercial_marketing: "Biashara na Masoko",
  financial: "Fedha",
  legal_compliance: "Sheria na Uzingatiaji",
  operations: "Uendeshaji",
};

const toRequiredAttachmentList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  const raw = String(value || "").trim();
  if (!raw) return [];

  if (raw.startsWith("[")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item || "").trim()).filter(Boolean);
      }
    } catch (_) {
      return [raw];
    }
  }

  const splitItems = raw
    .split(/[\n;]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  return splitItems.length > 0 ? splitItems : [raw];
};

const listToTextareaValue = (value) =>
  toRequiredAttachmentList(value).join("\n");

const SHARED_PROGRAM_KEY = "shared";

const emptyForm = {
  domain: "",
  cohort_program_uuid: "",
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
  const { isSwahili } = useTranslation();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDomain, setFilterDomain] = useState("");
  const [filterProgram, setFilterProgram] = useState("");
  const [programOptions, setProgramOptions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [expandedAiPrompt, setExpandedAiPrompt] = useState(null);
  const [domainOptions, setDomainOptions] = useState([]);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [categoryType, setCategoryType] = useState(""); // "domain"
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);

  const labels = {
    pageTitle: isSwahili
      ? "Meneja wa Katalogi ya CRAT"
      : "CRAT Catalog Manager",
    cardTitle: isSwahili
      ? "Katalogi ya Maswali ya CRAT"
      : "CRAT Question Catalog",
    cardDescription: isSwahili
      ? "Dhibiti maswali, maelezo ya mwongozo, na maelekezo ya AI kwa kila swali."
      : "Manage questions, guidance notes, and per-question AI evaluation prompts.",
    newQuestion: isSwahili ? "+ Swali Jipya" : "+ New Question",
    allDomains: isSwahili ? "Maeneo Yote" : "All Domains",
    allCategories: isSwahili ? "Kategoria Zote" : "All Categories",
    sharedQuestions: isSwahili ? "Programu zote" : "All programs",
    programHelp: isSwahili
      ? 'Huulizwa tu kwa startups za programu hii. Chagua "Programu zote" ili kila startup iulizwe.'
      : 'Only asked of startups on this program. Choose "All programs" to ask every startup.',
    loadingCatalog: isSwahili ? "Inapakia katalogi..." : "Loading catalog...",
    noQuestionsFound: isSwahili
      ? "Hakuna maswali yaliyopatikana."
      : "No questions found.",
    code: isSwahili ? "Msimbo" : "Code",
    domainVariant: isSwahili ? "Eneo / Kategoria" : "Domain / Variant",
    questionHeader: isSwahili ? "Swali" : "Question (EN)",
    aiPrompt: isSwahili ? "Maelekezo ya AI" : "AI Prompt",
    order: isSwahili ? "Mpangilio" : "Order",
    status: isSwahili ? "Hali" : "Status",
    actions: isSwahili ? "Vitendo" : "Actions",
    showLess: isSwahili ? "Onyesha kidogo" : "Show less",
    showMore: isSwahili ? "Onyesha zaidi" : "Show more",
    notSet: isSwahili ? "Haijawekwa" : "Not set",
    active: isSwahili ? "Hai" : "Active",
    inactive: isSwahili ? "Haifanyi kazi" : "Inactive",
    edit: isSwahili ? "Hariri" : "Edit",
    deactivate: isSwahili ? "Zima" : "Deactivate",
    activate: isSwahili ? "Washa" : "Activate",
    delete: isSwahili ? "Futa" : "Delete",
    editQuestion: isSwahili ? "Hariri Swali" : "Edit Question",
    newQuestionModal: isSwahili ? "Swali Jipya" : "New Question",
    domain: isSwahili ? "Eneo" : "Domain",
    selectDomain: isSwahili ? "Chagua Eneo" : "Select Domain",
    category: isSwahili ? "Kategoria" : "Category",
    addNewDomain: isSwahili ? "Ongeza eneo jipya" : "Add new domain",
    addNewCategory: isSwahili ? "Ongeza kategoria mpya" : "Add new category",
    questionCode: isSwahili ? "Msimbo wa Swali" : "Question Code",
    sortOrder: isSwahili ? "Mpangilio" : "Sort Order",
    questionTextEn: isSwahili
      ? "Maandishi ya Swali (Kiingereza)"
      : "Question Text (English)",
    questionTextSw: isSwahili
      ? "Maandishi ya Swali (Kiswahili)"
      : "Question Text (Swahili)",
    enterQuestionEn: isSwahili
      ? "Ingiza swali kwa Kiingereza"
      : "Enter question in English",
    enterQuestionSw: isSwahili
      ? "Tafsiri ya Kiswahili (hiari)"
      : "Swahili translation (optional)",
    guidanceEn: isSwahili ? "Mwongozo (Kiingereza)" : "Guidance (English)",
    guidanceSw: isSwahili ? "Mwongozo (Kiswahili)" : "Guidance (Swahili)",
    guidancePlaceholder: isSwahili
      ? "Maelezo ya mwongozo kwa wajasiriamali"
      : "Guidance notes for entrepreneurs",
    guidanceSwPlaceholder: isSwahili
      ? "Mwongozo wa Kiswahili (hiari)"
      : "Swahili guidance (optional)",
    requiredAttachmentEn: isSwahili
      ? "Kiambatisho Kinachohitajika (Kiingereza)"
      : "Required Attachments (English)",
    requiredAttachmentSw: isSwahili
      ? "Kiambatisho Kinachohitajika (Kiswahili)"
      : "Required Attachments (Swahili)",
    requiredAttachmentPlaceholder: isSwahili
      ? "Weka kila kiambatisho kwenye mstari wake (hiari)"
      : "Enter one required attachment per line (optional)",
    requiredAttachmentSwPlaceholder: isSwahili
      ? "Weka kila tafsiri ya kiambatisho kwenye mstari wake (hiari)"
      : "Enter one Swahili attachment label per line (optional)",
    aiEvaluationPrompt: isSwahili
      ? "Maelekezo ya Tathmini ya AI"
      : "AI Evaluation Prompt",
    aiPromptHint: isSwahili
      ? "(hutumiwa na AI inapopima swali hili)"
      : "(used by AI when scoring this question)",
    aiPromptPlaceholder: isSwahili
      ? "Eleza AI inapaswa kuangalia nini inapopima majibu ya swali hili."
      : "Describe what the AI should look for when evaluating answers to this question. E.g. 'Assess whether the business has a documented go-to-market strategy with clear customer segments...'",
    cancel: isSwahili ? "Ghairi" : "Cancel",
    saving: isSwahili ? "Inahifadhi..." : "Saving...",
    update: isSwahili ? "Sasisha" : "Update",
    create: isSwahili ? "Tengeneza" : "Create",
    addNew: isSwahili ? "Ongeza" : "Add New",
    domainName: isSwahili ? "Jina la Eneo" : "Domain Name",
    categoryName: isSwahili ? "Jina la Kategoria" : "Category Name",
    domainCategoryPlaceholder: isSwahili
      ? "mf. teknolojia, uchumi wa bluu"
      : "e.g. technology, blue economy",
    categoryPlaceholder: isSwahili
      ? "mf. fintech, agritech"
      : "e.g. fintech, agritech",
    adding: isSwahili ? "Inaongeza..." : "Adding...",
    add: isSwahili ? "Ongeza" : "Add",
    restricted: isSwahili
      ? "Ukurasa huu ni wa wasimamizi pekee."
      : "This page is restricted to admin users.",
    failedToLoadCatalog: isSwahili
      ? "Imeshindikana kupakia katalogi."
      : "Failed to load catalog.",
    requiredFieldsError: isSwahili
      ? "Eneo, msimbo wa swali, na maandishi ya Kiingereza yanahitajika."
      : "Domain, question code, and English text are required.",
    questionUpdated: isSwahili ? "Swali limesasishwa." : "Question updated.",
    questionCreated: isSwahili ? "Swali limetengenezwa." : "Question created.",
    failedToSaveQuestion: isSwahili
      ? "Imeshindikana kuhifadhi swali."
      : "Failed to save question.",
    questionDeactivated: isSwahili
      ? "Swali limezimwa."
      : "Question deactivated.",
    questionActivated: isSwahili ? "Swali limewashwa." : "Question activated.",
    failedToToggleStatus: isSwahili
      ? "Imeshindikana kubadili hali ya swali."
      : "Failed to toggle question status.",
    deleteConfirm: isSwahili
      ? 'Futa swali "{{code}}"? Hii haiwezi kutenduliwa.'
      : 'Delete question "{{code}}"? This cannot be undone.',
    questionDeleted: isSwahili ? "Swali limefutwa." : "Question deleted.",
    failedToDeleteQuestion: isSwahili
      ? "Imeshindikana kufuta swali."
      : "Failed to delete question.",
    enterCategoryName: isSwahili
      ? `Tafadhali andika jina la ${categoryType === "domain" ? "eneo" : "kategoria"}.`
      : `Please enter a ${categoryType === "domain" ? "domain" : "category"} name.`,
    domainAdded: isSwahili
      ? `Eneo "{{name}}" limeongezwa.`
      : `Domain "{{name}}" added successfully.`,
    categoryAdded: isSwahili
      ? `Kategoria "{{name}}" imeongezwa.`
      : `Category "{{name}}" added successfully.`,
    domainExists: isSwahili
      ? "Eneo hili tayari lipo."
      : "This domain already exists.",
    categoryExists: isSwahili
      ? "Kategoria hii tayari ipo."
      : "This category already exists.",
  };

  const domainLabels = isSwahili ? DOMAIN_LABELS_SW : DOMAIN_LABELS_EN;

  const getLocalizedQuestionText = (question) => {
    if (isSwahili) {
      return question.question_text_sw || question.question_text_en || "";
    }
    return question.question_text_en || question.question_text_sw || "";
  };

  const isAdmin = userDetails?.role === "Admin";

  useEffect(() => {
    if (!isAdmin) return;
    getCohortProgramOptions().then(setProgramOptions);
  }, [isAdmin]);

  const load = async () => {
    try {
      setLoading(true);
      // Always fetch all questions to populate filter options
      const allData = await getAdminCatalog();

      // Extract all available domains and variants from all questions
      const nextDomains = [...new Set((allData || []).map((q) => q.domain))]
        .filter(Boolean)
        .sort();
      setDomainOptions(nextDomains);

      // Apply filters to the display data
      let filteredData = allData;
      if (filterDomain) {
        filteredData = filteredData.filter((q) => q.domain === filterDomain);
      }
      if (filterProgram === SHARED_PROGRAM_KEY) {
        filteredData = filteredData.filter((q) => !q.CohortProgram);
      } else if (filterProgram) {
        filteredData = filteredData.filter(
          (q) => q.CohortProgram?.uuid === filterProgram,
        );
      }

      setQuestions(filteredData || []);
    } catch (err) {
      toast.error(labels.failedToLoadCatalog);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [filterDomain, filterProgram, isAdmin]);

  const openCreate = () => {
    setEditingQuestion(null);
    setForm({
      ...emptyForm,
      domain: domainOptions[0] || "",
      variant: "default",
      cohort_program_uuid:
        filterProgram === SHARED_PROGRAM_KEY ? "" : filterProgram,
    });
    setShowModal(true);
  };

  const openEdit = (q) => {
    setEditingQuestion(q);
    setForm({
      domain: q.domain,
      variant: q.variant,
      cohort_program_uuid: q.CohortProgram?.uuid || "",
      question_code: q.question_code,
      question_text_en: q.question_text_en || "",
      question_text_sw: q.question_text_sw || "",
      guidance_en: q.guidance_en || "",
      guidance_sw: q.guidance_sw || "",
      required_attachment: listToTextareaValue(
        q.required_attachments || q.required_attachment,
      ),
      required_attachment_sw: listToTextareaValue(
        q.required_attachments_sw || q.required_attachment_sw,
      ),
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
    if (
      !form.domain.trim() ||
      !form.question_code.trim() ||
      !form.question_text_en.trim()
    ) {
      toast.error(labels.requiredFieldsError);
      return;
    }
    try {
      setSaving(true);
      const payload = {
        ...form,
        domain: form.domain.trim().toLowerCase(),
        variant: (form.variant || "default").trim().toLowerCase(),
        required_attachments: toRequiredAttachmentList(
          form.required_attachment,
        ),
        required_attachments_sw: toRequiredAttachmentList(
          form.required_attachment_sw,
        ),
        sort_order: Number(form.sort_order) || 0,
        cohort_program_uuid: form.cohort_program_uuid || null,
      };

      delete payload.required_attachment;
      delete payload.required_attachment_sw;

      if (editingQuestion) {
        await updateCatalogQuestion(editingQuestion.id, payload);
        toast.success(labels.questionUpdated);
      } else {
        await createCatalogQuestion(payload);
        toast.success(labels.questionCreated);
      }
      closeModal();
      await load();
    } catch (err) {
      const msg = err?.response?.data?.message || labels.failedToSaveQuestion;
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (q) => {
    try {
      await toggleCatalogQuestion(q.id);
      toast.success(
        q.is_active ? labels.questionDeactivated : labels.questionActivated,
      );
      await load();
    } catch {
      toast.error(labels.failedToToggleStatus);
    }
  };

  const handleDelete = async (q) => {
    if (
      !window.confirm(labels.deleteConfirm.replace("{{code}}", q.question_code))
    ) {
      return;
    }
    try {
      await deleteCatalogQuestion(q.id);
      toast.success(labels.questionDeleted);
      await load();
    } catch (err) {
      const msg = err?.response?.data?.message || labels.failedToDeleteQuestion;
      toast.error(msg);
    }
  };

  const openAddCategoryModal = (type) => {
    setCategoryType(type);
    setNewCategoryName("");
    setShowAddCategoryModal(true);
  };

  const closeAddCategoryModal = () => {
    setShowAddCategoryModal(false);
    setCategoryType("");
    setNewCategoryName("");
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      toast.error(labels.enterCategoryName);
      return;
    }

    try {
      setAddingCategory(true);
      const normalizedName = newCategoryName.trim().toLowerCase();

      if (categoryType === "domain") {
        if (!domainOptions.includes(normalizedName)) {
          setDomainOptions([...domainOptions, normalizedName]);
          toast.success(
            labels.domainAdded.replace("{{name}}", newCategoryName),
          );
        } else {
          toast.error(labels.domainExists);
        }
      }
      closeAddCategoryModal();
    } finally {
      setAddingCategory(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {labels.restricted}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 md:p-6">
      <Breadcrumb pageName={labels.pageTitle} />

      <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">
              {labels.cardTitle}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {labels.cardDescription}
            </p>
          </div>
          <button
            onClick={openCreate}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
          >
            {labels.newQuestion}
          </button>
        </div>

        {/* Filters */}
        <div className="mt-5 flex flex-wrap gap-3">
          <select
            value={filterDomain}
            onChange={(e) => setFilterDomain(e.target.value)}
            className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary/40 focus:outline-none"
          >
            {[
              { value: "", label: labels.allDomains },
              ...domainOptions.map((d) => ({
                value: d,
                label: domainLabels[d] || d,
              })),
            ].map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
          <select
            value={filterProgram}
            onChange={(e) => setFilterProgram(e.target.value)}
            className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary/40 focus:outline-none"
          >
            <option value="">{labels.allCategories}</option>
            <option value={SHARED_PROGRAM_KEY}>{labels.sharedQuestions}</option>
            {programOptions.map((program) => (
              <option key={program.uuid} value={program.uuid}>
                {program.title}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="mt-5 overflow-hidden rounded-xl border border-black/10">
          {loading ? (
            <p className="p-5 text-sm text-slate-600">
              {labels.loadingCatalog}
            </p>
          ) : questions.length === 0 ? (
            <p className="p-5 text-sm text-slate-600">
              {labels.noQuestionsFound}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="border-b border-black/10 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                      {labels.code}
                    </th>
                    <th className="border-b border-black/10 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                      {labels.domainVariant}
                    </th>
                    <th className="border-b border-black/10 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700 w-72">
                      {labels.questionHeader}
                    </th>
                    <th className="border-b border-black/10 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                      {labels.aiPrompt}
                    </th>
                    <th className="border-b border-black/10 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                      {labels.order}
                    </th>
                    <th className="border-b border-black/10 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                      {labels.status}
                    </th>
                    <th className="border-b border-black/10 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                      {labels.actions}
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
                          {domainLabels[q.domain] || q.domain}
                        </p>
                        <p className="text-xs text-slate-500">
                          {q.CohortProgram?.title || labels.sharedQuestions}
                        </p>
                      </td>
                      <td className="border-b border-black/10 px-3 py-3 text-xs text-slate-700">
                        {getLocalizedQuestionText(q)}
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
                                  ? labels.showLess
                                  : labels.showMore}
                              </button>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-400 italic">
                            {labels.notSet}
                          </span>
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
                          {q.is_active ? labels.active : labels.inactive}
                        </span>
                      </td>
                      <td className="border-b border-black/10 px-3 py-3">
                        <div className="flex items-center gap-1 flex-nowrap">
                          <button
                            onClick={() => openEdit(q)}
                            className="rounded-lg border border-black/15 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 hover:border-primary/40 hover:text-primary whitespace-nowrap"
                          >
                            {labels.edit}
                          </button>
                          <button
                            onClick={() => handleToggle(q)}
                            className={`rounded-lg border px-2 py-1.5 text-xs font-semibold transition whitespace-nowrap ${
                              q.is_active
                                ? "border-red-200 text-red-600 hover:bg-red-50"
                                : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                            }`}
                          >
                            {q.is_active ? labels.deactivate : labels.activate}
                          </button>
                          <button
                            onClick={() => handleDelete(q)}
                            className="rounded-lg border border-red-300 bg-white px-2 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 whitespace-nowrap"
                          >
                            {labels.delete}
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
                {editingQuestion
                  ? labels.editQuestion
                  : labels.newQuestionModal}
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
                    {labels.domain} *
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={form.domain}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, domain: e.target.value }))
                      }
                      className="flex-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary/40 focus:outline-none"
                    >
                      <option value="">{labels.selectDomain}</option>
                      {domainOptions.map((domain) => (
                        <option key={domain} value={domain}>
                          {domainLabels[domain] || domain}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => openAddCategoryModal("domain")}
                      className="rounded-lg border border-black/15 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 hover:text-primary"
                      title={labels.addNewDomain}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    {labels.category}
                  </label>
                  <select
                    value={form.cohort_program_uuid}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        cohort_program_uuid: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary/40 focus:outline-none"
                  >
                    <option value="">{labels.sharedQuestions}</option>
                    {programOptions.map((program) => (
                      <option key={program.uuid} value={program.uuid}>
                        {program.title}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-slate-500">
                    {labels.programHelp}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    {labels.questionCode} *
                  </label>
                  <input
                    type="text"
                    value={form.question_code}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, question_code: e.target.value }))
                    }
                    placeholder="e.g. CM-006"
                    className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary/40 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    {labels.sortOrder}
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
                  {labels.questionTextEn} *
                </label>
                <textarea
                  value={form.question_text_en}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, question_text_en: e.target.value }))
                  }
                  rows={3}
                  className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary/40 focus:outline-none"
                  placeholder={labels.enterQuestionEn}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  {labels.questionTextSw}
                </label>
                <textarea
                  value={form.question_text_sw}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, question_text_sw: e.target.value }))
                  }
                  rows={2}
                  className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary/40 focus:outline-none"
                  placeholder={labels.requiredAttachmentSwPlaceholder}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  {labels.guidanceEn}
                </label>
                <textarea
                  value={form.guidance_en}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, guidance_en: e.target.value }))
                  }
                  rows={2}
                  className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary/40 focus:outline-none"
                  placeholder={labels.guidancePlaceholder}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  {labels.guidanceSw}
                </label>
                <textarea
                  value={form.guidance_sw}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, guidance_sw: e.target.value }))
                  }
                  rows={2}
                  className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary/40 focus:outline-none"
                  placeholder={labels.guidanceSwPlaceholder}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  {labels.requiredAttachmentEn}
                </label>
                <textarea
                  value={form.required_attachment}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      required_attachment: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary/40 focus:outline-none"
                  placeholder={labels.requiredAttachmentPlaceholder}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  {labels.requiredAttachmentSw}
                </label>
                <textarea
                  value={form.required_attachment_sw}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      required_attachment_sw: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary/40 focus:outline-none"
                  placeholder={labels.requiredAttachmentSwPlaceholder}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  {labels.aiEvaluationPrompt}
                  <span className="ml-1 font-normal text-slate-400">
                    {labels.aiPromptHint}
                  </span>
                </label>
                <textarea
                  value={form.ai_prompt}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, ai_prompt: e.target.value }))
                  }
                  rows={4}
                  className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary/40 focus:outline-none"
                  placeholder={labels.aiPromptPlaceholder}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-black/15 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {labels.cancel}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
                >
                  {saving
                    ? labels.saving
                    : editingQuestion
                      ? labels.update
                      : labels.create}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white shadow-xl">
            <div className="border-b border-black/10 px-6 py-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">
                {labels.addNew}{" "}
                {categoryType === "domain" ? labels.domain : labels.category}
              </h2>
              <button
                onClick={closeAddCategoryModal}
                className="text-slate-500 hover:text-slate-800 text-lg font-bold"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddCategory} className="p-6 space-y-4">
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-700">
                  {categoryType === "domain"
                    ? labels.domainName
                    : labels.categoryName}{" "}
                  *
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder={
                    categoryType === "domain"
                      ? labels.domainCategoryPlaceholder
                      : labels.categoryPlaceholder
                  }
                  className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary/40 focus:outline-none"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeAddCategoryModal}
                  className="rounded-lg border border-black/15 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {labels.cancel}
                </button>
                <button
                  type="submit"
                  disabled={addingCategory}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
                >
                  {addingCategory ? labels.adding : labels.add}
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
