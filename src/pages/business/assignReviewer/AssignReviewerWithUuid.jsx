"use client";
import { useContext, useEffect, useState } from "react";
import {
  createBusinessReview,
  deleteBusinessReview,
  getReviewers,
} from "@/controllers/business_review_controller";
import { timeAgo } from "@/utils/time_ago";
import Link from "@/utils/link";
import Loader from "@/components/common/Loader";
import Breadcrumb from "@/component/Breadcrumb";

import { useParams } from "react-router-dom";
import { useTranslation } from "../../../locales";

const Page = ({ params }) => {
  const { t } = useTranslation();
  const uuid = useParams().uuid;
  const [users, setUsers] = useState([]);
  const [ShowOptions, setShowOptions] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [loading, setloading] = useState(true);
  const [total, settotal] = useState(0);
  const [limit, setlimit] = useState(7);
  const [currentPage, setcurrentPage] = useState(1);
  const [totalPages, settotalPages] = useState(1);

  useEffect(() => {
    getReviewers(uuid, currentPage, limit).then((body) => {
      setUsers(body.data);
      settotal(body.count);
      setcurrentPage(body.page);
      settotalPages(body.totalPages);
      setloading(false);
    });
  }, [uuid, currentPage, limit, refresh]);

  if (loading) return <Loader />;

  return (
    <div className="">
      <div>
        <Breadcrumb
          pageName={t("business.assignReviewer", "Assign reviewer")}
          prevLink={""}
          prevPage={t("users.businesses", "Businesses")}
        />
        <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="py-6 px-4 md:px-6 xl:px-7.5">
            <h4 className="text-xl font-semibold text-black dark:text-white">
              {t("users.reviewers", "Reviewers ({{count}})", {
                count: total,
              })}
            </h4>
          </div>

          <div className="grid grid-cols-6 border-t border-stroke py-4.5 px-4 dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5">
            <div className="col-span-1 flex items-center">
              <p className="font-medium">{t("business.sent", "Sent")}</p>
            </div>
            <div className="col-span-1 hidden items-center sm:flex">
              <p className="font-medium">{t("users.username", "Username")}</p>
            </div>
            <div className="col-span-1 flex items-center">
              <p className="font-medium">{t("users.role", "Role")}</p>
            </div>
            <div className="col-span-2 flex items-center">
              <p className="font-medium">{t("business.phone", "Phone")}</p>
            </div>
            <div className="col-span-2 flex items-center">
              <p className="font-medium">{t("business.email", "Email")}</p>
            </div>
            <div className="col-span-1 flex items-center">
              <p className="font-medium">{t("users.assign", "Assign")}</p>
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
              <div className="col-span-2 flex items-center">
                <p className="text-sm text-black dark:text-white">
                  {item.email}
                </p>
              </div>
              <div className="col-span-1 flex items-center">
                <div
                  onClick={() => {
                    const data = { business_uuid: uuid, user_uuid: item.uuid };
                    if (item.status < 1) {
                      createBusinessReview(data).then(() => {
                        setRefresh(refresh + 1);
                      });
                    } else {
                      deleteBusinessReview(item.BusinessReview.uuid).then(
                        () => {
                          setRefresh(refresh + 1);
                        }
                      );
                    }
                  }}
                  className={`py-2 px-3 ${
                    item.status < 1
                      ? "bg-primary text-white"
                      : "bg-bodydark1 text-black"
                  } cursor-pointer hover:opacity-95 transition-all rounded`}
                >
                  {item.status < 1
                    ? t("users.assign", "Assign")
                    : t("users.remove", "Remove")}
                </div>
              </div>
            </div>
          ))}

          <div className="flex px-5 py-8 justify-between">
            <div>
              {t("business.pageLabel", "Page {{current}} of {{total}} pages", {
                current: currentPage,
                total: totalPages,
              })}
            </div>
            <div className="flex space-x-3 ">
              <div
                onClick={() => {
                  if (currentPage > 1) {
                    setcurrentPage(currentPage - 1);
                    setRefresh(refresh + 1);
                  }
                }}
                className="ring-1 ring-stroke hover:bg-primary hover:text-white py-2 px-4 cursor-pointer rounded "
              >
                {t("common.previous", "Prev")}
              </div>
              <div
                onClick={() => {
                  if (currentPage < totalPages) {
                    setcurrentPage(currentPage + 1);
                    setRefresh(refresh + 1);
                  }
                }}
                className="ring-1 ring-stroke hover:bg-primary hover:text-white py-2 px-4 cursor-pointer rounded "
              >
                {t("common.next", "Next")}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
