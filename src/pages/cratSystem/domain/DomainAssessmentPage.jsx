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

  const uploadStats = useMemo(() => {
    const requiredQuestions = questions.filter((q) =>
      Boolean((q.requiredAttachment || "").trim()),
    );
    const total = requiredQuestions.length;
    const uploaded = requiredQuestions.filter((q) =>
      Boolean((answers[q.id]?.attachment || "").trim()),
    ).length;
    const pending = total - uploaded;
    const completion = total > 0 ? Math.round((uploaded / total) * 100) : 0;

    return { total, uploaded, pending, completion };
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

        <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm md:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-96 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-80 animate-pulse rounded bg-slate-200" />
            </div>
            <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-sky-500" />
              {labels.loading}
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-black/10">
            <table className="min-w-[1200px] w-full table-fixed bg-white">
              <thead className="bg-slate-100">
                <tr className="">
                  <th className="w-14 border-b border-black/10 px-3 py-3 text-left text-xs font-semibold capitalize text-slate-700">
                    #
                  </th>
                  <th className="border-b border-black/10 px-3 py-3 text-left text-xs font-semibold capitalize text-slate-700">
                    {labels.assessmentScope}
                  </th>
                  <th className="w-64 border-b border-black/10 px-3 py-3 text-left text-xs font-semibold capitalize text-slate-700">
                    {labels.requiredAttachment}
                  </th>
                  <th className="w-72 border-b border-black/10 px-3 py-3 text-left text-xs font-semibold capitalize text-slate-700">
                    {labels.attachment}
                  </th>
                  <th className="w-72 border-b border-black/10 px-3 py-3 text-left text-xs font-semibold capitalize text-slate-700">
                    {labels.remarks}
                  </th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="align-top bg-white">
                    <td className="border-b border-black/10 px-3 py-3 text-sm text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="border-b border-black/10 px-3 py-3">
                      <div className="space-y-2">
                        <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
                        <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
                        <div className="h-4 w-11/12 animate-pulse rounded bg-slate-200" />
                      </div>
                    </td>
                    <td className="border-b border-black/10 px-3 py-3">
                      <div className="pt-6">
                        <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
                      </div>
                    </td>
                    <td className="border-b border-black/10 px-3 py-3">
                      <div className="h-10 w-full animate-pulse rounded-lg bg-slate-200" />
                      <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-slate-200" />
                    </td>
                    <td className="border-b border-black/10 px-3 py-3">
                      <div className="h-24 w-full animate-pulse rounded-lg bg-slate-200" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 md:p-6">
      <Breadcrumb pageName={title} />

      <div className="  ">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                {labels.uploaded}: {uploadStats.uploaded}
              </span>
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                {labels.pending}: {uploadStats.pending}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                {labels.completion}: {uploadStats.completion}%
              </span>
            </div>
          </div>
          {isAutosaving && (
            <p className="text-xs font-medium text-slate-600">
              {labels.saving}
            </p>
          )}
        </div>

        <div className="overflow-x-auto rounded-xl border border-black/10">
          <table className="min-w-[1200px] w-full table-fixed bg-white">
            <thead className="bg-white">
              <tr>
                <th className="w-14 border-b border-black/10 px-3 py-3 text-left text-xs font-semibold capitalize text-slate-700">
                  #
                </th>
                <th className="border-b border-black/10 px-3 py-3 text-left text-xs font-semibold capitalize text-slate-700">
                  {labels.assessmentScope}
                </th>
                <th className="w-64 border-b border-black/10 px-3 py-3 text-left text-xs font-semibold capitalize text-slate-700">
                  {labels.requiredAttachment}
                </th>
                <th className="w-72 border-b border-black/10 px-3 py-3 text-left text-xs font-semibold capitalize text-slate-700">
                  {labels.attachment}
                </th>
                <th className="w-72 border-b border-black/10 px-3 py-3 text-left text-xs font-semibold capitalize text-slate-700">
                  {labels.remarks}
                </th>
              </tr>
            </thead>
            <tbody>
              {questions.map((question, idx) => {
                const requiredAttachmentText = isSwahili
                  ? question.requiredAttachmentSw ||
                    question.requiredAttachment ||
                    ""
                  : question.requiredAttachment ||
                    question.requiredAttachmentSw ||
                    "";
                const needsAttachment = Boolean(requiredAttachmentText.trim());
                const hasAttachment = Boolean(answers[question.id]?.attachment);
                const rowStyle = hasAttachment
                  ? "bg-emerald-50/30"
                  : "bg-white";
                const questionText = isSwahili
                  ? question.questionTextSw || question.questionTextEn
                  : question.questionTextEn || question.questionTextSw;

                return (
                  <tr key={question.id} className={`align-top ${rowStyle}`}>
                    <td className="border-b border-black/10 px-3 py-3 text-sm text-slate-700">
                      {idx + 1}
                    </td>
                    <td className="border-b border-black/10 px-3 py-3 text-sm leading-6 text-slate-800">
                      <div className="mb-2">
                        {hasAttachment ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                            {labels.uploaded}
                          </span>
                        ) : needsAttachment ? (
                          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                            {labels.missingAttachment}
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                            {labels.noAttachmentNeeded}
                          </span>
                        )}
                      </div>
                      {questionText}
                    </td>
                    <td className="border-b border-black/10 px-3 py-3 text-sm text-slate-700">
                      <div className="pt-8">
                        {requiredAttachmentText || "-"}
                      </div>
                    </td>
                    <td className="border-b border-black/10 px-3 py-3">
                      {needsAttachment ? (
                        <div className="space-y-2 rounded-lg border border-black/10 bg-slate-50 p-2.5">
                          <input
                            type="file"
                            className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm"
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
                              className="block truncate text-xs font-medium text-sky-700 hover:underline"
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
                      ) : (
                        <div className="rounded-lg border border-black/10 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
                          {labels.notRequired}
                        </div>
                      )}
                    </td>
                    <td className="border-b border-black/10 px-3 py-3">
                      <textarea
                        rows={4}
                        className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm"
                        value={answers[question.id]?.entrepreneurComment || ""}
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
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
