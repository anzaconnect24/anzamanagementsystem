/* eslint-disable react/no-unescaped-entities */
"use client";

import React, { useEffect, useState } from "react";
import Link from "@/utils/link";
import Image from "@/utils/image";
import toast from "react-hot-toast";
import Spinner from "@/components/spinner";
import { register } from "@/controllers/user_controller";
import { createBusiness } from "@/controllers/business_controller";
import { createStaffProfile } from "@/controllers/staff_profile_controller";
import { createMentorProfile } from "@/controllers/mentor_profile_controller";
import { getSectors } from "@/controllers/sector_controller";
import { createInvestorProfile } from "@/controllers/investor_profile_controller";
import { useRouter } from "@/utils/navigation";
import { createNotification } from "@/controllers/notification_controller";
import { useTranslation } from "../../locales";
import EnterprenuerSignupForm from "../../component/entreprenuerSignupForm";
import InvestorSignupForm from "../../component/investorSignupForm";
import MentorSignupForm from "../../component/mentorSignupForm";
import { Eye, EyeOff, UserRound } from "lucide-react";

const SignUp = () => {
  const { t } = useTranslation();
  const router = useRouter();

  const [role, setRole] = useState("Reviewer");
  const [loading, setloading] = useState(false);
  const [sectors, setSectors] = useState([]);
  const [showPassword, setshowPassword] = useState(false);
  const [showPassword2, setshowPassword2] = useState(false);
  const [file, setfile] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isAlumni, setisAlumni] = useState(false);

  const [formValues, setFormValues] = useState({
    userName: "",
    userEmail: "",
    userPhone: "",
    password: "",
    repeatPassword: "",

    businessName: "",
    sdg: "",
    businessEmail: "",
    businessPhone: "",
    problem: "",
    completedProgram: "",
    stage: "",
    business_sector_uuid: "",
    businessLocation: "",
    traction: "",

    businessBio: "",
    solution: "",
    targetMarket: "",
    businessImpact: "",
    growthPlans: "",
    fundraisingNeeds: "",

    registration: "",
    team: "",
    revenue: "",
    customerCount: "",

    investorRole: "",
    investorCompany: "",
    investorSector: "",
    investorTicketSize: "",
    investorGeography: "",
    investorStructure: {},
  });

  const steps =
    role === "Enterprenuer"
      ? ["User Information", "Business Information", "Profile Image"]
      : role === "Reviewer" || role === "Finance"
        ? ["User Information", "Profile Image"]
        : role === "Mentor"
          ? [
              "User Information",
              "Mentorship Profile",
              "Availability & Motivation",
              "Profile Image",
            ]
          : ["User Information", "Profile Information", "Profile Image"];

  const inputClass =
    "h-[40px] w-full rounded-lg border border-gray-300 bg-[#ffffff] px-5 text-[16px] text-black outline-none focus:border-[#082d77] focus:ring-2 focus:ring-[#082d77]/20";

  const textareaClass =
    "w-full rounded-lg border border-gray-300 bg-[#ffffff] px-5 py-4 text-[16px] text-black outline-none focus:border-[#082d77] focus:ring-2 focus:ring-[#082d77]/20";

  const labelClass = "mb-3 block text-[16px] font-medium text-gray-800";

  useEffect(() => {
    getSectors().then((data) => {
      if (data) setSectors(data);
    });
  }, []);

  const updateFormValue = (key, value) => {
    setFormValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const isLastStep = selectedIndex === steps.length - 1;

  const goNext = (e) => {
    e.preventDefault();

    if (selectedIndex === 0) {
      if (
        !formValues.userName ||
        !formValues.userEmail ||
        !formValues.userPhone ||
        !formValues.password ||
        !formValues.repeatPassword
      ) {
        toast.error(
          t("auth.fillRequiredFields", "Please fill all required fields"),
        );
        return;
      }
    }

    if (
      selectedIndex === 0 &&
      formValues.password !== formValues.repeatPassword
    ) {
      toast.error(t("auth.passwordsDoNotMatch", "Passwords do not match"));
      return;
    }

    if (role === "Enterprenuer") {
      if (selectedIndex === 1) {
        if (
          !formValues.businessName ||
          !formValues.business_sector_uuid ||
          !formValues.businessLocation ||
          !formValues.businessBio
        ) {
          toast.error("Please complete all business information fields");
          return;
        }
      }
    }

    setSelectedIndex((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const getTitle = () => {
    if (selectedIndex === 0)
      return t("auth.createYourAccount", "Create your account");

    if (role === "Enterprenuer" && selectedIndex === 1)
      return "Add your business information";

    if (isLastStep) return "Add your profile picture";

    return "Tell us more about your profile";
  };

  const getDescription = () => {
    if (selectedIndex === 0)
      return "Provide your personal login and contact information";

    if (role === "Enterprenuer" && selectedIndex === 1)
      return "Add the basic details about your business";

    if (isLastStep) return "Upload a profile image to personalize your account";

    return "Complete the remaining details for your selected role";
  };

  return (
    <main className="min-h-screen">
      <div className="flex min-h-screen items-center justify-center">
        <section className="relative flex w-full items-center justify-center px-6 py-10">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setloading(true);

              const userData = {
                name: formValues.userName,
                file,
                email: formValues.userEmail,
                phone: formValues.userPhone,
                role,
                password: formValues.password,
              };

              let businessData;

              if (role === "Enterprenuer") {
                // The entrepreneur only fills the essentials at signup; the
                // rest is completed later from the Edit Profile page. The
                // backend still expects the full set of columns on creation,
                // so send safe defaults for the not-yet-collected fields to
                // avoid an internal server error.
                businessData = {
                  name: formValues.businessName,
                  business_sector_uuid: formValues.business_sector_uuid,
                  location: formValues.businessLocation,
                  description: formValues.businessBio,
                  email: formValues.userEmail || "",
                  phone: formValues.userPhone || "",
                  stage: "Startup",
                  sdg: "",
                  problem: "",
                  solution: "",
                  traction: "",
                  market: "",
                  impact: "",
                  growthPlan: "",
                  fundraisingNeeds: "",
                  registration: "",
                  revenue: "0",
                  team: "0",
                  numberOfCustomers: "0",
                  isAlumni: false,
                  completedProgram: "",
                };
              }

              let investorData;

              if (role === "Investor") {
                investorData = {
                  company: e.target.company?.value,
                  geography: e.target.location?.value,
                  seeking: e.target.seeking?.value,
                  bio: formValues.investorBio,
                  notableInvestment: formValues.investorNotableInvestments,
                };
              }

              let staffData;

              if (role === "Reviewer") {
                staffData = {
                  title: formValues.staffTitle,
                  department: formValues.staffDepartment,
                  yearOfEmployment: formValues.staffYearOfEmployment,
                  employeeID: formValues.staffEmployeeID,
                  supervisor: formValues.staffSupervisor,
                };
              }

              let mentorData;

              if (role === "Mentor") {
                mentorData = {
                  description: formValues.mentorDescription,
                  areasOfExperties: formValues.mentorAreaOfExpertise,
                  industries: formValues.mentorIndustries,
                  mentorshipFocus: formValues.mentorMentorshipFocus,
                  mentorAvailability: formValues.mentorAvailability,
                  mentorPreviousExperience: formValues.mentorPreviousExperience,
                  mentorMotivation: formValues.mentorMotivation,
                };
              }

              if (formValues.password !== formValues.repeatPassword) {
                toast.error(
                  t("auth.passwordsDoNotMatch", "Passwords do not match"),
                );
                setloading(false);
                return;
              }

              register(userData).then((data) => {
                if (data.status) {
                  createNotification({
                    message: `${userData.name} has joined as ${userData.role}`,
                    for: "Admin",
                  });

                  if (role === "Reviewer") {
                    staffData.user_uuid = data.body.uuid;
                    createStaffProfile(staffData);
                  }

                  if (role === "Mentor") {
                    mentorData.user_uuid = data.body.uuid;
                    createMentorProfile(mentorData);
                  }

                  if (role === "Enterprenuer") {
                    createNotification({
                      message: `${userData.name} has joined as ${userData.role}, waiting for confirmation`,
                      for: "Reviewer",
                    });

                    createBusiness(businessData).then((businessResponse) => {
                      if (businessResponse?.status === true) {
                        router.push("/confirmEmail");
                        setloading(false);
                        return;
                      }

                      toast.error(
                        businessResponse?.message ||
                          "Failed to create business profile. Please try again.",
                      );
                      setloading(false);
                    });
                  } else if (role === "Investor") {
                    investorData.user_uuid = data.body.uuid;

                    createInvestorProfile(investorData).then(() => {
                      router.push("/confirmEmail");
                      setloading(false);
                    });
                  } else {
                    router.push("/confirmEmail");
                    setloading(false);
                  }
                } else {
                  toast.error(data.message);
                  setloading(false);
                }
              });
            }}
            className="w-full max-w-[620px] text-left"
          >
            <div className="mb-8 text-left">
              <h1 className="text-[34px] font-bold leading-tight text-[#082d77]">
                {getTitle()}
              </h1>

              <p className="mt-3 text-[20px] text-gray-600">
                {getDescription()}
              </p>
            </div>

            {selectedIndex === 0 && (
              <div className="space-y-5">
                <div>
                  <label className={labelClass}>
                    {t("auth.fullName", "Full name")} *
                  </label>
                  <input
                    onChange={(e) =>
                      updateFormValue("userName", e.target.value)
                    }
                    name="userName"
                    defaultValue={formValues.userName}
                    required
                    className={inputClass}
                    placeholder={t(
                      "auth.enterFullName",
                      "Enter your full name",
                    )}
                    type="text"
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    {t("auth.emailAddress", "Email address")} *
                  </label>
                  <input
                    onChange={(e) =>
                      updateFormValue("userEmail", e.target.value)
                    }
                    name="userEmail"
                    defaultValue={formValues.userEmail}
                    required
                    className={inputClass}
                    placeholder={t("auth.enterEmail", "Enter your email")}
                    type="email"
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    {t("auth.phoneNumber", "Phone number")} *
                  </label>
                  <input
                    onChange={(e) =>
                      updateFormValue("userPhone", e.target.value)
                    }
                    name="userPhone"
                    defaultValue={formValues.userPhone}
                    required
                    className={inputClass}
                    placeholder={t(
                      "auth.enterPhone",
                      "Enter your phone number",
                    )}
                    type="tel"
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    {t("auth.registeringAs", "Registering as")} *
                  </label>
                  <select
                    defaultValue={role}
                    onChange={(e) => {
                      setRole(e.target.value);
                      setSelectedIndex(0);
                    }}
                    className={inputClass}
                    name="role"
                  >
                    {["Staff", "Finance", "Enterprenuer", "Investor", "Mentor"].map(
                      (item) => (
                        <option
                          key={item}
                          value={item === "Staff" ? "Reviewer" : item}
                        >
                          {item === "Staff"
                            ? t("roles.staff", "Staff")
                            : item === "Finance"
                              ? t("roles.finance", "Finance Officer")
                              : item === "Enterprenuer"
                                ? t("roles.entrepreneur", "Entrepreneur")
                                : item === "Investor"
                                  ? t("roles.investor", "Investor")
                                  : t("roles.mentor", "Mentor")}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>
                    {t("auth.createPassword", "Create password")} *
                  </label>
                  <div className="relative">
                    <input
                      onChange={(e) =>
                        updateFormValue("password", e.target.value)
                      }
                      type={showPassword ? "text" : "password"}
                      name="password"
                      defaultValue={formValues.password}
                      placeholder={t(
                        "auth.enterPassword",
                        "Enter your password",
                      )}
                      className={`${inputClass} pr-12`}
                    />

                    <button
                      type="button"
                      onClick={() => setshowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#082d77] hover:text-[#06245f]"
                    >
                      {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>
                    {t("auth.reenterPassword", "Re-enter password")} *
                  </label>
                  <div className="relative">
                    <input
                      onChange={(e) =>
                        updateFormValue("repeatPassword", e.target.value)
                      }
                      defaultValue={formValues.repeatPassword}
                      type={showPassword2 ? "text" : "password"}
                      name="repeatPassword"
                      placeholder={t("auth.retypePassword", "Re-type Password")}
                      className={`${inputClass} pr-12`}
                    />

                    <button
                      type="button"
                      onClick={() => setshowPassword2(!showPassword2)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#082d77] hover:text-[#06245f]"
                    >
                      {showPassword2 ? <EyeOff size={22} /> : <Eye size={22} />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {selectedIndex === 1 && !isLastStep && (
              <div>
                {role === "Enterprenuer" && (
                  <EnterprenuerSignupForm
                    sectors={sectors}
                    isAlumni={isAlumni}
                    setisAlumni={setisAlumni}
                    currentStep={1}
                    formValues={formValues}
                    setFormValues={setFormValues}
                  />
                )}

                {role === "Investor" && (
                  <InvestorSignupForm
                    sectors={sectors}
                    formValues={formValues}
                    setFormValues={setFormValues}
                  />
                )}

                {role === "Mentor" && (
                  <MentorSignupForm
                    sectors={sectors}
                    formValues={formValues}
                    setFormValues={setFormValues}
                  />
                )}
              </div>
            )}


            {role === "Mentor" && selectedIndex === 2 && (
              <div className="space-y-5">
                <div>
                  <label className={labelClass}>
                    What is your availability for mentorship sessions? *
                  </label>
                  <textarea
                    name="mentorAvailability"
                    value={formValues.mentorAvailability || ""}
                    onChange={(e) =>
                      updateFormValue("mentorAvailability", e.target.value)
                    }
                    required
                    className={`${textareaClass} min-h-[80px]`}
                    placeholder="Preferred days, hours per month, virtual or physical meetings, etc."
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Have you mentored entrepreneurs before? Please describe your
                    experience. *
                  </label>
                  <textarea
                    name="mentorPreviousExperience"
                    value={formValues.mentorPreviousExperience || ""}
                    onChange={(e) =>
                      updateFormValue(
                        "mentorPreviousExperience",
                        e.target.value,
                      )
                    }
                    required
                    className={`${textareaClass} min-h-[110px]`}
                    placeholder="Describe your previous mentorship experience"
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Why do you want to join this mentorship platform as a
                    mentor? *
                  </label>
                  <textarea
                    name="mentorMotivation"
                    value={formValues.mentorMotivation || ""}
                    onChange={(e) =>
                      updateFormValue("mentorMotivation", e.target.value)
                    }
                    required
                    className={`${textareaClass} min-h-[110px]`}
                    placeholder="Describe your motivation"
                  />
                </div>
              </div>
            )}


            {isLastStep && (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-[#ffffff] p-10">
                <label
                  htmlFor="file"
                  className="flex cursor-pointer flex-col items-center justify-center"
                >
                  {file ? (
                    <Image
                      width={1000}
                      height={1000}
                      alt=""
                      className="h-44 w-44 rounded-full object-cover"
                      src={URL.createObjectURL(file)}
                    />
                  ) : (
                    <div className="flex h-44 w-44 items-center justify-center rounded-full bg-white">
                      <UserRound size={64} className="text-[#082d77]" />
                    </div>
                  )}

                  <p className="mt-4 text-sm text-gray-600">
                    {t("auth.uploadProfileImage", "Upload profile image")} *
                  </p>
                </label>

                <input
                  required
                  onChange={(e) => setfile(e.target.files[0])}
                  name="file"
                  type="file"
                  className="sr-only"
                  id="file"
                />
              </div>
            )}

            <div className="mt-10 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() =>
                  setSelectedIndex((prev) => Math.max(prev - 1, 0))
                }
                disabled={selectedIndex === 0}
                className="h-12 w-full rounded-lg bg-[#e6ecf8] px-6 text-sm font-semibold text-[#082d77] transition hover:bg-[#d0dcf5] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Back
              </button>

              {!isLastStep ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="h-12 w-full rounded-lg bg-[#082d77] px-6 text-sm font-semibold text-white transition hover:bg-[#06245f]"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="submit"
                  className="flex min-w-[220px] h-12 w-full items-center justify-center rounded-lg bg-[#082d77] px-8 whitespace-nowrap text-sm font-semibold text-white transition hover:bg-[#06245f]"
                >
                  {loading ? (
                    <Spinner />
                  ) : (
                    t("auth.completeRegistration", "Complete Registration")
                  )}
                </button>
              )}
            </div>

            <div className="mt-8 flex justify-center gap-3">
              {steps.map((_, index) => (
                <span
                  key={index}
                  className={`h-3 rounded-full transition-all duration-300 ${
                    selectedIndex === index
                      ? "w-8 bg-[#082d77] blur-0 opacity-100"
                      : "w-3 bg-[#9bb2df] blur-[1px] opacity-40"
                  }`}
                />
              ))}
            </div>

            <div className="mt-8 text-center text-sm text-gray-500">
              Already have an account?{" "}
              <Link
                href="/auth/signin"
                className="font-semibold text-[#082d77] hover:underline"
              >
                Sign in
              </Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
};

export default SignUp;
