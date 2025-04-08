"use client";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "../../layout";
import Loader from "@/components/common/Loader";
import { timeAgo } from "@/app/utils/time_ago";
import { getMentorAssignedEntreprenuers } from "@/app/controllers/mentorEntreprenuerController";
import Link from "next/link";
import NoData from "@/app/component/noData";

const MentorEntreprenuer = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const { userDetails } = useContext(UserContext);

  useEffect(() => {
    getMentorAssignedEntreprenuers(userDetails.uuid).then((res) => {
      console.log(res);
      setData(res);
      setLoading(false);
    });
  }, []);

  // Helper function to safely get entrepreneur name
  const getEntrepreneurName = (item) => {
    return item?.Entreprenuer?.name || 'Unnamed Entrepreneur';
  };

  // Helper function to safely get business name
  const getBusinessName = (item) => {
    return item?.Entreprenuer?.Business?.name || 'Unnamed Business';
  };

  // Updated filter function with null checks
  const filteredUsers = data.filter(e =>
    (getEntrepreneurName(e).toLowerCase().includes(keyword.toLowerCase()) ||
    getBusinessName(e).toLowerCase().includes(keyword.toLowerCase()) ||
    (e?.Entreprenuer?.email || '').toLowerCase().includes(keyword.toLowerCase()))
  );

  return loading ? (
    <Loader />
  ) : (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search entrepreneurs..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full md:w-72 px-4 py-2 rounded-lg border border-stroke bg-white dark:bg-boxdark dark:border-strokedark focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Grid Section */}
      {filteredUsers.length < 1 ? (
        <NoData />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredUsers.map((item, key) => (
            <Link
              href={`/businessDetails/${item?.Entreprenuer?.Business?.uuid || '#'}`}
              key={key}
              className="block h-full"
            >
              <div className="bg-white dark:bg-boxdark rounded-xl shadow-sm hover:shadow-md transition-all duration-300 h-full">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
                    {getEntrepreneurName(item)}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {getBusinessName(item)}
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {item?.Entreprenuer?.email || 'No email provided'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {item?.Entreprenuer?.phone || 'No phone provided'}
                    </p>
                    {item?.Entreprenuer?.Business?.BusinessSector?.name && (
                      <p className="text-sm text-primary">
                        {item.Entreprenuer.Business.BusinessSector.name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-stroke dark:border-strokedark bg-gray-50 dark:bg-boxdark-2">
                  <div className="flex items-center justify-center text-sm font-medium text-primary">
                    View Details
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MentorEntreprenuer;
