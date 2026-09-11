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
    // There is no dedicated M&E endpoint, so pull users and keep only those
    // with the "ME" role (Monitoring & Evaluation Officers).
    getAllUsers(1000, 1)
      .then((body) => {
        const all = Array.isArray(body?.data) ? body.data : [];
        setUsers(all.filter((item) => item.role === "ME"));
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <UserDirectory
      badge="Monitoring & Evaluation"
      title={t("users.meOfficers", "Monitoring & Evaluation Officers")}
      description="The officers who set up results frameworks and indicators, verify the data startups report, and track programme impact across the portfolio."
      chips={["Results Frameworks", "Impact Reporting"]}
      heading="Available M&E Officers"
      users={users}
      loading={loading}
      emptyText="No monitoring and evaluation officers found."
    />
  );
};

export default Page;
