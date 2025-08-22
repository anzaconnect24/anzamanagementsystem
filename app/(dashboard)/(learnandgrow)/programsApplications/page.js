"use client";
import { useState, useEffect, useContext } from "react";
import Link from "next/link";
import axios from "axios";
import { server_url } from "@/app/utils/endpoint";
import { headers } from "@/app/utils/headers";
import { BsPlus, BsSearch, BsTrash, BsPencil } from "react-icons/bs";
import Spinner from "@/components/spinner";
import { UserContext } from "../../layout";

const ProgramsApplications = () => {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [deleting, setDeleting] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const { userDetails } = useContext(UserContext);

  const fetchPrograms = async (page = 1, keyword = "", isSearch = false) => {
    try {
      if (isSearch) {
        setSearchLoading(true);
      } else {
        setLoading(true);
      }

      const response = await axios.get(`${server_url}/programs`, {
        params: {
          page: page,
          limit: 8,
          keyword: keyword,
        },
        headers: headers,
      });

      if (response.data.status) {
        console.log("Programs:", response.data);
        setPrograms(response.data.body.data);
        setTotalCount(response.data.body.count);
        setTotalPages(Math.ceil(response.data.body.count / 8));
        setCurrentPage(response.data.body.page);
      }
    } catch (error) {
      console.error("Error fetching programs:", error);
    } finally {
      if (isSearch) {
        setSearchLoading(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchPrograms(1, searchTerm, false);
  }, []);

  // Debounced search effect
  useEffect(() => {
    // Skip the initial load
    if (searchTerm === "" && currentPage === 1) return;

    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      fetchPrograms(1, searchTerm, true);
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handlePageChange = (page) => {
    fetchPrograms(page, searchTerm, false);
  };

  const openModal = (program) => {
    setSelectedProgram(program);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedProgram(null);
    setShowModal(false);
  };

  const handleDelete = async (uuid) => {
    if (!confirm("Are you sure you want to delete this program?")) {
      return;
    }

    try {
      setDeleting(uuid);
      const response = await axios.delete(`${server_url}/programs/${uuid}`, {
        headers: headers,
      });

      if (response.status === 200 || response.status === 204) {
        // Refresh the list
        fetchPrograms(currentPage, searchTerm, false);
      } else {
        alert("Failed to delete program");
      }
    } catch (error) {
      console.error("Error deleting program:", error);
      alert("Error deleting program");
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
              Programs Applications
            </h1>
            <p className="mt-2 text-gray-600">
              Manage and explore program applications
            </p>
          </div>
          {userDetails?.role === "Admin" && (
            <Link
              href="/programsApplications/new"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <BsPlus className="text-lg" />
              Add Program
            </Link>
          )}
        </div>
      </div>

      {/* Results Count and Search */}
      <div className="flex justify-between items-center">
        <div className="mb-4 text-gray-600">
          Showing {programs.length} of {totalCount} programs
        </div>
        <div className="mb-6">
          <div className="flex-1 relative max-w-md">
            {searchLoading ? (
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <BsSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            )}
            <input
              type="text"
              placeholder="Search programs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-boxdark/30 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Programs Grid */}
      {programs.length === 0 ? (
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
            No programs found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new program.
          </p>
          {userDetails?.role === "Admin" && (
            <div className="mt-6">
              <Link
                href="/programsApplications/new"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <BsPlus className="text-lg" />
                Add Program
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {programs.map((program) => (
            <div
              key={program.uuid}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => openModal(program)}
            >
              {/* Image */}
              {program.image && (
                <div className="h-48 bg-gray-200 overflow-hidden">
                  <img
                    src={program.image}
                    alt={program.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Content */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {program.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {program.description}
                </p>

                {/* Actions */}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    {new Date(program.createdAt).toLocaleDateString()}
                  </span>
                  {userDetails?.role === "Admin" && (
                    <div className="flex gap-2">
                      <Link
                        href={`/programsApplications/${program.uuid}/edit`}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <BsPencil className="text-sm" />
                      </Link>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(program.uuid);
                        }}
                        disabled={deleting === program.uuid}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {deleting === program.uuid ? (
                          <div className="w-4 h-4">
                            <Spinner />
                          </div>
                        ) : (
                          <BsTrash className="text-sm" />
                        )}
                      </button>
                    </div>
                  )}
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
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-black/20 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    : "text-gray-500 bg-white border border-black/20 hover:bg-gray-50"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-black/20 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </nav>
        </div>
      )}

      {/* Modal */}
      {showModal && selectedProgram && (
        <div className="fixed inset-0 z-99 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white z-99 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-boxdark/10 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                Program Details
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              {/* Image */}
              {selectedProgram.image && (
                <div className="mb-6">
                  <img
                    src={selectedProgram.image}
                    alt={selectedProgram.title}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
              )}

              {/* Title */}
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {selectedProgram.title}
              </h1>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Description
                </h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {selectedProgram.description}
                </p>
              </div>

              {/* Created Date */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Created
                </h3>
                <p className="text-gray-600">
                  {new Date(selectedProgram.createdAt).toLocaleString()}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                {selectedProgram.url && (
                  <a
                    href={selectedProgram.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  >
                    View Details →
                  </a>
                )}

                {userDetails?.role === "Admin" && (
                  <>
                    <Link
                      href={`/programsApplications/${selectedProgram.uuid}/edit`}
                      className="inline-flex items-center justify-center px-6 py-3 border border-black/20 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                    >
                      <BsPencil className="mr-2" />
                      Edit Program
                    </Link>

                    <button
                      onClick={() => {
                        closeModal();
                        handleDelete(selectedProgram.uuid);
                      }}
                      disabled={deleting === selectedProgram.uuid}
                      className="inline-flex items-center justify-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {deleting === selectedProgram.uuid ? (
                        <>
                          <Spinner />
                          <span className="ml-2">Deleting...</span>
                        </>
                      ) : (
                        <>
                          <BsTrash className="mr-2" />
                          Delete Program
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgramsApplications;
