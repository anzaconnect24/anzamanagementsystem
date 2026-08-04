"use client";
import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import Loader from "@/components/common/Loader";
import { UserContext } from "@/layouts/DashboardLayout";
import SignedContractCard from "@/components/tracker/SignedContractCard";
import { parseTrackerProgramMeta } from "@/utils/trackerProgramMarkers";
import { uploadFile } from "@/controllers/file_upload_controller";
import {
  getEntrepreneurTrackerDashboard,
  updateEntrepreneurEnterpriseKyc,
} from "@/controllers/trackerController";

const HERO_IMAGE_URL = "/images/mentor_hero.svg";

// Standalone grant-contract page for the startup — download, sign and upload the
// signed copy. Opened from the "Grant Contract" button on the milestones hero.
const GrantContract = () => {
  const navigate = useNavigate();
  const { userDetails } = useContext(UserContext);

  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [signing, setSigning] = useState(false);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const data = await getEntrepreneurTrackerDashboard({});
      setDashboard(data || null);
    } catch {
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const enterprise = dashboard?.enterprise || {};
  const program = dashboard?.program || enterprise?.Program || null;

  // Finance mirrors the contract onto the program markers, which are the durable
  // copy — read them as a fallback when the enterprise record doesn't carry it.
  const financeMember = useMemo(() => {
    const ids = [
      userDetails?.uuid,
      enterprise?.entreprenuer_uuid,
      enterprise?.Entreprenuer?.uuid,
    ].filter(Boolean);
    if (!ids.length || !program) return null;
    return (
      parseTrackerProgramMeta(program).startups.find((member) =>
        ids.includes(member?.entreprenuerUuid),
      ) || null
    );
  }, [program, userDetails?.uuid, enterprise]);

  const onUploadSignedContract = async (file) => {
    if (!file) return;
    setSigning(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const url = await uploadFile(formData);
      if (!url || typeof url !== "string") throw new Error("Upload failed");
      await updateEntrepreneurEnterpriseKyc({
        startupSignedContractUrl: url,
        contractAcknowledgedAt: new Date().toISOString(),
      });
      toast.success("Signed contract uploaded");
      await loadDashboard();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to upload the signed contract",
      );
    } finally {
      setSigning(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-[#f3f6fb] px-4 py-6 text-slate-950 md:px-8 xl:px-12">
      <main className="mx-auto max-w-[1480px] space-y-6">
        <button
          type="button"
          onClick={() => navigate("/dashboard/myMilestones")}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#082d77]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to grant management
        </button>

        <section
          className="relative overflow-hidden rounded-2xl bg-slate-950 px-7 py-6 text-white shadow-sm shadow-slate-300/70 md:px-10 md:py-7"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.6) 50%, rgba(0, 0, 0, 0.2) 100%), url(${HERO_IMAGE_URL})`,
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        >
          <div className="relative z-10 min-h-[140px]">
            <div className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-bold text-white shadow-sm backdrop-blur">
              <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
              Grant Contract
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
              {enterprise?.name || "Grant Contract"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/85 md:text-base">
              Download the grant contract, sign it, then upload the signed copy
              for your mentor to acknowledge.
            </p>
          </div>
        </section>

        <SignedContractCard
          contractUrl={
            enterprise?.signedContractUrl || financeMember?.signedContractUrl
          }
          uploadedAt={
            enterprise?.signedContractUploadedAt ||
            financeMember?.signedContractUploadedAt
          }
          acknowledgedAt={enterprise?.contractAcknowledgedAt}
          signedUrl={enterprise?.startupSignedContractUrl}
          contractName={enterprise?.name || undefined}
          canSign
          signing={signing}
          onSignUpload={onUploadSignedContract}
        />
      </main>
    </div>
  );
};

export default GrantContract;
