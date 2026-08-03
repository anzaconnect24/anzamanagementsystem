import { useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Link2,
  Loader2,
  Paperclip,
  Presentation,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { uploadFile } from "@/controllers/file_upload_controller";

// Learning materials attached to a coaching session — documents the mentor
// uploads (templates, guides, worked examples) or links they share, so the
// startup has the supporting material alongside what was discussed.
//
// A material is `{ kind, name, description, url, fileType, size, addedAt }`
// where `kind` is "file" (uploaded) or "link" (external resource).

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export const MATERIAL_ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.png,.jpg,.jpeg,.zip";

// Materials may arrive as an array or as a JSON string, depending on how the
// backend stores the column — tolerate both (same as the KPI plan).
export const parseMaterials = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return [];
    }
  }
  return [];
};

const extensionOf = (value) => {
  const clean = String(value || "").split("?")[0];
  const parts = clean.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
};

export const formatFileSize = (bytes) => {
  const size = Number(bytes);
  if (!size || Number.isNaN(size)) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const materialIcon = (material) => {
  if (material?.kind === "link") return <Link2 className="h-5 w-5" />;
  const ext = material?.fileType || extensionOf(material?.name || material?.url);
  if (["xls", "xlsx", "csv"].includes(ext))
    return <FileSpreadsheet className="h-5 w-5" />;
  if (["ppt", "pptx"].includes(ext)) return <Presentation className="h-5 w-5" />;
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext))
    return <ImageIcon className="h-5 w-5" />;
  return <FileText className="h-5 w-5" />;
};

const materialMeta = (material) => {
  if (material?.kind === "link") return "External link";
  const ext = material?.fileType || extensionOf(material?.name || material?.url);
  const size = formatFileSize(material?.size);
  return [ext ? ext.toUpperCase() : "File", size].filter(Boolean).join(" · ");
};

