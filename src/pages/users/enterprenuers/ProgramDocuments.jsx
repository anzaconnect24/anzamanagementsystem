"use client";

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaArrowLeft,
  FaChevronDown,
  FaChevronRight,
  FaFileAlt,
  FaFolderOpen,
  FaHistory,
  FaPlus,
  FaTag,
  FaTimes,
  FaTrash,
  FaUpload,
} from "react-icons/fa";
import Loader from "@/components/common/Loader";
import StatCard from "@/components/tracker/StatCard";
import {
  archiveProgramDocument,
  getCohortStartups,
  getProgramDocuments,
  uploadProgramDocument,
} from "@/controllers/cohort_controller";
import { server_url } from "@/utils/endpoint";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-[#111a2e] outline-none focus:border-[#082d77] focus:ring-2 focus:ring-[#082d77]/20";

const labelClass = "mb-1.5 block text-sm font-semibold text-[#344054]";

const pretty = (value) =>
  String(value || "")
    .replace(/[_-]/g, " ")
    .replace(/^./, (c) => c.toUpperCase());

const day = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const size = (bytes) => {
  const n = Number(bytes || 0);
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};

// The programme's document library. Everything a programme files, tagged by
// enterprise, activity and reporting period, and versioned so the current
// file is a fact rather than a guess.
const ProgramDocuments = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();

  const [payload, setPayload] = useState(null);
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [keyword, setKeyword] = useState("");
  const [expanded, setExpanded] = useState(null);

  // "new" files a new document; a uuid files another version of that one.
  const [filing, setFiling] = useState(null);
  const [form, setForm] = useState({
    title: "",
    category: "agreement",
    businessUuid: "",
    reportingPeriod: "",
    description: "",
    notes: "",
  });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(null);

  const load = () =>
    getProgramDocuments(uuid)
      .then(setPayload)
      .catch((error) => {
        toast.error(
          error?.response?.status === 403
            ? "This library is not open to you"
            : "Failed to load the documents",
        );
        setPayload(null);
      })
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
    getCohortStartups(uuid)
      .then((body) => setStartups(Array.isArray(body?.data) ? body.data : []))
      .catch(() => setStartups([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uuid]);

  const documents = payload?.data || [];

  const visible = useMemo(() => {
    const q = keyword.trim().toLowerCase();

    return documents.filter((doc) => {
      if (category && doc.category !== category) return false;
      if (!q) return true;

      return [doc.title, doc.description, doc.business?.name, doc.reportingPeriod]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q));
    });
  }, [documents, category, keyword]);

  const openNew = () => {
    setForm({
      title: "",
      category: "agreement",
      businessUuid: "",
      reportingPeriod: "",
      description: "",
      notes: "",
    });
    setFile(null);
    setFiling("new");
  };

  const openVersion = (doc) => {
    setForm({ ...form, notes: "" });
    setFile(null);
    setFiling(doc);
  };

  const onSave = async (event) => {
    event.preventDefault();

    if (!file) {
      toast.error("Choose a file to upload");
      return;
    }

    if (filing === "new" && !form.title.trim()) {
      toast.error("A document title is required");
      return;
    }

    const body = new FormData();
    body.append("file", file);
    body.append("notes", form.notes || "");

    if (filing === "new") {
      body.append("title", form.title.trim());
      body.append("category", form.category);
      body.append("description", form.description || "");
      body.append("reportingPeriod", form.reportingPeriod || "");
      if (form.businessUuid) body.append("businessUuid", form.businessUuid);
    }

    setSaving(true);
    const response = await uploadProgramDocument(
      uuid,
      body,
      filing === "new" ? undefined : filing.uuid,
    );
    setSaving(false);

    if (response?.status === false) {
      toast.error(response.message || "Failed to file the document");
      return;
    }

    toast.success(
      filing === "new" ? "Document filed" : "New version filed",
    );
    setFiling(null);
    load();
  };

  const onArchive = async () => {
    const response = await archiveProgramDocument(uuid, confirming.uuid);

    if (response?.status === false) {
      toast.error(response.message || "Failed to archive");
      return;
    }

    toast.success("Document archived");
    setConfirming(null);
    load();
  };

  if (loading) return <Loader />;

  if (!payload) {
    return (
      <div className="px-6 py-10">
        <div className="mx-auto max-w-3xl rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          This document library is not open to you.
        </div>
      </div>
    );
  }

  const { summary, categories, canUpload, program } = payload;

  return (
    <div className="min-h-screen px-6 py-4">
      <button
        type="button"
        onClick={() => navigate(`/dashboard/programManagement/program/${uuid}`)}
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#082d77] transition hover:underline"
      >
        <FaArrowLeft /> Back to program
      </button>

      {/* HERO */}
      <div className="relative mb-8 min-h-[200px] overflow-hidden rounded-2xl bg-black shadow-sm">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/mentor_hero.svg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-[#c9672b]/30" />

        <div className="relative z-10 max-w-3xl p-10 text-white">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-sm font-medium shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#f08a3c]" />
            Document Library
          </span>

          <h1 className="mb-3 text-3xl font-bold leading-tight drop-shadow-lg md:text-4xl">
            {program?.title || "Program"}
          </h1>

          <p className="max-w-2xl text-sm leading-6 text-white/85 drop-shadow-md">
            Agreements, proposals, participant documents, training materials,
            attendance sheets, photos, reports, invoices, due-diligence packs,
            grant evidence and contracts — tagged, and versioned so the current
            file is never in doubt.
          </p>
        </div>
      </div>

      {/* HEADLINE FIGURES */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<FaFolderOpen />}
          label="Documents"
          value={summary.documents}
          tone="text-[#0b2b5c]"
          sub={
            <p className="mt-1 text-xs text-slate-400">
              across {Object.keys(summary.byCategory || {}).length} categories
            </p>
          }
        />
        <StatCard
          icon={<FaHistory />}
          label="Versions filed"
          value={summary.versions}
          tone="text-emerald-600"
          sub={<p className="mt-1 text-xs text-slate-400">Full history kept</p>}
        />
        <StatCard
          icon={<FaTag />}
          label="Tagged"
          value={summary.tagged}
          tone="text-amber-500"
          sub={
            <p className="mt-1 text-xs text-slate-400">
              to an enterprise or activity
            </p>
          }
        />
        <StatCard
          icon={<FaFileAlt />}
          label="Untagged"
          value={summary.documents - summary.tagged}
          tone="text-[#0b2b5c]"
          sub={
            <p className="mt-1 text-xs text-slate-400">Programme-wide files</p>
          }
        />
      </div>

      {/* FILTERS */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-[#082d77]"
          >
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {pretty(item)}
                {summary.byCategory?.[item]
                  ? ` (${summary.byCategory[item]})`
                  : ""}
              </option>
            ))}
          </select>

          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Search documents..."
            className="w-64 rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-[#082d77]"
          />
        </div>

        {canUpload ? (
          <button
            type="button"
            onClick={openNew}
            className="inline-flex items-center gap-2 rounded-lg bg-[#16a34a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#15803d]"
          >
            <FaPlus />
            File Document
          </button>
        ) : null}
      </div>

      {/* LIBRARY */}
      {visible.length === 0 ? (
        <div className="mx-auto max-w-3xl rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          {documents.length === 0
            ? "Nothing has been filed against this program yet."
            : "No document matches these filters."}
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((doc) => {
            const open = expanded === doc.uuid;

            return (
              <div
                key={doc.uuid}
                className="overflow-hidden rounded-2xl bg-white shadow-sm shadow-slate-200/50"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 p-5">
                  <button
                    type="button"
                    onClick={() => setExpanded(open ? null : doc.uuid)}
                    className="flex min-w-0 flex-1 items-start gap-3 text-left"
                  >
                    <span className="mt-1 text-xs text-slate-400">
                      {open ? <FaChevronDown /> : <FaChevronRight />}
                    </span>

                    <span className="min-w-0">
                      <span className="block truncate text-base font-black text-[#082d77]">
                        {doc.title}
                      </span>

                      <span className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">
                          {pretty(doc.category)}
                        </span>

                        {doc.business ? (
                          <span className="rounded-md bg-blue-50 px-2 py-0.5 font-semibold text-blue-700">
                            {doc.business.name}
                          </span>
                        ) : null}

                        {doc.activity ? (
                          <span className="rounded-md bg-violet-50 px-2 py-0.5 font-semibold text-violet-700">
                            {doc.activity.name}
                          </span>
                        ) : null}

                        {doc.reportingPeriod ? (
                          <span className="rounded-md bg-amber-50 px-2 py-0.5 font-semibold text-amber-700">
                            {doc.reportingPeriod}
                          </span>
                        ) : null}
                      </span>

                      {doc.description ? (
                        <span className="mt-1.5 block text-sm text-[#667085]">
                          {doc.description}
                        </span>
                      ) : null}
                    </span>
                  </button>

                  <div className="flex flex-wrap items-center gap-4">
                    {/* The authoritative file, named as such so nobody has to
                        work it out from the list below. */}
                    {doc.current ? (
                      <a
                        href={`${server_url}${doc.current.fileUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg bg-[#082d77] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#061f54]"
                      >
                        Open current · v{doc.current.versionNumber}
                      </a>
                    ) : null}

                    {canUpload ? (
                      <>
                        <button
                          type="button"
                          onClick={() => openVersion(doc)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#082d77]/20 px-3 py-2 text-xs font-semibold text-[#082d77] transition hover:bg-slate-50"
                        >
                          <FaUpload /> New version
                        </button>

                        <button
                          type="button"
                          onClick={() => setConfirming(doc)}
                          aria-label={`Archive ${doc.title}`}
                          className="text-rose-600 transition hover:opacity-70"
                        >
                          <FaTrash />
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>

                {open ? (
                  <div className="border-t border-slate-100 bg-slate-50/60 p-5">
                    <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Version history
                    </p>

                    <ul className="space-y-2">
                      {doc.versions.map((version) => {
                        const current =
                          doc.current &&
                          version.versionNumber === doc.current.versionNumber;

                        return (
                          <li
                            key={version.uuid}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3 shadow-sm shadow-slate-200/50"
                          >
                            <span className="min-w-0">
                              <span className="flex items-center gap-2 text-sm font-bold text-slate-900">
                                v{version.versionNumber}
                                {current ? (
                                  <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
                                    Authoritative
                                  </span>
                                ) : (
                                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                                    Superseded
                                  </span>
                                )}
                              </span>

                              <span className="mt-0.5 block truncate text-xs text-[#8a8f98]">
                                {version.fileName} {size(version.sizeBytes)} ·{" "}
                                {day(version.createdAt)}
                                {version.uploadedBy
                                  ? ` · ${version.uploadedBy.name}`
                                  : ""}
                              </span>

                              {version.notes ? (
                                <span className="mt-1 block text-sm text-[#667085]">
                                  {version.notes}
                                </span>
                              ) : null}
                            </span>

                            <a
                              href={`${server_url}${version.fileUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 text-xs font-bold text-[#082d77] hover:underline"
                            >
                              Open
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {/* FILE */}
      {filing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={onSave}
            className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <div>
                <h3 className="text-xl font-black tracking-tight text-slate-950">
                  {filing === "new" ? "File a document" : "File a new version"}
                </h3>
                {filing !== "new" ? (
                  <p className="mt-1 text-sm text-[#667085]">
                    {filing.title} — this becomes v
                    {(filing.versionCount || 0) + 1} and the authoritative file.
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => setFiling(null)}
                aria-label="Close"
                className="text-slate-400 transition hover:text-slate-600"
              >
                <FaTimes />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid gap-4 md:grid-cols-2">
                {filing === "new" ? (
                  <>
                    <div className="md:col-span-2">
                      <label className={labelClass} htmlFor="doc-title">
                        Title
                      </label>
                      <input
                        id="doc-title"
                        className={inputClass}
                        value={form.title}
                        onChange={(e) =>
                          setForm({ ...form, title: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <label className={labelClass} htmlFor="doc-category">
                        Category
                      </label>
                      <select
                        id="doc-category"
                        className={inputClass}
                        value={form.category}
                        onChange={(e) =>
                          setForm({ ...form, category: e.target.value })
                        }
                      >
                        {categories.map((item) => (
                          <option key={item} value={item}>
                            {pretty(item)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={labelClass} htmlFor="doc-business">
                        Enterprise
                      </label>
                      <select
                        id="doc-business"
                        className={inputClass}
                        value={form.businessUuid}
                        onChange={(e) =>
                          setForm({ ...form, businessUuid: e.target.value })
                        }
                      >
                        <option value="">
                          Programme-wide (no single enterprise)
                        </option>
                        {startups.map((startup) => (
                          <option key={startup.uuid} value={startup.uuid}>
                            {startup.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={labelClass} htmlFor="doc-period">
                        Reporting period
                      </label>
                      <input
                        id="doc-period"
                        className={inputClass}
                        placeholder="2026-Q3"
                        value={form.reportingPeriod}
                        onChange={(e) =>
                          setForm({ ...form, reportingPeriod: e.target.value })
                        }
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className={labelClass} htmlFor="doc-description">
                        Description
                      </label>
                      <textarea
                        id="doc-description"
                        rows={2}
                        className={inputClass}
                        value={form.description}
                        onChange={(e) =>
                          setForm({ ...form, description: e.target.value })
                        }
                      />
                    </div>
                  </>
                ) : null}

                <div className="md:col-span-2">
                  <label className={labelClass} htmlFor="doc-file">
                    File
                  </label>
                  <input
                    id="doc-file"
                    type="file"
                    className={inputClass}
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.csv,.txt,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  <p className="mt-1.5 text-xs text-[#8a8f98]">
                    Up to 25MB. Earlier versions are kept, never overwritten.
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass} htmlFor="doc-notes">
                    What changed
                  </label>
                  <input
                    id="doc-notes"
                    className={inputClass}
                    placeholder="Signed original / amended payment schedule"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 p-6">
              <button
                type="button"
                onClick={() => setFiling(null)}
                disabled={saving}
                className="rounded-lg bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-200 disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-[#082d77] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#061f54] disabled:opacity-60"
              >
                {saving ? "Filing..." : "File document"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CONFIRM */}
      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-xl font-black tracking-tight text-slate-950">
              Archive {confirming.title}?
            </h3>
            <p className="mt-3 text-sm leading-6 text-[#667085]">
              It comes out of the library, but nothing is destroyed — every
              version stays on record, because a superseded contract is still
              the record of what was agreed at the time.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirming(null)}
                className="rounded-lg bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={onArchive}
                className="rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
              >
                Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgramDocuments;
