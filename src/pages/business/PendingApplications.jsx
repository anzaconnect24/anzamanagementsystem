"use client";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { getPendingBusinesses, updateBusiness } from "@/controllers/business_controller";
import { updateUser } from "@/controllers/user_controller";

import Link from "@/utils/link";
import Loader from "@/components/common/Loader";
import NoData from "@/component/noData";
import { HiOutlineSearch, HiOutlineEye, HiOutlineUserGroup } from "react-icons/hi";

import { timeAgo } from "../../utils/time_ago";
import { useTranslation } from "../../locales";

// Every application still waiting for an admin's decision. Approving accepts
// the business and activates its founder's account; rejecting moves it to
// Rejected Applications. Either way it leaves this list.
const Page = () => {
  const { t } = useTranslation();
  const [applications, setApplications] = useState([]);
  const [loading, setloading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("oldest");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    getPendingBusinesses(1, 1000).then((data) => {
      setApplications(Array.isArray(data?.data) ? data.data : []);
      setloading(false);
    });
  }, []);

  const visible = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const rows = applications.filter((item) =>
      [item.name, item.email, item.phone, item.User?.name, item.BusinessSector?.name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    );
    return [...rows].sort((a, b) => {
      if (sortBy === "name") return String(a.name || "").localeCompare(String(b.name || ""));
      const diff = new Date(a.createdAt) - new Date(b.createdAt);
      return sortBy === "oldest" ? diff : -diff;
    });
  }, [applications, searchTerm, sortBy]);

  const remove = (uuid) => setApplications((prev) => prev.filter((item) => item.uuid !== uuid));

  const approve = async (item) => {
    if (!window.confirm(t("business.confirmApprove", `Approve "${item.name}"? The founder's account will be activated.`))) return;
    setBusy(item.uuid);
    const ok = await updateBusiness({ status: "accepted" }, item.uuid);
    if (ok && item.User?.uuid) await updateUser({ activated: true }, item.User.uuid);
    setBusy("");
    if (!ok) {
      toast.error(t("business.approveFailed", "Could not approve the application"));
      return;
    }
    toast.success(t("business.success.approved", "Approved successfully"));
    remove(item.uuid);
  };

  const reject = async (item) => {
    if (!window.confirm(t("business.confirmReject", `Reject "${item.name}"? It will move to Rejected Applications.`))) return;
    setBusy(item.uuid);
    const ok = await updateBusiness({ status: "rejected" }, item.uuid);
    setBusy("");
    if (!ok) {
      toast.error(t("business.rejectFailed", "Could not reject the application"));
      return;
    }
    toast.success(t("business.success.rejected", "Application rejected"));
    remove(item.uuid);
  };

  const ageBadge = (createdAt) => {
    const days = Math.floor((Date.now() - new Date(createdAt)) / 86400000);
    if (days < 2) return { label: t("business.newStatus", "New"), className: "bg-success/10 text-success" };
    if (days < 5) return { label: t("business.pendingStatus", "Pending"), className: "bg-warning/10 text-warning" };
    return { label: t("business.urgentStatus", "Urgent"), className: "bg-danger/10 text-danger" };
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center bg-white">
        <Loader />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="min-h-[80vh] overflow-hidden rounded-2xl border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="border-b border-stroke bg-gradient-to-r from-primary/5 to-transparent p-6 dark:border-strokedark">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h4 className="mb-2 flex items-center gap-3 text-xl font-semibold text-black dark:text-white">
                {t("business.pendingApplications", "Pending Applications")}
                <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                  {applications.length} {t("business.awaitingDecision", "awaiting decision")}
                </span>
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("business.pendingApplicationsHelp", "Applications waiting to be approved or rejected. Oldest first, so nobody waits longest.")}
              </p>
            </div>

            <div className="flex flex-col gap-3 md:flex-row">
              <div className="relative">
                <input
                  type="text"
                  placeholder={t("business.searchApplicationsPlaceholder", "Search applications...")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-stroke bg-white/80 py-3 pl-12 pr-4 outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark/80 md:w-72"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2">
                  <HiOutlineSearch className="h-5 w-5 text-body dark:text-bodydark" />
                </span>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-xl border border-stroke bg-white/80 px-4 py-3 outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark/80"
              >
                <option value="oldest">{t("business.sortOldest", "Oldest first")}</option>
                <option value="newest">{t("business.sortNewest", "Newest first")}</option>
                <option value="name">{t("business.sortByName", "Sort by Name")}</option>
              </select>
            </div>
          </div>
        </div>

        {applications.length < 1 ? (
          <NoData />
        ) : (
          <div className="overflow-x-auto p-6">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="bg-gray-1 text-black dark:bg-meta-4 dark:text-white">
                  <th className="rounded-l-lg px-4 py-3 font-semibold">{t("business.status", "Status")}</th>
                  <th className="px-4 py-3 font-semibold">{t("business.businessName", "Business Name")}</th>
                  <th className="px-4 py-3 font-semibold">{t("business.contact", "Contact")}</th>
                  <th className="px-4 py-3 font-semibold">{t("business.submitted", "Submitted")}</th>
                  <th className="rounded-r-lg px-4 py-3 text-right font-semibold">{t("business.actions", "Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((item) => {
                  const badge = ageBadge(item.createdAt);
                  const working = busy === item.uuid;
                  return (
                    <tr key={item.uuid} className="border-b border-stroke last:border-0 hover:bg-gray-1 dark:border-strokedark dark:hover:bg-meta-4">
                      <td className="px-4 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${badge.className}`}>{badge.label}</span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-black dark:text-white">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.BusinessSector?.name || t("business.noSector", "Sector not set")}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-black dark:text-white">{item.User?.name || "—"}</p>
                        <p className="text-xs text-gray-500">{[item.email, item.phone].filter(Boolean).join(" · ") || "—"}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-black dark:text-white">{timeAgo(item.createdAt)}</p>
                        <p className="text-xs text-gray-500">#{item.uuid.slice(0, 8)}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/dashboard/enterprenuers/businessDetails/${item.uuid}`}
                            className="rounded-lg p-2 text-primary transition-colors hover:bg-primary/10"
                            title={t("business.viewDetails", "View Details")}
                          >
                            <HiOutlineEye className="h-5 w-5" />
                          </Link>
                          <Link
                            href={`/dashboard/assignReviewer/${item.uuid}`}
                            className="rounded-lg p-2 text-primary transition-colors hover:bg-primary/10"
                            title={t("business.assignReviewer", "Assign Reviewer")}
                          >
                            <HiOutlineUserGroup className="h-5 w-5" />
                          </Link>
                          <button
                            type="button"
                            disabled={working}
                            onClick={() => approve(item)}
                            className="rounded-lg bg-[#16a34a] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#15803d] disabled:opacity-60"
                          >
                            {t("business.approve", "Approve")}
                          </button>
                          <button
                            type="button"
                            disabled={working}
                            onClick={() => reject(item)}
                            className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                          >
                            {t("business.reject", "Reject")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!visible.length ? <p className="py-8 text-center text-sm text-gray-500">{t("business.noMatchingApplications", "No application matches your search.")}</p> : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;
