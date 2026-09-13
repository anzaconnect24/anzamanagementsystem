"use client";
import { useEffect, useState } from "react";
import { getAllUsers } from "@/controllers/user_controller";
import UserDirectory from "@/components/users/UserDirectory";
import { useTranslation } from "../../../locales";

// The Capital Facilitation Managers: Anza staff who run capital facilitation.
// Like the other staff directories, it filters the user list by role - there is
// no dedicated endpoint for one role.
const Page = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllUsers(1000, 1)
      .then((body) => {
        const all = Array.isArray(body?.data) ? body.data : [];
        setUsers(all.filter((item) => item.role === "CFM"));
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <UserDirectory
      badge="Capital Facilitation"
      title={t("users.capitalManagers", "Capital Facilitation Managers")}
      description="The staff who review capital requests, match enterprises with capital providers, control introductions and communication, and track every financing opportunity through to disbursement."
      chips={["Capital Matching", "Deal Flow", "Capital Mobilised"]}
      heading="Available Capital Facilitation Managers"
      users={users}
      loading={loading}
      emptyText="No capital facilitation managers found."
    />
  );
};

export default Page;
