import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { TranslationProvider } from "@/locales";
import LanguageToggle from "@/components/LanguageToggle";
import Loader from "@/components/common/Loader";

// Layouts
import DashboardLayout from "@/layouts/DashboardLayout";
import AuthLayout from "@/layouts/AuthLayout";

// Auth Pages
import SignIn from "@/pages/auth/SignIn";
import SignUp from "@/pages/auth/SignUp";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";
import EmailConfirmation from "@/pages/auth/EmailConfirmation";
import ConfirmEmail from "@/pages/auth/ConfirmEmail";
import AuthorizationPage from "@/pages/auth/AuthorizationPage";

// Dashboard Pages
import Dashboard from "@/pages/dashboard/Dashboard";
import ScoreReadiness from "@/pages/cratSystem/ScoreReadiness";
// import FinancialDomain from "@/pages/cratSystem/FinancialDomain";
// import LegalDomain from "@/pages/cratSystem/LegalDomain";
// import MarketDomain from "@/pages/cratSystem/MarketDomain";
// import OperationsDomain from "@/pages/cratSystem/OperationsDomain";
// import FinalReport from "@/pages/cratSystem/FinalReport";
// import CratReview from "@/pages/cratSystem/CratReview";
import ChatMessages from "@/pages/chat/ChatMessages";

// CSS imports
import "./index.css";
import "./satoshi.css";
import "./data-tables-css.css";

// User Management Pages
import Users from "./pages/users/users/Users";
import Enterprenuers from "./pages/users/enterprenuers/Enterprenuers";
import Investors from "./pages/users/investors/Investors";
import Mentors from "./pages/users/mentors/Mentors";
import Reviewers from "./pages/users/reviewers/Reviewers";
import Admins from "./pages/users/admins/Admins";
import InterestedEnterprenuers from "./pages/users/interestedEnterprenuers/InterestedEntreprenuers";

// Mentor Pages
import MentorEntreprenuer from "./pages/mentor/mentorEntreprenuers/MentorEntrepreneurs";
import MyMentors from "./pages/mentor/myMentors/MyMentors";
import MentorshipRequests from "./pages/mentor/mentorshipRequests/MentorshipRequests";
import MentorReports from "./pages/mentor/mentorReports/MentorReports";

// Investment Pages
import MyInvestmentRequests from "./pages/investment/myInvestmentRequests/MyInvestmentRequests";

// Business Application Pages
import PendingApplications from "./pages/business/PendingApplications";
import ApprovedApplications from "./pages/business/ApprovedApplications";
import RejectedApplications from "./pages/business/RejectedApplications";

// Investment Opportunities Pages
import Opportunities from "./pages/investment-opportunities/opportunities/Opportunities";

// Learn and Grow Pages
import ProgramsApplications from "./pages/learnandgrow/programsApplications/ProgramsApplications";
import ClassRooms from "./pages/learnandgrow/classRooms/ClassRooms";
import GeneralResources from "./pages/learnandgrow/generalResources/GeneralResources";

// CRAT System Pages
import Introduction from "./pages/cratSystem/Introduction";
// import Report from "./pages/cratSystem/Report";

// Reviewer Pages
import CratReviews from "./pages/reviewer/cratReviews/CratReviews";

// Application Pages
import CratReviewApplications from "./pages/applications/cratReviewApplications/CratReviewApplications";

// Stories Pages
import SuccessStories from "./pages/stories/successStories/SuccessStories";

// Conversation Pages
import Conversations from "./pages/conversation/conversations/Conversations";
// import MarketDomain from "./pages/cratSystem/marketDomain/MarketDomain";
import OperationsDomain from "./pages/cratSystem/operationsDomain/OperationsDomain";
// import LegalDomain from "./pages/cratSystem/legalDomain/LegalDomain";
import CratReviewPage from "./pages/cratSystem/cratReview/CratReview";
import IntroductionPage from "./pages/cratSystem/Introduction";
import LegalDomainPage from "./pages/cratSystem/legalDomain/LegalDomain";
import MarketDomainPage from "./pages/cratSystem/marketDomain/MarketDomain";
import FinalReportPreview from "./pages/cratSystem/finalReport/FinalReport";
import FinancialDomain from "./pages/cratSystem/financialDomain/FinancialDomain";
import Report from "./pages/cratSystem/report/Report";

