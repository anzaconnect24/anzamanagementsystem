import Spinner from "@/components/spinner";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getSectors } from "../controllers/sector_controller";
import {
  getMyInvestorProfile,
  saveMyInvestorProfile,
} from "../controllers/investor_profile_controller";
import InvestorProfileForm, {
  investorProfileFromRecord,
  validateInvestorProfile,
} from "@/components/investors/InvestorProfileForm";

// The investor's own Edit Profile page: the same questions they answered on
// sign-up, saved to their profile (created if sign-up did not save one).
const UpdateInvestorProfile = ({ user }) => {
  const [profile, setProfile] = useState(user?.InvestorProfile || null);
  const [values, setValues] = useState(() => investorProfileFromRecord(user?.InvestorProfile || {}));
  const [sectors, setSectors] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSectors().then((data) => data && setSectors(data));
    // The account details can predate the latest save, so read the profile
    // itself before editing it.
    getMyInvestorProfile().then((record) => {
      if (record) {
        setProfile(record);
        setValues(investorProfileFromRecord(record));
      }
    });
  }, []);

  const onChange = (key, value) => setValues((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const problem = validateInvestorProfile(values);
    if (problem) {
      toast.error(problem);
      return;
    }

    setSaving(true);
    const response = await saveMyInvestorProfile(values);
    setSaving(false);

    if (!response?.status) {
      toast.error(response?.message || "Failed to update your investor profile");
      return;
    }

    setProfile((prev) => ({ ...(prev || {}), ...response.body }));
    toast.success("Investor profile updated");
  };

  const tiles = [
    { label: "Investor Type", value: profile?.investorType },
    { label: "Headquarters", value: profile?.headquarters || profile?.geography },
    { label: "Fund Size", value: profile?.fundSize },
    { label: "Ticket Size", value: profile?.ticketSize || profile?.investmentSize },
    { label: "Capital Type", value: profile?.capitalType },
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
            Investor Profile
          </div>
          <h1 className="mt-5 text-3xl font-black tracking-tight md:text-4xl">
            {profile?.company || user?.name || "Investor Profile"}
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
        <InvestorProfileForm
          values={values}
          onChange={onChange}
          sectorOptions={sectors.map((sector) => sector.name).filter(Boolean)}
        />

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

export default UpdateInvestorProfile;
