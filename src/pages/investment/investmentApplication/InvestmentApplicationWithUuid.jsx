"use client";
import Breadcrumb from "@/component/Breadcrumb";
import { sendInvestmentRequest } from "@/controllers/investment_requests_controller";
import Spinner from "@/components/spinner";
import { useRouter } from "@/utils/navigation";
import { useState } from "react";
import { useTranslation } from "../../../../locales";

const Page = ({ params }) => {
  const { t } = useTranslation();
  const uuid = params.uuid;
  const router = useRouter();
  const [loading, setloading] = useState(false);
  return (
    <div>
      <Breadcrumb
        pageName={t("investment.investmentInterest", "Investment Interest")}
        prevLink={""}
        prevPage={t("business.businesses", "Businesses")}
      />
      <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="py-6 px-4 md:px-6 xl:px-7.5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setloading(true);
              const data = {
                business_uuid: uuid,
                investmentAmount: e.target.investmentAmount.value,
                investmentType: e.target.investmentType.value,
                dueDiligenceDate: e.target.dueDiligenceDate.value,
                helpFromAnza: e.target.helpFromAnza.value,
                additionalInfo: e.target.additionalInfo.value,
                currency: e.target.currency.value,
              };
              sendInvestmentRequest(data).then(() => {
                setloading(false);
                router.back();
              });
            }}
          >
            <div className="grid grid-cols-2 gap-x-3 gap-y-3">
              <div>
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  {t(
                    "investment.enterAmountToInvest",
                    "Enter amount you intend to invest"
                  )}
                </label>
                <input
                  name="investmentAmount"
                  type="number"
                  className="w-full rounded border-stroke"
                  placeholder={t("investment.enterAmount", "Enter amount")}
                />
              </div>
              <div>
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  {t("investment.selectCurrency", "Select currency")}
                </label>
                <select
                  name="currency"
                  className="w-full rounded border-stroke"
                  placeholder=""
                >
                  <option>
                    {t("investment.chooseCurrency", "Choose currency")}
                  </option>
                  <option value="TSH">TSH</option>
                  <option value="USD">USD</option>
                </select>
              </div>

              <div>
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  {t(
                    "investment.investmentStructure",
                    "How would you like to structure your investment ?"
                  )}
                </label>
                <select
                  name="investmentType"
                  className="w-full rounded border-stroke"
                  placeholder=""
                >
                  <option>
                    {t(
                      "investment.selectInvestmentType",
                      "Select type of investment"
                    )}
                  </option>
                  <option value="equity">
                    {t("investment.equity", "Equity")}
                  </option>
                  <option value="debt">{t("investment.debt", "Debt")}</option>
                  <option value="mezzanine">
                    {t("investment.mezzanine", "Mezzanine")}
                  </option>
                </select>
              </div>
              <div>
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  {t(
                    "investment.expectedDatesTimelines",
                    "What are your expected dates and timelines ?"
                  )}
                </label>
                <input
                  name="dueDiligenceDate"
                  type="date"
                  className="w-full rounded border-stroke"
                  placeholder={t("investment.enterAmount", "Enter amount")}
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                {t(
                  "investment.supportFromAnza",
                  "What sort of support would you like to get from Anza ?"
                )}
              </label>
              <textarea
                name="helpFromAnza"
                placeholder={t(
                  "investment.writeDescription",
                  "Write description"
                )}
                className="border-stroke w-full rounded"
              ></textarea>
            </div>
            <div className="mt-3">
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                {t(
                  "investment.additionalInfo",
                  "What additional information do you want from entrepreneur or business ?"
                )}
              </label>
              <textarea
                name="additionalInfo"
                placeholder={t(
                  "investment.writeAdditionalInfo",
                  "Write additional information here"
                )}
                className="border-stroke w-full rounded"
              ></textarea>
            </div>
            <button
              type="submit"
              className="py-2 px-3 mt-4 rounded flex justify-center bg-primary text-white"
            >
              {loading ? (
                <Spinner />
              ) : (
                t("investment.expressInterest", "Express interest")
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Page;
