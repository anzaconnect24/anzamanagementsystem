"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { listDealRooms } from "@/controllers/capital_controller";
import { CapitalHero, Card, DataTable, LoadingBlock, StatusChip } from "@/components/capital/CapitalUI";
import { VISIBILITY_LABELS, dateTime, human, shortDate, stageLabel } from "@/utils/capital_labels";

// Every deal room, each the secure document space of one capital opportunity.
const CapitalDealRooms = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState(null);

  useEffect(() => {
    listDealRooms().then((response) => {
      if (response?.status === false) toast.error(response.message || "Failed to load deal rooms");
      else setRooms(response.body.data);
    });
  }, []);

  if (!rooms) return <LoadingBlock label="Loading deal rooms…" />;

  return (
    <div className="min-h-screen px-4 py-4 md:px-6">
      <CapitalHero
        title="Deal Rooms"
        description="A deal room opens once a capital provider shows serious interest. Every document carries its own visibility, and every view, download, permission change, replacement and deletion is in the audit trail."
      />

      <Card title={`${rooms.length} deal ${rooms.length === 1 ? "room" : "rooms"}`} padded={false}>
        <DataTable
          rows={rooms}
          empty="No deal rooms yet. Open one from a capital opportunity once the provider is engaged."
          onRowClick={(row) => navigate(`/dashboard/capital/opportunities/${row.opportunity.uuid}?tab=documents`)}
          columns={[
            { key: "name", label: "Deal room", render: (row) => <><span className="block font-semibold text-slate-800">{row.name}</span><span className="block text-xs text-[#082d77]">{row.opportunity.reference}</span></> },
            { key: "parties", label: "Enterprise / Provider", render: (row) => <><span className="block text-slate-800">{row.opportunity.enterprise}</span><span className="block text-xs text-slate-500">{row.opportunity.provider}</span></> },
            { key: "stage", label: "Stage", render: (row) => <><span className="block text-slate-700">{stageLabel(row.opportunity.stage)}</span><StatusChip value={row.opportunity.status} label={human(row.opportunity.status)} /></> },
            { key: "documents", label: "Documents", render: (row) => <span className="font-bold text-slate-900">{row.documents}</span> },
            {
              key: "visibility",
              label: "By visibility",
              render: (row) => (
                <span className="text-xs text-slate-600">
                  {Object.entries(row.byVisibility).filter(([, count]) => count).map(([key, count]) => `${VISIBILITY_LABELS[key]?.label || key}: ${count}`).join(" · ") || "—"}
                </span>
              ),
            },
            { key: "lastUploadAt", label: "Last upload", className: "whitespace-nowrap", render: (row) => (row.lastUploadAt ? dateTime(row.lastUploadAt) : "—") },
            { key: "createdAt", label: "Opened", className: "whitespace-nowrap", render: (row) => shortDate(row.createdAt) },
          ]}
        />
      </Card>
    </div>
  );
};

export default CapitalDealRooms;
