"use client";

// The building blocks of the capital facilitation screens, so every page reads
// as one deal-flow workspace: a white surface, Anza navy for action, and a
// status always shown as its word on a tinted chip.
import { useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import { matchStrength, toneClass } from "@/utils/capital_labels";

export const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#082d77] focus:ring-2 focus:ring-[#082d77]/15 disabled:bg-slate-50";

export const labelClass = "mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500";

export const buttonClass = {
  primary: "inline-flex items-center justify-center gap-2 rounded-lg bg-[#082d77] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0a3a97] disabled:opacity-60",
  success: "inline-flex items-center justify-center gap-2 rounded-lg bg-[#16a34a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#15803d] disabled:opacity-60",
  secondary: "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60",
  danger: "inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60",
  link: "text-sm font-semibold text-[#082d77] hover:underline",
};

// The page hero, matching the rest of the platform.
export const CapitalHero = ({ title, description, badge = "Capital Facilitation", children }) => (
  <div className="relative mb-6 min-h-[180px] overflow-hidden rounded-2xl bg-black shadow-sm">
    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/images/investors_hero.svg')" }} />
    <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-[#082d77]/40" />
    <div className="relative z-10 flex flex-wrap items-end justify-between gap-4 p-8 text-white">
      <div className="max-w-3xl">
        <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-sm font-medium">
          <span className="h-2 w-2 rounded-full bg-[#f08a3c]" />
          {badge}
        </span>
        <h1 className="mb-2 text-2xl font-bold leading-tight md:text-3xl">{title}</h1>
        {description ? <p className="max-w-2xl text-sm leading-6 text-white/85">{description}</p> : null}
      </div>
      {children ? <div className="flex flex-wrap gap-2">{children}</div> : null}
    </div>
  </div>
);

export const Card = ({ title, action, children, className = "", padded = true }) => (
  <section className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
    {title || action ? (
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
        {title ? <h2 className="text-base font-bold text-slate-900">{title}</h2> : <span />}
        {action}
      </div>
    ) : null}
    <div className={padded ? "p-5" : ""}>{children}</div>
  </section>
);

// A headline figure. Proportional digits, a label, an optional note.
export const StatTile = ({ label, value, note, tone = "text-slate-900", icon, onClick }) => {
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className={`text-2xl font-black leading-tight ${tone}`}>{value}</p>
        {icon ? <span className="shrink-0 text-lg text-slate-400">{icon}</span> : null}
      </div>
      <p className="mt-1 text-xs font-semibold text-slate-600">{label}</p>
      {note ? <p className="mt-0.5 text-[11px] text-slate-400">{note}</p> : null}
    </>
  );
  return onClick ? (
    <button type="button" onClick={onClick} className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-[#082d77]/40 hover:shadow">
      {body}
    </button>
  ) : (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">{body}</div>
  );
};

export const StatusChip = ({ value, label }) => (
  <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${toneClass(value)}`}>
    {label || value}
  </span>
);

export const MatchScore = ({ score, showLabel = true }) => {
  if (score === null || score === undefined) return <span className="text-xs text-slate-400">Not scored</span>;
  const strength = matchStrength(score);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${strength.className}`}>
      {score}%{showLabel ? <span className="font-medium">· {strength.label}</span> : null}
    </span>
  );
};

// One row of filters above the content they scope.
export const FilterBar = ({ children, onReset }) => (
  <div className="mb-4 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
    {children}
    {onReset ? (
      <button type="button" onClick={onReset} className={`${buttonClass.link} mb-2 ml-auto`}>
        Clear filters
      </button>
    ) : null}
  </div>
);

export const Field = ({ label, children, className = "" }) => (
  <label className={`block ${className}`}>
    <span className={labelClass}>{label}</span>
    {children}
  </label>
);

export const Select = ({ value, onChange, options = [], placeholder, className = "", getLabel = (o) => o.label, getValue = (o) => o.value }) => (
  <select value={value ?? ""} onChange={(event) => onChange(event.target.value)} className={`${inputClass} ${className}`}>
    {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
    {options.map((option) => (
      <option key={getValue(option)} value={getValue(option)}>
        {getLabel(option)}
      </option>
    ))}
  </select>
);

export const Empty = ({ children, action }) => (
  <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 px-6 py-12 text-center text-sm text-slate-500">
    <p className="max-w-md">{children}</p>
    {action}
  </div>
);

export const LoadingBlock = ({ label = "Loading…" }) => (
  <div className="flex items-center justify-center py-16 text-sm text-slate-500">{label}</div>
);

// A table whose rows can open a record. Scrolls sideways on narrow screens.
export const DataTable = ({ columns, rows, rowKey = (row) => row.uuid, onRowClick, empty = "Nothing to show." }) =>
  rows.length ? (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {columns.map((column) => (
              <th key={column.key} className={`px-4 py-3 ${column.className || ""}`}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`border-b border-slate-100 last:border-0 ${onRowClick ? "cursor-pointer hover:bg-slate-50" : ""}`}
            >
              {columns.map((column) => (
                <td key={column.key} className={`px-4 py-3 align-top ${column.className || ""}`}>
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <Empty>{empty}</Empty>
  );

export const Modal = ({ open, title, onClose, children, footer, wide = false }) => {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className={`flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-xl ${wide ? "max-w-4xl" : "max-w-xl"}`}>
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <FaTimes />
          </button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
        {footer ? <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 px-5 py-3">{footer}</div> : null}
      </div>
    </div>
  );
};

// A vertical activity timeline.
export const Timeline = ({ items, empty = "No activity recorded yet." }) =>
  items.length ? (
    <ol className="relative space-y-4 border-l border-slate-200 pl-5">
      {items.map((item, index) => (
        <li key={item.key || index} className="relative">
          <span className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#082d77]" />
          <p className="text-sm text-slate-800">{item.title}</p>
          {item.detail ? <p className="mt-0.5 text-xs text-slate-500">{item.detail}</p> : null}
          <p className="mt-0.5 text-[11px] text-slate-400">{item.meta}</p>
        </li>
      ))}
    </ol>
  ) : (
    <Empty>{empty}</Empty>
  );

// Tabs within a record.
export const Tabs = ({ tabs, active, onChange }) => (
  <div className="mb-4 flex flex-wrap gap-1 border-b border-slate-200">
    {tabs.map((tab) => (
      <button
        key={tab.key}
        type="button"
        onClick={() => onChange(tab.key)}
        className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition ${active === tab.key ? "border-[#082d77] text-[#082d77]" : "border-transparent text-slate-500 hover:text-slate-800"}`}
      >
        {tab.label}
        {typeof tab.count === "number" ? <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 text-[11px] text-slate-600">{tab.count}</span> : null}
      </button>
    ))}
  </div>
);

// A labelled value in a record's details grid.
export const Detail = ({ label, children }) => (
  <div>
    <dt className={labelClass}>{label}</dt>
    <dd className="text-sm text-slate-800">{children === null || children === undefined || children === "" ? "—" : children}</dd>
  </div>
);
