#!/bin/bash

# Script to copy all Next.js pages to React+Vite structure
cd "/Users/john/Documents/anza project/anzamanagementsystem"

echo "Creating comprehensive directory structure..."

# Create all necessary directories based on the actual file structure
mkdir -p src/pages/{programs,chat,learnandgrow,stories,reviewer,applications,cratSystem,conversation,investment,investment-opportunities,investor,users,mentorship,mentor,log,account,pitchMaterials,sectors}

# Create complex subdirectories
mkdir -p src/pages/programs/{newProgram,programDetails,sendProgramApplication,programUpdates,newProgramUpdate,editProgram,ira,bfa,consultance}
mkdir -p src/pages/chat/messages
mkdir -p src/pages/learnandgrow/{modules,classRooms,generalResources,programsApplications,slides}
mkdir -p src/pages/learnandgrow/modules/{add,edit}
mkdir -p src/pages/learnandgrow/generalResources/category
mkdir -p src/pages/learnandgrow/slides/{add,edit}
mkdir -p src/pages/stories/{readStory,successStories,newStory}
mkdir -p src/pages/stories/successStories/new
mkdir -p src/pages/reviewer/{applicationList,previewPage,cratReviews}
mkdir -p src/pages/applications/{pendingProgramApplications,rejectedProgramApplications,acceptedProgramApplications,cratReviewApplications,assignProgramApplicationReviewers,viewProgramApplication,userProgramApplication}
mkdir -p src/pages/cratSystem/{finalReport,financialDomain,report,legalDomain,scoreReadiness,marketDomain,introduction,cratReview,operationsDomain,generalDomain}
mkdir -p src/pages/conversation/conversations
mkdir -p src/pages/investment/{pendingRequests,viewInvestmentRequest,myInvestmentRequests,investmentApplicationByEntreprenuer,sendInvestment,investmentDetails,confirmInvestment}
mkdir -p src/pages/investment-opportunities/{newOpportunity,editOpportunity,opportunityDetails,opportunitiesList}
mkdir -p src/pages/investor/{newInvestor,editInvestor,investorDetails,investorsList}
mkdir -p src/pages/users/{entrepreneurs,businessOwners,mentors,reviewers,admins,investors,newUser,editUser,userDetails}
mkdir -p src/pages/mentorship/{mentorshipDetails,newMentorship,editMentorship}
mkdir -p src/pages/mentor/{mentorEntreprenuers,mentorBusinesses,myMentorship,newMentorship}
mkdir -p src/pages/log/systemLogs
mkdir -p src/pages/account/{editAccount,addAdmin}
mkdir -p src/pages/pitchMaterials/{pitchMaterialDetails,newPitchMaterial,editPitchMaterial}
mkdir -p src/pages/sectors/{sectorDetails,newSector,editSector}

echo "Directory structure created!"

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

echo "Starting to copy all pages..."

# Programs pages
copy_page "app/(dashboard)/(programs)/newProgram/page.js" "src/pages/programs/NewProgram.jsx" "New Program"
copy_page "app/(dashboard)/(programs)/programDetails/[uuid]/page.js" "src/pages/programs/programDetails/ProgramDetailsWithUuid.jsx" "Program Details"
copy_page "app/(dashboard)/(programs)/sendProgramApplication/[uuid]/page.js" "src/pages/programs/sendProgramApplication/SendProgramApplicationWithUuid.jsx" "Send Program Application"
copy_page "app/(dashboard)/(programs)/programUpdates/[uuid]/page.js" "src/pages/programs/programUpdates/ProgramUpdatesWithUuid.jsx" "Program Updates"
copy_page "app/(dashboard)/(programs)/newProgramUpdate/[uuid]/page.js" "src/pages/programs/newProgramUpdate/NewProgramUpdateWithUuid.jsx" "New Program Update"
copy_page "app/(dashboard)/(programs)/editProgram/[uuid]/page.js" "src/pages/programs/editProgram/EditProgramWithUuid.jsx" "Edit Program"
copy_page "app/(dashboard)/(programs)/ira/page.js" "src/pages/programs/ira/IRA.jsx" "IRA Program"
copy_page "app/(dashboard)/(programs)/bfa/page.js" "src/pages/programs/bfa/BFA.jsx" "BFA Program"
copy_page "app/(dashboard)/(programs)/consultance/page.js" "src/pages/programs/consultance/Consultance.jsx" "Consultance Program"

