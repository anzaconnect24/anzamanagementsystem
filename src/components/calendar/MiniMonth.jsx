"use client";

import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { colourOf, dayKey } from "@/utils/calendar_colours";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// The cells of a month, starting on the Sunday on or before the 1st and
// running whole weeks — five rows where five will do, six where they will not.
export const monthCells = (cursor) => {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const start = new Date(first);
  start.setDate(1 - first.getDay());

  const days = new Date(
    cursor.getFullYear(),
    cursor.getMonth() + 1,
    0,
  ).getDate();

  const weeks = Math.ceil((first.getDay() + days) / 7);
  const cells = [];

  for (let i = 0; i < weeks * 7; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    cells.push(date);
  }

  return cells;
};

// The month at a glance, beside the list rather than instead of it.
//
// It is a picker, not a schedule: a day carries at most a row of dots saying
// something is on, and the answer to what lives in the list next to it. Trying
// to fit titles into a cell this size is how a small calendar becomes
// unreadable.
//
// dotClass is how each page says what colours its own things: the platform
// calendar colours by the colour someone chose, the programme calendar by the
// kind of activity. Everything else about the month is the same either way,
// which is the point of it living here.
const MiniMonth = ({
  cursor,
  onStep,
  selected,
  onSelect,
  byDay,
  dotClass = (item) => colourOf(item.colour).dot,
}) => {
  const today = dayKey(new Date());
  const cells = monthCells(cursor);

  return (
    <div className="flex h-full w-full flex-col rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onStep(-1)}
          aria-label="Previous month"
          className="rounded-lg border border-[#082d77]/30 p-2 text-[#082d77] transition hover:bg-[#082d77]/5"
        >
          <FaChevronLeft className="text-xs" />
        </button>

        <h2 className="text-base font-bold text-slate-900">
          {cursor.toLocaleDateString("en-GB", {
            month: "long",
            year: "numeric",
          })}
        </h2>

        <button
          type="button"
          onClick={() => onStep(1)}
          aria-label="Next month"
          className="rounded-lg border border-[#082d77]/30 p-2 text-[#082d77] transition hover:bg-[#082d77]/5"
        >
          <FaChevronRight className="text-xs" />
        </button>
      </div>

      <div className="grid grid-cols-7">
        {WEEKDAYS.map((name) => (
          <div
            key={name}
            className="pb-2 text-center text-xs font-bold text-slate-700"
          >
            {name}
          </div>
        ))}
      </div>

      {/* auto-rows-fr divides whatever height is left between the weeks, so a
          six-week month is not taller than a five-week one. */}
      <div className="grid flex-1 auto-rows-fr grid-cols-7 overflow-hidden rounded-lg border border-slate-200">
        {cells.map((date) => {
          const key = dayKey(date);
          const outside = date.getMonth() !== cursor.getMonth();
          const isToday = key === today;
          const isSelected = key === selected;
          const list = byDay.get(key) || [];

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(isSelected ? "" : key)}
              // A day with nothing on it is still worth pressing: it is how
              // you say "show me this day", and how you add something to it.
              aria-pressed={isSelected}
              aria-label={date.toDateString()}
              // A floor, not a fixed height: it may grow to fill the column,
              // but never shrinks below a comfortable tap target.
              className={`relative flex h-full min-h-[2.75rem] flex-col items-center justify-center border-b border-r border-slate-200 text-sm transition ${
                isSelected
                  ? "bg-[#082d77] font-bold text-white"
                  : isToday
                    ? "bg-amber-50 font-bold text-slate-900"
                    : outside
                      ? "text-slate-300 hover:bg-slate-50"
                      : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              {date.getDate()}

              {list.length ? (
                <span className="absolute bottom-1 flex items-center gap-0.5">
                  {list.slice(0, 3).map((item, index) => (
                    <span
                      key={`${item.uuid}-${index}`}
                      className={`h-1 w-1 rounded-full ${
                        isSelected ? "bg-white" : dotClass(item)
                      }`}
                    />
                  ))}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MiniMonth;
