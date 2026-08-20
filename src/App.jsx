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

// Lazy-loaded Dashboard Pages
const Dashboard = React.lazy(() => import("@/pages/dashboard/Dashboard"));
const ChatMessages = React.lazy(() => import("@/pages/chat/ChatMessages"));

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

// Lazy-loaded Investment Opportunities Pages
const Opportunities = React.lazy(() => import("./pages/investment-opportunities/opportunities/Opportunities"));

// Lazy-loaded Learn and Grow Pages
const ProgramsApplications = React.lazy(() => import("./pages/learnandgrow/programsApplications/ProgramsApplications"));
const ClassRooms = React.lazy(() => import("./pages/learnandgrow/classRooms/ClassRooms"));
const GeneralResources = React.lazy(() => import("./pages/learnandgrow/generalResources/GeneralResources"));
const BusinessTools = React.lazy(() => import("./pages/learnandgrow/businessTools/BusinessTools"));
const UploadBusinessTool = React.lazy(() => import("./pages/learnandgrow/businessTools/UploadBusinessTool"));
const EditBusinessTool = React.lazy(() => import("./pages/learnandgrow/businessTools/EditBusinessTool"));

// Lazy-loaded CRAT System Pages
const Introduction = React.lazy(() => import("./pages/cratSystem/Introduction"));

// Lazy-loaded Reviewer Pages
const CratReviews = React.lazy(() => import("./pages/reviewer/cratReviews/CratReviews"));

// Lazy-loaded Application Pages
const CratReviewApplications = React.lazy(() => import("./pages/applications/cratReviewApplications/CratReviewApplications"));
const CratCatalogManager = React.lazy(() => import("./pages/admin/CratCatalogManager"));

// Lazy-loaded Stories Pages
const SuccessStories = React.lazy(() => import("./pages/stories/successStories/SuccessStories"));

// Lazy-loaded Conversation Pages
const Conversations = React.lazy(() => import("./pages/conversation/conversations/Conversations"));

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

