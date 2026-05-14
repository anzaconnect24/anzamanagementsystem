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

  const inputClass =
    "h-12 w-full rounded-md border border-gray-200 bg-gray-50 px-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

  const textareaClass =
    "w-full rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

  const labelClass = "mb-2 block text-sm font-semibold text-gray-800";

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
    <div className="w-full">
      {currentStep === 1 && (
        <div className="space-y-5">
          <div>
            <label className={labelClass}>
              {t("business.businessName", "Business name")} *
            </label>
            <input
              required
              name="businessName"
              className={inputClass}
              placeholder={t("business.companyName", "Company name")}
              type="text"
            />
          </div>

          <div>
            <label className={labelClass}>
              {t("business.businessEmail", "Business email address")} *
            </label>
            <input
              required
              name="businessEmail"
              className={inputClass}
              placeholder={t("business.companyEmail", "Company email address")}
              type="email"
            />
          </div>

          <div>
            <label className={labelClass}>
              {t("business.businessPhone", "Business phone number")} *
            </label>
            <input
              required
              name="businessPhone"
              className={inputClass}
              placeholder={t("business.companyPhone", "Company phone number")}
              type="text"
            />
          </div>

          <div>
            <label className={labelClass}>
              {t("business.businessSector", "Business sector")} *
            </label>
            <select required name="business_sector_uuid" className={inputClass}>
              <option value="">
                {t("business.selectBusinessSector", "Select business sector")}
              </option>

              {sectors.map((item) => (
                <option key={item.id || item.uuid} value={item.uuid}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>
              {t("business.businessStage", "Business stage")} *
            </label>
            <select required name="stage" className={inputClass}>
              <option value="">
                {t("business.selectBusinessStage", "Select business stage")}
              </option>
              <option value="Startup">{t("business.startup", "Startup")}</option>
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
            <label className={labelClass}>
              {t("business.businessLocation", "Business Location")} *
            </label>
            <select required name="businessLocation" className={inputClass}>
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
        </div>
      )}

      {currentStep === 2 && (
        <div className="space-y-5">
          <div>
            <label className={labelClass}>
              {t(
                "business.sustainableDevelopmentGoals",
                "Select Sustainable Development Goals"
              )}{" "}
              *
            </label>
            <select required name="sdg" className={inputClass}>
              <option value="">{t("business.selectSdg", "Select SDG")}</option>

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
              ].map((item) => (
                <option key={item.key} value={item.value}>
                  {t(`business.sdgGoals.${item.key}`, item.value)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>
              {t("business.areYouAnAlumni", "Are you an Anza alumni?")} *
            </label>
            <select
              onChange={(e) => {
                setisAlumni &&
                  setisAlumni(e.target.value === "true" ? true : false);
              }}
              required
              name="isAlumni"
              className={inputClass}
              defaultValue={String(isAlumni)}
            >
              <option value="false">{t("common.no", "No")}</option>
              <option value="true">{t("common.yes", "Yes")}</option>
            </select>
          </div>

          {isAlumni && (
            <>
              <div>
                <label className={labelClass}>
                  {t(
                    "business.selectProgramCategory",
                    "Select Program Category"
                  )}{" "}
                  *
                </label>
                <select
                  required
                  name="programCategory"
                  className={inputClass}
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
                  <label className={labelClass}>
                    {t(
                      "business.whatProgramDidYouComplete",
                      "What program did you complete?"
                    )}{" "}
                    *
                  </label>
                  <select
                    required
                    name="completedProgram"
                    className={inputClass}
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

          <div>
            <label className={labelClass}>
              {t(
                "business.whatProblemsDoesYourBusinessSolve",
                "What problem does your business solve?"
              )}{" "}
              *
            </label>
            <textarea
              required
              name="problem"
              className={`${textareaClass} min-h-[110px]`}
              placeholder={t(
                "business.problemPlaceholder",
                "Clearly describe the problem your business is solving"
              )}
              rows="3"
            />
          </div>

          <div>
            <label className={labelClass}>
              {t("business.whatIsYourTraction", "What is your traction?")} *
            </label>
            <textarea
              required
              name="traction"
              className={`${textareaClass} min-h-[110px]`}
              placeholder={t(
                "business.tractionPlaceholder",
                "Describe your traction"
              )}
              rows="3"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EntrepreneurSignupForm;