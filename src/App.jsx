import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
// import { TranslationProvider } from "./locales";
import Loader from "./components/common/Loader";

// Layouts
import DashboardLayout from "@/layouts/DashboardLayout";
import AuthLayout from "@/layouts/AuthLayout";

// Auth Pages
import SignIn from "@/pages/auth/SignIn";
import SignUp from "@/pages/auth/SignUp";
import TermsOfService from "@/pages/legal/TermsOfService";
import PrivacyPolicy from "@/pages/legal/PrivacyPolicy";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";
import EmailConfirmation from "@/pages/auth/EmailConfirmation";
import ConfirmEmail from "@/pages/auth/ConfirmEmail";
import AuthorizationPage from "@/pages/auth/AuthorizationPage";

// Dashboard Pages
import Dashboard from "@/pages/dashboard/Dashboard";
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
import ProgramCategories from "./pages/users/enterprenuers/ProgramCategories";
import StartupPrograms from "./pages/users/enterprenuers/StartupPrograms";
import ProgramStartups from "./pages/users/enterprenuers/ProgramStartups";
import ProgramCourses from "./pages/users/enterprenuers/ProgramCourses";
import Investors from "./pages/users/investors/Investors";
import Mentors from "./pages/users/mentors/Mentors";
import Reviewers from "./pages/users/reviewers/Reviewers";
import Admins from "./pages/users/admins/Admins";
import FinanceOfficers from "./pages/users/financeOfficers/FinanceOfficers";
import InterestedEnterprenuers from "./pages/users/interestedEnterprenuers/InterestedEntreprenuers";

// Mentor Pages
import MentorEntreprenuer from "./pages/mentor/mentorEntreprenuers/MentorEntrepreneurs";
import MyMentors from "./pages/mentor/myMentors/MyMentors";
import MentorshipRequests from "./pages/mentor/mentorshipRequests/MentorshipRequests";
import MentorshipApplications from "./pages/mentor/mentorshipApplications/MentorshipApplications";
import MentorReports from "./pages/mentor/mentorReports/MentorReports";

// Investment Pages
import MyInvestmentRequests from "./pages/investment/myInvestmentRequests/MyInvestmentRequests";
import InvestmentApplications from "./pages/investment/InvestmentApplications";
import InvestmentApplicationDetail from "./pages/investment/InvestmentApplicationDetail";
import InvestmentApplicationDetailWithActions from "./pages/investment/InvestmentApplicationDetailWithActions";
import InterestedEntrepreneursApplications from "./pages/investment/InterestedEntrepreneursApplications";
import InterestedInvestors from "./pages/investment/interestedInvestors/InterestedInvestors";
import ViewInvestmentRequest from "./pages/investment/ViewInvestmentRequest";

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
import BusinessTools from "./pages/learnandgrow/businessTools/BusinessTools";
import UploadBusinessTool from "./pages/learnandgrow/businessTools/UploadBusinessTool";
import EditBusinessTool from "./pages/learnandgrow/businessTools/EditBusinessTool";
import BusinessToolCategory from "./pages/learnandgrow/businessTools/BusinessToolCategory";
import GenerateBusinessTool from "./pages/learnandgrow/businessTools/GenerateBusinessTool";

// CRAT System Pages
import Introduction from "./pages/cratSystem/Introduction";
// import Report from "./pages/cratSystem/Report";

// Reviewer Pages
import CratReviews from "./pages/reviewer/cratReviews/CratReviews";

// Application Pages
import CratReviewApplications from "./pages/applications/cratReviewApplications/CratReviewApplications";
import CratCatalogManager from "./pages/admin/CratCatalogManager";

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
import FinancialDomain from "./pages/cratSystem/financialDomain/FinancialDomain";
import Report from "./pages/cratSystem/report/Report";
import CratSubmissionReviewPage from "./pages/cratSystem/reviewAssessment/CratSubmissionReviewPage";
import DomainAssessmentPage from "./pages/cratSystem/domain/DomainAssessmentPage";

