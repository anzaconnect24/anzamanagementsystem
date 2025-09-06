import { useTranslation } from "../locales";

const InvestorSignupForm = ({
  sectors = [],
  formValues = {},
  setFormValues = () => {},
}) => {
  const { t } = useTranslation();
  const focusOptions = [
    {
      value: "Early-Stage Startups",
      key: "investor.focus.earlyStage",
      fallback: "Early-Stage Startups",
    },
    {
      value: "Growth-Stage Businesses",
      key: "investor.focus.growthStage",
      fallback: "Growth-Stage Businesses",
    },
    {
      value: "Impact Investing",
      key: "investor.focus.impactInvesting",
      fallback: "Impact Investing",
    },
    {
      value: "Climate & Sustainability",
      key: "investor.focus.climateSustainability",
      fallback: "Climate & Sustainability",
    },
    {
      value: "Fintech & Digital Solutions",
      key: "investor.focus.fintechDigital",
      fallback: "Fintech & Digital Solutions",
    },
    {
      value: "Agriculture & Agribusiness",
      key: "investor.focus.agricultureAgribusiness",
      fallback: "Agriculture & Agribusiness",
    },
    {
      value: "Manufacturing & Supply Chain",
      key: "investor.focus.manufacturingSupplyChain",
      fallback: "Manufacturing & Supply Chain",
    },
  ];
  const typeOptions = [
    { value: "equity", key: "investor.type.equity", fallback: "Equity" },
    {
      value: "debt financing",
      key: "investor.type.debtFinancing",
      fallback: "Debt Financing",
    },
    {
      value: "convertible notes",
      key: "investor.type.convertibleNotes",
      fallback: "Convertible Notes",
    },
    { value: "grants", key: "investor.type.grants", fallback: "Grants" },
  ];
  const ticketSizeOptions = [
    { value: "<$50,000", key: "investor.size.lt50k", fallback: "<$50,000" },
    {
      value: "$50,000 - $100,000",
      key: "investor.size.50to100k",
      fallback: "$50,000 - $100,000",
    },
    {
      value: "$100,000 - $500,000",
      key: "investor.size.100to500k",
      fallback: "$100,000 - $500,000",
    },
    {
      value: "$500,000 - $1M",
      key: "investor.size.500kTo1m",
      fallback: "$500,000 - $1M",
    },
    { value: "$1M+", key: "investor.size.above1m", fallback: "$1M+" },
  ];
  return (
    <div>
      <div className="space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-2">
          {/* Personal & Contact Information */}
          <div>
            <label
              className="mb-2.5 block font-medium text-black
dark:text-white"
            >
              {t("investor.companyName", "Company Name")}
            </label>
            <input
              name="company"
              required
              className="form-style"
              placeholder={t("investor.enterCompanyName", "Your company name")}
              type="text"
            />
          </div>
          <div>
            <label
              className="mb-2.5 block font-medium text-black
dark:text-white"
            >
              {t("business.location", "Location")}
            </label>
            <input
              name="location"
              required
              className="form-style"
              placeholder={t("investor.enterLocation", "Your location")}
              type="text"
            />
          </div>
          <div>
            <label
              className="mb-2.5 block font-medium text-black
dark:text-white"
            >
              {t("investor.investmentSize", "Investment Size")}
            </label>
            <input
              name="investmentSize"
              required
              className="form-style"
              placeholder={t(
                "investor.enterInvestmentSize",
                "Your investment size"
              )}
              type="text"
            />
          </div>
          <div>
            <label
              className="mb-2.5 block font-medium text-black
dark:text-white"
            >
              {t("investor.position", "Position")}
            </label>
            <input
              name="position"
              required
              className="form-style"
              placeholder={t(
                "investor.enterPosition",
                "Your position in the company"
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
            <select required name="sector" className="form-style">
              <option value={""}>
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
              {t("investor.linkedinProfile", "LinkedIn Profile")}
            </label>
            <input
              onChange={(e) => {
                const newFormValues = formValues;
                newFormValues.investorLinkedIn = e.target.value;
                setFormValues(newFormValues);
              }}
              name="investorLinkedIn"
              required
              className="form-style"
              placeholder={t(
                "investor.linkedinUrlPlaceholder",
                "Your LinkedIn profile URL"
              )}
              type="url"
            />
          </div>

          <div>
            <label
              className="mb-2.5 block font-medium text-black
dark:text-white"
            >
              {t("investor.websiteOptional", "Website (if applicable)")}
            </label>
            <input
              name="investorWebsite"
              onChange={(e) => {
                const newFormValues = formValues;
                newFormValues.investorWebsite = e.target.value;
                setFormValues(newFormValues);
              }}
              className="form-style"
              placeholder={t(
                "investor.websitePlaceholder",
                "Your company website"
              )}
              type="text"
            />
          </div>
          {/* Investment Focus */}
          <div className="col-span-2">
            <label
              className="mb-2.5 block font-medium text-black
dark:text-white"
            >
              {t("investor.investmentFocus", "Investment Focus")}
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {focusOptions.map((opt) => (
                <label key={opt.value} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="investorFocus"
                    onChange={(e) => {
                      let newFormValues = {
                        investorFocus: {},
                        ...formValues,
                      };
                      newFormValues.investorFocus[
                        Object.keys(newFormValues.investorFocus).length
                      ] = e.target.value;
                      setFormValues(newFormValues);
                    }}
                    value={opt.value}
                    className="form-checkbox"
                  />
                  <span>{t(opt.key, opt.fallback)}</span>
                </label>
              ))}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="investorFocus"
                  value="Other"
                  className="form-checkbox"
                />
                <input
                  onChange={(e) => {
                    let newFormValues = {
                      investorFocus: {},
                      ...formValues,
                    };
                    newFormValues.investorFocus[
                      Object.keys(newFormValues.investorFocus).length
                    ] = e.target.value;
                    setFormValues(newFormValues);
                  }}
                  type="text"
                  name="investorOtherFocus"
                  placeholder={t(
                    "investor.specifyOtherFocus",
                    "Specify other focus"
                  )}
                  className="form-style"
                />
              </div>
            </div>
          </div>
          {/* Investment Size */}
          <div>
            <label
              className="mb-2.5 block font-medium text-black
dark:text-white"
            >
              {t("investor.typicalInvestmentSize", "Typical Investment Size")}
            </label>
            <select
              required
              name="investorTicketSize"
              onChange={(e) => {
                let newFormValues = {
                  ...formValues,
                };
                newFormValues.investorTicketSize = e.target.value;
                setFormValues(newFormValues);
              }}
              className="form-style"
            >
              <option value="">
                {t("investor.selectInvestmentSize", "Select investment size")}
              </option>
              {ticketSizeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(opt.key, opt.fallback)}
                </option>
              ))}
            </select>
          </div>
          {/* Investment Type */}
          <div className="col-span-2">
            <label
              className="mb-2.5 block font-medium text-black
dark:text-white"
            >
              {t(
                "investor.investmentTypePreference",
                "Investment Type Preference"
              )}
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {typeOptions.map((opt) => (
                <label key={opt.value} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      let newFormValues = {
                        ...formValues,
                      };
                      newFormValues.investorStructure[
                        Object.keys(newFormValues.investorStructure).length
                      ] = e.target.value;
                      setFormValues(newFormValues);
                    }}
                    name="investorStructure"
                    value={opt.value}
                    className="form-checkbox"
                  />
                  <span>{t(opt.key, opt.fallback)}</span>
                </label>
              ))}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="investorStructure"
                  value="other"
                  className="form-checkbox"
                />
                <input
                  onChange={(e) => {
                    let newFormValues = {
                      ...formValues,
                    };
                    newFormValues.investorStructure[
                      Object.keys(newFormValues.investorStructure).length
                    ] = e.target.value;
                    setFormValues(newFormValues);
                  }}
                  type="text"
                  name="investorOtherStructure"
                  placeholder={t(
                    "investor.specifyOtherType",
                    "Specify other type"
                  )}
                  className="form-style"
                />
              </div>
            </div>
          </div>
          {/* Bio & Experience */}
          <div className="col-span-2">
            <label
              className="mb-2.5 block font-medium text-black
