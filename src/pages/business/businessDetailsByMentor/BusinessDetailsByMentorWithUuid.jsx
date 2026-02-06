"use client";
import { getBusiness, updateBusiness } from "@/controllers/business_controller";
import { useContext, useEffect, useState } from "react";
import { useRouter } from "@/utils/navigation";
import { useParams } from "react-router-dom";
import Link from "@/utils/link";
import Loader from "@/components/common/Loader";
import { UserContext } from "../../../layouts/DashboardLayout";
import {
  setupMentorEntreprenuerMeeting,
  getMentorAssignedEntreprenuers,
} from "@/controllers/mentorEntreprenuerController";
import toast from "react-hot-toast";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";

const Page = () => {
  const { uuid } = useParams();
  const [business, setBusiness] = useState(null);
  const { userDetails } = useContext(UserContext);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [googleMeetLink, setGoogleMeetLink] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [settingUpMeeting, setSettingUpMeeting] = useState(false);
  const [mentorshipApplication, setMentorshipApplication] = useState(null);

  const getData = async () => {
    try {
      const data = await getBusiness(uuid);
      setBusiness(data);
      console.log("business", data);

      // Get approved mentorship relationship for this business
      const approvedRelationships = await getMentorAssignedEntreprenuers(
        userDetails.uuid,
      );
      console.log("approvedRelationships", approvedRelationships);
      const relationship = approvedRelationships.find(
        (rel) => rel.Entreprenuer?.Business?.uuid === uuid,
      );
      console.log("relationship", relationship);
      if (relationship) {
        const application = relationship;
        setMentorshipApplication(application);
        if (application.googleMeetLink) {
          setGoogleMeetLink(application.googleMeetLink);
        }
        if (application.appointmentDate) {
          setAppointmentDate(application.appointmentDate.split("T")[0]);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching business:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, [uuid]);

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
      toast.success("Meeting scheduled successfully! Mentee will be notified.");
      setShowMeetingModal(false);
      getData();
    } catch (error) {
      toast.error("Failed to setup meeting");
      console.error(error);
    } finally {
      setSettingUpMeeting(false);
    }
  };

  return loading ? (
    <Loader />
  ) : (
    <div>
      <Breadcrumb prevLink="" prevPage="Back" pageName={`${business?.name}`} />
      {/* Stats Section - Full Width */}
      <div className="bg-primary/10 p-6 rounded-xl mb-4 mt-4">
        <h1 className="text-2xl font-bold">Dear {userDetails.name}!</h1>
        <p>
          Welcome to your Mentee Hub. Here, reports generated from
          entrepreneur’s journey . you can view your mentees profile, access
          resources you’ve shared with them , and review your mentoring
          sessions. Use this space to stay informed and provide tailored
          guidance based on each
        </p>
      </div>

      {/* Meeting Status */}
      {mentorshipApplication && (
        <div className="bg-white shadow rounded-lg p-6 mb-4">
          <h2 className="text-xl font-bold mb-4">Meeting Status</h2>
          {mentorshipApplication.googleMeetLink ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600">Meeting Link:</p>
                  <a
                    href={mentorshipApplication.googleMeetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {mentorshipApplication.googleMeetLink}
                  </a>
                </div>
              </div>
              <div>
                <p className="text-gray-600">Appointment Date:</p>
                <p className="font-medium">
                  {new Date(
                    mentorshipApplication.appointmentDate,
                  ).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Status:</p>
                <span
                  className={`inline-block px-3 py-1 rounded text-sm ${
                    mentorshipApplication.menteeAccepted
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {mentorshipApplication.menteeAccepted
                    ? "Accepted by Mentee"
                    : "Waiting for Mentee Acceptance"}
                </span>
              </div>
              <button
                onClick={() => setShowMeetingModal(true)}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Update Meeting
              </button>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-3">No meeting scheduled yet</p>
              <button
                onClick={() => setShowMeetingModal(true)}
                className="px-4 py-2 bg-primary text-white rounded hover:bg-opacity-90"
              >
                Schedule Google Meet
              </button>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-3 gap-6 pt-6">
        {[
          {
            icon: "/profile.png",
            label: "View Profile",
            path: `/dashboard/enterprenuers/businessDetails/${uuid}`,
          },
          {
            icon: "/resource.png",
            label: "Submit Report",
            path: `/dashboard/addEntreprenuerReport/${business?.User?.uuid}`,
          },
          {
            icon: "/report.png",
            label: "View Reports",
            path: `/dashboard/entrepreneurReports/${business?.User?.uuid}`,
          },
        ].map((item) => {
          return (
            <Link
              key={item.path}
              href={item.path}
              className="border border-black/10 bg-white rounded-lg p-5 flex flex-col items-center  space-y-4"
            >
              <img className="h-40" src={item.icon} />
              <h1 className="font-bold text-lg">{item.label}</h1>
            </Link>
          );
        })}
      </div>

      {/* Meeting Setup Modal */}
      {showMeetingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Setup Google Meet</h2>
              <button
                onClick={() => setShowMeetingModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSetupMeeting} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Google Meet Link <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={googleMeetLink}
                    onChange={(e) => setGoogleMeetLink(e.target.value)}
                    placeholder="https://meet.google.com/xxx-xxxx-xxx"
                    className="flex-1 px-3 py-2 border border-black/10 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                  <button
                    type="button"
                    onClick={() =>
                      window.open("https://meet.google.com/new", "_blank")
                    }
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 whitespace-nowrap"
                    title="Create a new Google Meet link"
                  >
                    Generate Link
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Click "Generate Link" to create a new meeting, then copy and
                  paste the link here
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Appointment Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="w-full px-3 py-2 border border-black/10 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowMeetingModal(false)}
                  className="flex-1 px-4 py-2 border border-black/10 rounded-md hover:bg-gray-50"
                  disabled={settingUpMeeting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-opacity-90 disabled:bg-gray-400"
                  disabled={settingUpMeeting}
                >
                  {settingUpMeeting ? "Setting up..." : "Schedule Meeting"}
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
