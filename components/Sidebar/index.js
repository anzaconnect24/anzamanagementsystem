import React, { useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { UserContext } from "@/app/(dashboard)/layout";
import SidebarLinkGroup from './SidebarLinkGroup';

// Icons
import { MdOutlineDashboard, MdBusinessCenter } from "react-icons/md";
import { TbLogout } from "react-icons/tb";
import { SlPeople } from "react-icons/sl";
import { FaUserTie, FaHandshake, FaQuestion, FaWpforms, FaRegLightbulb } from "react-icons/fa";
import { RiTeamLine, RiMoneyDollarCircleLine } from "react-icons/ri";
import { BsCalendar3, BsCardChecklist } from "react-icons/bs";
import { BiMessageDetail } from "react-icons/bi";
import { IoDocumentTextOutline, IoChevronDownOutline } from "react-icons/io5";

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
          { name: "Report", path: "/report" },
        ]
      });
    }

    if (["Reviewer"].includes(role)) {
      programsItems.push({
        name: "Reviewer",
        path: "/applicationList",
        icon: <MdBusinessCenter className="text-xl" />,
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
                                {item.icon}
                                {item.name}
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
                                  {item.submenu.map((subItem) => (
                                    <li key={subItem.name}>
                                      <Link
                                        href={subItem.path}
                                        className={`flex items-center py-2 px-4 rounded-md text-sm text-slate-400 hover:bg-slate-700/50 hover:text-white ${
                                          pathname === subItem.path && "bg-slate-700/50 text-white"
                                        }`}
                                      >
                                        <span>{subItem.name}</span>
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </React.Fragment>
                          )}
                      </SidebarLinkGroup>
                    );
                  } else {
                    // Regular item without submenu
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
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;