import Spinner from "@/components/spinner";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  getMyMentorProfile,
  saveMyMentorProfile,
} from "../controllers/mentor_profile_controller";
import MentorProfileForm, {
  mentorProfileFromRecord,
  validateMentorProfile,
} from "@/components/mentors/MentorProfileForm";
import { expertiseList } from "@/utils/mentorProfile";

// The mentor's own Edit Profile page: the same questions they answered on
// sign-up, saved to their profile (created if sign-up did not save one).
const UpdateMentorProfile = ({ user }) => {
  const [profile, setProfile] = useState(user?.MentorProfile || null);
  const [values, setValues] = useState(() => mentorProfileFromRecord(user?.MentorProfile || {}));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // The account details can predate the latest save, so read the profile
    // itself before editing it.
    getMyMentorProfile().then((record) => {
      if (record) {
        setProfile(record);
        setValues(mentorProfileFromRecord(record));
      }
    });
  }, []);

  const onChange = (key, value) => setValues((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const problem = validateMentorProfile(values);
    if (problem) {
      toast.error(problem);
      return;
    }

    setSaving(true);
    const response = await saveMyMentorProfile(values);
    setSaving(false);

    if (!response?.status) {
      toast.error(response?.message || "Failed to update your mentor profile");
      return;
    }

    setProfile((prev) => ({ ...(prev || {}), ...response.body }));
    toast.success("Mentor profile updated");
  };

  const tiles = [
    { label: "Position", value: profile?.position },
    { label: "Experience", value: profile?.experienceYears },
    {
      label: "Location",
      value: [profile?.location, profile?.country].filter(Boolean).join(", "),
    },
    {
      label: "Expertise",
      value: expertiseList(profile?.expertiseAreas || profile?.areasOfExperties).join(", "),
    },
    { label: "Availability", value: profile?.mentorAvailability },
  ];

  return (
    <div>
      <section
        className="relative mb-6 overflow-hidden rounded-2xl bg-slate-950 px-7 py-8 text-white shadow-sm"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.65) 45%, rgba(0,0,0,0.2) 100%), url('/images/mentor_hero.svg')",
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-[#F59E0B]" />
            Mentor Profile
          </div>
          <h1 className="mt-5 text-3xl font-black tracking-tight md:text-4xl">
            {user?.name || "Mentor Profile"}
          </h1>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {tiles.map((tile) => (
              <div key={tile.label} className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur">
                <p className="text-xs font-medium text-white/60">{tile.label}</p>
                <p className="mt-1 truncate text-lg font-black text-white">{tile.value || "N/A"}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-sm dark:bg-boxdark md:p-8">
        <MentorProfileForm values={values} onChange={onChange} />

        <div className="mt-8 flex justify-end border-t border-slate-100 pt-6">
          <button
            type="submit"
            disabled={saving}
            className="flex min-w-[160px] justify-center rounded-lg bg-[#082d77] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#082d77]/90 disabled:opacity-60"
          >
            {saving ? <Spinner /> : "Save profile"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UpdateMentorProfile;
