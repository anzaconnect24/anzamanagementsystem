import React, { useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Breadcrumb from "@/component/Breadcrumb";
import { UserContext } from "@/layouts/DashboardLayout";
import { useTranslation } from "@/locales";
import {
  getCatalog,
  getCurrentAssessment,
  getUserBusiness,
  saveAssessmentAnswers,
  uploadAssessmentAttachment,
} from "@/controllers/crat_controller";

const DOMAIN_LABELS = {
  commercial_marketing: "Commercial & Market",
  financial: "Financial Domain",
  legal_compliance: "Legal Domain",
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

const getProgressBarColor = (completion = 0) => {
  if (completion < 40) return "#ef4444";
  if (completion < 70) return "#f59e0b";
  return "#10b981";
};

const getQuestionState = (question, answer = {}, isSwahili = false) => {
  const requiredAttachmentText = isSwahili
    ? question.requiredAttachmentSw || question.requiredAttachment || ""
    : question.requiredAttachment || question.requiredAttachmentSw || "";
  const needsAttachment = Boolean(requiredAttachmentText.trim());
  const hasAttachment = Boolean((answer.attachment || "").trim());
  const hasComment = Boolean((answer.entrepreneurComment || "").trim());
  const isComplete = hasAttachment || hasComment;
  const isStarted = hasAttachment || hasComment;

  return {
    requiredAttachmentText,
    needsAttachment,
    hasAttachment,
    hasComment,
    isComplete,
    isStarted,
  };
};

const DomainAssessmentPage = ({ domainKey }) => {
  const { userDetails } = useContext(UserContext);
  const { isSwahili } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [uploadingByQuestion, setUploadingByQuestion] = useState({});
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const title = DOMAIN_LABELS[domainKey] || "CRAT Domain";
  const labels = {
    assessmentScope: isSwahili ? "Eneo la Tathmini" : "Assessment Scope",
    requiredAttachment: isSwahili
      ? "Kiambatisho Kinachohitajika"
      : "Required Attachment",
    attachment: isSwahili ? "Kiambatisho" : "Attachment",
    remarks: isSwahili ? "Maoni" : "Remarks",
    uploaded: isSwahili ? "Imepakiwa" : "Uploaded",
    pending: isSwahili ? "Zinazosubiri" : "Pending",
    completion: isSwahili ? "Ukamilifu" : "Completion",
    saving: isSwahili ? "Inahifadhi..." : "Saving...",
    loading: isSwahili ? "Inapakia taarifa za eneo" : "Loading domain data",
    missingAttachment: isSwahili ? "Kiambatisho hakipo" : "Missing Attachment",
    noAttachmentNeeded: isSwahili
      ? "Hakuna kiambatisho"
      : "No Attachment Needed",
    notRequired: isSwahili ? "Haihitajiki" : "Not required",
    noAttachmentUploaded: isSwahili
      ? "Hakuna kiambatisho kilichopakiwa."
      : "No attachment uploaded.",
    chooseFileFirst: isSwahili
      ? "Tafadhali chagua faili kwanza."
      : "Please choose a file first.",
    uploadedSuccess: isSwahili
      ? "Kiambatisho kimepakiwa."
      : "Attachment uploaded.",
    uploadFailed: isSwahili
      ? "Imeshindikana kupakia kiambatisho."
      : "Failed to upload attachment.",
    uploading: isSwahili ? "Inapakia..." : "Uploading...",
    view: isSwahili ? "Tazama" : "View",
    question: isSwahili ? "Swali" : "Question",
    notes: isSwahili ? "Maelezo" : "Notes",
    notesHint: isSwahili
      ? "Andika maelezo mafupi yanayoonyesha hali ya sasa ya biashara yako."
      : "Add concise context that helps explain your current business position.",
    uploadAttachment: isSwahili ? "Pakia Kiambatisho" : "Upload Attachment",
    replaceAttachment: isSwahili
      ? "Badilisha Kiambatisho"
      : "Replace Attachment",
    evidenceNeeded: isSwahili ? "Ushahidi unaohitajika" : "Evidence needed",
    completed: isSwahili ? "Imekamilika" : "Completed",
    answered: isSwahili ? "Imejibiwa" : "Answered",
    notesRequired: isSwahili ? "Maelezo yanahitajika" : "Notes required",
    responseRequired: isSwahili
      ? "Maelezo au kiambatisho kinahitajika"
      : "Notes or attachment required",
    answerInProgress: isSwahili ? "Inaendelea" : "In progress",
    optionalEvidence: isSwahili
      ? "Hakuna ushahidi wa lazima kwa swali hili."
      : "This question does not require a mandatory attachment.",
    evidenceUploaded: isSwahili ? "Ushahidi" : "Evidence uploaded",
    words: isSwahili ? "maneno" : "words",
    noQuestions: isSwahili
      ? "Hakuna maswali hai yaliyopatikana kwa eneo hili."
      : "No active questions found for this domain.",
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
          mapped[answer.questionId] = {
            attachment: answer.attachment || answer.evidence || "",
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
      questions.map((q) => ({
        questionId: q.id,
        evidence: answers[q.id]?.attachment || "",
        entrepreneurComment: answers[q.id]?.entrepreneurComment || "",
      })),
    [answers, questions],
  );

  const progressStats = useMemo(() => {
    const total = questions.length;
    const evidenceUploaded = questions.filter((question) =>
      Boolean((answers[question.id]?.attachment || "").trim()),
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
    const completion = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, evidenceUploaded, completed, started, pending, completion };
  }, [answers, questions]);

  const setAnswerValue = (questionId, field, value) => {
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
      toast.error("Failed to save draft.");
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

  const onUploadAttachment = async (questionId, selectedFile) => {
    if (!assessment?.id) {
      toast.error("No editable assessment found.");
      return;
    }

    if (!selectedFile) {
      toast.error(labels.chooseFileFirst);
      return;
    }

    try {
      setUploadingByQuestion((prev) => ({ ...prev, [questionId]: true }));

      const payload = await uploadAssessmentAttachment(
        assessment.id,
        questionId,
        selectedFile,
      );

      setAnswerValue(questionId, "attachment", payload?.attachment || "");
      toast.success(labels.uploadedSuccess);
    } catch (error) {
      console.error(error);
      toast.error(labels.uploadFailed);
    } finally {
      setUploadingByQuestion((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="w-full p-4 md:p-6">
        <Breadcrumb pageName={title} />

        <div className="space-y-4 rounded-[28px] border border-black/10 bg-white/95 p-4 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <div className="h-8 w-64 animate-pulse rounded-full bg-slate-200" />
              <div className="h-4 w-96 animate-pulse rounded-full bg-slate-200" />
            </div>
            <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-sky-500" />
              {labels.loading}
            </div>
          </div>

          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-1/3 animate-pulse rounded-full bg-slate-300" />
          </div>

          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-[24px] border border-black/10 bg-slate-50/70 p-5"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="h-6 w-28 animate-pulse rounded-full bg-slate-200" />
                  <div className="h-6 w-24 animate-pulse rounded-full bg-slate-200" />
                </div>
                <div className="space-y-3">
                  <div className="h-4 w-full animate-pulse rounded-full bg-slate-200" />
                  <div className="h-4 w-10/12 animate-pulse rounded-full bg-slate-200" />
                </div>
                <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_1.4fr]">
                  <div className="rounded-2xl border border-black/10 bg-white p-4">
                    <div className="h-4 w-32 animate-pulse rounded-full bg-slate-200" />
                    <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-slate-200" />
                    <div className="mt-2 h-10 w-36 animate-pulse rounded-xl bg-slate-200" />
                  </div>
                  <div className="rounded-2xl border border-black/10 bg-white p-4">
                    <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200" />
                    <div className="mt-3 h-28 w-full animate-pulse rounded-2xl bg-slate-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 md:p-6">
      <Breadcrumb pageName={title} />

      <div className="space-y-4">
        <div className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
                {title}
              </h1>
              <p className="text-sm leading-6 text-slate-600 md:text-[15px]">
                {labels.notesHint}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                {labels.completed}: {progressStats.completed}
              </span>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                {labels.pending}: {progressStats.pending}
              </span>
              <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800">
                {labels.answered}: {progressStats.started}/{questions.length}
              </span>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                {labels.evidenceUploaded}: {progressStats.evidenceUploaded}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {labels.completion}: {progressStats.completion}%
              </span>
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between gap-3 text-xs font-medium text-slate-500">
              <span>{labels.completion}</span>
              <span>{progressStats.completion}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progressStats.completion}%`,
                  backgroundColor: getProgressBarColor(
                    progressStats.completion,
                  ),
                }}
              />
            </div>
          </div>

          {isAutosaving && (
            <p className="mt-3 text-xs font-medium text-slate-600">
              {labels.saving}
            </p>
          )}
        </div>

        <div className="space-y-4">
          {questions.map((question, idx) => {
            const commentValue =
              answers[question.id]?.entrepreneurComment || "";
            const wordCount = getWordCount(commentValue);
            const questionText = isSwahili
              ? question.questionTextSw || question.questionTextEn
              : question.questionTextEn || question.questionTextSw;
            const {
              requiredAttachmentText,
              needsAttachment,
              hasAttachment,
              hasComment,
              isComplete,
              isStarted,
            } = getQuestionState(question, answers[question.id], isSwahili);

            return (
              <section
                key={question.id}
                className="rounded-[26px] border border-black/10 bg-white p-5 shadow-sm transition-colors md:p-6"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                        {labels.question} {idx + 1}
                      </span>
                      {isComplete ? (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                          {labels.completed}
                        </span>
                      ) : needsAttachment ? (
                        <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                          {labels.responseRequired}
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {labels.notesRequired}
                        </span>
                      )}
                    </div>

                    <p className="max-w-4xl text-sm leading-7 text-slate-800 md:text-[15px]">
                      {questionText}
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="rounded-2xl border border-black/10 bg-white p-4">
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
                      className="mt-3 w-full rounded-2xl border border-black/10 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-emerald-300 focus:bg-white"
                      placeholder={labels.notesHint}
                      value={commentValue}
                      onChange={(e) => {
                        setHasInteracted(true);
                        setAnswerValue(
                          question.id,
                          "entrepreneurComment",
                          e.target.value,
                        );
                      }}
                      onBlur={() => onSave(false)}
                    />
                  </div>

                  {needsAttachment && (
                    <div className="rounded-2xl border border-black/10 bg-slate-50/80 p-3">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h2 className="text-sm font-semibold text-slate-900">
                              {labels.attachment}
                            </h2>
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                              {labels.evidenceNeeded}
                            </span>
                          </div>
                          <p className="mt-1 truncate text-xs text-slate-600">
                            {requiredAttachmentText}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <label
                            htmlFor={`attachment-${question.id}`}
                            className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-600"
                          >
                            {hasAttachment
                              ? labels.replaceAttachment
                              : labels.uploadAttachment}
                          </label>
                          <input
                            id={`attachment-${question.id}`}
                            type="file"
                            className="hidden"
                            onChange={(e) =>
                              onUploadAttachment(
                                question.id,
                                e.target.files?.[0] || null,
                              )
                            }
                          />

                          {uploadingByQuestion[question.id] && (
                            <p className="text-xs font-medium text-slate-600">
                              {labels.uploading}
                            </p>
                          )}

                          {answers[question.id]?.attachment ? (
                            <a
                              href={answers[question.id]?.attachment}
                              target="_blank"
                              rel="noreferrer"
                              className="max-w-full truncate rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800 hover:underline"
                              title={getFileNameFromUrl(
                                answers[question.id]?.attachment,
                              )}
                            >
                              {labels.view}:{" "}
                              {getFileNameFromUrl(
                                answers[question.id]?.attachment,
                              )}
                            </a>
                          ) : (
                            <p className="text-xs text-slate-500">
                              {labels.noAttachmentUploaded}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>

        {questions.length === 0 && (
          <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {labels.noQuestions}
          </p>
        )}
      </div>
    </div>
  );
};

export default DomainAssessmentPage;
