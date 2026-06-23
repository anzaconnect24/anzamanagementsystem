import Spinner from "@/components/spinner";
import { useState, useEffect } from "react";
import { updateInvestorProfile } from "../controllers/investor_profile_controller";
import toast from "react-hot-toast";
import { getSectors } from "../controllers/sector_controller";

const UpdateInvestorProfile = ({ user, refresh, setRefresh }) => {
  const profile = user?.InvestorProfile || {};
  const [sectors, setSectors] = useState(
    profile.BusinessSector
      ? [
          {
            id: profile.BusinessSector.id,
            uuid: profile.BusinessSector.uuid,
            name: profile.BusinessSector.name,
          },
        ]
      : []
  );
  const [loading, setLoading] = useState(false);
  const [formValues, setFormValues] = useState({
    investorLinkedIn: profile.linkedinURL || "",
    investorWebsite: profile.website || "",
    investorFocus: Object.values(profile.investmentFocus || {}),
    investorTicketSize: profile.investmentSize || "",
    investorStructure: Object.values(profile.investmentType || {}),
    investorBio: profile.bio || "",
    investorNotableInvestments: profile.notableInvestment || "",
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
      await updateInvestorProfile(profile.uuid, data);
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
            Investor Profile
          </div>
          <h1 className="mt-5 text-3xl font-black tracking-tight md:text-4xl">
            {profile.company || user?.name || "Investor Profile"}
          </h1>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { label: "Role", value: profile.role },
              { label: "Location", value: profile.geography },
              {
                label: "Ticket Size",
                value: profile.ticketSize || profile.investmentSize,
              },
              { label: "Sector", value: profile.BusinessSector?.name },
              {
                label: "Mentoring",
                value:
                  profile.preferMentoring === true
                    ? "Yes"
                    : profile.preferMentoring === false
                    ? "No"
                    : "",
              },
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
                      defaultValue={profile.company}
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
                      defaultValue={profile.geography}
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
                      defaultValue={profile.ticketSize}
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
                      defaultValue={profile.role}
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
                      defaultValue={profile.BusinessSector?.uuid}
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
                      defaultValue={profile.seeking}
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
                          defaultChecked={profile.preferMentoring}
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
                          defaultChecked={!profile.preferMentoring}
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
