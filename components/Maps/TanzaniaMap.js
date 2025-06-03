"use client";
import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Popup, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Image from "next/image";
import Link from "next/link";
import { getEnterprenuers } from "@/app/controllers/user_controller";

// Tanzania regions with their coordinates
const REGION_COORDINATES = {
  "Dar es Salaam": { center: [-6.7924, 39.2083], color: "#3b82f6" },
  Dodoma: { center: [-6.1722, 35.7395], color: "#219654" },
  Arusha: { center: [-3.3667, 36.6833], color: "#f59e0b" },
  Mwanza: { center: [-2.5167, 32.9], color: "#6366f1" },
  Zanzibar: { center: [-6.1659, 39.2026], color: "#ec4899" },
  Tanga: { center: [-5.0667, 39.1], color: "#8b5cf6" },
  Mbeya: { center: [-8.9, 33.45], color: "#ef4444" },
  Morogoro: { center: [-6.8219, 37.6614], color: "#14b8a6" },
  Kilimanjaro: { center: [-3.4, 37.35], color: "#f97316" },
  Kigoma: { center: [-4.8769, 29.6267], color: "#84cc16" },
  Mtwara: { center: [-10.2667, 40.1833], color: "#06b6d4" },
  Iringa: { center: [-7.7667, 35.7], color: "#a855f7" },
  Lindi: { center: [-9.9986, 39.7188], color: "#0ea5e9" },
  Geita: { center: [-2.8736, 32.227], color: "#d946ef" },
  Kagera: { center: [-1.856, 31.0271], color: "#22c55e" },
  Katavi: { center: [-6.4217, 31.0673], color: "#3b82f6" },
  Manyara: { center: [-4.3134, 36.4965], color: "#eab308" },
  Mara: { center: [-1.7763, 34.1548], color: "#ef4444" },
  Njombe: { center: [-9.3411, 34.772], color: "#8b5cf6" },
  Pwani: { center: [-7.3232, 38.829], color: "#14b8a6" },
  Rukwa: { center: [-7.7084, 31.6112], color: "#f97316" },
  Ruvuma: { center: [-10.6854, 35.6535], color: "#84cc16" },
  Shinyanga: { center: [-3.6619, 33.4235], color: "#06b6d4" },
  Simiyu: { center: [-2.8304, 34.0142], color: "#a855f7" },
  Singida: { center: [-4.8166, 34.7439], color: "#0ea5e9" },
  Songwe: { center: [-9.0347, 33.3935], color: "#d946ef" },
  Tabora: { center: [-5.0143, 32.8139], color: "#22c55e" },
  "Pemba North": { center: [-5.0333, 39.7833], color: "#eab308" },
  "Pemba South": { center: [-5.3167, 39.7333], color: "#ef4444" },
  "Mjini Magharibi": { center: [-6.1631, 39.1991], color: "#8b5cf6" },
};

const TANZANIA_BOUNDS = [
  [-11.7, 29.3],
  [-1.0, 40.4],
];

