#!/bin/bash

# Script to copy all Next.js pages to React+Vite structure
cd "/Users/john/Documents/anza project/anzamanagementsystem"

echo "Creating directory structure..."

# Create all necessary directories
mkdir -p src/pages/{account,applications,assignments,chat,conversation,cratSystem,investment,investment-opportunities,investor,learnandgrow,log,mentorship,pitchMaterials,programs,reviewer,sectors,stories,users}

# Create subdirectories for complex modules
mkdir -p src/pages/account/{editAccount,addAdmin}
mkdir -p src/pages/applications/{businessApplications,newApplication,editApplication}
mkdir -p src/pages/assignments/{reviewerAssignments}
mkdir -p src/pages/chat/{messages}
mkdir -p src/pages/conversation/{conversations}
mkdir -p src/pages/cratSystem/{generalDomain,marketDomain,legalDomain,financialDomain,finalReport,report}
mkdir -p src/pages/investment/{sendInvestment,investmentDetails,confirmInvestment}
mkdir -p src/pages/investment-opportunities/{newOpportunity,editOpportunity,opportunityDetails}
mkdir -p src/pages/investor/{newInvestor,editInvestor,investorDetails}
mkdir -p src/pages/learnandgrow/{resources,newResource,editResource,resourceDetails}
mkdir -p src/pages/log/{systemLogs}
mkdir -p src/pages/mentorship/{mentorshipDetails,newMentorship,editMentorship}
mkdir -p src/pages/pitchMaterials/{pitchMaterialDetails,newPitchMaterial,editPitchMaterial}
mkdir -p src/pages/programs/{programDetails,sendProgramApplication,programUpdates,newProgramUpdate,editProgram,newProgram,ira,bfa,consultance}
mkdir -p src/pages/reviewer/{reviewerDetails,reviewBusinesses,businessReview}
mkdir -p src/pages/sectors/{sectorDetails,newSector,editSector}
mkdir -p src/pages/stories/{successStories,readStory,editStory,newStory}
mkdir -p src/pages/users/{userDetails,newUser,editUser}

echo "Directory structure created!"
echo "Now copying pages..."

# Function to copy a file and rename it
copy_page() {
    local src="$1"
    local dest="$2"
    if [ -f "$src" ]; then
        cp "$src" "$dest"
        echo "Copied: $src -> $dest"
    else
        echo "Not found: $src"
    fi
}

# Copy account pages
copy_page "app/(dashboard)/(account)/page.tsx" "src/pages/account/Account.jsx"
copy_page "app/(dashboard)/(account)/editAccount/page.js" "src/pages/account/editAccount/EditAccount.jsx"
copy_page "app/(dashboard)/(account)/addAdmin/page.js" "src/pages/account/addAdmin/AddAdmin.jsx"

# Copy applications pages
copy_page "app/(dashboard)/(applications)/page.js" "src/pages/applications/Applications.jsx"
copy_page "app/(dashboard)/(applications)/businessApplications/page.js" "src/pages/applications/businessApplications/BusinessApplications.jsx"
copy_page "app/(dashboard)/(applications)/newApplication/page.js" "src/pages/applications/newApplication/NewApplication.jsx"

# Copy assignments pages
copy_page "app/(dashboard)/(assignments)/page.js" "src/pages/assignments/Assignments.jsx"
copy_page "app/(dashboard)/(assignments)/reviewerAssignments/[uuid]/page.js" "src/pages/assignments/reviewerAssignments/ReviewerAssignmentsWithUuid.jsx"

echo "Basic pages copied. Now copying remaining complex pages..."
