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
// export const metadata: Metadata = {
// title: "Signup Page | Next.js E-commerce Dashboard Template",
// description: "This is Signup page for TailAdmin Next.js",
// // other metadata
// };
const SignUp = () => {
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
  const steps = ["Profile Image", "User Informations", "Business Informations"];
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
              revenue: e.target.revenue.value,
              instagramLink: e.target.instagramLink.value,
              websiteLink: e.target.websiteLink.value,
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
            toast.error("Passwords don't match");
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
                <p className="font-medium text-primary">Welcome</p>
                <h1 className="text-4xl font-bold">Create Anza Account</h1>
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
                <span className="">Already registered ? </span>
                <Link href="/signin" className="text-primary font-bold">
                  Sign in
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
                    Step {selectedIndex + 1}
                  </div>
                </div>
                {selectedIndex == 0 && (
                  <div className="flex justify-center flex-col items-center">
                    <label
                      for="file"
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
                          Upload profile image*
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
                        Full name
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
                        placeholder="Username"
                        type="text"
                      />
                    </div>
                    <div>
                      <label
                        className="mb-2.5 block font-medium text-black
dark:text-white"
                      >
                        Email address
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
                        placeholder="Email address"
                        type="email"
                      />
                    </div>
                    <div>
                      <label
                        className="mb-2.5 block font-medium text-black
dark:text-white"
                      >
                        Phone number
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
                        placeholder="Phone number"
                        type="tel"
                      />
                    </div>
                    <div>
                      <label
                        className="mb-2.5 block font-medium text-black
dark:text-white"
                      >
                        Registering as
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
                                {item == "Enterprenuer" ? "Entrepreneur" : item}
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
                        Create password
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
                          placeholder="Enter password"
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
                        Re-enter password
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
                          placeholder="Re-enter password"
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
                    <div>
                      {/* <div className=" text-2xl text-black pt-8 pb-4">Company
details</div> */}
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-2">
                          <div>
                            <label
                              className="mb-2.5 block font-medium text-black
dark:text-white"
                            >
                              Select Sustainable Development Goals
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
                            <label
                              className="mb-2.5 block font-medium text-black
dark:text-white"
                            >
                              Are you an Anza alumni ?
                            </label>
                            <select
                              onChange={(e) => {
                                // alert(e.target.value)
                                setisAlumni(
                                  e.target.value == "true" ? true : false
                                );
                              }}
                              required
                              name="isAlumni"
                              className="form-style"
                            >
                              <option value={false}>No</option>
                              <option value={true}>Yes</option>
                            </select>
                          </div>
                          {isAlumni && (
                            <div>
                              <label
                                className="mb-2.5 block font-medium text-black
dark:text-white"
                              >
                                What program did you complete ?
                              </label>
                              <select
                                required
                                name="completedProgram"
                                className="form-style"
                              >
                                <option>Select program</option>
                                <option value="BFA">BFA</option>
                                <option value="IR program">IR program</option>
                              </select>
                            </div>
                          )}
                          <div>
                            <label
                              className="mb-2.5 block font-medium text-black
dark:text-white"
                            >
                              Business name
                            </label>
                            <input
                              required
                              name="businessName"
                              className="form-style"
                              placeholder="Company name"
                              type="text"
                            />
                          </div>
                          <div>
                            <label
                              className="mb-2.5 block font-medium text-black
dark:text-white"
                            >
                              Business email adress
                            </label>
                            <input
                              required
                              name="businessEmail"
                              className="form-style"
                              placeholder="Company email address"
                              type="text"
                            />
                          </div>
                          <div>
                            <label
                              className="mb-2.5 block font-medium text-black
dark:text-white"
                            >
                              Business phone number
                            </label>
                            <input
                              required
                              name="businessPhone"
                              className="form-style"
                              placeholder="Company phone number"
                              type="text"
                            />
                          </div>
                          <div>
                            <label
                              className="mb-2.5 block font-medium text-black
dark:text-white"
                            >
                              Website Link
                            </label>
                            <input
                              name="websiteLink"
                              className="form-style"
                              placeholder="Enter website link"
                              type="text"
                            />
                          </div>
                          <div>
                            <label
                              className="mb-2.5 block font-medium text-black
dark:text-white"
                            >
                              Instagram Link
                            </label>
                            <input
                              name="instagramLink"
                              className="form-style"
                              placeholder="Paste instagram Link"
                              type="text"
                            />
                          </div>
                          <div>
                            <label
                              className="mb-2.5 block font-medium text-black
dark:text-white"
                            >
                              Revenue
                            </label>
                            <input
                              required
                              name="revenue"
                              className="form-style"
                              placeholder="Company revenue"
                              type="number"
                            />
                          </div>
                          <div>
                            <label
                              className="mb-2.5 block font-medium text-black
dark:text-white"
                            >
                              Business sector
                            </label>
                            <select
                              required
                              name="business_sector_uuid"
                              className="form-style"
                            >
                              <option>Select business sector</option>
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
                              Business stage
                            </label>
                            <select
                              required
                              name="stage"
                              className="form-style"
                            >
                              <option>Select business stage</option>
                              <option value="Startup">Startup</option>
                              <option value="Growth stage">Growth stage</option>
                              <option value="Expansion stage">
                                Expansion stage
                              </option>
                              <option value="Maturity stage">
                                Maturity stage
                              </option>
                            </select>
                          </div>

                          <div>
                            <label className="mb-2.5 block font-medium text-black dark:text-white">
                              Short Business Bio/Profile
                            </label>
                            <textarea
                              required
                              name="businessBio"
                              className="form-style"
                              placeholder="Brief description of your business"
                              rows="3"
                            />
                          </div>
                          <div>
                            <label className="mb-2.5 block font-medium text-black dark:text-white">
                              Number of Customers
                            </label>
                            <input
                              required
                              name="customerCount"
                              className="form-style"
                              placeholder="Enter number of customers"
                              type="number"
                            />
                          </div>
                          <div>
                            <label className="mb-2.5 block font-medium text-black dark:text-white">
                              Potential Market & Target Audience
                            </label>
                            <textarea
                              required
                              name="targetMarket"
                              className="form-style"
                              placeholder="Describe your target market and audience"
                              rows="3"
                            />
                          </div>
                          <div>
                            <label className="mb-2.5 block font-medium text-black dark:text-white">
                              Business Location
                            </label>
                            <select
                              required
                              name="businessLocation"
                              className="form-style"
                            >
                              <option value="">Select Region</option>
                              <option value="Arusha">Arusha</option>
                              <option value="Dar es Salaam">
                                Dar es Salaam
                              </option>
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
                              <option value="Mjini Magharibi">
                                Mjini Magharibi
                              </option>
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
                              What problems does your business solve ?
                            </label>
                            <textarea
                              required
                              name="problem"
                              className="form-style"
                              placeholder="What problems does your business solve ?"
                              rows="3"
                            />
                          </div>
                          <div>
                            <label className="mb-2.5 block font-medium text-black dark:text-white">
                              What solution does your business provide ?
                            </label>
                            <textarea
                              required
                              name="solution"
                              className="form-style"
                              placeholder="What solution does your business provide ?"
                              rows="3"
                            />
                          </div>
                          <div>
                            <label className="mb-2.5 block font-medium text-black dark:text-white">
                              Current Business Impact
                            </label>
                            <textarea
                              required
                              name="businessImpact"
                              className="form-style"
                              placeholder="Describe your current business impact"
                              rows="3"
                            />
                          </div>
                          <div>
                            <label className="mb-2.5 block font-medium text-black dark:text-white">
                              Future Milestones & Growth Plans
                            </label>
                            <textarea
                              required
                              name="growthPlans"
                              className="form-style"
                              placeholder="Describe your future milestones and growth plans"
                              rows="3"
                            />
                          </div>

                          <div>
                            <label className="mb-2.5 block font-medium text-black dark:text-white">
                              Current Fundraising Needs
                            </label>
                            <textarea
                              required
                              name="fundraisingNeeds"
                              className="form-style"
                              placeholder="Describe your current fundraising needs"
                              rows="3"
                            />
                          </div>

                          <div>
                            <label
                              className="mb-2.5 block font-medium text-black
dark:text-white"
                            >
                              Number of people in your team
                            </label>
                            <input
                              required
                              name="team"
                              className="form-style"
                              placeholder="Enter number of team members"
                              type="text"
                            />
                          </div>
                          <div>
                            <label
                              className="mb-2.5 block font-medium text-black
dark:text-white"
                            >
                              Registration status
                            </label>
                            <select
                              required
                              name="registration"
                              className="form-style"
                            >
                              <option>Registration status</option>
                              <option value="Registered with BRELA">
                                Registered with BRELA
                              </option>
                              <option value="Registered with TIN only">
                                Registered with TIN only
                              </option>
                              <option value="Have BRELA and TIN">
                                Have BRELA and TIN
                              </option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {role == "Investor" && (
                    <div>
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-2">
                          {/* Personal & Contact Information */}
                          <div>
                            <label
                              className="mb-2.5 block font-medium text-black
dark:text-white"
                            >
                              Company Name
                            </label>
                            <input
                              name="company"
                              required
                              className="form-style"
                              placeholder="Your company name"
                              type="text"
                            />
                          </div>
                          <div>
                            <label
                              className="mb-2.5 block font-medium text-black
dark:text-white"
                            >
                              Location
                            </label>
                            <input
                              name="location"
                              required
                              className="form-style"
                              placeholder="Your location"
                              type="text"
                            />
                          </div>
                          <div>
                            <label
                              className="mb-2.5 block font-medium text-black
dark:text-white"
                            >
                              Investment Size
                            </label>
                            <input
                              name="investmentSize"
                              required
                              className="form-style"
                              placeholder="Your investment size"
                              type="text"
                            />
                          </div>
                          <div>
                            <label
                              className="mb-2.5 block font-medium text-black
dark:text-white"
                            >
                              Position
                            </label>
                            <input
                              name="position"
                              required
                              className="form-style"
                              placeholder="Your position in the company"
                              type="text"
                            />
                          </div>
                          <div>
                            <label
                              className="mb-2.5 block font-medium text-black
dark:text-white"
                            >
                              Business sector
                            </label>
                            <select
                              required
                              name="sector"
                              className="form-style"
                            >
                              <option value={""}>Select business sector</option>
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
                              LinkedIn Profile
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
                              placeholder="Your LinkedIn profile URL"
                              type="url"
                            />
                          </div>

                          <div>
                            <label
                              className="mb-2.5 block font-medium text-black
dark:text-white"
                            >
                              Website (if applicable)
                            </label>
                            <input
                              name="investorWebsite"
                              onChange={(e) => {
                                const newFormValues = formValues;
                                newFormValues.investorWebsite = e.target.value;
                                setFormValues(newFormValues);
                              }}
                              className="form-style"
                              placeholder="Your company website"
                              type="text"
                            />
                          </div>
                          {/* Investment Focus */}
                          <div className="col-span-2">
                            <label
                              className="mb-2.5 block font-medium text-black
dark:text-white"
                            >
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
                                    onChange={(e) => {
                                      let newFormValues = {
                                        investorFocus: {},
                                        ...formValues,
                                      };
                                      newFormValues.investorFocus[
                                        Object.keys(
                                          newFormValues.investorFocus
                                        ).length
                                      ] = e.target.value;
                                      setFormValues(newFormValues);
                                    }}
                                    value={focus}
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
                                  className="form-checkbox"
                                />
                                <input
                                  onChange={(e) => {
                                    let newFormValues = {
                                      investorFocus: {},
                                      ...formValues,
                                    };
                                    newFormValues.investorFocus[
                                      Object.keys(
                                        newFormValues.investorFocus
                                      ).length
                                    ] = e.target.value;
                                    setFormValues(newFormValues);
                                  }}
                                  type="text"
                                  name="investorOtherFocus"
                                  placeholder="Specify other focus"
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
                              Typical Investment Size
                            </label>
                            <select
                              required
                              name="investorTicketSize"
                              onChange={(e) => {
                                let newFormValues = {
                                  ...formValues,
                                };
                                newFormValues.investorTicketSize =
                                  e.target.value;
                                setFormValues(newFormValues);
                              }}
                              className="form-style"
                            >
                              <option value="">Select investment size</option>
                              <option value="<$50,000">&lt;$50,000</option>
                              <option value="$50,000 - $100,000">
                                $50,000 - $100,000
                              </option>
                              <option value="$100,000 - $500,000">
                                $100,000 - $500,000
                              </option>
                              <option value="$500,000 - $1M">
                                $500,000 - $1M
                              </option>
                              <option value="$1M+">$1M+</option>
                            </select>
                          </div>
                          {/* Investment Type */}
                          <div className="col-span-2">
                            <label
                              className="mb-2.5 block font-medium text-black
dark:text-white"
                            >
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
                                    onChange={(e) => {
                                      let newFormValues = {
                                        ...formValues,
                                      };
                                      newFormValues.investorStructure[
                                        Object.keys(
                                          newFormValues.investorStructure
                                        ).length
                                      ] = e.target.value;
                                      setFormValues(newFormValues);
                                    }}
                                    name="investorStructure"
                                    value={type.toLowerCase()}
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
                                  className="form-checkbox"
                                />
                                <input
                                  onChange={(e) => {
                                    let newFormValues = {
                                      ...formValues,
                                    };
                                    newFormValues.investorStructure[
                                      Object.keys(
                                        newFormValues.investorStructure
                                      ).length
                                    ] = e.target.value;
                                    setFormValues(newFormValues);
                                  }}
                                  type="text"
                                  name="investorOtherStructure"
                                  placeholder="Specify other type"
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
                              Brief Bio
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
                              placeholder="Tell us about yourself & investment background"
                              rows="4"
                            />
                          </div>
                          <div className="col-span-2">
                            <label
                              className="mb-2.5 block font-medium text-black
dark:text-white"
                            >
                              Notable Investments
                            </label>
                            <textarea
                              name="investorNotableInvestments"
                              onChange={(e) => {
                                const newFormValues = formValues;
                                newFormValues.investorNotableInvestments =
                                  e.target.value;
                                setFormValues(newFormValues);
                              }}
                              className="form-style"
                              placeholder="List your notable investments (if applicable)"
                              rows="4"
                            />
                          </div>
                          <div className="col-span-2">
                            <label
                              className="mb-2.5 block font-medium text-black
dark:text-white"
                            >
                              Seeking
                            </label>
                            <textarea
                              name="seeking"
                              required
                              className="form-style"
                              placeholder="What are you seeking"
                              rows="4"
                            />
                          </div>
                          {/* Mentoring Preference */}
                          <div className="col-span-2">
                            <label
                              className="mb-2.5 block font-medium text-black
dark:text-white"
                            >
                              Preferred Mentoring or Advisory Role?
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
                                  Yes, I am open to mentoring startups
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
                                  No, I am only interested in investing
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
                              Upload Investment Portfolio (Optional)
                            </label>
                            <input
                              type="file"
                              onChange={(e) => {
                                const newFormValues = formValues;
                                newFormValues.investorPortfolio =
                                  e.target.files[0];
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
                                I agree to be contacted regarding investment
                                opportunities
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
                                I consent to my information being used for
                                investor matching/mentors or any other platform
                                that can help
                              </span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {role == "Mentor" && (
                    <div>
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-2">
                          {/* Personal Information */}
                          <div>
                            <label
                              className="mb-2.5 block font-medium text-black
dark:text-white"
                            >
                              LinkedIn Profile
                            </label>
                            <input
                              onChange={(e) => {
                                const newFormValues = formValues;
                                newFormValues.mentorLinkedIn = e.target.value;
                                setFormValues(newFormValues);
                              }}
                              name="mentorLinkedIn"
                              required
                              className="form-style"
                              placeholder="Your LinkedIn profile URL"
                              type="text"
                            />
                          </div>
                          <div>
                            <label
                              className="mb-2.5 block font-medium text-black
dark:text-white"
                            >
                              Organization/Company Name
                            </label>
                            <input
                              onChange={(e) => {
                                const newFormValues = formValues;
                                newFormValues.mentorOrganisation =
                                  e.target.value;
                                setFormValues(newFormValues);
                              }}
                              name="mentorCompany"
                              required
                              className="form-style"
                              placeholder="Your organization name"
                              type="text"
                            />
                          </div>
                          <div>
                            <label
                              className="mb-2.5 block font-medium text-black
dark:text-white"
                            >
                              Business sector
                            </label>
                            <select
                              required
                              name="business_sector_uuid"
                              className="form-style"
                            >
                              <option>Select business sector</option>
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
                              Current Position/Title
                            </label>
                            <input
                              onChange={(e) => {
                                const newFormValues = formValues;
                                newFormValues.mentorPosition = e.target.value;
                                setFormValues(newFormValues);
                              }}
                              name="mentorPosition"
                              required
                              className="form-style"
                              placeholder="Your current position"
                              type="text"
                            />
                          </div>
                          <div>
                            <label
                              className="mb-2.5 block font-medium text-black
dark:text-white"
                            >
                              Language
                            </label>
                            <select
                              onChange={(e) => {
                                const newFormValues = formValues;
                                newFormValues.mentorPosition = e.target.value;
                                setFormValues(newFormValues);
                              }}
                              name="language"
                              required
                              className="form-style"
                              placeholder="Your language"
                              type="text"
                            >
                              <option value={"English"}>English</option>
                              <option value={"Swahili"}>Swahili</option>
                            </select>
                          </div>
                          <div className="col-span-1">
                            <label
                              className="mb-2.5 block font-medium text-black
dark:text-white"
                            >
                              SME Focus
                            </label>
                            <select
                              name="smeFocus"
                              className="form-style"
                              onChange={(e) => {
                                const newFormValues = formValues;
                                newFormValues.smeFocus = e.target.value;
                                setFormValues(newFormValues);
                              }}
                            >
                              {[
                                "Startups",
                                "Growth stage",
                                "Expansion stage",
                                "Maturity Stage",
                              ].map((item) => {
                                return <option key={item}>{item}</option>;
                              })}
                            </select>
                          </div>
                          <div>
                            <label
                              className="mb-2.5 block font-medium text-black
dark:text-white"
                            >
                              Location
                            </label>
                            <input
                              onChange={(e) => {
                                const newFormValues = formValues;
                                newFormValues.location = e.target.value;
                                setFormValues(newFormValues);
                              }}
                              name="location"
                              required
                              className="form-style"
                              placeholder="Your location"
                              type="text"
                            />
                          </div>
                          {/* Expertise & Areas of Support */}
                          <div className="col-span-2">
                            <label
                              className="mb-2.5 block font-medium text-black
dark:text-white"
                            >
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
                                    onChange={(e) => {
                                      let newFormValues = {
                                        mentorExpertise: {},
                                        ...formValues,
                                      };
                                      newFormValues.mentorExpertise[
                                        Object.keys(
                                          newFormValues.mentorExpertise
                                        ).length
                                      ] = e.target.value;
                                      setFormValues(newFormValues);
                                    }}
                                    name="mentorExpertise"
                                    value={expertise}
                                    className="form-checkbox"
                                  />
                                  <span>{expertise}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                          {/* Availability & Commitment */}
                          <div className="col-span-2">
                            <label
                              className="mb-2.5 block font-medium text-black
dark:text-white"
                            >
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
                                    onChange={(e) => {
                                      const newFormValues = formValues;
                                      newFormValues.mentorAvailability =
                                        e.target.value;
                                      setFormValues(newFormValues);
                                    }}
                                    name="mentorFrequency"
                                    value={option.value}
                                    className="form-radio"
                                  />
                                  <span>{option.label}</span>
                                  <input
                                    type="number"
                                    onChange={(e) => {
                                      const newFormValues = formValues;
                                      newFormValues.mentorHours =
                                        e.target.value;
                                      setFormValues(newFormValues);
                                    }}
                                    placeholder="Hours"
                                    className="form-style w-24"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                          {/* Preferred Mentoring Format */}
                          <div className="col-span-2">
                            <label
                              className="mb-2.5 block font-medium text-black
dark:text-white"
                            >
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
                                    onChange={(e) => {
                                      // let newFormValues = formValues;
                                      let newFormValues = {
                                        mentorFormat: {},
                                        ...formValues,
                                      };
                                      newFormValues.mentorFormat[
                                        Object.keys(
                                          newFormValues.mentorFormat
                                        ).length
                                      ] = e.target.value;
                                      setFormValues(newFormValues);
                                    }}
                                    name="mentorFormat"
                                    value={format}
                                    className="form-checkbox"
                                  />
                                  <span>{format}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                          {/* Experience & Support */}
                          <div className="col-span-2">
                            <label
                              className="mb-2.5 block font-medium text-black
dark:text-white"
                            >
                              Tell Us About Your Experience and How You Can
                              Support Entrepreneurs
                            </label>
                            <textarea
                              name="mentorExperience"
                              required
                              onChange={(e) => {
                                const newFormValues = formValues;
                                newFormValues.mentorDescription =
                                  e.target.value;
                                setFormValues(newFormValues);
                              }}
                              className="form-style"
                              placeholder="Share your experience and how you can help
entrepreneurs"
                              rows="4"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="mb-2.5 block font-medium text-black dark:text-white">
                              Select Your Top 3 Mentorship Focus Areas
                            </label>
                            <div className="flex flex-wrap gap-4">
                              {[
                                "Business Strategy & Planning",
                                "Financial Management",
                                "Operations & Systems",
                                "Sales & Marketing",
                                "Product & Service Development",
                                "Team & Leadership",
                                "Legal & Compliance",
                                "Impact & Sustainability",
                                "Technology & Digital Transformation",
                                "Investor & Partnership Readiness",
                                "Export Readiness & Market Access",
                                "Personal Development & Soft Skills",
                              ].map((area) => (
                                <label
                                  key={area}
                                  className="flex items-center space-x-2"
                                >
                                  <input
                                    type="checkbox"
                                    name="mentorshipFocus"
                                    value={area}
                                    onChange={(e) => {
                                      const newFormValues = { ...formValues };
                                      const selectedAreas =
                                        newFormValues.mentorshipFocus || [];
                                      if (
                                        e.target.checked &&
                                        selectedAreas.length < 3
                                      ) {
                                        newFormValues.mentorshipFocus = [
                                          ...selectedAreas,
                                          area,
                                        ];
                                      } else if (!e.target.checked) {
                                        newFormValues.mentorshipFocus =
                                          selectedAreas.filter(
                                            (item) => item !== area
                                          );
                                      }
                                      setFormValues(newFormValues);
                                    }}
                                    disabled={
                                      !formValues.mentorshipFocus?.includes(
                                        area
                                      ) &&
                                      formValues.mentorshipFocus?.length >= 3
                                    }
                                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                  />
                                  <span className="text-gray-700 dark:text-gray-300">
                                    {area}
                                  </span>
                                </label>
                              ))}
                            </div>
                            {formValues.mentorshipFocus?.length > 3 && (
                              <p className="text-red-500 text-sm mt-2">
                                Please select only up to 3 focus areas.
                              </p>
                            )}
                          </div>

                          {/* Agreement & Consent */}
                          <div className="col-span-2 space-y-4 mt-12">
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                name="mentorContactConsent"
                                required
                                className="form-checkbox"
                              />
                              <span>
                                I agree to be contacted regarding mentorship
                                opportunities
                              </span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                name="mentorMatchingConsent"
                                required
                                className="form-checkbox"
                              />
                              <span>
                                I consent to my information being used for
                                mentorship matching
                              </span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
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
                    Prev
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
                    Next
                  </button>
                )}
                {(selectedIndex == 1 && role == "Reviewer") ||
                role == "Mentorrr" ? (
                  <button
                    type="submit"
                    className="w-48 cursor-pointer rounded-lg border flex justify-center
border-primary bg-primary py-3 px-3 text-white transition hover:bg-opacity-90"
                  >
                    {loading ? <Spinner /> : "Complete Registration"}
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
                          toast.error("Passwords don't match");
                        }
                      }}
                      className="py-3 px-3 rounded-lg text-white border-slate-400 border
bg-primary"
                    >
                      Next
                    </button>
                  )
                )}
                {selectedIndex == 2 ? (
                  <button
                    type="submit"
                    className="w-48 cursor-pointer rounded-lg border flex justify-center
border-primary bg-primary py-3 px-3 text-white transition hover:bg-opacity-90"
                  >
                    {loading ? <Spinner /> : "Complete Registration"}
                  </button>
                ) : (
                  role != "Reviewer" &&
                  selectedIndex == 3 && (
                    <button
                      type="submit"
                      className="w-48 cursor-pointer rounded-lg border flex justify-center
border-primary bg-primary py-3 px-3 text-white transition hover:bg-opacity-90"
                    >
                      {loading ? <Spinner /> : "Complete Registration"}
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
