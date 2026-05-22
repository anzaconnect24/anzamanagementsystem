"use client";
import { useState, useEffect, useContext } from "react";

import Link from "@/utils/link";
import axios from "axios";
import { server_url } from "@/utils/endpoint";
import { headers } from "@/utils/headers";
import { BsArrowLeft, BsPencil, BsTrash } from "react-icons/bs";
import Spinner from "@/components/spinner";
import { UserContext } from "../../../layouts/DashboardLayout";
import { useRouter } from "../../../utils/navigation";
import { useParams } from "react-router-dom";

const ProgramDetails = () => {
  const { uuid } = useParams();
  const router = useRouter();
  const { userDetails } = useContext(UserContext);
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchProgram = async () => {
      try {
        const response = await axios.get(`${server_url}/programs/${uuid}`, {
          headers: headers,
        });

        if (response.data.status) {
          setProgram(response.data.body);
        } else {
          alert("Failed to fetch program details");
          router.push("/programsApplications");
        }
      } catch (error) {
        console.error("Error fetching program:", error);
        alert("Error fetching program details");
        router.push("/programsApplications");
      } finally {
        setLoading(false);
      }
    };

    if (uuid) {
      fetchProgram();
    }
  }, [uuid, router]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this program?")) {
      return;
    }

    try {
      setDeleting(true);
      const response = await axios.delete(`${server_url}/programs/${uuid}`, {
        headers: headers,
      });

      if (response.status === 200 || response.status === 204) {
        router.push("/programsApplications");
      } else {
        alert("Failed to delete program");
      }
    } catch (error) {
      console.error("Error deleting program:", error);
      alert("Error deleting program");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Program Not Found
          </h2>
          <Link
            href="/programsApplications"
            className="text-blue-600 hover:text-blue-800"
          >
            Back to Programs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/programsApplications"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
        >
          <BsArrowLeft />
          Back to Programs
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {program.title}
            </h1>
            <p className="mt-2 text-gray-600">
              Created on {new Date(program.createdAt).toLocaleDateString()}
            </p>
          </div>
          {userDetails?.role === "Admin" && (
            <div className="flex gap-3">
              <Link
                href={`/programsApplications/${program.uuid}/edit`}
                className="inline-flex items-center gap-2 px-4 py-2 border border-black/20 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                <BsPencil />
                Edit
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? (
                  <>
                    <Spinner />
                    Deleting...
                  </>
                ) : (
                  <>
                    <BsTrash />
                    Delete
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Image */}
        {program.image && (
          <div className="h-64 bg-gray-200 overflow-hidden">
            <img
              src={program.image}
              alt={program.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-6">
          {/* Description */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Description
            </h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {program.description}
            </p>
          </div>

          {/* External URL */}
          {program.url && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                External Link
              </h2>
              <a
                href={program.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
              >
                View External Details →
              </a>
            </div>
          )}

          {/* Metadata */}
          <div className="border-t border-black/10 pt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Program Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="font-medium text-gray-600">Created:</span>
                <p className="text-gray-900">
                  {new Date(program.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Last Updated:</span>
                <p className="text-gray-900">
                  {new Date(program.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        {program.url && (
          <a
            href={program.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-6 py-3 bg-[#082d77] text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            View External Details →
          </a>
        )}

        <Link
          href="/programsApplications"
          className="inline-flex items-center justify-center px-6 py-3 border border-black/20 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
        >
          Back to Programs List
        </Link>
      </div>
    </div>
  );
};

export default ProgramDetails;
