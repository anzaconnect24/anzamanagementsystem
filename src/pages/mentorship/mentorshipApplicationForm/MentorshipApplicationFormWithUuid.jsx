import Breadcrumb from "../../../component/Breadcrumb";
import Spinner from "../../../components/spinner";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { sendMentorshipApplication } from "../../../controllers/mentorship_applications_controllers";
import toast from "react-hot-toast";
import { useParams } from "react-router-dom";
import { useTranslation } from "../../../locales";

const MentorshipApplicationFormWithUuid = () => {
  const { uuid: mentor_uuid } = useParams();
  const navigate = useNavigate();
  const { t, language, isSwahili } = useTranslation();
  const [loading, setloading] = useState(false);
  const [formValues, setFormValues] = useState({});
  return (
    <div>
      <Breadcrumb
        pageName={t("mentorshipApplication.title", "Mentorship Application")}
        prevLink={""}
        prevPage={t("mentorshipApplication.back", "Back")}
      />
      {/* {t("common.dashboard")} */}
      <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="py-6 px-4 md:px-6 xl:px-7.5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setloading(true);
              const data = {
                mentor_uuid,
                challenges: e.target.challenges.value,
                mentorshipMode: e.target.mentorshipMode.value,
                availability: e.target.availability.value,
                mentorshipAreas: formValues.mentorshipAreas,
              };
              sendMentorshipApplication(data).then(() => {
                setloading(false);
                toast.success(
                  t(
                    "mentorshipApplication.applicationSentSuccess",
                    "Application sent successfully"
                  )
                );
                navigate(-1); // Go back to previous page
              });
            }}
          >
            <div className="grid grid-cols-2 gap-x-3 gap-y-3">
              <div className="col-span-2">
                <label
                  className="mb-2.5 block font-medium text-black
dark:text-white"
                >
                  {t(
                    "mentorshipApplication.whatAreaNeedMentorship",
                    "What area do you need mentorship in? (Select all that apply)"
                  )}
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[
                    {
                      key: "businessStrategy",
                      label: t(
                        "mentorshipApplication.businessStrategy",
                        "Business Strategy"
                      ),
                    },
                    {
                      key: "financialManagement",
                      label: t(
                        "mentorshipApplication.financialManagement",
                        "Financial Management"
                      ),
                    },
                    {
                      key: "marketingSales",
                      label: t(
                        "mentorshipApplication.marketingSales",
                        "Marketing & Sales"
                      ),
                    },
                    {
                      key: "productDevelopment",
                      label: t(
                        "mentorshipApplication.productDevelopment",
                        "Product Development"
                      ),
                    },
                    {
                      key: "legalCompliance",
                      label: t(
                        "mentorshipApplication.legalCompliance",
                        "Legal & Compliance"
                      ),
                    },
                    {
                      key: "investmentReadiness",
                      label: t(
                        "mentorshipApplication.investmentReadiness",
                        "Investment Readiness"
                      ),
                    },
                  ].map((focus) => (
                    <label
                      key={focus.key}
                      className="flex items-center space-x-2"
                    >
                      <input
                        type="checkbox"
                        name="mentorshipAreas"
                        onChange={(e) => {
                          let newFormValues = {
                            mentorshipAreas: {},
                            ...formValues,
                          };
                          newFormValues.mentorshipAreas[
                            Object.keys(newFormValues.mentorshipAreas).length
                          ] = e.target.value;
                          setFormValues(newFormValues);
                        }}
                        value={focus.label}
                        className="form-checkbox"
                      />
                      <span>{focus.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  {t(
                    "mentorshipApplication.preferredMode",
                    "Preferred Mode of mentorship?"
                  )}
                </label>
                <select
                  name="mentorshipMode"
                  className="w-full rounded border-stroke"
                  placeholder=""
                >
                  <option>
                    {t(
                      "mentorshipApplication.selectMentorshipMode",
                      "Select mentorship mode"
                    )}
                  </option>
                  <option value="In-Person">
                    {t("mentorshipApplication.inPerson", "In-Person")}
                  </option>
                  <option value="Virtual (Zoom, Google Meet, etc.)">
                    {t(
                      "mentorshipApplication.virtual",
                      "Virtual (Zoom, Google Meet, etc.)"
                    )}
                  </option>
                  <option value="No preference">
                    {t("mentorshipApplication.noPreference", "No preference")}
                  </option>
                </select>
              </div>
            </div>
            <div className="mt-3">
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                {t(
                  "mentorshipApplication.challengesDescription",
                  "Briefly describe the specific challenge or support you need:"
                )}
              </label>
              <textarea
                name="challenges"
                placeholder={t(
                  "mentorshipApplication.challengesPlaceholder",
                  "Write here..."
                )}
                className="border-stroke w-full rounded"
              ></textarea>
            </div>
            <div className="mt-3">
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                {t(
                  "mentorshipApplication.availability",
                  "Availability (Days/Times)"
                )}
              </label>
              <textarea
                name="availability"
                placeholder={t(
                  "mentorshipApplication.availabilityPlaceholder",
                  "Write here..."
                )}
                className="border-stroke w-full rounded"
              ></textarea>
            </div>
            <button
              type="submit"
              className="py-2 px-3 mt-4 rounded flex justify-center bg-primary text-white"
            >
              {loading ? (
                <Spinner />
              ) : (
                t("mentorshipApplication.sendApplication", "Send Application")
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MentorshipApplicationFormWithUuid;
