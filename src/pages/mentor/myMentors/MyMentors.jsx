"use client";

import { useContext, useEffect, useState } from "react";
import { UserContext } from "../../../layouts/DashboardLayout";
import Loader from "@/components/common/Loader";
import Link from "@/utils/link";
import toast from "react-hot-toast";
import NoData from "@/component/noData";
import Image from "@/utils/image";
import { getEntreprenuerMentors } from "@/controllers/mentorship_applications_controllers";
import { acceptMentorEntreprenuerAppointment } from "@/controllers/mentorEntreprenuerController";
import { useTranslation } from "../../../locales";
import { FaCalendarAlt, FaClock, FaVideo, FaUserTie } from "react-icons/fa";

const MentorEntreprenuer = () => {
  const { t } = useTranslation();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userDetails } = useContext(UserContext);
  const [acceptingAppointment, setAcceptingAppointment] = useState(null);

  const getMentorName = (item) => {
    return item?.name || t("mentorHub.unnamedMentor", "Unnamed Mentor");
  };

  useEffect(() => {
    getEntreprenuerMentors(userDetails.uuid, 1, 100, "").then((res) => {
      setData(res);
      setLoading(false);
    });
  }, []);

  const handleAcceptAppointment = async (application) => {
    setAcceptingAppointment(application.uuid);

    try {
      await acceptMentorEntreprenuerAppointment(application.uuid);

      toast.success("Appointment accepted successfully!");

      const res = await getEntreprenuerMentors(
        userDetails.uuid,
        1,
        100,
        "",
      );

      setData(res);
    } catch (error) {
      toast.error("Failed to accept appointment");
      console.error(error);
    } finally {
      setAcceptingAppointment(null);
    }
  };

  const pendingAppointments = data.filter(
    (app) => app.googleMeetLink && !app.menteeAccepted,
  );

  const acceptedAppointments = data.filter(
    (app) => app.googleMeetLink && app.menteeAccepted,
  );

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-[#F5F7FA] px-6 py-6">
      <div className="mx-auto max-w-7xl">

        {/* HERO SECTION */}
        <section className="relative mb-8 overflow-hidden rounded-3xl border border-[#EAECF0] bg-black shadow-sm">
          <div className="absolute inset-0">
            <Image
              src="/images/general_resources_hero.svg"
              alt="Mentorship"
              width={1600}
              height={900}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/20" />

          <div className="relative z-10 flex min-h-[320px] max-w-3xl flex-col justify-center p-8 lg:p-12">
            <span className="mb-6 inline-flex w-fit items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
              Mentorship Hub
            </span>

            <h1 className="mb-4 text-4xl font-bold leading-tight text-white">
              Connect With Expert Mentors
            </h1>

            <p className="mb-8 max-w-2xl text-base leading-8 text-white/85 md:text-lg">
              Access mentorship sessions, schedule meetings, and connect with
              experienced professionals ready to support your entrepreneurial
              growth.
            </p>

            <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-white/90">
              <span className="flex items-center gap-2">
                <FaUserTie />
                {data.length} Mentors
              </span>

              <span className="flex items-center gap-2">
                <FaVideo />
                Virtual Sessions
              </span>

              <span className="flex items-center gap-2">
                <FaClock />
                Flexible Scheduling
              </span>
            </div>
          </div>
        </section>

        {/* PENDING APPOINTMENTS */}
        {pendingAppointments.length > 0 && (
          <section className="mb-8 rounded-3xl border border-yellow-200 bg-yellow-50 p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-700">
                <FaCalendarAlt />
              </div>

              <div>
                <h2 className="text-xl font-bold text-yellow-900">
                  Pending Appointments
                </h2>

                <p className="text-sm text-yellow-700">
                  Accept your upcoming mentorship sessions
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              {pendingAppointments.map((application) => (
                <div
                  key={application.uuid}
                  className="rounded-2xl border border-yellow-100 bg-white p-5"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-[#101828]">
                        {application.Mentor?.name}
                      </h3>

                      <p className="mt-2 text-sm text-[#667085]">
                        {new Date(
                          application.appointmentDate,
                        ).toLocaleString()}
                      </p>

                      <a
                        href={application.googleMeetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-block text-sm font-medium text-[#082d77]"
                      >
                        View Meeting Link
                      </a>
                    </div>

                    <button
                      onClick={() =>
                        handleAcceptAppointment(application)
                      }
                      disabled={
                        acceptingAppointment === application.uuid
                      }
                      className="rounded-xl bg-[#16A34A] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#15803D] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {acceptingAppointment === application.uuid
                        ? "Accepting..."
                        : "Accept Appointment"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* UPCOMING MEETINGS */}
        {acceptedAppointments.length > 0 && (
          <section className="mb-8 rounded-3xl border border-green-200 bg-green-50 p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-green-700">
                <FaVideo />
              </div>

              <div>
                <h2 className="text-xl font-bold text-green-900">
                  Upcoming Meetings
                </h2>

                <p className="text-sm text-green-700">
                  Your confirmed mentorship sessions
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              {acceptedAppointments.map((application) => (
                <div
                  key={application.uuid}
                  className="rounded-2xl border border-green-100 bg-white p-5"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-[#101828]">
                        {application.Mentor?.name}
                      </h3>

                      <p className="mt-2 text-sm text-[#667085]">
                        {new Date(
                          application.appointmentDate,
                        ).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <a
                        href={application.googleMeetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl bg-[#082d77] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#061f52]"
                      >
                        Join Meeting
                      </a>

                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            application.googleMeetLink,
                          );

                          toast.success(
                            "Meeting link copied!",
                          );
                        }}
                        className="rounded-xl border border-[#D0D5DD] bg-white px-5 py-3 text-sm font-semibold text-[#344054] transition hover:bg-[#F9FAFB]"
                      >
                        Copy Link
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* MENTOR SECTION */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-[#101828]">
            My Mentors
          </h2>
        </div>

        {data.length < 1 ? (
          <NoData />
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.map((application, key) => {
              const item = application?.Mentor;

              return (
                <Link
                  href={`/dashboard/myMentorDetails/${item?.uuid || "#"}`}
                  key={key}
                  className="group"
                >
                  <div className="overflow-hidden rounded-3xl border border-[#EAECF0] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">

                    {/* IMAGE */}
                    <div className="relative h-64 overflow-hidden">
                      <Image
                        src={
                          item?.image ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            getMentorName(item),
                          )}&background=082d77&color=fff&size=400`
                        }
                        alt={`${getMentorName(item)} profile`}
                        fill
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                      <div className="absolute bottom-4 left-4">
                        <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#101828] backdrop-blur-sm">
                          {item?.MentorProfile?.expertise ||
                            "Business Mentor"}
                        </span>
                      </div>
                    </div>

                    {/* CONTENT */}
                    <div className="flex flex-col p-6">

                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-[#101828] transition-colors duration-200 group-hover:text-[#082d77]">
                          {getMentorName(item)}
                        </h3>

                        {item?.MentorProfile?.position && (
                          <p className="mt-2 text-sm font-medium text-[#667085]">
                            {item.MentorProfile.position}
                          </p>
                        )}

                        <p className="mt-4 line-clamp-2 text-sm leading-6 text-[#667085]">
                          Experienced mentor helping startups scale,
                          improve operations, and prepare for
                          investment readiness.
                        </p>
                      </div>

                      {/* FOOTER */}
                      <div className="mt-6 flex items-center justify-between border-t border-[#EAECF0] pt-5">

                        <div className="flex items-center gap-2 text-xs font-medium text-[#98A2B3]">
                          <div className="h-2 w-2 rounded-full bg-[#16A34A]" />
                          Available
                        </div>

                        <span className="inline-flex items-center text-sm font-semibold text-[#16A34A] transition-all duration-200 group-hover:translate-x-1 group-hover:text-[#15803D]">
                          View Details
                          <span className="ml-1 text-base">
                            →
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorEntreprenuer;