/* eslint-disable react/no-unescaped-entities */
// Code snippet for Signup page
"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Loader from "@/components/common/Loader";
import Image from "next/image";
import { Metadata } from "next";
import toast from "react-hot-toast";
import { login, register } from "@/app/controllers/user_controller";
import { createBusiness } from "@/app/controllers/business_controller";
import { uploadFile } from "@/app/controllers/file_upload_controller";
import { createStaffProfile } from "@/app/controllers/staff_profile_controller";
import { createMentorProfile } from "@/app/controllers/mentor_profile_controller";
import { getSectors } from "@/app/controllers/sector_controller";
import { createInvestorProfile } from "@/app/controllers/investor_profile_controller";
import { redirect, useRouter } from "next/navigation";
import Spinner from "@/components/spinner";
import { createNotification } from "@/app/controllers/notification_controller";
import { format } from "path";
import { useTranslation } from "../../locales";
import EnterprenuerSignupForm from "../../component/entreprenuerSignupForm";
import InvestorSignupForm from "../../component/investorSignupForm";
import MentorSignupForm from "../../component/mentorSignupForm";
// export const metadata: Metadata = {
// title: "Signup Page | Next.js E-commerce Dashboard Template",
// description: "This is Signup page for TailAdmin Next.js",
// // other metadata
// };
const SignUp = () => {
  const { t } = useTranslation();
  const [role, setRole] = useState("Reviewer");
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
    solution: "",
    traction: "",
    registration: "",
    stage: "",
    business_sector_uuid: "",
    team: "",
    investorRole: "",
    investorCompany: "",
    investorSector: "",
    investorTicketSize: "",
    investorGeography: "",
    investorStructure: {},
  });
  const router = useRouter();
  const [loading, setloading] = useState(false);

  const [sectors, setSectors] = useState([]);
  const [showPassword, setshowPassword] = useState(false);
  const [showPassword2, setshowPassword2] = useState(false);
  const [file, setfile] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const steps = [
    t("auth.steps.profileImage", "Profile Image"),
    t("auth.steps.userInformation", "User Information"),
    t("auth.steps.businessInformation", "Business Information"),
  ];
  const [isAlumni, setisAlumni] = useState(false);
  useEffect(() => {
    getSectors().then((data) => {
      if (data) {
        setSectors(data);
      }
    });
  }, []);
  return (
    <div className=" bg-slate-800 min-h-screen flex items-center">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setloading(true);
          const userData = {
            name: formValues.userName,
            file: file,
            email: formValues.userEmail,
            phone: formValues.userPhone,
            role: role,
            password: formValues.password,
          };
          let businessData;
          if (role == "Enterprenuer") {
            businessData = {
              name: e.target.businessName.value,
              sdg: e.target.sdg.value,
              email: e.target.businessEmail.value,
              phone: e.target.businessPhone.value,
              problem: e.target.problem.value,
              isAlumni: isAlumni,
              completedProgram: e.target.completedProgram?.value,
              solution: e.target.solution.value,
              registration: e.target.registration.value,
              stage: e.target.stage.value,
              business_sector_uuid: e.target.business_sector_uuid.value,
              team: e.target.team.value,
              traction: e.target.traction.value,
              revenue: e.target.revenue.value,
              instagramLink: e.target.instagramLink.value,
              websiteLink: e.target.websiteLink.value,
              description: e.target.businessBio.value,
              numberOfCustomers: e.target.customerCount.value,
              market: e.target.targetMarket.value,
              location: e.target.businessLocation.value,
              impact: e.target.businessImpact.value,
              growthPlan: e.target.growthPlans.value,
              fundraisingNeeds: e.target.fundraisingNeeds.value,
            };
          }
          let investorData;
          if (role == "Investor") {
            investorData = {
              role: e.target.position.value,
              company: e.target.company.value,
              sector: e.target.sector.value,
              ticketSize: e.target.investmentSize.value,
              geography: e.target.location.value,
              seeking: e.target.seeking.value,

              // structure: e.target.investorStructure.value,
              linkedinURL: formValues.investorLinkedIn,
              website: formValues.investorWebsite,
              investmentFocus: formValues.investorFocus,
              investmentSize: formValues.investorTicketSize,
              investmentType: formValues.investorStructure,
              bio: formValues.investorBio,
              notableInvestment: formValues.investorNotableInvestments,
              preferMentoring: e.target.investorMentoringPreference.value,
            };
          }
          let staffData;
          if (role == "Reviewer") {
            staffData = {
              title: formValues.staffTitle,
              department: formValues.staffDepartment,
              yearOfEmployment: formValues.staffYearOfEmployment,
              employeeID: formValues.staffEmployeeID,
              supervisor: formValues.staffSupervisor,
            };
          }
          let mentorData;
          if (role == "Mentor") {
            mentorData = {
              business_sector_uuid: e.target.business_sector_uuid.value,
              linkedinURL: formValues.mentorLinkedIn,
              position: formValues.mentorPosition,
              organisation: formValues.mentorOrganisation,
              areasOfExperties: formValues.mentorExpertise,
              mentorAvailability: formValues.mentorAvailability,
              mentorHours: formValues.mentorHours,
              language: e.target.language.value,
              location: e.target.location.value,
              smeFocus: formValues.smeFocus,
              mentorshipFocus: formValues.mentorshipFocus,
              mentoringFormat: formValues.mentorFormat,
              description: formValues.mentorDescription,
            };
          }
          if (formValues.password == formValues.repeatPassword) {
            register(userData).then((data) => {
              console.log(data);
              if (data.status) {
                createNotification({
                  message: `${userData.name} has joined as ${userData.role}`,
                  for: "Admin",
                });
                if (role == "Reviewer") {
                  staffData.user_uuid = data.body.uuid;
                  createStaffProfile(staffData);
                }

                if (role == "Mentor") {
                  mentorData.user_uuid = data.body.uuid;
                  console.log(mentorData, role);
                  createMentorProfile(mentorData);
                }
                if (role == "Enterprenuer") {
                  createNotification({
                    message: `${userData.name} has joined as ${userData.role}, waiting for confirmation`,
                    for: "Reviewer",
                  });

                  createBusiness(businessData).then((data) => {
                    router.push("/confirmEmail");
                    setloading(false);
                  });
                } else if (role == "Investor") {
                  investorData.user_uuid = data.body.uuid;
                  if (formValues.investorPortfolio) {
                    let formData = new FormData();
                    console.log(e.target.investorPortfolio.files[0]);
                    formData.append(
                      "file",
                      e.target.investorPortfolio.files[0]
                    );
                    uploadFile(formData).then((url) => {
                      console.log(url);
                      investorData.portifolioDocument = url;
                      console.log(investorData);
                      createInvestorProfile(investorData).then((data) => {
                        router.push("/confirmEmail");
                        setloading(false);
                      });
                    });
                  } else {
                    console.log(investorData);
                    createInvestorProfile(investorData).then((data) => {
                      router.push("/confirmEmail");
                      setloading(false);
                    });
                  }
                } else {
                  router.push("/confirmEmail");
                  setloading(false);
                }
              } else {
                toast.error(data.message);
                setloading(false);
              }
            });
          } else {
            toast.error(
              t("auth.passwordsDoNotMatch", "Passwords do not match")
            );
            setloading(false);
          }
        }}
        className=" w-11/12 md:w-8/12 2xl:w-6/12 mx-auto "
      >
        <div
          className=" bg-white hover:shadow border-black rounded-lg ring-1