// One material — the same row is used read-only (startup / history view) and in
// the editor, where it also carries a note field and a remove action.
const MaterialRow = ({ material, onRemove, onDescriptionChange, disabled }) => (
  <div className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3">
    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#0b2b5c]/5 text-[#0b2b5c]">
      {materialIcon(material)}
    </div>

    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-bold text-slate-900">
        {material?.name || "Untitled material"}
      </p>
      <p className="mt-0.5 text-xs font-medium text-slate-400">
        {materialMeta(material)}
      </p>

      {onDescriptionChange ? (
        <input
          className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#082d77] focus:ring-2 focus:ring-[#082d77]/20"
          placeholder="Note for the startup (optional) — what this is for"
          value={material?.description || ""}
          onChange={(e) => onDescriptionChange(e.target.value)}
          disabled={disabled}
        />
      ) : (
        material?.description && (
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {material.description}
          </p>
        )
      )}
    </div>

    {material?.url && (
      <a
        href={material.url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-[#0b2b5c] transition hover:bg-slate-50"
      >
        {material.kind === "link" ? (
          <ExternalLink className="h-4 w-4" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {material.kind === "link" ? "Open" : "Download"}
      </a>
    )}

    {onRemove && (
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
        aria-label="Remove material"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    )}
  </div>
);

// Read-only list — what the startup and the session history see.
export const MaterialsList = ({
  materials = [],
  emptyText = "No learning materials shared for this session yet.",
}) => {
  if (!materials.length)
    return (
      <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
        {emptyText}
      </div>
    );

  return (
    <div className="space-y-3">
      {materials.map((material, index) => (
        <MaterialRow
          key={`${material?.url || material?.name}-${index}`}
          material={material}
        />
      ))}
    </div>
  );
};

// Editor — upload documents or attach links. Files upload as soon as they are
// picked so the mentor sees them attached before saving the session.
export const MaterialsInput = ({
  materials = [],
  onChange,
  onUploadingChange,
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [link, setLink] = useState({ name: "", url: "" });
  const fileInputRef = useRef(null);

  const setBusy = (value) => {
    setUploading(value);
    onUploadingChange?.(value);
  };

  const addFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    setBusy(true);
    const added = [];
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} is larger than 20MB`);
        continue;
      }
      try {
        const form = new FormData();
        form.append("file", file);
        const url = await uploadFile(form);
        // uploadFile resolves to the stored URL; anything else means it failed.
        if (typeof url !== "string" || !url.trim()) {
          throw new Error("Upload failed");
        }
        added.push({
          kind: "file",
          name: file.name,
          description: "",
          url,
          fileType: extensionOf(file.name),
          size: file.size,
          addedAt: new Date().toISOString(),
        });
      } catch {
        toast.error(`Could not upload ${file.name}`);
      }
    }
    if (added.length) {
      onChange([...materials, ...added]);
      toast.success(
        added.length === 1 ? "Material uploaded" : `${added.length} materials uploaded`,
      );
    }
    setBusy(false);
  };

  const onPick = async (e) => {
    await addFiles(e.target.files);
    // Reset so picking the same file again still fires a change event.
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onDrop = async (e) => {
    e.preventDefault();
    setDragging(false);
    if (uploading) return;
    await addFiles(e.dataTransfer?.files);
  };

  const addLink = () => {
    const url = link.url.trim();
    if (!url) {
      toast.error("Add the link address first");
      return;
    }
    const normalised = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    onChange([
      ...materials,
      {
        kind: "link",
        name: link.name.trim() || normalised,
        description: "",
        url: normalised,
        fileType: "",
        size: 0,
        addedAt: new Date().toISOString(),
      },
    ]);
    setLink({ name: "", url: "" });
  };

  const updateAt = (index, patch) =>
    onChange(
      materials.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );

  const removeAt = (index) =>
    onChange(materials.filter((_, i) => i !== index));

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${
          dragging
            ? "border-[#082d77] bg-[#082d77]/5"
            : "border-slate-200 bg-slate-50/60"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={MATERIAL_ACCEPT}
          onChange={onPick}
          className="hidden"
          id="session-materials-input"
        />
        <div className="grid place-items-center gap-2">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-white text-[#0b2b5c] shadow-sm">
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <UploadCloud className="h-5 w-5" />
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="rounded-xl bg-[#16a34a] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#15803d] disabled:opacity-60"
          >
            {uploading ? "Uploading..." : "Choose documents"}
          </button>
          <p className="text-xs text-slate-500">
            or drag them here — PDF, Word, Excel, PowerPoint, images. Up to 20MB
            each.
          </p>
        </div>
      </div>

      {/* Link */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#082d77] focus:ring-2 focus:ring-[#082d77]/20 sm:w-1/3"
          placeholder="Link title (optional)"
          value={link.name}
          onChange={(e) => setLink((prev) => ({ ...prev, name: e.target.value }))}
        />
        <input
          className="w-full flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#082d77] focus:ring-2 focus:ring-[#082d77]/20"
          placeholder="https://… a video, article or template to share"
          value={link.url}
          onChange={(e) => setLink((prev) => ({ ...prev, url: e.target.value }))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addLink();
            }
          }}
        />
        <button
          type="button"
          onClick={addLink}
          className="shrink-0 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-[#0b2b5c] transition hover:bg-slate-50"
        >
          Add link
        </button>
      </div>

      {/* What is attached so far */}
      {materials.length > 0 && (
        <div className="space-y-2">
          <p className="flex items-center gap-2 text-xs font-bold tracking-wide text-slate-500">
            <Paperclip className="h-3.5 w-3.5" />
            {materials.length} attached
          </p>
          {materials.map((material, index) => (
            <MaterialRow
              key={`${material?.url || material?.name}-${index}`}
              material={material}
              disabled={uploading}
              onRemove={() => removeAt(index)}
              onDescriptionChange={(value) =>
                updateAt(index, { description: value })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MaterialsList;
