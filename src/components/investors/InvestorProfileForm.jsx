import { useEffect, useRef, useState } from "react";
import { HiCheck, HiChevronDown, HiOutlineLocationMarker } from "react-icons/hi";
import { profileList } from "@/utils/profile_list";
import {
  ABOUT_LIMIT,
  BUSINESS_STAGES,
  CAPITAL_TYPES,
  FUND_SIZES,
  GEOGRAPHIES,
  IMPACT_AREAS,
  INVESTOR_TYPES,
  TICKET_SIZES,
} from "@/utils/investorProfileOptions";

// The investor profile questions, used on sign-up (one section per step) and
// on the investor's own Edit Profile page (all sections together), so both
// ask exactly the same thing.

export const INVESTOR_PROFILE_SECTIONS = ["company", "investment", "impact"];

export const emptyInvestorProfile = () => ({
  company: "",
  legalName: "",
  investorType: "",
  headquarters: "",
  yearFounded: "",
  fundSize: "",
  bio: "",
  sectors: [],
  businessStages: [],
  ticketSize: "",
  capitalType: "",
  geographies: [],
  impactAreas: [],
  impactThesis: "",
});

// A saved profile as form values, reading the older columns where a profile
// predates these questions.
export const investorProfileFromRecord = (profile = {}) => {
  const sectors = profileList(profile.sectors);
  return {
    ...emptyInvestorProfile(),
    company: profile.company || "",
    legalName: profile.legalName || "",
    investorType: profile.investorType || "",
    headquarters: profile.headquarters || profile.geography || "",
    yearFounded: profile.yearFounded ? String(profile.yearFounded) : "",
    fundSize: profile.fundSize || "",
    bio: profile.bio || "",
    sectors: sectors.length ? sectors : profile.BusinessSector?.name ? [profile.BusinessSector.name] : [],
    businessStages: profileList(profile.businessStages),
    ticketSize: profile.ticketSize || profile.investmentSize || "",
    capitalType: profile.capitalType || "",
    geographies: profileList(profile.geographies),
    impactAreas: profileList(profile.impactAreas),
    impactThesis: profile.impactThesis || "",
  };
};

const REQUIRED = [
  ["company", "company", "Enter your organisation or fund name"],
  ["company", "legalName", "Enter your legal company name"],
  ["company", "investorType", "Choose the type of investor you are"],
  ["company", "headquarters", "Enter where your headquarters are located"],
  ["company", "yearFounded", "Enter the year your organisation was founded"],
  ["company", "fundSize", "Choose your fund size"],
  ["company", "bio", "Tell us briefly about your organisation"],
  ["investment", "sectors", "Choose at least one sector"],
  ["investment", "businessStages", "Choose at least one business stage"],
  ["investment", "ticketSize", "Choose your typical ticket size"],
  ["investment", "capitalType", "Choose the type of capital you provide"],
  ["investment", "geographies", "Choose at least one geography"],
];

// The first problem with the answers in the given sections, or null when they
// can be saved.
export const validateInvestorProfile = (values, sections = INVESTOR_PROFILE_SECTIONS) => {
  for (const [section, key, message] of REQUIRED) {
    if (!sections.includes(section)) continue;
    const value = values[key];
    if (Array.isArray(value) ? value.length === 0 : !String(value ?? "").trim()) return message;
  }
  if (sections.includes("company")) {
    const year = Number(values.yearFounded);
    const thisYear = new Date().getFullYear();
    if (!Number.isInteger(year) || year < 1800 || year > thisYear) {
      return `Year founded must be between 1800 and ${thisYear}`;
    }
    if (values.bio.length > ABOUT_LIMIT) return `About your organisation must be ${ABOUT_LIMIT} characters or fewer`;
  }
  if (sections.includes("impact") && values.impactThesis.length > ABOUT_LIMIT) {
    return `Your impact thesis must be ${ABOUT_LIMIT} characters or fewer`;
  }
  return null;
};

// ---- Controls ---------------------------------------------------------------

