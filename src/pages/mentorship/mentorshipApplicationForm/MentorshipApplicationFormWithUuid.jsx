"use client";

import Spinner from "../../../components/spinner";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { sendMentorshipApplication } from "../../../controllers/mentorship_applications_controllers";
import toast from "react-hot-toast";
import { useTranslation } from "../../../locales";
import {
  FaArrowRight,
  FaCheckCircle,
  FaLightbulb,
  FaUserGraduate,
} from "react-icons/fa";

const MentorshipApplicationFormWithUuid = () => {
  const { uuid: mentor_uuid } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [loading, setloading] = useState(false);
  const [formValues, setFormValues] = useState({
    mentorshipAreas: {},
  });

  const mentorshipAreas = [
    {
      key: "businessStrategy",
      label: t("mentorshipApplication.businessStrategy", "Business Strategy"),
    },
    {
      key: "financialManagement",
      label: t(
        "mentorshipApplication.financialManagement",
        "Financial Management",
      ),
    },
    {
      key: "marketingSales",
      label: t("mentorshipApplication.marketingSales", "Marketing & Sales"),
    },
    {
      key: "productDevelopment",
      label: t(
        "mentorshipApplication.productDevelopment",
        "Product Development",
      ),
    },
    {
      key: "legalCompliance",
      label: t("mentorshipApplication.legalCompliance", "Legal & Compliance"),
    },
    {
      key: "investmentReadiness",
      label: t(
        "mentorshipApplication.investmentReadiness",
        "Investment Readiness",
      ),
    },
  ];

  const handleCheckboxChange = (checked, value) => {
    let updated = { ...formValues.mentorshipAreas };

    if (checked) {
      updated[Object.keys(updated).length] = value;
    } else {
      updated = Object.fromEntries(
        Object.entries(updated).filter(([, v]) => v !== value),
      );
    }

    setFormValues({
      ...formValues,
      mentorshipAreas: updated,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setloading(true);

    const data = {
      mentor_uuid,
      challenges: e.target.challenges.value,
      mentorshipMode: e.target.mentorshipMode.value,
      availability: e.target.availability.value,
      mentorshipAreas: formValues.mentorshipAreas,
    };

    sendMentorshipApplication(data)
      .then(() => {
        setloading(false);
        toast.success(
          t(
            "mentorshipApplication.applicationSentSuccess",
            "Application sent successfully",
          ),
        );
        navigate(-1);
      })
      .catch(() => {
        setloading(false);
        toast.error("Failed to send application");
      });
  };

  return (
    <div className="min-h-screen px-6 py-4">
      <div className="relative mb-10 min-h-[320px] overflow-hidden rounded-2xl bg-black shadow-sm">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/images/mentor_hero.svg')",
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-[#c9672b]/30" />

        <div className="relative z-10 max-w-3xl p-10 text-white">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-sm font-medium shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#f08a3c]" />
            Entrepreneur Mentorship
          </span>

          <h1 className="mb-3 text-4xl font-bold leading-tight drop-shadow-lg">
            Mentorship Application
          </h1>

          <p className="mb-6 text-lg text-white/85 drop-shadow-md">
            Request personalized mentorship support to strengthen your business,
            improve operational performance, and accelerate venture growth.
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-white/85">
            <span className="flex items-center gap-2">
              <FaUserGraduate />
              Expert Mentorship Access
            </span>

            <span className="flex items-center gap-2">
              <FaLightbulb />
              Growth-Focused Guidance
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#172033]">
              Mentorship Focus Areas
            </h2>

            <p className="mt-1 text-sm text-[#6f6f72]">
              Select the business areas where you need mentorship and strategic
              guidance.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {mentorshipAreas.map((focus) => (
              <label
                key={focus.key}
                className="group flex cursor-pointer items-center gap-4 rounded-2xl border border-black/10 bg-transparent p-5 transition hover:border-green-600 hover:bg-green-50"
              >
                <input
                  type="checkbox"
                  value={focus.label}
                  onChange={(e) =>
                    handleCheckboxChange(e.target.checked, e.target.value)
                  }
                  className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-600"
                />

                <div>
                  <p className="font-semibold text-[#172033]">{focus.label}</p>

                  <p className="mt-1 text-sm text-[#6f6f72]">
                    Get targeted mentorship support in this area.
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#172033]">
              Mentorship Preferences
            </h2>

            <p className="mt-1 text-sm text-[#6f6f72]">
              Define your preferred mentorship engagement format and
              availability.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#172033]">
                Preferred Mentorship Mode
              </label>

              <select
                name="mentorshipMode"
                className="w-full rounded-xl border border-black/10 bg-transparent px-4 py-3 text-sm outline-none transition focus:border-green-600 focus:ring-1 focus:ring-green-600"
              >
                <option>
                  {t(
                    "mentorshipApplication.selectMentorshipMode",
                    "Select mentorship mode",
                  )}
                </option>

                <option value="In-Person">
                  {t("mentorshipApplication.inPerson", "In-Person")}
                </option>

                <option value="Virtual (Zoom, Google Meet, etc.)">
                  {t(
                    "mentorshipApplication.virtual",
                    "Virtual (Zoom, Google Meet, etc.)",
                  )}
                </option>

                <option value="No preference">
                  {t("mentorshipApplication.noPreference", "No preference")}
                </option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#172033]">
                Availability (Days / Times)
              </label>

              <textarea
                name="availability"
                placeholder={t(
                  "mentorshipApplication.availabilityPlaceholder",
                  "Write here...",
                )}
                className="min-h-[120px] w-full rounded-xl border border-black/10 bg-transparent px-4 py-3 text-sm outline-none transition focus:border-green-600 focus:ring-1 focus:ring-green-600"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#172033]">
              Business Challenges
            </h2>

            <p className="mt-1 text-sm text-[#6f6f72]">
              Describe the current challenges, blockers, or support needs your
              business is facing.
            </p>
          </div>

          <textarea
            name="challenges"
            placeholder={t(
              "mentorshipApplication.challengesPlaceholder",
              "Write here...",
            )}
            className="min-h-[180px] w-full rounded-xl border border-black/10 bg-transparent px-4 py-4 text-sm outline-none transition focus:border-green-600 focus:ring-1 focus:ring-green-600"
          />
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-2xl text-green-700">
              <FaCheckCircle />
            </div>

            <div>
              <h3 className="text-xl font-bold text-[#172033]">
                Ready to Submit
              </h3>

              <p className="mt-1 text-sm text-[#6f6f72]">
                Your mentorship request will be reviewed and assigned based on
                mentor expertise and business needs.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-xl border border-black/10 bg-transparent px-6 py-3 text-sm font-medium text-[#172033] transition hover:border-green-600 hover:text-green-700"
          >
            Back
          </button>

          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500"
            disabled={loading}
          >
            {loading ? (
              <Spinner />
            ) : (
              <>
                Send Application
                <FaArrowRight />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MentorshipApplicationFormWithUuid;