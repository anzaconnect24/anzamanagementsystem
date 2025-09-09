import Spinner from "@/components/spinner";
import { useState, useEffect } from "react";
import { editMentorProfile } from "../controllers/mentor_profile_controller";
import { getSectors } from "../controllers/sector_controller";
import toast from "react-hot-toast";

const UpdateMentorProfile = ({ user, refresh, setRefresh }) => {
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formValues, setFormValues] = useState({
    mentorLinkedIn: user.MentorProfile?.linkedinURL || "",
    mentorPosition: user.MentorProfile?.position || "",
    mentorOrganisation: user.MentorProfile?.organisation || "",
    mentorExpertise: Object.values(user.MentorProfile?.areasOfExperties || {}),
    mentorAvailability: user.MentorProfile?.mentorAvailability || "",
    mentorHours: user.MentorProfile?.mentorHours || "",
    mentorFormat: Object.values(user.MentorProfile?.mentoringFormat || {}),
    mentorDescription: user.MentorProfile?.description || "",
    mentorshipFocus: user.MentorProfile?.mentorshipFocus || "",
    smeFocus: user.MentorProfile?.smeFocus || "",
  });

  useEffect(() => {
    getSectors()
      .then((data) => {
        if (data) {
          setSectors(data);
        }
      })
      .catch((error) => {
        toast.error("Failed to load sectors");
      });
  }, []);

  const handleCheckboxChange = (field, value, checked) => {
    setFormValues((prev) => {
      const updatedField = checked
        ? [...(prev[field] || []), value]
        : (prev[field] || []).filter((item) => item !== value);
      return { ...prev, [field]: updatedField };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = {
      businessSectorId: e.target.business_sector_uuid.value,
      linkedinURL: formValues.mentorLinkedIn,
      position: formValues.mentorPosition,
      organisation: formValues.mentorOrganisation,
      areasOfExperties: formValues.mentorExpertise.reduce(
        (acc, val, idx) => ({ ...acc, [idx]: val }),
        {}
      ),
      mentorAvailability: formValues.mentorAvailability,
      mentorHours: formValues.mentorHours || null,
      language: e.target.language.value,
      location: e.target.location.value,
      smeFocus: formValues.smeFocus,
      mentorshipFocus: formValues.mentorshipFocus,
      mentoringFormat: formValues.mentorFormat.reduce(
        (acc, val, idx) => ({ ...acc, [idx]: val }),
        {}
      ),
      description: formValues.mentorDescription,
    };

    try {
      await editMentorProfile(user.MentorProfile.uuid, data);
      setRefresh(refresh + 1);
      toast.success("Mentor details updated successfully!");
    } catch (error) {
      toast.error("Failed to update mentor profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="py-6 px-4 md:px-6 xl:px-7.5">
            <h4 className="text-xl font-semibold text-black dark:text-white">
              Mentor Details
            </h4>
            <div>
              <div className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-2">
                  {/* Personal Information */}
                  <div>
                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                      LinkedIn Profile
                    </label>
                    <input
                      name="mentorLinkedIn"
                      required
                      value={formValues.mentorLinkedIn}
                      onChange={(e) =>
                        setFormValues({
                          ...formValues,
                          mentorLinkedIn: e.target.value,
                        })
                      }
                      className="form-style"
                      placeholder="Your LinkedIn profile URL"
                      type="url"
                    />
                  </div>
                  <div>
                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                      Organization/Company Name
                    </label>
                    <input
                      name="mentorCompany"
                      required
                      value={formValues.mentorOrganisation}
                      onChange={(e) =>
                        setFormValues({
                          ...formValues,
                          mentorOrganisation: e.target.value,
                        })
                      }
                      className="form-style"
                      placeholder="Your organization name"
                      type="text"
                    />
                  </div>
                  <div>
                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                      Business Sector
                    </label>
                    <select
                      name="business_sector_uuid"
                      defaultValue={user.MentorProfile?.BusinessSector.id}
                      className="form-style"
                    >
                      <option value="">Select business sector</option>
                      {sectors.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                      Current Position/Title
                    </label>
                    <input
                      name="mentorPosition"
                      required
                      value={formValues.mentorPosition}
                      onChange={(e) =>
                        setFormValues({
                          ...formValues,
                          mentorPosition: e.target.value,
                        })
                      }
                      className="form-style"
                      placeholder="Your current position"
                      type="text"
                    />
                  </div>
                  <div>
                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                      Language
                    </label>
                    <select
                      name="language"
                      required
                      defaultValue={user.MentorProfile?.language || ""}
                      className="form-style"
                    >
                      <option value="">Select language</option>
                      <option value="English">English</option>
                      <option value="Swahili">Swahili</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                      Location
                    </label>
                    <input
                      name="location"
                      required
                      defaultValue={user.MentorProfile?.location || ""}
                      className="form-style"
                      placeholder="Your location"
                      type="text"
                    />
                  </div>
                  {/* Expertise & Areas of Support */}
                  <div className="col-span-2">
                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                      Select Your Areas of Expertise
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {[
                        "Business Strategy & Growth",
                        "Finance & Fundraising",
                        "Marketing & Branding",
                        "Operations & Supply Chain",
                        "Leadership & Team Development",
                        "Legal & Compliance",
                        "Impact & Sustainability",
                      ].map((expertise) => (
                        <label
                          key={expertise}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="checkbox"
                            name="mentorExpertise"
                            value={expertise}
                            checked={formValues.mentorExpertise.includes(
                              expertise
                            )}
                            onChange={(e) =>
                              handleCheckboxChange(
                                "mentorExpertise",
                                e.target.value,
                                e.target.checked
                              )
                            }
                            className="form-checkbox"
                          />
                          <span>{expertise}</span>
                        </label>
                      ))}
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="mentorExpertise"
                          value="Other"
                          checked={formValues.mentorExpertise.includes("Other")}
                          onChange={(e) =>
                            handleCheckboxChange(
                              "mentorExpertise",
                              e.target.value,
                              e.target.checked
                            )
                          }
                          className="form-checkbox"
                        />
                        <input
                          type="text"
                          name="mentorOtherExpertise"
                          placeholder="Specify other expertise"
                          disabled={
                            !formValues.mentorExpertise.includes("Other")
                          }
                          onChange={(e) =>
                            handleCheckboxChange(
                              "mentorExpertise",
                              e.target.value,
                              formValues.mentorExpertise.includes("Other")
                            )
                          }
                          className="form-style"
                        />
                      </div>
                    </div>
                  </div>
                  {/* Availability & Commitment */}
                  <div className="col-span-2">
                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                      How often can you mentor?
                    </label>
                    <div className="space-y-2">
                      {[
                        { value: "weekly", label: "Weekly" },
                        { value: "biweekly", label: "Biweekly" },
                        { value: "monthly", label: "Monthly" },
                        { value: "flexible", label: "Flexible" },
                      ].map((option) => (
                        <div
                          key={option.value}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="radio"
                            name="mentorFrequency"
                            value={option.value}
                            checked={
                              formValues.mentorAvailability === option.value
                            }
                            onChange={(e) =>
                              setFormValues({
                                ...formValues,
                                mentorAvailability: e.target.value,
                                mentorHours: "",
                              })
                            }
                            className="form-radio"
                          />
                          <span>{option.label}</span>
                          <input
                            type="number"
                            placeholder="Hours"
                            value={
                              formValues.mentorAvailability === option.value
                                ? formValues.mentorHours || ""
                                : ""
                            }
                            onChange={(e) =>
                              setFormValues({
                                ...formValues,
                                mentorHours: e.target.value,
                                mentorAvailability: option.value,
                              })
                            }
                            className="form-style w-24"
                            disabled={
                              formValues.mentorAvailability !== option.value
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Preferred Mentoring Format */}
                  <div className="col-span-2">
                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                      Preferred Mentoring Format
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {[
                        "One-on-One Sessions",
                        "Group Mentorship",
                        "Online/Virtual Mentorship",
                        "In-Person Mentorship",
                      ].map((format) => (
                        <label
                          key={format}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="checkbox"
                            name="mentorFormat"
                            value={format}
                            checked={formValues.mentorFormat.includes(format)}
                            onChange={(e) =>
                              handleCheckboxChange(
                                "mentorFormat",
                                e.target.value,
                                e.target.checked
                              )
                            }
                            className="form-checkbox"
                          />
                          <span>{format}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {/* Experience & Support */}
                  <div className="col-span-2">
                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                      Tell Us About Your Experience and How You Can Support
                      Entrepreneurs
                    </label>
                    <textarea
                      name="mentorExperience"
                      required
                      value={formValues.mentorDescription}
                      onChange={(e) =>
                        setFormValues({
                          ...formValues,
                          mentorDescription: e.target.value,
                        })
                      }
                      className="form-style"
                      placeholder="Share your experience and how you can help entrepreneurs"
                      rows="4"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                      Mentorship Focus
                    </label>
                    <textarea
                      name="mentorshipFocus"
                      required
                      value={formValues.mentorshipFocus}
                      onChange={(e) =>
                        setFormValues({
                          ...formValues,
                          mentorshipFocus: e.target.value,
                        })
                      }
                      className="form-style"
                      placeholder="Share your mentorship focus"
                      rows="4"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                      SME Focus
                    </label>
                    <textarea
                      name="smeFocus"
                      required
                      value={formValues.smeFocus}
                      onChange={(e) =>
                        setFormValues({
                          ...formValues,
                          smeFocus: e.target.value,
                        })
                      }
                      className="form-style"
                      placeholder="Share your SME Focus"
                      rows="4"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex pt-8">
              <button
                type="submit"
                disabled={loading}
                className="py-3 px-4 flex justify-center bg-primary cursor-pointer text-white rounded hover:opacity-95 disabled:opacity-50"
              >
                <div>{loading ? <Spinner /> : "Update details"}</div>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default UpdateMentorProfile;