// Dynamic route components
import MyMentorDetailsWithUuid from "./pages/mentor/myMentorDetails/MyMentorDetailsWithUuid";
import InvestorDetailsWithUuid from "./pages/users/investors/details/InvestorDetailsWithUuid";
import BusinessDetailsWithUuid from "./pages/business/businessDetails/BusinessDetailsWithUuid";
import CategoryWithParam from "./pages/learnandgrow/generalResources/category/CategoryWithParam";
import ModuleWithCourse from "./pages/learnandgrow/modules/ModuleWithCourse";
import ModuleDetails from "./pages/learnandgrow/modules/ModuleDetails";
import SurveyBuilder from "./pages/users/enterprenuers/SurveyBuilder";
import ProgramSurveys from "./pages/users/enterprenuers/ProgramSurveys";
import SurveyResults from "./pages/users/enterprenuers/SurveyResults";
import MySurveys from "./pages/learnandgrow/surveys/MySurveys";
import TakeSurvey from "./pages/learnandgrow/surveys/TakeSurvey";
import MessagesWithUuid from "./pages/chat/messages/MessagesWithUuid";

// Additional Missing Imports - Account Components
import InvestorProfile from "./pages/account/investorProfile/InvestorProfile";

// Additional Missing Imports - Application Components
import AcceptedProgramApplications from "./pages/applications/acceptedProgramApplications/AcceptedProgramApplications";
import AssignProgramApplicationReviewersWithUuid from "./pages/applications/assignProgramApplicationReviewers/AssignProgramApplicationReviewersWithUuid";
import PendingProgramApplications from "./pages/applications/pendingProgramApplications/PendingProgramApplications";
import RejectedProgramApplications from "./pages/applications/rejectedProgramApplications/RejectedProgramApplications";
import UserProgramApplicationWithUuid from "./pages/applications/userProgramApplication/UserProgramApplicationWithUuid";
import ViewProgramApplicationWithUuid from "./pages/applications/viewProgramApplication/ViewProgramApplicationWithUuid";

// Additional Missing Imports - Assignment Components
import BusinessAssignments from "./pages/assignments/businessAssignments/BusinessAssignments";
import ProgramAssignments from "./pages/assignments/programAssignments/ProgramAssignments";

// Additional Missing Imports - Business Components
import ApplicationRejectionWithUuid from "./pages/business/applicationRejection/ApplicationRejectionWithUuid";
import ApprovedApplicationWithUuid from "./pages/business/approvedApplications/ApprovedApplicationWithUuid";
import AssignReviewerWithUuid from "./pages/business/assignReviewer/AssignReviewerWithUuid";
import CratDocuments from "./pages/business/businessDetails/CratDocuments";
import BusinessDetailsByMentorWithUuid from "./pages/business/businessDetailsByMentor/BusinessDetailsByMentorWithUuid";

// Additional Missing Imports - Investment Opportunity Components
import NewOpportunity from "./pages/investment-opportunities/opportunities/{new}";
import OpportunityWithUuid from "./pages/investment-opportunities/opportunities/OpportunityWithUuid";
import EditOpportunityWithUuid from "./pages/investment-opportunities/opportunities/EditOpportunityWithUuid";

// Additional Missing Imports - Investment Components
import AcceptedRequests from "./pages/investment/acceptedRequests/AcceptedRequests";
import AssignInvestmentRequestReviewersWithUuid from "./pages/investment/assignInvestmentRequestReviewers/AssignInvestmentRequestReviewersWithUuid";
import InvestmentApplicationWithUuid from "./pages/investment/investmentApplication/InvestmentApplicationWithUuid";
import InvestmentApplicationByEntreprenuerWithUuid from "./pages/investment/investmentApplicationByEntreprenuer/InvestmentApplicationByEntreprenuerWithUuid";
import PendingRequests from "./pages/investment/pendingRequests/PendingRequests";
import RejectApplicationRequestWithUuid from "./pages/investment/rejectApplicationRequest/RejectApplicationRequestWithUuid";
import RejectedRequests from "./pages/investment/rejectedRequests/RejectedRequests";
import ReviewerAssignedInvestmentRequests from "./pages/investment/reviewerAssignedInvestmentRequests/ReviewerAssignedInvestmentRequests";
import ViewInvestmentRequestWithUuid from "./pages/investment/viewInvestmentRequest/ViewInvestmentRequestWithUuid";

