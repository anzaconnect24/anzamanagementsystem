import React, { useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import Breadcrumb from "@/component/Breadcrumb";
import { UserContext } from "@/layouts/DashboardLayout";
import {
  getCurrentAssessment,
  getUserBusiness,
  submitAssessment,
} from "@/controllers/crat_controller";

const WORKFLOW_STEPS = [
  "draft",
  "submitted",
  "assigned",
  "in_review",
  "review_submitted",
  "published",
];

const STATUS_META = {
  draft: {
    label: "Draft",
    hint: "You can submit your assessment for admin assignment.",
    pill: "bg-amber-100 text-amber-800 border-amber-200",
  },
  submitted: {
    label: "Submitted",
    hint: "Waiting for admin to assign a reviewer.",
    pill: "bg-sky-100 text-sky-800 border-sky-200",
  },
  assigned: {
    label: "Assigned",
    hint: "A reviewer has been assigned to your assessment.",
    pill: "bg-indigo-100 text-indigo-800 border-indigo-200",
  },
  in_review: {
    label: "In Review",
    hint: "Reviewer is currently scoring your submission.",
    pill: "bg-violet-100 text-violet-800 border-violet-200",
  },
  review_submitted: {
    label: "Review Submitted",
    hint: "Review is complete and awaiting admin decision.",
    pill: "bg-blue-100 text-blue-800 border-blue-200",
  },
  published: {
    label: "Published",
    hint: "Final report is published.",
    pill: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  rejected: {
    label: "Rejected Back",
    hint: "Assessment was returned for updates.",
    pill: "bg-rose-100 text-rose-800 border-rose-200",
  },
};

const toTitle = (value = "") =>
  String(value)
    .split("_")
    .filter(Boolean)
    .map((piece) => piece[0]?.toUpperCase() + piece.slice(1))
    .join(" ");

const CratReviewPage = () => {
  const { userDetails } = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState(null);
  const [businessId, setBusinessId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const business = await getUserBusiness(userDetails?.uuid);
        if (!business?.id) return;

        setBusinessId(business.id);
        const current = await getCurrentAssessment(business.id);
        setAssessment(current?.assessment || null);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load CRAT status.");
      } finally {
        setLoading(false);
      }
    };

    if (userDetails?.uuid) {
      load();
    }
  }, [userDetails?.uuid]);

  const onSubmit = async () => {
    if (!assessment?.id) return;
    try {
      await submitAssessment(assessment.id);
      const current = await getCurrentAssessment(businessId);
      setAssessment(current?.assessment || null);
      toast.success("Assessment submitted to admin for assignment.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit assessment.");
    }
  };

  const isLocked =
    !assessment ||
    [
      "submitted",
      "assigned",
      "in_review",
      "review_submitted",
      "published",
    ].includes(assessment.status);

  const currentStatus = assessment?.status || "draft";
  const statusMeta = STATUS_META[currentStatus] || {
    label: toTitle(currentStatus),
    hint: "Status updated.",
    pill: "bg-slate-100 text-slate-700 border-slate-200",
  };
  const currentStepIndex = WORKFLOW_STEPS.indexOf(currentStatus);
  const submitCta = isLocked
    ? currentStatus === "draft"
      ? "Submit For Admin Assignment"
      : "Already Submitted"
    : "Submit For Admin Assignment";

  return (
    <div className="w-full p-4 md:p-6">
      <Breadcrumb pageName="CRAT Review Status" />
      <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
        <div className="bg-white p-5 md:p-8">
          {loading ? (
            <div className="space-y-4">
              <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
              <div className="h-16 w-full animate-pulse rounded-xl bg-slate-100" />
              <div className="h-24 w-full animate-pulse rounded-xl bg-slate-100" />
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-black/10 bg-slate-50 p-4 md:p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 md:text-sm">
                  Current Status
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <span
                    className={`inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-semibold ${statusMeta.pill}`}
                  >
                    {statusMeta.label}
                  </span>
                  <p className="text-sm text-slate-600 md:text-base">
                    {statusMeta.hint}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-black/10 bg-slate-50 p-4 md:p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 md:text-sm">
                  Workflow Progress
                </p>
                <div className="mt-4 grid gap-2 md:grid-cols-3">
                  {WORKFLOW_STEPS.map((step, index) => {
                    const isDone =
                      currentStepIndex >= 0 && index <= currentStepIndex;
                    const isCurrent = step === currentStatus;

                    return (
                      <div
                        key={step}
                        className={`rounded-lg border px-3 py-2.5 text-sm ${
                          isCurrent
                            ? "border-primary bg-primary text-white"
                            : isDone
                              ? "border-slate-300 bg-slate-100 text-slate-800"
                              : "border-slate-200 bg-white text-slate-500"
                        }`}
                      >
                        {toTitle(step)}
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={onSubmit}
                disabled={isLocked}
                className="mt-7 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {submitCta}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CratReviewPage;
