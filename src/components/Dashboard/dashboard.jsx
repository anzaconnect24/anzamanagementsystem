"use client";

import React, { useContext, useEffect, useState } from "react";
import ChartOne from "../Charts/ChartOne";
import CardDataStats from "../CardDataStats";
import { SlPeople } from "react-icons/sl";
import { AiOutlineBarChart } from "react-icons/ai";
import { HiOutlineChartPie } from "react-icons/hi";
import PerformanceOverview from "../Charts/PerformanceOverview";
import jsPDF from "jspdf";

import Link from "@/utils/link";
import { checkIfProfileIsComplete } from "@/utils/check_profile";
import { getMentorOverviewStats } from "@/controllers/statsControllers";
import { getScoreData } from "@/controllers/crat_general_controller";
import {
  getAdminTrackerOverview,
  getMentorOverview,
  listTrackerMilestones,
} from "@/controllers/trackerController";
import TanzaniaMap from "../Maps/TanzaniaMap";
import { useTranslation } from "@/locales";
import { UserContext } from "../../layouts/DashboardLayout";

const DashboardHero = ({ userDetails, data }) => {
  const name = userDetails?.name || "User";
  const role = userDetails?.role;

  const heroContent = {
    Admin: {
      badge: "Administration Dashboard",
      title: "Manage Startups, Users, and Platform Operations",
      description:
        "Monitor platform activity, review startup applications, manage users, and oversee ecosystem growth through one centralized administration workspace.",
      statOne: `${data?.enterprenuers || 0} Startups`,
      statTwo: "User Management",
      statThree: "Platform Analytics",
      image: "/images/business-class-hero.svg",
    },

    Reviewer: {
      badge: "Reviewer Dashboard",
      title: "Review and Evaluate Startup Applications",
      description:
        "Assess business applications, review startup readiness, and support quality onboarding across the Anza Connect ecosystem.",
      statOne: `${data?.pendingBusiness || 0} Pending Reviews`,
      statTwo: "Application Reviews",
      statThree: "Startup Evaluation",
      image: "/images/business-class-hero.svg",
    },

    Investor: {
      badge: "Investor Dashboard",
      title: "Discover Startups and Track Investment Opportunities",
      description:
        "Explore investment-ready startups, monitor your active requests, review interested businesses, and manage your investment pipeline with confidence.",
      statOne: `${data?.enterprenuers || 0} Available Startups`,
      statTwo: "Investment Pipeline",
      statThree: "Funding Opportunities",
      image: "/images/business-class-hero.svg",
    },

    Mentor: {
      badge: "Mentorship Dashboard",
      title: "Support and Guide Emerging Startups",
      description:
        "Manage mentorship activities, monitor startup progress, review reports, and help entrepreneurs scale their businesses successfully.",
      statOne: `${data?.enterprenuers || 0} Startups`,
      statTwo: "Mentorship Activity",
      statThree: "Progress Reports",
      image: "/images/business-class-hero.svg",
    },

    Enterprenuer: {
      badge: "Startup Intelligence Dashboard",
      title: "Grow Your Startup with Anza Connect",
      description:
        "Access AI-powered insights, monitor business performance, track investor activity, and manage your startup growth journey from one workspace.",
      statOne: `${data?.enterprenuers || 0} Entrepreneurs`,
      statTwo: "AI Analysis",
      statThree: "Business Insights",
      image: "/images/business-class-hero.svg",
    },
  };

  const content = heroContent[role] || {
    badge: "Business Intelligence Dashboard",
    title: "Grow with Anza Connect",
    description:
      "Access your dashboard insights, track your progress, and manage your key activities from one central workspace.",
    statOne: `${data?.enterprenuers || 0} Entrepreneurs`,
    statTwo: "Dashboard Insights",
    statThree: "Platform Performance",
    image: "/images/business-class-hero.svg",
  };

  return (
    <div className="mb-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black dark:text-white">
            Hello {name}
          </h1>

          <p className="mt-2 text-base text-gray-600 dark:text-gray-300">
            Access your dashboard insights, track your progress, and manage your
            key activities.
          </p>
        </div>

        {/* Staff users are stored as either "Staff" or "Reviewer" (see SignUp),
            so both are excluded here. */}
        {["Investor", "Mentor"].includes(userDetails?.role) && (
          <Link
            href="/dashboard/entreprenuer-profile"
            className="rounded-2xl bg-[#082d77] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#061f52]"
          >
            Edit Profile
          </Link>
        )}
      </div>

      <div
        className="relative overflow-hidden rounded-3xl bg-cover bg-center px-6 py-10 text-white shadow-lg md:px-10 md:py-14"
        style={{
          backgroundImage: `url('${content.image}')`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/50" />

        <div className="absolute -right-20 top-0 h-72 w-72 rounded-full bg [#082d77] blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative z-10">
          <div className="mt-4 max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-md">
              <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />

              <span className="text-sm font-semibold text-white">
                {content.badge}
              </span>
            </div>

            <h2 className="text-3xl font-bold leading-tight md:text-5xl">
              {content.title}
            </h2>

            <p className="mt-4 max-w-2xl text-base leading-8 text-white/85">
              {content.description}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm font-medium text-white/90">
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
                <SlPeople className="text-xl text-#082d77" />
                <span>{content.statOne}</span>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
                <AiOutlineBarChart className="text-xl text-green-400" />
                <span>{content.statTwo}</span>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
                <HiOutlineChartPie className="text-xl text-yellow-400" />
                <span>{content.statThree}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { t } = useTranslation();

  const { data, userDetails } = useContext(UserContext);

  const [mentorStats, setMentorStats] = useState(null);
  const [scoreData, setScoreData] = useState({});
  const [loadingBar, setLoadingBar] = useState(true);
  const [aiReport, setAiReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [mentorTrackerStats, setMentorTrackerStats] = useState(null);
  const [myMilestonesCount, setMyMilestonesCount] = useState(0);

  useEffect(() => {
    getMentorOverviewStats().then((res) => {
      setMentorStats(res);
    });
  }, []);

  useEffect(() => {
    if (userDetails.role === "Mentor") {
      getMentorOverview().then((res) => setMentorTrackerStats(res || null));
    }

    if (userDetails.role === "Admin") {
      getAdminTrackerOverview().then((res) =>
        setAdminTrackerStats(res || null),
      );
    }

    if (userDetails.role === "Enterprenuer") {
      listTrackerMilestones().then((items) => {
        const openMilestones = (items || []).filter((item) =>
          ["pending", "in_progress", "submitted"].includes(item.status),
        );
        setMyMilestonesCount(openMilestones.length);
      });
    }
  }, [userDetails.role]);

  useEffect(() => {
    if (userDetails.role === "Enterprenuer") {
      setLoadingBar(true);

      getScoreData({ uuid: userDetails.uuid }).then((res) => {
        setScoreData(res);
        setLoadingBar(false);
      });

      setLoadingReport(true);

      fetch(`/api/startups/${userDetails.uuid}/ai-report`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          setAiReport(data);
          setLoadingReport(false);
        })
        .catch(() => setLoadingReport(false));
    }
  }, [userDetails.role, userDetails.uuid]);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("AI Analysis Report", 10, 15);

    doc.setFontSize(12);

    let y = 30;

    const hasValidData =
      scoreData &&
      Object.keys(scoreData).length > 0 &&
      scoreData.commercial &&
      typeof scoreData.commercial.percentage === "number";

    if (hasValidData) {
      doc.text(`Startup: ${userDetails.name || "N/A"}`, 10, y);
      y += 8;

      doc.text(`Business: ${data?.businessName || "N/A"}`, 10, y);
      y += 8;

      doc.text(`Date: ${new Date().toLocaleDateString()}`, 10, y);
      y += 12;

      Object.entries(scoreData).forEach(([domain, value]) => {
        if (
          typeof value === "object" &&
          value !== null &&
          "percentage" in value
        ) {
          doc.text(
            `${domain.charAt(0).toUpperCase() + domain.slice(1)}: ${
              value.percentage
            }%`,
            10,
            y,
          );

          y += 7;

          if (value.status) {
            doc.text(`Status: ${value.status}`, 14, y);
            y += 6;
          }
        }
      });
    } else {
      doc.text("Your AI analysis report is not yet available.", 10, y);
      y += 8;

      doc.text("Please contact your administrator or check back later.", 10, y);
    }

    doc.save("AI_Analysis_Report.pdf");
  };

  return (
    <>
      <DashboardHero userDetails={userDetails} data={data} />

      {["Enterprenuer"].includes(userDetails.role) && (
        <div>
          {checkIfProfileIsComplete(userDetails) === false && (
            <div className="mb-8 rounded-2xl bg-white shadow-sm">
              <div className="flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4">
                <h1 className="text-base font-medium text-black">
                  {t(
                    "dashboard.completeProfile",
                    "Please complete your profile",
                  )}
                </h1>

                <Link
                  href="/dashboard/entreprenuer-profile"
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  {t("dashboard.completeProfileButton", "Complete profile")}
                </Link>
              </div>
            </div>
          )}

          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-5 md:gap-6">
            <CardDataStats
              link="/dashboard/enterprenuers"
              title={t("dashboard.totalStartups", "Total Startups")}
              total={data.enterprenuers || 0}
              rate="0.95%"
              levelUp
            >
              <SlPeople className="text-lg text-primary dark:text-white" />
            </CardDataStats>

            <CardDataStats
              link="/dashboard/investors"
              title={t("dashboard.totalInvestors", "Total Investors")}
              total={data.investors || 0}
              rate="0.43%"
              levelUp
            >
              <SlPeople className="text-lg text-primary dark:text-white" />
            </CardDataStats>

            <CardDataStats
              link="/dashboard/interestedInvestors"
              title={t("dashboard.interestedInvestors", "Interested Investors")}
              total={data.investorsInterested || 0}
              rate="2.59%"
              levelUp
            >
              <SlPeople className="text-lg text-primary dark:text-white" />
            </CardDataStats>

            <CardDataStats
              link="/dashboard/myInvestmentRequests"
              title={t("dashboard.investmentsMade", "Investments Made")}
              total={data.investmentsMade || 0}
              rate="4.35%"
              levelUp
            >
              <SlPeople className="text-lg text-primary dark:text-white" />
            </CardDataStats>

            <CardDataStats
              link="/dashboard/myMilestones"
              title={t("dashboard.myMilestones", "My Milestones")}
              total={myMilestonesCount}
              rate="0.95%"
              levelUp
            >
              <SlPeople className="text-lg text-primary dark:text-white" />
            </CardDataStats>

            <div className="col-span-1 w-full md:col-span-5">
              <PerformanceOverview userDetails={userDetails} />
            </div>
          </div>
        </div>
      )}

      {["Mentor"].includes(userDetails.role) && mentorStats && (
        <div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-6 md:gap-6">
            <CardDataStats
              link="/dashboard/mentorEntreprenuers"
              title={t("dashboard.activeMentees", "Active Mentees")}
              total={mentorStats.mentorEnterprenuers}
              rate="0.43%"
              levelUp
            >
              <SlPeople className="text-lg text-primary dark:text-white" />
            </CardDataStats>

            <CardDataStats
              link="/dashboard/mentorshipApplications"
              title={t(
                "dashboard.pendingMentorshipRequest",
                "Pending Mentorship Request",
              )}
              total={mentorStats.mentorEnterprenuers}
              rate="0.43%"
              levelUp
            >
              <SlPeople className="text-lg text-primary dark:text-white" />
            </CardDataStats>

            <CardDataStats
              link="/dashboard/enterprenuers"
              title={t("dashboard.totalStartupsShort", "Total Startups")}
              total={data.enterprenuers}
              rate="0.43%"
              levelUp
            >
              <SlPeople className="text-lg text-primary dark:text-white" />
            </CardDataStats>

            <CardDataStats
              link="/dashboard/mentorEntreprenuers"
              title={t("dashboard.startupsSupported", "Startups Supported")}
              total={mentorStats.mentorEnterprenuers}
              rate="0.43%"
              levelUp
            >
              <SlPeople className="text-lg text-primary dark:text-white" />
            </CardDataStats>

            <CardDataStats
              link="/dashboard/mentorReports"
              title={t("dashboard.reportsSubmitted", "Reports Submitted")}
              total={mentorStats.mentorReports}
              rate="0.43%"
              levelUp
            >
              <SlPeople className="text-lg text-primary dark:text-white" />
            </CardDataStats>

            <CardDataStats
              link="/dashboard/mentorTracker"
              title={t("dashboard.weeklyLogs", "Weekly Logs")}
              total={mentorTrackerStats?.weeklyLogs || 0}
              rate="0.43%"
              levelUp
            >
              <SlPeople className="text-lg text-primary dark:text-white" />
            </CardDataStats>
          </div>
        </div>
      )}

      {["Admin", "Reviewer"].includes(userDetails.role) && (
        <div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 md:grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
            <CardDataStats
              link="/dashboard/pendingApplications"
              title={t(
                "dashboard.pendingBusinessApplications",
                "Pending business applications",
              )}
              total={data.pendingBusiness}
              rate="0.43%"
              levelUp
            >
              <SlPeople className="text-lg text-primary dark:text-white" />
            </CardDataStats>

            <CardDataStats
              link="/dashboard/users"
              title={t(
                "dashboard.pendingUserApplications",
                "Pending users applications",
              )}
              total={data.pendingUser}
              rate="4.35%"
              levelUp
            >
              <SlPeople className="text-lg text-primary dark:text-white" />
            </CardDataStats>

            <CardDataStats
              link="/dashboard/pendingRequests"
              title={t(
                "dashboard.pendingProgramApplications",
                "Pending program applications",
              )}
              total={data.pendingProgramApplication || 0}
              rate="2.59%"
              levelUp
            >
              <SlPeople className="text-lg text-primary dark:text-white" />
            </CardDataStats>

            <CardDataStats
              link="/dashboard/users"
              title={t(
                "dashboard.totalUsersRegistered",
                "Total users registered on system",
              )}
              total={data.totalUsers}
              rate="0.95%"
              levelDown
            >
              <SlPeople className="text-lg text-primary dark:text-white" />
            </CardDataStats>
          </div>
        </div>
      )}

      {["Investor"].includes(userDetails.role) && (
        <div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-5 md:gap-6">
            <CardDataStats
              link="/dashboard/myInvestmentRequests"
              title={t("dashboard.requestsInProgress", "Requests in progress")}
              total={data.investorWaitingBusinessInvestmentRequests}
              rate="0.43%"
              levelUp
            >
              <SlPeople className="text-lg text-primary dark:text-white" />
            </CardDataStats>

            <CardDataStats
              link="/dashboard/myInvestmentRequests"
              title={t("dashboard.investmentsMade", "Investments made")}
              total={data.investorClosedBusinessInvestmentRequests}
              rate="4.35%"
              levelUp
            >
              <SlPeople className="text-lg text-primary dark:text-white" />
            </CardDataStats>

            <CardDataStats
              link="/dashboard/myInvestmentRequests"
              title={t("dashboard.droppedInvestments", "Dropped Investments")}
              total={data.investorClosedBusinessInvestmentRequests}
              rate="4.35%"
              levelUp
            >
              <SlPeople className="text-lg text-danger dark:text-white" />
            </CardDataStats>

            <CardDataStats
              link=""
              title={t("dashboard.interestedStartups", "Interested Startups")}
              total={data.enterprenuersInterested}
              rate="2.59%"
              levelUp
            >
              <SlPeople className="text-lg text-success dark:text-white" />
            </CardDataStats>

            <CardDataStats
              link="/dashboard/investorSectorBusinesses"
              title={t("dashboard.totalStartups", "Total Startups")}
              total={data.enterprenuers}
              rate="0.95%"
              levelDown
            >
              <SlPeople className="text-lg text-primary dark:text-white" />
            </CardDataStats>
          </div>
        </div>
      )}

      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6">
        {userDetails.role !== "Enterprenuer" && <ChartOne />}
        <TanzaniaMap />
      </div>
    </>
  );
};

export default Dashboard;
