import MentorProfileForm, {
  emptyMentorProfile,
} from "@/components/mentors/MentorProfileForm";

// The mentor's answers during sign-up, kept across the steps.
export const signupMentorValues = (formValues = {}) => ({
  ...emptyMentorProfile(),
  ...(formValues.mentorProfile || {}),
});

// One sign-up step of the mentor questions: "background", "expertise" or
// "support".
const MentorSignupForm = ({ section, formValues = {}, setFormValues = () => {} }) => {
  const onChange = (key, value) =>
    setFormValues((prev) => ({
      ...prev,
      mentorProfile: { ...signupMentorValues(prev), [key]: value },
    }));

  return (
    <MentorProfileForm
      values={signupMentorValues(formValues)}
      onChange={onChange}
      sections={[section]}
    />
  );
};

export default MentorSignupForm;
