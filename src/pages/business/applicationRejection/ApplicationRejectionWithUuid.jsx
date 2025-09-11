"use client";
import { getBusiness, updateBusiness } from "@/controllers/business_controller";
import { useEffect, useState } from "react";
import Link from "@/utils/link";
import Loader from "@/components/common/Loader";
import { useRouter } from "@/utils/navigation";
import { useTranslation } from "@/locales";
import Breadcrumb from "../../../component/Breadcrumb";
import { useParams } from "react-router-dom";

const Page = ({ params }) => {
  const { t } = useTranslation();
  const uuid = useParams().uuid;
  const router = useRouter();
  const [business, setBusiness] = useState(null);
  const [loading, setloading] = useState(true);

  useEffect(() => {
    getBusiness(uuid).then((data) => setBusiness(data));
  }, [uuid]);

  if (!business) return <Loader />;

  return (
    <div>
      <Breadcrumb
        prevLink={``}
        prevPage={t("business.applicationDetails", "Application details")}
        pageName={t("business.applicationRejection", "Application rejection")}
      />
      <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="py-6 px-4 md:px-6 xl:px-7.5">
          <h4 className="text-xl font-semibold text-black dark:text-white">
            {t("business.rejectionFeedback", "Rejection feedback")}
          </h4>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const data = {
                status: "rejected",
                feedbackMessage: e.target.message.value,
              };
              updateBusiness(data, uuid).then(() => {
                router.back();
                router.back();
              });
            }}
          >
            <textarea
              required
              name="message"
              className=" bg-stroke w-full"
              placeholder={t(
                "business.rejectionReasonPlaceholder",
                "Write reasons for rejection"
              )}
            />
            <button className="bg-primary py-3 px-4 text-white" type="submit">
              {t("business.sendFeedback", "Send feedback")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Page;
