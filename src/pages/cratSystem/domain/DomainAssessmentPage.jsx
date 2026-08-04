import React, { useContext, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { UserContext } from "@/layouts/DashboardLayout";
import { useTranslation } from "@/locales";
import {
  getCatalog,
  getCurrentAssessment,
  getUserBusiness,
  deleteAssessmentAttachment,
  saveAssessmentAnswers,
  uploadAssessmentAttachment,
} from "@/controllers/crat_controller";
import {
  FaCloudUploadAlt,
  FaEye,
  FaFileAlt,
  FaTrash,
  FaSyncAlt,
  FaCheckCircle,
  FaClock,
  FaPenAlt,
  FaFolderOpen,
} from "react-icons/fa";

const DOMAIN_LABELS = {
  commercial_marketing: "Commercial and Market Domain",
  financial: "Financial Domain",
  legal_compliance: "Legal & Compliance Domain",
  operations: "Operations Domain",
};

const getFileNameFromUrl = (url = "") => {
  try {
    const clean = String(url).split("?")[0];
    return decodeURIComponent(clean.split("/").pop() || "Uploaded file");
  } catch {
    return "Uploaded file";
  }
};

const getWordCount = (text = "") => {
  const trimmed = String(text).trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
};

const toAttachmentList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  const text = String(value || "").trim();
  if (!text) return [];

  if (text.startsWith("[")) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item || "").trim()).filter(Boolean);
      }
    } catch (_) {
      return [text];
    }
  }

  return [text];
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

const resolveRequiredAttachmentList = (question, isSwahili = false) => {
  const preferredList = toRequiredAttachmentList(
    isSwahili ? question.requiredAttachmentsSw : question.requiredAttachments,
  );
  if (preferredList.length > 0) return preferredList;

  const fallbackList = toRequiredAttachmentList(
    isSwahili ? question.requiredAttachments : question.requiredAttachmentsSw,
  );
  if (fallbackList.length > 0) return fallbackList;

  return toRequiredAttachmentList(
    isSwahili
      ? question.requiredAttachmentSw || question.requiredAttachment
      : question.requiredAttachment || question.requiredAttachmentSw,
  );
};

const getApiErrorMessage = (error, fallback) => {
  const message =
    error?.response?.data?.message ||
    error?.response?.data?.error?.message ||
    error?.message;

  return message || fallback;
};

const getProgressBarColor = (progress = 0) => {
  if (progress < 40) return "#ef4444";
  if (progress < 70) return "#f59e0b";
  return "#10b981";
};

const getQuestionState = (question, answer = {}, isSwahili = false) => {
  const requiredAttachmentList = resolveRequiredAttachmentList(
    question,
    isSwahili,
  );

  const attachments = toAttachmentList(
    answer.attachments || answer.attachment || answer.evidence,
  );
  const attachmentCount = attachments.length;
  const hasAttachment = attachmentCount > 0;
  const hasComment = Boolean((answer.entrepreneurComment || "").trim());
  const requiredAttachmentCount = requiredAttachmentList.length;
  const hasRequiredAttachmentCount = attachmentCount >= requiredAttachmentCount;
  const needsAttachment = requiredAttachmentCount > 0;

  return {
    requiredAttachmentList,
    requiredAttachmentText: requiredAttachmentList.join(", "),
    requiredAttachmentCount,
    uploadedAttachmentCount: attachmentCount,
    needsAttachment,
    hasAttachment,
    hasComment,
    isComplete: needsAttachment
      ? hasRequiredAttachmentCount
      : hasAttachment || hasComment,
    isStarted: hasAttachment || hasComment,
  };
};