// Additional Missing Imports - Investor Components
import InvestorSectorBusinesses from "./pages/investor/investorSectorBusinesses/InvestorSectorBusinesses";

// Additional Missing Imports - Learn and Grow Components
import AddModule from "./pages/learnandgrow/modules/add/AddModule";
import EditModule from "./pages/learnandgrow/modules/edit/EditModule";
import Programs from "./pages/learnandgrow/programs/Programs";
import AddProgram from "./pages/learnandgrow/programs/add/AddProgram";
import EditProgram from "./pages/learnandgrow/programs/edit/EditProgram";
import NewProgramsApplication from "./pages/learnandgrow/programsApplications/NewProgramsApplication";
import ProgramsApplicationsWithUuid from "./pages/learnandgrow/programsApplications/ProgramsApplicationsWithUuid";
import EditProgramsApplicationsWithUuid from "./pages/learnandgrow/programsApplications/EditProgramsApplicationsWithUuid";
import SlideWithUuid from "./pages/learnandgrow/slides/SlideWithUuid";
import AddSlide from "./pages/learnandgrow/slides/add/AddSlide";
import EditSlide from "./pages/learnandgrow/slides/edit/EditSlide";
import CourseDetailsPage from "./pages/learnandgrow/programs/details/page";

// Quiz Components
import ModuleQuizzes from "./pages/learnandgrow/quizzes/ModuleQuizzes";
import CreateEditQuiz from "./pages/learnandgrow/quizzes/CreateEditQuiz";
import TakeQuiz from "./pages/learnandgrow/quizzes/TakeQuiz";
import QuizResult from "./pages/learnandgrow/quizzes/QuizResult";
import UserAttempts from "./pages/learnandgrow/quizzes/UserAttempts";
import AdminAttempts from "./pages/learnandgrow/quizzes/AdminAttempts";
import PendingQuizzes from "./pages/learnandgrow/quizzes/PendingQuizzes";
import GradeQuiz from "./pages/learnandgrow/quizzes/GradeQuiz";

// Additional Missing Imports - Log Components
// import Logs from "./pages/log/Logs";
import UserActivityLogs from "./pages/logs/UserActivityLogs";

// Additional Missing Imports - Mentor Components
import AddEntreprenuerReportWithUuid from "./pages/mentor/addEntreprenuerReport/AddEntreprenuerReportWithUuid";
import MentorReportWithUuid from "./pages/mentor/mentorReport/MentorReportWithUuid";
import EntrepreneurReportsWithUuid from "./pages/mentor/entrepreneurReports/EntrepreneurReportsWithUuid";

// Additional Missing Imports - Mentorship Components
import MentorshipApplicationFormWithUuid from "./pages/mentorship/mentorshipApplicationForm/MentorshipApplicationFormWithUuid";

// Additional Missing Imports - Pitch Materials Components
import Documents from "./pages/pitchMaterials/documents/Documents";
import UploadMaterialWithType from "./pages/pitchMaterials/uploadMaterial/UploadMaterialWithType";
import Videos from "./pages/pitchMaterials/videos/Videos";
import ViewerWithUuid from "./pages/pitchMaterials/viewer/ViewerWithUuid";

