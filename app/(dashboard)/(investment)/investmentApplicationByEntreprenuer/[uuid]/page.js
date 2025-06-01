"use client";
import Breadcrumb from "@/app/component/Breadcrumb";
import Spinner from "@/components/spinner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { sendMentorshipApplication } from "@/app/controllers/mentorship_applications_controllers";
import toast from "react-hot-toast";
import { uploadFile } from "@/app/controllers/file_upload_controller";
import { sendInvestmentApplication } from "@/app/controllers/investment_applications_controllers";

const Page = ({ params }) => {
  const investor_uuid = params.uuid;
  const router = useRouter();
  const [loading, setloading] = useState(false);
  const [formValues, setFormValues] = useState({});
  return (
    <div>
      <Breadcrumb
        pageName={"Investment Application"}
        prevLink={""}
        prevPage={"Back"}
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
                  toast.success("Application sent successfully");
                  router.back();
                });
              });
            }}
          >
            <div className="grid grid-cols-2 gap-x-3 gap-y-3">
              <div>
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  What are you offering to the investor?
                </label>
                <select
                  name="offerToInvestor"
                  required
                  className="w-full rounded border-stroke"
                  placeholder=""
                >
                  <option>Select item</option>
                  {[
                    "Equity",
                    "Convertible Note",
                    "Revenue Share",
                    "Loan",
                    "Not Sure",
                  ].map((item) => (
                    <option value={item}>{item}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-3">
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                Amount of Investment Requested (TZS/USD)
              </label>
              <input
                name="amount"
                type="number"
                required
                placeholder="Write here..."
                className="border-stroke w-full rounded"
              ></input>
            </div>
            <div className="mt-3">
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                Purpose of investment
              </label>
              <textarea
                name="purposeOfInvestment"
                required
                placeholder="Write here..."
                className="border-stroke w-full rounded"
              ></textarea>
            </div>
            <div className="mt-3">
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                Attach your pitchdeck
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
              {loading ? <Spinner /> : "Send Application"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Page;