echo "Programs pages completed!"

# Chat pages
copy_page "app/(dashboard)/(chat)/messages/[uuid]/page.js" "src/pages/chat/messages/MessagesWithUuid.jsx" "Messages"

# Learn and Grow pages
copy_page "app/(dashboard)/(learnandgrow)/modules/add/page.js" "src/pages/learnandgrow/modules/add/AddModule.jsx" "Add Module"
copy_page "app/(dashboard)/(learnandgrow)/modules/edit/page.js" "src/pages/learnandgrow/modules/edit/EditModule.jsx" "Edit Module"
copy_page "app/(dashboard)/(learnandgrow)/modules/[course]/page.js" "src/pages/learnandgrow/modules/ModuleWithCourse.jsx" "Module with Course"
copy_page "app/(dashboard)/(learnandgrow)/classRooms/page.js" "src/pages/learnandgrow/classRooms/ClassRooms.jsx" "Class Rooms"
copy_page "app/(dashboard)/(learnandgrow)/generalResources/page.js" "src/pages/learnandgrow/generalResources/GeneralResources.jsx" "General Resources"
copy_page "app/(dashboard)/(learnandgrow)/generalResources/category/[category]/page.js" "src/pages/learnandgrow/generalResources/category/CategoryWithParam.jsx" "Resource Category"
copy_page "app/(dashboard)/(learnandgrow)/programsApplications/page.js" "src/pages/learnandgrow/programsApplications/ProgramsApplications.jsx" "Programs Applications"
copy_page "app/(dashboard)/(learnandgrow)/programsApplications/[uuid]/page.js" "src/pages/learnandgrow/programsApplications/ProgramsApplicationsWithUuid.jsx" "Programs Applications Details"
copy_page "app/(dashboard)/(learnandgrow)/programsApplications/[uuid]/edit/page.js" "src/pages/learnandgrow/programsApplications/EditProgramsApplicationsWithUuid.jsx" "Edit Programs Applications"
copy_page "app/(dashboard)/(learnandgrow)/slides/add/page.js" "src/pages/learnandgrow/slides/add/AddSlide.jsx" "Add Slide"
copy_page "app/(dashboard)/(learnandgrow)/slides/edit/page.js" "src/pages/learnandgrow/slides/edit/EditSlide.jsx" "Edit Slide"
copy_page "app/(dashboard)/(learnandgrow)/slides/[uuid]/page.js" "src/pages/learnandgrow/slides/SlideWithUuid.jsx" "Slide Details"

echo "Learn and Grow pages completed!"

# Stories pages  
copy_page "app/(dashboard)/(stories)/readStory/[uuid]/page.js" "src/pages/stories/readStory/ReadStoryWithUuid.jsx" "Read Story"
copy_page "app/(dashboard)/(stories)/successStories/page.js" "src/pages/stories/successStories/SuccessStories.jsx" "Success Stories"
copy_page "app/(dashboard)/(stories)/successStories/[uuid]/page.js" "src/pages/stories/successStories/SuccessStoryWithUuid.jsx" "Success Story Details"
copy_page "app/(dashboard)/(stories)/successStories/[uuid]/edit/page.js" "src/pages/stories/successStories/EditSuccessStoryWithUuid.jsx" "Edit Success Story"
copy_page "app/(dashboard)/(stories)/successStories/new/page.js" "src/pages/stories/successStories/new/NewSuccessStory.jsx" "New Success Story"
copy_page "app/(dashboard)/(stories)/newStory/page.js" "src/pages/stories/newStory/NewStory.jsx" "New Story"

echo "Stories pages completed!"

echo "All pages have been copied!"
echo "Total files processed. Check the output above for success/failure status."