// Additional Missing Imports - Program Components
import BFA from "./pages/programs/bfa/BFA";
import Consultance from "./pages/programs/consultance/Consultance";
import EditProgramWithUuid from "./pages/programs/editProgram/EditProgramWithUuid";
import IRA from "./pages/programs/ira/IRA";
import NewProgram from "./pages/programs/NewProgram";
import NewProgramUpdateWithUuid from "./pages/programs/newProgramUpdate/NewProgramUpdateWithUuid";
import ProgramDetailsWithUuid from "./pages/programs/programDetails/ProgramDetailsWithUuid";
import ProgramUpdatesWithUuid from "./pages/programs/programUpdates/ProgramUpdatesWithUuid";
import SendProgramApplicationWithUuid from "./pages/programs/sendProgramApplication/SendProgramApplicationWithUuid";

// Additional Missing Imports - Reviewer Components
import ApplicationList from "./pages/reviewer/applicationList/ApplicationList";
import PreviewPage from "./pages/reviewer/previewPage/PreviewPage";

// Additional Missing Imports - Sector Components
// import Sectors from "./pages/sectors/Sectors";
import AddSector from "./pages/sectors/addSector/AddSector";
import EditSectorWithUuid from "./pages/sectors/editSector/EditSectorWithUuid";
import SectorBusinessesWithUuid from "./pages/sectors/sectorBusinesses/SectorBusinessesWithUuid";

// Additional Missing Imports - Stories Components
import NewStory from "./pages/stories/newStory/NewStory";
import ReadStoryWithUuid from "./pages/stories/readStory/ReadStoryWithUuid";
import EditSuccessStoryWithUuid from "./pages/stories/successStories/EditSuccessStoryWithUuid";
import NewSuccessStory from "./pages/stories/successStories/new/NewSuccessStory";
import SuccessStoryWithUuid from "./pages/stories/successStories/SuccessStoryWithUuid";

