export const checkIfProfileIsComplete = (userDetails)=>{
    return  userDetails.Business.companyProfile != null ?true:false
    &&userDetails.Business.businessPlan != null ?true:false
    &&userDetails.Business.BusinessDocuments.filter((item)=>item.type =="financialInformation").length>0
    &&userDetails.Business.BusinessDocuments.filter((item)=>item.type =="service").length>0
    &&userDetails.Business.marketResearch != null?true:false
    &&userDetails.Business.marketResearch&&userDetails.Business.BusinessDocuments.filter((item)=>item.type =="legalDocumentation").length>0
}