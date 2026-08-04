"use client";
import { useEffect, useState } from "react";
import { getAdmins } from "@/controllers/user_controller";
import UserDirectory from "@/components/users/UserDirectory";
import { useTranslation } from "../../../locales";

const Page = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdmins(1000, 1)
      .then((body) => {
        setUsers(Array.isArray(body?.data) ? body.data : []);
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <UserDirectory
      badge="Administration"
      title={t("navigation.admins", "Admins")}
      description="The administrators who manage platform operations, oversee users, and keep the Anza Connect ecosystem running."
      chips={["Admin Profiles", "Platform Operations"]}
      heading="Available Admins"
      users={users}
      loading={loading}
      emptyText="No admins found."
    />
  );
};

export default Page;
