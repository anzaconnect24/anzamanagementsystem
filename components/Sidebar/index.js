import React, { useContext, useEffect, useRef, useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { UserContext } from "@/app/(dashboard)/layout";
import SidebarLinkGroup from "./SidebarLinkGroup";

// Icons
import {
  MdOutlineDashboard,
  MdBusinessCenter,
  MdAssignment,
} from "react-icons/md";
import { TbLogout } from "react-icons/tb";
import { SlPeople } from "react-icons/sl";
import {
  FaUserTie,
  FaHandshake,
  FaQuestion,
  FaWpforms,
  FaRegLightbulb,
} from "react-icons/fa";
import { RiTeamLine, RiMoneyDollarCircleLine } from "react-icons/ri";
import { BsCalendar3, BsCardChecklist } from "react-icons/bs";
import { BiMessageDetail } from "react-icons/bi";
import { IoDocumentTextOutline, IoChevronDownOutline } from "react-icons/io5";

const Sidebar = ({
  sidebarOpen,
  setSidebarOpen,
  sidebarExpanded,
  setSidebarExpanded,
}) => {
  const pathname = usePathname();
  const { userDetails } = useContext(UserContext);
  const trigger = useRef(null);
  const sidebar = useRef(null);

  // Use the sidebarExpanded state from props if provided, otherwise use local state
  const [localSidebarExpanded, setLocalSidebarExpanded] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sidebar-expanded");
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  // Use props if provided, otherwise use local state
  const isExpanded =
    sidebarExpanded !== undefined ? sidebarExpanded : localSidebarExpanded;
  const setExpanded =
    setSidebarExpanded !== undefined
      ? setSidebarExpanded
      : setLocalSidebarExpanded;
  const [activeCategory, setActiveCategory] = useState(null);
  const [isHovered, setIsHovered] = useState(false);

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
    localStorage.setItem("sidebar-expanded", isExpanded.toString());
    if (isExpanded) {
      document.querySelector("body")?.classList.add("sidebar-expanded");
    } else {
      document.querySelector("body")?.classList.remove("sidebar-expanded");
    }
  }, [isExpanded]);

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
          roles: [
            "Admin",
            "Enterprenuer",
            "Investor",
            "Mentor",
            "Staff",
            "Staff",
          ],
        },
      ],
    });

    // People - Different based on roles
    const peopleItems = [];

    if (["Admin"].includes(role)) {
      peopleItems.push({
        name: "Users",
        path: "/users",
        icon: <SlPeople className="text-xl" />,
        submenu: [
          { name: "All Users", path: "/users" },
          { name: "Entrepreneurs", path: "/enterprenuers" },
          { name: "Investors", path: "/investors" },
          { name: "Mentors", path: "/mentors" },
          { name: "Staff", path: "/reviewers" },
          { name: "Admins", path: "/admins" },
        ],
      });
    }

    if (["Mentor"].includes(role)) {
      peopleItems.push({
        name: "Mentees",
        path: "/mentorEntreprenuers",
        icon: <SlPeople className="text-xl" />,
      });
    }

    if (["Enterprenuer"].includes(role)) {
      peopleItems.push({
        name: "Mentors",
        icon: <FaUserTie className="text-xl" />,
        submenu: [
          { name: "My Mentor", path: "/myMentors" },
          { name: "All Mentors", path: "/mentors" },
        ],
      });
    }

    if (
      ["Investor", "Enterprenuer", "Staff", "Staff", "Mentor"].includes(role)
    ) {
      peopleItems.push({
        name: "Entrepreneurs",
        path: "/enterprenuers",
        icon: <RiTeamLine className="text-xl" />,
      });
    }

    if (["Investor"].includes(role)) {
      peopleItems.push({
        name: "Interested Entrepreneurs",
        path: "/interestedEnterprenuers",
        icon: <FaHandshake className="text-xl" />,
      });
    }

    if (peopleItems.length > 0) {
      categories.push({
        id: "users",
        title: "Users",
        items: peopleItems,
      });
    }

    // Business Operations
    const businessItems = [];

    if (["Investor"].includes(role)) {
      businessItems.push({
        name: "My Investment Requests",
        path: "/myInvestmentRequests",
        icon: <RiMoneyDollarCircleLine className="text-xl" />,
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
          { name: "Mismatched Requests", path: "/rejectedRequests" },
        ],
      });

      businessItems.push({
        name: "Applications",
        path: "/pendingApplications",
        icon: <BsCardChecklist className="text-xl" />,
        submenu: [
          { name: "Pending Applications", path: "/pendingApplications" },
          { name: "Approved Applications", path: "/approvedApplications" },
          { name: "Rejected Applications", path: "/rejectedApplications" },
        ],
      });

      businessItems.push({
        name: "Mentorship Requests",
        path: "/mentorshipRequests",
        icon: <FaQuestion className="text-lg" />,
      });
    }

    if (["Staff"].includes(role)) {
      businessItems.push({
        name: "Assignments",
        path: "/reviewerAssignedInvestmentRequests",
        icon: <BsCalendar3 className="text-xl" />,
        submenu: [
          {
            name: "Investment Requests",
            path: "/reviewerAssignedInvestmentRequests",
          },
          { name: "Business Assignments", path: "/businessAssignments" },
          { name: "Program Assignments", path: "/programAssignments" },
        ],
      });
    }

    if (businessItems.length > 0) {
      categories.push({
        id: "business",
        title: "Business Operations",
        items: businessItems,
      });
    }

    // Funding Opportunities
    const investmentItems = [];

    if (["Admin", "Enterprenuer"].includes(role)) {
      investmentItems.push({
        name: "Funding Opportunities",
        path: "/opportunities",
        icon: <RiMoneyDollarCircleLine className="text-xl" />,
        submenu: [
          { name: "Investor Connection", path: "/investors" },
          { name: "Open calls for funding", path: "/opportunities" },
        ],
      });
    }

    if (investmentItems.length > 0) {
      categories.push({
        id: "investment",
        title: "Funding Opportunities",
        items: investmentItems,
      });
    }

    // Programs & Resources
    const programsItems = [];

    if (["Admin", "Enterprenuer"].includes(role)) {
      programsItems.push({
        name: "Programs Applications",
        icon: <MdBusinessCenter className="text-xl" />,
        path: "/programsApplications",
      });
    }

    if (["Enterprenuer"].includes(role)) {
      programsItems.push({
        name: "CRAT System",
        path: "/financialDomain",
        icon: <MdBusinessCenter className="text-xl" />,
        submenu: [
          { name: "Introduction", path: "/introduction" },
          { name: "Readiness", path: "/scoreReadiness" },
          { name: "Commercial Domain", path: "/marketDomain" },
          { name: "Financial Domain", path: "/financialDomain" },
          { name: "Operation Domain", path: "/operationsDomain" },
          { name: "Legal Domain", path: "/legalDomain" },
          { name: "CRAT Review", path: "/cratReview" },
          {
            name: "Report",
            path: "/report",
            submenu: [
              { name: "Initial Analysis", path: "/report" },
              { name: "Final Report", path: "/finalReport" },
            ],
          },
        ],
      });
    }

    if (["Staff"].includes(role)) {
      programsItems.push({
        name: "CRAT Reviews",
        path: "/cratReviews",
        icon: <MdAssignment className="text-xl" />,
      });
    }

    if (["Mentor", "Admin"].includes(role)) {
      programsItems.push({
        name: "Mentor Reports",
        path: "/mentorReports",
        icon: <FaWpforms className="text-xl" />,
      });
    }

    if (["Admin"].includes(role)) {
      programsItems.push({
        name: "CRAT Review Applications",
        path: "/cratReviewApplications",
        icon: <MdAssignment className="text-xl" />,
      });
    }

    if (["Admin", "Enterprenuer", "Staff", "Mentor"].includes(role)) {
      programsItems.push({
        name: "Learn & Grow",
        icon: <IoDocumentTextOutline className="text-xl" />,
        submenu: [
          { name: "General Resources", path: "/generalResources" },
          { name: "Class Rooms", path: "/classRooms" },
        ],
      });
    }

    if (["Admin", "Enterprenuer"].includes(role)) {
      programsItems.push({
        name: "Success Stories",
        path: "/successStories",
        icon: <FaRegLightbulb className="text-xl" />,
      });
    }

    if (programsItems.length > 0) {
      categories.push({
        id: "programs",
        title: "Programs & Resources",
        items: programsItems,
      });
    }

    // Communication - For all roles
    if (
      ["Enterprenuer", "Investor", "Staff", "Mentor", "Admin"].includes(role)
    ) {
      categories.push({
        id: "communication",
        title: "Communication",
        items: [
          {
            name: "Chats",
            path: "/conversations",
            icon: <BiMessageDetail className="text-xl" />,
          },
        ],
      });
    }

    return categories;
  };

  const menuCategories = getMenuCategories();

  // Check if sidebar should be visually expanded (hovered or permanently expanded)
  const isVisuallyExpanded = isHovered || isExpanded;

  return (
    <aside
      ref={sidebar}
      className={`absolute z-9 left-0 top-0 flex h-screen flex-col overflow-y-hidden bg-gradient-to-b from-slate-800 to-slate-900 duration-300 ease-in-out lg:static lg:translate-x-0 transition-all ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } ${isVisuallyExpanded ? "w-72" : "w-20"}`}
      onMouseEnter={() => {
        setIsHovered(true);
        setSidebarOpen(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
      }}
    >
      {/* SIDEBAR HEADER */}
      <div className="flex items-center justify-between gap-2 px-6 py-5 border-b border-slate-700/50">
        {isVisuallyExpanded ? (
          <Link href="/" className="flex items-center">
            <Image
              width={120}
              height={10}
              src={"/logo.png"}
              alt="Logo"
              className={`h-9 w-24 transition-all  duration-300 `}
            />
          </Link>
        ) : (
          <div className="h-9"></div>
        )}

        {/* Minimize/Expand Button */}
      </div>

      {/* SIDEBAR CONTENT */}
      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
        <nav className="mt-3 px-4 py-2">
          {menuCategories.map((category) => (
            <div key={category.id} className="mb-6">
              <h3 className="mb-3 ml-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                {isVisuallyExpanded && category.title}
              </h3>

              <ul className="mb-6 flex flex-col gap-1">
                {category.items.map((item) =>
                  item.submenu ? (
                    <SidebarLinkGroup
                      key={item.name}
                      activeCondition={pathname.includes(item.path)}
                    >
                      {(handleClick, open) => (
                        <React.Fragment>
                          <div
                            className={`group relative flex cursor-pointer items-center gap-2.5 rounded-lg py-2 px-4 font-medium text-slate-300 duration-300 ease-in-out hover:bg-slate-700 ${
                              pathname.includes(item.path) &&
                              "bg-slate-700/50 text-white"
                            }`}
                            onClick={() => {
                              handleClick();
                              // Don't auto-expand when clicking submenu items
                            }}
                          >
                            {item.icon}
                            {isVisuallyExpanded && (
                              <>
                                {item.name}
                                <svg
                                  className={`absolute right-4 top-1/2 -translate-y-1/2 fill-current text-slate-400 ${
                                    open ? "rotate-180" : ""
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
                              </>
                            )}
                          </div>

                          <div
                            className={`mt-1 overflow-hidden rounded-md bg-slate-800/40 duration-300 ${
                              !open && "hidden"
                            }`}
                          >
                            <ul
                              className={`mt-4 mb-5.5 flex flex-col gap-2.5 ${
                                isVisuallyExpanded ? "pl-6" : "pl-0"
                              }`}
                            >
                              {item.submenu.map((subItem) =>
                                subItem.submenu ? (
                                  <SidebarLinkGroup
                                    key={subItem.name}
                                    activeCondition={pathname.includes(
                                      subItem.path
                                    )}
                                  >
                                    {(handleSubClick, subOpen) => (
                                      <React.Fragment>
                                        <div
                                          className={`group relative flex cursor-pointer items-center gap-2.5 rounded-lg py-2 px-4 font-medium text-slate-400 duration-300 ease-in-out hover:bg-slate-700/50 hover:text-white ${
                                            pathname.includes(subItem.path) &&
                                            "bg-slate-700/50 text-white"
                                          }`}
                                          onClick={() => {
                                            handleSubClick();
                                          }}
                                        >
                                          {isVisuallyExpanded && (
                                            <>
                                              <span>{subItem.name}</span>
                                              <svg
                                                className={`absolute right-4 top-1/2 -translate-y-1/2 fill-current text-slate-400 ${
                                                  subOpen ? "rotate-180" : ""
                                                }`}
                                                width="12"
                                                height="12"
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
                                            </>
                                          )}
                                        </div>

                                        <div
                                          className={`mt-1 overflow-hidden rounded-md bg-slate-700/40 duration-300 ${
                                            !subOpen && "hidden"
                                          }`}
                                        >
                                          {isVisuallyExpanded && (
                                            <ul className="mt-2 mb-3 flex flex-col gap-1 pl-4">
                                              {subItem.submenu.map(
                                                (nestedItem) => (
                                                  <li key={nestedItem.name}>
                                                    <Link
                                                      href={nestedItem.path}
                                                      className={`flex items-center py-1 px-3 rounded-md text-xs text-slate-400 hover:bg-slate-600/50 hover:text-white ${
                                                        pathname ===
                                                          nestedItem.path &&
                                                        "bg-slate-600/50 text-white"
                                                      }`}
                                                    >
                                                      <span>
                                                        {nestedItem.name}
                                                      </span>
                                                    </Link>
                                                  </li>
                                                )
                                              )}
                                            </ul>
                                          )}
                                        </div>
                                      </React.Fragment>
                                    )}
                                  </SidebarLinkGroup>
                                ) : (
                                  <li key={subItem.name}>
                                    <Link
                                      href={subItem.path}
                                      className={`flex items-center py-2 px-4 rounded-md text-sm text-slate-400 hover:bg-slate-700/50 hover:text-white ${
                                        pathname === subItem.path &&
                                        "bg-slate-700/50 text-white"
                                      }`}
                                    >
                                      {isVisuallyExpanded && (
                                        <span>{subItem.name}</span>
                                      )}
                                    </Link>
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        </React.Fragment>
                      )}
                    </SidebarLinkGroup>
                  ) : (
                    <li key={item.name}>
                      <Link
                        href={item.path}
                        className={`group relative flex items-center gap-2.5 rounded-lg py-2 px-4 font-medium text-slate-300 duration-300 ease-in-out hover:bg-slate-700 ${
                          pathname === item.path && "bg-slate-700/50 text-white"
                        }`}
                      >
                        {item.icon}
                        {isVisuallyExpanded && <span>{item.name}</span>}
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      {/* SIDEBAR FOOTER */}
      <div className="mt-auto border-t border-slate-700/50 p-4">
        <button
          className="flex w-full items-center gap-3.5 rounded-lg py-2 px-4 text-slate-300 hover:bg-slate-700 hover:text-white"
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = "/auth/signin";
          }}
        >
          <TbLogout className="text-xl" />
          {isVisuallyExpanded && <span>Log Out</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
