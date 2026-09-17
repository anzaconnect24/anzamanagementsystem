"use client";

// The look of the startup's investor pages - Investors, Investment
// Applications, Interested Investors - shared by every Raise Capital screen so
// they read as one area: a photo hero, clickable stat cards, soft tables.
import { useEffect, useRef, useState } from "react";

export const pageClass = "min-h-screen bg-[#F5F7FA] px-4 py-6 md:px-6";
export const primaryButton = "inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1D4ED8] disabled:opacity-60";
export const successButton = "inline-flex items-center justify-center gap-2 rounded-xl bg-[#16A34A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#15803D] disabled:opacity-50";
export const dangerButton = "inline-flex items-center justify-center gap-2 rounded-xl bg-[#DC2626] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#B91C1C] disabled:opacity-50";
export const lightButton = "inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/15 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/25";

export const RaiseHero = ({ badge, title, description, image = "/images/investors_hero.svg", highlights = [], children }) => (
  <section className="relative mb-8 overflow-hidden rounded-3xl border border-[#EAECF0] bg-black shadow-sm">
    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${image}')` }} />
    <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/20" />
    <div className="relative z-10 flex min-h-[300px] flex-col justify-center gap-6 p-8 lg:flex-row lg:items-end lg:justify-between lg:p-12">
      <div className="max-w-3xl">
        <span className="mb-6 inline-flex w-fit items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
          <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
          {badge}
        </span>
        <h1 className="mb-4 text-3xl font-bold leading-tight text-white md:text-4xl">{title}</h1>
        {description ? <p className="mb-6 max-w-2xl text-base leading-7 text-white/85 md:text-lg">{description}</p> : null}
        {highlights.length ? (
          <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-white/90">
            {highlights.map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-2">
                {Icon ? <Icon /> : null}
                {label}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      {children ? <div className="flex flex-wrap gap-3">{children}</div> : null}
    </div>
  </section>
);

const ACCENTS = {
  blue: { border: "border-[#2563EB]", icon: "text-[#2563EB]" },
  yellow: { border: "border-yellow-500", icon: "text-yellow-500" },
  indigo: { border: "border-blue-500", icon: "text-blue-500" },
  green: { border: "border-green-500", icon: "text-green-500" },
  red: { border: "border-red-500", icon: "text-red-500" },
};

// A figure that is also a filter: click it to show only what it counts.
export const StatFilterCard = ({ value, label, icon: Icon, accent = "blue", active = false, onClick }) => {
  const style = ACCENTS[accent] || ACCENTS.blue;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`relative rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:shadow ${active ? style.border : "border-[#EAECF0]"}`}
    >
      {Icon ? <Icon className={`absolute right-5 top-5 text-xl ${style.icon}`} /> : null}
      <p className="text-3xl font-bold text-[#101828]">{value}</p>
      <p className="mt-2 text-sm font-medium text-[#667085]">{label}</p>
    </button>
  );
};

const PILLS = {
  yellow: "bg-yellow-100 text-yellow-800",
  blue: "bg-blue-100 text-blue-700",
  green: "bg-green-100 text-green-700",
  red: "bg-red-100 text-red-700",
  gray: "bg-gray-100 text-gray-700",
};

export const StatusPill = ({ tone = "gray", children }) => (
  <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${PILLS[tone] || PILLS.gray}`}>{children}</span>
);

export const SoftTable = ({ columns, rows, rowKey = (row) => row.uuid, onRowClick }) => (
  <div className="overflow-hidden rounded-3xl border border-[#EAECF0] bg-white shadow-sm">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-[#EAECF0]">
        <thead className="bg-[#F9FAFB]">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={`px-6 py-4 text-left text-sm font-semibold capitalize text-[#344054] ${column.align === "right" ? "text-right" : ""}`}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#EAECF0] bg-white">
          {rows.map((row) => (
            <tr key={rowKey(row)} onClick={onRowClick ? () => onRowClick(row) : undefined} className={`transition duration-200 hover:bg-[#F9FAFB] ${onRowClick ? "cursor-pointer" : ""}`}>
              {columns.map((column) => (
                <td key={column.key} className={`px-6 py-5 align-top text-sm text-[#667085] ${column.align === "right" ? "text-right" : ""} ${column.nowrap === false ? "" : "whitespace-nowrap"}`}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export const EmptyState = ({ title, children, action }) => (
  <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-[#D0D5DD] bg-white px-6 py-14 text-center">
    <p className="text-lg font-semibold text-[#101828]">{title}</p>
    {children ? <p className="max-w-md text-sm text-[#667085]">{children}</p> : null}
    {action}
  </div>
);

// The dropdown filter buttons of the Investors page: green once a choice is made.
export const FilterDropdown = ({ value, options, onChange, allLabel }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => ref.current && !ref.current.contains(event.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const chosen = options.find((option) => option.value === value);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-2 rounded-md border px-4 py-3 text-sm transition-colors ${value ? "border-green-600 bg-green-50 text-green-700" : "border-black/10 bg-white text-[#6f6f72] hover:border-green-600"}`}
      >
        <span>{chosen ? chosen.label : allLabel}</span>
        <span aria-hidden="true">{open ? "⌃" : "⌄"}</span>
      </button>
      {open ? (
        <div className="absolute z-20 mt-2 max-h-64 w-64 overflow-y-auto rounded-xl border border-black/10 bg-white shadow-lg">
          {[{ value: "", label: allLabel }, ...options].map((option) => (
            <button
              key={option.value || "all"}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`block w-full px-4 py-2 text-left text-sm ${value === option.value ? "bg-green-50 text-green-700" : "text-[#6f6f72] hover:bg-gray-50"}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};
