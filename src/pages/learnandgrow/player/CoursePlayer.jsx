"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaArrowLeft,
  FaArrowRight,
  FaCheck,
  FaCheckCircle,
  FaClock,
  FaExternalLinkAlt,
  FaFileAlt,
  FaFilePowerpoint,
  FaLayerGroup,
  FaPlayCircle,
  FaRegFileAlt,
} from "react-icons/fa";
import Image from "@/utils/image";
import Loader from "@/components/common/Loader";
import {
  VIDEO_COMPLETION_PERCENT,
  getCourseOutline,
  recordProgress,
} from "@/controllers/lesson_controller";
import {
  getResources,
  resourceTypeLabel,
} from "@/controllers/workshop_controller";
import WorkshopsPanel from "@/components/learning/WorkshopsPanel";
import ResourcesPanel from "@/components/learning/ResourcesPanel";

// A learner works through one course: its modules, then the workshops and
// resources that belong to it. The panels are the same ones staff use, with
// the authoring controls off — the server enforces that independently.
const TABS = [
  { key: "modules", label: "Modules" },
  { key: "workshops", label: "Workshops" },
  { key: "resources", label: "Resources" },
];

const FALLBACK_IMAGE = "/images/ideation-classes.svg";

const TYPE_ICON = {
  text: FaRegFileAlt,
  video: FaPlayCircle,
  presentation: FaFilePowerpoint,
  document: FaFileAlt,
  file: FaFileAlt,
  link: FaExternalLinkAlt,
};

// Everything in the course as one ordered list, so next/previous can walk it
// without caring which module an item sits in.
const flatten = (modules) => {
  const items = [];

  modules.forEach((module) =>
    module.content.forEach((item) => items.push({ ...item, module })),
  );

  return items;
};

