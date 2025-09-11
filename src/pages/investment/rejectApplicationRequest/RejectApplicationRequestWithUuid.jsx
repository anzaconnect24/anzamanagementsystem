"use client";
import { useEffect, useState } from "react";
import Link from "@/utils/link";
import Loader from "@/components/common/Loader";
import { useRouter } from "@/utils/navigation";
import Breadcrumb from "@/component/Breadcrumb";
import { updateProgramApplication } from "@/controllers/program_application_controller";
import { updateInvestmentRequest } from "@/controllers/investment_requests_controller";
import { useTranslation } from "../../../locales";
import { useParams } from "react-router-dom";
// import {Breadcrumb} from "@/component/Breadcrumb"
const Page = ({ params }) => {
  const uuid = useParams().uuid;
  const { t } = useTranslation();
  const router = useRouter();

  const [loading, setloading] = useState(true);
  useEffect(() => {}, []);

  return (
    <div>
      <Breadcrumb
        prevLink={``}
        prevPage={t("users.applicationDetails", "Application details")}
        pageName={t("users.applicationRejection", "Application rejection")}
      />
      <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="py-6 px-4 md:px-6 xl:px-7.5">
          <h4 className="text-xl font-semibold text-black dark:text-white">
            {t("users.rejectionFeedback", "Rejection feedback")}
          </h4>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const data = {
                status: "rejected",
                feedback: e.target.message.value,
              };
              updateInvestmentRequest(uuid, data).then(() => {
                router.back();
                router.back();
              });
            }}
          >
            <textarea
              required
              name="message"
              className=" border-stroke rounded py-3 w-full"
              placeholder={t(
                "users.rejectionReasonPlaceholder",
                "Write reasons for rejection"
              )}
            />
            <button
              className="bg-primary py-3 mt-3 rounded hover:opacity-95 px-4 text-white"
              type="submit"
            >
              {t("users.sendFeedback", "Send feedback")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Page;
