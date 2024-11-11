"use client";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "../../layout";
import Loader from "@/components/common/Loader";
import { timeAgo } from "@/app/utils/time_ago";
import { getMentorAssignedEntreprenuers } from "@/app/controllers/mentorEntreprenuerController";
import Link from "next/link";

const MentorEntreprenuer = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const { userDetails } = useContext(UserContext);
  useEffect(() => {
    getMentorAssignedEntreprenuers(userDetails.uuid).then((res) => {
      console.log(res);
      setData(res);
      setLoading(false);
    });
  }, []);
  return loading ? (
    <Loader />
  ) : (
    <div className="bg-white py-6 shadow mt-6 px-6 ">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">My Entrepreneurs</h1>
        <input
          onChange={(e) => {
            setKeyword(e.target.value);
          }}
          className="py-1 rounded border-bodydark border-opacity-40 "
          placeholder="Search here"
        />
      </div>
      <table className="mt-8">
        <thead>
          <tr>
            <th>Assigned</th>
            <th>Name</th>
            <th>Company</th>
            <th>Sector</th>
            <th>Email</th>
            <th>Phone</th>
          </tr>
        </thead>
        <tbody>
          {data
            .filter(
              (e) =>
                e.Entreprenuer.name
                  .toLowerCase()
                  .includes(keyword.toLowerCase()) ||
                e.Entreprenuer.Business.name
                  .toLowerCase()
                  .includes(keyword.toLowerCase()) ||
                e.Entreprenuer.Business.BusinessSector.name
                  .toLowerCase()
                  .includes(keyword.toLowerCase())
            )
            .map((item, index) => {
              return (
                <tr>
                  <td className="py-3">{timeAgo(item.createdAt)}</td>
                  <td className="py-3">{item.Entreprenuer.name}</td>
                  <td className="py-3">{item.Entreprenuer.Business.name}</td>
                  <td className="py-3">
                    {item.Entreprenuer.Business.BusinessSector.name}
                  </td>
                  <td className="py-3">{item.Entreprenuer.email}</td>
                  <td className="py-3">{item.Entreprenuer.phone}</td>
                  <td className="py-3">
                    <Link
                      href={`/businessDetails/${item.Entreprenuer.Business.uuid}`}
                      className="py-2 px-4 text-primary font-bold  hover:text-opacity-80 transition-all duration-300 rounded"
                    >
                      View profile
                    </Link>
                  </td>
                  <td className="py-3">
                    <Link
                      href={`/addEntreprenuerReport/${item.Entreprenuer.uuid}`}
                      className="py-2 px-4 bg-primary text-white hover:bg-opacity-90 transition-all duration-300 rounded"
                    >
                      Submit report
                    </Link>
                  </td>
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

export default MentorEntreprenuer;
