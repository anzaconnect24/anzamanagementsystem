"use client";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "../../layout";
import Loader from "@/components/common/Loader";
import { timeAgo } from "@/app/utils/time_ago";
import {
  getAllReports,
  getSpecificEntreprenuerReports,
  getSpecificMentorReports,
} from "@/app/controllers/mentorReportsController";
import Link from "next/link";
import NoData from "@/app/component/noData";
import { useTranslation } from "@/app/locales";

const Page = () => {
  const { t } = useTranslation();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const { userDetails } = useContext(UserContext);
  useEffect(() => {
    if (userDetails.role == "Mentor") {
      getSpecificMentorReports(userDetails.uuid).then((res) => {
        setData(res);
        setLoading(false);
      });
    } else if (userDetails.role == "Enterprenuer") {
      getSpecificEntreprenuerReports(userDetails.uuid).then((res) => {
        setData(res);
        setLoading(false);
      });
    } else {
      getAllReports(userDetails.uuid).then((res) => {
        setData(res);
        setLoading(false);
      });
    }
  }, []);
  return loading ? (
    <Loader />
  ) : (
    <div className="bg-white min-h-[30vh] py-6 shadow mt-6 px-6 ">
      <h1 className="text-2xl font-bold">
        {t("mentorship.mentorReports", "Mentor Reports")}
      </h1>
      {data.length < 1 ? (
        <NoData />
      ) : (
        <table className="mt-8">
          <thead>
            <tr>
              <th>{t("mentorship.reported", "Reported")}</th>
              <th>
                {userDetails.role == "Enterprenuer"
                  ? t("mentorship.mentor", "Mentor")
                  : t("mentorship.entrepreneur", "Entreprenuer")}
              </th>
              <th>{t("mentorship.reportTitle", "Report title")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => {
              return (
                <tr key={item.uuid}>
                  <td>{timeAgo(item.createdAt)}</td>
                  <td>
                    {userDetails.role === "Enterprenuer"
                      ? item.Mentor?.name || t("common.notProvided", "N/A")
                      : item.Entreprenuer?.name ||
                        t("common.notProvided", "N/A")}
                  </td>
                  <td>{item.title}</td>
                  <td>
                    <Link
                      className="text-primary font-bold hover:scale-105 transition-all"
                      href={`/mentorReport/${item.uuid}`}
                    >
                      {t("mentorship.viewReport", "View Report")}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Page;
