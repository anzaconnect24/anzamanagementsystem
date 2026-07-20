import { useEffect, useState } from "react";
import { getSectors } from "../controllers/sector_controller";
import { useTranslation } from "../locales";

// Mentor signup. Every field here maps onto a MentorProfile column that the
// mentor list and mentor detail pages read — keep them in step, or the detail
// page shows "N/A" for whatever is missing.
const EXPERTISE_OPTIONS = [
  { key: "mentor.expertise.businessStrategyAndGrowth", fallback: "Business Strategy & Growth" },
  { key: "mentor.expertise.financeAndFundraising", fallback: "Finance & Fundraising" },
  { key: "mentor.expertise.marketingAndBranding", fallback: "Marketing & Branding" },
  { key: "mentor.expertise.operationsAndSupplyChain", fallback: "Operations & Supply Chain" },
  { key: "mentor.expertise.leadershipAndTeamDevelopment", fallback: "Leadership & Team Development" },
  { key: "mentor.expertise.legalAndCompliance", fallback: "Legal & Compliance" },
  { key: "mentor.expertise.impactAndSustainability", fallback: "Impact & Sustainability" },
];

const FORMAT_OPTIONS = [
  { key: "mentor.formats.oneOnOne", fallback: "One-on-One Sessions" },
  { key: "mentor.formats.groupMentorship", fallback: "Group Mentorship" },
  { key: "mentor.formats.onlineVirtual", fallback: "Online/Virtual Mentorship" },
  { key: "mentor.formats.inPerson", fallback: "In-Person Mentorship" },
];

const AVAILABILITY_OPTIONS = [
  { key: "mentor.availabilityOptions.weekly", fallback: "Weekly" },
  { key: "mentor.availabilityOptions.biweekly", fallback: "Biweekly" },
  { key: "mentor.availabilityOptions.monthly", fallback: "Monthly" },
  { key: "mentor.availabilityOptions.flexible", fallback: "Flexible" },
];

const SME_FOCUS_OPTIONS = [
  { key: "business.startup", fallback: "Startup" },
  { key: "business.growthStage", fallback: "Growth stage" },
  { key: "business.expansionStage", fallback: "Expansion stage" },
  { key: "business.maturityStage", fallback: "Maturity stage" },
];

