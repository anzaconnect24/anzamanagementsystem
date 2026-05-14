"use client";

import Spinner from "@/components/spinner";
import { useRouter } from "@/utils/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { uploadFile } from "@/controllers/file_upload_controller";
import { sendInvestmentApplication } from "@/controllers/investment_applications_controllers";
import { useTranslation } from "@/locales";
import { useParams } from "react-router-dom";

const Page = () => {
  const { t } = useTranslation();
  const { uuid } = useParams();

  const investor_uuid = uuid;

  const router = useRouter();

  const [loading, setloading] = useState(false);

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

  const handleSubmit = (e) => {
    e.preventDefault();

    setloading(true);

    const formData = new FormData();

    formData.append("file", e.target.pitchdeck.files[0]);

    uploadFile(formData)
      .then((url) => {
        const data = {
          investor_uuid,
          amount: e.target.amount.value,
          offerToInvestor: e.target.offerToInvestor.value,
          purposeOfInvestment: e.target.purposeOfInvestment.value,
          pitchdeck: url,
        };

        sendInvestmentApplication(data).then(() => {
          setloading(false);

          toast.success(
            t(
              "investmentApplication.success",
              "Application sent successfully",
            ),
          );

          router.back();
        });
      })
      .catch(() => {
        setloading(false);

        toast.error("Failed to submit application");
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
            Investment Application
          </span>

          <h1 className="mb-3 text-4xl font-bold leading-tight drop-shadow-lg">
            Raise Investment Capital
          </h1>

          <p className="mb-6 text-lg text-white/85 drop-shadow-md">
            Submit your investment request, define your funding structure, and
            share the strategic purpose behind your capital raise.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#172033]">
              Investment Structure
            </h2>

            <p className="mt-1 text-sm text-[#6f6f72]">
              Define what type of investment arrangement you are proposing to
              the investor.
            </p>
          </div>

          <label className="mb-2 block text-sm font-medium text-[#172033]">
            What are you offering to the investor?
          </label>

          <select
            name="offerToInvestor"
            required
            className="w-full rounded-xl border border-black/10 bg-transparent px-4 py-3 text-sm outline-none transition focus:border-green-600 focus:ring-1 focus:ring-green-600"
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

        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#172033]">
              Funding Requirement
            </h2>

            <p className="mt-1 text-sm text-[#6f6f72]">
              Specify the amount of capital your business is seeking.
            </p>
          </div>

          <label className="mb-2 block text-sm font-medium text-[#172033]">
            Amount of Investment Requested (TZS/USD)
          </label>

          <input
            name="amount"
            type="number"
            required
            placeholder={t(
              "investmentApplication.amountPlaceholder",
              "Write here...",
            )}
            className="w-full rounded-xl border border-black/10 bg-transparent px-4 py-3 text-sm outline-none transition focus:border-green-600 focus:ring-1 focus:ring-green-600"
          />
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#172033]">
              Purpose of Investment
            </h2>

            <p className="mt-1 text-sm text-[#6f6f72]">
              Explain how the investment will be deployed to grow or strengthen
              your business.
            </p>
          </div>

          <textarea
            name="purposeOfInvestment"
            required
            placeholder={t(
              "investmentApplication.purposePlaceholder",
              "Write here...",
            )}
            className="min-h-[180px] w-full rounded-xl border border-black/10 bg-transparent px-4 py-4 text-sm outline-none transition focus:border-green-600 focus:ring-1 focus:ring-green-600"
          />
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#172033]">
              Upload Pitch Deck
            </h2>

            <p className="mt-1 text-sm text-[#6f6f72]">
              Share your business pitch deck or investor presentation.
            </p>
          </div>

          <input
            name="pitchdeck"
            type="file"
            required
            className="w-full rounded-xl border border-dashed border-black/20 bg-transparent px-4 py-5 text-sm outline-none transition hover:border-green-600"
          />

          <p className="mt-2 text-xs text-[#8a8f98]">
            Upload PDF, PPT, PPTX or presentation documents.
          </p>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div>
            <h3 className="text-xl font-bold text-[#172033]">
              Ready to Submit
            </h3>

            <p className="mt-1 text-sm text-[#6f6f72]">
              Your investment application will be reviewed and matched with
              suitable investors.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl border border-black/10 bg-transparent px-6 py-3 text-sm font-medium text-[#172033] transition hover:border-blue-600 hover:text-blue-700"
          >
            Back
          </button>

          <button
            type="submit"
            className="rounded-xl bg-blue-600 px-8 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500"
            disabled={loading}
          >
            {loading
              ? <Spinner />
              : t(
                  "investmentApplication.sendApplication",
                  "Send Application",
                )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Page;