export const checkIfProfileIsComplete = (userDetails) => {
    return  (userDetails.Business.companyProfile != null) &&
            (userDetails.Business.businessPlan != null) &&
            (userDetails.Business.BusinessDocuments.filter((item) => item.type === "financialInformation").length > 0) &&
            (userDetails.Business.BusinessDocuments.filter((item) => item.type === "service").length > 0) &&
            (userDetails.Business.marketResearch != null) &&
            (userDetails.Business.marketResearch && userDetails.Business.BusinessDocuments.filter((item) => item.type === "legalDocumentation").length > 0);
}
