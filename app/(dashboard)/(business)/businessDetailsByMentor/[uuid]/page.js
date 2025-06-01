"use client";
import {
  getBusiness,
  updateBusiness,
} from "@/app/controllers/business_controller";
import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Loader from "@/components/common/Loader";
import { toast } from "react-hot-toast";
import { createConversation } from "@/app/controllers/conversation_controller";
import Image from "next/image";
import { UserContext } from "../../../layout";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { createNotification } from "@/app/controllers/notification_controller";
import { assignEntreprenuerToMentor } from "@/app/controllers/mentorEntreprenuerController";
import Spinner from "@/components/spinner";
import { updateUser } from "@/app/controllers/user_controller";
import BusinessDomainScores from "@/components/Charts/BusinessDomainScores";
import PerformanceDistribution from "@/components/Charts/PerformanceDistribution";

const Page = ({ params }) => {
  const { uuid } = params;
  const [business, setBusiness] = useState(null);
  const { userDetails } = useContext(UserContext);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [approving, setApproving] = useState(false);
  const getData = async () => {
    try {
      const data = await getBusiness(uuid);
      setBusiness(data);
      console.log("business", data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching business:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, [uuid]);

  return loading ? (
    <Loader />
  ) : (
    <div>
      <Breadcrumb prevLink="" prevPage="Back" pageName={`${business?.name}`} />
      {/* Stats Section - Full Width */}
      <div className="bg-primary/10 p-6 rounded-xl mb-4 mt-4">
        <h1 className="text-2xl font-bold">Dear {userDetails.name}!</h1>
        <p>
          Welcome to your Mentee Hub. Here, reports generated from
          entrepreneur’s journey . you can view your mentees profile, access
          resources you’ve shared with them , and review your mentoring
          sessions. Use this space to stay informed and provide tailored
          guidance based on each
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6 pt-6">
        {[
          {
            icon: "/profile.png",
            label: "View Profile",
            path: `/businessDetails/${uuid}`,
          },
          {
            icon: "/resource.png",
            label: "Resources",
            path: `/businessDetails/${uuid}`,
          },
          {
            icon: "/report.png",
            label: "Reports",
            path: `/mentorReports`,
          },
        ].map((item) => {
          return (
            <Link
              key={item.path}
              href={item.path}
              className="border border-black/10 bg-white rounded-lg p-5 flex flex-col items-center  space-y-4"
            >
              <img className="h-40" src={item.icon} />
              <h1 className="font-bold text-lg">{item.label}</h1>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Page;
