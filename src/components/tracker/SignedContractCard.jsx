import { FileText, Eye, Download, UploadCloud, CheckCircle2 } from "lucide-react";

// Shared "Grant Contract" panel for the grant workflow. The finance officer
// uploads the contract as the first step and it becomes visible to the startup
// (for signing) and the business development advisor.
//
// Props:
//   contractUrl   - the uploaded contract URL (string) or falsy if none yet
//   uploadedAt    - ISO date string of when it was uploaded (optional)
//   contractName  - display name for the contract (optional)
//   canUpload     - whether the current user may upload/replace the contract
//   uploading     - upload in progress
//   onUpload(file)- called with the selected File
//   signedUrl     - the startup's uploaded, signed copy (string) or falsy
//   acknowledgedAt- when the startup signed (ISO date string)
//   canSign       - whether the startup may upload the signed copy
//   signing       - signed-copy upload in progress
//   onSignUpload(file) - called with the startup's signed file
const formatDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const fileNameFromUrl = (url) => {
  const raw = String(url || "").split("?")[0].split("#")[0];
  try {
    return decodeURIComponent(raw.split("/").pop() || "");
  } catch {
    return raw.split("/").pop() || "";
  }
};

const FilePicker = ({ uploading, onUpload, children, className }) => (
  <label className={className}>
    {children}
    <input
      type="file"
      accept="application/pdf,image/*"
      hidden
      disabled={uploading}
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) onUpload(file);
        e.target.value = "";
      }}
    />
  </label>
);

const Detail = ({ label, value, children }) => (
  <div className="flex items-center gap-3 text-sm">
    <span className="w-24 shrink-0 text-slate-500">{label}</span>
    {children || <span className="font-semibold text-slate-900">{value}</span>}
  </div>
);

const SignedContractCard = ({
  contractUrl,
  uploadedAt,
  contractName,
  canUpload = false,
  uploading = false,
  onUpload,
  acknowledgedAt,
  signedUrl,
  canSign = false,
  signing = false,
  onSignUpload,
}) => {
  const hasContract = Boolean(contractUrl);

  const displayName =
    contractName || fileNameFromUrl(contractUrl) || "Grant agreement";

  const viewDownloadClass = (enabled) =>
    `inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold transition ${
      enabled
        ? "text-slate-700 hover:bg-slate-50"
        : "cursor-not-allowed text-slate-300"
    }`;

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/70">
      <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
        {/* Left — attached contract details */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-black tracking-tight text-slate-950">
              Grant Contract
            </h2>
          </div>

          <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            <Detail
              label="Contract Name"
              value={hasContract ? displayName : "Not uploaded yet"}
            />
            <Detail label="Status">
              {!hasContract ? (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                  Awaiting upload
                </span>
              ) : acknowledgedAt ? (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  Signed
                </span>
              ) : (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                  Awaiting signature
                </span>
              )}
            </Detail>
          </div>
        </div>

        {/* Right — actions (always shown) */}
        <div className="lg:pl-6">
          <h3 className="mb-4 text-sm font-bold tracking-tight text-slate-900">Actions</h3>
          <div className="flex flex-wrap gap-3">
            {/* View Contract is hidden for the startup — they only download and
                upload the signed copy. */}
            {!canSign &&
              (hasContract ? (
                <a
                  href={contractUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={viewDownloadClass(true)}
                >
                  <Eye className="h-4 w-4 text-emerald-600" />
                  View Contract
                </a>
              ) : (
                <button type="button" disabled className={viewDownloadClass(false)}>
                  <Eye className="h-4 w-4" />
                  View Contract
                </button>
              ))}

            {hasContract ? (
              <a
                href={contractUrl}
                download
                target="_blank"
                rel="noreferrer"
                className={viewDownloadClass(true)}
              >
                <Download className="h-4 w-4 text-emerald-600" />
                Download
              </a>
            ) : (
              <button type="button" disabled className={viewDownloadClass(false)}>
                <Download className="h-4 w-4" />
                Download
              </button>
            )}

            {canUpload && (
              <FilePicker
                uploading={uploading}
                onUpload={onUpload}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#16a34a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#15803d] ${
                  uploading ? "pointer-events-none opacity-60" : ""
                }`}
              >
                <UploadCloud className="h-4 w-4" />
                {uploading
                  ? "Uploading..."
                  : hasContract
                    ? "Upload New Version"
                    : "Upload Contract"}
              </FilePicker>
            )}

            {canSign && hasContract && !acknowledgedAt && (
              <FilePicker
                uploading={signing}
                onUpload={onSignUpload}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#16a34a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#15803d] ${
                  signing ? "pointer-events-none opacity-60" : ""
                }`}
              >
                <UploadCloud className="h-4 w-4" />
                {signing ? "Uploading..." : "Upload signed contract"}
              </FilePicker>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        {!hasContract ? (
          <span className="text-xs font-semibold text-slate-500">
            {canUpload
              ? "Upload the grant contract to begin — the startup downloads, signs and uploads it back."
              : canSign
                ? "The grant contract will appear here to download, sign and upload."
                : "The contract will appear here once the finance officer uploads it."}
          </span>
        ) : acknowledgedAt ? (
          <span className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e1f0d8] px-3 py-1 text-xs font-bold text-[#2d6e1f]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Signed by startup on {formatDate(acknowledgedAt)}
            </span>
            {signedUrl && (
              <a
                href={signedUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#163b8f] hover:underline"
              >
                <Eye className="h-3.5 w-3.5" />
                View signed copy
              </a>
            )}
          </span>
        ) : (
          <span className="text-xs font-semibold text-slate-500">
            {uploadedAt ? `Uploaded ${formatDate(uploadedAt)} • ` : ""}
            {canSign
              ? "Download the contract, sign it, then upload the signed copy."
              : "Awaiting startup signature."}
          </span>
        )}
      </div>
    </section>
  );
};

export default SignedContractCard;