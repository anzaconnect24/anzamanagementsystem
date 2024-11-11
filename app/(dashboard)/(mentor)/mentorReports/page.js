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
    <div className="bg-white py-6 shadow mt-6 px-6 ">
      <h1 className="text-2xl font-bold">Mentor Reports</h1>
      <table className="mt-8">
        <thead>
          <tr>
            <th>Reported</th>
            <th>Enterprenuer</th>
            <th>Company</th>
            <th>Report title</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => {
            return (
              <tr key={item.uuid}>
                <td>{timeAgo(item.createdAt)}</td>
                <td>{item.Entreprenuer.name}</td>
                <td>{item.Entreprenuer.Business.name}</td>
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
    </div>
  );
};

export default Page;