const MentorSignupForm = ({ formValues = {}, setFormValues = () => {} }) => {
  const { t } = useTranslation();
  const [sectors, setSectors] = useState([]);

  useEffect(() => {
    // getSectors resolves to the array itself, not a { data } envelope.
    getSectors()
      .then((data) => setSectors(Array.isArray(data) ? data : []))
      .catch(() => setSectors([]));
  }, []);

  const inputClass =
    "w-full rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";
  const textareaClass = `${inputClass} min-h-[100px]`;
  const labelClass = "mb-2 block text-sm font-semibold text-gray-800";

  const updateFormValue = (key, value) =>
    setFormValues({ ...formValues, [key]: value });

  // Multi-selects are stored as index-keyed maps ({0: "...", 1: "..."}) because
  // that is the shape MentorProfile stores and every mentor view reads.
  const toggleInMap = (key, value, checked) => {
    const current = Object.values(formValues[key] || {});
    const next = checked
      ? [...current, value]
      : current.filter((item) => item !== value);
    updateFormValue(
      key,
      next.reduce((acc, val, idx) => ({ ...acc, [idx]: val }), {}),
    );
  };

  const isChecked = (key, value) =>
    Object.values(formValues[key] || {}).includes(value);

  return (
    <div className="space-y-5">
      <div>
        <label className={labelClass}>Brief Professional Introduction *</label>
        <textarea
          name="mentorDescription"
          required
          value={formValues.mentorDescription || ""}
          onChange={(e) => updateFormValue("mentorDescription", e.target.value)}
          className={textareaClass}
          placeholder="Tell us about yourself, your professional background, and your experience."
          rows="4"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label className={labelClass}>
            {t("mentor.organisation", "Organisation")} *
          </label>
          <input
            name="mentorOrganisation"
            required
            value={formValues.mentorOrganisation || ""}
            onChange={(e) => updateFormValue("mentorOrganisation", e.target.value)}
            className={inputClass}
            placeholder="Where you currently work"
          />
        </div>

        <div>
          <label className={labelClass}>
            {t("mentor.position", "Position")} *
          </label>
          <input
            name="mentorPosition"
            required
            value={formValues.mentorPosition || ""}
            onChange={(e) => updateFormValue("mentorPosition", e.target.value)}
            className={inputClass}
            placeholder="Your role or job title"
          />
        </div>

        <div>
          <label className={labelClass}>
            {t("business.businessSector", "Business sector")} *
          </label>
          <select
            name="business_sector_uuid"
            required
            className={inputClass}
            defaultValue=""
          >
            <option value="" disabled>
              {t("business.selectBusinessSector", "Select business sector")}
            </option>
            {sectors.map((item) => (
              <option key={item.uuid} value={item.uuid}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>
            {t("business.location", "Location")} *
          </label>
          <input
            name="location"
            required
            className={inputClass}
            placeholder={t("mentor.locationPlaceholder", "Your location")}
          />
        </div>

        <div>
          <label className={labelClass}>
            {t("mentor.language", "Language")} *
          </label>
          <input
            name="language"
            required
            className={inputClass}
            placeholder="Languages you mentor in"
          />
        </div>

        <div>
          <label className={labelClass}>LinkedIn profile</label>
          <input
            name="mentorLinkedIn"
            value={formValues.mentorLinkedIn || ""}
            onChange={(e) => updateFormValue("mentorLinkedIn", e.target.value)}
            className={inputClass}
            placeholder="https://linkedin.com/in/..."
          />
        </div>

        <div>
          <label className={labelClass}>{t("mentor.smeFocus", "SME Focus")}</label>
          <select
            name="smeFocus"
            className={inputClass}
            value={formValues.smeFocus || ""}
            onChange={(e) => updateFormValue("smeFocus", e.target.value)}
          >
            <option value="" disabled>
              Select the stage you support
            </option>
            {SME_FOCUS_OPTIONS.map((opt) => (
              <option key={opt.key} value={t(opt.key, opt.fallback)}>
                {t(opt.key, opt.fallback)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>
            {t("mentor.availability", "Availability")}
          </label>
          <select
            name="mentorAvailability"
            className={inputClass}
            value={formValues.mentorAvailability || ""}
            onChange={(e) => updateFormValue("mentorAvailability", e.target.value)}
          >
            <option value="" disabled>
              How often can you mentor?
            </option>
            {AVAILABILITY_OPTIONS.map((opt) => (
              <option key={opt.key} value={t(opt.key, opt.fallback)}>
                {t(opt.key, opt.fallback)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>
            {t("mentor.hours", "Hours per month")}
          </label>
          <input
            name="mentorHours"
            type="number"
            min="0"
            value={formValues.mentorHours || ""}
            onChange={(e) => updateFormValue("mentorHours", e.target.value)}
            className={inputClass}
            placeholder="e.g. 8"
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>
          {t("mentor.areasOfExpertise", "Select Your Areas of Expertise")} *
        </label>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {EXPERTISE_OPTIONS.map((expert) => {
            const label = t(expert.key, expert.fallback);
            return (
              <label key={expert.key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isChecked("mentorExpertise", label)}
                  onChange={(e) =>
                    toggleInMap("mentorExpertise", label, e.target.checked)
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span>{label}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <label className={labelClass}>
          {t("mentor.mentoringFormat", "Preferred Mentoring Format")}
        </label>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {FORMAT_OPTIONS.map((format) => {
            const label = t(format.key, format.fallback);
            return (
              <label key={format.key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isChecked("mentorFormat", label)}
                  onChange={(e) =>
                    toggleInMap("mentorFormat", label, e.target.checked)
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span>{label}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <label className={labelClass}>
          Industries You Have Experience In *
        </label>
        <textarea
          name="mentorIndustries"
          required
          value={formValues.mentorIndustries || ""}
          onChange={(e) => updateFormValue("mentorIndustries", e.target.value)}
          className={textareaClass}
          placeholder="List the industries you have experience in"
        />
      </div>

      <div>
        <label className={labelClass}>
          What type of entrepreneurs would you like to mentor? *
        </label>
        <textarea
          name="mentorshipFocus"
          required
          value={formValues.mentorshipFocus || ""}
          onChange={(e) => updateFormValue("mentorshipFocus", e.target.value)}
          className={textareaClass}
          placeholder="(Startup stage, growth businesses, women-led businesses, youth entrepreneurs, tech startups, etc.)"
        />
      </div>
    </div>
  );
};

export default MentorSignupForm;
