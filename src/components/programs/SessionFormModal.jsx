"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { createCohortSession } from "@/controllers/cohort_controller";

// Setting up a coaching session for one startup. Shared by the program's
// startup roster and its Coaching Sessions page so both behave identically.
export const CAN_COACH_ROLES = ["Admin", "Staff", "Reviewer", "Mentor"];

export const SESSION_TYPES = [
  "One-on-one coaching",
  "Group coaching",
  "Site visit",
  "Follow-up",
  "Check-in",
];

export const FLAGS = [
  { value: "green", label: "On track", chip: "bg-emerald-50 text-emerald-700" },
  {
    value: "amber",
    label: "Needs attention",
    chip: "bg-amber-50 text-amber-700",
  },
  { value: "red", label: "At risk", chip: "bg-rose-50 text-rose-700" },
];

export const flagMeta = (value) =>
  FLAGS.find((item) => item.value === value) || FLAGS[0];

const emptyForm = {
  title: "",
  sessionDate: "",
  sessionType: SESSION_TYPES[0],
  facilitator: "",
  issuesDiscussed: "",
  recommendationsGiven: "",
  actionsAgreed: "",
  nextSessionDate: "",
  flag: "green",
};

// `startup` is { uuid, name }; the session is always for that one startup, so
// there is no way to log it against the wrong business.
const SessionFormModal = ({
  programUuid,
  programTitle,
  startup,
  onClose,
  onSaved,
}) => {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    if (!form.title.trim()) {
      toast.error("Give the session a title");
      return;
    }

    if (!form.sessionDate) {
      toast.error("Session date is required");
      return;
    }

    if (form.nextSessionDate && form.nextSessionDate < form.sessionDate) {
      toast.error("The next session cannot be before this one");
      return;
    }

    setSaving(true);
    const response = await createCohortSession(programUuid, {
      ...form,
      title: form.title.trim(),
      businessUuid: startup.uuid,
    });
    setSaving(false);

    if (response?.status !== true) {
      toast.error(response?.message || "Failed to set up the session");
      return;
    }

    toast.success(`Session set up for ${startup.name}`);
    onSaved?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white p-6">
        <h3 className="mb-1 text-2xl font-semibold text-[#111827]">
          Set up a session
        </h3>
        <p className="mb-5 text-sm text-[#64748b]">
          For <span className="font-semibold">{startup.name}</span>
          {programTitle ? ` on ${programTitle}.` : "."}
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-[#475569]">
              Title *
            </label>
            <input
              className="w-full rounded-lg border border-[#b7c5e5] px-3 py-2"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Q3 cash-flow review"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[#475569]">
              Session date *
            </label>
            <input
              type="date"
              className="w-full rounded-lg border border-[#b7c5e5] px-3 py-2"
              value={form.sessionDate}
              onChange={(e) => set("sessionDate", e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[#475569]">
              Next session
            </label>
            <input
              type="date"
              className="w-full rounded-lg border border-[#b7c5e5] px-3 py-2"
              value={form.nextSessionDate}
              onChange={(e) => set("nextSessionDate", e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[#475569]">
              Session type *
            </label>
            <select
              className="w-full rounded-lg border border-[#b7c5e5] px-3 py-2 pr-10"
              value={form.sessionType}
              onChange={(e) => set("sessionType", e.target.value)}
            >
              {SESSION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[#475569]">
              Facilitator
            </label>
            <input
              className="w-full rounded-lg border border-[#b7c5e5] px-3 py-2"
              value={form.facilitator}
              onChange={(e) => set("facilitator", e.target.value)}
              placeholder="Who ran the session"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-[#475569]">
              How is the startup doing?
            </label>
            <select
              className="w-full rounded-lg border border-[#b7c5e5] px-3 py-2 pr-10"
              value={form.flag}
              onChange={(e) => set("flag", e.target.value)}
            >
              {FLAGS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {[
            ["issuesDiscussed", "Issues discussed"],
            ["recommendationsGiven", "Recommendations given"],
            ["actionsAgreed", "Actions agreed"],
          ].map(([key, label]) => (
            <div key={key} className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-[#475569]">
                {label}
              </label>
              <textarea
                className="min-h-[90px] w-full rounded-lg border border-[#b7c5e5] px-3 py-2"
                value={form[key]}
                onChange={(e) => set(key, e.target.value)}
              />
            </div>
          ))}
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-black/15 px-5 py-2 font-medium text-[#334155]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-[#163b8f] px-5 py-2 font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save session"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionFormModal;
