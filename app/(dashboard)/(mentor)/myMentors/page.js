"use client";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "../../layout";
import Loader from "@/components/common/Loader";
import { timeAgo } from "@/app/utils/time_ago";
import {
  getMentorAssignedEntreprenuers,
  getEntreprenuerMentors,
} from "@/app/controllers/mentorEntreprenuerController";
import Link from "next/link";
import { createNotification } from "@/app/controllers/notification_controller";
import { createConversation } from "@/app/controllers/conversation_controller";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import NoData from "@/app/component/noData";

const MentorEntreprenuer = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const { userDetails } = useContext(UserContext);
  const router = useRouter();
  useEffect(() => {
    getEntreprenuerMentors(userDetails.uuid).then((res) => {
      setData(res);
      setLoading(false);
    });
  }, []);
  return loading ? (
    <Loader />
  ) : (
    <div className="bg-white py-6 shadow mt-6 px-6 ">
      <div className="flex justify-between">
        <h1 className="text-xl font-bold">My Mentors</h1>
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
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => {
              return (
                <tr key={item.uuid}>
                  <td className="py-3">{timeAgo(item.createdAt)}</td>
                  <td className="py-3">{item.Mentor.name}</td>

                  <td className="py-3">{item.Mentor.email}</td>
                  <td className="py-3">{item.Mentor.phone}</td>
                  <td className="py-3">
                    <button
                      onClick={() => {
                        const data = {
                          to: item.Mentor.uuid,
                          type: "userToUser",
                          lastMessage: "",
                        };
                        toast.success(
                          "Enabling end-to-end encryption. Please wait..."
                        );
                        createNotification({
                          user_uuid: item.Mentor.uuid,
                          to: "User",
                          message: `You have a new message`,
                        });
                        createConversation(data).then((data) => {
                          router.push(`/messages/${data.uuid}`);
                        });
                      }}
                      className="py-2 px-4 text-primary font-bold  hover:text-opacity-80 transition-all duration-300 rounded"
                    >
                      Send Message
                    </button>
                  </td>

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
