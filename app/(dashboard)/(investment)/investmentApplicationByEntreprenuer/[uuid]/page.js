"use client";
import Breadcrumb from "@/app/component/Breadcrumb";
import Spinner from "@/components/spinner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { sendMentorshipApplication } from "@/app/controllers/mentorship_applications_controllers";
import toast from "react-hot-toast";
import { uploadFile } from "@/app/controllers/file_upload_controller";
import { sendInvestmentApplication } from "@/app/controllers/investment_applications_controllers";
import { useTranslation } from "@/app/locales";

const Page = ({ params }) => {
  const { t } = useTranslation();
  const investor_uuid = params.uuid;
  const router = useRouter();
  const [loading, setloading] = useState(false);
  const [formValues, setFormValues] = useState({});

  const optionLabel = (val) => {
    switch (val) {
      case "Equity":
        return t("users.equity", "Equity");
      case "Convertible Note":
        return t("users.convertibleNote", "Convertible Note");
      case "Revenue Share":
        return t("users.revenueShare", "Revenue Share");
      case "Loan":
        return t("users.loan", "Loan");
      case "Not Sure":
        return t("users.notSure", "Not Sure");
      default:
        return val;
    }
  };
  return (
    <div>
      <Breadcrumb
        pageName={t("investmentApplication.title", "Investment Application")}
        prevLink={""}
        prevPage={t("common.back", "Back")}
      />
      <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="py-6 px-4 md:px-6 xl:px-7.5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setloading(true);
              var formData = new FormData();
              formData.append("file", e.target.pitchdeck.files[0]);
              uploadFile(formData).then((url) => {
                const data = {
                  investor_uuid,
                  amount: e.target.amount.value,
                  offerToInvestor: e.target.offerToInvestor.value,
                  purposeOfInvestment: e.target.purposeOfInvestment.value,
                  pitchdeck: url,
                };
                console.log(data);
                sendInvestmentApplication(data).then(() => {
                  setloading(false);
                  toast.success(
                    t(
                      "investmentApplication.success",
                      "Application sent successfully"
                    )
                  );
                  router.back();
                });
              });
            }}
          >
            <div className="grid grid-cols-2 gap-x-3 gap-y-3">
              <div>
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  {t(
                    "investmentApplication.offerQuestion",
                    "What are you offering to the investor?"
                  )}
                </label>
                <select
                  name="offerToInvestor"
                  required
                  className="w-full rounded border-stroke"
                  placeholder=""
                >
                  <option>
                    {t("investmentApplication.selectItem", "Select item")}
                  </option>
                  {[
                    "Equity",
                    "Convertible Note",
                    "Revenue Share",
                    "Loan",
                    "Not Sure",
                  ].map((item) => (
                    <option key={item} value={item}>
                      {optionLabel(item)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-3">
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                {t(
                  "investmentApplication.amountLabel",
                  "Amount of Investment Requested (TZS/USD)"
                )}
              </label>
              <input
                name="amount"
                type="number"
                required
                placeholder={t(
                  "investmentApplication.amountPlaceholder",
                  "Write here..."
                )}
                className="border-stroke w-full rounded"
              ></input>
            </div>
            <div className="mt-3">
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                {t(
                  "investmentApplication.purposeLabel",
                  "Purpose of investment"
                )}
              </label>
              <textarea
                name="purposeOfInvestment"
                required
                placeholder={t(
                  "investmentApplication.purposePlaceholder",
                  "Write here..."
                )}
                className="border-stroke w-full rounded"
              ></textarea>
            </div>
            <div className="mt-3">
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                {t(
                  "investmentApplication.attachPitchdeck",
                  "Attach your pitchdeck"
                )}
              </label>
              <input
                name="pitchdeck"
                type="file"
                required
                placeholder="Write here..."
                className="border-stroke w-full rounded"
              ></input>
            </div>
            <button
              type="submit"
              className="py-2 px-3 mt-4 rounded flex justify-center bg-primary text-white"
            >
              {loading ? (
                <Spinner />
              ) : (
                t("investmentApplication.sendApplication", "Send Application")
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Page;
