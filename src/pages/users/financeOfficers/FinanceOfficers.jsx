"use client";
import { useContext, useEffect, useState } from "react";
import { getAllUsers } from "@/controllers/user_controller";
import { timeAgo } from "../../../utils/time_ago";
import Loader from "@/components/common/Loader";
import NoData from "@/component/noData";
import { UserContext } from "../../../layouts/DashboardLayout";

import { useTranslation } from "../../../locales";

const Page = () => {
  const [users, setUsers] = useState([]);
  const { t } = useTranslation();
  const { userDetails } = useContext(UserContext);

  const [loading, setloading] = useState(true);
  useEffect(() => {
    // There is no dedicated finance-officers endpoint, so pull users and
    // keep only those with the "Finance" role (Finance Officers).
    getAllUsers(1000, 1)
      .then((body) => {
        const all = Array.isArray(body?.data) ? body.data : [];
        setUsers(all.filter((item) => item.role === "Finance"));
        setloading(false);
      })
      .catch(() => setloading(false));
  }, []);
  return loading ? (
    <Loader />
  ) : (
    <div className="">
      <div>
        <h1 className="text-2xl font-bold mb-4">
          {t("users.welcome", "Welcome")} {userDetails.name}!
        </h1>
        <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="py-6 px-4 md:px-6 xl:px-7.5">
            <h4 className="text-xl font-semibold text-black dark:text-white">
              {t("users.financeOfficers", "Finance Officers")}
            </h4>
          </div>
          {users.length < 1 ? (
            <NoData />
          ) : (
            <div>
              <div className="grid grid-cols-6 border-t border-stroke py-4.5 px-4 dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5">
                <div className="col-span-1 flex items-center">
                  <p className="font-medium">{t("users.sent", "Sent")} </p>
                </div>
                <div className="col-span-1 hidden items-center sm:flex">
                  <p className="font-medium">
                    {t("users.username", "Username")}
                  </p>
                </div>
                <div className="col-span-1 flex items-center">
                  <p className="font-medium">{t("users.role", "Role")}</p>
                </div>
                <div className="col-span-2 flex items-center">
                  <p className="font-medium">{t("users.phone", "Phone")}</p>
                </div>
                <div className="col-span-3 flex items-center">
                  <p className="font-medium">{t("users.email", "Email")}</p>
                </div>
              </div>

              {users.map((item, key) => (
                <div
                  className="grid grid-cols-6 border-t border-stroke py-4.5 px-4 dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5"
                  key={key}
                >
                  <div className="col-span-1 hidden items-center sm:flex">
                    <p className="text-sm text-black dark:text-white">
                      {timeAgo(item.createdAt)}
                    </p>
                  </div>
                  <div className="col-span-1 flex items-center">
                    <p className="text-sm text-black dark:text-white">
                      {item.name}
                    </p>
                  </div>
                  <div className="col-span-1 flex items-center">
                    <p className="text-sm text-black dark:text-white">
                      {item.role}
                    </p>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <p className="text-sm text-black dark:text-white">
                      {item.phone}
                    </p>
                  </div>
                  <div className="col-span-3 flex items-center">
                    <p className="text-sm text-black dark:text-white">
                      {item.email}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Page;