const DomainAssessmentPage = ({ domainKey: propDomainKey } = {}) => {
  const { domainKey: urlDomainKey } = useParams();
  const domainKey = urlDomainKey || propDomainKey;

  const { userDetails } = useContext(UserContext);
  const { isSwahili } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [uploadingByQuestion, setUploadingByQuestion] = useState({});
  const [deletingAttachmentKey, setDeletingAttachmentKey] = useState("");
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const title = DOMAIN_LABELS[domainKey] || "CRAT Domain";
  const isEditableAssessment = ["draft", "admin_rejected"].includes(
    assessment?.status,
  );

  const labels = {
    requiredDocuments: isSwahili
      ? "Nyaraka Zinazohitajika"
      : "Required Documents",
    requiredDocumentsHint: isSwahili
      ? "Pakia ushahidi unaohitajika kwa eneo hili la tathmini."
      : "Upload supporting evidence required for this assessment domain.",
    attached: isSwahili ? "Imeambatishwa" : "Attached",
    missing: isSwahili ? "Haijapakiwa" : "Missing",
    pending: isSwahili ? "Zinazosubiri" : "Pending",
    progress: isSwahili ? "Maendeleo" : "Progress",
    saving: isSwahili ? "Inahifadhi..." : "Saving...",
    chooseFileFirst: isSwahili
      ? "Tafadhali chagua faili kwanza."
      : "Please choose a file first.",
    uploadedSuccess: isSwahili
      ? "Kiambatisho kimepakiwa."
      : "Attachment uploaded.",
    uploadFailed: isSwahili
      ? "Imeshindikana kupakia kiambatisho."
      : "Failed to upload attachment.",
    deleteAttachment: isSwahili ? "Futa" : "Delete",
    deleteAttachmentConfirm: isSwahili
      ? "Ungependa kufuta kiambatisho hiki?"
      : "Delete this attachment?",
    deleteAttachmentFailed: isSwahili
      ? "Imeshindikana kufuta kiambatisho."
      : "Failed to delete attachment.",
    deletingAttachment: isSwahili ? "Inafuta..." : "Deleting...",
    view: isSwahili ? "Tazama" : "View",
    notes: isSwahili ? "Maelezo" : "Notes",
    notesHint: isSwahili
      ? "Andika maelezo mafupi yanayoonyesha hali ya sasa ya biashara yako."
      : "Add concise context that helps explain your current business position.",
    uploadAttachment: isSwahili ? "Pakia" : "Upload",
    uploadAttachments: isSwahili ? "Pakia Viambatisho" : "Upload Attachments",
    replaceAttachment: isSwahili ? "Badilisha" : "Replace",
    completed: isSwahili ? "Imekamilika" : "Completed",
    answered: isSwahili ? "Imejibiwa" : "Answered",
    evidenceUploaded: isSwahili ? "Ushahidi" : "Evidence uploaded",
    words: isSwahili ? "maneno" : "words",
    noQuestions: isSwahili
      ? "Hakuna maswali hai yaliyopatikana kwa eneo hili."
      : "No active questions found for this domain.",
    noRequiredDocuments: isSwahili
      ? "Hakuna nyaraka za lazima kwa eneo hili."
      : "No required documents for this domain.",
    uploadedFiles: isSwahili ? "Faili Zilizopakiwa" : "Uploaded Files",
    fileLabel: isSwahili ? "Faili" : "File",
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const userUuid = userDetails?.uuid;
        if (!userUuid) return;

        const business = await getUserBusiness(userUuid);

        if (!business?.id) {
          toast.error("No business profile found for CRAT.");
          return;
        }

        const [catalog, current] = await Promise.all([
          getCatalog(business.id),
          getCurrentAssessment(business.id),
        ]);

        setQuestions(catalog?.domains?.[domainKey] || []);
        setAssessment(current?.assessment || null);

        const mapped = {};

        (current?.answers || []).forEach((answer) => {
          const attachments = toAttachmentList(
            answer.attachments || answer.attachment || answer.evidence,
          );

          mapped[answer.questionId] = {
            attachments,
            attachment: attachments[0] || "",
            entrepreneurComment: answer.entrepreneurComment || "",
          };
        });

        setAnswers(mapped);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load CRAT domain data.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [domainKey, userDetails?.uuid]);

  const preparedAnswers = useMemo(
    () =>
      questions.map((question) => ({
        questionId: question.id,
        attachments: answers[question.id]?.attachments || [],
        entrepreneurComment: answers[question.id]?.entrepreneurComment || "",
      })),
    [answers, questions],
  );

  const requiredDocuments = useMemo(
    () =>
      questions.filter(
        (question) =>
          getQuestionState(question, answers[question.id], isSwahili)
            .needsAttachment,
      ),
    [questions, answers, isSwahili],
  );

  const progressStats = useMemo(() => {
    const total = questions.length;

    const evidenceUploaded = questions.filter(
      (question) => (answers[question.id]?.attachments || []).length > 0,
    ).length;

    const completed = questions.filter(
      (question) =>
        getQuestionState(question, answers[question.id], isSwahili).isComplete,
    ).length;

    const started = questions.filter(
      (question) =>
        getQuestionState(question, answers[question.id], isSwahili).isStarted,
    ).length;

    const pending = total - completed;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      evidenceUploaded,
      completed,
      started,
      pending,
      progress,
    };
  }, [answers, questions, isSwahili]);

  const setAnswerValue = (questionId, field, value) => {
    setHasInteracted(true);

    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [field]: value,
      },
    }));
  };

  const onSave = async (showSuccess = false) => {
    if (!assessment?.id) {
      toast.error("No editable assessment found.");
      return;
    }

    try {
      setIsAutosaving(true);
      await saveAssessmentAnswers(assessment.id, preparedAnswers);

      if (showSuccess) {
        toast.success("Draft saved.");
      }
    } catch (error) {
      console.error(error);
      toast.error(getApiErrorMessage(error, "Failed to save draft."));
    } finally {
      setIsAutosaving(false);
    }
  };

  useEffect(() => {
    if (!assessment?.id || !hasInteracted) return;

    const timer = setTimeout(() => {
      onSave(false);
    }, 700);

    return () => clearTimeout(timer);
  }, [preparedAnswers, assessment?.id, hasInteracted]);

  const onUploadAttachment = async (questionId, selectedFiles) => {
    if (!assessment?.id) {
      toast.error("No editable assessment found.");
      return;
    }

    const files = Array.isArray(selectedFiles)
      ? selectedFiles.filter(Boolean)
      : [selectedFiles].filter(Boolean);

    if (files.length === 0) {
      toast.error(labels.chooseFileFirst);
      return;
    }

    try {
      setUploadingByQuestion((prev) => ({
        ...prev,
        [questionId]: true,
      }));

      const payload = await uploadAssessmentAttachment(
        assessment.id,
        questionId,
        files,
      );

      const attachments = toAttachmentList(
        payload?.attachments || payload?.attachment,
      );
      setAnswerValue(questionId, "attachments", attachments);
      setAnswerValue(questionId, "attachment", attachments[0] || "");
      toast.success(labels.uploadedSuccess);
    } catch (error) {
      console.error(error);
      toast.error(getApiErrorMessage(error, labels.uploadFailed));
    } finally {
      setUploadingByQuestion((prev) => ({
        ...prev,
        [questionId]: false,
      }));
    }
  };

  const onDeleteAttachment = async (questionId, attachmentUrl) => {
    if (!assessment?.id || !attachmentUrl) {
      return;
    }

    if (!window.confirm(labels.deleteAttachmentConfirm)) {
      return;
    }

    const attachmentKey = `${questionId}:${attachmentUrl}`;

    try {
      setDeletingAttachmentKey(attachmentKey);
      const result = await deleteAssessmentAttachment(
        assessment.id,
        questionId,
        attachmentUrl,
      );

      const attachments = toAttachmentList(
        result?.attachments || result?.attachment,
      );

      setAnswers((prev) => ({
        ...prev,
        [questionId]: {
          ...prev[questionId],
          attachments,
          attachment: attachments[0] || "",
        },
      }));

      toast.success(result?.message || labels.deleteAttachment);
    } catch (error) {
      console.error(error);
      toast.error(getApiErrorMessage(error, labels.deleteAttachmentFailed));
    } finally {
      setDeletingAttachmentKey("");
    }
  };

  if (loading) {
    return (
      <div className="w-full p-4 md:px-6 md:pb-6">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-8 w-64 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-3 h-4 w-96 animate-pulse rounded-full bg-slate-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 md:px-6 md:pb-6">
      {/* HERO */}
      <div className="relative mb-5 h-[240px] overflow-hidden rounded-[28px] border border-slate-200 bg-black shadow-sm">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/images/business_tools_hero.svg')",
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/20" />

        <div className="relative z-10 flex h-full items-end p-8 text-white">
          <div className="max-w-3xl">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
              CRAT Assessment Domain
            </span>

            <h2 className="mb-3 text-3xl font-bold leading-tight drop-shadow-lg md:text-4xl">
              {title}
            </h2>

            <p className="max-w-2xl text-sm leading-6 text-white/85 md:text-base">
              {labels.notesHint}
            </p>
          </div>
        </div>
      </div>

      {/* STATUS CARDS */}
      <div className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <FaCheckCircle className="absolute right-5 top-5 text-xl text-emerald-500" />

          <p className="text-3xl font-bold text-slate-900">
            {progressStats.completed}
          </p>

          <p className="mt-2 text-sm font-medium text-slate-500">
            {labels.completed}
          </p>
        </div>

        <div className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <FaClock className="absolute right-5 top-5 text-xl text-amber-500" />

          <p className="text-3xl font-bold text-slate-900">
            {progressStats.pending}
          </p>

          <p className="mt-2 text-sm font-medium text-slate-500">
            {labels.pending}
          </p>
        </div>

        <div className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <FaCheckCircle className="absolute right-5 top-5 text-xl text-emerald-500" />

          <p className="text-3xl font-bold text-slate-900">
            {progressStats.started}/{questions.length}
          </p>

          <p className="mt-2 text-sm font-medium text-slate-500">
            {labels.answered}
          </p>
        </div>

        <div className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <FaFolderOpen className="absolute right-5 top-5 text-xl text-[#082d77]" />

          <p className="text-3xl font-bold text-slate-900">
            {progressStats.evidenceUploaded}
          </p>

          <p className="mt-2 text-sm font-medium text-slate-500">
            {labels.evidenceUploaded}
          </p>
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div className="mb-6 rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-sm md:px-6">
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500">
          <span>{labels.progress}</span>
          <span>{progressStats.progress}%</span>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${progressStats.progress}%`,
              backgroundColor: getProgressBarColor(progressStats.progress),
            }}
          />
        </div>

        {isAutosaving && (
          <p className="mt-3 text-xs font-medium text-slate-600">
            {labels.saving}
          </p>
        )}

        {!isEditableAssessment && assessment?.status && (
          <p className="mt-3 text-xs font-medium text-amber-700">
            This assessment is currently in "{assessment.status}" status and is
            read-only.
          </p>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-6 xl:grid-cols-4">
        <main className="space-y-4 xl:col-span-3">
          {questions.map((question, index) => {
            const commentValue =
              answers[question.id]?.entrepreneurComment || "";

            const wordCount = getWordCount(commentValue);

            const questionText = isSwahili
              ? question.questionTextSw || question.questionTextEn
              : question.questionTextEn || question.questionTextSw;

            return (
              <section
                key={question.id}
                className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm transition md:p-6"
              >
                <div className="space-y-3">
                  <span className="inline-flex rounded-full bg-[#082d77] px-3 py-1 text-xs font-semibold text-white">
                    {index + 1}
                  </span>

                  <p className="max-w-4xl text-sm leading-7 text-slate-800 md:text-[15px]">
                    {questionText}
                  </p>
                </div>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-sm font-semibold text-slate-900">
                      {labels.notes}
                    </h2>

                    <span className="text-xs font-medium text-slate-400">
                      {wordCount} {labels.words}
                    </span>
                  </div>

                  <textarea
                    rows={6}
                    className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-[#082d77] focus:ring-2 focus:ring-[#082d77]/10"
                    placeholder={labels.notesHint}
                    value={commentValue}
                    disabled={!isEditableAssessment}
                    onChange={(event) =>
                      setAnswerValue(
                        question.id,
                        "entrepreneurComment",
                        event.target.value,
                      )
                    }
                    onBlur={() => onSave(false)}
                  />
                </div>
              </section>
            );
          })}

          {questions.length === 0 && (
            <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {labels.noQuestions}
            </p>
          )}
        </main>

        <aside className="h-fit rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-6 xl:col-span-1">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-slate-900">
              {labels.requiredDocuments}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {labels.requiredDocumentsHint}
            </p>
          </div>

          {requiredDocuments.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              {labels.noRequiredDocuments}
            </div>
          ) : (
            <div className="space-y-3">
              {requiredDocuments.map((question) => {
                const state = getQuestionState(
                  question,
                  answers[question.id],
                  isSwahili,
                );

                const attachments = answers[question.id]?.attachments || [];
                const attachmentUrl = attachments[attachments.length - 1] || "";

                return (
                  <div
                    key={question.id}
                    className="rounded-2xl border border-[#082d77]/10 bg-[#082d77]/5 p-3 transition hover:border-[#082d77]/20 hover:bg-[#082d77]/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#082d77]/10 bg-white text-[#082d77] shadow-sm">
                        <FaFileAlt />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p
                          className="text-sm font-semibold text-slate-900"
                          title={state.requiredAttachmentText}
                        >
                          {state.requiredAttachmentList[0] ||
                            state.requiredAttachmentText}
                        </p>

                        <p
                          className={`mt-1 text-[11px] font-semibold ${
                            state.uploadedAttachmentCount >=
                            state.requiredAttachmentCount
                              ? "text-emerald-600"
                              : "text-amber-600"
                          }`}
                        >
                          {state.requiredAttachmentCount > 1
                            ? `${state.uploadedAttachmentCount}/${state.requiredAttachmentCount} ${labels.attached.toLowerCase()}`
                            : state.hasAttachment
                              ? labels.attached
                              : labels.missing}
                        </p>

                        {state.requiredAttachmentList.length > 1 && (
                          <div className="mt-2 rounded-lg border border-slate-200 bg-white px-2 py-1">
                            {state.requiredAttachmentList.map(
                              (requiredItem, idx) => (
                                <p
                                  key={`${question.id}-required-${idx}`}
                                  className="truncate text-[11px] text-slate-500"
                                  title={requiredItem}
                                >
                                  {idx + 1}. {requiredItem}
                                </p>
                              ),
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        <label
                          htmlFor={`sidebar-attachment-${question.id}`}
                          className={`text-[#082d77] transition hover:text-blue-700 ${
                            isEditableAssessment
                              ? "cursor-pointer"
                              : "cursor-not-allowed opacity-50"
                          }`}
                          title={
                            state.hasAttachment
                              ? labels.replaceAttachment
                              : labels.uploadAttachments
                          }
                        >
                          {uploadingByQuestion[question.id] ? (
                            <FaSyncAlt className="animate-spin" />
                          ) : (
                            <FaCloudUploadAlt />
                          )}
                        </label>

                        <input
                          id={`sidebar-attachment-${question.id}`}
                          type="file"
                          multiple
                          className="hidden"
                          disabled={!isEditableAssessment}
                          onChange={(event) =>
                            onUploadAttachment(
                              question.id,
                              Array.from(event.target.files || []),
                            )
                          }
                        />

                        {attachmentUrl && (
                          <a
                            href={attachmentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-600 transition hover:text-emerald-700"
                            title={`${labels.view}: ${getFileNameFromUrl(
                              attachmentUrl,
                            )}`}
                          >
                            <FaEye />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default DomainAssessmentPage;
