import { useEffect, useRef, useState } from "react";
import { HiCheck, HiChevronDown, HiOutlineLocationMarker } from "react-icons/hi";
import { expertiseList } from "@/utils/mentorProfile";
import {
  BIO_LIMIT,
  BUSINESS_STAGES,
  COUNTRIES,
  EXPERIENCE_YEARS,
  EXPERTISE_AREAS,
  MENTORING_FORMATS,
  MENTOR_AVAILABILITY,
  MENTOR_INDUSTRIES,
  SUPPORT_TYPES,
} from "@/utils/mentorProfileOptions";

// The mentor profile questions, used on sign-up (one section per step) and on
// the mentor's own Edit Profile page, so both ask exactly the same thing.

export const MENTOR_PROFILE_SECTIONS = ["background", "expertise", "support"];

export const emptyMentorProfile = () => ({
  position: "",
  organisation: "",
  country: "",
  location: "",
  linkedinURL: "",
  experienceYears: "",
  expertiseAreas: [],
  industries: [],
  preferredStages: [],
  supportTypes: [],
  mentorAvailability: "",
  mentoringFormat: "",
  description: "",
  consent: false,
});

// A saved profile as form values, reading the older columns where a profile
// predates these questions.
export const mentorProfileFromRecord = (profile = {}) => {
  const expertise = expertiseList(profile.expertiseAreas);
  const support = expertiseList(profile.supportTypes);
  const formats = expertiseList(profile.mentoringFormat);
  return {
    ...emptyMentorProfile(),
    position: profile.position || "",
    organisation: profile.organisation || "",
    country: profile.country || "",
    location: profile.location || "",
    linkedinURL: profile.linkedinURL || "",
    experienceYears: profile.experienceYears || "",
    expertiseAreas: expertise.length ? expertise : expertiseList(profile.areasOfExperties),
    industries: expertiseList(profile.industries),
    preferredStages: expertiseList(profile.preferredStages),
    supportTypes: support.length ? support : expertiseList(profile.mentorshipFocus),
    mentorAvailability: profile.mentorAvailability || "",
    mentoringFormat: formats[0] || "",
    description: profile.description || "",
    consent: !!profile.consentAt,
  };
};

const REQUIRED = [
  ["background", "position", "Enter your current position or professional title"],
  ["background", "country", "Choose your country"],
  ["background", "experienceYears", "Choose how much professional experience you have"],
  ["expertise", "expertiseAreas", "Choose at least one area of expertise"],
  ["support", "supportTypes", "Choose at least one way you would like to support entrepreneurs"],
  ["support", "mentorAvailability", "Choose your mentoring availability"],
  ["support", "description", "Write a short professional bio"],
];

// The first problem with the answers in the given sections, or null when they
// can be saved.
export const validateMentorProfile = (values, sections = MENTOR_PROFILE_SECTIONS) => {
  for (const [section, key, message] of REQUIRED) {
    if (!sections.includes(section)) continue;
    const value = values[key];
    if (Array.isArray(value) ? value.length === 0 : !String(value ?? "").trim()) return message;
  }
  if (sections.includes("support")) {
    if (values.description.length > BIO_LIMIT) return `Your bio must be ${BIO_LIMIT} characters or fewer`;
    if (!values.consent) {
      return "Please agree to your mentor profile being shown to entrepreneurs";
    }
  }
  return null;
};

// ---- Controls ---------------------------------------------------------------

const controlClass =
  "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#082d77] focus:ring-2 focus:ring-[#082d77]/15";

