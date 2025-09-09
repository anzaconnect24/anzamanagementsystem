#!/bin/bash

# Script to copy remaining Next.js pages to React+Vite structure
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

echo "Copying remaining pages..."

# Reviewer pages
copy_page "app/(dashboard)/(reviewer)/applicationList/page.js" "src/pages/reviewer/applicationList/ApplicationList.jsx" "Application List"
copy_page "app/(dashboard)/(reviewer)/previewPage/page.js" "src/pages/reviewer/previewPage/PreviewPage.jsx" "Preview Page"
copy_page "app/(dashboard)/(reviewer)/cratReviews/page.js" "src/pages/reviewer/cratReviews/CratReviews.jsx" "CRAT Reviews"

# Applications pages
copy_page "app/(dashboard)/(applications)/pendingProgramApplications/page.js" "src/pages/applications/pendingProgramApplications/PendingProgramApplications.jsx" "Pending Program Applications"
copy_page "app/(dashboard)/(applications)/rejectedProgramApplications/page.js" "src/pages/applications/rejectedProgramApplications/RejectedProgramApplications.jsx" "Rejected Program Applications"
copy_page "app/(dashboard)/(applications)/acceptedProgramApplications/page.js" "src/pages/applications/acceptedProgramApplications/AcceptedProgramApplications.jsx" "Accepted Program Applications"
copy_page "app/(dashboard)/(applications)/cratReviewApplications/page.js" "src/pages/applications/cratReviewApplications/CratReviewApplications.jsx" "CRAT Review Applications"
copy_page "app/(dashboard)/(applications)/assignProgramApplicationReviewers/[uuid]/page.js" "src/pages/applications/assignProgramApplicationReviewers/AssignProgramApplicationReviewersWithUuid.jsx" "Assign Program Application Reviewers"
copy_page "app/(dashboard)/(applications)/viewProgramApplication/[uuid]/page.js" "src/pages/applications/viewProgramApplication/ViewProgramApplicationWithUuid.jsx" "View Program Application"
copy_page "app/(dashboard)/(applications)/userProgramApplication/[uuid]/page.js" "src/pages/applications/userProgramApplication/UserProgramApplicationWithUuid.jsx" "User Program Application"

# CRAT System pages
copy_page "app/(dashboard)/(cratSystem)/finalReport/page.js" "src/pages/cratSystem/finalReport/FinalReport.jsx" "Final Report"
copy_page "app/(dashboard)/(cratSystem)/financialDomain/page.js" "src/pages/cratSystem/financialDomain/FinancialDomain.jsx" "Financial Domain"
copy_page "app/(dashboard)/(cratSystem)/report/page.js" "src/pages/cratSystem/report/Report.jsx" "Report"
copy_page "app/(dashboard)/(cratSystem)/legalDomain/page.js" "src/pages/cratSystem/legalDomain/LegalDomain.jsx" "Legal Domain"
copy_page "app/(dashboard)/(cratSystem)/scoreReadiness/page.js" "src/pages/cratSystem/scoreReadiness/ScoreReadiness.jsx" "Score Readiness"
copy_page "app/(dashboard)/(cratSystem)/marketDomain/page.js" "src/pages/cratSystem/marketDomain/MarketDomain.jsx" "Market Domain"
copy_page "app/(dashboard)/(cratSystem)/introduction/page.js" "src/pages/cratSystem/introduction/Introduction.jsx" "Introduction"
copy_page "app/(dashboard)/(cratSystem)/cratReview/page.js" "src/pages/cratSystem/cratReview/CratReview.jsx" "CRAT Review"
copy_page "app/(dashboard)/(cratSystem)/operationsDomain/page.js" "src/pages/cratSystem/operationsDomain/OperationsDomain.jsx" "Operations Domain"
copy_page "app/(dashboard)/(cratSystem)/generalDomain/page.js" "src/pages/cratSystem/generalDomain/GeneralDomain.jsx" "General Domain"

# Conversation pages
copy_page "app/(dashboard)/(conversation)/conversations/page.js" "src/pages/conversation/conversations/Conversations.jsx" "Conversations"

# Investment pages
copy_page "app/(dashboard)/(investment)/pendingRequests/page.js" "src/pages/investment/pendingRequests/PendingRequests.jsx" "Pending Requests"
copy_page "app/(dashboard)/(investment)/viewInvestmentRequest/[uuid]/page.js" "src/pages/investment/viewInvestmentRequest/ViewInvestmentRequestWithUuid.jsx" "View Investment Request"
copy_page "app/(dashboard)/(investment)/myInvestmentRequests/page.js" "src/pages/investment/myInvestmentRequests/MyInvestmentRequests.jsx" "My Investment Requests"
copy_page "app/(dashboard)/(investment)/investmentApplicationByEntreprenuer/[uuid]/page.js" "src/pages/investment/investmentApplicationByEntreprenuer/InvestmentApplicationByEntreprenuerWithUuid.jsx" "Investment Application by Entrepreneur"
copy_page "app/(dashboard)/(investment)/sendInvestment/[uuid]/page.js" "src/pages/investment/sendInvestment/SendInvestmentWithUuid.jsx" "Send Investment"
copy_page "app/(dashboard)/(investment)/investmentDetails/[uuid]/page.js" "src/pages/investment/investmentDetails/InvestmentDetailsWithUuid.jsx" "Investment Details"
copy_page "app/(dashboard)/(investment)/confirmInvestment/[uuid]/page.js" "src/pages/investment/confirmInvestment/ConfirmInvestmentWithUuid.jsx" "Confirm Investment"

echo "Investment pages completed!"

# Investment Opportunities pages
copy_page "app/(dashboard)/(investment-opportunities)/newOpportunity/page.js" "src/pages/investment-opportunities/newOpportunity/NewOpportunity.jsx" "New Opportunity"
copy_page "app/(dashboard)/(investment-opportunities)/editOpportunity/[uuid]/page.js" "src/pages/investment-opportunities/editOpportunity/EditOpportunityWithUuid.jsx" "Edit Opportunity"
copy_page "app/(dashboard)/(investment-opportunities)/opportunityDetails/[uuid]/page.js" "src/pages/investment-opportunities/opportunityDetails/OpportunityDetailsWithUuid.jsx" "Opportunity Details"
copy_page "app/(dashboard)/(investment-opportunities)/opportunitiesList/page.js" "src/pages/investment-opportunities/opportunitiesList/OpportunitiesList.jsx" "Opportunities List"

echo "Investment Opportunities pages completed!"

echo "Remaining pages copy completed!"
