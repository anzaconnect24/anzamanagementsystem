import { useState } from "react";
import toast from "react-hot-toast";
import { FaFilePdf } from "react-icons/fa";
import { generateGrantReport } from "@/services/grantReportAI";
import { downloadGrantReportPDF } from "@/services/grantReportPDF";

// Reusable "Download Report" button. Builds an AI grant report from the given
// startup context and downloads it as a PDF. Usable by entrepreneurs, BDAs
// and Finance Officers.
const GrantReportButton = ({
  context,
  label = "Download Report",
  className = "",
  disabled = false,
}) => {
  const [loading, setLoading] = useState(false);

  const onDownload = async () => {
    if (loading) return;
    if (!context?.startup?.name) {
      toast.error("No startup selected for the report");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Generating AI grant report...");
    try {
      const report = await generateGrantReport(context);
      downloadGrantReportPDF(report, context);
      toast.success("Report downloaded", { id: toastId });
    } catch (error) {
      console.error("Grant report error:", error);
      toast.error("Failed to generate the report. Please try again.", {
        id: toastId,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onDownload}
      disabled={disabled || loading}
      className={
        className ||
        "inline-flex items-center gap-2 rounded-lg bg-[#16a34a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#15803d] disabled:opacity-60"
      }
    >
      <FaFilePdf />
      {loading ? "Generating..." : label}
    </button>
  );
};

export default GrantReportButton;
