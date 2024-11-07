"use client";
import { useContext, useEffect, useState } from "react";
import {
  getAllUsers,
  getEnterprenuers,
  getMentorEntreprenuers,
  getMentors,
} from "../../../../controllers/user_controller";
import { timeAgo } from "../../../../utils/time_ago";
import Link from "next/link";
import Loader from "@/components/common/Loader";
import NoData from "@/app/component/noData";
import Image from "next/image";
import toast from "react-hot-toast";
import {
  assignEntreprenuerToMentor,
  unassignEntreprenuerToMentor,
} from "../../../../controllers/mentorEntreprenuerController";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";

const Page = ({ params }) => {
  const [users, setUsers] = useState([]);
  const uuid = params.uuid;
  const [ShowOptions, setShowOptions] = useState(false);
  const [total, settotal] = useState(0);
  const [limit, setlimit] = useState(12);
  const [currentPage, setcurrentPage] = useState(1);
  const [selectedItem, setselectedItem] = useState(null);
  const [totalPages, settotalPages] = useState(1);
  const [loading, setloading] = useState(true);
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    getData();
  }, []);
  const getData = () => {
    getMentorEntreprenuers(uuid).then((response) => {
      const body = response.body;
      console.log(body);
      setUsers(body.data);
      settotal(body.count);
      setcurrentPage(body.page);
      settotalPages(body.totalPages);
      setloading(false);
    });
  };
  return loading ? (
    <Loader />
  ) : (
    <div className="">
      <Breadcrumb
        prevLink={`/mentors`}
        prevPage="Mentors"
        pageName="Assigned Entreprenuers"
      />
      <div>
        <div className="rounded-lg border-b border-stroke px-4 md:px-6 xl:px-12 bg-white shadow-default  dark:border-strokedark dark:bg-boxdark">
          <div className="flex justify-between py-6  ">
            <div className=" ">
              <h4 className="text-xl font-semibold text-black dark:text-white">
                Enterprenuers
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
              <table>
                <thead>
                  <tr>
                    <td>Sent</td>
                    <td>Username</td>
                    <td>Role</td>
                    <td>Phone</td>
                    <td>Email</td>
                  </tr>
                </thead>
                <tbody>
                  {users.map((item, key) => (
                    <tr key={key}>
                      <td>{timeAgo(item.createdAt)}</td>
                      <td>{item.name}</td>
                      <td>{item.role}</td>
                      <td>{item.phone}</td>
                      <td>{item.email}</td>
                      <td>
                        {" "}
                        {!item.isAssigned ? (
                          <button
                            onClick={() => {
                              const payload = {
                                mentor_uuid: uuid,
                                entreprenuer_uuid: item.uuid,
                              };
                              assignEntreprenuerToMentor(payload).then(
                                (res) => {
                                  getData();
                                  toast.success("Assigned successfully");
                                }
                              );
                            }}
                            className="py-3 px-4 bg-primary w-52 cursor-pointer text-white rounded"
                          >
                            Assign Enterprenuers
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              unassignEntreprenuerToMentor(
                                item.mentorEntreprenuerUUID
                              ).then((res) => {
                                getData();
                                toast.success("Unassigned successfully");
                              });
                            }}
                            className="py-3 px-4 bg-danger w-52 bg-opacity-20 text-danger font-bold cursor-pointer  rounded"
                          >
                            Unassign Enterprenuer
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* <div className="grid grid-cols-6 border-t border-stroke py-4.5 px-4 dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5">
                <div className="col-span-1 flex items-center">
                  <p className="font-medium">Sent </p>
                </div>
                <div className="col-span-1 hidden items-center sm:flex">
                  <p className="font-medium">Username</p>
                </div>
                <div className="col-span-1 flex items-center">
                  <p className="font-medium">Role</p>
                </div>
                <div className="col-span-1 flex items-center">
                  <p className="font-medium">Phone</p>
                </div>
                <div className="col-span-2 flex items-center">
                  <p className="font-medium">Email</p>
                </div>
                <div className="col-span-1 flex items-center"></div>
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
                  <div className="col-span-1 flex items-center">
                    <p className="text-sm text-black dark:text-white">
                      {item.phone}
                    </p>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <p className="text-sm text-black dark:text-white">
                      {item.email}
                    </p>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <div
                      onClick={() => {
                        const data = {
                          to: item.uuid,
                          type: "userToUser",
                          lastMessage: "",
                        };
                        createConversation(data).then((data) => {
                          router.push(`/mentor-enterprenuer/${data.uuid}`);
                        });
                      }}
                      className="py-3 px-4 bg-primary cursor-pointer text-white rounded"
                    >
                      Assign Enterprenuers
                    </div>
                  </div>
                </div>
              ))} */}
            </div>
          )}
          <div className="flex  py-8 justify-between">
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