ring-stroke "
        >
          <div className="grid grid-cols-12">
            <div
              className="col-span-4 bg-slate-100 h-full p-8 py-16 rounded-l-lg flex
flex-col justify-between "
            >
              <div>
                <p className="font-medium text-primary">
                  {t("common.welcome", "Welcome")}
                </p>
                <h1 className="text-4xl font-bold">
                  {t("auth.createAnzaAccount", "Create Anza Account")}
                </h1>
                <div className="space-y-2 mt-12">
                  {steps.map((item, index) => {
                    return (
                      <div
                        key={item}
                        className={`py-2 px-3 border border-slate-400 rounded-md ${
                          selectedIndex == index && "bg-primary text-white"
                        }`}
                      >
                        {item}
                      </div>
                    );
                  })}
                </div>
              </div>
              <p className="mt-24">
                <span className="">
                  {t("auth.alreadyHaveAccount", "Already have an account?")}{" "}
                </span>
                <Link href="/signin" className="text-primary font-bold">
                  {t("auth.signIn", "Sign In")}
                </Link>
              </p>
            </div>
            <div className="col-span-8 p-8 py-16 flex flex-col justify-center w-full">
              {/* <div className="flex justify-center">
<Image height={100} width={100} alt="" src={"/anza.png"}/>
</div> */}
              {/* <span className="mb-1.5 block text-center text-primary
font-bold">Register to anza </span> */}
              {/* <div className="text-4xl font-bold text-black pb-10 text-center">Create
Anza account</div> */}
              <div>
                {/* <div className=" text-2xl text-black pt-8 pb-4">Personal details</div> */}
                <div className="flex justify-between w-full mb-8 items-center">
                  <h1 className="text-xl">{steps[selectedIndex]}</h1>
                  <div className="py-2 px-3 rounded-full bg-primary bg-opacity-10">
                    {t("common.step", "Step {{n}}", { n: selectedIndex + 1 })}
                  </div>
                </div>
                {selectedIndex == 0 && (
                  <div className="flex justify-center flex-col items-center">
                    <label
                      htmlFor="file"
                      className="flex flex-col items-center justify-center"
                    >
                      {file != null ? (
                        <Image
                          width={1000}
                          height={1000}
                          alt=""
                          className="h-48 w-48 object-cover border border-dashed
border-slate-400 rounded-full"
                          src={URL.createObjectURL(file)}
                        />
                      ) : (
                        <div
                          className=" border w-48 h-48 border-dashed border-slate-400
p-12 rounded-full flex justify-center items-center "
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="size-12"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501
20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676
0-5.216-.584-7.499-1.632Z"
                            />
                          </svg>
                        </div>
                      )}
                      {file == null && (
                        <p className="italic text-body mt-2">
                          {t("auth.uploadProfileImage", "Upload profile image")}
                          *
                        </p>
                      )}
                    </label>
                    <input
                      required
                      onChange={(e) => {
                        setfile(e.target.files[0]);
                      }}
                      name="file"
                      type="file"
                      className="sr-only"
                      id="file"
                    />
                  </div>
                )}
                {selectedIndex == 1 && (
                  <div className="grid grid-cols-1 mt-3 md:grid-cols-2 gap-x-2 gap-y-2">
                    <div>
                      <label
                        className="mb-2.5 block font-medium text-black
dark:text-white"
                      >
                        {t("auth.fullName", "Full name")}
                      </label>
                      <input
                        onChange={(e) => {
                          const newFormValues = formValues;
                          newFormValues.userName = e.target.value;
                          setFormValues(newFormValues);
                        }}
                        name="userName"
                        defaultValue={formValues.userName}
                        required
                        className="form-style"
                        placeholder={t(
                          "auth.enterFullName",
                          "Enter your full name"
                        )}
                        type="text"
                      />
                    </div>
                    <div>
                      <label
                        className="mb-2.5 block font-medium text-black
dark:text-white"
                      >
                        {t("auth.emailAddress", "Email address")}
                      </label>
                      <input
                        onChange={(e) => {
                          const newFormValues = formValues;
                          newFormValues.userEmail = e.target.value;
                          setFormValues(newFormValues);
                        }}
                        name="userEmail"
                        defaultValue={formValues.userEmail}
                        required
                        className="form-style"
                        placeholder={t("auth.enterEmail", "Enter your email")}
                        type="email"
                      />
                    </div>
                    <div>
                      <label
                        className="mb-2.5 block font-medium text-black
dark:text-white"
                      >
                        {t("auth.phoneNumber", "Phone number")}
                      </label>
                      <input
                        onChange={(e) => {
                          const newFormValues = formValues;
                          newFormValues.userPhone = e.target.value;
                          setFormValues(newFormValues);
                        }}
                        name="userPhone"
                        defaultValue={formValues.userPhone}
                        required
                        className="form-style"
                        placeholder={t(
                          "auth.enterPhone",
                          "Enter your phone number"
                        )}
                        type="tel"
                      />
                    </div>
                    <div>
                      <label
                        className="mb-2.5 block font-medium text-black
dark:text-white"
                      >
                        {t("auth.registeringAs", "Registering as")}
                      </label>
                      <div className="flex flex-col space-y-2">
                        <select
                          defaultValue={role}
                          onChange={(e) => {
                            setRole(e.target.value);
                          }}
                          className="form-style"
                          name="role"
                        >
                          {["Staff", "Enterprenuer", "Investor", "Mentor"].map(
                            (item) => (
                              <option
                                key={item}
                                value={item == "Staff" ? "Reviewer" : item}
                              >
                                {item === "Staff"
                                  ? t("roles.staff", "Staff")
                                  : item === "Enterprenuer"
                                  ? t("roles.entrepreneur", "Entrepreneur")
                                  : item === "Investor"
                                  ? t("roles.investor", "Investor")
                                  : t("roles.mentor", "Mentor")}
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label
                        className="mb-2.5 block font-medium text-black
dark:text-white"
                      >
                        {t("auth.createPassword", "Create password")}
                      </label>
                      <div className="relative">
                        <input
                          onChange={(e) => {
                            const newFormValues = formValues;
                            newFormValues.password = e.target.value;
                            setFormValues(newFormValues);
                          }}
                          type={`${showPassword ? "text" : "password"}`}
                          name="password"
                          defaultValue={formValues.password}
                          placeholder={t(
                            "auth.enterPassword",
                            "Enter your password"
                          )}
                          className="form-style"
                        />
                        <span
                          onClick={() => setshowPassword(!showPassword)}
                          className="absolute right-4 top-2 cursor-pointer"
                        >
                          {showPassword ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              className="w-6 h-6"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12
4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12
19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                              />
                            </svg>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              className="w-6 h-6"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244
19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756
0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228
3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1
0-4.243-4.243m4.242 4.242L9.88 9.88"
                              />
                            </svg>
                          )}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label
                        className="mb-2.5 block font-medium text-black
dark:text-white"
                      >
                        {t("auth.reenterPassword", "Re-enter password")}
                      </label>
                      <div className="relative">
                        <input
                          onChange={(e) => {
                            const newFormValues = formValues;
                            newFormValues.repeatPassword = e.target.value;
                            setFormValues(newFormValues);
                          }}
                          defaultValue={formValues.repeatPassword}
                          type={`${showPassword2 ? "text" : "password"}`}
                          name="repeatPassword"
                          placeholder={t(
                            "auth.retypePassword",
                            "Re-type Password"
                          )}
                          className="form-style"
                        />
                        <span
                          onClick={() => setshowPassword2(!showPassword2)}
                          className="absolute right-4 top-2 cursor-pointer"
                        >
                          {showPassword2 ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              className="w-6 h-6"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12
4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12
19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                              />
                            </svg>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              className="w-6 h-6"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244
19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756
0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228
3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1
0-4.243-4.243m4.242 4.242L9.88 9.88"
                              />
                            </svg>
                          )}
                        </span>
                      </div>
                    </div>

                    <div></div>
                  </div>
                )}
              </div>
              {selectedIndex == 2 && (
                <div>
                  {role == "Enterprenuer" && (
                    <EnterprenuerSignupForm
                      sectors={sectors}
                      isAlumni={isAlumni}
                      setisAlumni={setisAlumni}
                    />
                  )}
                  {role == "Investor" && (
                    <InvestorSignupForm
                      sectors={sectors}
                      formValues={formValues}
                      setFormValues={setFormValues}
                    />
                  )}
                  {role == "Mentor" && (
                    <MentorSignupForm
                      sectors={sectors}
                      formValues={formValues}
                      setFormValues={setFormValues}
                    />
                  )}
                </div>
              )}
              <div className=" flex justify-end py-4 space-x-2 w-full pt-24">
                {selectedIndex > 0 && (
                  <div
                    onClick={() => {
                      setSelectedIndex(selectedIndex - 1);
                    }}
                    className="py-3 px-3 rounded-lg border-slate-400 border cursor-pointer"
                  >
                    {t("common.previous", "Previous")}
                  </div>
                )}
                {selectedIndex == 0 && file != null && (
                  <button
                    onClick={() => {
                      setSelectedIndex(selectedIndex + 1);
                    }}
                    className="py-3 px-3 rounded-lg text-white border-slate-400 border
bg-primary"
                  >
                    {t("common.next", "Next")}
                  </button>
                )}
                {(selectedIndex == 1 && role == "Reviewer") ||
                role == "Mentorrr" ? (
                  <button
                    type="submit"
                    className="w-48 cursor-pointer rounded-lg border flex justify-center
border-primary bg-primary py-3 px-3 text-white transition hover:bg-opacity-90"
                  >
                    {loading ? (
                      <Spinner />
                    ) : (
                      t("auth.completeRegistration", "Complete Registration")
                    )}
                  </button>
                ) : (
                  selectedIndex != 0 &&
                  selectedIndex != 2 && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        console.log(
                          formValues.password,
                          formValues.repeatPassword
                        );
                        if (formValues.password === formValues.repeatPassword) {
                          setSelectedIndex(selectedIndex + 1);
                        } else {
                          toast.error(
                            t(
                              "auth.passwordsDoNotMatch",
                              "Passwords do not match"
                            )
                          );
                        }
                      }}
                      className="py-3 px-3 rounded-lg text-white border-slate-400 border
bg-primary"
                    >
                      {t("common.next", "Next")}
                    </button>
                  )
                )}
                {selectedIndex == 2 ? (
                  <button
                    type="submit"
                    className="w-48 cursor-pointer rounded-lg border flex justify-center
border-primary bg-primary py-3 px-3 text-white transition hover:bg-opacity-90"
                  >
                    {loading ? (
                      <Spinner />
                    ) : (
                      t("auth.completeRegistration", "Complete Registration")
                    )}
                  </button>
                ) : (
                  role != "Reviewer" &&
                  selectedIndex == 3 && (
                    <button
                      type="submit"
                      className="w-48 cursor-pointer rounded-lg border flex justify-center
border-primary bg-primary py-3 px-3 text-white transition hover:bg-opacity-90"
                    >
                      {loading ? (
                        <Spinner />
                      ) : (
                        t("auth.completeRegistration", "Complete Registration")
                      )}
                    </button>
                  )
                )}
              </div>
              <div className="mt-0 text-center"></div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
export default SignUp;
