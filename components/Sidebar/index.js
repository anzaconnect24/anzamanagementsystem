import React, { useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { UserContext } from "@/app/(dashboard)/layout";

// Icons
import { MdOutlineDashboard, MdBusinessCenter } from "react-icons/md";
import { TbLogout } from "react-icons/tb";
import { SlPeople } from "react-icons/sl";
const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const pathname = usePathname();
  const { userDetails } = useContext(UserContext);
  const trigger = useRef(null);
  const sidebar = useRef(null);

  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);

  // Close on click outside
  useEffect(() => {
    const clickHandler = ({ target }) => {
      if (!sidebar.current || !trigger.current) return;
      if (
        !sidebarOpen ||
        sidebar.current.contains(target) ||
        trigger.current.contains(target)
      )
        return;
      setSidebarOpen(false);
    };
    document.addEventListener("click", clickHandler);
    return () => document.removeEventListener("click", clickHandler);
  });

  // Close if the esc key is pressed
  useEffect(() => {
    const keyHandler = ({ keyCode }) => {
      if (!sidebarOpen || keyCode !== 27) return;
      setSidebarOpen(false);
    };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  });

  useEffect(() => {
    localStorage.setItem("sidebar-expanded", sidebarExpanded.toString());
    if (sidebarExpanded) {
      document.querySelector("body")?.classList.add("sidebar-expanded");
    } else {
      document.querySelector("body")?.classList.remove("sidebar-expanded");
    }
  }, [sidebarExpanded]);

  // Menu categories based on user role
  const getMenuCategories = () => {
    const categories = [];
    const role = userDetails.role;

    // Dashboard - For all roles
    categories.push({
      id: "dashboard",
      title: "Dashboard",
      items: [
        {
          name: "Dashboard",
          path: "/",
          icon: <MdOutlineDashboard className="text-xl" />,
          roles: ["Admin", "Enterprenuer", "Investor", "Mentor", "Reviewer", "Staff"]
        }
      ]
    });

    // People - Different based on roles
    const peopleItems = [];
    
    if (["Admin"].includes(role)) {
      peopleItems.push(
        {
          name: "Users",
          path: "/users",
          icon: <SlPeople className="text-xl" />,
          submenu: [
            { name: "All Users", path: "/users" },
            { name: "Entrepreneurs", path: "/enterprenuers" },
            { name: "Investors", path: "/investors" },
            { name: "Mentors", path: "/mentors" },
            { name: "Staff", path: "/reviewers" },
            { name: "Admins", path: "/admins" }
          ]
        }
      );
    }
    
    if (["Mentor"].includes(role)) {
      peopleItems.push({
        name: "Mentees",
        path: "/mentorEntreprenuers",
        icon: <SlPeople className="text-xl" />
      });
    }
    
    if (["Enterprenuer"].includes(role)) {
      peopleItems.push({
        name: "Mentors",
        path: "/myMentors",
        icon: <FaUserTie className="text-xl" />,
        submenu: [
          { name: "My Mentors", path: "/myMentors" },
          { name: "Mentor Reports", path: "/mentorReports" }
        ]
      });
    }
    
    if (["Investor", "Enterprenuer", "Staff", "Reviewer", "Mentor"].includes(role)) {
      peopleItems.push({
        name: "Entrepreneurs",
        path: "/enterprenuers",
        icon: <RiTeamLine className="text-xl" />
      });
    }
    
    if (["Enterprenuer", "Reviewer"].includes(role)) {
      peopleItems.push({
        name: "Investors",
        path: "/investors",
        icon: <RiMoneyDollarCircleLine className="text-xl" />
      });
    }
    
    if (["Investor"].includes(role)) {
      peopleItems.push({
        name: "Interested Entrepreneurs",
        path: "/interestedEnterprenuers",
        icon: <FaHandshake className="text-xl" />
      });
    }
    
    if (peopleItems.length > 0) {
      categories.push({
        id: "users",
        title: "Users",
        items: peopleItems
      });
    }

    // Business Operations
    const businessItems = [];
    
    if (["Investor"].includes(role)) {
      businessItems.push({
        name: "My Investment Requests",
        path: "/myInvestmentRequests",
        icon: <RiMoneyDollarCircleLine className="text-xl" />
      });
    }
    
    if (["Admin"].includes(role)) {
      businessItems.push({
        name: "Investment Requests",
        path: "/pendingRequests",
        icon: <RiMoneyDollarCircleLine className="text-xl" />,
        submenu: [
          { name: "Requests in Progress", path: "/pendingRequests" },
          { name: "Matched Requests", path: "/acceptedRequests" },
          { name: "Mismatched Requests", path: "/rejectedRequests" }
        ]
      });
      
      businessItems.push({
        name: "Applications",
        path: "/pendingApplications",
        icon: <BsCardChecklist className="text-xl" />,
        submenu: [
          { name: "Pending Applications", path: "/pendingApplications" },
          { name: "Approved Applications", path: "/approvedApplications" },
          { name: "Rejected Applications", path: "/rejectedApplications" }
        ]
      });
      
      businessItems.push({
        name: "Mentorship Requests",
        path: "/mentorshipRequests",
        icon: <FaQuestion className="text-lg" />
      });
    }
    
    if (["Reviewer"].includes(role)) {
      businessItems.push({
        name: "Assignments",
        path: "/reviewerAssignedInvestmentRequests",
        icon: <BsCalendar3 className="text-xl" />,
        submenu: [
          { name: "Investment Requests", path: "/reviewerAssignedInvestmentRequests" },
          { name: "Business Assignments", path: "/businessAssignments" },
          { name: "Program Assignments", path: "/programAssignments" }
        ]
      });
    }
    
    if (businessItems.length > 0) {
      categories.push({
        id: "business",
        title: "Business Operations",
        items: businessItems
      });
    }

    // Programs & Resources
    const programsItems = [];
    
    if (["Admin", "Enterprenuer"].includes(role)) {
      programsItems.push({
        name: "Programs",
        path: "/bfa",
        icon: <MdBusinessCenter className="text-xl" />,
        submenu: [
          { name: "Business Foundation Accelerator", path: "/bfa" },
          { name: "Investment Readiness Accelerator", path: "/ira" },
          { name: "Consultancy Programs", path: "/consultance" }
        ]
      });
    }
    
    if (["Mentor", "Admin"].includes(role)) {
      programsItems.push({
        name: "Mentor Reports",
        path: "/mentorReports",
        icon: <FaWpforms className="text-xl" />
      });
    }
    
    if (["Admin", "Enterprenuer", "Reviewer", "Mentor"].includes(role)) {
      programsItems.push({
        name: "Resources Library",
        path: "/videos",
        icon: <IoDocumentTextOutline className="text-xl" />,
        submenu: [
          { name: "Videos", path: "/videos" },
          { name: "Documents", path: "/documents" }
        ]
      });
    }
    
    if (["Admin", "Enterprenuer"].includes(role)) {
      programsItems.push({
        name: "Success Stories",
        path: "/successStories",
        icon: <FaRegLightbulb className="text-xl" />
      });
    }
    
    if (programsItems.length > 0) {
      categories.push({
        id: "programs",
        title: "Programs & Resources",
        items: programsItems
      });
    }

    // Communication - For all roles
    if (["Enterprenuer", "Investor", "Staff", "Reviewer", "Mentor", "Admin"].includes(role)) {
      categories.push({
        id: "communication",
        title: "Communication",
        items: [
          {
            name: "Chats",
            path: "/conversations",
            icon: <BiMessageDetail className="text-xl" />
          }
        ]
      });
    }

    return categories;
  };

  const menuCategories = getMenuCategories();

  return (
    <aside
      ref={sidebar}
      className={`absolute z-9 left-0 top-0 flex h-screen w-72 flex-col overflow-y-hidden bg-gradient-to-b from-slate-800 to-slate-900 duration-300 ease-in-out lg:static lg:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* SIDEBAR HEADER */}
      <div className="flex items-center justify-between gap-2 px-6 py-5 border-b border-slate-700/50">
        <Link href="/" className="flex items-center">
          <Image width={120} height={10} src={"/logo.png"} alt="Logo" className="h-9 w-auto" />
        </Link>

        <button
          ref={trigger}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-controls="sidebar"
          aria-expanded={sidebarOpen}
          className="block lg:hidden text-slate-300 hover:text-white"
        >
          <svg
            className="fill-current"
            width="20"
            height="18"
            viewBox="0 0 20 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M19 8.175H2.98748L9.36248 1.6875C9.69998 1.35 9.69998 0.825 9.36248 0.4875C9.02498 0.15 8.49998 0.15 8.16248 0.4875L0.399976 8.3625C0.0624756 8.7 0.0624756 9.225 0.399976 9.5625L8.16248 17.4375C8.31248 17.5875 8.53748 17.7 8.76248 17.7C8.98748 17.7 9.17498 17.625 9.36248 17.475C9.69998 17.1375 9.69998 16.6125 9.36248 16.275L3.02498 9.8625H19C19.45 9.8625 19.825 9.4875 19.825 9.0375C19.825 8.55 19.45 8.175 19 8.175Z"
              fill=""
            />
          </svg>
        </button>
      </div>

      {/* SIDEBAR CONTENT */}
      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
        <nav className="mt-3 px-4 py-2">
          {menuCategories.map((category) => (
            <div key={category.id} className="mb-6">
              <h3 className="mb-3 ml-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                {category.title}
            </h3>

              <ul className="mb-6 flex flex-col gap-1">
                {category.items.map((item) => {
                  if (item.submenu) {
                    // Item with submenu
                    return (
                    <SidebarLinkGroup
                        key={item.name}
                        activeCondition={pathname.includes(item.path)}
                    >
                        {(handleClick, open) => (
                          <React.Fragment>
                            <div
                              className={`group relative flex cursor-pointer items-center gap-2.5 rounded-lg py-2 px-4 font-medium text-slate-300 duration-300 ease-in-out hover:bg-slate-700 ${
                                pathname.includes(item.path) && "bg-slate-700/50 text-white"
                              }`}
                              onClick={() => {
                                handleClick();
                                sidebarExpanded ? null : setSidebarExpanded(true);
                              }}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke-width="1.5"
                                stroke="currentColor"
                                class="w-5 h-5"
                              >
                                <path
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z"
                                />
                              </svg>
                              Investment requests
                              <svg
                                className={`absolute right-4 top-1/2 -translate-y-1/2 fill-current text-slate-400 ${
                                  open && "rotate-180"
                                }`}
                                width="16"
                                height="16"
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  fillRule="evenodd"
                                  clipRule="evenodd"
                                  d="M4.41107 6.9107C4.73651 6.58527 5.26414 6.58527 5.58958 6.9107L10.0003 11.3214L14.4111 6.91071C14.7365 6.58527 15.2641 6.58527 15.5896 6.91071C15.915 7.23614 15.915 7.76378 15.5896 8.08922L10.5896 13.0892C10.2641 13.4147 9.73651 13.4147 9.41107 13.0892L4.41107 8.08922C4.08563 7.76378 4.08563 7.23614 4.41107 6.9107Z"
                                  fill=""
                                />
                              </svg>
                            </div>

                            <div
                              className={`mt-1 overflow-hidden rounded-md bg-slate-800/40 duration-300 ${
                                !open && "hidden"
                              }`}
                            >
                              <ul className="mt-4 mb-5.5 flex flex-col gap-2.5 pl-6">
                                <li>
                                  <Link
                                    href="/users"
                                    className={`first-letter:group relative flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ${
                                      pathname === "/users" && "text-white"
                                    }`}
                                  >
                                    All users
                                  </Link>
                                </li>
                                <li>
                                  <Link
                                    href="/enterprenuers"
                                    className={`first-letter:group relative flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ${
                                      pathname === "/enterprenuers" &&
                                      "text-white"
                                    }`}
                                  >
                                    Entrepreneurs
                                  </Link>
                                </li>
                                <li>
                                  <Link
                                    href="/investors"
                                    className={`group relative flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ${
                                      pathname === "/investors" && "text-white"
                                    }`}
                                  >
                                    Investors
                                  </Link>
                                </li>
                                <li>
                                  <Link
                                    href="/mentors"
                                    className={`group relative flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ${
                                      pathname === "/investors" && "text-white"
                                    }`}
                                  >
                                    Mentors
                                  </Link>
                                </li>
                                <li>
                                  <Link
                                    href="/reviewers"
                                    className={`group relative flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ${
                                      pathname === "/reviewers" && "text-white"
                                    }`}
                                  >
                                    Reviewers
                                  </Link>
                                </li>
                                <li>
                                  <Link
                                    href="/admins"
                                    className={`group relative flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ${
                                      pathname === "/admins" && "text-white"
                                    }`}
                                  >
                                    Admins
                                  </Link>
                                </li>
                              </ul>
                            </div>
                            {/* <!-- Dropdown Menu End --> */}
                          </React.Fragment>
                        );
                      }}
                    </SidebarLinkGroup>
                  )}
                  {["Investor"].includes(userDetails.role) == true && (
                    <li>
                      <Link
                        href="/myInvestmentRequests"
                        className={`group relative flex items-center gap-2.5 rounded-lg py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${
                          pathname.includes("myInvestmentRequests") &&
                          "bg-primary dark:bg-primary"
                        }`}
                      >
                        <svg
                          className="fill-current"
                          width="18"
                          height="19"
                          viewBox="0 0 18 19"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <g clipPath="url(#clip0_130_9756)">
                            <path
                              d="M15.7501 0.55835H2.2501C1.29385 0.55835 0.506348 1.34585 0.506348 2.3021V15.8021C0.506348 16.7584 1.29385 17.574 2.27822 17.574H15.7782C16.7345 17.574 17.5501 16.7865 17.5501 15.8021V2.3021C17.522 1.34585 16.7063 0.55835 15.7501 0.55835ZM6.69385 10.599V6.4646H11.3063V10.5709H6.69385V10.599ZM11.3063 11.8646V16.3083H6.69385V11.8646H11.3063ZM1.77197 6.4646H5.45635V10.5709H1.77197V6.4646ZM12.572 6.4646H16.2563V10.5709H12.572V6.4646ZM2.2501 1.82397H15.7501C16.0313 1.82397 16.2563 2.04897 16.2563 2.33022V5.2271H1.77197V2.3021C1.77197 2.02085 1.96885 1.82397 2.2501 1.82397ZM1.77197 15.8021V11.8646H5.45635V16.3083H2.2501C1.96885 16.3083 1.77197 16.0834 1.77197 15.8021ZM15.7501 16.3083H12.572V11.8646H16.2563V15.8021C16.2563 16.0834 16.0313 16.3083 15.7501 16.3083Z"
                              fill=""
                            />
                          </g>
                          <defs>
                            <clipPath id="clip0_130_9756">
                              <rect
                                width="18"
                                height="18"
                                fill="white"
                                transform="translate(0 0.052124)"
                              />
                            </clipPath>
                          </defs>
                        </svg>
                        My investment requests
                      </Link>
                    </li>
                  )}
                  {[
                    "Investor",
                    "Enterprenuer",
                    "Staff",
                    "Reviewer",
                    "Mentor",
                  ].includes(userDetails.role) == true && (
                    <li>
                      <Link
                        href="/enterprenuers"
                        className={`group relative flex items-center gap-2.5 rounded-lg py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${
                          pathname.includes("enterprenuers") &&
                          "bg-primary dark:bg-primary"
                        }`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke-width="1.5"
                          stroke="currentColor"
                          class="w-5 h-5"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                          />
                        </svg>
                        Entrepreneurs
                      </Link>
                    </li>
                  )}
                  {["Investor"].includes(userDetails.role) == true && (
                    <li>
                      <Link
                        href="/interestedEnterprenuers"
                        className={`group relative flex items-center gap-2.5 rounded-lg py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${
                          pathname.includes("interestedEnterprenuers") &&
                          "bg-primary dark:bg-primary"
                        }`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke-width="1.5"
                          stroke="currentColor"
                          class="w-5 h-5"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z"
                          />
                        </svg>
                        Interested Entrepreneurs
                      </Link>
                    </li>
                  )}
                  {["Admin"].includes(userDetails.role) == true && (
                    <div>
                      <SidebarLinkGroup
                        activeCondition={
                          pathname === "/forms" || pathname.includes("forms")
                        }
                      >
                        {(handleClick, open) => {
                          return (
                            <React.Fragment>
                              <Link
                                href="#"
                                className={`group relative flex items-center gap-2.5 rounded-lg py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${
                                  (pathname === "/forms" ||
                                    pathname.includes("forms")) &&
                                  "bg-primary dark:bg-primary"
                                }`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  sidebarExpanded
                                    ? handleClick()
                                    : setSidebarExpanded(true);
                                }}
                              >
                                <ApplicationIcon />
                                Applications
                                <svg
                                  className={`absolute z-9 right-4 top-1/2 -translate-y-1/2 fill-current ${
                                    open && "rotate-180"
                                  }`}
                                  width="20"
                                  height="20"
                                  viewBox="0 0 20 20"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M4.41107 6.9107C4.73651 6.58527 5.26414 6.58527 5.58958 6.9107L10.0003 11.3214L14.4111 6.91071C14.7365 6.58527 15.2641 6.58527 15.5896 6.91071C15.915 7.23614 15.915 7.76378 15.5896 8.08922L10.5896 13.0892C10.2641 13.4147 9.73651 13.4147 9.41107 13.0892L4.41107 8.08922C4.08563 7.76378 4.08563 7.23614 4.41107 6.9107Z"
                                    fill=""
                                  />
                                </svg>
                              </Link>
                              {/* <!-- Dropdown Menu Start --> */}
                              <div
                                className={`translate transform overflow-hidden ${
                                  !open && "hidden"
                                }`}
                              >
                                <ul className="mt-4 mb-5.5 flex flex-col gap-2.5 pl-6">
                                  {["Admin"].includes(userDetails.role) && (
                                    <li>
                                      <Link
                                        href="/pendingApplications"
                                        className={`first-letter:group relative flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ${
                                          pathname === "/forms/form-elements" &&
                                          "text-white"
                                        }`}
                                      >
                                        Pending applications
                                      </Link>
                                    </li>
                                  )}

                                  <li>
                                    <Link
                                      href={subItem.path}
                                      className={`flex items-center py-2 px-4 rounded-md text-sm text-slate-400 hover:bg-slate-700/50 hover:text-white ${
                                        pathname === subItem.path && "bg-slate-700/50 text-white"
                                      }`}
                                    >
                                      <span className="ml-4">{subItem.name}</span>
                                    </Link>
                                  </li>
                                ))}
                                </ul>
                              </div>
                            </React.Fragment>
                        )}
                      </SidebarLinkGroup>
                    </div>
                  )}
                  {["Mentor", "Enterprenuer", "Admin"].includes(
                    userDetails.role
                  ) == true && (
                    <Link
                      href="/mentorReports"
                      className={`group relative flex items-center gap-2.5 rounded-lg py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${
                        pathname == "/mentorReports" &&
                        "bg-primary dark:bg-primary"
                      }`}
                    >
                      <FaWpforms className="text-xl" />
                      Mentor Reports
                    </Link>
                  )}
                  {["Admin"].includes(userDetails.role) == true && (
                    <Link
                      href="/mentorshipRequests"
                      className={`group relative flex items-center gap-2.5 rounded-lg py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${
                        pathname == "/mentorReports" &&
                        "bg-primary dark:bg-primary"
                      }`}
                    >
                      <FaQuestion className="text-lg" />
                      Mentorship requests
                    </Link>
                  )}
                  {["Admin", "Enterprenuer"].includes(userDetails.role) ==
                    true && (
                    <div>
                      <SidebarLinkGroup
                        activeCondition={
                          pathname === "/forms" || pathname.includes("forms")
                        }
                      >
                        {(handleClick, open) => {
                          return (
                            <React.Fragment>
                              <Link
                                href="#"
                                className={`group relative flex items-center gap-2.5 rounded-lg py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${
                                  (pathname === "/forms" ||
                                    pathname.includes("forms")) &&
                                  "bg-primary dark:bg-primary"
                                }`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  sidebarExpanded
                                    ? handleClick()
                                    : setSidebarExpanded(true);
                                }}
                              >
                                <svg
                                  className="fill-current"
                                  width="18"
                                  height="18"
                                  viewBox="0 0 18 18"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M15.7499 2.9812H14.2874V2.36245C14.2874 2.02495 14.0062 1.71558 13.6405 1.71558C13.2749 1.71558 12.9937 1.99683 12.9937 2.36245V2.9812H4.97803V2.36245C4.97803 2.02495 4.69678 1.71558 4.33115 1.71558C3.96553 1.71558 3.68428 1.99683 3.68428 2.36245V2.9812H2.2499C1.29365 2.9812 0.478027 3.7687 0.478027 4.75308V14.5406C0.478027 15.4968 1.26553 16.3125 2.2499 16.3125H15.7499C16.7062 16.3125 17.5218 15.525 17.5218 14.5406V4.72495C17.5218 3.7687 16.7062 2.9812 15.7499 2.9812ZM1.77178 8.21245H4.1624V10.9968H1.77178V8.21245ZM5.42803 8.21245H8.38115V10.9968H5.42803V8.21245ZM8.38115 12.2625V15.0187H5.42803V12.2625H8.38115ZM9.64678 12.2625H12.5999V15.0187H9.64678V12.2625ZM9.64678 10.9968V8.21245H12.5999V10.9968H9.64678ZM13.8374 8.21245H16.228V10.9968H13.8374V8.21245ZM2.2499 4.24683H3.7124V4.83745C3.7124 5.17495 3.99365 5.48433 4.35928 5.48433C4.7249 5.48433 5.00615 5.20308 5.00615 4.83745V4.24683H13.0499V4.83745C13.0499 5.17495 13.3312 5.48433 13.6968 5.48433C14.0624 5.48433 14.3437 5.20308 14.3437 4.83745V4.24683H15.7499C16.0312 4.24683 16.2562 4.47183 16.2562 4.75308V6.94683H1.77178V4.75308C1.77178 4.47183 1.96865 4.24683 2.2499 4.24683ZM1.77178 14.5125V12.2343H4.1624V14.9906H2.2499C1.96865 15.0187 1.77178 14.7937 1.77178 14.5125ZM15.7499 15.0187H13.8374V12.2625H16.228V14.5406C16.2562 14.7937 16.0312 15.0187 15.7499 15.0187Z"
                                    fill=""
                                  />
                                </svg>
                                Programs
                                <svg
                                  className={`absolute z-9 right-4 top-1/2 -translate-y-1/2 fill-current ${
                                    open && "rotate-180"
                                  }`}
                                  width="20"
                                  height="20"
                                  viewBox="0 0 20 20"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M4.41107 6.9107C4.73651 6.58527 5.26414 6.58527 5.58958 6.9107L10.0003 11.3214L14.4111 6.91071C14.7365 6.58527 15.2641 6.58527 15.5896 6.91071C15.915 7.23614 15.915 7.76378 15.5896 8.08922L10.5896 13.0892C10.2641 13.4147 9.73651 13.4147 9.41107 13.0892L4.41107 8.08922C4.08563 7.76378 4.08563 7.23614 4.41107 6.9107Z"
                                    fill=""
                                  />
                                </svg>
                              </Link>
                              {/* <!-- Dropdown Menu Start --> */}
                              <div
                                className={`translate transform overflow-hidden ${
                                  !open && "hidden"
                                }`}
                              >
                                <ul className="mt-4 mb-5.5 flex flex-col gap-2.5 pl-6">
                                  <li>
                                    <Link
                                      href="/bfa"
                                      className={`first-letter:group relative flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ${
                                        pathname === "/bfa" && "text-white"
                                      }`}
                                    >
                                      Business foundation accelerator
                                    </Link>
                                  </li>

                                  <li>
                                    <Link
                                      href="/ira"
                                      className={`group relative flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ${
                                        pathname === "/ira" && "text-white"
                                      }`}
                                    >
                                      Investment Readiness Accelerator
                                    </Link>
                                  </li>
                                  <li>
                                    <Link
                                      href="/consultance"
                                      className={`group relative flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ${
                                        pathname === "/consultance" &&
                                        "text-white"
                                      }`}
                                    >
                                      Consultancy programs
                                    </Link>
                                  </li>
                                </ul>
                              </div>
                              {/* <!-- Dropdown Menu End --> */}
                            </React.Fragment>
                          );
                        }}
                      </SidebarLinkGroup>
                    </div>
                  )}
                </div>
              }
              {["Reviewer"].includes(userDetails.role) == true && (
                <div>
                  <SidebarLinkGroup
                    activeCondition={
                      pathname === "/forms" || pathname.includes("forms")
                    }
                  >
                    {(handleClick, open) => {
                      return (
                      <li key={item.name}>
                          <Link
                          href={item.path}
                          className={`group relative flex items-center gap-2.5 rounded-lg py-2 px-4 font-medium text-slate-300 duration-300 ease-in-out hover:bg-slate-700 ${
                            pathname === item.path && "bg-slate-700/50 text-white"
                                  }`}
                                >
                          {item.icon}
                          <span>{item.name}</span>
                                </Link>
                              </li>
                    );
                  }
                })}
                            </ul>
                          </div>
                          {/* <!-- Dropdown Menu End --> */}
                        </React.Fragment>
                      );
                    }}
                  </SidebarLinkGroup>
                </div>
              )}
              {["Enterprenuer", "Reviewer"].includes(userDetails.role) ==
                true && (
                <li>
                  <Link
                    href="/investors"
                    className={`group relative flex items-center gap-2.5 rounded-lg py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${
                      pathname.includes("investors") &&
                      "bg-primary dark:bg-primary"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.5"
                      stroke="currentColor"
                      class="w-5 h-5"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                      />
                    </svg>
                    Investors
                  </Link>
                </li>
              )}
              {[
                "Enterprenuer",
                "Investor",
                "Staff",
                "Reviewer",
                "Mentor",
                "Admin",
              ].includes(userDetails.role) == true && (
                <li>
                  <Link
                    href="/conversations"
                    className={`group relative flex items-center gap-2.5 rounded-lg py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${
                      pathname.includes("conversations") &&
                      "bg-primary dark:bg-primary"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.5"
                      stroke="currentColor"
                      class="w-5 h-5"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
                      />
                    </svg>
                    Chats
                  </Link>
                </li>
              )}
              {["Admin", "Enterprenuer"].includes(userDetails.role) == true && (
                <li>
                  <Link
                    href="/successStories"
                    className={`group relative flex items-center gap-2.5 rounded-lg py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${
                      pathname.includes("successStories") &&
                      "bg-primary dark:bg-primary"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.5"
                      stroke="currentColor"
                      class="w-5 h-5"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z"
                      />
                    </svg>
                    Success stories
                  </Link>
                </li>
              )}

              {/* {["Enterprenuer"].includes(item.role)==true&&}
              {["Admin"].includes(item.role)==true&&} */}

              {/* <!-- Menu Item Settings --> */}
            </ul>
          </div>

          {/* <!-- Others Group --> */}
          <div>
            <h3 className="mb-4 ml-4 text-sm font-semibold text-bodydark2">
              OTHERS
            </h3>

            <ul className="mb-6 flex flex-col gap-1.5">
              <SidebarLinkGroup
                activeCondition={
                  pathname === "/auth" || pathname.includes("auth")
                }
              >
                {(handleClick, open) => {
                  return (
                    <React.Fragment>
                      <Link
                        href="#"
                        className={`group relative flex items-center gap-2.5 rounded-lg py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${
                          (pathname === "/auth" || pathname.includes("auth")) &&
                          "bg-primary dark:bg-primary"
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          sidebarExpanded
                            ? handleClick()
                            : setSidebarExpanded(true);
                        }}
                      >
                        <TbLogout className="text-xl" />
                        Account
                        <div className="ms-auto pe-1 text-lg">
                          <IoChevronDownOutline />
                        </div>
                      </Link>
                      {/* <!-- Dropdown Menu Start --> */}
                      <div
                        className={`translate transform overflow-hidden ${
                          !open && "hidden"
                        }`}
                      >
                        <ul className="mt-4 mb-5.5 flex flex-col gap-2.5 pl-6">
                          {["Investor"].includes(userDetails.role) && (
                            <li>
                              <Link
                                href="/investorProfile"
                                className={`group relative flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ${
                                  pathname === "/businessInformations" &&
                                  "text-white"
                                }`}
                              >
                                Investor profile
                              </Link>
                            </li>
                          )}
                          {["Enterprenuer"].includes(userDetails.role) && (
                            <li>
                              <Link
                                href="/accountInformation"
                                className={`group relative flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ${
                                  pathname === "/businessInformations" &&
                                  "text-white"
                                }`}
                              >
                                Account details
                              </Link>
                            </li>
                          )}
                          {[
                            "Investor",
                            "Staff",
                            "Admin",
                            "Reviewer",
                            "Mentor",
                          ].includes(userDetails.role) && (
                            <li>
                              <Link
                                href="/accountDetails"
                                className={`group relative flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ${
                                  pathname === "/accountDetails" && "text-white"
                                }`}
                              >
                                Personal details
                              </Link>
                            </li>
                          )}
                          {["Staff", "Admin"].includes(userDetails.role) && (
                            <li>
                              <Link
                                href="/sectors"
                                className={`group relative flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ${
                                  pathname === "/accountDetails" && "text-white"
                                }`}
                              >
                                Business sectors
                              </Link>
                            </li>
                          )}
                          {["Staff", "Admin"].includes(userDetails.role) && (
                            <li>
                              <Link
                                href="/logs"
                                className={`group relative flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ${
                                  pathname === "/accountDetails" && "text-white"
                                }`}
                              >
                                Logs
                              </Link>
                            </li>
                          )}
                        </ul>
                      </div>
                      {/* <!-- Dropdown Menu End --> */}
                    </React.Fragment>
                  );
                }}
              </SidebarLinkGroup>
              {/* <!-- Menu Item Auth Pages --> */}
            </ul>
          </div>
        </nav>
      </div>

      {/* SIDEBAR FOOTER */}
      <div className="mt-auto border-t border-slate-700/50 p-4">
        <button className="flex w-full items-center gap-3.5 rounded-lg py-2 px-4 text-slate-300 hover:bg-slate-700 hover:text-white">
          <TbLogout className="text-xl" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;