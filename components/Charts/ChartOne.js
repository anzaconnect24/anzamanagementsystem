"use client";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { getEnterprenuers, getAllUsers } from "@/app/controllers/user_controller";
import { getInvestors } from "@/app/controllers/user_controller";
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

const options = {
  legend: {
    show: true,
    position: "top",
    horizontalAlign: "left",
  },
  colors: ["#3C50E0", "#80CAEE", "#FF9800"],
  chart: {
    fontFamily: "Satoshi, sans-serif",
    height: 335,
    type: "area",
    dropShadow: {
      enabled: true,
      color: "#623CEA14",
      top: 10,
      blur: 4,
      left: 0,
      opacity: 0.1,
    },
    toolbar: {
      show: false,
    },
  },
  responsive: [
    {
      breakpoint: 1024,
      options: {
        chart: {
          height: 300,
        },
      },
    },
    {
      breakpoint: 1366,
      options: {
        chart: {
          height: 350,
        },
      },
    },
  ],
  stroke: {
    width: [2, 2],
    curve: "smooth",
  },
  grid: {
    xaxis: {
      lines: {
        show: true,
      },
    },
    yaxis: {
      lines: {
        show: true,
      },
    },
  },
  dataLabels: {
    enabled: false,
  },
  markers: {
    size: 4,
    colors: "#fff",
    strokeColors: ["#3056D3", "#80CAEE"],
    strokeWidth: 3,
    strokeOpacity: 0.9,
    strokeDashArray: 0,
    fillOpacity: 1,
    discrete: [],
    hover: {
      size: undefined,
      sizeOffset: 5,
    },
  },
  xaxis: {
    type: "category",
    categories: ["2021", "2022", "2023", "2024", "2025"],
    axisBorder: {
      show: false,
    },
    axisTicks: {
      show: false,
    },
  },
  yaxis: {
    title: {
      text: "Number of Registrations",
      style: {
        fontSize: "14px",
        fontWeight: 500,
      },
    },
    min: 0,
    tickAmount: 5,
  },
  tooltip: {
    shared: true,
    intersect: false,
    y: {
      formatter: function (value) {
        return value + " registrations";
      }
    }
  }
};

const ChartOne = () => {
  const [loading, setLoading] = useState(true);
  const [registrationData, setRegistrationData] = useState({
    users: Array(5).fill(0),
    investors: Array(5).fill(0),
    businesses: Array(5).fill(0),
    totals: {
      users: 0,
      investors: 0,
      businesses: 0
    }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all users data
        const usersResponse = await getAllUsers(1000, 1);
        // Fetch investors data
        const investorsResponse = await getInvestors(1000, 1);
        // Fetch entrepreneurs data
        const entrepreneursResponse = await getEnterprenuers(1000, 1);
        
        if (usersResponse?.data && investorsResponse?.data && entrepreneursResponse?.data) {
          const userYearlyData = Array(5).fill(0);
          const investorYearlyData = Array(5).fill(0);
          const entrepreneurYearlyData = Array(5).fill(0);
          
          // Process users data
          usersResponse.data.forEach(user => {
            if (user.createdAt) {
              const year = new Date(user.createdAt).getFullYear();
              const yearIndex = year - 2021;
              if (yearIndex >= 0 && yearIndex < 5) {
                userYearlyData[yearIndex]++;
              }
            }
          });

          // Process investors data
          investorsResponse.data.forEach(investor => {
            if (investor.createdAt) {
              const year = new Date(investor.createdAt).getFullYear();
              const yearIndex = year - 2021;
              if (yearIndex >= 0 && yearIndex < 5) {
                investorYearlyData[yearIndex]++;
              }
            }
          });

          // Process entrepreneurs data
          entrepreneursResponse.data.forEach(entrepreneur => {
            if (entrepreneur.createdAt) {
              const year = new Date(entrepreneur.createdAt).getFullYear();
              const yearIndex = year - 2021;
              if (yearIndex >= 0 && yearIndex < 5) {
                entrepreneurYearlyData[yearIndex]++;
              }
            }
          });

          setRegistrationData({
            users: userYearlyData,
            investors: investorYearlyData,
            businesses: entrepreneurYearlyData,
            totals: {
              users: usersResponse.data.length,
              investors: investorsResponse.data.length,
              businesses: entrepreneursResponse.data.length
            }
          });
        }
      } catch (error) {
        console.error("Error fetching registration data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const chartData = {
    series: [
      {
        name: "Total Users",
        data: registrationData.users,
      },
      {
        name: "Investors",
        data: registrationData.investors,
      },
      {
        name: "Entrepreneurs",  // Changed from "Businesses" to "Entrepreneurs"
        data: registrationData.businesses,
      },
    ],
  };

  // NextJS Requirement
  const isWindowAvailable = () => typeof window !== "undefined";

  if (!isWindowAvailable()) return <></>;

  return (
    <div className="col-span-12 rounded-sm border border-stroke bg-white px-5 pt-7.5 pb-5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:col-span-12">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h3 className="text-xl font-bold text-black dark:text-white">
          Registration Statistics
        </h3>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg bg-gray-50 p-4 dark:bg-boxdark-2">
          <div className="flex items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</h4>
              <p className="mt-1 text-xl font-bold text-black dark:text-white">{registrationData.totals.users}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-gray-50 p-4 dark:bg-boxdark-2">
          <div className="flex items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Investors</h4>
              <p className="mt-1 text-xl font-bold text-black dark:text-white">{registrationData.totals.investors}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-gray-50 p-4 dark:bg-boxdark-2">
          <div className="flex items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-meta-3/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-meta-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="ml-4">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Entrepreneurs</h4>
              <p className="mt-1 text-xl font-bold text-black dark:text-white">{registrationData.totals.businesses}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        <div id="chartOne" className="-ml-5 h-[355px] w-[105%]">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50/50">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <span className="text-sm font-medium text-gray-600">Loading data...</span>
              </div>
            </div>
          ) : (
            <ReactApexChart
              options={options}
              series={chartData.series}
              type="area"
              width="100%"
              height="100%"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChartOne;