// Additional Missing Imports - User Components
import InvestorWithUuid from "./pages/users/investors/InvestorWithUuid";
import MentorEntreprenuerWithUuid from "./pages/users/mentorEntreprenuers/MentorEntreprenuerWithUuid";
import MentorWithUuid from "./pages/users/mentors/MentorWithUuid";
import { TranslationProvider } from "./locales";
import EditAccountDetails from "./pages/account/editAccount/editAccountDetails";
import EntrepreneurProfile from "./pages/account/entreprenuerProfile";
import MentorTracker from "./pages/tracker/mentor/MentorTracker";
import EnterpriseTrackerDetails from "./pages/tracker/mentor/EnterpriseTrackerDetails";
import EnterpriseKyc from "./pages/tracker/mentor/EnterpriseKyc";
import EntrepreneurMilestones from "./pages/tracker/entreprenuer/EntrepreneurMilestones";
import CoachingSessions from "./pages/tracker/entreprenuer/CoachingSessions";
import GrantContract from "./pages/tracker/entreprenuer/GrantContract";
import ProgramMemberRoute from "./components/guards/ProgramMemberRoute";
import RoleRoute from "./components/guards/RoleRoute";
import BdaCoachingSessions from "./pages/tracker/mentor/BdaCoachingSessions";
import BdaCoachingSessionSetup from "./pages/tracker/mentor/BdaCoachingSessionSetup";
import TrackerProgramDetails from "./pages/tracker/admin/TrackerProgramDetails";
import FundingAgreements from "./pages/tracker/admin/FundingAgreements";
import TrackerPrograms from "./pages/tracker/admin/TrackerPrograms";
import TrackerStartupDetails from "./pages/tracker/admin/TrackerStartupDetails";
import StaffStartupMilestones from "./pages/tracker/mentor/StaffStartupMilestones";

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

          {/* Legal Routes (public) */}
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />

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
            {/* Startups is the flat directory for every role. */}
            <Route path="enterprenuers" element={<Enterprenuers />} />
            <Route path="enterprenuers/all" element={<Enterprenuers />} />

            {/* Program Management (Admin/Staff): category -> program -> startups. */}
            <Route path="programManagement" element={<ProgramCategories />} />
            <Route
              path="programManagement/category/:category"
              element={<StartupPrograms />}
            />
            <Route
              path="programManagement/program/:uuid"
              element={<ProgramStartups />}
            />
            <Route
              path="programManagement/program/:uuid/modules"
              element={<ProgramCourses />}
            />
            <Route
              path="programManagement/module/:uuid"
              element={<ModuleDetails />}
            />
            <Route
              path="programManagement/program/:uuid/surveys"
              element={<ProgramSurveys />}
            />
            <Route path="surveys" element={<MySurveys />} />
            <Route path="surveys/new" element={<SurveyBuilder />} />
            <Route path="surveys/:uuid/take" element={<TakeSurvey />} />
            <Route path="surveys/:uuid/edit" element={<SurveyBuilder />} />
            <Route path="surveys/:uuid/results" element={<SurveyResults />} />
            <Route path="investors" element={<Investors />} />
            <Route path="mentors" element={<Mentors />} />
            <Route path="reviewers" element={<Reviewers />} />
            <Route path="admins" element={<Admins />} />
            <Route path="financeOfficers" element={<FinanceOfficers />} />
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
            <Route
              path="mentorEntreprenuers/businessDetailsByMentor/:uuid"
              element={<BusinessDetailsByMentorWithUuid />}
            />
            <Route path="mentorshipRequests" element={<MentorshipRequests />} />
            <Route
              path="mentorshipApplications"
              element={<MentorshipApplications />}
            />
            <Route path="mentorReports" element={<MentorReports />} />
            <Route path="mentorTracker" element={<MentorTracker />} />
            <Route
              path="bdaCoachingSessions"
              element={<BdaCoachingSessions />}
            />
            <Route
              path="bdaCoachingSessions/:entUuid"
              element={<BdaCoachingSessionSetup />}
            />
            <Route
              path="mentorTracker/enterprise-kyc"
              element={<EnterpriseKyc />}
            />
            <Route
              path="mentorTracker/enterprise-kyc/:enterpriseUuid"
              element={<EnterpriseKyc />}
            />
            <Route
              path="mentorTracker/enterprise/:enterpriseUuid"
              element={<EnterpriseTrackerDetails />}
            />
            <Route
              path="mentorTracker/startup/:entUuid/milestones"
              element={<StaffStartupMilestones />}
            />
            <Route
              path="myMilestones"
              element={
                <ProgramMemberRoute>
                  <EntrepreneurMilestones />
                </ProgramMemberRoute>
              }
            />
            <Route
              path="coachingSessions"
              element={
                <ProgramMemberRoute>
                  <CoachingSessions />
                </ProgramMemberRoute>
              }
            />
            <Route
              path="myMilestones/kyc"
              element={
                <ProgramMemberRoute>
                  <EnterpriseKyc audience="entrepreneur" />
                </ProgramMemberRoute>
              }
            />
            <Route
              path="myMilestones/contract"
              element={
                <ProgramMemberRoute>
                  <GrantContract />
                </ProgramMemberRoute>
              }
            />

            <Route
              path="trackerAdminOverview"
              element={
                <RoleRoute allow={["Finance"]}>
                  <TrackerPrograms />
                </RoleRoute>
              }
            />
            <Route
              path="trackerPrograms"
              element={
                <RoleRoute allow={["Finance"]}>
                  <TrackerPrograms />
                </RoleRoute>
              }
            />
            <Route
              path="trackerPrograms/:programUuid/details"
              element={
                <RoleRoute allow={["Finance"]}>
                  <TrackerProgramDetails />
                </RoleRoute>
              }
            />
            <Route
              path="trackerPrograms/:programUuid/startup/:entUuid"
              element={
                <RoleRoute allow={["Finance"]}>
                  <TrackerStartupDetails />
                </RoleRoute>
              }
            />
            <Route
              path="fundingAgreements"
              element={
                <RoleRoute allow={["Finance"]}>
                  <FundingAgreements />
                </RoleRoute>
              }
            />

            {/* Investment Routes */}
            <Route
              path="myInvestmentRequests"
              element={<MyInvestmentRequests />}
            />
            <Route
              path="viewInvestmentRequest/:uuid"
              element={<ViewInvestmentRequest />}
            />
            <Route
              path="investmentApplications"
              element={<InvestmentApplications />}
            />
            <Route
              path="investmentApplications/:uuid"
              element={<InvestmentApplicationDetailWithActions />}
            />
            <Route
              path="interestedInvestors"
              element={<InterestedInvestors />}
            />
            <Route
              path="interestedEntrepreneursApplications"
              element={<InterestedEntrepreneursApplications />}
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

            {/* Account Routes */}
            <Route path="edit-profile" element={<EditAccountDetails />} />
            <Route
              path="entreprenuer-profile"
              element={<EntrepreneurProfile />}
            />
            <Route path="investorProfile" element={<InvestorProfile />} />

            {/* Application Routes - Additional */}
            <Route
              path="acceptedProgramApplications"
              element={<AcceptedProgramApplications />}
            />
            <Route
              path="assignProgramApplicationReviewers/:uuid"
              element={<AssignProgramApplicationReviewersWithUuid />}
            />
            <Route
              path="pendingProgramApplications"
              element={<PendingProgramApplications />}
            />
            <Route
              path="rejectedProgramApplications"
              element={<RejectedProgramApplications />}
            />
            <Route
              path="userProgramApplication/:uuid"
              element={<UserProgramApplicationWithUuid />}
            />
            <Route
              path="viewProgramApplication/:uuid"
              element={<ViewProgramApplicationWithUuid />}
            />

            {/* Assignment Routes */}
            <Route
              path="businessAssignments"
              element={<BusinessAssignments />}
            />
            <Route path="programAssignments" element={<ProgramAssignments />} />

            {/* Business Routes - Additional */}
            <Route
              path="applicationRejection/:uuid"
              element={<ApplicationRejectionWithUuid />}
            />
            <Route
              path="approvedApplications/:uuid"
              element={<ApprovedApplicationWithUuid />}
            />
            <Route
              path="assignReviewer/:uuid"
              element={<AssignReviewerWithUuid />}
            />
            <Route
              path="businessDetails/:uuid/crat-documents"
              element={<CratDocuments />}
            />

            <Route
              path="businessDetailsByMentor/:uuid"
              element={<BusinessDetailsByMentorWithUuid />}
            />

            {/* Investment Opportunity Routes - Additional */}
            <Route
              path="opportunities/:uuid"
              element={<OpportunityWithUuid />}
            />

            <Route
              path="opportunities/:uuid/edit"
              element={<EditOpportunityWithUuid />}
            />

            <Route path="opportunities/new" element={<NewOpportunity />} />

            {/* Investment Routes - Additional */}
            <Route path="acceptedRequests" element={<AcceptedRequests />} />
            <Route
              path="assignInvestmentRequestReviewers/:uuid"
              element={<AssignInvestmentRequestReviewersWithUuid />}
            />
            <Route
              path="investmentApplication/:uuid"
              element={<InvestmentApplicationWithUuid />}
            />
            <Route
              path="investmentApplicationByEntreprenuer/:uuid"
              element={<InvestmentApplicationByEntreprenuerWithUuid />}
            />
            <Route path="pendingRequests" element={<PendingRequests />} />
            <Route
              path="rejectApplicationRequest/:uuid"
              element={<RejectApplicationRequestWithUuid />}
            />
            <Route path="rejectedRequests" element={<RejectedRequests />} />
            <Route
              path="reviewerAssignedInvestmentRequests"
              element={<ReviewerAssignedInvestmentRequests />}
            />
            <Route
              path="viewInvestmentRequest/:uuid"
              element={<ViewInvestmentRequestWithUuid />}
            />

            {/* Investor Routes */}
            <Route
              path="investorSectorBusinesses"
              element={<InvestorSectorBusinesses />}
            />

            {/* Learn and Grow Routes - Additional */}
            <Route path="programs/:course" element={<Programs />} />

            <Route
              path="programs/details/:uuid"
              element={<CourseDetailsPage />}
            />

            <Route path="programs/add" element={<AddProgram />} />

            <Route path="programs/edit" element={<EditProgram />} />

            <Route path="modules/add" element={<AddModule />} />

            <Route path="modules/edit" element={<EditModule />} />

            <Route
              path="programsApplications/:uuid"
              element={<ProgramsApplicationsWithUuid />}
            />

            <Route
              path="programsApplications/:uuid/edit"
              element={<EditProgramsApplicationsWithUuid />}
            />

            <Route
              path="programsApplications/new"
              element={<NewProgramsApplication />}
            />

            <Route path="slides/:uuid" element={<SlideWithUuid />} />

            <Route path="slides/add" element={<AddSlide />} />

            <Route path="slides/edit" element={<EditSlide />} />

            {/* Log Routes */}
            {/* <Route path="logs" element={<Logs />} /> */}
            <Route path="logs/:uuid" element={<UserActivityLogs />} />

            {/* Mentor Routes - Additional */}
            <Route
              path="addEntreprenuerReport/:uuid"
              element={<AddEntreprenuerReportWithUuid />}
            />
            <Route
              path="mentorReport/:uuid"
              element={<MentorReportWithUuid />}
            />
            <Route
              path="entrepreneurReports/:uuid"
              element={<EntrepreneurReportsWithUuid />}
            />

            {/* Mentorship Routes */}
            <Route
              path="mentorshipApplicationForm/:uuid"
              element={<MentorshipApplicationFormWithUuid />}
            />

            {/* Pitch Materials Routes */}
            <Route path="documents" element={<Documents />} />
            <Route
              path="uploadMaterial/:type"
              element={<UploadMaterialWithType />}
            />
            <Route path="videos" element={<Videos />} />
            <Route path="viewer/:uuid" element={<ViewerWithUuid />} />

            {/* Program Routes - Additional */}
            <Route path="bfa" element={<BFA />} />
            <Route path="consultance" element={<Consultance />} />
            <Route path="editProgram/:uuid" element={<EditProgramWithUuid />} />
            <Route path="ira" element={<IRA />} />
            <Route path="newProgram" element={<NewProgram />} />
            <Route
              path="newProgramUpdate/:uuid"
              element={<NewProgramUpdateWithUuid />}
            />
            <Route
              path="programDetails/:uuid"
              element={<ProgramDetailsWithUuid />}
            />
            <Route
              path="programUpdates/:uuid"
              element={<ProgramUpdatesWithUuid />}
            />
            <Route
              path="sendProgramApplication/:uuid"
              element={<SendProgramApplicationWithUuid />}
            />

            {/* Reviewer Routes - Additional */}
            <Route path="applicationList" element={<ApplicationList />} />
            <Route path="previewPage" element={<PreviewPage />} />

            {/* Sector Routes */}
            {/* <Route path="sectors" element={<Sectors />} /> */}
            <Route path="addSector" element={<AddSector />} />
            <Route path="editSector/:uuid" element={<EditSectorWithUuid />} />
            <Route
              path="sectorBusinesses/:uuid"
              element={<SectorBusinessesWithUuid />}
            />

            {/* Stories Routes - Additional */}
            <Route path="newStory" element={<NewStory />} />
            <Route path="readStory/:uuid" element={<ReadStoryWithUuid />} />
            <Route
              path="successStories/:uuid/edit"
              element={<EditSuccessStoryWithUuid />}
            />
            <Route
              path="successStories/:uuid"
              element={<SuccessStoryWithUuid />}
            />
            <Route path="successStories/new" element={<NewSuccessStory />} />

            {/* User Routes - Additional */}
            <Route path="investors/:uuid" element={<InvestorWithUuid />} />
            <Route
              path="mentorEntreprenuers/:uuid"
              element={<MentorEntreprenuerWithUuid />}
            />
            <Route path="mentors/:uuid" element={<MentorWithUuid />} />

            {/* Learn and Grow Routes */}
            <Route
              path="programsApplications"
              element={<ProgramsApplications />}
            />
            <Route path="classRooms" element={<ClassRooms />} />
            <Route path="generalResources" element={<GeneralResources />} />
            <Route path="businessTools" element={<BusinessTools />} />
            <Route
              path="businessTools/category/:category"
              element={<BusinessToolCategory />}
            />
            <Route
              path="businessTools/generate/:uuid"
              element={<GenerateBusinessTool />}
            />
            <Route path="uploadBusinessTool" element={<UploadBusinessTool />} />
            <Route
              path="editBusinessTool/:uuid"
              element={<EditBusinessTool />}
            />

            {/* CRAT System Routes */}
            <Route path="introduction" element={<Introduction />} />
            <Route path="report" element={<Report />} />

            {/* Reviewer Routes */}
            <Route path="cratReviews" element={<CratReviews />} />
            <Route
              path="cratReviewAssessment"
              element={<CratSubmissionReviewPage />}
            />

            {/* Application Routes */}
            <Route
              path="cratReviewApplications"
              element={<CratReviewApplications />}
            />
            <Route path="cratCatalogManager" element={<CratCatalogManager />} />

            {/* Stories Routes */}
            <Route path="successStories" element={<SuccessStories />} />

            {/* Conversation Routes */}
            <Route path="conversations" element={<Conversations />} />

            {/* CRAT System nested routes */}
            <Route path="crat-system">
              <Route path="introduction" element={<IntroductionPage />} />
              <Route
                path="domain/:domainKey"
                element={<DomainAssessmentPage />}
              />
              <Route path="marketDomain" element={<MarketDomainPage />} />
              <Route path="financialDomain" element={<FinancialDomain />} />
              <Route path="operationsDomain" element={<OperationsDomain />} />
              <Route path="legalDomain" element={<LegalDomainPage />} />
              <Route path="cratReview" element={<CratReviewPage />} />
              <Route path="report" element={<Report />} />
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
            <Route path="modules/:programId" element={<ModuleWithCourse />} />

            {/* Legacy redirect for old module route */}
            <Route
              path="learn-and-grow/modules/:moduleId"
              element={<Navigate to="/dashboard/modules/:moduleId" replace />}
            />

            {/* Quiz Routes */}
            <Route
              path="learn-and-grow/quizzes/:moduleId"
              element={<ModuleQuizzes />}
            />
            <Route
              path="learn-and-grow/quizzes/:moduleId/new"
              element={<CreateEditQuiz />}
            />
            <Route
              path="learn-and-grow/quizzes/:moduleId/edit/:quizId"
              element={<CreateEditQuiz />}
            />
            <Route
              path="learn-and-grow/quizzes/:moduleId/take/:quizId"
              element={<TakeQuiz />}
            />
            <Route
              path="learn-and-grow/quizzes/:moduleId/result/:attemptId"
              element={<QuizResult />}
            />
            <Route
              path="learn-and-grow/quizzes/:moduleId/my-attempts/:quizId"
              element={<UserAttempts />}
            />
            <Route
              path="learn-and-grow/quizzes/:moduleId/attempts/:quizId"
              element={<AdminAttempts />}
            />
            <Route
              path="learn-and-grow/quizzes/pending"
              element={<PendingQuizzes />}
            />
            <Route
              path="learn-and-grow/quizzes/grade/:attemptUuid"
              element={<GradeQuiz />}
            />

            <Route path="messages/:uuid" element={<MessagesWithUuid />} />
          </Route>

          {/* Standalone Report Route (accessible outside dashboard) */}

          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </TranslationProvider>
  );
}

export default App;
