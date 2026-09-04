"use client";

import { useContext, useEffect, useState } from "react";
import Link from "@/utils/link";
import Image from "@/utils/image";
import Loader from "@/components/common/Loader";
import toast from "react-hot-toast";
import { useTranslation } from "@/locales";
import { UserContext } from "../../../layouts/DashboardLayout";
import { getModules } from "@/controllers/modules_controller";
import {
  FaLayerGroup,
  FaClock,
  FaGraduationCap,
  FaArrowRight,
} from "react-icons/fa";

const FALLBACK_IMAGE = "/images/ideation-classes.svg";

// Class Rooms lists the modules of the programme a startup is enrolled in.
// There is no course layer any more: a programme owns its modules directly,
// and each module owns its slides. The API filters by the caller's programme,
// so nothing needs to be filtered again here.
const ClassRooms = () => {
  const { userDetails } = useContext(UserContext);
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState([]);

  // "Staff" is stored as either "Staff" or "Reviewer" (see SignUp).
  const canAuthor = ["Admin", "Staff", "Reviewer"].includes(userDetails?.role);

  useEffect(() => {
    getModules({ page: 1, limit: 500 })
      .then((body) => {
        setModules(Array.isArray(body?.data) ? body.data : []);
      })
      .catch(() => {
        toast.error("Failed to load modules");
        setModules([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen px-6 py-4">
      {/* HERO */}
      <div className="relative mb-10 min-h-[200px] overflow-hidden rounded-2xl bg-black shadow-sm">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/mentor_hero.svg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-[#c9672b]/30" />

        <div className="relative z-10 max-w-3xl p-10 text-white">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-sm font-medium shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#f08a3c]" />
            {t("navigation.classRooms", "Class Rooms")}
          </span>

          <h2 className="mb-3 text-4xl font-bold leading-tight drop-shadow-lg">
            {t("learnAndGrow.availableModules", "Available Modules")}
          </h2>

          <div className="flex flex-wrap items-center gap-6 text-sm text-white/85">
            <span className="flex items-center gap-2">
              <FaLayerGroup />
              {modules.length} {modules.length === 1 ? "module" : "modules"}
            </span>

            <span className="flex items-center gap-2">
              <FaGraduationCap />
              Guided Learning
            </span>

            <span className="flex items-center gap-2">
              <FaClock />
              Flexible Learning
            </span>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-[#172033]">
          {t("learnAndGrow.availableModules", "Available Modules")}
        </h2>
      </div>

      {modules.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <FaGraduationCap className="mx-auto mb-3 text-3xl text-slate-300" />
          <p className="text-sm text-slate-500">
            {canAuthor
              ? "No modules yet. Add them from Program Management, where each module belongs to a program."
              : "No classes have been scheduled for the program in which you were enrolled."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((item) => (
            <Link
              key={item.uuid}
              href={`/dashboard/slides/${item.uuid}`}
              className="group flex min-h-[380px] flex-col overflow-hidden rounded-xl bg-white shadow-md transition duration-200 hover:scale-[1.01] hover:shadow-lg"
            >
              <div className="relative h-52 shrink-0 overflow-hidden bg-black">
                <Image
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  src={item.image || FALLBACK_IMAGE}
                  alt={item.title}
                  fill
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                <span className="absolute bottom-4 left-4 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 shadow-sm">
                  {item.Slides?.length || 0}{" "}
                  {item.Slides?.length === 1 ? "slide" : "slides"}
                </span>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <h3 className="mb-2 line-clamp-2 text-lg font-bold text-[#111827]">
                  {item.title}
                </h3>

                <p className="mb-6 line-clamp-3 flex-1 text-sm leading-6 text-[#6f6f72]">
                  {item.description || "No description provided."}
                </p>

                <div className="mt-auto flex items-center justify-between border-t border-black/10 pt-4 text-xs text-[#8a8f98]">
                  <span className="flex items-center gap-1">
                    <FaGraduationCap />
                    Module
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-green-700">
                    Open module <FaArrowRight />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClassRooms;
