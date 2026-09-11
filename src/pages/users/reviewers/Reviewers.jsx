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
      title={t("navigation.bdas", "Business Development Advisors")}
      description="The business development advisors who support startups through their grant programs, coaching sessions, and milestone reporting."
      chips={["Advisor Profiles", "Startup Support"]}
      heading="Available Business Development Advisors"
      users={users}
      loading={loading}
      emptyText="No business development advisors found."
    />
  );
};

export default Page;
