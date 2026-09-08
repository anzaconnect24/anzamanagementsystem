"use client";

// The small form pieces the learning panels share, so a field, a modal and an
// input look the same across the course builder, workshops and resources.

export const inputClass =
  "w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600";

export const Field = ({ label, children }) => (
  <div className="mb-4">
    <label className="mb-2 block text-sm font-semibold text-slate-900">
      {label}
    </label>
    {children}
  </div>
);

export const Modal = ({ title, children, onClose, wide = false }) => (
  <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
    <div
      className={`my-8 w-full rounded-2xl bg-white p-6 shadow-xl ${
        wide ? "max-w-3xl" : "max-w-lg"
      }`}
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <h3 className="text-xl font-black tracking-tight text-slate-950">
          {title}
        </h3>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-3 py-1 text-sm font-semibold text-slate-500 transition hover:bg-slate-100"
        >
          Close
        </button>
      </div>

      {children}
    </div>
  </div>
);
