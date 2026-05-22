"use client";

import { sendInvestmentRequest } from "@/controllers/investment_requests_controller";
import Spinner from "@/components/spinner";
import { useRouter } from "@/utils/navigation";
import { useState } from "react";
import { useTranslation } from "../../../locales";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";

const Page = () => {
  const { t } = useTranslation();

  const uuid = useParams().uuid;

  const router = useRouter();

  const [loading, setloading] = useState(false);

  const handleSubmit = (e) => {
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

    sendInvestmentRequest(data)
      .then(() => {
        setloading(false);

        toast.success("Investment interest submitted successfully");

        router.back();
      })
      .catch(() => {
        setloading(false);

        toast.error("Failed to submit investment interest");
      });
  };

  return (
    <div className="min-h-screen px-6 py-4">
      <div className="relative mb-10 min-h-[320px] overflow-hidden rounded-2xl bg-black shadow-sm">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/images/startups_hero_page.svg')",
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-[#c9672b]/30" />

        <div className="relative z-10 max-w-3xl p-10 text-white">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-sm font-medium shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#f08a3c]" />
            Investment Interest
          </span>

          <h1 className="mb-3 text-4xl font-bold leading-tight drop-shadow-lg">
            Express Investment Interest
          </h1>

          <p className="mb-6 text-lg text-white/85 drop-shadow-md">
            Define your intended investment structure, expected timelines, and
            the support or information you require before proceeding.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#172033]">
              Investment Details
            </h2>

            <p className="mt-1 text-sm text-[#6f6f72]">
              Specify the amount and preferred structure for your investment.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#172033]">
                {t(
                  "investment.enterAmountToInvest",
                  "Enter amount you intend to invest",
                )}
              </label>

              <input
                name="investmentAmount"
                type="number"
                required
                placeholder={t(
                  "investment.enterAmount",
                  "Enter amount",
                )}
                className="w-full rounded-xl border border-black/10 bg-transparent px-4 py-3 text-sm outline-none transition focus:border-green-600 focus:ring-1 focus:ring-green-600"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#172033]">
                {t("investment.selectCurrency", "Select currency")}
              </label>

              <select
                name="currency"
                required
                className="w-full rounded-xl border border-black/10 bg-transparent px-4 py-3 text-sm outline-none transition focus:border-green-600 focus:ring-1 focus:ring-green-600"
              >
                <option>
                  {t("investment.chooseCurrency", "Choose currency")}
                </option>

                <option value="TSH">TSH</option>

                <option value="USD">USD</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#172033]">
                {t(
                  "investment.investmentStructure",
                  "How would you like to structure your investment ?",
                )}
              </label>

              <select
                name="investmentType"
                required
                className="w-full rounded-xl border border-black/10 bg-transparent px-4 py-3 text-sm outline-none transition focus:border-green-600 focus:ring-1 focus:ring-green-600"
              >
                <option>
                  {t(
                    "investment.selectInvestmentType",
                    "Select type of investment",
                  )}
                </option>

                <option value="equity">
                  {t("investment.equity", "Equity")}
                </option>

                <option value="debt">
                  {t("investment.debt", "Debt")}
                </option>

                <option value="mezzanine">
                  {t("investment.mezzanine", "Mezzanine")}
                </option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#172033]">
                {t(
                  "investment.expectedDatesTimelines",
                  "What are your expected dates and timelines ?",
                )}
              </label>

              <input
                name="dueDiligenceDate"
                type="date"
                required
                className="w-full rounded-xl border border-black/10 bg-transparent px-4 py-3 text-sm outline-none transition focus:border-green-600 focus:ring-1 focus:ring-green-600"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#172033]">
              Support Required From Anza
            </h2>

            <p className="mt-1 text-sm text-[#6f6f72]">
              Describe the assistance, facilitation, or support you expect from
              Anza during the investment process.
            </p>
          </div>

          <textarea
            name="helpFromAnza"
            required
            placeholder={t(
              "investment.writeDescription",
              "Write description",
            )}
            className="min-h-[180px] w-full rounded-xl border border-black/10 bg-transparent px-4 py-4 text-sm outline-none transition focus:border-green-600 focus:ring-1 focus:ring-green-600"
          />
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#172033]">
              Additional Information Request
            </h2>

            <p className="mt-1 text-sm text-[#6f6f72]">
              Specify any extra information or documents you would like from
              the entrepreneur or business before proceeding.
            </p>
          </div>

          <textarea
            name="additionalInfo"
            required
            placeholder={t(
              "investment.writeAdditionalInfo",
              "Write additional information here",
            )}
            className="min-h-[180px] w-full rounded-xl border border-black/10 bg-transparent px-4 py-4 text-sm outline-none transition focus:border-green-600 focus:ring-1 focus:ring-green-600"
          />
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div>
            <h3 className="text-xl font-bold text-[#172033]">
              Ready to Submit
            </h3>

            <p className="mt-1 text-sm text-[#6f6f72]">
              Your investment interest will be shared with the entrepreneur and
              reviewed for follow-up engagement.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 border-t border-black/10 pt-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl border border-black/10 bg-transparent px-6 py-3 text-sm font-medium text-[#172033] transition hover:border-green-600 hover:text-green-700"
          >
            Back
          </button>

          <button
            type="submit"
            className="rounded-xl border border-green-600 bg-transparent px-8 py-3 text-sm font-medium text-green-700 transition hover:bg-green-50 disabled:border-gray-300 disabled:text-gray-400"
            disabled={loading}
          >
            {loading ? (
              <Spinner />
            ) : (
              t("investment.expressInterest", "Express interest")
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Page;