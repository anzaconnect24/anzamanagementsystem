"use client";

import { FaArrowLeft, FaPlus, FaTimes } from "react-icons/fa";

export const dayLabel = (key) => {
  const date = new Date(`${key}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

// The half of a calendar screen that is a list: a title, the question being
// asked of the list, and the list.
//
// It holds no opinion about what is in the rows — the platform calendar puts
// events in them and the programme calendar puts activities — only about the
// chrome around them, so the two screens are the same screen wherever they can
// be. Anything that differs between them is a prop, and anything that does not
// lives here once.
const CalendarPanel = ({
  title,
  tabs,
  tab,
  onTab,
  onBack,
  onCreate,
  createLabel = "Add",
  selected,
  onClearDay,
  isEmpty,
  emptyText = "No events found.",
  children,
}) => (
  <div className="flex min-w-0 flex-1 flex-col gap-4">
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#082d77] text-white transition hover:bg-[#0a3a97]"
        >
          <FaArrowLeft className="text-sm" />
        </button>
      ) : null}

      {/* h2, not h1: the hero above owns the page's heading. */}
      <h2 className="mr-auto text-xl font-bold text-slate-900">{title}</h2>

      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onTab(item.key)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === item.key
                ? "bg-[#082d77] text-white"
                : "border border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {item.label}

            {/* A count only where the tab is a queue — something waiting on
                the reader. A number on every tab is noise. */}
            {typeof item.badge === "number" ? (
              <span
                // Red when something is waiting, matching the dot in the top
                // bar: one colour for "this needs you", wherever it appears.
                className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${
                  item.badge > 0
                    ? "bg-meta-1 text-white"
                    : tab === item.key
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-500"
                }`}
              >
                {item.badge}
              </span>
            ) : null}
          </button>
        ))}

        <button
          type="button"
          onClick={() => onCreate()}
          aria-label={createLabel}
          title={createLabel}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-700 transition hover:border-[#082d77] hover:text-[#082d77]"
        >
          <FaPlus />
        </button>
      </div>
    </div>

    <div className="flex min-h-[26rem] flex-1 flex-col rounded-2xl border border-slate-200 bg-white">
      {/* A day chosen in the month picker narrows the list, and says so — a
          filter you cannot see is a filter you will blame the data for. */}
      {selected ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3">
          <p className="text-sm font-semibold text-slate-700">
            {dayLabel(selected)}
          </p>

          <button
            type="button"
            onClick={onClearDay}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#082d77] hover:underline"
          >
            <FaTimes className="text-[10px]" /> Show the whole month
          </button>
        </div>
      ) : null}

      {isEmpty ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <p className="text-lg font-semibold text-slate-500">{emptyText}</p>

          <button
            type="button"
            onClick={() => onCreate()}
            className="inline-flex items-center gap-2 rounded-lg bg-[#16a34a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#15803d]"
          >
            <FaPlus className="text-xs" /> {createLabel}
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">{children}</div>
      )}
    </div>
  </div>
);

export default CalendarPanel;
