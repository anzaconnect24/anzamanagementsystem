"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getPrograms } from "@/controllers/program_controller";
import Link from "@/utils/link";
import Image from "@/utils/image";
import Loader from "@/components/common/Loader";

const fallbackImage = "/images/ideation-classes.svg";

const defaultProgram = {
  title: "Course Title",
  description:
    "A practical course designed to help learners build useful skills and apply them confidently.",
  image: fallbackImage,
  lessons_count: 0,
  duration: "Flexible Learning",
  status: "Available",
  category: "General",
  enrolled_count: 0,
  rating: "0.0",
  about:
    "This course provides structured learning content, practical examples, and clear guidance to help learners apply knowledge in real-world situations.",
  benefits: ["Lifetime access", "Certificate of completion"],
};

const normaliseProgram = (program) => {
  if (!program) return null;

  return {
    ...defaultProgram,
    ...program,
    image: program.image || fallbackImage,
    lessons_count: program.lessons_count || program.modules_count || 0,
    duration: program.duration || "Flexible Learning",
    category: program.category || program.course || defaultProgram.category,
    enrolled_count: program.enrolled_count || program.enrollments_count || 0,
    rating: program.rating || "0.0",
    about: program.about || program.description || defaultProgram.about,
    benefits:
      Array.isArray(program.benefits) && program.benefits.length > 0
        ? program.benefits
        : defaultProgram.benefits,
  };
};

const CourseDetailsPage = () => {
  const { uuid } = useParams();

  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProgram = async () => {
      if (!uuid) {
        setProgram(null);
        setError("Course identifier is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await getPrograms(1, 100);
        const programs = Array.isArray(response?.data) ? response.data : [];

        const selectedProgram = programs.find((item) => item.uuid === uuid);

        if (!selectedProgram) {
          setProgram(null);
          setError("Course not found.");
          return;
        }

        setProgram(normaliseProgram(selectedProgram));
      } catch (error) {
        console.error("Failed to load course details:", error);
        setProgram(null);
        setError("Unable to load course details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadProgram();
  }, [uuid]);

  const courseStats = useMemo(() => {
    if (!program) return [];

    return [
      { icon: "👥", label: "Enrolled", value: program.enrolled_count },
      { icon: "📖", label: "Lessons", value: program.lessons_count },
      { icon: "⭐", label: "Rating", value: program.rating },
      { icon: "🕒", label: "Duration", value: program.duration },
    ];
  }, [program]);

  if (loading) return <Loader />;

  if (!program) {
    return (
      <div className="min-h-screen px-6 py-6">
        <div className="mx-auto max-w-7xl rounded-2xl border border-[#EAECF0] bg-white p-6 shadow-sm">
          <p className="text-sm text-[#667085]">
            {error || "Course not found."}
          </p>

          <Link
            href="/dashboard/classRooms"
            className="mt-5 inline-flex rounded-md bg-[#2563eb] px-4 py-2 text-xs font-medium text-white hover:bg-[#1d4ed8]"
          >
            Back to Classes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-6">
      <div className="mx-auto max-w-7xl">
        <section className="relative mb-8 min-h-[300px] overflow-hidden rounded-3xl border border-[#EAECF0] bg-black shadow-sm">
          <Image
            src={program.image || fallbackImage}
            alt={program.title}
            width={1400}
            height={600}
            className="absolute inset-0 h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/20" />
          <div className="absolute inset-0 bg-black/20" />

          <div className="relative z-10 flex min-h-[300px] max-w-3xl flex-col justify-center p-6 text-white lg:p-10">
            <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-[#F59E0B]" />
              {program.category} Course
            </span>

            <h1 className="mb-4 text-3xl font-bold leading-tight tracking-tight text-white md:text-3xl">
              {program.title}
            </h1>

            <p className="mb-6 max-w-2xl text-sm leading-7 text-white/85 md:text-base">
              {program.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-white/90">
              <span>👥 {program.enrolled_count} Enrolled</span>
              <span>📖 {program.lessons_count} Lessons</span>
              <span>🕒 {program.duration}</span>
            </div>
          </div>
        </section>

        <section className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {courseStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-[#EAECF0] bg-white p-5 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#EEF4FF] text-xl">
                {stat.icon}
              </div>

              <div className="text-2xl font-bold text-[#101828]">
                {stat.value}
              </div>

              <div className="mt-1 text-xs font-medium text-[#667085]">
                {stat.label}
              </div>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
          <section className="rounded-3xl border border-[#EAECF0] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF4FF] text-xl">
                ℹ️
              </div>

              <h2 className="text-2xl font-bold tracking-tight text-[#101828]">
                About this course
              </h2>
            </div>

            <p className="max-w-4xl whitespace-pre-line text-sm leading-7 text-[#475467]">
              {program.about}
            </p>
          </section>

          <aside className="rounded-3xl border border-[#EAECF0] bg-white p-5 shadow-sm">
            <h3 className="mb-5 text-xl font-bold text-[#101828]">
              What you’ll get
            </h3>

            <div className="space-y-4">
              {program.benefits.map((benefit, index) => (
                <div
                  key={`${benefit}-${index}`}
                  className="flex items-center gap-3 border-b border-[#EAECF0] pb-4 last:border-b-0"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EEF4FF] text-sm text-indigo-700">
                    {index === 0 && "∞"}
                    {index === 1 && "📜"}
                    {index === 2 && "↓"}
                    {index === 3 && "✦"}
                    {index > 3 && "✓"}
                  </div>

                  <span className="text-xs font-medium text-[#475467]">
                    {benefit}
                  </span>
                </div>
              ))}
            </div>

            <Link
              href={`/dashboard/modules/${program.uuid}`}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2563EB] px-4 py-3 text-center text-xs font-semibold text-white shadow-md transition hover:bg-[#1D4ED8]"
            >
              Enroll Now
              <span className="text-base">→</span>
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailsPage;