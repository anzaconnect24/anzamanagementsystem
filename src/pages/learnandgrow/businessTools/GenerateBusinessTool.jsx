"use client";

import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useRouter } from "@/utils/navigation";
import Link from "@/utils/link";
import Loader from "@/components/common/Loader";
import Breadcrumb from "../../../components/Breadcrumbs/Breadcrumb";
import Spinner from "../../../components/spinner";
import toast from "react-hot-toast";
import { UserContext } from "../../../layouts/DashboardLayout";
import {
  getBusinessTool,
  generateBusinessTool,
  getMyBusiness,
} from "../../../controllers/business_tools_controller";
import { downloadBusinessToolResultPDF } from "../../../services/businessToolPDF";

// Mirrors BUSINESS_CONTEXT_FIELDS in the backend's business_tools.controller.js —
// the set of Business fields useful as AI context. Kept in sync manually,
// same as this app's other small constant lists.
const BUSINESS_FIELDS = [
  { key: "name", label: "Business Name" },
  { key: "description", label: "Description" },
  { key: "problem", label: "Problem" },
  { key: "solution", label: "Solution" },
  { key: "market", label: "Target Market" },
  { key: "stage", label: "Business Stage" },
  { key: "revenue", label: "Revenue" },
  { key: "traction", label: "Traction" },
  { key: "numberOfCustomers", label: "Number of Customers" },
  { key: "team", label: "Team" },
  { key: "growthPlan", label: "Growth Plan" },
  { key: "fundraisingNeeds", label: "Funding Needs" },
  { key: "impact", label: "Impact" },
  { key: "location", label: "Location" },
];

const isBlank = (value) => value === null || value === undefined || String(value).trim() === "";

// ~500 characters is roughly 5-6 lines of wrapped text at this card width —
// short enough to read comfortably inline. Longer sections collapse behind
// a "Show more" toggle so a long business-plan section doesn't force
// excessive scrolling past shorter ones.
const SECTION_COLLAPSE_THRESHOLD = 500;

