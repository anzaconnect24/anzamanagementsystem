"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaChevronRight,
  FaEllipsisV,
  FaFile,
  FaFileAlt,
  FaFileExcel,
  FaFileImage,
  FaFilePdf,
  FaFilePowerpoint,
  FaFileWord,
  FaFolder,
  FaFolderOpen,
  FaFolderPlus,
  FaHistory,
  FaListUl,
  FaPen,
  FaPlus,
  FaSearch,
  FaThLarge,
  FaTimes,
  FaTrash,
  FaUpload,
} from "react-icons/fa";
import Loader from "@/components/common/Loader";
import {
  archiveProgramDocument,
  deleteProgramDocumentFolder,
  getCohortStartups,
  getProgramDocuments,
  saveProgramDocumentFolder,
  updateProgramDocument,
  uploadProgramDocument,
} from "@/controllers/cohort_controller";
import { server_url } from "@/utils/endpoint";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-[#111a2e] outline-none focus:border-[#082d77] focus:ring-2 focus:ring-[#082d77]/20";

const labelClass = "mb-1.5 block text-sm font-semibold text-[#344054]";

const menuItem =
  "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-[#344054] transition hover:bg-slate-50";

const pretty = (value) =>
  String(value || "")
    .replace(/[_-]/g, " ")
    .replace(/^./, (c) => c.toUpperCase());

// Each folder wears its own colour, so a shelf of them is read at a glance
// rather than by reading every label. The server stores the colour name; how
// it looks is decided here, in whole class names Tailwind can see.
const FOLDER_TINT = {
  blue: { ink: "text-blue-600", chip: "bg-blue-50 text-blue-700", wash: "bg-blue-50" },
  amber: { ink: "text-amber-500", chip: "bg-amber-50 text-amber-700", wash: "bg-amber-50" },
  emerald: { ink: "text-emerald-600", chip: "bg-emerald-50 text-emerald-700", wash: "bg-emerald-50" },
  violet: { ink: "text-violet-600", chip: "bg-violet-50 text-violet-700", wash: "bg-violet-50" },
  rose: { ink: "text-rose-600", chip: "bg-rose-50 text-rose-700", wash: "bg-rose-50" },
  cyan: { ink: "text-cyan-600", chip: "bg-cyan-50 text-cyan-700", wash: "bg-cyan-50" },
  orange: { ink: "text-orange-500", chip: "bg-orange-50 text-orange-700", wash: "bg-orange-50" },
  indigo: { ink: "text-indigo-600", chip: "bg-indigo-50 text-indigo-700", wash: "bg-indigo-50" },
  teal: { ink: "text-teal-600", chip: "bg-teal-50 text-teal-700", wash: "bg-teal-50" },
  slate: { ink: "text-slate-500", chip: "bg-slate-100 text-slate-700", wash: "bg-slate-100" },
};

const tint = (colour) => FOLDER_TINT[colour] || FOLDER_TINT.blue;

// What kind of file this is, read off the name rather than trusted from the
// mime type — a browser's guess at an .xlsx is not always the same twice.
const fileLook = (version) => {
  const name = String(version?.fileName || "").toLowerCase();
  const ext = name.includes(".") ? name.split(".").pop() : "";

  if (ext === "pdf") return { Icon: FaFilePdf, ink: "text-rose-600" };
  if (["doc", "docx", "rtf"].includes(ext))
    return { Icon: FaFileWord, ink: "text-blue-600" };
  if (["xls", "xlsx", "csv"].includes(ext))
    return { Icon: FaFileExcel, ink: "text-emerald-600" };
  if (["ppt", "pptx"].includes(ext))
    return { Icon: FaFilePowerpoint, ink: "text-orange-500" };
  if (["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext))
    return { Icon: FaFileImage, ink: "text-violet-600" };
  if (["txt", "md"].includes(ext))
    return { Icon: FaFileAlt, ink: "text-slate-500" };

  return { Icon: FaFile, ink: "text-slate-400" };
};

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
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};

// The programme's document library, browsed the way a drive is: folders you
// open, files inside them, and everything that has not been put in a folder
// sitting at the top level. Each document keeps its full version history, so
// which file is current is a fact rather than a guess.
const ProgramDocuments = () => {
  const { uuid } = useParams();

  const [payload, setPayload] = useState(null);
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [keyword, setKeyword] = useState("");

  // "" is the top level, "all" every file wherever it sits, a uuid one folder.
  const [folderFilter, setFolderFilter] = useState("");
  const [view, setView] = useState("grid");

  // Only one menu is ever open: `${kind}:${uuid}`, or "new" for the New button.
  const [menu, setMenu] = useState(null);

  // "new" files a new document; a uuid files another version of that one.
  const [filing, setFiling] = useState(null);
  const [form, setForm] = useState({
    title: "",
    category: "agreement",
    businessUuid: "",
    folderUuid: "",
    reportingPeriod: "",
    description: "",
    notes: "",
  });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(null);
  const [history, setHistory] = useState(null);

  const [folderEdit, setFolderEdit] = useState(null);
  const [folderForm, setFolderForm] = useState({ name: "", colour: "" });
  const [folderSaving, setFolderSaving] = useState(false);
  const [confirmingFolder, setConfirmingFolder] = useState(null);

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
  const folders = payload?.folders || [];
  const searching = keyword.trim() !== "";

  // Which documents the screen is standing in front of. A folder is a place
  // you are inside, not a filter over one long list: at the top level you see
  // the folders and whatever has not been put in one. Searching is the
  // exception — it looks everywhere, because "where did I file it?" is the
  // question being asked.
  const scope = useMemo(() => {
    if (searching || folderFilter === "all") return documents;
    if (folderFilter) {
      return documents.filter((doc) => doc.folder?.uuid === folderFilter);
    }
    return documents.filter((doc) => !doc.folder);
  }, [documents, folderFilter, searching]);

  const visible = useMemo(() => {
    const q = keyword.trim().toLowerCase();

    return scope.filter((doc) => {
      if (category && doc.category !== category) return false;
      if (!q) return true;

      return [
        doc.title,
        doc.description,
        doc.business?.name,
        doc.folder?.name,
        doc.reportingPeriod,
        doc.current?.fileName,
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q));
    });
  }, [scope, category, keyword]);

  // The folder being stood in, if any.
  const here = folders.find((folder) => folder.uuid === folderFilter) || null;

  // Folders only show at the top level: opening one is going somewhere, and
  // the shelf you came from does not follow you in.
  const showFolders = !here && folderFilter !== "all" && !searching;

  const openNew = () => {
    setMenu(null);
    setForm({
      title: "",
      category: "agreement",
      businessUuid: "",
      // Uploading while inside a folder files into it, which is what the lead
      // meant by being there.
      folderUuid: here ? here.uuid : "",
      reportingPeriod: "",
      description: "",
      notes: "",
    });
    setFile(null);
    setFiling("new");
  };

  const openVersion = (doc) => {
    setMenu(null);
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
      if (form.folderUuid) body.append("folderUuid", form.folderUuid);
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

    const where = folders.find((folder) => folder.uuid === form.folderUuid);

    toast.success(
      filing === "new"
        ? where
          ? `Filed in ${where.name}`
          : "Document filed"
        : "New version filed",
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

  // Moving a document is a retag, not an upload: the files are untouched.
  const onMove = async (doc, folderUuid) => {
    setMenu(null);

    const response = await updateProgramDocument(uuid, doc.uuid, {
      folderUuid,
    });

    if (response?.status === false) {
      toast.error(response.message || "Failed to move the document");
      return;
    }

    const where = folders.find((folder) => folder.uuid === folderUuid);
    toast.success(where ? `Moved to ${where.name}` : "Moved out of the folder");
    load();
  };

  const openFolderDialog = (folder) => {
    setMenu(null);
    setFolderForm(
      folder === "new"
        ? { name: "", colour: "" }
        : { name: folder.name, colour: folder.colour },
    );
    setFolderEdit(folder);
  };

  const onSaveFolder = async (event) => {
    event.preventDefault();

    if (!folderForm.name.trim()) {
      toast.error("A folder name is required");
      return;
    }

    setFolderSaving(true);

    const response = await saveProgramDocumentFolder(
      uuid,
      {
        name: folderForm.name.trim(),
        // Left unset on a new folder, the server hands out the next unused
        // colour — so folders made in a row never look alike.
        ...(folderForm.colour ? { colour: folderForm.colour } : {}),
      },
      folderEdit === "new" ? undefined : folderEdit.uuid,
    );

    setFolderSaving(false);

    if (response?.status === false) {
      toast.error(response.message || "Failed to save the folder");
      return;
    }

    toast.success(folderEdit === "new" ? "Folder created" : "Folder updated");
    setFolderEdit(null);
    load();
  };

  const onDeleteFolder = async () => {
    const response = await deleteProgramDocumentFolder(
      uuid,
      confirmingFolder.uuid,
    );

    if (response?.status === false) {
      toast.error(response.message || "Failed to remove the folder");
      return;
    }

    const released = (response.body || response)?.released || 0;

    toast.success(
      released
        ? `Folder removed — ${released} file${released === 1 ? "" : "s"} moved to the top level`
        : "Folder removed",
    );

    if (folderFilter === confirmingFolder.uuid) setFolderFilter("");
    setConfirmingFolder(null);
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
  const colours = payload.colours || Object.keys(FOLDER_TINT);

  // The menu that hangs off a file, shared by both views so the grid and the
  // list never drift apart.
  const fileMenu = (doc) => (
    <>
      <button
        type="button"
        onClick={() => setMenu(null)}
        aria-label="Close menu"
        className="fixed inset-0 z-20 cursor-default"
      />

      <div className="absolute right-0 top-full z-30 mt-1 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl">
        {doc.current ? (
          <a
            href={`${server_url}${doc.current.fileUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMenu(null)}
            className={menuItem}
          >
            <FaFileAlt className="text-slate-400" /> Open current · v
            {doc.current.versionNumber}
          </a>
        ) : null}

        <button
          type="button"
          onClick={() => {
            setMenu(null);
            setHistory(doc);
          }}
          className={menuItem}
        >
          <FaHistory className="text-slate-400" /> Version history (
          {doc.versionCount})
        </button>

        {canUpload ? (
          <>
            <button
              type="button"
              onClick={() => openVersion(doc)}
              className={menuItem}
            >
              <FaUpload className="text-slate-400" /> Upload new version
            </button>

            <p className="mt-1.5 border-t border-slate-100 px-4 pb-1 pt-2.5 text-xs font-bold uppercase tracking-wide text-slate-400">
              Move to
            </p>

            <div className="max-h-48 overflow-y-auto">
              <button
                type="button"
                onClick={() => onMove(doc, "")}
                disabled={!doc.folder}
                className={`${menuItem} disabled:opacity-40`}
              >
                <FaFolder className="text-slate-300" /> Top level
              </button>

              {folders.map((folder) => (
                <button
                  key={folder.uuid}
                  type="button"
                  onClick={() => onMove(doc, folder.uuid)}
                  disabled={doc.folder?.uuid === folder.uuid}
                  className={`${menuItem} disabled:opacity-40`}
                >
                  <FaFolder className={tint(folder.colour).ink} />
                  <span className="truncate">{folder.name}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                setMenu(null);
                setConfirming(doc);
              }}
              className={`${menuItem} border-t border-slate-100 text-rose-600`}
            >
              <FaTrash className="text-rose-400" /> Archive
            </button>
          </>
        ) : null}
      </div>
    </>
  );

  return (
    <div className="min-h-screen px-6 py-4">
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
            grant evidence and contracts — kept in folders, and versioned so
            the current file is never in doubt.
          </p>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        {/* Where you are. The root is the programme itself, the way a drive
            opens on its own name. */}
        <nav className="flex min-w-0 items-center gap-2 text-lg">
          <button
            type="button"
            onClick={() => {
              setFolderFilter("");
              setKeyword("");
            }}
            className={`font-black tracking-tight transition ${
              here || folderFilter === "all" || searching
                ? "text-[#8a8f98] hover:text-[#082d77]"
                : "text-slate-950"
            }`}
          >
            Available documents
          </button>

          {here ? (
            <>
              <FaChevronRight className="shrink-0 text-xs text-slate-300" />
              <span
                className={`flex min-w-0 items-center gap-2 font-black tracking-tight ${tint(here.colour).ink}`}
              >
                <FaFolderOpen className="shrink-0" />
                <span className="truncate">{here.name}</span>
              </span>
            </>
          ) : null}

          {searching ? (
            <>
              <FaChevronRight className="shrink-0 text-xs text-slate-300" />
              <span className="truncate font-black tracking-tight text-slate-950">
                “{keyword.trim()}”
              </span>
            </>
          ) : null}

          {folderFilter === "all" && !searching ? (
            <>
              <FaChevronRight className="shrink-0 text-xs text-slate-300" />
              <span className="font-black tracking-tight text-slate-950">
                All files
              </span>
            </>
          ) : null}
        </nav>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Search every folder..."
              className="w-56 rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#082d77]"
            />
          </div>

          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#082d77]"
          >
            <option value="">All types</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {pretty(item)}
                {summary.byCategory?.[item]
                  ? ` (${summary.byCategory[item]})`
                  : ""}
              </option>
            ))}
          </select>

          {/* Grid or list, the two ways a drive is read. */}
          <div className="flex items-center rounded-lg border border-slate-300 p-0.5">
            <button
              type="button"
              onClick={() => setView("grid")}
              aria-label="Grid view"
              className={`rounded-md px-2.5 py-2 text-sm transition ${
                view === "grid"
                  ? "bg-[#082d77] text-white"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <FaThLarge />
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              aria-label="List view"
              className={`rounded-md px-2.5 py-2 text-sm transition ${
                view === "list"
                  ? "bg-[#082d77] text-white"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <FaListUl />
            </button>
          </div>

          {canUpload ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenu(menu === "new" ? null : "new")}
                className="inline-flex items-center gap-2 rounded-lg bg-[#16a34a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#15803d]"
              >
                <FaPlus /> New
              </button>

              {menu === "new" ? (
                <>
                  <button
                    type="button"
                    onClick={() => setMenu(null)}
                    aria-label="Close menu"
                    className="fixed inset-0 z-20 cursor-default"
                  />

                  <div className="absolute right-0 top-full z-30 mt-1 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl">
                    <button
                      type="button"
                      onClick={() => openFolderDialog("new")}
                      className={menuItem}
                    >
                      <FaFolderPlus className="text-slate-400" /> New folder
                    </button>

                    <button
                      type="button"
                      onClick={openNew}
                      className={menuItem}
                    >
                      <FaUpload className="text-slate-400" />
                      {here ? `Upload to ${here.name}` : "Upload file"}
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {/* FOLDERS */}
      {showFolders ? (
        <div className="mb-8">
          <p className="mb-3 text-sm font-bold text-[#344054]">Folders</p>

          {folders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              No folders yet.
              {canUpload ? (
                <button
                  type="button"
                  onClick={() => openFolderDialog("new")}
                  className="ml-1 font-semibold text-[#082d77] hover:underline"
                >
                  Create the first one
                </button>
              ) : null}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {folders.map((folder) => {
                const colour = tint(folder.colour);
                const open = menu === `folder:${folder.uuid}`;

                return (
                  <div
                    key={folder.uuid}
                    className="group relative flex items-center gap-4 rounded-2xl bg-slate-100 p-5 transition hover:bg-slate-200/70"
                  >
                    <button
                      type="button"
                      onClick={() => setFolderFilter(folder.uuid)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <FaFolder className={`shrink-0 text-6xl ${colour.ink}`} />

                      <span className="min-w-0">
                        <span className="block truncate text-base font-bold text-[#111a2e]">
                          {folder.name}
                        </span>
                        <span className="text-sm text-[#667085]">
                          {folder.documents} file
                          {folder.documents === 1 ? "" : "s"}
                        </span>
                      </span>
                    </button>

                    {canUpload ? (
                      <button
                        type="button"
                        onClick={() =>
                          setMenu(open ? null : `folder:${folder.uuid}`)
                        }
                        aria-label={`Actions for ${folder.name}`}
                        className="shrink-0 rounded-full p-2 text-slate-400 transition hover:bg-white hover:text-[#082d77]"
                      >
                        <FaEllipsisV />
                      </button>
                    ) : null}

                    {open ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setMenu(null)}
                          aria-label="Close menu"
                          className="fixed inset-0 z-20 cursor-default"
                        />

                        <div className="absolute right-2 top-full z-30 mt-1 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl">
                          <button
                            type="button"
                            onClick={() => {
                              setMenu(null);
                              setFolderFilter(folder.uuid);
                            }}
                            className={menuItem}
                          >
                            <FaFolderOpen className="text-slate-400" /> Open
                          </button>

                          <button
                            type="button"
                            onClick={() => openFolderDialog(folder)}
                            className={menuItem}
                          >
                            <FaPen className="text-slate-400" /> Rename and
                            recolour
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setMenu(null);
                              setConfirmingFolder(folder);
                            }}
                            className={`${menuItem} border-t border-slate-100 text-rose-600`}
                          >
                            <FaTrash className="text-rose-400" /> Remove folder
                          </button>
                        </div>
                      </>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {/* FILES */}
      <p className="mb-3 text-sm font-bold text-[#344054]">
        {here ? `Files in ${here.name}` : searching ? "Results" : "Files"}
        {visible.length ? (
          <span className="ml-2 font-normal text-[#8a8f98]">
            {visible.length}
          </span>
        ) : null}
      </p>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          {here ? (
            <>
              <p>
                {here.name} is empty.
                {payload.unfiled
                  ? " Files elsewhere can be moved in from their ⋮ menu."
                  : ""}
              </p>

              {canUpload ? (
                <button
                  type="button"
                  onClick={openNew}
                  className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#16a34a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#15803d]"
                >
                  <FaUpload /> Upload to {here.name}
                </button>
              ) : null}
            </>
          ) : documents.length === 0 ? (
            "Nothing has been filed against this program yet."
          ) : searching || category ? (
            "No file matches this search."
          ) : (
            "Every file is inside a folder — open one above."
          )}
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((doc) => {
            const look = fileLook(doc.current);
            const open = menu === `doc:${doc.uuid}`;

            return (
              <div
                key={doc.uuid}
                className="group relative rounded-xl border border-slate-200 bg-white p-3 transition hover:shadow-md"
              >
                {/* The preview panel takes the folder's colour, so a file
                    carries where it lives even in a flat search result. */}
                <div
                  className={`mb-3 flex h-28 items-center justify-center rounded-lg ${
                    doc.folder ? tint(doc.folder.colour).wash : "bg-slate-50"
                  }`}
                >
                  <look.Icon className={`text-4xl ${look.ink}`} />
                </div>

                <div className="flex items-start gap-2">
                  <look.Icon className={`mt-0.5 shrink-0 ${look.ink}`} />

                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-sm font-bold text-[#111a2e]"
                      title={doc.title}
                    >
                      {doc.title}
                    </p>

                    <p className="truncate text-xs text-[#8a8f98]">
                      {pretty(doc.category)}
                      {doc.current ? ` · v${doc.current.versionNumber}` : ""} ·{" "}
                      {day(doc.current?.createdAt || doc.createdAt)}
                    </p>

                    {!here && doc.folder ? (
                      <span
                        className={`mt-1.5 inline-flex max-w-full items-center gap-1.5 truncate rounded-md px-2 py-0.5 text-xs font-semibold ${tint(doc.folder.colour).chip}`}
                      >
                        <FaFolder className="shrink-0" />
                        <span className="truncate">{doc.folder.name}</span>
                      </span>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => setMenu(open ? null : `doc:${doc.uuid}`)}
                    aria-label={`Actions for ${doc.title}`}
                    className="shrink-0 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-50 hover:text-[#082d77]"
                  >
                    <FaEllipsisV />
                  </button>
                </div>

                {open ? fileMenu(doc) : null}
              </div>
            );
          })}
        </div>
      ) : (
        // No overflow-hidden on this wrapper: the ⋮ menus hang out of their
        // rows, and clipping them would cut the menu in half.
        <div className="rounded-2xl border border-slate-200 bg-white">
          <div className="hidden grid-cols-[minmax(0,3fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_90px_44px] gap-4 border-b border-slate-100 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400 md:grid">
            <span>Name</span>
            <span>{here ? "Enterprise" : "Folder"}</span>
            <span>Last modified</span>
            <span>Size</span>
            <span />
          </div>

          {visible.map((doc) => {
            const look = fileLook(doc.current);
            const open = menu === `doc:${doc.uuid}`;

            return (
              <div
                key={doc.uuid}
                className="relative grid grid-cols-[minmax(0,1fr)_44px] gap-4 border-b border-slate-100 px-4 py-3 transition last:border-0 hover:bg-slate-50 md:grid-cols-[minmax(0,3fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_90px_44px]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <look.Icon className={`shrink-0 ${look.ink}`} />

                  <div className="min-w-0">
                    <p
                      className="truncate text-sm font-bold text-[#111a2e]"
                      title={doc.title}
                    >
                      {doc.title}
                    </p>
                    <p className="truncate text-xs text-[#8a8f98]">
                      {pretty(doc.category)}
                      {doc.current
                        ? ` · v${doc.current.versionNumber} · ${doc.current.fileName}`
                        : ""}
                    </p>
                  </div>
                </div>

                <div className="hidden min-w-0 items-center text-sm md:flex">
                  {here ? (
                    <span className="truncate text-[#667085]">
                      {doc.business?.name || "—"}
                    </span>
                  ) : doc.folder ? (
                    <button
                      type="button"
                      onClick={() => setFolderFilter(doc.folder.uuid)}
                      className={`inline-flex min-w-0 items-center gap-1.5 truncate rounded-md px-2 py-0.5 text-xs font-semibold ${tint(doc.folder.colour).chip}`}
                    >
                      <FaFolder className="shrink-0" />
                      <span className="truncate">{doc.folder.name}</span>
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400">Top level</span>
                  )}
                </div>

                <div className="hidden items-center text-sm text-[#667085] md:flex">
                  {day(doc.current?.createdAt || doc.createdAt)}
                </div>

                <div className="hidden items-center text-sm text-[#667085] md:flex">
                  {size(doc.current?.sizeBytes)}
                </div>

                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => setMenu(open ? null : `doc:${doc.uuid}`)}
                    aria-label={`Actions for ${doc.title}`}
                    className="rounded-full p-2 text-slate-400 transition hover:bg-white hover:text-[#082d77]"
                  >
                    <FaEllipsisV />
                  </button>
                </div>

                {open ? fileMenu(doc) : null}
              </div>
            );
          })}
        </div>
      )}

      {/* VERSION HISTORY */}
      {history && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-slate-100 p-6">
              <div className="min-w-0">
                <h3 className="truncate text-xl font-black tracking-tight text-slate-950">
                  {history.title}
                </h3>
                <p className="mt-1 text-sm text-[#667085]">
                  {history.versionCount} version
                  {history.versionCount === 1 ? "" : "s"} — nothing is ever
                  overwritten.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setHistory(null)}
                aria-label="Close"
                className="text-slate-400 transition hover:text-slate-600"
              >
                <FaTimes />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50/60 p-6">
              <ul className="space-y-2">
                {history.versions.map((version) => {
                  const current =
                    history.current &&
                    version.versionNumber === history.current.versionNumber;

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
                          {version.fileName} · {size(version.sizeBytes)} ·{" "}
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

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 p-6">
              <button
                type="button"
                onClick={() => setHistory(null)}
                className="rounded-lg bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
              >
                Close
              </button>

              {canUpload ? (
                <button
                  type="button"
                  onClick={() => {
                    const doc = history;
                    setHistory(null);
                    openVersion(doc);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#082d77] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#061f54]"
                >
                  <FaUpload /> Upload new version
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD */}
      {filing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={onSave}
            className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <div>
                <h3 className="text-xl font-black tracking-tight text-slate-950">
                  {filing === "new" ? "Upload a file" : "Upload a new version"}
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
                        Name
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

                    {/* Where it goes, asked before what it is: a file put in
                        the wrong place is one nobody finds again. */}
                    <div className="md:col-span-2">
                      <label className={labelClass} htmlFor="doc-folder">
                        Folder
                      </label>
                      <select
                        id="doc-folder"
                        className={inputClass}
                        value={form.folderUuid}
                        onChange={(e) =>
                          setForm({ ...form, folderUuid: e.target.value })
                        }
                      >
                        <option value="">Top level — not in a folder</option>
                        {folders.map((folder) => (
                          <option key={folder.uuid} value={folder.uuid}>
                            {folder.name}
                          </option>
                        ))}
                      </select>

                      {folders.length === 0 ? (
                        <p className="mt-1.5 text-xs text-[#8a8f98]">
                          No folders yet — close this and use New ▸ New folder.
                        </p>
                      ) : null}
                    </div>

                    <div>
                      <label className={labelClass} htmlFor="doc-category">
                        Type
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
                {saving ? "Uploading..." : "Upload"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FOLDER */}
      {folderEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={onSaveFolder}
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <h3 className="text-xl font-black tracking-tight text-slate-950">
                {folderEdit === "new" ? "New folder" : "Rename folder"}
              </h3>

              <button
                type="button"
                onClick={() => setFolderEdit(null)}
                aria-label="Close"
                className="text-slate-400 transition hover:text-slate-600"
              >
                <FaTimes />
              </button>
            </div>

            <div className="p-6">
              <label className={labelClass} htmlFor="folder-name">
                Name
              </label>
              <input
                id="folder-name"
                className={inputClass}
                placeholder="Cohort 3 site visits"
                value={folderForm.name}
                onChange={(e) =>
                  setFolderForm({ ...folderForm, name: e.target.value })
                }
              />

              <p className={`${labelClass} mt-5`}>Colour</p>

              <div className="flex flex-wrap gap-2">
                {colours.map((colour) => (
                  <button
                    key={colour}
                    type="button"
                    onClick={() => setFolderForm({ ...folderForm, colour })}
                    aria-label={colour}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
                      folderForm.colour === colour
                        ? "ring-2 ring-[#082d77] ring-offset-2"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <FaFolder className={`text-xl ${tint(colour).ink}`} />
                  </button>
                ))}
              </div>

              {folderEdit === "new" && !folderForm.colour ? (
                <p className="mt-3 text-xs text-[#8a8f98]">
                  Leave this and the folder takes the next unused colour, so no
                  two folders look alike.
                </p>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 p-6">
              <button
                type="button"
                onClick={() => setFolderEdit(null)}
                disabled={folderSaving}
                className="rounded-lg bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-200 disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={folderSaving}
                className="rounded-lg bg-[#082d77] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#061f54] disabled:opacity-60"
              >
                {folderSaving
                  ? "Saving..."
                  : folderEdit === "new"
                    ? "Create"
                    : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CONFIRM FOLDER */}
      {confirmingFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-xl font-black tracking-tight text-slate-950">
              Remove {confirmingFolder.name}?
            </h3>
            <p className="mt-3 text-sm leading-6 text-[#667085]">
              {confirmingFolder.documents
                ? `The ${confirmingFolder.documents} file${confirmingFolder.documents === 1 ? "" : "s"} inside move back to the top level — nothing is archived or deleted. A folder is a label, not a container.`
                : "The folder is empty, so nothing moves."}
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmingFolder(null)}
                className="rounded-lg bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={onDeleteFolder}
                className="rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
              >
                Remove folder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM ARCHIVE */}
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
