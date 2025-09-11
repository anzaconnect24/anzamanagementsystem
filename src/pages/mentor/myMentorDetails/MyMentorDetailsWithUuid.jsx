"use client";
import { getBusiness, updateBusiness } from "@/controllers/business_controller";
import { useContext, useEffect, useState } from "react";
import { useRouter } from "@/utils/navigation";
import { useParams } from "react-router-dom";
import Link from "@/utils/link";
import Loader from "@/components/common/Loader";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Image from "@/utils/image";
import { getUserInfo } from "@/controllers/user_controller";
import { UserContext } from "@/layouts/DashboardLayout";
import { useTranslation } from "../../../locales";

const Page = () => {
  const { t } = useTranslation();
  const { uuid } = useParams();
  const [business, setBusiness] = useState(null);
  const { userDetails } = useContext(UserContext);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const getData = async () => {
    try {
      const data = await getUserInfo(uuid);
      setUser(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching user:", error);
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
      <Breadcrumb
        prevLink=""
        prevPage={t("common.back", "Back")}
        pageName={`${user?.name}`}
      />
      {/* Stats Section - Full Width */}
      <div className="bg-primary/10 p-6 rounded-xl mb-4 mt-4">
        <h1 className="text-2xl font-bold">
          {t("mentorDetails.greeting", "Dear {{name}}!", {
            name: userDetails.name,
          })}
        </h1>
        <p>
          {t(
            "mentorDetails.welcome",
            "Welcome to your Mentor Hub. Here, you will find reports from your mentor. You can view your mentor profile, access resources shared by your mentor, and review your mentoring sessions."
          )}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6 pt-6">
        {[
          {
            icon: "/profile.png",
            label: t("mentorDetails.viewProfile", "View Profile"),
            path: `/dashboard/mentors/${uuid}`,
          },
          {
            icon: "/resource.png",
            label: t("mentorDetails.resources", "Resources"),
            path: `#`,
          },
          {
            icon: "/report.png",
            label: t("mentorDetails.reports", "Reports"),
            path: `#`,
          },
        ].map((item) => {
          return (
            <Link
              key={item.path}
              href={item.path}
              className="border border-black/10 bg-white rounded-lg p-5 flex flex-col items-center  space-y-4"
            >
              <Image
                width={1000}
                height={1000}
                alt={item.label}
                className="h-40 w-40"
                src={item.icon}
              />
              <h1 className="font-bold text-lg">{item.label}</h1>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Page;
