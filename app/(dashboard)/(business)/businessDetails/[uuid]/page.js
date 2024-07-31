"use client";
import {
  getBusiness,
  updateBusiness,
} from "@/app/controllers/business_controller";
import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Loader from "@/components/common/Loader";
import Breadcrumb from "../../../../component/Breadcrumb";
import { updateUser } from "@/app/controllers/user_controller";
import { toast } from "react-hot-toast";
import { createConversation } from "@/app/controllers/conversation_controller";
import Image from "next/image";
import { UserContext } from "../../../layout";
import { createNotification } from "@/app/controllers/notification_controller";

const Page = ({ params }) => {
  const uuid = params.uuid;
  const [business, setBusiness] = useState(null);
  const { userDetails } = useContext(UserContext);
  const router = useRouter();
  const [loading, setloading] = useState(true);
  useEffect(() => {
    getBusiness(uuid).then((data) => {
      setloading(false);
      setBusiness(data);
    });
  }, []);

  return loading ? (
    <Loader />
  ) : (
    <div>
      <Breadcrumb
        prevLink=""
        prevPage="Businesses"
        pageName="Business details"
      />
      <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="py-6 px-4 md:px-6 xl:px-7.5">
          <div className="space-y-3">
            {[
              {
                title: "Enterprenuer name",
                value: business.User && business.User.name,
              },
              { title: "Company Name", value: business.name },
              {
                title: "Anza Alumni ?",
                value: business.isAlumni ? "Yes" : "false",
              },
              { title: "Attended (program)", value: business.completedProgram },
              { title: "Sustainable Development Goal", value: business.sdg },
              { title: "Company phone", value: business.phone },
              { title: "Company email", value: business.email },
              { title: "Business sector", value: business.BusinessSector.name },
              { title: "Registration", value: business.registration },
              { title: "Company stage", value: business.stage },
              { title: "Problem statement", value: business.problem },
              { title: "Solution", value: business.solution },
              { title: "Traction", value: business.traction },
            ].map((item, key) => {
              return (
                <div className="flex" key={key}>
                  <div className="w-4/12">{item.title}:</div>
                  <div className="w-8/12 text-black">{item.value}</div>
                </div>
              );
            })}
          </div>
          {business.companyProfile != null && (
            <div className="flex mt-4">
              <div className="w-4/12">Company profile:</div>
              <div className="w-8/12 grid grid-cols-3 text-black">
                <div className="h-full">
                  <a
                    target="_blank"
                    href={business.companyProfile}
                    className="py-4 cursor-pointer px-4 ring-1 flex flex-col items-center justify-center  ring-stroke hover:shadow"
                  >
                    {/* {item.link} */}
                    <div>
                      <Image
                        height="1000"
                        alt=""
                        width="1000"
                        className="h-16 w-16"
                        src="/pdf.png"
                      />
                    </div>
                    <div className="mt-3 text-black text-center">
                      Company profile
                    </div>
                  </a>
                </div>
              </div>
            </div>
          )}
          {["Admin", "Investor", "Reviewer"].includes(userDetails.role) && (
            <div>
              {business.businessPlan != null && (
                <div className="flex mt-4">
                  <div className="w-4/12">Business plan:</div>
                  <div className="w-8/12 grid grid-cols-3 text-black">
                    <div className="h-full">
                      <a
                        target="_blank"
                        href={business.businessPlan}
                        className="py-4 cursor-pointer px-4 ring-1 flex flex-col items-center justify-center  ring-stroke hover:shadow"
                      >
                        {/* {item.link} */}
                        <div>
                          <Image
                            height="1000"
                            width="1000"
                            alt=""
                            className="h-16 w-16"
                            src="/pdf.png"
                          />
                        </div>
                        <div className="mt-3 text-black text-center">
                          Business plan
                        </div>
                      </a>
                    </div>
                  </div>
                </div>
              )}
              {business.marketResearch != null && (
                <div className="flex mt-4">
                  <div className="w-4/12">Market research:</div>
                  <div className="w-8/12 grid grid-cols-3 text-black">
                    <div className="h-full">
                      <a
                        target="_blank"
                        href={business.marketResearch}
                        className="py-4 cursor-pointer px-4 ring-1 flex flex-col items-center justify-center  ring-stroke hover:shadow"
                      >
                        {/* {item.link} */}
                        <div>
                          <Image
                            height="1000"
                            alt=""
                            width="1000"
                            className="h-16 w-16"
                            src="/pdf.png"
                          />
                        </div>
                        <div className="mt-3 text-black text-center">
                          market research
                        </div>
                      </a>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex mt-4">
                <div className="w-4/12">Documents:</div>
                <div className="w-8/12 text-black">
                  <div className="grid grid-cols-3 gap-4">
                    {business.BusinessDocuments.map((item, key) => {
                      return (
                        <div key={key} className="h-full">
                          <a
                            href={item.link}
                            target="_blank"
                            className="py-4 cursor-pointer px-4 ring-1 flex flex-col items-center justify-center  ring-stroke hover:shadow"
                            key={key}
                          >
                            {/* {item.link} */}
                            <div>
                              <Image
                                height="1000"
                                alt=""
                                width="1000"
                                className="h-16 w-16"
                                src="/pdf.png"
                              />
                            </div>
                            <div className="mt-3 text-black text-center">
                              {item.title}
                            </div>
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex space-x-2 mt-8">
            <div
              onClick={() => {
                const data = {
                  to: business.User.uuid,
                  type: "userToUser",
                  lastMessage: "",
                };
                toast.success("Enabling end-to-end encryption. Please wait...");
                createNotification({
                  user_uuid: business.User.uuid,
                  to: "User",
                  message: `You have a new message`,
                });
                createConversation(data).then((data) => {
                  router.push(`/messages/${data.uuid}`);
                });
              }}
              className="bg-success cursor-pointer  py-3 rounded hover:opacity-95
         px-4 text-white"
            >
              Message
            </div>
            {userDetails.role == "Investor" && (
              <Link
                href={`/investmentApplication/${uuid}`}
                className="bg-black  py-3 rounded hover:opacity-95
            px-4 text-white"
              >
                Call for Investment
              </Link>
            )}
          </div>
          {business.status == "waiting" && (
            <div className="flex space-x-3  pt-8">
              <div
                onClick={() => {
                  updateBusiness({ status: "accepted" }, uuid).then(() => {
                    updateUser({ activated: true }, business.User.uuid).then(
                      (data) => {
                        router.back();
                        toast.success("Accepted successfully");
                      }
                    );
                  });
                }}
                className="bg-primary py-3 rounded px-4 cursor-pointer  hover:opacity-95 text-white"
              >
                Accept
              </div>
              <Link
                href={`/applicationRejection/${uuid}`}
                className="bg-danger py-3 rounded hover:opacity-95
         px-4 text-white"
              >
                Reject application
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Page;
