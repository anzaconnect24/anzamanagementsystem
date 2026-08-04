"use client";
import { useEffect, useState } from "react";
import { getReviewers } from "@/controllers/user_controller";
import UserDirectory from "@/components/users/UserDirectory";
import { useTranslation } from "../../../locales";

const Page = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getReviewers(1000, 1)
      .then((body) => {
        setUsers(Array.isArray(body?.data) ? body.data : []);
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <UserDirectory
      badge="Portfolio Support"
      title={t("navigation.staff", "Staff")}
      description="The business development advisors who support startups through their grant programs, coaching sessions, and milestone reporting."
      chips={["Staff Profiles", "Startup Support"]}
      heading="Available Staff"
      users={users}
      loading={loading}
      emptyText="No staff found."
    />
  );
};

export default Page;
