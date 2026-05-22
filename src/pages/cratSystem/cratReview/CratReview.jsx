"use client";

import React, { useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
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
    hint: "You can submit your assessment for Review.",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
  },
  submitted: {
    label: "Submitted",
    hint: "Waiting for admin to assign a reviewer.",
    badge: "bg-sky-50 text-sky-700 border-sky-200",
  },
  assigned: {
    label: "Assigned",
    hint: "A reviewer has been assigned to your assessment.",
    badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  in_review: {
    label: "In Review",
    hint: "Reviewer is currently scoring your submission.",
    badge: "bg-violet-50 text-violet-700 border-violet-200",
  },
  review_submitted: {
    label: "Review Submitted",
    hint: "Review is complete and awaiting admin decision.",
    badge: "bg-[#082d77]-50 text-blue-700 border-blue-200",
  },
  published: {
    label: "Published",
    hint: "Final report is published.",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  rejected: {
    label: "Rejected Back",
    hint: "Assessment was returned for updates.",
    badge: "bg-rose-50 text-rose-700 border-rose-200",
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

  const currentStatus = assessment?.status || "draft";

  const isLocked =
    !assessment ||
    [
      "submitted",
      "assigned",
      "in_review",
      "review_submitted",
      "published",
    ].includes(currentStatus);

  const statusMeta = STATUS_META[currentStatus] || {
    label: toTitle(currentStatus),
    hint: "Status updated.",
    badge: "bg-slate-50 text-slate-700 border-slate-200",
  };

  const currentStepIndex = WORKFLOW_STEPS.indexOf(currentStatus);

  const submitCta = isLocked
    ? currentStatus === "draft"
      ? "Submit For Review"
      : "Already Submitted"
    : "Submit For Review";

  if (loading) {
    return (
      <div className="w-full p-4 md:px-6 md:pb-6">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-[220px] animate-pulse rounded-2xl bg-slate-200" />
          <div className="mt-6 h-40 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 md:px-6 md:pb-6">
      <div className="space-y-5">
        {/* HERO */}
        <div className="relative h-[240px] overflow-hidden rounded-[28px] bg-black shadow-sm">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('/images/business_tools_hero.svg')",
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-[#c9672b]/30" />

          <div className="relative z-10 flex h-full items-end p-8 text-white">
            <div className="max-w-3xl">
              <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
                <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
                CRAT Review
              </span>

              <h1 className="mb-3 text-3xl font-bold leading-tight drop-shadow-lg md:text-5xl">
                Assessment Submission Status
              </h1>

              <p className="max-w-2xl text-sm leading-6 text-white/85 md:text-base">
                Track where your Capital Readiness Assessment is in the
                review workflow and submit it for admin assignment when
                ready.
              </p>
            </div>
          </div>
        </div>

        {/* CURRENT STATUS */}
        <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusMeta.badge}`}
              >
                {statusMeta.label}
              </span>

              <h2 className="mt-4 text-xl font-semibold text-slate-900">
                Current Review Position
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
                {statusMeta.hint}
              </p>
            </div>

            <button
              onClick={onSubmit}
              disabled={isLocked}
              className="inline-flex w-fit items-center justify-center rounded-xl bg-[#082d77] px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {submitCta}
            </button>
          </div>
        </section>

        {/* WORKFLOW */}
        <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <p className="text-xs font-semibold tracking-wide text-blue-600">
            Workflow Progress
          </p>

          <h2 className="mt-1 text-xl font-semibold text-slate-900">
            Assessment review lifecycle
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Your assessment moves from draft submission through reviewer
            assignment, review, admin decisioning, and final publication.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {WORKFLOW_STEPS.map((step, index) => {
              const isDone =
                currentStepIndex >= 0 && index <= currentStepIndex;

              const isCurrent = step === currentStatus;

              return (
                <div
                  key={step}
                  className={`rounded-2xl border p-4 text-sm transition ${
                    isCurrent
                      ? "border-blue-200 bg-[#082d77] text-white shadow-sm"
                      : isDone
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-slate-200 bg-slate-50 text-slate-500"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold">
                      {toTitle(step)}
                    </span>

                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                        isCurrent
                          ? "bg-white text-blue-600"
                          : isDone
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {index + 1}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default CratReviewPage;