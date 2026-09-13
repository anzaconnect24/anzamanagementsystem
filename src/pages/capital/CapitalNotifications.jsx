"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getCapitalNotifications } from "@/controllers/capital_controller";
import { CapitalHero, Card, Empty, LoadingBlock, Select } from "@/components/capital/CapitalUI";
import { dateTime } from "@/utils/capital_labels";

// Notification types grouped the way a manager thinks about them.
const GROUPS = [
  { key: "request", label: "Capital requests", match: /^capital\.request\./ },
  { key: "introduction", label: "Introductions and interest", match: /^capital\.(introduction|provider|permission)\./ },
  { key: "message", label: "Messages", match: /^capital\.message\./ },
  { key: "document", label: "Documents and deal rooms", match: /^capital\.(document|dealroom)\./ },
  { key: "duediligence", label: "Due diligence", match: /^capital\.duediligence\./ },
  { key: "meeting", label: "Meetings", match: /^capital\.meeting\./ },
  { key: "deal", label: "Offers, commitments and disbursements", match: /^capital\.(offer|commitment|disbursement|disbursed|secured|outcome)/ },
  { key: "attention", label: "Needs attention", match: /^capital\.(opportunity|intervention)\./ },
];

const groupOf = (type) => GROUPS.find((group) => group.match.test(type || ""))?.key || "other";

const CapitalNotifications = () => {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [group, setGroup] = useState("");

  useEffect(() => {
    getCapitalNotifications().then((response) => {
      if (response?.status === false) toast.error(response.message || "Failed to load notifications");
      else setResult(response.body);
    });
  }, []);

  if (!result) return <LoadingBlock label="Loading notifications…" />;

  const rows = group ? result.data.filter((row) => groupOf(row.type) === group) : result.data;
  const today = new Date().toDateString();
  const sections = [
    ["Today", rows.filter((row) => new Date(row.createdAt).toDateString() === today)],
    ["Earlier", rows.filter((row) => new Date(row.createdAt).toDateString() !== today)],
  ].filter(([, items]) => items.length);

  return (
    <div className="min-h-screen px-4 py-4 md:px-6">
      <CapitalHero title="Capital Notifications" description="New requests, introductions waiting for approval, held messages, uploaded documents, stale opportunities, overdue due diligence, upcoming meetings, offers, commitments and disbursements." />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">{result.data.length} capital notifications</p>
        <Select className="!w-72" value={group} onChange={setGroup} placeholder="All notifications" options={GROUPS.map((item) => ({ value: item.key, label: item.label }))} />
      </div>

      {sections.length ? (
        sections.map(([title, items]) => (
          <Card key={title} title={title} padded={false} className="mb-4">
            <ul className="divide-y divide-slate-100">
              {items.map((row) => (
                <li key={row.uuid}>
                  <button type="button" disabled={!row.link} onClick={() => row.link && navigate(row.link)} className="flex w-full items-start gap-3 px-5 py-3 text-left hover:bg-slate-50 disabled:cursor-default">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${row.read ? "bg-slate-200" : "bg-[#f08a3c]"}`} aria-label={row.read ? "Read" : "Unread"} />
                    <span className="min-w-0 flex-1">
                      <span className={`block text-sm ${row.read ? "text-slate-600" : "font-semibold text-slate-900"}`}>{row.message}</span>
                      <span className="block text-[11px] text-slate-400">{GROUPS.find((item) => item.key === groupOf(row.type))?.label || "Capital facilitation"} · {dateTime(row.createdAt)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        ))
      ) : (
        <Empty>No capital notifications{group ? " of this kind" : ""}.</Empty>
      )}
    </div>
  );
};

export default CapitalNotifications;
