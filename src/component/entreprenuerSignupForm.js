import { useTranslation } from "../locales";
import { useState, useEffect } from "react";
import { getPrograms } from "../controllers/program_controller";

const EntrepreneurSignupForm = ({
  sectors = [],
  isAlumni = false,
  setisAlumni,
  currentStep = 1,
}) => {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState("");
  const [programs, setPrograms] = useState([]);
  const [loadingPrograms, setLoadingPrograms] = useState(false);

  const programCategories = [
    "Ideation",
    "Business Foundation",
    "Investment readiness",
  ];

  useEffect(() => {
    if (selectedCategory) {
      setLoadingPrograms(true);
      getPrograms(1, 100, selectedCategory).then((res) => {
        setPrograms(res.data || []);
        setLoadingPrograms(false);
      });
    } else {
      setPrograms([]);
    }
  }, [selectedCategory]);

  return (
    <div>
      {/* Step 1: Business Basic Information */}
      {currentStep === 1 && (
        <div className="space-y-2">
          <h3 className="text-xl font-semibold mb-4">
            {t("business.basicInformation", "Business Basic Information")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-2">
            <div>
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                {t("business.businessName", "Business name")}
              </label>
              <input
                required
                name="businessName"
                className="form-style"
                placeholder={t("business.companyName", "Company name")}
                type="text"
              />
            </div>
            <div>
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                {t("business.businessEmail", "Business email address")}
              </label>
              <input
                required
                name="businessEmail"
                className="form-style"
                placeholder={t(
                  "business.companyEmail",
                  "Company email address"
                )}
                type="text"
              />
            </div>
            <div>
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                {t("business.businessPhone", "Business phone number")}
              </label>
              <input
                required
                name="businessPhone"
                className="form-style"
                placeholder={t("business.companyPhone", "Company phone number")}
                type="text"
              />
            </div>
            <div>
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                {t("business.businessSector", "Business sector")}
              </label>
              <select
                required
                name="business_sector_uuid"
                className="form-style"
              >
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
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                {t("business.businessStage", "Business stage")}
              </label>
              <select required name="stage" className="form-style">
                <option>
                  {t("business.selectBusinessStage", "Select business stage")}
                </option>
                <option value="Startup">
                  {t("business.startup", "Startup")}
                </option>
                <option value="Growth stage">
                  {t("business.growthStage", "Growth stage")}
                </option>
                <option value="Expansion stage">
                  {t("business.expansionStage", "Expansion stage")}
                </option>
                <option value="Maturity stage">
                  {t("business.maturityStage", "Maturity stage")}
                </option>
              </select>
            </div>
            <div>
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                {t("business.businessLocation", "Business Location")}
              </label>
              <select required name="businessLocation" className="form-style">
                <option value="">
                  {t("business.selectRegion", "Select Region")}
                </option>
                <option value="Arusha">Arusha</option>
                <option value="Dar es Salaam">Dar es Salaam</option>
                <option value="Dodoma">Dodoma</option>
                <option value="Geita">Geita</option>
                <option value="Iringa">Iringa</option>
                <option value="Kagera">Kagera</option>
                <option value="Katavi">Katavi</option>
                <option value="Kigoma">Kigoma</option>
                <option value="Kilimanjaro">Kilimanjaro</option>
                <option value="Lindi">Lindi</option>
                <option value="Manyara">Manyara</option>
                <option value="Mara">Mara</option>
                <option value="Mbeya">Mbeya</option>
                <option value="Mjini Magharibi">Mjini Magharibi</option>
                <option value="Morogoro">Morogoro</option>
                <option value="Mtwara">Mtwara</option>
                <option value="Mwanza">Mwanza</option>
                <option value="Njombe">Njombe</option>
                <option value="Pemba North">Pemba North</option>
                <option value="Pemba South">Pemba South</option>
                <option value="Pwani">Pwani</option>
                <option value="Rukwa">Rukwa</option>
                <option value="Ruvuma">Ruvuma</option>
                <option value="Shinyanga">Shinyanga</option>
                <option value="Simiyu">Simiyu</option>
                <option value="Singida">Singida</option>
                <option value="Songwe">Songwe</option>
                <option value="Tabora">Tabora</option>
                <option value="Tanga">Tanga</option>
                <option value="Unguja North">Unguja North</option>
                <option value="Unguja South">Unguja South</option>
              </select>
            </div>
            <div>
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                {t("business.registrationStatus", "Registration status")}
              </label>
              <select required name="registration" className="form-style">
                <option>
                  {t(
                    "business.selectRegistrationStatus",
                    "Registration status"
                  )}
                </option>
                <option value="Registered with BRELA">
                  {t("business.registeredWithBRELA", "Registered with BRELA")}
                </option>
                <option value="Registered with TIN only">
                  {t(
                    "business.registeredWithTINOnly",
                    "Registered with TIN only"
                  )}
                </option>
                <option value="Have BRELA and TIN">
                  {t("business.haveBRELAAndTIN", "Have BRELA and TIN")}
                </option>
              </select>
            </div>
            <div>
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                {t(
                  "business.numberOfTeamMembers",
                  "Number of people in your team"
                )}
              </label>
              <input
                required
                name="team"
                className="form-style"
                placeholder={t(
                  "business.enterNumberOfTeamMembers",
                  "Enter number of team members"
                )}
                type="number"
              />
            </div>
            <div>
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                {t("business.annualRevenue", "Annual Revenue")}
              </label>
              <input
                required
                name="revenue"
                className="form-style"
                placeholder={t(
                  "business.enterAnnualRevenue",
                  "Enter annual revenue"
                )}
                type="number"
              />
            </div>
            <div>
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                {t("business.numberOfCustomers", "Number of Customers")}
              </label>
              <input
                required
                name="customerCount"
                className="form-style"
                placeholder={t(
                  "business.enterNumberOfCustomers",
                  "Enter number of customers"
                )}
                type="number"
              />
            </div>
            <div>
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                {t("business.website", "Website")}
              </label>
              <input
                name="websiteLink"
                className="form-style"
                placeholder={t(
                  "business.enterWebsiteLink",
                  "Enter website link"
                )}
                type="text"
              />
            </div>
            <div>
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                {t("business.instagramLink", "Instagram Link")}
              </label>
              <input
                name="instagramLink"
                className="form-style"
                placeholder={t(
                  "business.pasteInstagramLink",
                  "Paste instagram Link"
                )}
                type="text"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                {t("business.businessBio", "Short Business Bio/Profile")}
              </label>
              <textarea
                required
                name="businessBio"
                className="form-style"
                placeholder={t(
                  "business.briefDescription",
                  "Brief description of your business"
                )}
                rows="3"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Business Profile */}
      {currentStep === 2 && (
        <div className="space-y-2">
          <h3 className="text-xl font-semibold mb-4">
            {t("business.businessProfile", "Business Profile")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-2">
            <div>
              <label
                className="mb-2.5 block font-medium text-black
dark:text-white"
              >
                {t(
                  "business.sustainableDevelopmentGoals",
                  "Select Sustainable Development Goals"
                )}
              </label>
              <select
                onChange={(e) => {
                  // alert(e.target.value)
                  // setisAlumni(e.target.value == "true"?true:false)
                }}
                required
                name="sdg"
                className="form-style"
              >
                {[
                  { key: "noPoverty", value: "No Poverty" },
                  { key: "zeroHunger", value: "Zero Hunger" },
                  {
                    key: "goodHealthWellBeing",
                    value: "Good Health and Well-being",
                  },
                  { key: "qualityEducation", value: "Quality Education" },
                  { key: "genderEquality", value: "Gender Equality" },
                  {
                    key: "cleanWaterSanitation",
                    value: "Clean Water and Sanitation",
                  },
                  {
                    key: "affordableCleanEnergy",
                    value: "Affordable and Clean Energy",
                  },
                  {
                    key: "decentWorkEconomicGrowth",
                    value: "Decent Work and Economic Growth",
                  },
                  {
                    key: "industryInnovationInfrastructure",
                    value: "Industry, Innovation, and Infrastructure",
                  },
                  { key: "reducedInequalities", value: "Reduced Inequalities" },
                  {
                    key: "sustainableCitiesCommunities",
                    value: "Sustainable Cities and Communities",
                  },
                  {
                    key: "responsibleConsumptionProduction",
                    value: "Responsible Consumption and Production",
                  },
                  { key: "climateAction", value: "Climate Action" },
                  { key: "lifeBelowWater", value: "Life Below Water" },
                  { key: "lifeOnLand", value: "Life on Land" },
                  {
                    key: "peaceJusticeStrongInstitutions",
                    value: "Peace, Justice, and Strong Institutions",
                  },
                  {
                    key: "partnershipsForGoals",
                    value: "Partnerships for the Goals",
                  },
                ].map((item, index) => (
                  <option key={index} value={item.value}>
                    {t(`business.sdgGoals.${item.key}`, item.value)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                className="mb-2.5 block font-medium text-black
dark:text-white"
              >
                {t("business.areYouAnAlumni", "Are you an Anza alumni?")}
              </label>
              <select
                onChange={(e) => {
                  // alert(e.target.value)
                  setisAlumni &&
                    setisAlumni(e.target.value == "true" ? true : false);
                }}
                required
                name="isAlumni"
                className="form-style"
              >
                <option value={false}>{t("common.no", "No")}</option>
                <option value={true}>{t("common.yes", "Yes")}</option>
              </select>
            </div>
            {isAlumni && (
              <>
                <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    {t(
                      "business.selectProgramCategory",
                      "Select Program Category"
                    )}
                  </label>
                  <select
                    required
                    name="programCategory"
                    className="form-style"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="">
                      {t("business.selectCategory", "Select category")}
                    </option>
                    {programCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedCategory && (
                  <div>
                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                      {t(
                        "business.whatProgramDidYouComplete",
                        "What program did you complete?"
                      )}
                    </label>
                    <select
                      required
                      name="completedProgram"
                      className="form-style"
                      disabled={loadingPrograms}
                    >
                      <option value="">
                        {loadingPrograms
                          ? t("common.loading", "Loading...")
                          : t("business.selectProgram", "Select program")}
                      </option>
                      {programs.map((program) => (
                        <option key={program.uuid} value={program.uuid}>
                          {program.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}
            <div className="md:col-span-2">
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                {t("business.targetMarket", "Target Market")}
              </label>
              <textarea
                required
                name="targetMarket"
                className="form-style"
                placeholder={t(
                  "business.describeYourTargetMarket",
                  "Describe your target market and audience"
                )}
                rows="3"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                {t("business.whatIsYourTraction", "What is your traction?")}
              </label>
              <textarea
                required
                name="traction"
                className="form-style"
                placeholder={t(
                  "business.tractionPlaceholder",
                  "Describe your traction"
                )}
                rows="3"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                {t(
                  "business.whatProblemsDoesYourBusinessSolve",
                  "What problems does your business solve?"
                )}
              </label>
              <textarea
                required
                name="problem"
                className="form-style"
                placeholder={t(
                  "business.whatProblemsDoesYourBusinessSolve",
                  "What problems does your business solve?"
                )}
                rows="3"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                {t(
                  "business.whatSolutionDoesYourBusinessProvide",
                  "What solution does your business provide?"
                )}
              </label>
              <textarea
                required
                name="solution"
                className="form-style"
                placeholder={t(
                  "business.whatSolutionDoesYourBusinessProvide",
                  "What solution does your business provide?"
                )}
                rows="3"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                {t("business.businessImpact", "Current Business Impact")}
              </label>
              <textarea
                required
                name="businessImpact"
                className="form-style"
                placeholder={t(
                  "business.describeYourCurrentBusinessImpact",
                  "Describe your current business impact"
                )}
                rows="3"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                {t(
                  "business.futureMilestonesAndGrowthPlans",
                  "Future Milestones & Growth Plans"
                )}
              </label>
              <textarea
                required
                name="growthPlans"
                className="form-style"
                placeholder={t(
                  "business.describeYourFutureMilestones",
                  "Describe your future milestones and growth plans"
                )}
                rows="3"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                {t(
                  "business.currentFundraisingNeeds",
                  "Current Fundraising Needs"
                )}
              </label>
              <textarea
                required
                name="fundraisingNeeds"
                className="form-style"
                placeholder={t(
                  "business.describeYourCurrentFundraisingNeeds",
                  "Describe your current fundraising needs"
                )}
                rows="3"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EntrepreneurSignupForm;