const CoursePlayer = () => {
  // courseUuid names one course. The older /learn and /learn/:uuid forms
  // still work: no uuid means "my own programme", which the API resolves.
  const { uuid: routeUuid, courseUuid } = useParams();
  const uuid = courseUuid || routeUuid || "mine";
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [outline, setOutline] = useState(null);
  // Null shows the module cards; a uuid opens that module's slides.
  const [openModuleUuid, setOpenModuleUuid] = useState(null);
  const [currentUuid, setCurrentUuid] = useState(
    searchParams.get("content") || null,
  );
  const [resources, setResources] = useState([]);
  const [tab, setTab] = useState("modules");

  const load = (keepPosition = true) =>
    getCourseOutline(uuid)
      .then((body) => {
        setOutline(body);

        const all = flatten(body.modules || []);

        // Land on where the learner stopped: the first thing not finished.
        if (!keepPosition || !currentUuid) {
          const next = all.find((item) => !item.complete) || all[0];
          if (next) setCurrentUuid(next.uuid);
        }
      })
      .then((body) => {
        if (body?.program?.uuid) {
          getResources(body.program.uuid, body.course?.uuid)
            .then((res) => setResources(res?.data || []))
            .catch(() => setResources([]));
        }
      })
      .catch(() => toast.error("Failed to load this course"))
      .finally(() => setLoading(false));

  useEffect(() => {
    load(false);
  }, [uuid]);

  const modules = outline?.modules || [];

  const openModule = openModuleUuid
    ? modules.find((module) => module.uuid === openModuleUuid)
    : null;

  // Next and previous walk the open module, so a learner finishes one module
  // before being taken into another.
  const items = useMemo(
    () => (openModule ? flatten([openModule]) : flatten(modules)),
    [openModule, modules],
  );

  const index = items.findIndex((item) => item.uuid === currentUuid);
  const current = index >= 0 ? items[index] : items[0];

  const openModuleAt = (module) => {
    const first =
      module.content.find((item) => !item.complete) || module.content[0];

    setOpenModuleUuid(module.uuid);
    if (first) setCurrentUuid(first.uuid);
  };

  // Opening anything that is not a video finishes it; a video has to be
  // watched, so it reports its own progress as it plays.
  useEffect(() => {
    if (!openModule || !current) return;
    if (current.type === "video" || current.complete) return;

    recordProgress(current.uuid, {}).then(() => load());
  }, [openModule?.uuid, current?.uuid]);

  if (loading) return <Loader />;

  if (!outline || items.length === 0) {
    return (
      <div className="min-h-screen px-6 py-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          This course has no content yet.
        </div>
      </div>
    );
  }

  const overall = outline.progress?.percent ?? 0;

  return (
    <div className="min-h-screen px-6 py-4">
      {/* HERO */}
      <div className="relative mb-8 min-h-[240px] overflow-hidden rounded-2xl bg-black shadow-sm">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('${
              outline.course?.image || outline.program?.image || FALLBACK_IMAGE
            }')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-[#c9672b]/30" />

        <div className="relative z-10 max-w-3xl p-10 text-white">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-sm font-medium shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#f08a3c]" />
            {outline.program?.title || "Class Rooms"}
          </span>

          <h2 className="mb-3 text-3xl font-bold leading-tight drop-shadow-lg md:text-4xl">
            {outline.course?.title || outline.program?.title}
          </h2>

          {outline.course?.description && (
            <p className="mb-4 max-w-2xl text-sm leading-6 text-white/85 drop-shadow-md">
              {outline.course.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-6 text-sm text-white/85">
            <span className="flex items-center gap-2">
              <FaLayerGroup />
              {modules.length} {modules.length === 1 ? "module" : "modules"}
            </span>

            <span className="flex items-center gap-2">
              <FaRegFileAlt />
              {outline.progress?.completedItems ?? 0} of{" "}
              {outline.progress?.totalItems ?? 0} done
            </span>

            {outline.course?.estimatedHours ? (
              <span className="flex items-center gap-2">
                <FaClock />
                {outline.course.estimatedHours}h
              </span>
            ) : null}
          </div>

          <div className="mt-5 flex max-w-md items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/25">
              <div
                className="h-full rounded-full bg-[#16a34a] transition-all"
                style={{ width: `${overall}%` }}
              />
            </div>
            <span className="text-sm font-bold">{overall}%</span>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="mb-8 inline-flex rounded-xl bg-slate-100 p-1 text-sm font-semibold">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => {
              setTab(item.key);
              // The Modules tab is also the way back out of a module, now
              // that there is no separate link for it.
              if (item.key === "modules") setOpenModuleUuid(null);
            }}
            className={
              tab === item.key
                ? "rounded-lg bg-white px-5 py-2 text-slate-950 shadow-sm"
                : "rounded-lg px-5 py-2 text-slate-500 transition hover:text-slate-800"
            }
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "workshops" && outline.program?.uuid && (
        <WorkshopsPanel
          programUuid={outline.program.uuid}
          courseUuid={outline.course?.uuid}
          canManage={false}
        />
      )}

      {tab === "resources" && outline.program?.uuid && (
        <ResourcesPanel
          programUuid={outline.program.uuid}
          courseUuid={outline.course?.uuid}
          canManage={false}
        />
      )}

      {tab === "modules" && !openModule && (
        <>
          <h2 className="mb-1 text-2xl font-bold text-[#172033]">
            Modules in this course
          </h2>
          <p className="mb-6 text-sm text-[#8a8f98]">
            Open a module to work through its slides.
          </p>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {modules.map((module) => (
              <button
                key={module.uuid}
                type="button"
                onClick={() => openModuleAt(module)}
                disabled={module.content.length === 0}
                className={`flex min-h-[380px] flex-col overflow-hidden rounded-xl bg-white text-left shadow-md transition duration-200 ${
                  module.content.length === 0
                    ? "cursor-not-allowed opacity-70"
                    : "cursor-pointer hover:-translate-y-0.5 hover:shadow-lg"
                }`}
              >
                <div className="relative h-44 shrink-0 overflow-hidden bg-black">
                  <Image
                    className="h-full w-full object-cover"
                    src={
                      module.image ||
                      outline.course?.image ||
                      outline.program?.image ||
                      FALLBACK_IMAGE
                    }
                    alt={module.title}
                    fill
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                  {module.progress.complete && (
                    <span className="absolute bottom-4 left-4 inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 shadow-sm">
                      <FaCheckCircle /> Completed
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h3 className="mb-2 line-clamp-2 text-lg font-bold text-[#111827]">
                    {module.title}
                  </h3>

                  <p className="mb-4 line-clamp-2 flex-1 text-sm leading-6 text-[#6f6f72]">
                    {module.description || "No description provided."}
                  </p>

                  <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-[#8a8f98]">
                    <span className="flex items-center gap-1">
                      <FaRegFileAlt /> {module.progress.total}{" "}
                      {module.progress.total === 1 ? "item" : "items"}
                    </span>
                  </div>

                  <div className="mb-4">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-[#16a34a]"
                        style={{ width: `${module.progress.percent}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-[#98A2B3]">
                      {module.progress.percent}% complete
                    </p>
                  </div>

                  <div className="mt-auto border-t border-black/10 pt-4">
                    {module.content.length === 0 ? (
                      <span className="block text-center text-xs text-[#98A2B3]">
                        Nothing in this module yet.
                      </span>
                    ) : (
                      <span className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#16a34a] px-4 py-2.5 text-sm font-semibold text-white">
                        {module.progress.completed > 0 ? "Continue" : "Start"}{" "}
                        <FaArrowRight className="text-xs" />
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {tab === "modules" && openModule && (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
            {/* SLIDES IN THIS MODULE */}
            <aside className="order-2 lg:order-1">
              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  {openModule.title}
                </h2>
                <p className="mb-5 mt-1 text-sm leading-6 text-[#8a8f98]">
                  {openModule.progress.completed} of {openModule.progress.total}{" "}
                  done · your progress saves as you go.
                </p>

                <div className="space-y-3">
                  {openModule.content.map((item) => (
                    <ContentRow
                      key={item.uuid}
                      item={item}
                      active={item.uuid === current?.uuid}
                      onOpen={() => setCurrentUuid(item.uuid)}
                    />
                  ))}
                </div>
              </div>
            </aside>

            {/* CURRENT ITEM */}
            <main className="order-1 min-w-0 lg:order-2">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                {/* The module and slide are already named in the panel beside
                    this, so the content leads here rather than the titles. */}
                {current.description && (
                  <p className="mb-5 text-sm leading-7 text-[#667085]">
                    {current.description}
                  </p>
                )}

                <ContentView item={current} onProgress={() => load()} />

                <ModuleResources
                  items={resources.filter(
                    (row) => row.module?.uuid === current.module.uuid,
                  )}
                />

                <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
                  <button
                    type="button"
                    disabled={index <= 0}
                    onClick={() => setCurrentUuid(items[index - 1].uuid)}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                  >
                    <FaArrowLeft className="text-xs" /> Previous
                  </button>

                  <button
                    type="button"
                    disabled={index >= items.length - 1}
                    onClick={() => setCurrentUuid(items[index + 1].uuid)}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#16a34a] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#15803d] disabled:opacity-40"
                  >
                    Next <FaArrowRight className="text-xs" />
                  </button>
                </div>
              </div>
            </main>
          </div>
        </>
      )}
    </div>
  );
};

// Resources the staff attached to this particular module, shown with it.
const ModuleResources = ({ items }) => {
  if (items.length === 0) return null;

  return (
    <div className="mt-8 border-t border-slate-100 pt-5">
      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#98A2B3]">
        Resources for this module
      </p>

      <div className="space-y-2">
        {items.map((resource) => (
          <ResourceRow key={resource.uuid} resource={resource} />
        ))}
      </div>
    </div>
  );
};

const ResourceRow = ({ resource }) => (
  <a
    href={resource.file || resource.url}
    target="_blank"
    rel="noreferrer"
    className="flex items-center gap-3 rounded-xl bg-[#F9FAFB] px-4 py-3 transition hover:bg-slate-100"
  >
    <FaFileAlt className="shrink-0 text-[#98A2B3]" />

    <span className="min-w-0 flex-1">
      <span className="block truncate text-sm font-semibold text-slate-900">
        {resource.title}
      </span>
      <span className="text-xs text-[#98A2B3]">
        {resourceTypeLabel(resource.type)}
        {resource.category ? ` · ${resource.category}` : ""}
      </span>
    </span>

    <span className="shrink-0 text-xs font-semibold text-[#082d77]">
      {resource.downloadable ? "Download" : "Open"}
    </span>
  </a>
);

// One item in the course-content list: an icon tile, its title, and where the
// learner has got to with it. A video reports how far it was watched, so it
// can say "in progress" rather than only done or not.
const ContentRow = ({ item, active, onOpen }) => {
  const Icon = TYPE_ICON[item.type] || FaRegFileAlt;

  const state = item.complete
    ? { label: "Completed", className: "text-[#12B76A]" }
    : item.type === "video" && item.percentWatched > 0
      ? {
          label: `${item.percentWatched}% watched`,
          className: "text-[#B54708]",
        }
      : { label: "Not started", className: "text-[#98A2B3]" };

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition ${
        active
          ? "border-[#12B76A]/50 bg-[#F0FDF6]"
          : "border-[#E4E7EC] bg-white hover:border-[#12B76A]/40 hover:shadow-sm"
      }`}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
          active
            ? "border-[#12B76A]/30 bg-white text-[#12B76A]"
            : "border-[#E4E7EC] bg-white text-[#98A2B3]"
        }`}
      >
        <Icon className="text-base" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-slate-900">
          {item.title}
        </span>
        <span
          className={`mt-0.5 block text-[11px] font-bold uppercase tracking-wide ${state.className}`}
        >
          {state.label}
        </span>
      </span>

      {item.complete && <FaCheck className="shrink-0 text-sm text-[#12B76A]" />}
    </button>
  );
};

// One content item, rendered the way its type needs.
const ContentView = ({ item, onProgress }) => {
  if (item.type === "video") {
    return <VideoContent item={item} onProgress={onProgress} />;
  }

  if (item.type === "text") {
    return (
      <div
        className="prose prose-slate max-w-none text-sm leading-7 text-[#344054]"
        // Written by staff in the course builder.
        dangerouslySetInnerHTML={{ __html: item.content || "" }}
      />
    );
  }

  if (item.type === "link") {
    return (
      <a
        href={item.url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 rounded-lg bg-[#082d77] px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
      >
        Open resource <FaExternalLinkAlt className="text-xs" />
      </a>
    );
  }

  // Presentations and documents. A PDF renders inline. Anything else cannot be
  // shown by the browser, and is no longer offered as a download either, so it
  // has to be uploaded as a PDF to be readable here.
  const source = item.file || item.url;
  const isPdf = String(source || "")
    .toLowerCase()
    .endsWith(".pdf");

  return (
    <div>
      {isPdf ? (
        <iframe
          src={source}
          title={item.title}
          className="h-[70vh] w-full rounded-xl border border-slate-200"
        />
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-[#F9FAFB] p-10 text-center">
          <FaFilePowerpoint className="mx-auto mb-3 text-3xl text-slate-300" />
          <p className="text-sm text-slate-500">
            This file cannot be previewed in the browser.
          </p>
        </div>
      )}

    </div>
  );
};

// A video reports how much was actually watched, and resumes where the learner
// left off. Opening the page is never enough to finish it.
const VideoContent = ({ item, onProgress }) => {
  const ref = useRef(null);
  const [percent, setPercent] = useState(item.percentWatched || 0);
  const lastSent = useRef(0);

  const source = item.file || item.url;

  useEffect(() => {
    setPercent(item.percentWatched || 0);
    lastSent.current = 0;
  }, [item.uuid]);

  const onLoaded = () => {
    // Pick up where they stopped.
    if (ref.current && item.lastPosition) {
      ref.current.currentTime = item.lastPosition;
    }
  };

  const onTimeUpdate = () => {
    const video = ref.current;
    if (!video || !video.duration) return;

    const watched = Math.round((video.currentTime / video.duration) * 100);
    setPercent((current) => Math.max(current, watched));

    // Report every 5 percentage points rather than on every tick.
    if (watched - lastSent.current < 5) return;
    lastSent.current = watched;

    recordProgress(item.uuid, {
      percentWatched: watched,
      lastPosition: Math.round(video.currentTime),
      secondsWatched: Math.round(video.currentTime),
    }).then((result) => {
      if (result?.complete && !item.complete) onProgress();
    });
  };

  const onEnded = () => {
    const video = ref.current;

    recordProgress(item.uuid, {
      percentWatched: 100,
      lastPosition: video ? Math.round(video.currentTime) : null,
      secondsWatched: video ? Math.round(video.duration) : null,
    }).then(() => onProgress());
  };

  if (!source) {
    return (
      <p className="text-sm text-slate-500">
        No video has been attached to this item yet.
      </p>
    );
  }

  return (
    <div>
      <video
        ref={ref}
        src={source}
        poster={item.thumbnail || undefined}
        controls
        controlsList={item.downloadable ? undefined : "nodownload"}
        onLoadedMetadata={onLoaded}
        onTimeUpdate={onTimeUpdate}
        onEnded={onEnded}
        className="w-full rounded-xl bg-black"
      />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[#16a34a] transition-all"
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>

        <span className="text-xs text-[#98A2B3]">
          {item.complete || percent >= VIDEO_COMPLETION_PERCENT
            ? "Watched"
            : `${percent}% watched · ${VIDEO_COMPLETION_PERCENT}% needed to complete`}
        </span>
      </div>
    </div>
  );
};

export default CoursePlayer;
