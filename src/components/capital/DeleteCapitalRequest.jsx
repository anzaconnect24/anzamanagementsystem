"use client";

// Deleting a capital request: a button and the confirmation behind it. A
// manager must give a reason; an enterprise withdrawing its own application
// may. The API refuses a request that already has capital opportunities.
import { useState } from "react";
import toast from "react-hot-toast";
import { deleteCapitalRequest, deleteMyCapitalRequest } from "@/controllers/capital_controller";
import { Field, inputClass, Modal, buttonClass } from "@/components/capital/CapitalUI";

// The statuses an enterprise may still withdraw on its own.
export const ENTERPRISE_DELETABLE = ["draft", "submitted", "more_information_required"];

const DeleteCapitalRequest = ({ request, mode = "manager", onDeleted, className, label }) => {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const manager = mode === "manager";

  const confirm = async () => {
    if (manager && !reason.trim()) return toast.error("Give a reason for deleting the capital request");
    setSaving(true);
    const data = { reason: reason.trim() || undefined };
    const response = manager ? await deleteCapitalRequest(request.uuid, data) : await deleteMyCapitalRequest(request.uuid, data);
    setSaving(false);
    if (response?.status === false) return toast.error(response.message || "Failed to delete");
    toast.success(`${request.reference} deleted`);
    setOpen(false);
    setReason("");
    if (onDeleted) onDeleted(response.body);
  };

  return (
    <>
      <button type="button" className={className || buttonClass.danger} onClick={() => setOpen(true)}>
        {label || (manager ? "Delete request" : "Delete application")}
      </button>
      <Modal
        open={open}
        title={`Delete ${request.reference}`}
        onClose={() => setOpen(false)}
        footer={
          <>
            <button type="button" className={buttonClass.secondary} onClick={() => setOpen(false)}>Cancel</button>
            <button type="button" className={buttonClass.danger} disabled={saving} onClick={confirm}>{saving ? "Deleting…" : "Delete"}</button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            {manager
              ? "The request disappears from every list and the enterprise is told, with your reason. Any introduction still waiting on it is closed and its documents can no longer be opened. The audit trail keeps a permanent record."
              : "Your application is withdrawn and disappears from your list. Any introduction you requested for it is cancelled. This cannot be undone."}
          </p>
          <Field label={manager ? "Reason (the enterprise will see this)" : "Reason (optional)"}>
            <textarea rows={3} className={inputClass} value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
        </div>
      </Modal>
    </>
  );
};

export default DeleteCapitalRequest;
