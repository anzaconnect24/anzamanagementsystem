import React, { useContext, useEffect, useRef, useState, useMemo } from "react";

import Link from "@/utils/link";
import { usePathname, useRouter } from "@/utils/navigation";
import Image from "@/utils/image";
import { UserContext } from "@/layouts/DashboardLayout";
import { useTranslation } from "@/locales";
import SidebarLinkGroup from "./SidebarLinkGroup";
import { getAvailableDomains } from "@/controllers/crat_controller";

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
import {
  RiTeamLine,
  RiMoneyDollarCircleLine,
  RiPhoneLine,
} from "react-icons/ri";
import { BsCalendar3, BsCardChecklist } from "react-icons/bs";
import { BiMessageDetail } from "react-icons/bi";
import { IoDocumentTextOutline } from "react-icons/io5";
import { logout } from "@/utils/local_storage";

const Sidebar = ({
  sidebarOpen,
  setSidebarOpen,
  sidebarExpanded,
  setSidebarExpanded,
}) => {
  const pathname = usePathname();
  const { userDetails } = useContext(UserContext);
  const { t } = useTranslation();
  const trigger = useRef(null);
  const sidebar = useRef(null);
  const router = useRouter();

  const [localSidebarExpanded, setLocalSidebarExpanded] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sidebar-expanded");
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  const isExpanded =
    sidebarExpanded !== undefined ? sidebarExpanded : localSidebarExpanded;

  const setExpanded =
    setSidebarExpanded !== undefined
      ? setSidebarExpanded
      : setLocalSidebarExpanded;

  const [isHovered, setIsHovered] = useState(false);
  const [availableDomains, setAvailableDomains] = useState([]);

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

  const getMenuCategories = () => {
    const categories = [];

    if (!userDetails || !userDetails.role) {
      return categories;
    }

    const role = userDetails.role;

    categories.push({
      id: "dashboard",
      title: t("navigation.dashboard", "Dashboard"),
      items: [
        {
          name: t("navigation.dashboard", "Dashboard"),
          path: "/dashboard/",
          icon: <MdOutlineDashboard className="text-xl" />,
          roles: ["Admin", "Enterprenuer", "Investor", "Mentor", "Staff"],
        },
      ],
    });

    const peopleItems = [];

    if (["Admin"].includes(role)) {
      peopleItems.push({
        name: t("navigation.allUsers", "Users"),
        path: "/dashboard/users",
        icon: <SlPeople className="text-xl" />,
        submenu: [
          {
            name: t("navigation.users", "Users"),
            path: "/dashboard/users",
          },
          {
            name: t("navigation.startups", "Startups"),
            path: "/dashboard/enterprenuers",
          },
          {
            name: t("navigation.investors", "Investors"),
            path: "/dashboard/investors",
          },
          {
            name: t("navigation.mentors", "Mentors"),
            path: "/dashboard/mentors",
          },
          {
            name: t("navigation.staff", "Staff"),
            path: "/dashboard/reviewers",
          },
          {
            name: t("navigation.admins", "Admins"),
            path: "/dashboard/admins",
          },
        ],
      });
    }

    if (["Mentor"].includes(role)) {
      peopleItems.push({
        name: t("navigation.startups", "Startups"),
        path: "/dashboard/enterprenuers",
        icon: <RiTeamLine className="text-xl" />,
      });

      peopleItems.push({
  name: t("navigation.investors", "Investors"),
  path: "/dashboard/investors",
  icon: <RiMoneyDollarCircleLine className="text-xl" />,
});

      peopleItems.push({
        name: t("navigation.mentors", "Mentors"),
        path: "/dashboard/mentors",
        icon: <FaUserTie className="text-xl" />,
      });
    }

    if (["Enterprenuer"].includes(role)) {
      peopleItems.push({
        name: t("navigation.mentors", "Mentors"),
        icon: <FaUserTie className="text-xl" />,
        submenu: [
          {
            name: t("navigation.myMentor", "My Mentor"),
            path: "/dashboard/myMentors",
          },
          {
            name: t("navigation.allMentors", "All Mentors"),
            path: "/dashboard/mentors",
          },
          {
            name: t(
              "navigation.mentorshipApplications",
              "Mentorship Applications",
            ),
            path: "/dashboard/mentorshipApplications",
          },
        ],
      });
    }

    if (["Investor", "Enterprenuer", "Staff"].includes(role)) {
      peopleItems.push({
        name: t("navigation.startups", "Startups"),
        path: "/dashboard/enterprenuers",
        icon: <RiTeamLine className="text-xl" />,
      });
    }

    if (["Staff"].includes(role)) {
      peopleItems.push({
        name: t("navigation.investors", "Investors"),
        path: "/dashboard/investors",
        icon: <RiMoneyDollarCircleLine className="text-xl" />,
      });

      peopleItems.push({
        name: t("navigation.mentors", "Mentors"),
        path: "/dashboard/mentors",
        icon: <FaUserTie className="text-xl" />,
      });
    }

    if (peopleItems.length > 0) {
      categories.push({
        id: "communityHub",
        title:
          role === "Admin"
            ? t("common.users", "Users")
            : t("navigation.communityHub", "Community Hub"),
        items: peopleItems.map((item) => ({
          ...item,
          name:
            role !== "Admin" && item.name === t("navigation.allUsers", "Users")
              ? t("navigation.communityHub", "Community Hub")
              : item.name,
        })),
      });
    }

    if (["Mentor"].includes(role)) {
      categories.push({
        id: "mentorship",
        title: t("navigation.mentorship", "Mentorship Hub"),
        items: [
          {
            name: t("navigation.mentees", "Mentees"),
            path: "/dashboard/mentorEntreprenuers",
            icon: <SlPeople className="text-xl" />,
          },
          {
            name: t("navigation.mentorshipRequests", "Mentorship Requests"),
            path: "/dashboard/mentorshipRequests",
            icon: <FaHandshake className="text-xl" />,
          },
        ],
      });
    }

    const businessItems = [];

    if (["Investor"].includes(role)) {
      businessItems.push({
        name: t("navigation.myInvestmentRequests", "My Investment Requests"),
        path: "/dashboard/myInvestmentRequests",
        icon: <RiMoneyDollarCircleLine className="text-xl" />,
      });

      businessItems.push({
        name: t("navigation.investmentApplications", "Investment Applications"),
        path: "/dashboard/investmentApplications",
        icon: <BsCardChecklist className="text-xl" />,
      });
    }

    if (["Admin"].includes(role)) {
      businessItems.push({
        name: t("navigation.investmentRequests", "Investment Requests"),
        path: "/dashboard/pendingRequests",
        icon: <RiMoneyDollarCircleLine className="text-xl" />,
        submenu: [
          {
            name: t("navigation.requestsInProgress", "Requests in Progress"),
            path: "/dashboard/pendingRequests",
          },
          {
            name: t("navigation.matchedRequests", "Matched Requests"),
            path: "/dashboard/acceptedRequests",
          },
          {
            name: t("navigation.mismatchedRequests", "Mismatched Requests"),
            path: "/dashboard/rejectedRequests",
          },
        ],
      });

      businessItems.push({
        name: t("navigation.applications", "Applications"),
        path: "/dashboard/pendingApplications",
        icon: <BsCardChecklist className="text-xl" />,
        submenu: [
          {
            name: t("navigation.pendingApplications", "Pending Applications"),
            path: "/dashboard/pendingApplications",
          },
          {
            name: t("navigation.approvedApplications", "Approved Applications"),
            path: "/dashboard/approvedApplications",
          },
          {
            name: t("navigation.rejectedApplications", "Rejected Applications"),
            path: "/dashboard/rejectedApplications",
          },
        ],
      });
    }

   if (businessItems.length > 0) {
  categories.push({
    id: "investmentPipeline",
    title: t("navigation.businessOperations", "Business Operations"),
    items: businessItems,
  });
}

    const investmentItems = [];

    if (["Admin"].includes(role)) {
      investmentItems.push({
        name: t("navigation.investorConnection", "Investor Connection"),
        path: "/dashboard/investors",
        icon: <RiMoneyDollarCircleLine className="text-xl" />,
      });

      investmentItems.push({
        name: t("navigation.openCallsForFunding", "Open calls for funding"),
        path: "/dashboard/opportunities",
        icon: <RiPhoneLine className="text-xl" />,
      });
    }

    if (["Enterprenuer"].includes(role)) {
      investmentItems.push({
        name: t("navigation.investorConnection", "Investor Connection"),
        path: "/dashboard/investors",
        icon: <RiMoneyDollarCircleLine className="text-xl" />,
        submenu: [
          {
            name: t("navigation.investors", "Investors"),
            path: "/dashboard/investors",
          },
          {
            name: t(
              "navigation.investmentApplications",
              "Investment Applications",
            ),
            path: "/dashboard/investmentApplications",
          },
          {
            name: t("navigation.interestedInvestors", "Interested Investors"),
            path: "/dashboard/interestedInvestors",
          },
        ],
      });

      investmentItems.push({
        name: t("navigation.openCallsForFunding", "Open calls for funding"),
        path: "/dashboard/opportunities",
        icon: <RiPhoneLine className="text-xl" />,
      });
    }

    if (investmentItems.length > 0) {
      categories.push({
        id: "investment",
        title: t("navigation.fundingOpportunities", "Funding Opportunities"),
        items: investmentItems,
      });
    }

    const programsItems = [];

    if (["Admin", "Enterprenuer"].includes(role)) {
      programsItems.push({
        name: t("navigation.programsApplications", "Programs Applications"),
        icon: <MdBusinessCenter className="text-xl" />,
        path: "https://programs.anzaconnect.co.tz/login",
        external: true,
      });
    }

    if (["Enterprenuer"].includes(role)) {
      // Build CRAT domain submenu items dynamically from available domains
      const domainSubmenu = [
        {
          name: t("navigation.introduction", "Introduction"),
          path: "/dashboard/crat-system/introduction",
        },
      ];

      // Add domain items from available domains using dynamic route
      availableDomains.forEach((domain) => {
        const label = domain
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
        const path = `/dashboard/crat-system/domain/${domain}`;
        domainSubmenu.push({
          name: label,
          path: path,
        });
      });

      // Add review and report items
      domainSubmenu.push({
        name: t("navigation.cratReview", "CRAT Review"),
        path: "/dashboard/crat-system/cratReview",
      });

      domainSubmenu.push({
        name: t("navigation.report", "Report"),
        path: "/dashboard/crat-system/report",
      });

      programsItems.push({
        name: t("navigation.cratSystem", "CRAT System"),
        path: "/dashboard/crat-system/introduction",
        icon: <MdBusinessCenter className="text-xl" />,
        submenu: domainSubmenu,
      });
    }

    if (["Staff"].includes(role)) {
      programsItems.push({
        name: t("navigation.cratReviews", "My CRAT Assignments"),
        path: "/dashboard/cratReviews",
        icon: <MdAssignment className="text-xl" />,
      });
    }

    if (["Admin"].includes(role)) {
      programsItems.push({
        name: t("navigation.mentorReports", "Mentor Reports"),
        path: "/dashboard/mentorReports",
        icon: <FaWpforms className="text-xl" />,
      });

      programsItems.push({
        name: t("navigation.cratCatalogManager", "CRAT Builder"),
        path: "/dashboard/cratCatalogManager",
        icon: <MdAssignment className="text-xl" />,
      });

      programsItems.push({
        name: t("navigation.cratReviewApplications", "CRAT Assignment Queue"),
        path: "/dashboard/cratReviewApplications",
        icon: <MdAssignment className="text-xl" />,
      });
    }

    if (["Admin", "Enterprenuer", "Staff", "Mentor"].includes(role)) {
      programsItems.push({
        name: t("navigation.learnAndGrow", "Learn & Grow"),
        icon: <IoDocumentTextOutline className="text-xl" />,
        submenu: [
          {
            name: t("navigation.generalResources", "General Resources"),
            path: "/dashboard/generalResources",
          },
          {
            name: t("navigation.businessTools", "Business Tools"),
            path: "/dashboard/businessTools",
          },
          {
            name: t("navigation.classRooms", "Class Rooms"),
            path: "/dashboard/classRooms",
          },
        ],
      });
    }

    if (["Admin", "Enterprenuer", "Staff", "Mentor"].includes(role)) {
      programsItems.push({
        name: t("navigation.successStories", "Success Stories"),
        path: "/dashboard/successStories",
        icon: <FaRegLightbulb className="text-xl" />,
      });
    }

    if (programsItems.length > 0) {
      categories.push({
        id: "programs",
        title: t("navigation.programsAndResources", "Programs & Resources"),
        items: programsItems,
      });
    }

    if (
      ["Enterprenuer", "Investor", "Staff", "Mentor", "Admin"].includes(role)
    ) {
      categories.push({
        id: "communication",
        title: t("navigation.communication", "Communication"),
        items: [
          {
            name: t("navigation.chats", "Chats"),
            path: "/dashboard/conversations",
            icon: <BiMessageDetail className="text-xl" />,
          },
        ],
      });
    }

    return categories;
  };

  const menuCategories = getMenuCategories();
  const isVisuallyExpanded = isHovered || isExpanded;

  if (!userDetails) {
    return null;
  }

  return (
    <aside
      ref={sidebar}
      className={`absolute z-50 left-0 top-0 flex h-screen flex-col overflow-y-hidden bg-gradient-to-b from-slate-800 to-slate-900 duration-300 ease-in-out lg:static lg:translate-x-0 transition-all ${
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
      <div className="flex items-center justify-between gap-2 px-6 py-5 border-b border-slate-700/50">
        <Link href="/" className="flex items-center">
          <Image
            width={1200}
            height={300}
            src="/anza_connect_logo.svg"
            alt="Anza Connect Logo"
            className={`transition-all duration-300 object-contain ${
              isVisuallyExpanded ? "h-20 w-auto" : "h-14 w-auto"
            }`}
          />
        </Link>
      </div>

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
                                      subItem.path,
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
                                                ),
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
                                ),
                              )}
                            </ul>
                          </div>
                        </React.Fragment>
                      )}
                    </SidebarLinkGroup>
                  ) : (
                    <li key={item.name}>
                      {item.external ? (
                        <a
                          href={item.path}
                          className="group relative flex items-center gap-2.5 rounded-lg py-2 px-4 font-medium text-slate-300 duration-300 ease-in-out hover:bg-slate-700"
                        >
                          {item.icon}
                          {isVisuallyExpanded && <span>{item.name}</span>}
                        </a>
                      ) : (
                        <Link
                          href={item.path}
                          className={`group relative flex items-center gap-2.5 rounded-lg py-2 px-4 font-medium text-slate-300 duration-300 ease-in-out hover:bg-slate-700 ${
                            pathname === item.path &&
                            "bg-slate-700/50 text-white"
                          }`}
                        >
                          {item.icon}
                          {isVisuallyExpanded && <span>{item.name}</span>}
                        </Link>
                      )}
                    </li>
                  ),
                )}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="mt-auto border-t border-slate-700/50 p-4">
        <button
          className="flex w-full items-center gap-3.5 rounded-lg py-2 px-4 text-slate-300 hover:bg-slate-700 hover:text-white"
          onClick={() => {
            logout();
            router.push("/signin");
          }}
        >
          <TbLogout className="text-xl" />
          {isVisuallyExpanded && <span>{t("common.logout", "Log Out")}</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;