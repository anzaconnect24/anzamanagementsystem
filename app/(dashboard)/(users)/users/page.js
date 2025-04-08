"use client";
import { useEffect, useState } from "react";
import { deleteUser, getAllUsers, inviteUser, updateUser } from "../../../controllers/user_controller";
import { timeAgo } from "../../../utils/time_ago";
import Loader from "@/components/common/Loader";
import toast from "react-hot-toast";
import NoData from "@/app/component/noData";
import Spinner from "@/components/spinner";

const Page = () => {
  const [users, setUsers] = useState([]);
  const [loading, setloading] = useState(true);
  const [total, settotal] = useState(0);
  const [limit, setlimit] = useState(20);
  const [currentPage, setcurrentPage] = useState(1);
  const [selectedItem, setselectedItem] = useState(null);
  const [totalPages, settotalPages] = useState(1);
  const [activating, setactivating] = useState(false);
  const [deleting, setdeleting] = useState(false);
  const [inviting, setinviting] = useState(false);
  const [showInvitationForm, setshowInvitationForm] = useState(false);
  const [adminCount, setadminCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");

  useEffect(() => {
    getAllUsers(limit, currentPage).then((body) => {
      setadminCount(body.adminCount);
      settotal(body.count);
      setcurrentPage(body.page);
      settotalPages(body.totalPages);
      setUsers(body.data);
      setloading(false);
    });
  }, [limit, currentPage]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === "" || 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  return loading ? (
    <Loader />
  ) : (
    <div className="container mx-auto px-4">
      <div className="rounded-xl border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        {/* Header Section */}
        <div className="p-6 border-b border-stroke dark:border-strokedark">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h4 className="text-xl font-semibold text-black dark:text-white flex items-center gap-2">
              System Users
              <span className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-full">
                {total} users
              </span>
            </h4>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-3 md:items-center">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full md:w-64 rounded-lg border border-stroke bg-transparent py-2 pl-10 pr-4 outline-none focus:border-primary dark:border-strokedark"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2">
                  <svg className="fill-body h-4 w-4 dark:fill-bodydark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </span>
              </div>

              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="rounded-lg border-stroke bg-transparent px-3 py-2 outline-none focus:border-primary dark:border-strokedark"
              >
                <option value="all">All Roles</option>
                <option value="Admins">Admins</option>
                <option value="Staff">Staff</option>
                <option value="Investor">Investor</option>
                <option value="Mentor">Mentor</option>
                <option value="Enterprenuer">Entrepreneur</option>
                <option value="Reviewer">Reviewer</option>
              </select>

              <button
                onClick={() => setshowInvitationForm(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-white hover:bg-opacity-90"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Invite User
              </button>
            </div>
          </div>
        </div>

        {/* Invitation Form Modal */}
        {showInvitationForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-boxdark rounded-xl shadow-lg w-full max-w-md mx-4">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">Invite New User</h3>
                  <button
                    onClick={() => setshowInvitationForm(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setinviting(true);
                    inviteUser({ email: e.target.email.value }).then(() => {
                      setinviting(false);
                      toast.success("Invitation sent successfully");
                      setshowInvitationForm(false);
                    });
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium mb-2">Email Address</label>
                    <input
                      name="email"
                      type="email"
                      required
                      className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
                      placeholder="user@example.com"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-primary py-2 px-4 font-medium text-white hover:bg-opacity-90 flex items-center justify-center"
                    disabled={inviting}
                  >
                    {inviting ? <Spinner /> : "Send Invitation"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {filteredUsers.length === 0 ? (
          <NoData />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b border-stroke dark:border-strokedark bg-gray-50 dark:bg-meta-4">
                  <th className="py-4 px-4 text-left font-medium">User</th>
                  <th className="py-4 px-4 text-left font-medium">Role</th>
                  <th className="py-4 px-4 text-left font-medium">Email</th>
                  <th className="py-4 px-4 text-left font-medium">Status</th>
                  <th className="py-4 px-4 text-left font-medium">Joined</th>
                  <th className="py-4 px-4 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr
                    key={index}
                    className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          {user.image ? (
                            <img
                              src={user.image}
                              alt={user.name}
                              className="h-10 w-10 rounded-full object-cover border-2 border-gray-200 dark:border-boxdark"
                              onError={(e) => {
                                e.target.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(user.name) + "&background=6366f1&color=fff";
                              }}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-lg font-semibold text-primary">
                                {user.name ? user.name.charAt(0).toUpperCase() : "?"}
                              </span>
                            </div>
                          )}
                        </div>
                        <div>
                          <h5 className="font-medium text-black dark:text-white">
                            {user.name}
                          </h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {timeAgo(user.createdAt)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          user.role === "Admin" ? "bg-primary" :
                          user.role === "Staff" ? "bg-success" :
                          user.role === "Mentor" ? "bg-warning" :
                          "bg-gray-400"
                        }`}></div>
                        <select
                          disabled={["Investor", "Enterprenuer"].includes(user.role)}
                          onChange={(e) => {
                            if (["Investor", "Enterprenuer"].includes(e.target.value)) {
                              toast.error("Sorry! You can't change user to this role");
                              e.target.value = user.role;
                            } else if (e.target.value === "Admin" && adminCount > 2) {
                              toast.error("You have reached maximum number of admins");
                              e.target.value = user.role;
                            } else {
                              updateUser({ role: e.target.value }, user.uuid).then(() => {
                                toast.success("Role updated successfully");
                                getAllUsers(limit, currentPage).then((body) => {
                                  setUsers(body.data);
                                  setadminCount(body.adminCount);
                                });
                              });
                            }
                          }}
                          className="w-full rounded-lg border-stroke bg-transparent px-3 py-1 outline-none focus:border-primary dark:border-strokedark"
                          defaultValue={user.role}
                        >
                          <option value="Admin">Admin</option>
                          <option value="Staff">Staff</option>
                          <option value="Investor">Investor</option>
                          <option value="Mentor">Mentor</option>
                          <option value="Enterprenuer">Entrepreneur</option>
                          <option value="Reviewer">Reviewer</option>
                        </select>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm font-medium text-black dark:text-white">
                          {user.email}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => {
                          setselectedItem(index);
                          setactivating(true);
                          updateUser(
                            { activated: !user.activated },
                            user.uuid
                          ).then(() => {
                            getAllUsers(limit, currentPage).then((body) => {
                              setUsers(body.data);
                            });
                            setactivating(false);
                            toast.success(
                              user.activated
                                ? "User deactivated successfully"
                                : "User activated successfully"
                            );
                          });
                        }}
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
                          user.activated
                            ? "bg-success/10 text-success"
                            : "bg-danger/10 text-danger"
                        }`}
                      >
                        {activating && selectedItem === index ? (
                          <Spinner />
                        ) : (
                          <>
                            <span className={`h-2 w-2 rounded-full ${
                              user.activated ? "bg-success" : "bg-danger"
                            }`}></span>
                            {user.activated ? "Active" : "Inactive"}
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (user.role === "Admin") {
                              toast.error("You can't delete an admin");
                              return;
                            }
                            setselectedItem(index);
                            setdeleting(true);
                            deleteUser(user.uuid).then(() => {
                              getAllUsers(limit, currentPage).then((body) => {
                                setUsers(body.data);
                                settotal(body.count);
                              });
                              setdeleting(false);
                              toast.success("User deleted successfully");
                            });
                          }}
                          className="inline-flex items-center gap-2 rounded-lg border border-danger px-3 py-1 text-sm font-medium text-danger hover:bg-danger hover:text-white transition-colors"
                        >
                          {deleting && selectedItem === index ? (
                            <Spinner />
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="p-6 border-t border-stroke dark:border-strokedark">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Show</span>
              <select
                value={limit}
                onChange={(e) => setlimit(Number(e.target.value))}
                className="rounded-lg border-stroke bg-transparent px-3 py-1 outline-none focus:border-primary dark:border-strokedark"
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
              <span className="text-sm text-gray-600 dark:text-gray-400">entries</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => currentPage > 1 && setcurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`inline-flex items-center justify-center rounded-lg border border-stroke px-4 py-2 text-sm font-medium transition-colors
                    ${currentPage === 1
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-primary hover:text-white dark:hover:bg-primary'
                    }`}
                >
                  Previous
                </button>
                <button
                  onClick={() => currentPage < totalPages && setcurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`inline-flex items-center justify-center rounded-lg border border-stroke px-4 py-2 text-sm font-medium transition-colors
                    ${currentPage === totalPages
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-primary hover:text-white dark:hover:bg-primary'
                    }`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
