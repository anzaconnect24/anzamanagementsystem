"use client";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "../../layout";
import Loader from "@/components/common/Loader";
import { timeAgo } from "@/app/utils/time_ago";
import {
  getUnapprovedMentorEntreprenuers,
  updateMentorEntreprenuer,
} from "@/app/controllers/mentorEntreprenuerController";
import Link from "next/link";
import toast from "react-hot-toast";
import NoData from "@/app/component/noData";

const MentorEntreprenuer = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approving, setapproving] = useState(false);
  const [keyword, setKeyword] = useState("");
  const { userDetails } = useContext(UserContext);
  useEffect(() => {
    getData();
  }, []);
  const getData = () => {
    getUnapprovedMentorEntreprenuers().then((res) => {
      console.log(res);
      setData(res);
      setLoading(false);
    });
  };
  return loading ? (
    <Loader />
  ) : (
    <div className="bg-white py-6 shadow mt-6 px-6 ">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Mentorship requests</h1>
        <input
          onChange={(e) => {
            setKeyword(e.target.value);
          }}
          className="py-1 rounded border-bodydark border-opacity-40 "
          placeholder="Search here"
        />
      </div>
      {data.length < 1 ? (
        <NoData />
      ) : (
        <table className="mt-8">
          <thead>
            <tr>
              <th>Assigned</th>
              <th>Mentor</th>
              <th>Company</th>
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
                  <tr key={item.uuid}>
                    <td className="py-3">{timeAgo(item.createdAt)}</td>
                    <td className="py-3">{item.Mentor.name}</td>
                    <td className="py-3">{item.Entreprenuer.Business.name}</td>

                    <td className="py-3">{item.Entreprenuer.email}</td>
                    <td className="py-3">{item.Entreprenuer.phone}</td>
                    <td className="py-3">
                      <Link
                        href={`/businessDetails/${item.Entreprenuer.Business.uuid}`}
                        className="py-2 px-4 text-primary font-bold  hover:text-opacity-80 transition-all duration-300 rounded"
                      >
                        Business details
                      </Link>
                    </td>
                    {item.approved ? (
                      <td className="py-3">
                        <Link
                          href={`/addEntreprenuerReport/${item.Entreprenuer.uuid}`}
                          className="py-2 px-4 bg-primary text-white hover:bg-opacity-90 transition-all duration-300 rounded"
                        >
                          Submit report
                        </Link>
                      </td>
                    ) : (
                      <td className="py-3">
                        <button
                          onClick={() => {
                            setapproving(true);
                            updateMentorEntreprenuer(item.uuid, {
                              approved: true,
                            }).then((res) => {
                              setapproving(false);
                              getData();
                              toast.success("Mentor approved successfully");
                            });
                          }}
                          className="py-2 px-4 bg-primary text-white hover:bg-opacity-90 transition-all duration-300 rounded"
                        >
                          {approving
                            ? "approving..."
                            : "Approve Mentor Request"}
                        </button>
                      </td>
                    )}
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

export default MentorEntreprenuer;
