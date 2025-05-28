import Spinner from "@/components/spinner";
import { useState, useEffect } from "react";
import { updateInvestorProfile } from "../controllers/investor_profile_controller";
import toast from "react-hot-toast";
import { getSectors } from "../controllers/sector_controller";

const UpdateInvestorProfile = ({ user, refresh, setRefresh }) => {
  const [sectors, setSectors] = useState([
    {
      id: user.InvestorProfile.BusinessSector.id,
      uuid: user.InvestorProfile.BusinessSector.uuid,
      name: user.InvestorProfile.BusinessSector.name,
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [formValues, setFormValues] = useState({
    investorLinkedIn: user.InvestorProfile.linkedinURL || "",
    investorWebsite: user.InvestorProfile.website || "",
    investorFocus: Object.values(user.InvestorProfile.investmentFocus || {}),
    investorTicketSize: user.InvestorProfile.investmentSize || "",
    investorStructure: Object.values(user.InvestorProfile.investmentType || {}),
    investorBio: user.InvestorProfile.bio || "",
    investorNotableInvestments: user.InvestorProfile.notableInvestment || "",
    investorPortfolio: null,
  });

  useEffect(() => {
    getSectors().then((data) => {
      if (data) {
        setSectors(data);
      }
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
      role: e.target.position.value,
      company: e.target.company.value,
      sector: e.target.sector.value,
      ticketSize: e.target.investmentSize.value,
      geography: e.target.location.value,
      seeking: e.target.seeking.value,
      linkedinURL: formValues.investorLinkedIn,
      website: formValues.investorWebsite,
      investmentFocus: formValues.investorFocus.reduce(
        (acc, val, idx) => ({ ...acc, [idx]: val }),
        {}
      ),
      investmentSize: formValues.investorTicketSize,
      investmentType: formValues.investorStructure.reduce(
        (acc, val, idx) => ({ ...acc, [idx]: val }),
        {}
      ),
      bio: formValues.investorBio,
      notableInvestment: formValues.investorNotableInvestments,
      preferMentoring: e.target.investorMentoringPreference.value === "true",
      //   portfolioDocument: formValues.investorPortfolio,
    };

    try {
      await updateInvestorProfile(user.InvestorProfile.uuid, data);
      setRefresh(refresh + 1);
      toast.success("User details updated successfully!");
    } catch (error) {
      toast.error("Failed to update profile");
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
              Investor Details
            </h4>
            <div>
              <div className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-2">
                  {/* Personal & Contact Information */}
                  <div>
                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                      Company Name
                    </label>
                    <input
                      name="company"
                      required
                      defaultValue={user.InvestorProfile.company}
                      className="form-style"
                      placeholder="Your company name"
                      type="text"
                    />
                  </div>
                  <div>
                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                      Location
                    </label>
                    <input
                      name="location"
                      required
                      defaultValue={user.InvestorProfile.geography}
                      className="form-style"
                      placeholder="Your location"
                      type="text"
                    />
                  </div>
                  <div>
                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                      Investment Size
                    </label>
                    <input
                      name="investmentSize"
                      required
                      defaultValue={user.InvestorProfile.ticketSize}
                      className="form-style"
                      placeholder="Your investment size"
                      type="text"
                    />
                  </div>
                  <div>
                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                      Position
                    </label>
                    <input
                      name="position"
                      required
                      defaultValue={user.InvestorProfile.role}
                      className="form-style"
                      placeholder="Your position in the company"
                      type="text"
                    />
                  </div>
                  <div>
                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                      Business Sector
                    </label>
                    <select
                      required
                      name="sector"
                      defaultValue={user.InvestorProfile.BusinessSector.uuid}
                      className="form-style"
                    >
                      <option value="">Select business sector</option>
                      {sectors.map((item) => (
                        <option key={item.id} value={item.uuid}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                      LinkedIn Profile
                    </label>
                    <input
                      name="investorLinkedIn"
                      required
                      value={formValues.investorLinkedIn}
                      onChange={(e) =>
                        setFormValues({
                          ...formValues,
                          investorLinkedIn: e.target.value,
                        })
                      }
                      className="form-style"
                      placeholder="Your LinkedIn profile URL"
                      type="url"
                    />
                  </div>
                  <div>
                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                      Website (if applicable)
                    </label>
                    <input
                      name="investorWebsite"
                      value={formValues.investorWebsite}
                      onChange={(e) =>
                        setFormValues({
                          ...formValues,
                          investorWebsite: e.target.value,
                        })
                      }
                      className="form-style"
                      placeholder="Your company website"
                      type="text"
                    />
                  </div>
                  {/* Investment Focus */}
                  <div className="col-span-2">
                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                      Investment Focus
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {[
                        "Early-Stage Startups",
                        "Growth-Stage Businesses",
                        "Impact Investing",
                        "Climate & Sustainability",
                        "Fintech & Digital Solutions",
                        "Agriculture & Agribusiness",
                        "Manufacturing & Supply Chain",
                      ].map((focus) => (
                        <label
                          key={focus}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="checkbox"
                            name="investorFocus"
                            value={focus}
                            checked={formValues.investorFocus.includes(focus)}
                            onChange={(e) =>
                              handleCheckboxChange(
                                "investorFocus",
                                e.target.value,
                                e.target.checked
                              )
                            }
                            className="form-checkbox"
                          />
                          <span>{focus}</span>
                        </label>
                      ))}
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="investorFocus"
                          value="Other"
                          checked={formValues.investorFocus.includes("Other")}
                          onChange={(e) =>
                            handleCheckboxChange(
                              "investorFocus",
                              e.target.value,
                              e.target.checked
                            )
                          }
                          className="form-checkbox"
                        />
                        <input
                          type="text"
                          name="investorOtherFocus"
                          placeholder="Specify other focus"
                          onChange={(e) =>
                            handleCheckboxChange(
                              "investorFocus",
                              e.target.value,
                              formValues.investorFocus.includes("Other")
                            )
                          }
                          className="form-style"
                        />
                      </div>
                    </div>
                  </div>
                  {/* Investment Size */}
                  <div>
                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                      Typical Investment Size
                    </label>
                    <select
                      required
                      name="investorTicketSize"
                      value={formValues.investorTicketSize}
                      onChange={(e) =>
                        setFormValues({
                          ...formValues,
                          investorTicketSize: e.target.value,
                        })
                      }
                      className="form-style"
                    >
                      <option value="">Select investment size</option>
                      <option value="<$50,000">{"<$50,000"}</option>
                      <option value="$50,000 - $100,000">
                        $50,000 - $100,000
                      </option>
                      <option value="$100,000 - $500,000">
                        $100,000 - $500,000
                      </option>
                      <option value="$500,000 - $1M">$500,000 - $1M</option>
                      <option value="$1M+">$1M+</option>
                    </select>
                  </div>
                  {/* Investment Type */}
                  <div className="col-span-2">
                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                      Investment Type Preference
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {[
                        "Equity",
                        "Debt Financing",
                        "Convertible Notes",
                        "Grants",
                      ].map((type) => (
                        <label
                          key={type}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="checkbox"
                            name="investorStructure"
                            value={type.toLowerCase()}
                            checked={formValues.investorStructure.includes(
                              type.toLowerCase()
                            )}
                            onChange={(e) =>
                              handleCheckboxChange(
                                "investorStructure",
                                e.target.value,
                                e.target.checked
                              )
                            }
                            className="form-checkbox"
                          />
                          <span>{type}</span>
                        </label>
                      ))}
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="investorStructure"
                          value="other"
                          checked={formValues.investorStructure.includes(
                            "other"
                          )}
                          onChange={(e) =>
                            handleCheckboxChange(
                              "investorStructure",
                              e.target.value,
                              e.target.checked
                            )
                          }
                          className="form-checkbox"
                        />
                        <input
                          type="text"
                          name="investorOtherStructure"
                          placeholder="Specify other type"
                          onChange={(e) =>
                            handleCheckboxChange(
                              "investorStructure",
                              e.target.value,
                              formValues.investorStructure.includes("other")
                            )
                          }
                          className="form-style"
                        />
                      </div>
                    </div>
                  </div>
                  {/* Bio & Experience */}
                  <div className="col-span-2">
                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                      Brief Bio
                    </label>
                    <textarea
                      required
                      name="investorBio"
                      value={formValues.investorBio}
                      onChange={(e) =>
                        setFormValues({
                          ...formValues,
                          investorBio: e.target.value,
                        })
                      }
                      className="form-style"
                      placeholder="Tell us about yourself & investment background"
                      rows="4"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                      Notable Investments
                    </label>
                    <textarea
                      name="investorNotableInvestments"
                      value={formValues.investorNotableInvestments}
                      onChange={(e) =>
                        setFormValues({
                          ...formValues,
                          investorNotableInvestments: e.target.value,
                        })
                      }
                      className="form-style"
                      placeholder="List your notable investments (if applicable)"
                      rows="4"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                      Seeking
                    </label>
                    <textarea
                      name="seeking"
                      required
                      defaultValue={user.InvestorProfile.seeking}
                      className="form-style"
                      placeholder="What are you seeking"
                      rows="4"
                    />
                  </div>
                  {/* Mentoring Preference */}
                  <div className="col-span-2">
                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                      Preferred Mentoring or Advisory Role?
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          required
                          name="investorMentoringPreference"
                          value="true"
                          defaultChecked={user.InvestorProfile.preferMentoring}
                          className="form-radio"
                        />
                        <span>Yes, I am open to mentoring startups</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          required
                          name="investorMentoringPreference"
                          value="false"
                          defaultChecked={!user.InvestorProfile.preferMentoring}
                          className="form-radio"
                        />
                        <span>No, I am only interested in investing</span>
                      </label>
                    </div>
                  </div>
                  {/* Supporting Documents */}
                  {/* <div className="col-span-2">
                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                      Upload Investment Portfolio (Optional)
                    </label>
                    <input
                      type="file"
                      name="investorPortfolio"
                      onChange={(e) =>
                        setFormValues({
                          ...formValues,
                          investorPortfolio: e.target.files[0],
                        })
                      }
                      className="form-style"
                      accept=".pdf,.doc,.docx"
                    />
                  </div> */}
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

export default UpdateInvestorProfile;
