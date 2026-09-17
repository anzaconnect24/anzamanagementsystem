"use client";

// Creating and editing a capital provider: what it finances, for whom, and how
// to reach it. Contact details stay confidential until an introduction.
import { useState } from "react";
import toast from "react-hot-toast";
import { createCapitalProvider, updateCapitalProvider } from "@/controllers/capital_controller";
import { Field, inputClass, Modal, Select, buttonClass } from "@/components/capital/CapitalUI";
import { FINANCING_LABELS, PROVIDER_TYPE_LABELS, human } from "@/utils/capital_labels";

const LISTS = [
  ["preferredSectors", "Preferred sectors", "Agriculture, Fintech, Health"],
  ["preferredGeographies", "Preferred geographies", "Tanzania, East Africa"],
  ["enterpriseStages", "Enterprise stages", "early, growth"],
  ["impactThemes", "Impact themes", "climate, gender, jobs"],
  ["requiredDocuments", "Required documents", "Audited accounts, business plan"],
];

const joined = (value) => (Array.isArray(value) ? value.join(", ") : value || "");
const dateOnly = (value) => (value ? String(value).slice(0, 10) : "");

const fromProvider = (provider = {}) => ({
  name: provider.name || "",
  providerType: provider.providerType || "investor",
  status: provider.status || "active",
  capitalAppetite: provider.capitalAppetite || "",
  minTicketUsd: provider.minTicketUsd ?? "",
  maxTicketUsd: provider.maxTicketUsd ?? "",
  minAnnualRevenueUsd: provider.minAnnualRevenueUsd ?? "",
  instruments: Array.isArray(provider.instruments) ? provider.instruments : [],
  ...Object.fromEntries(LISTS.map(([key]) => [key, joined(provider[key])])),
  applicationWindowOpens: dateOnly(provider.applicationWindowOpens),
  applicationWindowCloses: dateOnly(provider.applicationWindowCloses),
  genderPreference: provider.genderPreference || "none",
  youthPreference: !!provider.youthPreference,
  esgRequirements: provider.esgRequirements || "",
  tractionRequirements: provider.tractionRequirements || "",
  eligibilityCriteria: provider.eligibilityCriteria || "",
  financingCriteria: provider.financingCriteria || "",
  previousTransactions: provider.previousTransactions || "",
  contactName: provider.contactName || "",
  contactEmail: provider.contactEmail || "",
  contactPhone: provider.contactPhone || "",
});

const ProviderForm = ({ open, provider, onClose, onSaved }) => {
  const [form, setForm] = useState(() => fromProvider(provider));
  const [saving, setSaving] = useState(false);
  const [lastKey, setLastKey] = useState(provider?.uuid || "new");

  // Reset when a different provider is opened.
  const key = provider?.uuid || "new";
  if (open && key !== lastKey) {
    setLastKey(key);
    setForm(fromProvider(provider));
  }

  const set = (field) => (value) => setForm((prev) => ({ ...prev, [field]: value }));
  const input = (field) => (event) => set(field)(event.target.value);
  const toggleInstrument = (value) => set("instruments")(form.instruments.includes(value) ? form.instruments.filter((item) => item !== value) : [...form.instruments, value]);

  const save = async () => {
    if (!form.name.trim()) return toast.error("A capital provider needs a name");
    setSaving(true);
    const response = provider?.uuid ? await updateCapitalProvider(provider.uuid, form) : await createCapitalProvider(form);
    setSaving(false);
    if (response?.status === false) return toast.error(response.message || "Failed to save the provider");
    toast.success(provider?.uuid ? "Provider saved" : "Provider added");
    onSaved(response.body);
  };

  return (
    <Modal
      open={open}
      wide
      title={provider?.uuid ? `Edit ${provider.name}` : "Add a capital provider"}
      onClose={onClose}
      footer={<><button type="button" className={buttonClass.secondary} onClick={onClose}>Cancel</button><button type="button" className={buttonClass.primary} disabled={saving} onClick={save}>{saving ? "Saving…" : "Save provider"}</button></>}
    >
      <div className="space-y-5">
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Name" className="sm:col-span-2"><input className={inputClass} value={form.name} onChange={input("name")} /></Field>
          <Field label="Type"><Select value={form.providerType} onChange={set("providerType")} options={Object.entries(PROVIDER_TYPE_LABELS).map(([value, label]) => ({ value, label }))} /></Field>
          <Field label="Status"><Select value={form.status} onChange={set("status")} options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} /></Field>
          <Field label="Min ticket (USD)"><input className={inputClass} inputMode="numeric" value={form.minTicketUsd} onChange={input("minTicketUsd")} /></Field>
          <Field label="Max ticket (USD)"><input className={inputClass} inputMode="numeric" value={form.maxTicketUsd} onChange={input("maxTicketUsd")} /></Field>
          <Field label="Min annual revenue (USD)"><input className={inputClass} inputMode="numeric" value={form.minAnnualRevenueUsd} onChange={input("minAnnualRevenueUsd")} /></Field>
          <Field label="Capital appetite"><Select value={form.capitalAppetite} onChange={set("capitalAppetite")} placeholder="Not stated" options={["high", "medium", "low", "paused"].map((v) => ({ value: v, label: human(v) }))} /></Field>
        </section>

        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Financing instruments</p>
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {Object.entries(FINANCING_LABELS).map(([value, label]) => (
              <label key={value} className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={form.instruments.includes(value)} onChange={() => toggleInstrument(value)} />
                {label}
              </label>
            ))}
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          {LISTS.map(([field, label, placeholder]) => (
            <Field key={field} label={`${label} (comma-separated)`}><input className={inputClass} value={form[field]} onChange={input(field)} placeholder={placeholder} /></Field>
          ))}
          <Field label="Gender focus"><Select value={form.genderPreference} onChange={set("genderPreference")} options={[{ value: "none", label: "None" }, { value: "women_led", label: "Women-led enterprises" }, { value: "women_owned", label: "Women-owned enterprises" }]} /></Field>
          <Field label="Application window opens"><input type="date" className={inputClass} value={form.applicationWindowOpens} onChange={input("applicationWindowOpens")} /></Field>
          <Field label="Application window closes"><input type="date" className={inputClass} value={form.applicationWindowCloses} onChange={input("applicationWindowCloses")} /></Field>
          <label className="flex items-center gap-2 self-end pb-2 text-sm text-slate-700"><input type="checkbox" checked={form.youthPreference} onChange={(e) => set("youthPreference")(e.target.checked)} /> Youth-led focus</label>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          {[["eligibilityCriteria", "Eligibility criteria"], ["financingCriteria", "Financing criteria"], ["tractionRequirements", "Traction requirements"], ["esgRequirements", "ESG requirements"], ["previousTransactions", "Previous transactions"]].map(([field, label]) => (
            <Field key={field} label={label}><textarea rows={2} className={inputClass} value={form[field]} onChange={input(field)} /></Field>
          ))}
        </section>

        <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Contact (confidential until an approved introduction)</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Name"><input className={inputClass} value={form.contactName} onChange={input("contactName")} /></Field>
            <Field label="Email"><input type="email" className={inputClass} value={form.contactEmail} onChange={input("contactEmail")} /></Field>
            <Field label="Phone"><input className={inputClass} value={form.contactPhone} onChange={input("contactPhone")} /></Field>
          </div>
        </section>
      </div>
    </Modal>
  );
};

export default ProviderForm;