// Dynamic route components
import MyMentorDetailsWithUuid from "./pages/mentor/myMentorDetails/MyMentorDetailsWithUuid";
import InvestorDetailsWithUuid from "./pages/users/investors/details/InvestorDetailsWithUuid";
import BusinessDetailsWithUuid from "./pages/business/businessDetails/BusinessDetailsWithUuid";
import CategoryWithParam from "./pages/learnandgrow/generalResources/category/CategoryWithParam";
import ModuleWithCourse from "./pages/learnandgrow/modules/ModuleWithCourse";
import MessagesWithUuid from "./pages/chat/messages/MessagesWithUuid";

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  if (loading) {
    return <Loader height="h-screen" />;
  }

  return (
    <TranslationProvider>
      <div className="dark:bg-boxdark-2 dark:text-bodydark">
        <Toaster position="top-right" />
        <Routes>
          {/* Auth Routes */}
          <Route path="/auth" element={<AuthLayout />}>
            <Route path="signin" element={<SignIn />} />
            <Route path="signup" element={<SignUp />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password" element={<ResetPassword />} />
            <Route path="email-confirmation" element={<EmailConfirmation />} />
            <Route path="confirm-email" element={<ConfirmEmail />} />
            <Route path="authorization" element={<AuthorizationPage />} />
          </Route>

          {/* Legacy auth routes (for backward compatibility) */}
          <Route
            path="/signin"
            element={<Navigate to="/auth/signin" replace />}
          />
          <Route
            path="/signup"
            element={<Navigate to="/auth/signup" replace />}
          />
          <Route
            path="/forgotPassword"
            element={<Navigate to="/auth/forgot-password" replace />}
          />
          <Route
            path="/resetPassword"
            element={<Navigate to="/auth/reset-password" replace />}
          />
          <Route
            path="/emailConfirmation"
            element={<Navigate to="/auth/email-confirmation" replace />}
          />
          <Route
            path="/confirmEmail"
            element={<Navigate to="/auth/confirm-email" replace />}
          />
          <Route
            path="/authorizationPage"
            element={<Navigate to="/auth/authorization" replace />}
          />

          {/* Dashboard Routes */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />

            {/* User Management Routes */}
            <Route path="users" element={<Users />} />
            <Route path="enterprenuers" element={<Enterprenuers />} />
            <Route path="investors" element={<Investors />} />
            <Route path="mentors" element={<Mentors />} />
            <Route path="reviewers" element={<Reviewers />} />
            <Route path="admins" element={<Admins />} />
            <Route
              path="interestedEnterprenuers"
              element={<InterestedEnterprenuers />}
            />

            {/* Mentor Routes */}
            <Route path="myMentors" element={<MyMentors />} />
            <Route
              path="mentorEntreprenuers"
              element={<MentorEntreprenuer />}
            />
            <Route path="mentorshipRequests" element={<MentorshipRequests />} />
            <Route path="mentorReports" element={<MentorReports />} />

            {/* Investment Routes */}
            <Route
              path="myInvestmentRequests"
              element={<MyInvestmentRequests />}
            />
            <Route path="opportunities" element={<Opportunities />} />

            {/* Business Application Routes */}
            <Route
              path="pendingApplications"
              element={<PendingApplications />}
            />
            <Route
              path="approvedApplications"
              element={<ApprovedApplications />}
            />
            <Route
              path="rejectedApplications"
              element={<RejectedApplications />}
            />

            {/* Learn and Grow Routes */}
            <Route
              path="programsApplications"
              element={<ProgramsApplications />}
            />
            <Route path="classRooms" element={<ClassRooms />} />
            <Route path="generalResources" element={<GeneralResources />} />

            {/* CRAT System Routes */}
            <Route path="introduction" element={<Introduction />} />
            <Route path="report" element={<Report />} />
            <Route path="finalReport" element={<FinalReportPreview />} />

            {/* Reviewer Routes */}
            <Route path="cratReviews" element={<CratReviews />} />

            {/* Application Routes */}
            <Route
              path="cratReviewApplications"
              element={<CratReviewApplications />}
            />

            {/* Stories Routes */}
            <Route path="successStories" element={<SuccessStories />} />

            {/* Conversation Routes */}
            <Route path="conversations" element={<Conversations />} />

            {/* CRAT System nested routes */}
            <Route path="crat-system">
              <Route path="introduction" element={<IntroductionPage />} />
              <Route path="scoreReadiness" element={<ScoreReadiness />} />
              <Route path="marketDomain" element={<MarketDomainPage />} />
              <Route path="financialDomain" element={<FinancialDomain />} />
              <Route path="operationsDomain" element={<OperationsDomain />} />
              <Route path="legalDomain" element={<LegalDomainPage />} />
              <Route path="cratReview" element={<CratReviewPage />} />
            </Route>

            {/* Chat Routes */}
            <Route path="chat">
              <Route path="messages" element={<ChatMessages />} />
            </Route>

            {/* Dynamic Routes with Parameters */}
            <Route
              path="myMentorDetails/:uuid"
              element={<MyMentorDetailsWithUuid />}
            />
            <Route
              path="investors/details/:uuid"
              element={<InvestorDetailsWithUuid />}
            />
            <Route
              path="enterprenuers/businessDetails/:uuid"
              element={<BusinessDetailsWithUuid />}
            />
            <Route
              path="generalResources/category/:category"
              element={<CategoryWithParam />}
            />
            <Route path="modules/:course" element={<ModuleWithCourse />} />
            <Route path="messages/:uuid" element={<MessagesWithUuid />} />
          </Route>

          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <LanguageToggle />
      </div>
    </TranslationProvider>
  );
}

export default App;