dark:text-white"
            >
              {t("investor.briefBio", "Brief Bio")}
            </label>
            <textarea
              required
              name="investorBio"
              onChange={(e) => {
                const newFormValues = formValues;
                newFormValues.investorBio = e.target.value;
                setFormValues(newFormValues);
              }}
              className="form-style"
              placeholder={t(
                "investor.briefBioPlaceholder",
                "Tell us about yourself & investment background"
              )}
              rows="4"
            />
          </div>
          <div className="col-span-2">
            <label
              className="mb-2.5 block font-medium text-black
dark:text-white"
            >
              {t("investor.notableInvestments", "Notable Investments")}
            </label>
            <textarea
              name="investorNotableInvestments"
              onChange={(e) => {
                const newFormValues = formValues;
                newFormValues.investorNotableInvestments = e.target.value;
                setFormValues(newFormValues);
              }}
              className="form-style"
              placeholder={t(
                "investor.notableInvestmentsPlaceholder",
                "List your notable investments (if applicable)"
              )}
              rows="4"
            />
          </div>
          <div className="col-span-2">
            <label
              className="mb-2.5 block font-medium text-black
dark:text-white"
            >
              {t("investor.seeking", "Seeking")}
            </label>
            <textarea
              name="seeking"
              required
              className="form-style"
              placeholder={t(
                "investor.seekingPlaceholder",
                "What are you seeking"
              )}
              rows="4"
            />
          </div>
          {/* Mentoring Preference */}
          <div className="col-span-2">
            <label
              className="mb-2.5 block font-medium text-black
dark:text-white"
            >
              {t(
                "investor.mentoringPreference",
                "Preferred Mentoring or Advisory Role?"
              )}
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  required
                  name="investorMentoringPreference"
                  value="true"
                  className="form-radio"
                />
                <span>
                  {t(
                    "investor.mentoringYes",
                    "Yes, I am open to mentoring startups"
                  )}
                </span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  required
                  name="investorMentoringPreference"
                  value="false"
                  className="form-radio"
                />
                <span>
                  {t(
                    "investor.mentoringNo",
                    "No, I am only interested in investing"
                  )}
                </span>
              </label>
            </div>
          </div>
          {/* Supporting Documents */}
          <div className="col-span-2">
            <label
              className="mb-2.5 block font-medium text-black
dark:text-white"
            >
              {t(
                "investor.uploadPortfolioOptional",
                "Upload Investment Portfolio (Optional)"
              )}
            </label>
            <input
              type="file"
              onChange={(e) => {
                const newFormValues = formValues;
                newFormValues.investorPortfolio = e.target.files[0];
                setFormValues(newFormValues);
              }}
              name="investorPortfolio"
              className="form-style"
              accept=".pdf,.doc,.docx"
            />
          </div>
          {/* Agreement & Consent */}
          <div className="col-span-2 space-y-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="investorContactConsent"
                required
                className="form-checkbox"
              />
              <span>
                {t(
                  "investor.contactConsent",
                  "I agree to be contacted regarding investment opportunities"
                )}
              </span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="investorMatchingConsent"
                required
                className="form-checkbox"
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
      </div>
    </div>
  );
};

export default InvestorSignupForm;
