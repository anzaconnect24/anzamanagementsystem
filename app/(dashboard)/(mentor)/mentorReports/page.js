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

const Page = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const { userDetails } = useContext(UserContext);
  useEffect(() => {
    if (userDetails.role == "Mentor") {
      getSpecificMentorReports(userDetails.uuid).then((res) => {
        console.log(res);
        setData(res);
        setLoading(false);
      });
    } else if (userDetails.role == "Enterprenuer") {
      getSpecificEntreprenuerReports(userDetails.uuid).then((res) => {
        console.log(res);
        setData(res);
        setLoading(false);
      });
    } else {
      getAllReports(userDetails.uuid).then((res) => {
        console.log(res);
        setData(res);
        setLoading(false);
      });
    }
  }, []);
  return loading ? (
    <Loader />
  ) : (
    <div className="bg-white min-h-[30vh] py-6 shadow mt-6 px-6 ">
      <h1 className="text-2xl font-bold">Mentor Reports</h1>
      {data.length < 1 ? (
        <NoData />
      ) : (
        <table className="mt-8">
          <thead>
            <tr>
              <th>Reported</th>
              <th>
                {userDetails.role == "Enterprenuer" ? "Mentor" : "Entreprenuer"}
              </th>
              <th>Report title</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => {
              console.log('this is item', item);
              return (
                <tr key={item.uuid}>
                  <td>{timeAgo(item.createdAt)}</td>
                  <td>
  {userDetails.role === "Enterprenuer"
    ? item.Mentor?.name || "N/A"
    : item.Entreprenuer?.name || "N/A"}
</td>
                  <td>{item.title}</td>
                  <td>
                    <Link
                      className="text-primary font-bold hover:scale-105 transition-all"
                      href={`/mentorReport/${item.uuid}`}
                    >
                      View Report
                    </Link>
                  </td>
                  {/* <td>
                  <Link
                    href={`/addEntreprenuerReport/${item.Entreprenuer.uuid}`}
                    className="py-2 px-4 bg-primary text-white hover:bg-opacity-90 transition-all duration-300 rounded"
                  >
                    Submit report
                  </Link>
                </td> */}
                  <td></td>
                  <td></td>
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
