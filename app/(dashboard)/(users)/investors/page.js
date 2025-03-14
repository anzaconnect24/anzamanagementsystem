"use client";
import { useContext, useEffect, useState } from "react";
import {
  getAllUsers,
  getInvestors,
} from "../../../controllers/user_controller";
import { timeAgo } from "../../../utils/time_ago";
import Link from "next/link";
import Image from "next/image";
import Loader from "@/components/common/Loader";
import NoData from "@/app/component/noData";
import { UserContext } from "../../layout";
import { sendInvestmentInterest } from "@/app/controllers/investment_interest_controller";

import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

const Page = () => {
  const [users, setUsers] = useState([]);
  const [ShowOptions, setShowOptions] = useState(false);
  const { userDetails } = useContext(UserContext);
  const [loading, setloading] = useState(true);
  const [selectedBusiness, setSelectedBusiness] = useState();
  const [total, settotal] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const [keyword, setKeyword] = useState("");

  const [limit, setlimit] = useState(12);
  const [currentPage, setcurrentPage] = useState(1);
  const [selectedItem, setselectedItem] = useState(null);
  const [totalPages, settotalPages] = useState(1);
  const router = useRouter();
  useEffect(() => {
    getInvestors(limit, currentPage, keyword).then((body) => {
      setloading(false);
      settotal(body.count);
      setcurrentPage(body.page);
      settotalPages(body.totalPages);
      setUsers(body.data);
    });
  }, [refresh]);
  return loading ? (
    <Loader />
  ) : (
    <div className="">
      <div>
        <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="flex justify-between py-6 px-4 md:px-6 xl:px-7.5">
            <div className=" ">
              <h4 className="text-xl font-semibold text-black dark:text-white">
                Investors
              </h4>
            </div>
            <input
              onChange={(e) => {
                setKeyword(e.target.value);
                setRefresh(refresh + 1);
              }}
              className="py-1 rounded border-bodydark border-opacity-40 "
              placeholder="Search here"
            />
          </div>
          {users.length < 1 ? (
            <NoData />
          ) : (
            <div className="pb-8">
              <div className="grid grid-cols-4 px-6">
                {users.map((item, key) => (
                  <Link
                    href={`investors/${item.uuid}`}
                    className="flex flex-col items-center justify-center border hover:scale-105 transition-all duration-200   border-slate-300 py-12 rounded-lg"
                    key={key}
                  >
                    <div className=" bg-gray h-24 w-24 rounded-full flex justify-center items-center">
                      <Image
                        height={200}
                        alt=""
                        width={200}
                        className="  object-cover rounded-full"
                        src={item.image}
                      />
                    </div>
                    <h1 className="text-lg">{item.name}</h1>
                    <div className="flex space-x-1 hover:underline hover:text-primary cursor-pointer items-center">
                      <p className="text-sm">
                        Ticket: {item.InvestorProfile.ticketSize}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
          <div className="flex px-5 py-8 justify-between">
            <div>
              Page {currentPage} of {totalPages} pages
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
                Prev
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
                Next
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
