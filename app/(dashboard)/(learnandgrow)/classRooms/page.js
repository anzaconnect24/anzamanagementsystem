"use client";

import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Loader from "@/components/common/Loader";
import { UserContext } from "@/app/(dashboard)/layout";

const Page = ({ params }) => {
  const { uuid } = params;
  const { userDetails } = useContext(UserContext);
  const [loading, setLoading] = useState(false);

  return loading ? (
    <Loader />
  ) : (
    <div>
      {/* Stats Section - Full Width */}
      <h1 className="text-2xl font-bold">Welcome back {userDetails.name}!</h1>
      <div className="bg-primary/10 p-6 rounded-xl mb-4 mt-4">
        <p>
          Track your progress , access curated courses , and grow your business
          step by step. Whether you're just starting out with an idea or y
          activel scaling your venture, this platform is designed to guide you
          through every stage of your entrepreneurial journey . Monitor your
          learning milestones , enroll in tailored classes that match your
          business stage, and unlock practical tools , ex pert insights , and
          mentorship opportunities. With each completed module, you’ll build
          stronger foundations sharpen your strategy , and move closer to
          achieving your business goals. Let’s grow—one step at a time.
        </p>
      </div>
      <h1 className="text-xl font-bold">Availbale classes</h1>

      <div className="grid grid-cols-3 gap-6 pt-4">
        {[
          {
            icon: "/discussion.avif",
            label: "Ideation",
            description: `This course equips entrepreneurs and business managers with the tools to manage cash flow, make informed decisions, and ensure financial sustainability`,
            path: `/classRooms`,
          },
          {
            icon: "/discussion.avif",
            label: "Business Foundation",
            description: `This course equips entrepreneurs and business managers with the tools to manage cash flow, make informed decisions, and ensure financial sustainability`,
            path: `/classRooms`,
          },
          {
            icon: "/discussion.avif",
            label: "Investment readiness",
            description: `This course equips entrepreneurs and business managers with the tools to manage cash flow, make informed decisions, and ensure financial sustainability`,
            path: `/classRooms`,
          },
        ].map((item) => {
          return (
            <Link
              key={item.label}
              href={item.path}
              className="border border-black/10 bg-white rounded-lg p-5 flex flex-col items-center  "
            >
              <img className="h-48" src={item.icon} />
              <div>
                <h1 className="font-bold text-lg">{item.label}</h1>
                <p className="mb-4">{item.description}</p>
                <Link
                  href={`/modules/${encodeURIComponent(item.label)}`}
                  className="bg-primary px-4 py-2 rounded-lg text-white mt-2"
                >
                  Access Classes
                </Link>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Page;
