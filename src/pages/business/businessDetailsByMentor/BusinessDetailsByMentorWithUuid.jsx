"use client";

import { getBusiness } from "@/controllers/business_controller";
import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Link from "@/utils/link";
import Loader from "@/components/common/Loader";
import { UserContext } from "../../../layouts/DashboardLayout";
import {
  setupMentorEntreprenuerMeeting,
  getMentorAssignedEntreprenuers,
} from "@/controllers/mentorEntreprenuerController";
import toast from "react-hot-toast";
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaExternalLinkAlt,
  FaFileAlt,
  FaGoogle,
  FaRegUserCircle,
  FaTimes,
  FaUserGraduate,
  FaArrowRight,
} from "react-icons/fa";

const Page = () => {
  const { uuid } = useParams();
  const [business, setBusiness] = useState(null);
  const { userDetails } = useContext(UserContext);

  const [loading, setLoading] = useState(true);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [googleMeetLink, setGoogleMeetLink] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [settingUpMeeting, setSettingUpMeeting] = useState(false);
  const [mentorshipApplication, setMentorshipApplication] = useState(null);

  const getData = async () => {
    try {
      setLoading(true);

      const data = await getBusiness(uuid);
      setBusiness(data);

      const approvedRelationships = await getMentorAssignedEntreprenuers(
        userDetails.uuid
      );

      const relationship = approvedRelationships.find(
        (rel) => rel.Entreprenuer?.Business?.uuid === uuid
      );

      if (relationship) {
        setMentorshipApplication(relationship);

        if (relationship.googleMeetLink) {
          setGoogleMeetLink(relationship.googleMeetLink);
        }

        if (relationship.appointmentDate) {
          setAppointmentDate(relationship.appointmentDate.slice(0, 16));
        }
      }
    } catch (error) {
      console.error("Error fetching business:", error);
      toast.error("Failed to load mentee hub");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (uuid && userDetails?.uuid) getData();
  }, [uuid, userDetails?.uuid]);

  const handleSetupMeeting = async (e) => {
    e.preventDefault();

    if (!mentorshipApplication) {
      toast.error("Mentor-Entrepreneur relationship not found");
      return;
    }

    setSettingUpMeeting(true);

    try {
      await setupMentorEntreprenuerMeeting(mentorshipApplication.uuid, {
        googleMeetLink,
        appointmentDate: new Date(appointmentDate).toISOString(),
      });

      toast.success("Meeting scheduled successfully. Mentee will be notified.");
      setShowMeetingModal(false);
      getData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to schedule meeting");
    } finally {
      setSettingUpMeeting(false);
    }
  };

  if (loading) return <Loader />;

  const actionCards = [
    {
      icon: <FaRegUserCircle />,
      label: "View Profile",
      description: "Review business details, founder profile, and venture data.",
      path: `/dashboard/enterprenuers/businessDetails/${uuid}`,
    },
    {
      icon: <FaFileAlt />,
      label: "Submit Report",
      description: "Capture mentoring notes, progress updates, and next steps.",
      path: `/dashboard/addEntreprenuerReport/${business?.User?.uuid}`,
    },
    {
      icon: <FaUserGraduate />,
      label: "View Reports",
      description: "Track previous reports, session outcomes, and milestones.",
      path: `/dashboard/entrepreneurReports/${business?.User?.uuid}`,
    },
  ];

  return (
    <div className="min-h-screen px-6 py-4">
      <div className="relative mb-8 min-h-[320px] overflow-hidden rounded-2xl bg-black shadow-sm">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/mentor_hero.svg')" }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-[#c9672b]/30" />

        <div className="relative z-10 max-w-3xl p-10 text-white">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-sm font-medium shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#f08a3c]" />
            Mentee Hub
          </span>

          <h1 className="mb-3 text-4xl font-bold leading-tight drop-shadow-lg">
            {business?.name || "Business Profile"}
          </h1>

          <p className="mb-6 text-lg text-white/85 drop-shadow-md">
            Manage mentoring sessions, review entrepreneur progress, submit
            reports, and access the information needed to provide focused,
            evidence-based guidance.
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-white/85">
            <span className="flex items-center gap-2">
              <FaUserGraduate />
              Mentor: {userDetails?.name || "Assigned Mentor"}
            </span>

            <span className="flex items-center gap-2">
              <FaCalendarAlt />
              Session Management
            </span>
          </div>
        </div>
      </div>

      {mentorshipApplication && (
        <div className="mb-8 rounded-2xl border border-black/10 p-6 backdrop-blur-sm">
          <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-bold text-[#172033]">
                Meeting Status
              </h2>
              <p className="mt-1 text-sm text-[#6f6f72]">
                Schedule, update, and monitor the current mentoring appointment.
              </p>
            </div>

            <span
              className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
                mentorshipApplication.menteeAccepted
                  ? "bg-green-50 text-blue-700"
                  : "bg-yellow-50 text-yellow-700"
              }`}
            >
              {mentorshipApplication.menteeAccepted ? (
                <FaCheckCircle />
              ) : (
                <FaClock />
              )}
              {mentorshipApplication.menteeAccepted
                ? "Accepted by Mentee"
                : "Waiting for Mentee Acceptance"}
            </span>
          </div>

          {mentorshipApplication.googleMeetLink ? (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-black/10 p-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#8a8f98]">
                  Meeting Link
                </p>

                <a
                  href={mentorshipApplication.googleMeetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:underline"
                >
                  Open Google Meet
                  <FaExternalLinkAlt className="text-xs" />
                </a>
              </div>

              <div className="rounded-xl border border-black/10 p-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#8a8f98]">
                  Appointment Date
                </p>

                <p className="text-sm font-semibold text-[#172033]">
                  {mentorshipApplication.appointmentDate
                    ? new Date(
                        mentorshipApplication.appointmentDate
                      ).toLocaleString()
                    : "Not set"}
                </p>
              </div>

              <div className="flex items-center rounded-xl border border-black/10 p-4">
                <button
                  onClick={() => setShowMeetingModal(true)}
                  className="w-full rounded-lg border border-blue-600 bg-transparent px-5 py-3 text-sm font-medium text-blue-700 transition hover:bg-blue-50"
                >
                  Update Meeting
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-black/10 p-6">
              <p className="mb-4 text-sm text-[#6f6f72]">
                No meeting has been scheduled yet.
              </p>

              <button
                onClick={() => setShowMeetingModal(true)}
                className="rounded-lg border border-blue-600 bg-transparent px-5 py-3 text-sm font-medium text-blue-700 transition hover:bg-blue-50"
              >
                Schedule Google Meet
              </button>
            </div>
          )}
        </div>
      )}

      <h2 className="mb-5 text-2xl font-bold text-[#172033]">
        Mentee Actions
      </h2>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {actionCards.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className="group rounded-2xl border border-black/10 p-6 backdrop-blur-sm transition duration-200 hover:scale-[1.02] hover:shadow-lg"
          >
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-green-50 text-2xl text-blue-700">
              {item.icon}
            </div>

            <h3 className="mb-2 text-lg font-bold text-[#111827]">
              {item.label}
            </h3>

            <p className="mb-6 text-sm leading-6 text-[#6f6f72]">
              {item.description}
            </p>

            <div className="flex items-center justify-between border-t border-black/10 pt-4 text-sm font-medium text-blue-700">
              <span>Continue</span>
              <FaArrowRight className="transition group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </div>

      {showMeetingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[#172033]">
                  Setup Google Meet
                </h2>
                <p className="mt-1 text-sm text-[#6f6f72]">
                  Add the meeting link and appointment date for this mentee.
                </p>
              </div>

              <button
                onClick={() => setShowMeetingModal(false)}
                className="rounded-full p-2 text-[#8a8f98] transition hover:bg-[#f8f8f6] hover:text-[#172033]"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSetupMeeting} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#172033]">
                  Google Meet Link <span className="text-red-500">*</span>
                </label>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="url"
                    value={googleMeetLink}
                    onChange={(e) => setGoogleMeetLink(e.target.value)}
                    placeholder="https://meet.google.com/xxx-xxxx-xxx"
                    className="flex-1 rounded-lg border border-black/10 px-4 py-3 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
                    required
                  />

                  <button
                    type="button"
                    onClick={() =>
                      window.open("https://meet.google.com/new", "_blank")
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-600 bg-transparent px-4 py-3 text-sm font-medium text-blue-700 transition hover:bg-blue-50"
                  >
                    <FaGoogle />
                    Generate
                  </button>
                </div>

                <p className="mt-2 text-xs text-[#8a8f98]">
                  Generate a Meet link, then copy and paste it into the field.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#172033]">
                  Appointment Date <span className="text-red-500">*</span>
                </label>

                <input
                  type="datetime-local"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="w-full rounded-lg border border-black/10 px-4 py-3 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
                  required
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowMeetingModal(false)}
                  className="flex-1 rounded-lg border border-black/10 bg-transparent px-4 py-3 text-sm font-medium text-[#6f6f72] transition hover:border-green-600 hover:text-blue-700"
                  disabled={settingUpMeeting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="flex-1 rounded-lg border border-blue-600 bg-transparent px-4 py-3 text-sm font-medium text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400"
                  disabled={settingUpMeeting}
                >
                  {settingUpMeeting ? "Scheduling..." : "Schedule Meeting"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;