const Question = ({ number, text, required, hint, children }) => (
  <div>
    <span className="mb-1.5 block text-sm font-semibold text-slate-800">
      {number}. {text}
      {required && <span className="text-rose-500"> *</span>}
    </span>
    {children}
    {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
  </div>
);

// A value saved before these options existed is kept as an option, so an older
// profile does not appear blank or lose its answer on save.
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

const LimitedTextarea = ({ value, onChange, placeholder, rows = 4 }) => (
  <div>
    <textarea
      value={value}
      maxLength={BIO_LIMIT}
      rows={rows}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#082d77] focus:ring-2 focus:ring-[#082d77]/15"
    />
    <p className="mt-0.5 text-right text-xs text-slate-400">
      {value.length}/{BIO_LIMIT}
    </p>
  </div>
);

// A multi-select whose "Other" choice opens a box for whatever is not listed;
// what is typed there is stored as its own answer.
function MultiSelect({ value = [], onChange, options, placeholder, allowOther = false }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);

  const listed = allowOther ? [...options, "Other"] : options;
  const other = value.find((item) => !listed.includes(item)) || "";
  const chosen = value.filter((item) => listed.includes(item));
  const showOther = allowOther && (chosen.includes("Other") || !!other);

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const toggle = (option) => {
    const next = chosen.includes(option)
      ? chosen.filter((item) => item !== option)
      : [...chosen, option];
    const keepOther = next.includes("Other") && other ? [other] : [];
    onChange([...next, ...keepOther]);
  };

  const setOther = (text) => onChange([...chosen, ...(text.trim() ? [text] : [])]);

  const shown = listed.filter((option) => option.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div>
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
            {listed.length > 8 && (
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
                const selected = chosen.includes(option);
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
      </div>

      {showOther && (
        <input
          className={`${controlClass} mt-2`}
          value={other}
          onChange={(e) => setOther(e.target.value)}
          placeholder="Please specify"
        />
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
                onClick={() => onChange(value.filter((entry) => entry !== item))}
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

// values / onChange(key, value): the answers. sections: which of "background",
// "expertise" and "support" to show — sign-up shows one per step.
export default function MentorProfileForm({ values, onChange, sections = MENTOR_PROFILE_SECTIONS }) {
  const set = (key) => (value) => onChange(key, value);
  const text = (key) => (e) => onChange(key, e.target.value);

  return (
    <div>
      {sections.includes("background") && (
        <Section>
          <div className="grid gap-y-4">
            <Question number={1} text="What is your current position / professional title?" required hint="Example: Investment Manager, Marketing Consultant, Founder, Finance Director">
              <input className={controlClass} value={values.position} onChange={text("position")} placeholder="e.g. Investment Manager" />
            </Question>
            <Question number={2} text="Which organisation / company do you work for?">
              <input className={controlClass} value={values.organisation} onChange={text("organisation")} placeholder="e.g. BDO East Africa" />
            </Question>
            <Question number={3} text="Which country are you based in?" required>
              <Select value={values.country} onChange={set("country")} options={COUNTRIES} placeholder="Select country" />
            </Question>
            <Question number={4} text="Which city or town are you based in?">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  <HiOutlineLocationMarker className="h-4 w-4" />
                </span>
                <input className={`${controlClass} pl-9`} value={values.location} onChange={text("location")} placeholder="e.g. Dar es Salaam" />
              </div>
            </Question>
            <Question number={5} text="What is your LinkedIn profile?">
              <input className={controlClass} value={values.linkedinURL} onChange={text("linkedinURL")} placeholder="https://linkedin.com/in/yourname" />
            </Question>
            <Question number={6} text="How much professional experience do you have?" required>
              <Select value={values.experienceYears} onChange={set("experienceYears")} options={EXPERIENCE_YEARS} placeholder="Select professional experience" />
            </Question>
          </div>
        </Section>
      )}

      {sections.includes("expertise") && (
        <Section>
          <div className="grid gap-y-4">
            <Question number={7} text="What are your areas of expertise?" required hint="Select all that apply">
              <MultiSelect value={values.expertiseAreas} onChange={set("expertiseAreas")} options={EXPERTISE_AREAS} placeholder="Select areas of expertise" allowOther />
            </Question>
            <Question number={8} text="Which industries / sectors can you mentor?" hint="Select all that apply">
              <MultiSelect value={values.industries} onChange={set("industries")} options={MENTOR_INDUSTRIES} placeholder="Select industries" allowOther />
            </Question>
            <Question number={9} text="What is your preferred stage of business?" hint="Select all that apply">
              <MultiSelect value={values.preferredStages} onChange={set("preferredStages")} options={BUSINESS_STAGES} placeholder="Select business stages" />
            </Question>
          </div>
        </Section>
      )}

      {sections.includes("support") && (
        <Section>
          <div className="grid gap-y-4">
            <Question number={10} text="How would you like to support entrepreneurs?" required hint="Select all that apply">
              <MultiSelect value={values.supportTypes} onChange={set("supportTypes")} options={SUPPORT_TYPES} placeholder="Select how you will support entrepreneurs" />
            </Question>
            <Question number={11} text="What is your mentoring availability?" required>
              <Select value={values.mentorAvailability} onChange={set("mentorAvailability")} options={MENTOR_AVAILABILITY} placeholder="Select availability" />
            </Question>
            <Question number={12} text="What is your preferred mentoring format?">
              <Select value={values.mentoringFormat} onChange={set("mentoringFormat")} options={MENTORING_FORMATS} placeholder="Select format" />
            </Question>
            <Question number={13} text="Write a short professional bio" required hint="Tell entrepreneurs about your experience and how you can support them.">
              <LimitedTextarea value={values.description} onChange={set("description")} rows={5} placeholder="e.g. Fifteen years in corporate finance, supporting SMEs to become investment ready..." />
            </Question>
            <Question number={14} text="Consent" required>
              <label className="flex items-start gap-3 rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={values.consent}
                  onChange={(e) => onChange("consent", e.target.checked)}
                  className="mt-0.5 h-4 w-4"
                />
                <span>
                  I agree for my mentor profile to be visible on Anza Connect and for Anza to use the
                  information provided to match me with relevant entrepreneurs and programmes.
                </span>
              </label>
            </Question>
          </div>
        </Section>
      )}
    </div>
  );
}
