import { useTranslation } from "../locales";

const MentorSignupForm = ({
  sectors = [],
  formValues = {},
  setFormValues = () => {},
}) => {
  const { t } = useTranslation();
  return (
    <div>
      <div className="space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-2">
          {/* Personal Information */}
          <div>
            <label
              className="mb-2.5 block font-medium text-black
dark:text-white"
            >
              {t("mentor.linkedinProfile", "LinkedIn Profile")}
            </label>
            <input
              onChange={(e) => {
                const newFormValues = formValues;
                newFormValues.mentorLinkedIn = e.target.value;
                setFormValues(newFormValues);
              }}
              name="mentorLinkedIn"
              required
              className="form-style"
              placeholder={t(
                "mentor.linkedinUrlPlaceholder",
                "Your LinkedIn profile URL"
              )}
              type="text"
            />
          </div>
          <div>
            <label
              className="mb-2.5 block font-medium text-black
dark:text-white"
            >
              {t("mentor.organisationName", "Organization/Company Name")}
            </label>
            <input
              onChange={(e) => {
                const newFormValues = formValues;
                newFormValues.mentorOrganisation = e.target.value;
                setFormValues(newFormValues);
              }}
              name="mentorCompany"
              required
              className="form-style"
              placeholder={t(
                "mentor.organisationNamePlaceholder",
                "Your organization name"
              )}
              type="text"
            />
          </div>
          <div>
            <label
              className="mb-2.5 block font-medium text-black
dark:text-white"
            >
              {t("business.businessSector", "Business sector")}
            </label>
            <select required name="business_sector_uuid" className="form-style">
              <option>
                {t("business.selectBusinessSector", "Select business sector")}
              </option>
              {sectors.map((item) => {
                return (
                  <option key={item.id} value={item.uuid}>
                    {item.name}
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <label
              className="mb-2.5 block font-medium text-black
dark:text-white"
            >
              {t("mentor.currentPositionTitle", "Current Position/Title")}
            </label>
            <input
              onChange={(e) => {
                const newFormValues = formValues;
                newFormValues.mentorPosition = e.target.value;
                setFormValues(newFormValues);
              }}
              name="mentorPosition"
              required
              className="form-style"
              placeholder={t(
                "mentor.currentPositionPlaceholder",
                "Your current position"
              )}
              type="text"
            />
          </div>
          <div>
            <label
              className="mb-2.5 block font-medium text-black
dark:text-white"
            >
              {t("mentor.language", "Language")}
            </label>
            <select
              onChange={(e) => {
                const newFormValues = formValues;
                newFormValues.language = e.target.value;
                setFormValues(newFormValues);
              }}
              name="language"
              required
              className="form-style"
              placeholder={t("mentor.languagePlaceholder", "Your language")}
              type="text"
            >
              <option value={"English"}>
                {t("mentor.languageEnglish", "English")}
              </option>
              <option value={"Swahili"}>
                {t("mentor.languageSwahili", "Swahili")}
              </option>
            </select>
          </div>
          <div className="col-span-1">
            <label
              className="mb-2.5 block font-medium text-black
dark:text-white"
            >
              {t("mentor.smeFocus", "SME Focus")}
            </label>
            <select
              name="smeFocus"
              className="form-style"
              onChange={(e) => {
                const newFormValues = formValues;
                newFormValues.smeFocus = e.target.value;
                setFormValues(newFormValues);
              }}
            >
              {[
                { key: "business.startup", fallback: "Startup" },
                { key: "business.growthStage", fallback: "Growth stage" },
                { key: "business.expansionStage", fallback: "Expansion stage" },
                { key: "business.maturityStage", fallback: "Maturity stage" },
              ].map((opt) => (
                <option key={opt.key} value={t(opt.key, opt.fallback)}>
                  {t(opt.key, opt.fallback)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              className="mb-2.5 block font-medium text-black
dark:text-white"
            >
              {t("business.location", "Location")}
            </label>
            <input
              onChange={(e) => {
                const newFormValues = formValues;
                newFormValues.location = e.target.value;
                setFormValues(newFormValues);
              }}
              name="location"
              required
              className="form-style"
              placeholder={t("mentor.locationPlaceholder", "Your location")}
              type="text"
            />
          </div>
          {/* Expertise & Areas of Support */}
          <div className="col-span-2">
            <label
              className="mb-2.5 block font-medium text-black
dark:text-white"
            >
              {t(
                "mentor.selectAreasOfExpertise",
                "Select Your Areas of Expertise"
              )}
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                {
                  key: "mentor.expertise.businessStrategyAndGrowth",
                  fallback: "Business Strategy & Growth",
                },
                {
                  key: "mentor.expertise.financeAndFundraising",
                  fallback: "Finance & Fundraising",
                },
                {
                  key: "mentor.expertise.marketingAndBranding",
                  fallback: "Marketing & Branding",
                },
                {
                  key: "mentor.expertise.operationsAndSupplyChain",
                  fallback: "Operations & Supply Chain",
                },
                {
                  key: "mentor.expertise.leadershipAndTeamDevelopment",
                  fallback: "Leadership & Team Development",
                },
                {
                  key: "mentor.expertise.legalAndCompliance",
                  fallback: "Legal & Compliance",
                },
                {
                  key: "mentor.expertise.impactAndSustainability",
                  fallback: "Impact & Sustainability",
                },
              ].map((expert) => (
                <label key={expert.key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      let newFormValues = {
                        mentorExpertise: {},
                        ...formValues,
                      };
                      newFormValues.mentorExpertise[
                        Object.keys(newFormValues.mentorExpertise).length
                      ] = e.target.value;
                      setFormValues(newFormValues);
                    }}
                    name="mentorExpertise"
                    value={t(expert.key, expert.fallback)}
                    className="form-checkbox"
                  />
                  <span>{t(expert.key, expert.fallback)}</span>
                </label>
              ))}
            </div>
          </div>
          {/* Availability & Commitment */}
          <div className="col-span-2">
            <label
              className="mb-2.5 block font-medium text-black
dark:text-white"
            >
              {t("mentor.availabilityQuestion", "How often can you mentor?")}
            </label>
            <div className="space-y-2">
              {[
                {
                  value: "weekly",
                  label: t("mentor.availabilityOptions.weekly", "Weekly"),
                },
                {
                  value: "biweekly",
                  label: t("mentor.availabilityOptions.biweekly", "Biweekly"),
                },
                {
                  value: "monthly",
                  label: t("mentor.availabilityOptions.monthly", "Monthly"),
                },
                {
                  value: "flexible",
                  label: t("mentor.availabilityOptions.flexible", "Flexible"),
                },
              ].map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    onChange={(e) => {
                      const newFormValues = formValues;
                      newFormValues.mentorAvailability = e.target.value;
                      setFormValues(newFormValues);
                    }}
                    name="mentorFrequency"
                    value={option.value}
                    className="form-radio"
                  />
                  <span>{option.label}</span>
                  <input
                    type="number"
                    onChange={(e) => {
                      const newFormValues = formValues;
                      newFormValues.mentorHours = e.target.value;
                      setFormValues(newFormValues);
                    }}
                    placeholder={t("mentor.hoursPlaceholder", "Hours")}
                    className="form-style w-24"
                  />
                </div>
              ))}
            </div>
          </div>
          {/* Preferred Mentoring Format */}
          <div className="col-span-2">
            <label
              className="mb-2.5 block font-medium text-black
dark:text-white"
            >
              {t(
                "mentor.preferredMentoringFormat",
                "Preferred Mentoring Format"
              )}
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                {
                  key: "mentor.formats.oneOnOne",
                  fallback: "One-on-One Sessions",
                },
                {
                  key: "mentor.formats.groupMentorship",
                  fallback: "Group Mentorship",
                },
                {
                  key: "mentor.formats.onlineVirtual",
                  fallback: "Online/Virtual Mentorship",
                },
                {
                  key: "mentor.formats.inPerson",
                  fallback: "In-Person Mentorship",
                },
              ].map((format) => (
                <label key={format.key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      // let newFormValues = formValues;
                      let newFormValues = {
                        mentorFormat: {},
                        ...formValues,
                      };
                      newFormValues.mentorFormat[
                        Object.keys(newFormValues.mentorFormat).length
                      ] = e.target.value;
                      setFormValues(newFormValues);
                    }}
                    name="mentorFormat"
                    value={t(format.key, format.fallback)}
                    className="form-checkbox"
                  />
                  <span>{t(format.key, format.fallback)}</span>
                </label>
              ))}
            </div>
          </div>
          {/* Experience & Support */}
          <div className="col-span-2">
            <label
              className="mb-2.5 block font-medium text-black
dark:text-white"
            >
              {t(
                "mentor.experienceLabel",
                "Tell Us About Your Experience and How You Can Support Entrepreneurs"
              )}
            </label>
            <textarea
              name="mentorExperience"
              required
              onChange={(e) => {
                const newFormValues = formValues;
                newFormValues.mentorDescription = e.target.value;
                setFormValues(newFormValues);
              }}
              className="form-style"
              placeholder={t(
                "mentor.experiencePlaceholder",
                "Share your experience and how you can help entrepreneurs"
              )}
              rows="4"
            />
          </div>
          <div className="col-span-2">
            <label className="mb-2.5 block font-medium text-black dark:text-white">
              {t(
                "mentor.selectTop3FocusAreas",
                "Select Your Top 3 Mentorship Focus Areas"
              )}
            </label>
            <div className="flex flex-wrap gap-4">
              {[
                {
                  key: "mentor.focus.businessStrategyAndPlanning",
                  fallback: "Business Strategy & Planning",
                },
                {
                  key: "mentor.focus.financialManagement",
                  fallback: "Financial Management",
                },
                {
                  key: "mentor.focus.operationsAndSystems",
                  fallback: "Operations & Systems",
                },
                {
                  key: "mentor.focus.salesAndMarketing",
                  fallback: "Sales & Marketing",
                },
                {
                  key: "mentor.focus.productAndServiceDevelopment",
                  fallback: "Product & Service Development",
                },
                {
                  key: "mentor.focus.teamAndLeadership",
                  fallback: "Team & Leadership",
                },
                {
                  key: "mentor.focus.legalAndCompliance",
                  fallback: "Legal & Compliance",
                },
                {
                  key: "mentor.focus.impactAndSustainability",
                  fallback: "Impact & Sustainability",
                },
                {
                  key: "mentor.focus.technologyAndDigitalTransformation",
                  fallback: "Technology & Digital Transformation",
                },
                {
                  key: "mentor.focus.investorAndPartnershipReadiness",
                  fallback: "Investor & Partnership Readiness",
                },
                {
                  key: "mentor.focus.exportReadinessAndMarketAccess",
                  fallback: "Export Readiness & Market Access",
                },
                {
                  key: "mentor.focus.personalDevelopmentAndSoftSkills",
                  fallback: "Personal Development & Soft Skills",
                },
              ].map((area) => (
                <label key={area.key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="mentorshipFocus"
                    value={t(area.key, area.fallback)}
                    onChange={(e) => {
                      const newFormValues = { ...formValues };
                      const selectedAreas = newFormValues.mentorshipFocus || [];
                      if (e.target.checked && selectedAreas.length < 3) {
                        newFormValues.mentorshipFocus = [
                          ...selectedAreas,
                          t(area.key, area.fallback),
                        ];
                      } else if (!e.target.checked) {
                        newFormValues.mentorshipFocus = selectedAreas.filter(
                          (item) => item !== t(area.key, area.fallback)
                        );
                      }
                      setFormValues(newFormValues);
                    }}
                    disabled={
                      !formValues.mentorshipFocus?.includes(
                        t(area.key, area.fallback)
                      ) && formValues.mentorshipFocus?.length >= 3
                    }
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-black/20 rounded"
                  />
                  <span className="text-gray-700 dark:text-gray-300">
                    {t(area.key, area.fallback)}
                  </span>
                </label>
              ))}
            </div>
            {formValues.mentorshipFocus?.length > 3 && (
              <p className="text-red-500 text-sm mt-2">
                {t(
                  "mentor.focusAreasLimit",
                  "Please select only up to 3 focus areas."
                )}
              </p>
            )}
          </div>

          {/* Agreement & Consent */}
          <div className="col-span-2 space-y-4 mt-12">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="mentorContactConsent"
                required
                className="form-checkbox"
              />
              <span>
                {t(
                  "mentor.contactConsent",
                  "I agree to be contacted regarding mentorship opportunities"
                )}
              </span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="mentorMatchingConsent"
                required
                className="form-checkbox"
              />
              <span>
                {t(
                  "mentor.matchingConsent",
                  "I consent to my information being used for mentorship matching"
                )}
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorSignupForm;
