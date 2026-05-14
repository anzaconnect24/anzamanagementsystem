import { useTranslation } from "../locales";

const MentorSignupForm = ({
  formValues = {},
  setFormValues = () => {},
}) => {
  const { t } = useTranslation();

  const textareaClass =
    "w-full rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

  const labelClass = "mb-2 block text-sm font-semibold text-gray-800";

  const updateFormValue = (key, value) => {
    setFormValues({
      ...formValues,
      [key]: value,
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <label className={labelClass}>
          Brief Professional Introduction *
        </label>
        <textarea
          name="mentorDescription"
          required
          value={formValues.mentorDescription || ""}
          onChange={(e) =>
            updateFormValue("mentorDescription", e.target.value)
          }
          className={`${textareaClass} min-h-[120px]`}
          placeholder="Tell us about yourself, your professional background, and your experience."
          rows="4"
        />
      </div>

      <div>
        <label className={labelClass}>
          Areas of Expertise *
        </label>
        <textarea
          value={formValues.mentorAreaOfExpertise || ""}
          onChange={(e) => updateFormValue("mentorAreaOfExpertise", e.target.value)}
          name="mentorAreaOfExpertise"
          required
          className={`${textareaClass} min-h-[80px]`}
          placeholder="Describe the areas where you can mentor entrepreneurs (e.g., business strategy, finance, leadership, marketing, operations, fundraising, technology, etc.)."
        />
      </div>

      <div>
        <label className={labelClass}>
          Industries You Have Experience In *
        </label>
        <textarea
          value={formValues.mentorIndustries || ""}
          onChange={(e) => updateFormValue("mentorIndustries", e.target.value)}
          name="mentorIndustries"
          required
          className={`${textareaClass} min-h-[80px]`}
          placeholder="List the industries you have experience in"
        />
      </div>

      <div>
        <label className={labelClass}>
          What type of entrepreneurs would you like to mentor? *
        </label>
        <textarea
          value={formValues.mentorMentorshipFocus || ""}
          onChange={(e) => updateFormValue("mentorMentorshipFocus", e.target.value)}
          name="mentorMentorshipFocus"
          required
          className={`${textareaClass} min-h-[80px]`}
          placeholder="(Startup stage, growth businesses, women-led businesses, youth entrepreneurs, tech startups, etc.)"
        />
      </div>
    </div>
  );
};

export default MentorSignupForm;