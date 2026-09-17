import React, { useState, useEffect, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Loader from "./components/common/Loader";

// Layouts
import DashboardLayout from "@/layouts/DashboardLayout";
import AuthLayout from "@/layouts/AuthLayout";

// Auth Pages (small, eagerly loaded for fast auth UX)
import SignIn from "@/pages/auth/SignIn";
import SignUp from "@/pages/auth/SignUp";
import TermsOfService from "@/pages/legal/TermsOfService";
import PrivacyPolicy from "@/pages/legal/PrivacyPolicy";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";
import EmailConfirmation from "@/pages/auth/EmailConfirmation";
import ConfirmEmail from "@/pages/auth/ConfirmEmail";
import AuthorizationPage from "@/pages/auth/AuthorizationPage";

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
import MEOfficers from "./pages/users/meOfficers/MEOfficers";
import InterestedEnterprenuers from "./pages/users/interestedEnterprenuers/InterestedEntreprenuers";

// Lazy-loaded User Management Pages
const Users = React.lazy(() => import("./pages/users/users/Users"));
const Enterprenuers = React.lazy(() => import("./pages/users/enterprenuers/Enterprenuers"));
const Investors = React.lazy(() => import("./pages/users/investors/Investors"));
const Mentors = React.lazy(() => import("./pages/users/mentors/Mentors"));
const Reviewers = React.lazy(() => import("./pages/users/reviewers/Reviewers"));
const Admins = React.lazy(() => import("./pages/users/admins/Admins"));
const FinanceOfficers = React.lazy(() => import("./pages/users/financeOfficers/FinanceOfficers"));
const InterestedEnterprenuers = React.lazy(() => import("./pages/users/interestedEnterprenuers/InterestedEntreprenuers"));

// Lazy-loaded Mentor Pages
const MentorEntreprenuer = React.lazy(() => import("./pages/mentor/mentorEntreprenuers/MentorEntrepreneurs"));
const MyMentors = React.lazy(() => import("./pages/mentor/myMentors/MyMentors"));
const MentorshipRequests = React.lazy(() => import("./pages/mentor/mentorshipRequests/MentorshipRequests"));
const MentorshipApplications = React.lazy(() => import("./pages/mentor/mentorshipApplications/MentorshipApplications"));
const MentorReports = React.lazy(() => import("./pages/mentor/mentorReports/MentorReports"));

// Lazy-loaded Investment Pages
const MyInvestmentRequests = React.lazy(() => import("./pages/investment/myInvestmentRequests/MyInvestmentRequests"));
const InvestmentApplications = React.lazy(() => import("./pages/investment/InvestmentApplications"));
const InvestmentApplicationDetail = React.lazy(() => import("./pages/investment/InvestmentApplicationDetail"));
const InvestmentApplicationDetailWithActions = React.lazy(() => import("./pages/investment/InvestmentApplicationDetailWithActions"));
const InterestedEntrepreneursApplications = React.lazy(() => import("./pages/investment/InterestedEntrepreneursApplications"));
const InterestedInvestors = React.lazy(() => import("./pages/investment/interestedInvestors/InterestedInvestors"));
const ViewInvestmentRequest = React.lazy(() => import("./pages/investment/ViewInvestmentRequest"));

// Lazy-loaded Business Application Pages
const PendingApplications = React.lazy(() => import("./pages/business/PendingApplications"));
const ApprovedApplications = React.lazy(() => import("./pages/business/ApprovedApplications"));
const RejectedApplications = React.lazy(() => import("./pages/business/RejectedApplications"));

// Learn and Grow Pages
import ProgramsApplications from "./pages/learnandgrow/programsApplications/ProgramsApplications";
import ClassRooms from "./pages/learnandgrow/classRooms/ClassRooms";
import GeneralResources from "./pages/learnandgrow/generalResources/GeneralResources";
import BusinessTools from "./pages/learnandgrow/businessTools/BusinessTools";
import UploadBusinessTool from "./pages/learnandgrow/businessTools/UploadBusinessTool";
import EditBusinessTool from "./pages/learnandgrow/businessTools/EditBusinessTool";
import BusinessToolCategory from "./pages/learnandgrow/businessTools/BusinessToolCategory";
import GenerateBusinessTool from "./pages/learnandgrow/businessTools/GenerateBusinessTool";

// Lazy-loaded Learn and Grow Pages
const ProgramsApplications = React.lazy(() => import("./pages/learnandgrow/programsApplications/ProgramsApplications"));
const ClassRooms = React.lazy(() => import("./pages/learnandgrow/classRooms/ClassRooms"));
const GeneralResources = React.lazy(() => import("./pages/learnandgrow/generalResources/GeneralResources"));
const BusinessTools = React.lazy(() => import("./pages/learnandgrow/businessTools/BusinessTools"));
const UploadBusinessTool = React.lazy(() => import("./pages/learnandgrow/businessTools/UploadBusinessTool"));
const EditBusinessTool = React.lazy(() => import("./pages/learnandgrow/businessTools/EditBusinessTool"));

// Reviewer Pages

// Lazy-loaded Reviewer Pages
const CratReviews = React.lazy(() => import("./pages/reviewer/cratReviews/CratReviews"));

// Lazy-loaded Application Pages
const CratReviewApplications = React.lazy(() => import("./pages/applications/cratReviewApplications/CratReviewApplications"));
const CratCatalogManager = React.lazy(() => import("./pages/admin/CratCatalogManager"));

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
import ProgramCourseList from "./pages/users/enterprenuers/ProgramCourseList";
import ProgramME from "./pages/users/enterprenuers/ProgramME";
import ProgramCalendar from "./pages/users/enterprenuers/ProgramCalendar";
import ProgramCoaching from "./pages/users/enterprenuers/ProgramCoaching";
import ProgramDocuments from "./pages/users/enterprenuers/ProgramDocuments";
import LiveFeed from "./pages/feed/LiveFeed";
import MyCalendar from "./pages/calendar/MyCalendar";
import ProgramComms from "./pages/users/enterprenuers/ProgramComms";
import ProgramReports from "./pages/users/enterprenuers/ProgramReports";
import ProgramDashboard from "./pages/users/enterprenuers/ProgramDashboard";
import ProgramGrants from "./pages/users/enterprenuers/ProgramGrants";
import ProgramWorkplan from "./pages/users/enterprenuers/ProgramWorkplan";
import ProgramTargets from "./pages/users/enterprenuers/ProgramTargets";
import MEPortfolioDashboard from "./pages/users/enterprenuers/MEPortfolioDashboard";
import SurveyResults from "./pages/users/enterprenuers/SurveyResults";
import SurveyManager from "./pages/users/enterprenuers/SurveyManager";
import MySurveys from "./pages/learnandgrow/surveys/MySurveys";
import CoursePlayer from "./pages/learnandgrow/player/CoursePlayer";
import CourseDetails from "./pages/learnandgrow/courses/CourseDetails";
import CourseLibrary from "./pages/learnandgrow/courses/CourseLibrary";
import AddCourse from "./pages/learnandgrow/courses/AddCourse";
import TakeSurvey from "./pages/learnandgrow/surveys/TakeSurvey";
import MessagesWithUuid from "./pages/chat/messages/MessagesWithUuid";

// Lazy-loaded CRAT System nested route components
const OperationsDomain = React.lazy(() => import("./pages/cratSystem/operationsDomain/OperationsDomain"));
const CratReviewPage = React.lazy(() => import("./pages/cratSystem/cratReview/CratReview"));
const IntroductionPage = React.lazy(() => import("./pages/cratSystem/Introduction"));
const LegalDomainPage = React.lazy(() => import("./pages/cratSystem/legalDomain/LegalDomain"));
const MarketDomainPage = React.lazy(() => import("./pages/cratSystem/marketDomain/MarketDomain"));
const FinancialDomain = React.lazy(() => import("./pages/cratSystem/financialDomain/FinancialDomain"));
const Report = React.lazy(() => import("./pages/cratSystem/report/Report"));
const CratSubmissionReviewPage = React.lazy(() => import("./pages/cratSystem/reviewAssessment/CratSubmissionReviewPage"));
const DomainAssessmentPage = React.lazy(() => import("./pages/cratSystem/domain/DomainAssessmentPage"));

// Lazy-loaded Dynamic route components
const MyMentorDetailsWithUuid = React.lazy(() => import("./pages/mentor/myMentorDetails/MyMentorDetailsWithUuid"));
const InvestorDetailsWithUuid = React.lazy(() => import("./pages/users/investors/details/InvestorDetailsWithUuid"));
const BusinessDetailsWithUuid = React.lazy(() => import("./pages/business/businessDetails/BusinessDetailsWithUuid"));
const CategoryWithParam = React.lazy(() => import("./pages/learnandgrow/generalResources/category/CategoryWithParam"));
const ModuleWithCourse = React.lazy(() => import("./pages/learnandgrow/modules/ModuleWithCourse"));
const MessagesWithUuid = React.lazy(() => import("./pages/chat/messages/MessagesWithUuid"));

// Lazy-loaded Account Components
const InvestorProfile = React.lazy(() => import("./pages/account/investorProfile/InvestorProfile"));

// Lazy-loaded Application Components
const AcceptedProgramApplications = React.lazy(() => import("./pages/applications/acceptedProgramApplications/AcceptedProgramApplications"));
const AssignProgramApplicationReviewersWithUuid = React.lazy(() => import("./pages/applications/assignProgramApplicationReviewers/AssignProgramApplicationReviewersWithUuid"));
const PendingProgramApplications = React.lazy(() => import("./pages/applications/pendingProgramApplications/PendingProgramApplications"));
const RejectedProgramApplications = React.lazy(() => import("./pages/applications/rejectedProgramApplications/RejectedProgramApplications"));
const UserProgramApplicationWithUuid = React.lazy(() => import("./pages/applications/userProgramApplication/UserProgramApplicationWithUuid"));
const ViewProgramApplicationWithUuid = React.lazy(() => import("./pages/applications/viewProgramApplication/ViewProgramApplicationWithUuid"));

// Lazy-loaded Assignment Components
const BusinessAssignments = React.lazy(() => import("./pages/assignments/businessAssignments/BusinessAssignments"));
const ProgramAssignments = React.lazy(() => import("./pages/assignments/programAssignments/ProgramAssignments"));

// Lazy-loaded Business Components
const ApplicationRejectionWithUuid = React.lazy(() => import("./pages/business/applicationRejection/ApplicationRejectionWithUuid"));
const ApprovedApplicationWithUuid = React.lazy(() => import("./pages/business/approvedApplications/ApprovedApplicationWithUuid"));
const AssignReviewerWithUuid = React.lazy(() => import("./pages/business/assignReviewer/AssignReviewerWithUuid"));
const CratDocuments = React.lazy(() => import("./pages/business/businessDetails/CratDocuments"));
const BusinessDetailsByMentorWithUuid = React.lazy(() => import("./pages/business/businessDetailsByMentor/BusinessDetailsByMentorWithUuid"));

// Lazy-loaded Investment Opportunity Components
const NewOpportunity = React.lazy(() => import("./pages/investment-opportunities/opportunities/{new}"));
const OpportunityWithUuid = React.lazy(() => import("./pages/investment-opportunities/opportunities/OpportunityWithUuid"));
const EditOpportunityWithUuid = React.lazy(() => import("./pages/investment-opportunities/opportunities/EditOpportunityWithUuid"));

// Lazy-loaded Investment Components
const AcceptedRequests = React.lazy(() => import("./pages/investment/acceptedRequests/AcceptedRequests"));
const AssignInvestmentRequestReviewersWithUuid = React.lazy(() => import("./pages/investment/assignInvestmentRequestReviewers/AssignInvestmentRequestReviewersWithUuid"));
const InvestmentApplicationWithUuid = React.lazy(() => import("./pages/investment/investmentApplication/InvestmentApplicationWithUuid"));
const InvestmentApplicationByEntreprenuerWithUuid = React.lazy(() => import("./pages/investment/investmentApplicationByEntreprenuer/InvestmentApplicationByEntreprenuerWithUuid"));
const PendingRequests = React.lazy(() => import("./pages/investment/pendingRequests/PendingRequests"));
const RejectApplicationRequestWithUuid = React.lazy(() => import("./pages/investment/rejectApplicationRequest/RejectApplicationRequestWithUuid"));
const RejectedRequests = React.lazy(() => import("./pages/investment/rejectedRequests/RejectedRequests"));
const ReviewerAssignedInvestmentRequests = React.lazy(() => import("./pages/investment/reviewerAssignedInvestmentRequests/ReviewerAssignedInvestmentRequests"));
const ViewInvestmentRequestWithUuid = React.lazy(() => import("./pages/investment/viewInvestmentRequest/ViewInvestmentRequestWithUuid"));

// Lazy-loaded Investor Components
const InvestorSectorBusinesses = React.lazy(() => import("./pages/investor/investorSectorBusinesses/InvestorSectorBusinesses"));

// Lazy-loaded Learn and Grow Components
const AddModule = React.lazy(() => import("./pages/learnandgrow/modules/add/AddModule"));
const EditModule = React.lazy(() => import("./pages/learnandgrow/modules/edit/EditModule"));
const Programs = React.lazy(() => import("./pages/learnandgrow/programs/Programs"));
const AddProgram = React.lazy(() => import("./pages/learnandgrow/programs/add/AddProgram"));
const EditProgram = React.lazy(() => import("./pages/learnandgrow/programs/edit/EditProgram"));
const NewProgramsApplication = React.lazy(() => import("./pages/learnandgrow/programsApplications/NewProgramsApplication"));
const ProgramsApplicationsWithUuid = React.lazy(() => import("./pages/learnandgrow/programsApplications/ProgramsApplicationsWithUuid"));
const EditProgramsApplicationsWithUuid = React.lazy(() => import("./pages/learnandgrow/programsApplications/EditProgramsApplicationsWithUuid"));
const SlideWithUuid = React.lazy(() => import("./pages/learnandgrow/slides/SlideWithUuid"));
const AddSlide = React.lazy(() => import("./pages/learnandgrow/slides/add/AddSlide"));
const EditSlide = React.lazy(() => import("./pages/learnandgrow/slides/edit/EditSlide"));
const CourseDetailsPage = React.lazy(() => import("./pages/learnandgrow/programs/details/page"));

// Lazy-loaded Quiz Components
const ModuleQuizzes = React.lazy(() => import("./pages/learnandgrow/quizzes/ModuleQuizzes"));
const CreateEditQuiz = React.lazy(() => import("./pages/learnandgrow/quizzes/CreateEditQuiz"));
const TakeQuiz = React.lazy(() => import("./pages/learnandgrow/quizzes/TakeQuiz"));
const QuizResult = React.lazy(() => import("./pages/learnandgrow/quizzes/QuizResult"));
const UserAttempts = React.lazy(() => import("./pages/learnandgrow/quizzes/UserAttempts"));
const AdminAttempts = React.lazy(() => import("./pages/learnandgrow/quizzes/AdminAttempts"));
const PendingQuizzes = React.lazy(() => import("./pages/learnandgrow/quizzes/PendingQuizzes"));
const GradeQuiz = React.lazy(() => import("./pages/learnandgrow/quizzes/GradeQuiz"));

// Lazy-loaded Log Components
const UserActivityLogs = React.lazy(() => import("./pages/logs/UserActivityLogs"));

// Lazy-loaded Mentor Components
const AddEntreprenuerReportWithUuid = React.lazy(() => import("./pages/mentor/addEntreprenuerReport/AddEntreprenuerReportWithUuid"));
const MentorReportWithUuid = React.lazy(() => import("./pages/mentor/mentorReport/MentorReportWithUuid"));
const EntrepreneurReportsWithUuid = React.lazy(() => import("./pages/mentor/entrepreneurReports/EntrepreneurReportsWithUuid"));

// Lazy-loaded Mentorship Components
const MentorshipApplicationFormWithUuid = React.lazy(() => import("./pages/mentorship/mentorshipApplicationForm/MentorshipApplicationFormWithUuid"));

// Additional Missing Imports - Reviewer Components

// Lazy-loaded Program Components
const BFA = React.lazy(() => import("./pages/programs/bfa/BFA"));
const Consultance = React.lazy(() => import("./pages/programs/consultance/Consultance"));
const EditProgramWithUuid = React.lazy(() => import("./pages/programs/editProgram/EditProgramWithUuid"));
const IRA = React.lazy(() => import("./pages/programs/ira/IRA"));
const NewProgram = React.lazy(() => import("./pages/programs/NewProgram"));
const NewProgramUpdateWithUuid = React.lazy(() => import("./pages/programs/newProgramUpdate/NewProgramUpdateWithUuid"));
const ProgramDetailsWithUuid = React.lazy(() => import("./pages/programs/programDetails/ProgramDetailsWithUuid"));
const ProgramUpdatesWithUuid = React.lazy(() => import("./pages/programs/programUpdates/ProgramUpdatesWithUuid"));
const SendProgramApplicationWithUuid = React.lazy(() => import("./pages/programs/sendProgramApplication/SendProgramApplicationWithUuid"));

// Lazy-loaded Reviewer Components
const ApplicationList = React.lazy(() => import("./pages/reviewer/applicationList/ApplicationList"));
const PreviewPage = React.lazy(() => import("./pages/reviewer/previewPage/PreviewPage"));

// Lazy-loaded Sector Components
const AddSector = React.lazy(() => import("./pages/sectors/addSector/AddSector"));
const EditSectorWithUuid = React.lazy(() => import("./pages/sectors/editSector/EditSectorWithUuid"));
const SectorBusinessesWithUuid = React.lazy(() => import("./pages/sectors/sectorBusinesses/SectorBusinessesWithUuid"));

// Lazy-loaded Stories Components
const NewStory = React.lazy(() => import("./pages/stories/newStory/NewStory"));
const ReadStoryWithUuid = React.lazy(() => import("./pages/stories/readStory/ReadStoryWithUuid"));
const EditSuccessStoryWithUuid = React.lazy(() => import("./pages/stories/successStories/EditSuccessStoryWithUuid"));
const NewSuccessStory = React.lazy(() => import("./pages/stories/successStories/new/NewSuccessStory"));
const SuccessStoryWithUuid = React.lazy(() => import("./pages/stories/successStories/SuccessStoryWithUuid"));

// Lazy-loaded User Components
const InvestorWithUuid = React.lazy(() => import("./pages/users/investors/InvestorWithUuid"));
const MentorEntreprenuerWithUuid = React.lazy(() => import("./pages/users/mentorEntreprenuers/MentorEntreprenuerWithUuid"));
const MentorWithUuid = React.lazy(() => import("./pages/users/mentors/MentorWithUuid"));
// TranslationProvider - eagerly loaded (small, needed at root)
import { TranslationProvider } from "./locales";
import EditAccountDetails from "./pages/account/editAccount/editAccountDetails";
import EntrepreneurProfile from "./pages/account/entreprenuerProfile";
import MentorTracker from "./pages/tracker/mentor/MentorTracker";
import EnterpriseTrackerDetails from "./pages/tracker/mentor/EnterpriseTrackerDetails";
import EnterpriseKyc from "./pages/tracker/mentor/EnterpriseKyc";
import EntrepreneurMilestones from "./pages/tracker/entreprenuer/EntrepreneurMilestones";
import CoachingSessions from "./pages/tracker/entreprenuer/CoachingSessions";
import MyMEProgress from "./pages/tracker/entreprenuer/MyMEProgress";
import MyProgramTargets from "./pages/tracker/entreprenuer/MyProgramTargets";
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
import CapitalManagers from "./pages/users/capitalManagers/CapitalManagers";
import CapitalRoute from "./components/capital/CapitalRoute";
import CapitalHome from "./pages/capital/CapitalHome";
import CapitalRequests from "./pages/capital/CapitalRequests";
import CapitalRequestDetail from "./pages/capital/CapitalRequestDetail";
import CapitalMatching from "./pages/capital/CapitalMatching";
import ManageMatching from "./pages/capital/ManageMatching";
import CapitalIntroductions from "./pages/capital/CapitalIntroductions";
import CapitalOpportunities from "./pages/capital/CapitalOpportunities";
import CapitalOpportunityRecord from "./pages/capital/CapitalOpportunityRecord";
import CapitalPipeline from "./pages/capital/CapitalPipeline";
import CapitalDealRooms from "./pages/capital/CapitalDealRooms";
import CapitalDueDiligence from "./pages/capital/CapitalDueDiligence";
import CapitalProviders from "./pages/capital/CapitalProviders";
import CapitalProviderDetail from "./pages/capital/CapitalProviderDetail";
import CapitalEnterprises from "./pages/capital/CapitalEnterprises";
import CapitalCommunications from "./pages/capital/CapitalCommunications";
import CapitalFacilitated from "./pages/capital/CapitalFacilitated";
import CapitalReports from "./pages/capital/CapitalReports";
import CapitalNotifications from "./pages/capital/CapitalNotifications";
import CapitalSettings from "./pages/capital/CapitalSettings";
import CapitalDeals from "./pages/capital/CapitalDeals";
import CapitalInvestors from "./pages/capital/CapitalInvestors";
import CapitalApplications from "./pages/capital/CapitalApplications";
import CapitalInterestedInvestors from "./pages/capital/CapitalInterestedInvestors";

// Capital facilitation screens are open to the internal roles an administrator
// can grant capital permissions to; CapitalRoute then checks the permission.
const CAPITAL_STAFF = ["CFM", "Admin", "BDA", "ME", "Finance"];

// One capital facilitation page: staff only, and only with the permission.
const capitalPage = (need, page) => (
  <RoleRoute allow={CAPITAL_STAFF}>
    <CapitalRoute need={need}>{page}</CapitalRoute>
  </RoleRoute>
);

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
        <Suspense fallback={<Loader height="h-screen" />}>
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
          <Route path="/signin" element={<Navigate to="/auth/signin" replace />} />
          <Route path="/signup" element={<Navigate to="/auth/signup" replace />} />
          <Route path="/forgotPassword" element={<Navigate to="/auth/forgot-password" replace />} />
          <Route path="/resetPassword" element={<Navigate to="/auth/reset-password" replace />} />
          <Route path="/emailConfirmation" element={<Navigate to="/auth/email-confirmation" replace />} />
          <Route path="/confirmEmail" element={<Navigate to="/auth/confirm-email" replace />} />
          <Route path="/authorizationPage" element={<Navigate to="/auth/authorization" replace />} />

          {/* Dashboard Routes */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />

            {/* The live feed is the one screen with no role gate: every
                signed-in user reads and writes the same board. */}
            <Route path="feed" element={<LiveFeed />} />

            {/* Everyone's calendar: events published to them, and their own
                reminders. No role gate — the visibility is per entry. */}
            <Route path="calendar" element={<MyCalendar />} />

            {/* User Management Routes */}
            <Route path="users" element={<Users />} />
            {/* Startups is the flat directory for every role. */}
            <Route path="enterprenuers" element={<Enterprenuers />} />
            <Route path="enterprenuers/all" element={<Enterprenuers />} />

            {/* Program Management (Admin/Staff): category -> program -> startups. */}
            <Route path="programManagement" element={<ProgramCategories />} />
            {/* Monitoring & Evaluation is the M&E Officer's workspace alone. */}
            <Route
              path="programManagement/me"
              element={
                <RoleRoute allow={["ME"]}>
                  <MEPortfolioDashboard />
                </RoleRoute>
              }
            />
            <Route
              path="programManagement/category/:category"
              element={<StartupPrograms />}
            />
            <Route
              path="programManagement/program/:uuid"
              element={<ProgramStartups />}
            />
            <Route
              path="programManagement/program/:uuid/courses"
              element={<ProgramCourseList />}
            />
            <Route
              path="programManagement/program/:uuid/course/:courseUuid"
              element={<ProgramCourses />}
            />
            {/* The old modules url now lands on the course list. */}
            <Route
              path="programManagement/program/:uuid/modules"
              element={<ProgramCourseList />}
            />
            <Route
              path="programManagement/module/:uuid"
              element={<ModuleDetails />}
            />
            {/* Writing surveys is M&E work; startups answer them through
                /dashboard/surveys, which stays open to them. */}
            <Route
              path="programManagement/program/:uuid/surveys"
              element={
                <RoleRoute allow={["ME"]}>
                  <ProgramSurveys />
                </RoleRoute>
              }
            />
            {/* The Program Calendar belongs to whoever runs the
                programme: Admin, or the advisor leading it. The API narrows
                it to this programme’s own lead. */}
            {/* The workplan: outputs, activities and when each runs. */}
            <Route
              path="programManagement/program/:uuid/workplan"
              element={
                <RoleRoute allow={["Admin", "BDA", "ME", "Finance"]}>
                  <ProgramWorkplan />
                </RoleRoute>
              }
            />
            {/* Tailored milestones and KPIs every startup on the programme
                must report; the advisor sets them and reviews submissions. */}
            <Route
              path="programManagement/program/:uuid/milestones-kpis"
              element={
                <RoleRoute allow={["Admin", "BDA", "ME", "Finance"]}>
                  <ProgramTargets />
                </RoleRoute>
              }
            />
            {/* Who on this programme gets a grant. The lead selects; the
                finance officer disburses against what they set. */}
            <Route
              path="programManagement/program/:uuid/grants"
              element={
                <RoleRoute allow={["Admin", "BDA", "ME", "Finance"]}>
                  <ProgramGrants />
                </RoleRoute>
              }
            />
            {/* The programme dashboard: the lead’s landing screen. */}
            <Route
              path="programManagement/program/:uuid/dashboard"
              element={
                <RoleRoute allow={["Admin", "BDA", "ME", "Finance"]}>
                  <ProgramDashboard />
                </RoleRoute>
              }
            />
            {/* The report builder. Reading is open to whoever reports on the
                programme; building and finalising are narrowed by the API. */}
            <Route
              path="programManagement/program/:uuid/reports"
              element={
                <RoleRoute allow={["Admin", "BDA", "ME", "Finance"]}>
                  <ProgramReports />
                </RoleRoute>
              }
            />
            {/* Cohort communications and the internal alert board. Reading is
                open to whoever reports on the programme; sending is narrowed
                by the API to Admin and the lead. */}
            <Route
              path="programManagement/program/:uuid/communications"
              element={
                <RoleRoute allow={["Admin", "BDA", "ME", "Finance"]}>
                  <ProgramComms />
                </RoleRoute>
              }
            />
            {/* The document library. Finance and M&E read it; filing is
                narrowed by the API to Admin and the programme lead. */}
            <Route
              path="programManagement/program/:uuid/documents"
              element={
                <RoleRoute allow={["Admin", "BDA", "ME", "Finance"]}>
                  <ProgramDocuments />
                </RoleRoute>
              }
            />
            {/* Coaching oversight. Mentors are admitted too - the API shows
                them only the enterprises they coach, and holds back the
                private notes on anyone else’s confidential sessions. */}
            <Route
              path="programManagement/program/:uuid/coaching"
              element={
                <RoleRoute allow={["Admin", "BDA", "Mentor", "ME"]}>
                  <ProgramCoaching />
                </RoleRoute>
              }
            />
            <Route
              path="programManagement/program/:uuid/calendar"
              element={
                <RoleRoute allow={["Admin", "BDA"]}>
                  <ProgramCalendar />
                </RoleRoute>
              }
            />
            <Route
              path="programManagement/program/:uuid/me"
              element={
                <RoleRoute allow={["ME"]}>
                  <ProgramME />
                </RoleRoute>
              }
            />
            <Route path="learn" element={<CoursePlayer />} />
            {/* The course page a startup reads before enrolling. */}
            {/* The admin course library: write a course once and choose the
                programs it appears on. Listed before "courses/:courseUuid"
                so "library" is not read as a course uuid. */}
            <Route
              path="courses/library"
              element={
                <RoleRoute allow={["Admin"]}>
                  <CourseLibrary />
                </RoleRoute>
              }
            />
            <Route
              path="courses/library/new"
              element={
                <RoleRoute allow={["Admin"]}>
                  <AddCourse />
                </RoleRoute>
              }
            />
            <Route path="courses/:courseUuid" element={<CourseDetails />} />
            <Route path="learn/course/:courseUuid" element={<CoursePlayer />} />
            <Route path="learn/:uuid" element={<CoursePlayer />} />
            <Route path="surveys" element={<MySurveys />} />
            {/* The M&E Officer's surveys that reach beyond one programme: to
                every startup, or to people chosen by name. */}
            <Route
              path="surveys/manage"
              element={
                <RoleRoute allow={["ME"]}>
                  <SurveyManager />
                </RoleRoute>
              }
            />
            <Route
              path="surveys/new"
              element={
                <RoleRoute allow={["ME"]}>
                  <SurveyBuilder />
                </RoleRoute>
              }
            />
            <Route path="surveys/:uuid/take" element={<TakeSurvey />} />
            <Route
              path="surveys/:uuid/edit"
              element={
                <RoleRoute allow={["ME"]}>
                  <SurveyBuilder />
                </RoleRoute>
              }
            />
            <Route
              path="surveys/:uuid/results"
              element={
                <RoleRoute allow={["ME"]}>
                  <SurveyResults />
                </RoleRoute>
              }
            />
            <Route path="investors" element={<Investors />} />
            <Route path="mentors" element={<Mentors />} />
            <Route path="reviewers" element={<Reviewers />} />
            <Route path="admins" element={<Admins />} />
            <Route path="financeOfficers" element={<FinanceOfficers />} />
            <Route path="meOfficers" element={<MEOfficers />} />
            <Route
              path="capitalManagers"
              element={
                <RoleRoute allow={["Admin"]}>
                  <CapitalManagers />
                </RoleRoute>
              }
            />

            {/* Capital facilitation. /capital is shared by everyone a capital
                notification reaches: enterprises land on their own capital
                workspace, staff on the facilitation dashboard. Every other
                screen is staff-only and needs its capital permission. */}
            <Route path="capital" element={<CapitalHome />} />
            {/* Raise Capital, the startup's side: investors to be introduced
                to, its applications, and investors interested in it. */}
            <Route path="capital/investors" element={<RoleRoute allow={["Enterprenuer"]}><CapitalInvestors /></RoleRoute>} />
            <Route path="capital/applications" element={<RoleRoute allow={["Enterprenuer"]}><CapitalApplications /></RoleRoute>} />
            <Route path="capital/interested-investors" element={<RoleRoute allow={["Enterprenuer"]}><CapitalInterestedInvestors /></RoleRoute>} />
            <Route path="capital/requests" element={capitalPage(["capital.requests.view"], <CapitalRequests />)} />
            <Route path="capital/requests/:uuid" element={capitalPage(["capital.requests.view"], <CapitalRequestDetail />)} />
            <Route path="capital/matching" element={capitalPage(["capital.matching.manage"], <CapitalMatching />)} />
            <Route path="capital/matching/:uuid" element={capitalPage(["capital.matching.manage"], <ManageMatching />)} />
            <Route path="capital/introductions" element={capitalPage(["capital.introductions.manage"], <CapitalIntroductions />)} />
            <Route path="capital/opportunities" element={capitalPage(["capital.opportunities.view"], <CapitalOpportunities />)} />
            <Route path="capital/opportunities/:uuid" element={capitalPage(["capital.opportunities.view"], <CapitalOpportunityRecord />)} />
            <Route path="capital/pipeline" element={capitalPage(["capital.opportunities.view"], <CapitalPipeline />)} />
            <Route path="capital/deal-rooms" element={capitalPage(["capital.dealrooms.manage"], <CapitalDealRooms />)} />
            <Route path="capital/due-diligence" element={capitalPage(["capital.duediligence.manage"], <CapitalDueDiligence />)} />
            <Route path="capital/providers" element={capitalPage(["capital.providers.view"], <CapitalProviders />)} />
            <Route path="capital/providers/:uuid" element={capitalPage(["capital.providers.view"], <CapitalProviderDetail />)} />
            <Route path="capital/enterprises" element={capitalPage(["capital.requests.view"], <CapitalEnterprises />)} />
            <Route path="capital/communications" element={capitalPage(["capital.communications.moderate"], <CapitalCommunications />)} />
            <Route path="capital/facilitated" element={capitalPage(["capital.reports.view", "capital.outcomes.manage"], <CapitalFacilitated />)} />
            <Route path="capital/reports" element={capitalPage(["capital.reports.view"], <CapitalReports />)} />
            <Route path="capital/notifications" element={capitalPage([], <CapitalNotifications />)} />
            <Route path="capital/settings" element={capitalPage(["capital.settings.manage", "capital.permissions.manage", "capital.audit.view"], <CapitalSettings />)} />
            {/* A capital provider's side: enterprises seeking capital, its
                requests to Anza, and deals once introduced. */}
            <Route
              path="capital-deals"
              element={
                <RoleRoute allow={["Investor"]}>
                  <CapitalDeals />
                </RoleRoute>
              }
            />
            <Route
              path="interestedEnterprenuers"
              element={<InterestedEnterprenuers />}
            />

            {/* Mentor Routes */}
            <Route path="myMentors" element={<MyMentors />} />
            <Route path="mentorEntreprenuers" element={<MentorEntreprenuer />} />
            <Route path="mentorEntreprenuers/businessDetailsByMentor/:uuid" element={<BusinessDetailsByMentorWithUuid />} />
            <Route path="mentorshipRequests" element={<MentorshipRequests />} />
            <Route path="mentorshipApplications" element={<MentorshipApplications />} />
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
              element={<CoachingSessions />}
            />
            <Route path="my-me-progress" element={<MyMEProgress />} />
            <Route
              path="my-programme-targets"
              element={
                <RoleRoute allow={["Enterprenuer"]}>
                  <MyProgramTargets />
                </RoleRoute>
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
            {/* A recipient’s grant: contract, advisor, tranches and milestone
                reporting. The Program Lead opens it from Grant Recipients, so
                it is no longer Finance-only. The tracker APIs behind it
                already accept a BDA. */}
            <Route
              path="trackerPrograms/:programUuid/startup/:entUuid"
              element={
                <RoleRoute allow={["Finance", "Admin", "BDA"]}>
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
            <Route path="myInvestmentRequests" element={<MyInvestmentRequests />} />
            <Route path="viewInvestmentRequest/:uuid" element={<ViewInvestmentRequest />} />
            <Route path="investmentApplications" element={<InvestmentApplications />} />
            <Route path="investmentApplications/:uuid" element={<InvestmentApplicationDetailWithActions />} />
            <Route path="interestedInvestors" element={<InterestedInvestors />} />
            <Route path="interestedEntrepreneursApplications" element={<InterestedEntrepreneursApplications />} />
            <Route path="opportunities" element={<Opportunities />} />

            {/* Business Application Routes */}
            <Route path="pendingApplications" element={<PendingApplications />} />
            <Route path="approvedApplications" element={<ApprovedApplications />} />
            <Route path="rejectedApplications" element={<RejectedApplications />} />

            {/* Account Routes */}
            <Route path="edit-profile" element={<EditAccountDetails />} />
            <Route path="entreprenuer-profile" element={<EntrepreneurProfile />} />
            <Route path="investorProfile" element={<InvestorProfile />} />

            {/* Application Routes - Additional */}
            <Route path="acceptedProgramApplications" element={<AcceptedProgramApplications />} />
            <Route path="assignProgramApplicationReviewers/:uuid" element={<AssignProgramApplicationReviewersWithUuid />} />
            <Route path="pendingProgramApplications" element={<PendingProgramApplications />} />
            <Route path="rejectedProgramApplications" element={<RejectedProgramApplications />} />
            <Route path="userProgramApplication/:uuid" element={<UserProgramApplicationWithUuid />} />
            <Route path="viewProgramApplication/:uuid" element={<ViewProgramApplicationWithUuid />} />

            {/* Assignment Routes */}
            <Route path="businessAssignments" element={<BusinessAssignments />} />
            <Route path="programAssignments" element={<ProgramAssignments />} />

            {/* Business Routes - Additional */}
            <Route path="applicationRejection/:uuid" element={<ApplicationRejectionWithUuid />} />
            <Route path="approvedApplications/:uuid" element={<ApprovedApplicationWithUuid />} />
            <Route path="assignReviewer/:uuid" element={<AssignReviewerWithUuid />} />
            <Route path="businessDetails/:uuid/crat-documents" element={<CratDocuments />} />
            <Route path="businessDetailsByMentor/:uuid" element={<BusinessDetailsByMentorWithUuid />} />

            {/* Investment Opportunity Routes - Additional */}
            <Route path="opportunities/:uuid" element={<OpportunityWithUuid />} />
            <Route path="opportunities/:uuid/edit" element={<EditOpportunityWithUuid />} />
            <Route path="opportunities/new" element={<NewOpportunity />} />

            {/* Investment Routes - Additional */}
            <Route path="acceptedRequests" element={<AcceptedRequests />} />
            <Route path="assignInvestmentRequestReviewers/:uuid" element={<AssignInvestmentRequestReviewersWithUuid />} />
            <Route path="investmentApplication/:uuid" element={<InvestmentApplicationWithUuid />} />
            <Route path="investmentApplicationByEntreprenuer/:uuid" element={<InvestmentApplicationByEntreprenuerWithUuid />} />
            <Route path="pendingRequests" element={<PendingRequests />} />
            <Route path="rejectApplicationRequest/:uuid" element={<RejectApplicationRequestWithUuid />} />
            <Route path="rejectedRequests" element={<RejectedRequests />} />
            <Route path="reviewerAssignedInvestmentRequests" element={<ReviewerAssignedInvestmentRequests />} />
            <Route path="viewInvestmentRequest/:uuid" element={<ViewInvestmentRequestWithUuid />} />

            {/* Investor Routes */}
            <Route path="investorSectorBusinesses" element={<InvestorSectorBusinesses />} />

            {/* Learn and Grow Routes - Additional */}
            <Route path="programs/:course" element={<Programs />} />
            <Route path="programs/details/:uuid" element={<CourseDetailsPage />} />
            <Route path="programs/add" element={<AddProgram />} />
            <Route path="programs/edit" element={<EditProgram />} />
            <Route path="modules/add" element={<AddModule />} />
            <Route path="modules/edit" element={<EditModule />} />
            <Route path="programsApplications/:uuid" element={<ProgramsApplicationsWithUuid />} />
            <Route path="programsApplications/:uuid/edit" element={<EditProgramsApplicationsWithUuid />} />
            <Route path="programsApplications/new" element={<NewProgramsApplication />} />
            <Route path="slides/:uuid" element={<SlideWithUuid />} />
            <Route path="slides/add" element={<AddSlide />} />
            <Route path="slides/edit" element={<EditSlide />} />

            {/* Log Routes */}
            <Route path="logs/:uuid" element={<UserActivityLogs />} />

            {/* Mentor Routes - Additional */}
            <Route path="addEntreprenuerReport/:uuid" element={<AddEntreprenuerReportWithUuid />} />
            <Route path="mentorReport/:uuid" element={<MentorReportWithUuid />} />
            <Route path="entrepreneurReports/:uuid" element={<EntrepreneurReportsWithUuid />} />

            {/* Mentorship Routes */}
            <Route path="mentorshipApplicationForm/:uuid" element={<MentorshipApplicationFormWithUuid />} />

            {/* Pitch Materials Routes */}
            <Route path="documents" element={<Documents />} />
            <Route path="uploadMaterial/:type" element={<UploadMaterialWithType />} />
            <Route path="videos" element={<Videos />} />
            <Route path="viewer/:uuid" element={<ViewerWithUuid />} />

            {/* Program Routes - Additional */}
            <Route path="bfa" element={<BFA />} />
            <Route path="consultance" element={<Consultance />} />
            <Route path="editProgram/:uuid" element={<EditProgramWithUuid />} />
            <Route path="ira" element={<IRA />} />
            <Route path="newProgram" element={<NewProgram />} />
            <Route path="newProgramUpdate/:uuid" element={<NewProgramUpdateWithUuid />} />
            <Route path="programDetails/:uuid" element={<ProgramDetailsWithUuid />} />
            <Route path="programUpdates/:uuid" element={<ProgramUpdatesWithUuid />} />
            <Route path="sendProgramApplication/:uuid" element={<SendProgramApplicationWithUuid />} />

            {/* Reviewer Routes - Additional */}

            {/* Sector Routes */}
            <Route path="addSector" element={<AddSector />} />
            <Route path="editSector/:uuid" element={<EditSectorWithUuid />} />
            <Route path="sectorBusinesses/:uuid" element={<SectorBusinessesWithUuid />} />

            {/* Stories Routes - Additional */}
            <Route path="newStory" element={<NewStory />} />
            <Route path="readStory/:uuid" element={<ReadStoryWithUuid />} />
            <Route path="successStories/:uuid/edit" element={<EditSuccessStoryWithUuid />} />
            <Route path="successStories/:uuid" element={<SuccessStoryWithUuid />} />
            <Route path="successStories/new" element={<NewSuccessStory />} />

            {/* User Routes - Additional */}
            <Route path="investors/:uuid" element={<InvestorWithUuid />} />
            <Route path="mentorEntreprenuers/:uuid" element={<MentorEntreprenuerWithUuid />} />
            <Route path="mentors/:uuid" element={<MentorWithUuid />} />

            {/* Learn and Grow Routes */}
            <Route
              path="programsApplications"
              element={<ProgramsApplications />}
            />
            {/* Courses is a learner page. Admin reaches courses through the
                Course Library instead, so it is listed by every role except
                Admin rather than left open by URL. */}
            <Route
              path="classRooms"
              element={
                <RoleRoute allow={["Enterprenuer", "BDA", "Mentor", "Finance", "ME"]}>
                  <ClassRooms />
                </RoleRoute>
              }
            />
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
            <Route path="editBusinessTool/:uuid" element={<EditBusinessTool />} />

            {/* CRAT System Routes */}
            <Route path="introduction" element={<Introduction />} />
            <Route path="report" element={<Report />} />

            {/* Application Routes */}
            <Route path="cratReviewApplications" element={<CratReviewApplications />} />
            <Route path="cratCatalogManager" element={<CratCatalogManager />} />

            {/* Stories Routes */}
            <Route path="successStories" element={<SuccessStories />} />

            {/* Conversation Routes */}
            <Route path="conversations" element={<Conversations />} />

            {/* CRAT System nested routes */}
            <Route path="crat-system">
              <Route path="introduction" element={<IntroductionPage />} />
              <Route path="domain/:domainKey" element={<DomainAssessmentPage />} />
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
            <Route path="myMentorDetails/:uuid" element={<MyMentorDetailsWithUuid />} />
            <Route path="investors/details/:uuid" element={<InvestorDetailsWithUuid />} />
            <Route path="enterprenuers/businessDetails/:uuid" element={<BusinessDetailsWithUuid />} />
            <Route path="generalResources/category/:category" element={<CategoryWithParam />} />
            <Route path="modules/:programId" element={<ModuleWithCourse />} />

            {/* Legacy redirect for old module route */}
            <Route path="learn-and-grow/modules/:moduleId" element={<Navigate to="/dashboard/modules/:moduleId" replace />} />

            {/* Quiz Routes */}
            <Route path="learn-and-grow/quizzes/:moduleId" element={<ModuleQuizzes />} />
            <Route path="learn-and-grow/quizzes/:moduleId/new" element={<CreateEditQuiz />} />
            <Route path="learn-and-grow/quizzes/:moduleId/edit/:quizId" element={<CreateEditQuiz />} />
            <Route path="learn-and-grow/quizzes/:moduleId/take/:quizId" element={<TakeQuiz />} />
            <Route path="learn-and-grow/quizzes/:moduleId/result/:attemptId" element={<QuizResult />} />
            <Route path="learn-and-grow/quizzes/:moduleId/my-attempts/:quizId" element={<UserAttempts />} />
            <Route path="learn-and-grow/quizzes/:moduleId/attempts/:quizId" element={<AdminAttempts />} />
            <Route path="learn-and-grow/quizzes/pending" element={<PendingQuizzes />} />
            <Route path="learn-and-grow/quizzes/grade/:attemptUuid" element={<GradeQuiz />} />

            <Route path="messages/:uuid" element={<MessagesWithUuid />} />
          </Route>

          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </div>
    </TranslationProvider>
  );
}

export default App;