const TanzaniaMap = () => {
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [mapData, setMapData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEntrepreneurData();
  }, []);

  const fetchEntrepreneurData = async () => {
    try {
      setLoading(true);

      // Use a large page size (1000) to get all entrepreneurs at once
      // This matches the approach in the entrepreneurs page
      const response = await getEnterprenuers(1000, 1, "");
      console.log("Entrepreneur data response:", response);

      if (response && response.data) {
        // Group entrepreneurs by region
        const regionData = {};

        // Initialize all regions with zero count
        Object.keys(REGION_COORDINATES).forEach((region) => {
          regionData[region] = {
            ...REGION_COORDINATES[region],
            count: 0,
            entrepreneurs: [],
          };
        });

        // Process entrepreneurs
        response.data.forEach((user) => {
          if (user.Business && user.Business.location) {
            const region = user.Business.location;

            // If region exists in our coordinates data
            if (regionData[region]) {
              // Increment count
              regionData[region].count += 1;

              // Add entrepreneur to the list
              regionData[region].entrepreneurs.push({
                Business: {
                  name: user.Business.name,
                  BusinessSector: {
                    name: user.Business.BusinessSector?.name || "Other",
                  },
                  program: user.Business.program || "N/A",
                  teamSize: user.Business.teamSize || 0,
                  email: user.email,
                  location: user.Business.location,
                  uuid: user.Business.uuid,
                  createdAt: user.Business.createdAt,
                },
                image: user.image || "/images/default-avatar.png",
              });
            }
          }
        });

        console.log("Processed map data:", regionData);
        setMapData(regionData);
      } else {
        console.error("Invalid response format:", response);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching entrepreneur data:", error);
      setLoading(false);
    }
  };

  // Calculate total entrepreneurs and max count for visualization
  const totalEntrepreneurs = Object.values(mapData).reduce(
    (sum, region) => sum + region.count,
    0
  );
  const maxCount = Math.max(
    ...Object.values(mapData).map((region) => region.count),
    1
  );
  const sortedRegions = Object.entries(mapData).sort(
    ([, a], [, b]) => b.count - a.count
  );

  if (loading) {
    return (
      <div className="col-span-12 rounded-sm border border-stroke bg-white px-5 pt-7.5 pb-5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-center">
            <div className="mb-4">
              <svg
                className="animate-spin h-8 w-8 text-primary mx-auto"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400">
              Loading entrepreneur data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Check if we have any entrepreneurs data
  if (totalEntrepreneurs === 0) {
    return (
      <div className="col-span-12 rounded-sm border border-stroke bg-white px-5 pt-7.5 pb-5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
        <div className="flex flex-wrap items-start justify-between gap-3 sm:flex-nowrap mb-6">
          <div>
            <h3 className="text-xl font-bold text-black dark:text-white">
              Entrepreneur Distribution
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Regional distribution of entrepreneurs across Tanzania
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center h-[400px] text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 text-gray-300 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
            No Entrepreneur Data Found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md">
            There are currently no entrepreneurs registered in the system with
            location data. When entrepreneurs register with location
            information, they will appear on this map.
          </p>

          <Link
            href="/enterprenuers"
            className="mt-6 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80 transition-colors"
          >
            View All Entrepreneurs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="col-span-12 rounded-sm border border-stroke bg-white px-5 pt-7.5 pb-5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
      <div className="flex flex-wrap items-start justify-between gap-3 sm:flex-nowrap mb-6">
        <div>
          <h3 className="text-xl font-bold text-black dark:text-white">
            Entrepreneur Distribution
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Regional distribution of entrepreneurs across Tanzania
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm font-medium text-meta-3">
            Total Entrepreneurs: {totalEntrepreneurs}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-50 dark:bg-boxdark-2 p-6 rounded-sm">
          <div className="flex flex-col gap-4">
            {sortedRegions.slice(0, 4).map(([region, data], index) => (
              <div
                key={region}
                className="flex items-center justify-between cursor-pointer hover:bg-gray-100 dark:hover:bg-boxdark p-2 rounded-sm transition-colors"
                onClick={() => setSelectedRegion(region)}
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-6.5 w-6.5 items-center justify-center rounded-full bg-meta-2">
                    <span className="text-sm font-medium text-black dark:text-white">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-black dark:text-white">
                      {region}
                    </div>
                    <div className="text-xs text-gray-500">
                      {data.entrepreneurs.length} businesses
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <div className="flex items-center gap-1">
                    <div className="w-[60px] h-2 rounded-full bg-gray-200 dark:bg-boxdark overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(data.count / maxCount) * 100}%`,
                          backgroundColor: data.color,
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-black dark:text-white">
                      {data.count}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedRegion &&
            mapData[selectedRegion]?.entrepreneurs.length > 0 && (
              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="font-semibold mb-3">
                  Entrepreneurs in {selectedRegion}
                </h4>
                <div className="space-y-3 max-h-[200px] overflow-y-auto">
                  {mapData[selectedRegion].entrepreneurs.map(
                    (entrepreneur, index) => (
                      <Link
                        href={`/businessDetails/${entrepreneur.Business.uuid}`}
                        key={index}
                        className="flex items-center gap-3 p-2 bg-white dark:bg-boxdark rounded-sm hover:bg-gray-50 dark:hover:bg-boxdark-2 transition-colors"
                      >
                        <div className="w-10 h-10 relative rounded-full overflow-hidden">
                          <Image
                            src={entrepreneur.image}
                            alt={entrepreneur.Business.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-grow">
                          <div className="font-medium text-sm">
                            {entrepreneur.Business.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {entrepreneur.Business.BusinessSector.name}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {entrepreneur.Business.createdAt
                            ? new Date(
                                entrepreneur.Business.createdAt
                              ).getFullYear()
                            : "N/A"}
                        </div>
                      </Link>
                    )
                  )}
                </div>
              </div>
            )}
        </div>

        <div className="h-[400px] rounded-sm overflow-hidden">
          <MapContainer
            bounds={TANZANIA_BOUNDS}
            style={{ height: "100%", width: "100%" }}
            className="rounded-sm"
            zoomControl={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            {Object.entries(mapData).map(([region, data]) => (
              <CircleMarker
                key={region}
                center={data.center}
                radius={Math.max(6, (data.count * 15) / maxCount)}
                fillColor={data.color}
                fillOpacity={0.8}
                color={data.color}
                weight={2}
                eventHandlers={{
                  click: () => setSelectedRegion(region),
                }}
              >
                <Popup>
                  <div className="p-2 bg-white rounded-sm">
                    <h4 className="font-semibold text-lg text-gray-900">
                      {region}
                    </h4>
                    <p className="text-primary font-medium text-base">
                      {data.count} entrepreneurs
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      {totalEntrepreneurs > 0
                        ? ((data.count / totalEntrepreneurs) * 100).toFixed(1)
                        : 0}
                      % of total
                    </p>
                    {data.entrepreneurs.length > 0 && (
                      <>
                        <div className="text-sm font-medium mt-2 text-gray-900">
                          Top Sectors:
                        </div>
                        <div className="space-y-1">
                          {Object.entries(
                            data.entrepreneurs.reduce((acc, curr) => {
                              const sector =
                                curr.Business?.BusinessSector?.name || "Other";
                              acc[sector] = (acc[sector] || 0) + 1;
                              return acc;
                            }, {})
                          )
                            .sort(([, a], [, b]) => b - a)
                            .slice(0, 3)
                            .map(([sector, count]) => (
                              <div
                                key={sector}
                                className="text-xs text-gray-600 flex justify-between items-center"
                              >
                                <span>{sector}</span>
                                <span className="font-medium">{count}</span>
                              </div>
                            ))}
                        </div>
                      </>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default TanzaniaMap;
