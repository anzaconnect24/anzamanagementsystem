"use client";
import { useEffect, useState } from "react";
import { getAllUsers } from "@/controllers/user_controller";
import UserDirectory from "@/components/users/UserDirectory";
import { useTranslation } from "../../../locales";

const Page = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // There is no dedicated finance-officers endpoint, so pull users and
    // keep only those with the "Finance" role (Finance Officers).
    getAllUsers(1000, 1)
      .then((body) => {
        const all = Array.isArray(body?.data) ? body.data : [];
        setUsers(all.filter((item) => item.role === "Finance"));
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <UserDirectory
      badge="Grant Administration"
      title={t("users.financeOfficers", "Finance Officers")}
      description="The finance officers who set up grant programs, configure disbursement tranches, and release funds to startups."
      chips={["Finance Profiles", "Grant Disbursement"]}
      heading="Available Finance Officers"
      users={users}
      loading={loading}
      emptyText="No finance officers found."
    />
  );
};

export default Page;