// Lazy-loaded Pitch Materials Components
const Documents = React.lazy(() => import("./pages/pitchMaterials/documents/Documents"));
const UploadMaterialWithType = React.lazy(() => import("./pages/pitchMaterials/uploadMaterial/UploadMaterialWithType"));
const Videos = React.lazy(() => import("./pages/pitchMaterials/videos/Videos"));
const ViewerWithUuid = React.lazy(() => import("./pages/pitchMaterials/viewer/ViewerWithUuid"));

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
const EditAccountDetails = React.lazy(() => import("./pages/account/editAccount/editAccountDetails"));
const EntrepreneurProfile = React.lazy(() => import("./pages/account/entreprenuerProfile"));
const MentorTracker = React.lazy(() => import("./pages/tracker/mentor/MentorTracker"));
const EnterpriseTrackerDetails = React.lazy(() => import("./pages/tracker/mentor/EnterpriseTrackerDetails"));
const EnterpriseKyc = React.lazy(() => import("./pages/tracker/mentor/EnterpriseKyc"));
const EntrepreneurMilestones = React.lazy(() => import("./pages/tracker/entreprenuer/EntrepreneurMilestones"));
const CoachingSessions = React.lazy(() => import("./pages/tracker/entreprenuer/CoachingSessions"));
const GrantContract = React.lazy(() => import("./pages/tracker/entreprenuer/GrantContract"));
const ProgramMemberRoute = React.lazy(() => import("./components/guards/ProgramMemberRoute"));
const RoleRoute = React.lazy(() => import("./components/guards/RoleRoute"));
const BdaCoachingSessions = React.lazy(() => import("./pages/tracker/mentor/BdaCoachingSessions"));
const BdaCoachingSessionSetup = React.lazy(() => import("./pages/tracker/mentor/BdaCoachingSessionSetup"));
const TrackerProgramDetails = React.lazy(() => import("./pages/tracker/admin/TrackerProgramDetails"));
const FundingAgreements = React.lazy(() => import("./pages/tracker/admin/FundingAgreements"));
const TrackerPrograms = React.lazy(() => import("./pages/tracker/admin/TrackerPrograms"));
const TrackerStartupDetails = React.lazy(() => import("./pages/tracker/admin/TrackerStartupDetails"));
const StaffStartupMilestones = React.lazy(() => import("./pages/tracker/mentor/StaffStartupMilestones"));

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

            {/* User Management Routes */}
            <Route path="users" element={<Users />} />
            <Route path="enterprenuers" element={<Enterprenuers />} />
            <Route path="investors" element={<Investors />} />
            <Route path="mentors" element={<Mentors />} />
            <Route path="reviewers" element={<Reviewers />} />
            <Route path="admins" element={<Admins />} />
            <Route path="financeOfficers" element={<FinanceOfficers />} />
            <Route path="interestedEnterprenuers" element={<InterestedEnterprenuers />} />

            {/* Mentor Routes */}
            <Route path="myMentors" element={<MyMentors />} />
            <Route path="mentorEntreprenuers" element={<MentorEntreprenuer />} />
            <Route path="mentorEntreprenuers/businessDetailsByMentor/:uuid" element={<BusinessDetailsByMentorWithUuid />} />
            <Route path="mentorshipRequests" element={<MentorshipRequests />} />
            <Route path="mentorshipApplications" element={<MentorshipApplications />} />
            <Route path="mentorReports" element={<MentorReports />} />
            <Route path="mentorTracker" element={<MentorTracker />} />
            <Route path="bdaCoachingSessions" element={<BdaCoachingSessions />} />
            <Route path="bdaCoachingSessions/:entUuid" element={<BdaCoachingSessionSetup />} />
            <Route path="mentorTracker/enterprise-kyc" element={<EnterpriseKyc />} />
            <Route path="mentorTracker/enterprise-kyc/:enterpriseUuid" element={<EnterpriseKyc />} />
            <Route path="mentorTracker/enterprise/:enterpriseUuid" element={<EnterpriseTrackerDetails />} />
            <Route path="mentorTracker/startup/:entUuid/milestones" element={<StaffStartupMilestones />} />
            <Route path="myMilestones" element={<ProgramMemberRoute><EntrepreneurMilestones /></ProgramMemberRoute>} />
            <Route path="coachingSessions" element={<ProgramMemberRoute><CoachingSessions /></ProgramMemberRoute>} />
            <Route path="myMilestones/kyc" element={<ProgramMemberRoute><EnterpriseKyc audience="entrepreneur" /></ProgramMemberRoute>} />
            <Route path="myMilestones/contract" element={<ProgramMemberRoute><GrantContract /></ProgramMemberRoute>} />

            <Route path="trackerAdminOverview" element={<RoleRoute allow={["Finance"]}><TrackerPrograms /></RoleRoute>} />
            <Route path="trackerPrograms" element={<RoleRoute allow={["Finance"]}><TrackerPrograms /></RoleRoute>} />
            <Route path="trackerPrograms/:programUuid/details" element={<RoleRoute allow={["Finance"]}><TrackerProgramDetails /></RoleRoute>} />
            <Route path="trackerPrograms/:programUuid/startup/:entUuid" element={<RoleRoute allow={["Finance"]}><TrackerStartupDetails /></RoleRoute>} />
            <Route path="fundingAgreements" element={<RoleRoute allow={["Finance"]}><FundingAgreements /></RoleRoute>} />

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
            <Route path="applicationList" element={<ApplicationList />} />
            <Route path="previewPage" element={<PreviewPage />} />

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
            <Route path="programsApplications" element={<ProgramsApplications />} />
            <Route path="classRooms" element={<ClassRooms />} />
            <Route path="generalResources" element={<GeneralResources />} />
            <Route path="businessTools" element={<BusinessTools />} />
            <Route path="uploadBusinessTool" element={<UploadBusinessTool />} />
            <Route path="editBusinessTool/:uuid" element={<EditBusinessTool />} />

            {/* CRAT System Routes */}
            <Route path="introduction" element={<Introduction />} />
            <Route path="report" element={<Report />} />

            {/* Reviewer Routes */}
            <Route path="cratReviews" element={<CratReviews />} />
            <Route path="cratReviewAssessment" element={<CratSubmissionReviewPage />} />

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
