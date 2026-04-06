import React, { useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Breadcrumb from "@/component/Breadcrumb";
import { UserContext } from "@/layouts/DashboardLayout";
import {
  getCatalog,
  getCurrentAssessment,
  getUserBusiness,
  saveAssessmentAnswers,
  uploadAssessmentAttachment,
} from "@/controllers/crat_controller";

const DOMAIN_LABELS = {
  commercial_marketing: "Commercial & Marketing",
  financial: "Financial",
  legal_compliance: "Legal & Compliance",
  operations: "Operations",
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
  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [uploadingByQuestion, setUploadingByQuestion] = useState({});
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const title = DOMAIN_LABELS[domainKey] || "CRAT Domain";

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
    const total = questions.length;
    const uploaded = questions.filter((q) =>
      Boolean(answers[q.id]?.attachment),
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
      toast.error("Please choose a file first.");
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
      toast.success("Attachment uploaded.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload attachment.");
    } finally {
      setUploadingByQuestion((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl p-4 md:p-6">
        {/* <Breadcrumb pageName={title}  /> */}

        <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm md:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-96 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-80 animate-pulse rounded bg-slate-200" />
            </div>
            <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-sky-500" />
              Loading domain data
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-black/10">
            <table className="min-w-[1200px] w-full table-fixed bg-white">
              <thead className="bg-slate-100">
                <tr>
                  <th className="w-14 border-b border-black/10 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                    #
                  </th>
                  <th className="border-b border-black/10 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                    Assessment Scope & Question
                  </th>
                  <th className="w-64 border-b border-black/10 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                    Required Attachment
                  </th>
                  <th className="w-72 border-b border-black/10 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                    Attachment
                  </th>
                  <th className="w-72 border-b border-black/10 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                    Remarks
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
                      <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
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
    <div className="mx-auto max-w-6xl p-4 md:p-6">
      <Breadcrumb pageName={title} />

      <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm md:p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
            <p className="mt-1 text-sm text-slate-600">
              Entrepreneur view: provide evidence and comments for reviewer
              scoring.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                Uploaded: {uploadStats.uploaded}
              </span>
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                Pending: {uploadStats.pending}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                Completion: {uploadStats.completion}%
              </span>
            </div>
          </div>
          {isAutosaving && (
            <p className="text-xs font-medium text-slate-600">Saving...</p>
          )}
        </div>

        <div className="overflow-x-auto rounded-xl border border-black/10">
          <table className="min-w-[1200px] w-full table-fixed bg-white">
            <thead className="bg-slate-100">
              <tr>
                <th className="w-14 border-b border-black/10 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                  #
                </th>
                <th className="border-b border-black/10 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                  Assessment Scope & Question
                </th>
                <th className="w-64 border-b border-black/10 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                  Required Attachment
                </th>
                <th className="w-72 border-b border-black/10 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                  Attachment
                </th>
                <th className="w-72 border-b border-black/10 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                  Remarks
                </th>
              </tr>
            </thead>
            <tbody>
              {questions.map((question, idx) => {
                const hasAttachment = Boolean(answers[question.id]?.attachment);
                const rowStyle = hasAttachment
                  ? "bg-emerald-50/30"
                  : "bg-white";

                return (
                  <tr key={question.id} className={`align-top ${rowStyle}`}>
                    <td className="border-b border-black/10 px-3 py-3 text-sm text-slate-700">
                      {idx + 1}
                    </td>
                    <td className="border-b border-black/10 px-3 py-3 text-sm leading-6 text-slate-800">
                      <div className="mb-2">
                        {hasAttachment ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                            Uploaded
                          </span>
                        ) : (
                          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                            Missing Attachment
                          </span>
                        )}
                      </div>
                      {question.questionTextEn}
                    </td>
                    <td className="border-b border-black/10 px-3 py-3 text-sm text-slate-700">
                      {question.requiredAttachment || "-"}
                    </td>
                    <td className="border-b border-black/10 px-3 py-3">
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
                            Uploading...
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
                            View:{" "}
                            {getFileNameFromUrl(
                              answers[question.id]?.attachment,
                            )}
                          </a>
                        ) : (
                          <p className="text-xs text-slate-500">
                            No attachment uploaded.
                          </p>
                        )}
                      </div>
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
            No active questions found for this domain.
          </p>
        )}
      </div>
    </div>
  );
};

export default DomainAssessmentPage;
