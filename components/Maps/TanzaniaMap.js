"use client";
import React, { useState } from 'react';
import { MapContainer, TileLayer, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import Image from 'next/image';
import Link from 'next/link';

// Dummy data with updated counts to total 421
const DUMMY_DATA = {
  'Dar es Salaam': {
    center: [-6.7924, 39.2083],
    color: '#3b82f6',
    count: 180,  // Increased for largest city
    entrepreneurs: [
      {
        Business: {
          name: "Tech Solutions Ltd",
          BusinessSector: { name: "Technology" },
          program: "Business Foundation",
          teamSize: 12,
          email: "tech@solutions.com",
          location: "Dar es Salaam",
          uuid: "tech-1",
          createdAt: "2024-01-15"
        },
        image: "/images/default-avatar.png"
      },
      {
        Business: {
          name: "Green Energy Tanzania",
          BusinessSector: { name: "Clean Energy" },
          program: "Investment Readiness",
          teamSize: 8,
          email: "green@energy.tz",
          location: "Dar es Salaam",
          uuid: "green-1",
          createdAt: "2023-12-01"
        },
        image: "/images/default-avatar.png"
      }
    ]
  },
  'Dodoma': {
    center: [-6.1722, 35.7395],
    color: '#10b981',
    count: 65,  // Updated for capital city
    entrepreneurs: [
      {
        Business: {
          name: "Agri-Tech Solutions",
          BusinessSector: { name: "Agriculture" },
          program: "Investment Readiness",
          teamSize: 10,
          email: "agri@tech.tz",
          location: "Dodoma",
          uuid: "agri-1",
          createdAt: "2024-02-01"
        },
        image: "/images/default-avatar.png"
      }
    ]
  },
  'Arusha': {
    center: [-3.3667, 36.6833],
    color: '#f59e0b',
    count: 75,  // Updated for major tourist hub
    entrepreneurs: [
      {
        Business: {
          name: "Tourism Tech",
          BusinessSector: { name: "Tourism" },
          program: "Investment Readiness",
          teamSize: 9,
          email: "tourism@tech.tz",
          location: "Arusha",
          uuid: "tour-1",
          createdAt: "2023-11-15"
        },
        image: "/images/default-avatar.png"
      }
    ]
  },
  'Mwanza': {
    center: [-2.5167, 32.9000],
    color: '#6366f1',
    count: 55,  // Updated for lake zone
    entrepreneurs: [
      {
        Business: {
          name: "Lake Region Fisheries",
          BusinessSector: { name: "Agriculture" },
          program: "Business Foundation",
          teamSize: 18,
          location: "Mwanza",
          uuid: "lake-1",
          createdAt: "2023-10-15"
        },
        image: "/images/default-avatar.png"
      }
    ]
  },
  'Zanzibar': {
    center: [-6.1659, 39.2026],
    color: '#ec4899',
    count: 46,  // Updated for island region
    entrepreneurs: [
      {
        Business: {
          name: "Spice Trade Co",
          BusinessSector: { name: "Agriculture" },
          program: "Business Foundation",
          teamSize: 5,
          location: "Zanzibar",
          uuid: "spice-1",
          createdAt: "2023-09-01"
        },
        image: "/images/default-avatar.png"
      }
    ]
  }
};

const TANZANIA_BOUNDS = [[-11.7, 29.3], [-1.0, 40.4]];

const TanzaniaMap = () => {
  const [selectedRegion, setSelectedRegion] = useState(null);
  const totalEntrepreneurs = Object.values(DUMMY_DATA).reduce((sum, region) => sum + region.count, 0);
  const maxCount = Math.max(...Object.values(DUMMY_DATA).map(region => region.count));
  const sortedRegions = Object.entries(DUMMY_DATA).sort(([,a], [,b]) => b.count - a.count);

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
                    <span className="text-sm font-medium text-black dark:text-white">{index + 1}</span>
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
                          backgroundColor: data.color 
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

          {selectedRegion && (
            <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="font-semibold mb-3">Entrepreneurs in {selectedRegion}</h4>
              <div className="space-y-3 max-h-[200px] overflow-y-auto">
                {DUMMY_DATA[selectedRegion].entrepreneurs.map((entrepreneur, index) => (
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
                      <div className="font-medium text-sm">{entrepreneur.Business.name}</div>
                      <div className="text-xs text-gray-500">{entrepreneur.Business.BusinessSector.name}</div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(entrepreneur.Business.createdAt).getFullYear()}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="h-[400px] rounded-sm overflow-hidden">
          <MapContainer
            bounds={TANZANIA_BOUNDS}
            style={{ height: '100%', width: '100%' }}
            className="rounded-sm"
            zoomControl={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            {Object.entries(DUMMY_DATA).map(([region, data]) => (
              <CircleMarker
                key={region}
                center={data.center}
                radius={Math.max(6, (data.count * 15) / maxCount)}
                fillColor={data.color}
                fillOpacity={0.8}
                color={data.color}
                weight={2}
                eventHandlers={{
                  click: () => setSelectedRegion(region)
                }}
              >
                <Popup>
                  <div className="p-2 bg-white rounded-sm">
                    <h4 className="font-semibold text-lg text-gray-900">{region}</h4>
                    <p className="text-primary font-medium text-base">{data.count} entrepreneurs</p>
                    <p className="text-sm text-gray-600 mb-2">
                      {((data.count / totalEntrepreneurs) * 100).toFixed(1)}% of total
                    </p>
                    <div className="text-sm font-medium mt-2 text-gray-900">Top Sectors:</div>
                    <div className="space-y-1">
                      {Object.entries(
                        data.entrepreneurs.reduce((acc, curr) => {
                          const sector = curr.Business?.BusinessSector?.name || curr.sector;
                          acc[sector] = (acc[sector] || 0) + 1;
                          return acc;
                        }, {})
                      )
                        .sort(([,a], [,b]) => b - a)
                        .map(([sector, count]) => (
                          <div key={sector} className="text-xs text-gray-600 flex justify-between items-center">
                            <span>{sector}</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Object.entries(DUMMY_DATA).map(([region, data]) => (
          <div 
            key={region} 
            className="flex items-center gap-3 p-2.5 hover:bg-gray-50 dark:hover:bg-boxdark-2 rounded-sm transition-colors cursor-pointer"
            onClick={() => setSelectedRegion(region)}
          >
            <div className="flex items-center gap-2">
              <div 
                className="w-2.5 h-2.5 rounded-full" 
                style={{ backgroundColor: data.color }}
              ></div>
              <span className="text-sm font-medium text-black dark:text-white">
                {region}
              </span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 ml-auto">
              {data.count}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TanzaniaMap; 