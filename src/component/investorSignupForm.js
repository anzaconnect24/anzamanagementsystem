import { useTranslation } from "../locales";

const InvestorSignupForm = ({ formValues = {}, setFormValues = () => {} }) => {
  const { t } = useTranslation();

  const inputClass =
    "h-12 w-full rounded-md border border-gray-200 bg-gray-50 px-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

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
          {t("investor.companyName", "Company Name")} *
        </label>
        <input
          name="company"
          required
          className={inputClass}
          placeholder={t("investor.enterCompanyName", "Your company name")}
          type="text"
        />
      </div>

      <div>
        <label className={labelClass}>
          {t("business.location", "Location")} *
        </label>
        <input
          name="location"
          required
          className={inputClass}
          placeholder={t("investor.enterLocation", "Your location")}
          type="text"
        />
      </div>

      <div>
        <label className={labelClass}>
          {t("investor.briefBio", "Brief Bio")} *
        </label>
        <textarea
          required
          name="investorBio"
          onChange={(e) => updateFormValue("investorBio", e.target.value)}
          className={`${textareaClass} min-h-[120px]`}
          placeholder={t(
            "investor.briefBioPlaceholder",
            "Tell us about yourself & investment background"
          )}
          rows="4"
        />
      </div>

      <div>
        <label className={labelClass}>
          {t("investor.notableInvestments", "Notable Investments")}
        </label>
        <textarea
          name="investorNotableInvestments"
          onChange={(e) =>
            updateFormValue("investorNotableInvestments", e.target.value)
          }
          className={`${textareaClass} min-h-[120px]`}
          placeholder={t(
            "investor.notableInvestmentsPlaceholder",
            "List your notable investments (if applicable)"
          )}
          rows="4"
        />
      </div>

      <div>
        <label className={labelClass}>
          {t("investor.seeking", "Seeking")} *
        </label>
        <textarea
          name="seeking"
          required
          className={`${textareaClass} min-h-[120px]`}
          placeholder={t("investor.seekingPlaceholder", "What are you seeking")}
          rows="4"
        />
      </div>

      <div className="space-y-4 rounded-md border border-gray-200 bg-gray-50 p-5">
        <label className="flex items-start gap-3 text-sm text-gray-700">
          <input
            type="checkbox"
            name="investorContactConsent"
            required
            className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span>
            {t(
              "investor.contactConsent",
              "I agree to be contacted regarding investment opportunities"
            )}
          </span>
        </label>

        <label className="flex items-start gap-3 text-sm text-gray-700">
          <input
            type="checkbox"
            name="investorMatchingConsent"
            required
            className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span>
            {t(
              "investor.matchingConsent",
              "I consent to my information being used for investor matching/mentors or any other platform that can help"
            )}
          </span>
        </label>
      </div>
    </div>
  );
};

export default InvestorSignupForm;