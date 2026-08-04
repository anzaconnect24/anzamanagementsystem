import { useContext, useEffect, useState } from "react";
import { getSectors } from "../controllers/sector_controller";
import {
  getBusiness,
  updateBusiness,
} from "../controllers/business_controller";
import { UserContext } from "@/layouts/DashboardLayout";
import Loader from "@/components/common/Loader";
import Spinner from "../components/spinner";
import { toast } from "react-hot-toast";
import { useTranslation } from "../locales";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default marker icons (bundlers strip the relative asset paths).
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const DEFAULT_CENTER = [-6.369, 34.8888]; // Tanzania

const MapClickHandler = ({ onSelect }) => {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const BusinessInformation = () => {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [loading, setloading] = useState(false);
  const [sectors, setSectors] = useState([]);
  const [business, setBusiness] = useState(null);
  const { userDetails } = useContext(UserContext);
  const [uploadingDocument, setuploadingDocument] = useState(false);
  const [loadingData, setloadingData] = useState(true);
  const [updatingInvestmentDetails, setupdatingInvestmentDetails] =
    useState(false);
  const [selectedOption, setselectedOption] = useState(0);
  const [coords, setCoords] = useState({ lat: "", lng: "" });

  useEffect(() => {
    getSectors().then((data) => {
      if (data) {
        setSectors(data);
      }
    });
  }, []);

  useEffect(() => {
    getBusiness(userDetails.Business.uuid).then((data) => {
      setBusiness(data);
      setCoords({
        lat: data?.latitude != null ? String(data.latitude) : "",
        lng: data?.longitude != null ? String(data.longitude) : "",
      });
      setloadingData(false);
    });
  }, [refresh]);

  const lat = Number(coords.lat);
  const lng = Number(coords.lng);
  const hasCoords =
    coords.lat !== "" && coords.lng !== "" && Number.isFinite(lat) && Number.isFinite(lng);
  return loadingData ? (
    <Loader />
  ) : (
    <div>
      <section
        className="relative mb-6 overflow-hidden rounded-2xl bg-slate-950 px-7 py-8 text-white shadow-sm"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.65) 45%, rgba(0,0,0,0.2) 100%), url('/images/mentor_hero.svg')",
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-[#F59E0B]" />
            Business Profile
          </div>
          <h1 className="mt-5 text-3xl font-black tracking-tight md:text-4xl">
            {business?.name || "Business Profile"}
          </h1>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { label: "Customers", value: business?.numberOfCustomers },
              { label: "Location", value: business?.location },
              {
                label: "Industry",
                value: business?.BusinessSector?.name || business?.sector,
              },
              { label: "Stage", value: business?.stage },
              { label: "Revenue", value: business?.revenue },
            ].map((tile) => (
              <div
                key={tile.label}
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur"
              >
                <p className="text-xs font-medium text-white/60">{tile.label}</p>
                <p className="mt-1 truncate text-lg font-black text-white">
                  {tile.value || "N/A"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const businessData = {
            name: e.target.businessName.value,
            email: e.target.businessEmail.value,
            phone: e.target.businessPhone.value,
            problem: e.target.problem.value,
            solution: e.target.solution.value,
            traction: e.target.traction.value,
            registration: e.target.registration.value,
            stage: e.target.stage.value,
            business_sector_uuid: e.target.business_sector_uuid.value,
            team: e.target.team.value,
            sdg: e.target.sdg.value,
            isAlumni: e.target.isAlumni.value === "true",
            completedProgram: e.target.completedProgram
              ? e.target.completedProgram.value
              : null,
            description: e.target.businessBio.value,
            otherIndustry: e.target.otherIndustry
              ? e.target.otherIndustry.value
              : "",
            numberOfCustomers: e.target.customerCount.value,
            market: e.target.targetMarket.value,
            location: e.target.businessLocation.value,
            country: e.target.country.value,
            latitude: coords.lat || null,
            longitude: coords.lng || null,
            impact: e.target.businessImpact.value,
            growthPlan: e.target.growthPlans.value,
            fundraisingNeeds: e.target.fundraisingNeeds.value,
            industry: e.target.industry ? e.target.industry.value : "",
            revenue: e.target.revenue.value,
          };

          try {
            setloading(true);
            const data = await updateBusiness(businessData, business.uuid);
            setRefresh((r) => r + 1);
            toast.success(
              t(
                "business.updateSuccess",
                "Business details are updated successfully!"
              )
            );
          } catch (error) {
            console.error("Error updating business details:", error);
            toast.error(
              t("errors.updateFailed", "Failed to update details: ") +
                (error?.message || t("errors.unknown", "Unknown error"))
            );
          } finally {
            setloading(false);
          }
        }}
      >
        <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="py-6 px-4 md:px-6 xl:px-7.5">
            <h4 className="text-xl font-semibold text-black dark:text-white pb-6">
              {t("business.businessInformation", "Business Information")}
            </h4>
            <div className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-2">
                <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    {t("business.businessName", "Business name")}
                  </label>
                  <input
                    defaultValue={business.name}
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
                    defaultValue={business.email}
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
                    defaultValue={business.phone}
                    name="businessPhone"
                    className="form-style"
                    placeholder={t(
                      "business.companyPhone",
                      "Company phone number"
                    )}
                    type="text"
                  />
                </div>
                <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    {t(
                      "business.numberOfTeamMembers",
                      "Number of people in your team"
                    )}
                  </label>
                  <input
                    defaultValue={business.team}
                    name="team"
                    className="form-style"
                    placeholder={t(
                      "business.enterNumberOfTeamMembers",
                      "Enter number of team members"
                    )}
                    type="text"
                  />
                </div>
                <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    {t("business.registrationStatus", "Registration status")}
                  </label>
                  <select
                    defaultValue={business.registration}
                    name="registration"
                    className="form-style"
                  >
                    <option>
                      {t(
                        "business.selectRegistrationStatus",
                        "Registration status"
                      )}
                    </option>
                    <option value="Registered with BRELA">
                      {t(
                        "business.registeredWithBRELA",
                        "Registered with BRELA"
                      )}
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
                    {t("business.businessSector", "Business sector")}
                  </label>
                  <select
                    defaultValue={business.BusinessSector?.uuid}
                    name="business_sector_uuid"
                    className="form-style"
                  >
                    <option>
                      {t(
                        "business.selectBusinessSector",
                        "Select business sector"
                      )}
                    </option>
                    {sectors.map((item) => (
                      <option key={item.id} value={item.uuid}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    {t("business.businessStage", "Business stage")}
                  </label>
                  <select
                    defaultValue={business.stage}
                    name="stage"
                    className="form-style"
                  >
                    <option>
                      {t(
                        "business.selectBusinessStage",
                        "Select business stage"
                      )}
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
                    {t(
                      "business.sustainableDevelopmentGoals",
                      "Select Sustainable Development Goals"
                    )}
                  </label>
                  <select
                    defaultValue={business.sdg}
                    name="sdg"
                    className="form-style"
                  >
                    <option>{t("business.selectSDG", "Select SDG")}</option>
                    {[
                      "No Poverty",
                      "Zero Hunger",
                      "Good Health and Well-being",
                      "Quality Education",
                      "Gender Equality",
                      "Clean Water and Sanitation",
                      "Affordable and Clean Energy",
                      "Decent Work and Economic Growth",
                      "Industry, Innovation, and Infrastructure",
                      "Reduced Inequalities",
                      "Sustainable Cities and Communities",
                      "Responsible Consumption and Production",
                      "Climate Action",
                      "Life Below Water",
                      "Life on Land",
                      "Peace, Justice, and Strong Institutions",
                      "Partnerships for the Goals",
                    ].map((item, index) => (
                      <option key={index} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    {t("business.areYouAnAlumni", "Are you an Anza alumni?")}
                  </label>
                  <select
                    defaultValue={(business.isAlumni ?? false).toString()}
                    name="isAlumni"
                    className="form-style"
                  >
                    <option value="false">{t("common.no", "No")}</option>
                    <option value="true">{t("common.yes", "Yes")}</option>
                  </select>
                </div>
                {business.isAlumni && (
                  <div>
                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                      {t(
                        "business.whatProgramDidYouComplete",
                        "What program did you complete?"
                      )}
                    </label>
                    <select
                      defaultValue={business.completedProgram}
                      name="completedProgram"
                      className="form-style"
                    >
                      <option>
                        {t("business.selectProgram", "Select program")}
                      </option>
                      <option value="Climate Launchpad">
                        Climate Launchpad
                      </option>
                      <option value="Generation Food">Generation Food</option>
                      <option value="Capacity Building to Kilwa Entrepreneurs">
                        Capacity Building to Kilwa Entrepreneurs
                      </option>
                      <option value="Female Entrepreneurs Growing Greener Economies">
                        Female Entrepreneurs Growing Greener Economies
                      </option>
                      <option value="Rapid Banana">Rapid Banana</option>
                      <option value="Restoration Factory Tanzania">
                        Restoration Factory Tanzania
                      </option>
                      <option value="Capacity Building to Entrepreneurs Focusing on Clean and Renewable Energy in Arusha">
                        Capacity Building to Entrepreneurs Focusing on Clean and
                        Renewable Energy in Arusha
                      </option>
                      <option value="Capacity Building for Entrepreneurship and Aquaculture Practices">
                        Capacity Building for Entrepreneurship and Aquaculture
                        Practices
                      </option>
                      <option value="Youth Entrepreneurship & Innovation Program">
                        Youth Entrepreneurship & Innovation Program
                      </option>
                      <option value="Regenerative Economy Accelerator Tanzania">
                        Regenerative Economy Accelerator Tanzania
                      </option>
                      <option value="Pesatech Accelerator Two">
                        Pesatech Accelerator Two
                      </option>
                      <option value="Funguo Investment Accelerator">
                        Funguo Investment Accelerator
                      </option>
                      <option value="AWCE Investment Accelerator">
                        AWCE Investment Accelerator
                      </option>
                    </select>
                  </div>
                )}
                <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    {t("business.numberOfCustomers", "Number of Customers")}
                  </label>
                  <input
                    defaultValue={business.numberOfCustomers}
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
                    {t("business.annualRevenue", "Annual Revenue")}
                  </label>
                  <input
                    defaultValue={business.revenue}
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
                    {t("business.country", "Country")}
                  </label>
                  <select
                    defaultValue={business.country || "Tanzania"}
                    name="country"
                    className="form-style"
                  >
                    <option value="Tanzania">Tanzania</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    {t("business.region", "Region")}
                  </label>
                  <select
                    defaultValue={business.location}
                    name="businessLocation"
                    className="form-style"
                  >
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

              <div>
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  {t("business.mapCoordinates", "Map Coordinates (Lat, Lng)")}
                </label>
                <input
                  className="form-style"
                  value={coords.lat && coords.lng ? `${coords.lat}, ${coords.lng}` : ""}
                  onChange={(e) => {
                    const [la, ln] = e.target.value.split(",");
                    setCoords({ lat: (la || "").trim(), lng: (ln || "").trim() });
                  }}
                  placeholder="-6.369, 34.8888"
                />
                <div className="relative mt-3 overflow-hidden rounded-lg border border-stroke">
                  <MapContainer
                    center={hasCoords ? [lat, lng] : DEFAULT_CENTER}
                    zoom={hasCoords ? 13 : 6}
                    style={{ height: "320px", width: "100%" }}
                    scrollWheelZoom={false}
                  >
                    <TileLayer
                      attribution="&copy; OpenStreetMap contributors"
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapClickHandler
                      onSelect={(la, ln) =>
                        setCoords({ lat: la.toFixed(6), lng: ln.toFixed(6) })
                      }
                    />
                    {hasCoords && (
                      <Marker
                        position={[lat, lng]}
                        draggable
                        eventHandlers={{
                          dragend: (ev) => {
                            const { lat: dla, lng: dln } = ev.target.getLatLng();
                            setCoords({ lat: dla.toFixed(6), lng: dln.toFixed(6) });
                          },
                        }}
                      />
                    )}
                  </MapContainer>
                </div>
              </div>

              <div>
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  {t("business.businessBio", "Short Business Bio/Profile")}
                </label>
                <textarea
                  defaultValue={business.description}
                  name="businessBio"
                  className="form-style"
                  placeholder={t(
                    "business.briefDescription",
                    "Brief description of your business"
                  )}
                  rows="3"
                />
              </div>
              <div>
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  {t(
                    "business.whatProblemsDoesYourBusinessSolve",
                    "What problems does your business solve?"
                  )}
                </label>
                <textarea
                  defaultValue={business.problem}
                  name="problem"
                  className="form-style"
                  placeholder={t(
                    "business.whatProblemsDoesYourBusinessSolve",
                    "What problems does your business solve?"
                  )}
                />
              </div>
              <div>
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  {t(
                    "business.whatSolutionDoesYourBusinessProvide",
                    "What solution does your business provide?"
                  )}
                </label>
                <textarea
                  defaultValue={business.solution}
                  name="solution"
                  className="form-style"
                  placeholder={t(
                    "business.whatSolutionDoesYourBusinessProvide",
                    "What solution does your business provide?"
                  )}
                />
              </div>
              <div>
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  {t("business.whatIsYourTraction", "What is your traction?")}
                </label>
                <textarea
                  defaultValue={business.traction}
                  name="traction"
                  className="form-style"
                  placeholder={t(
                    "business.tractionPlaceholder",
                    "What is your commercial traction?"
                  )}
                />
              </div>
              <div>
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  {t("business.targetMarket", "Target Market")}
                </label>
                <textarea
                  defaultValue={business.market}
                  name="targetMarket"
                  className="form-style"
                  placeholder={t(
                    "business.describeYourTargetMarket",
                    "Describe your target market and audience"
                  )}
                  rows="3"
                />
              </div>
              <div>
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  {t("business.businessImpact", "Current Business Impact")}
                </label>
                <textarea
                  defaultValue={business.impact}
                  name="businessImpact"
                  className="form-style"
                  placeholder={t(
                    "business.describeYourCurrentBusinessImpact",
                    "Describe your current business impact"
                  )}
                  rows="3"
                />
              </div>
              <div>
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  {t(
                    "business.futureMilestonesAndGrowthPlans",
                    "Future Milestones & Growth Plans"
                  )}
                </label>
                <textarea
                  defaultValue={business.growthPlan}
                  name="growthPlans"
                  className="form-style"
                  placeholder={t(
                    "business.describeYourFutureMilestones",
                    "Describe your future milestones and growth plans"
                  )}
                  rows="3"
                />
              </div>
              <div>
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  {t(
                    "business.currentFundraisingNeeds",
                    "Current Fundraising Needs"
                  )}
                </label>
                <textarea
                  defaultValue={business.fundraisingNeeds}
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
            <div className="flex pt-8">
              <button
                type="submit"
                className="py-3 px-4 flex justify-center bg-primary cursor-pointer text-white rounded hover:opacity-95"
              >
                <div>
                  {loading ? (
                    <Spinner />
                  ) : (
                    t("common.updateDetails", "Update details")
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>
      </form>
      <div className="rounded-lg border mt-10 border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="py-6 px-4 md:px-6 xl:px-7.5">
          <h4 className="text-xl font-semibold text-black dark:text-white pb-6">
            {t("business.aboutInvestment", "About Investment")}
          </h4>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const data = {
                lookingForInvestment: e.target.lookingForInvestment.checked,
                investmentAmount: e.target.investmentAmount.value,
                investmentCurrency: e.target.investmentCurrency.value,
              };
              setupdatingInvestmentDetails(true);
              updateBusiness(data, business.uuid).then((data) => {
                setRefresh(refresh + 1);
                setupdatingInvestmentDetails(false);
                toast.success(
                  t("common.updateSuccess", "Updated successfully!")
                );
              });
            }}
            className="grid grid-cols-4 gap-x-4 items-end"
          >
            <div>
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                {t(
                  "business.lookingForInvestment",
                  "Are you looking for an investment?"
                )}
              </label>
              <input
                name="lookingForInvestment"
                defaultChecked={business.lookingForInvestment}
                className="h-10 w-10 rounded"
                type="checkbox"
              />
            </div>
            <div>
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                {t("business.investmentAmount", "Amount you need?")}
              </label>
              <input
                name="investmentAmount"
                defaultValue={business.investmentAmount}
                type="number"
                className="border-stroke w-full rounded"
                placeholder={t("business.amount", "Amount")}
              />
            </div>
            <div>
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                {t("business.selectCurrency", "Select currency")}
              </label>
              <select
                name="investmentCurrency"
                defaultValue={business.investmentCurrency}
                className="border-stroke w-full rounded"
              >
                <option>
                  {t("business.selectCurrency", "Select currency")}
                </option>
                <option value="TSH">TSH</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <div>
              <button
                type="submit"
                className="py-3 px-4 flex justify-center bg-primary cursor-pointer text-white rounded hover:opacity-95"
              >
                <div>
                  {updatingInvestmentDetails ? (
                    <Spinner />
                  ) : (
                    t("common.update", "Update")
                  )}
                </div>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BusinessInformation;
