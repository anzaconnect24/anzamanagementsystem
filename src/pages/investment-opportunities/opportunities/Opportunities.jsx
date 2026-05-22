"use client";

import { useState, useEffect, useContext } from "react";
import Link from "@/utils/link";
import axios from "axios";
import { server_url } from "@/utils/endpoint";
import { headers } from "@/utils/headers";
import { BsTrash, BsPencil, BsPlus } from "react-icons/bs";
import {
  FaLayerGroup,
  FaStar,
  FaMoneyBillWave,
  FaTag,
  FaClock,
} from "react-icons/fa";
import Spinner from "@/components/spinner";
import { UserContext } from "../../../layouts/DashboardLayout";

const InvestmentOpportunities = () => {
  const { userDetails } = useContext(UserContext);

  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${server_url}/investment-opportunities`,
        { params: { page: 1, limit: 8 }, headers }
      );

      if (response.data.status) {
        setOpportunities(response.data.body.data || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const handleDelete = async (uuid) => {
    if (!confirm("Delete this opportunity?")) return;

    try {
      setDeleting(uuid);

      await axios.delete(`${server_url}/investment-opportunities/${uuid}`, {
        headers,
      });

      fetchOpportunities();
    } catch (error) {
      console.error(error);
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-4">
      {/* Hero */}
      <div className="relative mb-10 min-h-[320px] overflow-hidden rounded-2xl bg-black shadow-sm">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('${
              opportunities[0]?.image || "/images/business-tools-hero.jpg"
            }')`,
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-[#c9672b]/30" />

        <div className="relative z-10 max-w-3xl p-10 text-white">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-sm font-medium shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#f08a3c]" />
            Funding Hub
          </span>

          <h2 className="mb-3 text-4xl font-bold leading-tight drop-shadow-lg">
            Investment Opportunities
          </h2>

          <p className="mb-6 max-w-3xl text-lg leading-relaxed text-white/85 drop-shadow-md">
            Discover curated funding options across equity, grants, debt
            financing, and growth capital. These opportunities are designed to
            help entrepreneurs access capital, scale operations, and unlock new
            market potential.
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-white/85">
            <span className="flex items-center gap-2">
              <FaLayerGroup />
              {opportunities.length} Opportunities
            </span>

            <span className="flex items-center gap-2">
              <FaMoneyBillWave />
              Investment Ready
            </span>

            <span className="flex items-center gap-2">
              <FaClock />
              Growth Support
            </span>
          </div>
        </div>
      </div>

      {/* Section Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-[#172033]">
          Available Opportunities
        </h2>

        {userDetails?.role === "Admin" && (
          <Link
            href="/dashboard/opportunities/new"
            className="inline-flex items-center gap-2 rounded-lg bg-[#082d77] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md active:scale-[0.98]"
          >
            <BsPlus className="text-lg" />
            Add Opportunity
          </Link>
        )}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {opportunities.map((opportunity) => (
          <div
            key={opportunity.uuid}
            className="group cursor-pointer overflow-hidden rounded-xl bg-white shadow-md transition duration-200 hover:scale-[1.02] hover:shadow-lg"
          >
            <div className="relative h-48 overflow-hidden bg-black">
              <img
                src={opportunity.image || "/images/business-tool-card.jpg"}
                alt={opportunity.title || "Investment opportunity"}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            </div>

            <div className="p-4">
              <h3 className="mb-2 line-clamp-1 text-base font-bold text-[#111827]">
                {opportunity.title}
              </h3>

              <p className="mb-6 line-clamp-3 text-sm text-[#6f6f72]">
                {opportunity.description ||
                  "Explore this investment opportunity designed to support business growth and access to funding."}
              </p>

              <div className="flex items-center justify-between border-t border-black/10 pt-4 text-xs text-[#8a8f98]">
                <span className="flex items-center gap-1">
                  <FaMoneyBillWave />
                  Investment
                </span>

                <span className="flex items-center gap-1">
                  <FaTag />
                  {opportunity.investmentType || "Type"}
                </span>

                {userDetails?.role === "Admin" ? (
                  <div className="flex gap-4">
                    <Link
                      href={`/dashboard/opportunities/${opportunity.uuid}/edit`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 text-green-600 hover:text-green-700"
                    >
                      <BsPencil />
                      Edit
                    </Link>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(opportunity.uuid);
                      }}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700"
                    >
                      {deleting === opportunity.uuid ? (
                        <Spinner />
                      ) : (
                        <BsTrash />
                      )}
                      Delete
                    </button>
                  </div>
                ) : (
                  <span className="flex items-center gap-1 text-[#f6b800]">
                    <FaStar />
                    0.0
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InvestmentOpportunities;