"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { server_url } from "@/app/utils/endpoint";
import { headers } from "@/app/utils/headers";
import { BsPlus, BsSearch, BsTrash, BsPencil } from "react-icons/bs";
import Spinner from "@/components/spinner";

const InvestmentOpportunities = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [deleting, setDeleting] = useState(null);

  const fetchOpportunities = async (page = 1, keyword = "") => {
    try {
      setLoading(true);
      const response = await fetch(
        `${server_url}/investment-opportunities?page=${page}&limit=8&keyword=${keyword}`,
        {
          method: "GET",
          headers: headers,
        }
      );
      const data = await response.json();

      if (data.success) {
        setOpportunities(data.body.data);
        setTotalCount(data.body.count);
        setTotalPages(Math.ceil(data.body.count / 8));
        setCurrentPage(data.body.page);
      }
    } catch (error) {
      console.error("Error fetching opportunities:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities(1, searchTerm);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchOpportunities(1, searchTerm);
  };

  const handlePageChange = (page) => {
    fetchOpportunities(page, searchTerm);
  };

  const handleDelete = async (uuid) => {
    if (
      !confirm("Are you sure you want to delete this investment opportunity?")
    ) {
      return;
    }

    try {
      setDeleting(uuid);
      const response = await fetch(
        `${server_url}/investment-opportunities/${uuid}`,
        {
          method: "DELETE",
          headers: headers,
        }
      );

      if (response.ok) {
        // Refresh the list
        fetchOpportunities(currentPage, searchTerm);
      } else {
        alert("Failed to delete opportunity");
      }
    } catch (error) {
      console.error("Error deleting opportunity:", error);
      alert("Error deleting opportunity");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Investment Opportunities
            </h1>
            <p className="mt-2 text-gray-600">
              Manage and explore investment opportunities
            </p>
          </div>
          <Link
            href="/opportunities/new"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <BsPlus className="text-lg" />
            Add Opportunity
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1 relative">
            <BsSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search opportunities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Search
          </button>
        </form>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {opportunities.length} of {totalCount} opportunities
      </div>

      {/* Opportunities Grid */}
      {opportunities.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No opportunities found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new investment opportunity.
          </p>
          <div className="mt-6">
            <Link
              href="/opportunities/new"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <BsPlus className="text-lg" />
              Add Opportunity
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {opportunities.map((opportunity) => (
            <div
              key={opportunity.uuid}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Image */}
              {opportunity.image && (
                <div className="h-48 bg-gray-200 overflow-hidden">
                  <img
                    src={opportunity.image}
                    alt={opportunity.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Content */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {opportunity.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {opportunity.description}
                </p>

                {/* URL */}
                {opportunity.url && (
                  <div className="mb-4">
                    <a
                      href={opportunity.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm truncate block"
                    >
                      View Details →
                    </a>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    {new Date(opportunity.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex gap-2">
                    <Link
                      href={`/opportunities/${opportunity.uuid}/edit`}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <BsPencil className="text-sm" />
                    </Link>
                    <button
                      onClick={() => handleDelete(opportunity.uuid)}
                      disabled={deleting === opportunity.uuid}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {deleting === opportunity.uuid ? (
                        <div className="w-4 h-4">
                          <Spinner />
                        </div>
                      ) : (
                        <BsTrash className="text-sm" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <nav className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  page === currentPage
                    ? "bg-blue-600 text-white"
                    : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default InvestmentOpportunities;