const formatResultAsText = (result) => {
  const parts = [String(result?.title || "").toUpperCase()];
  if (result?.summary) parts.push("", result.summary);
  (result?.sections || []).forEach((section) => {
    parts.push("", String(section?.heading || "").toUpperCase(), section?.content || "");
  });
  return parts.join("\n");
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#082d77] focus:ring-4 focus:ring-[#082d77]/20";

const GenerateBusinessTool = () => {
  const { uuid } = useParams();
  const router = useRouter();
  const { userDetails } = useContext(UserContext);

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [tool, setTool] = useState(null);
  const [business, setBusiness] = useState(null);
  const [additionalInputs, setAdditionalInputs] = useState({});
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  // Persistent generation error — separate from pageError (initial load
  // failures) so a missed/dismissed toast doesn't leave the user with no
  // indication of what went wrong.
  const [generationError, setGenerationError] = useState("");
  const [expandedSections, setExpandedSections] = useState({});

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setPageError("");

      try {
        const toolRes = await getBusinessTool(uuid);
        const loadedTool = toolRes.body || toolRes.data;

        if (!loadedTool) {
          if (!cancelled) setPageError("Business tool not found.");
          return;
        }

        if (!loadedTool.aiEnabled) {
          if (!cancelled) {
            setTool(loadedTool);
            setPageError("AI generation is not enabled for this business tool.");
          }
          return;
        }

        if (!cancelled) setTool(loadedTool);

        try {
          const businessRes = await getMyBusiness();
          if (!cancelled) setBusiness(businessRes.body || businessRes.data || null);
        } catch {
          // Not fatal — the page still renders with the "no business profile"
          // state and a clear message, matching the backend's own behavior.
          if (!cancelled) setBusiness(null);
        }
      } catch (error) {
        if (!cancelled) {
          setPageError(
            error?.message === "Business tool not found"
              ? "Business tool not found."
              : "Failed to load this business tool."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [uuid]);

  const missingFields = business
    ? BUSINESS_FIELDS.filter((field) => isBlank(business[field.key]))
    : BUSINESS_FIELDS;

  const existingFields = business
    ? BUSINESS_FIELDS.filter((field) => !isBlank(business[field.key]))
    : [];

  // Same flow whether this is the first generation or a regenerate. On a
  // regenerate, the previous result is deliberately left in place until the
  // new one succeeds — clearing it upfront would mean a failed regenerate
  // loses a perfectly good result the user already had. Only a successful
  // response replaces it; a failed one leaves it untouched and surfaces the
  // persistent error alongside it.
  const onGenerate = async () => {
    if (generating) return; // prevent duplicate submissions

    setGenerating(true);
    setGenerationError("");

    try {
      const response = await generateBusinessTool(uuid, { additionalInputs });
      setResult(response.body || response.data);
      setExpandedSections({});
      toast.success("Generated successfully");
    } catch (error) {
      const message =
        error?.message || "Failed to generate content — please try again";
      setGenerationError(message);
      toast.error(message);
    } finally {
      setGenerating(false);
    }
  };

  const onClearResult = () => {
    setResult(null);
    setGenerationError("");
    setExpandedSections({});
  };

  const copyText = async (text, successMessage) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(successMessage);
    } catch {
      toast.error("Failed to copy — please try again");
    }
  };

  const onCopyAll = () => copyText(formatResultAsText(result), "Copied to clipboard");

  const onCopySection = (section) =>
    copyText(
      `${section.heading || ""}\n\n${section.content || ""}`.trim(),
      "Section copied"
    );

  const onDownloadPDF = () => {
    try {
      downloadBusinessToolResultPDF(result);
    } catch (error) {
      console.error("PDF export failed:", error);
      toast.error("Failed to create the PDF — please try again");
    }
  };

  const backLink = tool?.category
    ? `/dashboard/businessTools/category/${encodeURIComponent(tool.category)}`
    : "/dashboard/businessTools";

  if (loading) return <Loader />;

  if (pageError) {
    return (
      <div>
        <Breadcrumb
          prevLink="/dashboard/businessTools"
          prevPage="Back"
          pageName="Generate with AI"
        />
        <div className="rounded-lg border border-stroke bg-white p-8 text-center dark:border-strokedark dark:bg-boxdark">
          <p className="text-base font-medium text-black dark:text-white">
            {pageError}
          </p>
          <button
            type="button"
            onClick={() => router.push("/dashboard/businessTools")}
            className="mt-4 rounded bg-primary px-4 py-2 text-white hover:opacity-95"
          >
            Back to Business Tools
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb
        prevLink={backLink}
        prevPage="Back"
        pageName="Generate with AI"
      />

      <div className="space-y-6">
        {/* A. Tool information */}
        <div className="rounded-lg border border-stroke bg-white p-6 dark:border-strokedark dark:bg-boxdark">
          <h4 className="text-xl font-semibold text-black dark:text-white">
            {tool.fileName}
          </h4>
          {tool.category && (
            <p className="mt-1 text-sm text-gray-500">{tool.category}</p>
          )}
          {tool.description && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              {tool.description}
            </p>
          )}
        </div>

        {/* C. Business information review */}
        <div className="rounded-lg border border-stroke bg-white p-6 dark:border-strokedark dark:bg-boxdark">
          <h5 className="mb-3 text-base font-semibold text-black dark:text-white">
            Your Business Information
          </h5>

          {!business ? (
            <p className="text-sm text-amber-600">
              No business profile found for your account. Complete your
              business profile before generating with AI.
            </p>
          ) : existingFields.length === 0 ? (
            <p className="text-sm text-gray-500">
              No business information on file yet — fill in what you can
              below.
            </p>
          ) : (
            <>
              <p className="mb-3 text-sm text-gray-500">
                This is what the AI will use automatically.
              </p>
              <dl className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {existingFields.map((field) => (
                  <div key={field.key}>
                    <dt className="text-xs font-semibold uppercase text-gray-400">
                      {field.label}
                    </dt>
                    <dd className="text-sm text-black dark:text-white">
                      {String(business[field.key])}
                    </dd>
                  </div>
                ))}
              </dl>
            </>
          )}
        </div>

        {/* D. Missing information form */}
        {business && missingFields.length > 0 && (
          <div className="rounded-lg border border-stroke bg-white p-6 dark:border-strokedark dark:bg-boxdark">
            <h5 className="mb-1 text-base font-semibold text-black dark:text-white">
              Additional Information
            </h5>
            <p className="mb-3 text-sm text-gray-500">
              These aren't in your business profile yet — fill in what's
              relevant for this document (optional).
            </p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {missingFields.map((field) => (
                <div key={field.key}>
                  <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                    {field.label}
                  </label>
                  <textarea
                    className={inputClass}
                    rows={2}
                    value={additionalInputs[field.key] || ""}
                    onChange={(e) =>
                      setAdditionalInputs((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* E. Generate / Regenerate button */}
        <div className="rounded-lg border border-stroke bg-white p-6 dark:border-strokedark dark:bg-boxdark">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onGenerate}
              disabled={generating || !business}
              className="flex w-48 items-center justify-center gap-2 rounded bg-primary px-4 py-3 text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Spinner />
                  {result ? "Regenerating..." : "Generating..."}
                </>
              ) : result ? (
                "Regenerate"
              ) : (
                "Generate with AI"
              )}
            </button>

            {result && (
              <button
                type="button"
                onClick={onClearResult}
                disabled={generating}
                title={
                  generating
                    ? "Wait for the current generation to finish"
                    : undefined
                }
                className="rounded border border-stroke px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-strokedark dark:text-gray-300 dark:hover:bg-boxdark-2"
              >
                Clear Result
              </button>
            )}
          </div>

          {!business && (
            <p className="mt-2 text-xs text-amber-600">
              Generation is disabled until a business profile exists for your
              account.
            </p>
          )}

          {/* Persistent error — independent of the toast, which can be missed
              or dismissed. Covers real backend responses too, e.g. the 503
              "AI generation is not configured on the server yet" when no
              OPENAI_API_KEY is set. */}
          {generationError && (
            <div className="mt-4 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              {generationError}
            </div>
          )}
        </div>

        {/* F. Result preview */}
        {result && (
          <div className="rounded-lg border border-stroke bg-white p-6 dark:border-strokedark dark:bg-boxdark">
            <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
              <h5 className="flex items-center gap-2 text-base font-semibold text-black dark:text-white">
                Generated Result
                {generating && (
                  <span className="flex items-center gap-1 text-xs font-normal text-gray-400">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" />
                    Regenerating — this will update when ready
                  </span>
                )}
              </h5>
              <div className="flex flex-wrap gap-3 text-sm font-medium">
                <button
                  type="button"
                  onClick={onCopyAll}
                  className="text-primary hover:underline"
                >
                  Copy All
                </button>
                <button
                  type="button"
                  onClick={onDownloadPDF}
                  className="text-primary hover:underline"
                >
                  Download PDF
                </button>
              </div>
            </div>

            {result.title && (
              <h3 className="mt-3 text-lg font-bold text-black dark:text-white">
                {result.title}
              </h3>
            )}
            {result.summary && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                {result.summary}
              </p>
            )}
            {Array.isArray(result.sections) && result.sections.length > 0 && (
              <div className="mt-4 space-y-4">
                {result.sections.map((section, index) => {
                  const content = section.content || "";
                  const isLong = content.length > SECTION_COLLAPSE_THRESHOLD;
                  const isExpanded = Boolean(expandedSections[index]);
                  const displayContent =
                    isLong && !isExpanded
                      ? `${content.slice(0, SECTION_COLLAPSE_THRESHOLD).trimEnd()}…`
                      : content;

                  return (
                    <div
                      key={index}
                      className="border-t border-stroke pt-4 dark:border-strokedark"
                    >
                      <div className="mb-1 flex items-start justify-between gap-3">
                        {section.heading && (
                          <h4 className="text-base font-semibold text-black dark:text-white">
                            {section.heading}
                          </h4>
                        )}
                        <button
                          type="button"
                          onClick={() => onCopySection(section)}
                          className="shrink-0 text-xs font-medium text-primary hover:underline"
                        >
                          Copy
                        </button>
                      </div>
                      <p className="whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-300">
                        {displayContent}
                      </p>
                      {isLong && (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedSections((prev) => ({
                              ...prev,
                              [index]: !prev[index],
                            }))
                          }
                          className="mt-1 text-xs font-medium text-primary hover:underline"
                        >
                          {isExpanded ? "Show less" : "Show more"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerateBusinessTool;
