import InvestorProfileForm, {
  emptyInvestorProfile,
} from "@/components/investors/InvestorProfileForm";

// The investor's answers during sign-up, kept across the steps.
export const signupInvestorValues = (formValues = {}) => ({
  ...emptyInvestorProfile(),
  ...(formValues.investorProfile || {}),
});

// One sign-up step of the investor questions: "company", "investment" or
// "impact".
const InvestorSignupForm = ({ section, sectors = [], formValues = {}, setFormValues = () => {} }) => {
  const onChange = (key, value) =>
    setFormValues((prev) => ({
      ...prev,
      investorProfile: { ...signupInvestorValues(prev), [key]: value },
    }));

  return (
    <InvestorProfileForm
      values={signupInvestorValues(formValues)}
      onChange={onChange}
      sections={[section]}
      sectorOptions={sectors.map((sector) => sector.name).filter(Boolean)}
    />
  );
};

export default InvestorSignupForm;
