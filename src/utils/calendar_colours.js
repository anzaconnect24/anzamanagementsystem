// The palette an event can wear, and how each colour looks. Shared by the
// header panel and the calendar page so a colour never means two things.
//
// Whole class names, because Tailwind reads these files as text.
export const EVENT_COLOURS = {
  blue: { chip: "bg-[#1a73e8]", dot: "bg-[#1a73e8]", label: "Blue" },
  green: { chip: "bg-[#0b8043]", dot: "bg-[#0b8043]", label: "Green" },
  amber: { chip: "bg-[#f09300]", dot: "bg-[#f09300]", label: "Amber" },
  rose: { chip: "bg-[#d50000]", dot: "bg-[#d50000]", label: "Rose" },
  violet: { chip: "bg-[#8e24aa]", dot: "bg-[#8e24aa]", label: "Violet" },
  teal: { chip: "bg-[#009688]", dot: "bg-[#009688]", label: "Teal" },
  orange: { chip: "bg-[#e8710a]", dot: "bg-[#e8710a]", label: "Orange" },
  slate: { chip: "bg-[#616161]", dot: "bg-[#616161]", label: "Slate" },
};

export const colourOf = (name) => EVENT_COLOURS[name] || EVENT_COLOURS.blue;

// A local YYYY-MM-DD key. Built from the parts rather than toISOString, which
// would shift a late-evening date into the next day in +03:00.
export const dayKey = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
};

// Every day an event covers, so a run of days appears on each of them rather
// than only the first.
export const spanOf = (event) => {
  const start = String(event.startDate || "").slice(0, 10);
  if (!start) return [];

  const end = String(event.endDate || "").slice(0, 10) || start;
  const days = [];

  const cursor = new Date(`${start}T00:00:00`);
  const last = new Date(`${end}T00:00:00`);

  let guard = 0;

  while (cursor <= last && guard < 400) {
    days.push(dayKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
    guard += 1;
  }

  return days;
};