const controlClass =
  "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#082d77] focus:ring-2 focus:ring-[#082d77]/15";

const Question = ({ number, text, required, hint, className = "", children }) => (
  <div className={className}>
    <span className="mb-1.5 block text-sm font-semibold text-slate-800">
      {number}. {text}
      {required && <span className="text-rose-500"> *</span>}
    </span>
    {children}
    {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
  </div>
);

// A value saved before these options existed is kept as an option, so an
// older profile does not appear blank or lose its answer on save.
const withCurrent = (options, current) =>
  current && !options.includes(current) ? [current, ...options] : options;

const Select = ({ value, onChange, options, placeholder }) => (
  <div className="relative">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${controlClass} appearance-none pr-9 ${value ? "" : "text-slate-400"}`}
    >
      <option value="">{placeholder}</option>
      {withCurrent(options, value).map((option) => (
        <option key={option} value={option} className="text-slate-800">
          {option}
        </option>
      ))}
    </select>
    <HiChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
  </div>
);

const IconInput = ({ icon, className = "", ...props }) => (
  <div className="relative">
    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{icon}</span>
    <input {...props} className={`${controlClass} pl-9 ${className}`} />
  </div>
);

const LimitedTextarea = ({ value, onChange, placeholder, rows = 4 }) => (
  <div>
    <textarea
      value={value}
      maxLength={ABOUT_LIMIT}
      rows={rows}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#082d77] focus:ring-2 focus:ring-[#082d77]/15"
    />
    <p className="mt-0.5 text-right text-xs text-slate-400">
      {value.length}/{ABOUT_LIMIT}
    </p>
  </div>
);

function MultiSelect({ value = [], onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const allOptions = [...value.filter((item) => !options.includes(item)), ...options];
  const shown = allOptions.filter((option) => option.toLowerCase().includes(query.trim().toLowerCase()));
  const toggle = (option) =>
    onChange(value.includes(option) ? value.filter((item) => item !== option) : [...value, option]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className={`${controlClass} flex items-center justify-between gap-2 text-left`}
      >
        <span className={`truncate ${value.length ? "text-slate-800" : "text-slate-400"}`}>
          {value.length ? `${value.length} selected` : placeholder}
        </span>
        <HiChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          {allOptions.length > 8 && (
            <div className="border-b border-slate-100 p-2">
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="h-9 w-full rounded-md border border-slate-200 px-2 text-sm outline-none focus:border-[#082d77]"
              />
            </div>
          )}
          <ul role="listbox" aria-multiselectable="true" className="max-h-60 overflow-y-auto py-1">
            {shown.map((option) => {
              const selected = value.includes(option);
              return (
                <li key={option}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => toggle(option)}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                      selected ? "font-semibold text-[#082d77]" : "text-slate-700"
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        selected ? "border-[#082d77] bg-[#082d77] text-white" : "border-slate-300"
                      }`}
                    >
                      {selected && <HiCheck className="h-3 w-3" />}
                    </span>
                    {option}
                  </button>
                </li>
              );
            })}
            {shown.length === 0 && <li className="px-3 py-2 text-sm text-slate-400">No matches</li>}
          </ul>
        </div>
      )}

      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {value.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1 rounded-full bg-[#082d77]/10 px-2.5 py-0.5 text-xs font-semibold text-[#082d77]"
            >
              {item}
              <button
                type="button"
                onClick={() => toggle(item)}
                aria-label={`Remove ${item}`}
                className="text-[#082d77]/60 hover:text-[#082d77]"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

const Section = ({ children }) => (
  <section className="border-b border-slate-100 py-6 first:pt-0 last:border-b-0 last:pb-0">
    {children}
  </section>
);

// ---- The form ---------------------------------------------------------------

// values / onChange(key, value): the answers. sectorOptions: platform sector
// names for question 8. sections: which of "company", "investment" and
// "impact" to show — sign-up shows one per step.
export default function InvestorProfileForm({
  values,
  onChange,
  sectorOptions = [],
  sections = INVESTOR_PROFILE_SECTIONS,
}) {
  const set = (key) => (value) => onChange(key, value);
  const text = (key) => (e) => onChange(key, e.target.value);

  return (
    <div>
      {sections.includes("company") && (
        <Section>
          <div className="grid gap-y-4">
            <div className="space-y-4">
              <Question number={1} text="What is your organisation / fund name?" required>
                <input className={controlClass} value={values.company} onChange={text("company")} placeholder="e.g. Ubuntu Capital Partners" />
              </Question>
              <Question number={2} text="What is your legal company name?" required>
                <input className={controlClass} value={values.legalName} onChange={text("legalName")} placeholder="e.g. Ubuntu Capital Partners Ltd." />
              </Question>
              <Question number={3} text="What type of investor are you?" required>
                <Select value={values.investorType} onChange={set("investorType")} options={INVESTOR_TYPES} placeholder="Select investor type" />
              </Question>
              <Question number={4} text="Where is your headquarters located?" required>
                <IconInput icon={<HiOutlineLocationMarker className="h-4 w-4" />} value={values.headquarters} onChange={text("headquarters")} placeholder="e.g. Nairobi, Kenya" />
              </Question>
            </div>
            <div className="space-y-4">
              <Question number={5} text="What year was your organisation founded?" required>
                <input
                  className={controlClass}
                  type="number"
                  inputMode="numeric"
                  min="1800"
                  max={new Date().getFullYear()}
                  value={values.yearFounded}
                  onChange={text("yearFounded")}
                  placeholder="e.g. 2015"
                />
              </Question>
              <Question number={6} text="What is your fund size?" required>
                <Select value={values.fundSize} onChange={set("fundSize")} options={FUND_SIZES} placeholder="Select fund size" />
              </Question>
              <Question number={7} text="Tell us briefly about your organisation" required>
                <LimitedTextarea
                  value={values.bio}
                  onChange={set("bio")}
                  rows={5}
                  placeholder="e.g. Your mission, focus and what makes your organisation unique..."
                />
              </Question>
            </div>
          </div>
        </Section>
      )}

      {sections.includes("investment") && (
        <Section>
          <div className="grid gap-y-4">
            <Question number={8} text="Which sectors are you interested in?" required hint="Select one or more sectors">
              <MultiSelect value={values.sectors} onChange={set("sectors")} options={sectorOptions} placeholder={sectorOptions.length ? "Select sectors" : "Loading sectors..."} />
            </Question>
            <Question number={9} text="Which business stages do you invest in?" required hint="Select one or more stages">
              <MultiSelect value={values.businessStages} onChange={set("businessStages")} options={BUSINESS_STAGES} placeholder="Select business stages" />
            </Question>
            <Question number={10} text="What is your typical ticket size?" required>
              <Select value={values.ticketSize} onChange={set("ticketSize")} options={TICKET_SIZES} placeholder="Select ticket size" />
            </Question>
            <Question number={11} text="What type of capital do you provide?" required>
              <Select value={values.capitalType} onChange={set("capitalType")} options={CAPITAL_TYPES} placeholder="Select capital type" />
            </Question>
            <Question number={12} text="Which geographies do you invest in?" required hint="Select one or more countries or regions">
              <MultiSelect value={values.geographies} onChange={set("geographies")} options={GEOGRAPHIES} placeholder="Select geographies" />
            </Question>
          </div>
        </Section>
      )}

      {sections.includes("impact") && (
        <Section>
          <div className="grid gap-y-4">
            <Question number={13} text="What impact areas do you focus on?" hint="Select one or more impact areas">
              <MultiSelect value={values.impactAreas} onChange={set("impactAreas")} options={IMPACT_AREAS} placeholder="Select impact areas" />
            </Question>
            <Question number={14} text="What is your impact thesis?">
              <LimitedTextarea value={values.impactThesis} onChange={set("impactThesis")} placeholder="e.g. How you create impact through your investments..." />
            </Question>
          </div>
        </Section>
      )}
    </div>
  );
}
