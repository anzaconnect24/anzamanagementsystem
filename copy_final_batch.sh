#!/bin/bash

# Script to copy final batch of actual Next.js pages 
cd "/Users/john/Documents/anza project/anzamanagementsystem"

# Function to copy a file and rename it
copy_page() {
    local src="$1"
    local dest="$2"
    local name="$3"
    if [ -f "$src" ]; then
        cp "$src" "$dest"
        echo "✅ Copied: $name"
    else
        echo "❌ Not found: $src"
    fi
}

echo "Copying final batch - Users, Mentors, Investors, etc..."

# Create directories
mkdir -p src/pages/users/{interestedEnterprenuers,reviewers,admins,mentors,enterprenuers,users,mentorEntreprenuers,investors}
mkdir -p src/pages/users/mentors/details
mkdir -p src/pages/users/investors/details
mkdir -p src/pages/mentorship/mentorshipApplicationForm
mkdir -p src/pages/mentor/{myMentors,mentorReport,myMentorDetails,addEntreprenuerReport,mentorReports,mentorshipRequests}
mkdir -p src/pages/investment-opportunities/opportunities/{new}
mkdir -p src/pages/investment/{acceptedRequests,investmentApplication,assignInvestmentRequestReviewers,rejectApplicationRequest,rejectedRequests,reviewerAssignedInvestmentRequests}
mkdir -p src/pages/account/investorProfile
mkdir -p src/pages/investor/investorSectorBusinesses

# Users pages
copy_page "app/(dashboard)/(users)/interestedEnterprenuers/page.js" "src/pages/users/interestedEnterprenuers/InterestedEntreprenuers.jsx" "Interested Entrepreneurs"
copy_page "app/(dashboard)/(users)/reviewers/page.js" "src/pages/users/reviewers/Reviewers.jsx" "Reviewers"
copy_page "app/(dashboard)/(users)/admins/page.js" "src/pages/users/admins/Admins.jsx" "Admins"
copy_page "app/(dashboard)/(users)/mentors/page.js" "src/pages/users/mentors/Mentors.jsx" "Mentors"
copy_page "app/(dashboard)/(users)/mentors/[uuid]/page.js" "src/pages/users/mentors/MentorWithUuid.jsx" "Mentor Details"
copy_page "app/(dashboard)/(users)/enterprenuers/page.js" "src/pages/users/enterprenuers/Enterprenuers.jsx" "Entrepreneurs"
copy_page "app/(dashboard)/(users)/users/page.js" "src/pages/users/users/Users.jsx" "Users"
copy_page "app/(dashboard)/(users)/mentorEntreprenuers/[uuid]/page.js" "src/pages/users/mentorEntreprenuers/MentorEntreprenuerWithUuid.jsx" "Mentor Entrepreneur Details"
copy_page "app/(dashboard)/(users)/investors/page.js" "src/pages/users/investors/Investors.jsx" "Investors"
copy_page "app/(dashboard)/(users)/investors/details/[uuid]/page.js" "src/pages/users/investors/details/InvestorDetailsWithUuid.jsx" "Investor Details"
copy_page "app/(dashboard)/(users)/investors/[uuid]/page.js" "src/pages/users/investors/InvestorWithUuid.jsx" "Investor Profile"

# Mentorship pages
copy_page "app/(dashboard)/(mentorship)/mentorshipApplicationForm/[uuid]/page.js" "src/pages/mentorship/mentorshipApplicationForm/MentorshipApplicationFormWithUuid.jsx" "Mentorship Application Form"

# Mentor pages
copy_page "app/(dashboard)/(mentor)/myMentors/page.js" "src/pages/mentor/myMentors/MyMentors.jsx" "My Mentors"
copy_page "app/(dashboard)/(mentor)/mentorReport/[uuid]/page.js" "src/pages/mentor/mentorReport/MentorReportWithUuid.jsx" "Mentor Report"
copy_page "app/(dashboard)/(mentor)/myMentorDetails/[uuid]/page.js" "src/pages/mentor/myMentorDetails/MyMentorDetailsWithUuid.jsx" "My Mentor Details"
copy_page "app/(dashboard)/(mentor)/addEntreprenuerReport/[uuid]/page.js" "src/pages/mentor/addEntreprenuerReport/AddEntreprenuerReportWithUuid.jsx" "Add Entrepreneur Report"
copy_page "app/(dashboard)/(mentor)/mentorReports/page.js" "src/pages/mentor/mentorReports/MentorReports.jsx" "Mentor Reports"
copy_page "app/(dashboard)/(mentor)/mentorshipRequests/page.js" "src/pages/mentor/mentorshipRequests/MentorshipRequests.jsx" "Mentorship Requests"

# Investment Opportunities pages (actual structure)
copy_page "app/(dashboard)/(investment-opportunities)/opportunities/page.js" "src/pages/investment-opportunities/opportunities/Opportunities.jsx" "Opportunities"
copy_page "app/(dashboard)/(investment-opportunities)/opportunities/new/page.js" "src/pages/investment-opportunities/opportunities/new/NewOpportunity.jsx" "New Opportunity"
copy_page "app/(dashboard)/(investment-opportunities)/opportunities/[uuid]/page.js" "src/pages/investment-opportunities/opportunities/OpportunityWithUuid.jsx" "Opportunity Details"
copy_page "app/(dashboard)/(investment-opportunities)/opportunities/[uuid]/edit/page.js" "src/pages/investment-opportunities/opportunities/EditOpportunityWithUuid.jsx" "Edit Opportunity"

# Investment pages (remaining)
copy_page "app/(dashboard)/(investment)/acceptedRequests/page.js" "src/pages/investment/acceptedRequests/AcceptedRequests.jsx" "Accepted Requests"
copy_page "app/(dashboard)/(investment)/investmentApplication/[uuid]/page.js" "src/pages/investment/investmentApplication/InvestmentApplicationWithUuid.jsx" "Investment Application"
copy_page "app/(dashboard)/(investment)/assignInvestmentRequestReviewers/[uuid]/page.js" "src/pages/investment/assignInvestmentRequestReviewers/AssignInvestmentRequestReviewersWithUuid.jsx" "Assign Investment Request Reviewers"
copy_page "app/(dashboard)/(investment)/rejectApplicationRequest/[uuid]/page.js" "src/pages/investment/rejectApplicationRequest/RejectApplicationRequestWithUuid.jsx" "Reject Application Request"
copy_page "app/(dashboard)/(investment)/rejectedRequests/page.js" "src/pages/investment/rejectedRequests/RejectedRequests.jsx" "Rejected Requests"
copy_page "app/(dashboard)/(investment)/reviewerAssignedInvestmentRequests/page.js" "src/pages/investment/reviewerAssignedInvestmentRequests/ReviewerAssignedInvestmentRequests.jsx" "Reviewer Assigned Investment Requests"

# Account pages
copy_page "app/(dashboard)/(account)/investorProfile/page.js" "src/pages/account/investorProfile/InvestorProfile.jsx" "Investor Profile"

# Investor pages
copy_page "app/(dashboard)/(investor)/investorSectorBusinesses/page.js" "src/pages/investor/investorSectorBusinesses/InvestorSectorBusinesses.jsx" "Investor Sector Businesses"

echo "Final batch completed!"
