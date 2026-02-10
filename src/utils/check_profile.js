export const checkIfProfileIsComplete = (userDetails) => {
  // Profile is complete when user has account details and business information
  return (
    userDetails &&
    userDetails.Business &&
    userDetails.Business.name &&
    userDetails.Business.name.trim() !== ""
  );
};
