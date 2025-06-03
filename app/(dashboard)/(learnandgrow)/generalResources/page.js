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
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Welcome back {userDetails.name}!</h1>
        <Link
          href={"/uploadMaterial/document"}
          className="text-white bg-primary py-2 px-3 cursor-pointer rounded"
        >
          Add Material
        </Link>
      </div>
      <div className="bg-primary/10 p-6 rounded-xl mb-4 mt-4">
        <p>
          Welcome to your one-stop hub for actionable tools , templates , guides
          , and learning materials. Whether you're validating an idea, scaling
          your business , or preparing for investment, these resources are
          designed to support every stage of your entrepreneurial journey .
        </p>
      </div>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold">Finance and fundraising</h1>
          <div className="grid grid-cols-4 gap-4 pt-4">
            {[
              {
                icon: "/discussion.avif",
                label: "Financing Planning",
                description: `This course equips entrepreneurs and business managers with the tools to manage cash flow, make informed decisions, and ensure financial sustainability`,
                path: `/generalResources`,
              },
              {
                icon: "/discussion.avif",
                label: "Financial Management",
                description: `This course equips entrepreneurs and business managers with the tools to manage cash flow, make informed decisions, and ensure financial sustainability`,
                path: `/generalResources`,
              },
              {
                icon: "/discussion.avif",
                label: "Financial Planning",
                description: `This course equips entrepreneurs and business managers with the tools to manage cash flow, make informed decisions, and ensure financial sustainability`,
                path: `/generalResources`,
              },
              {
                icon: "/discussion.avif",
                label: "Financial Management",
                description: `This course equips entrepreneurs and business managers with the tools to manage cash flow, make informed decisions, and ensure financial sustainability`,
                path: `/generalResources`,
              },
            ].map((item) => {
              return (
                <Link
                  key={item.label}
                  href={item.path}
                  className="border border-black/10 bg-white rounded-lg p-5 flex flex-col items-center  space-y-4"
                >
                  <img className="h-48" src={item.icon} />
                  <div>
                    <h1 className="font-bold text-lg">{item.label}</h1>
                    <p>{item.description}</p>
                    <button className="bg-primary px-4 py-2 rounded-lg text-white mt-2">
                      Access Material
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
        <div>
          <h1 className="text-xl font-bold">Marketing & Sales</h1>
          <div className="grid grid-cols-4 gap-4 pt-4">
            {[
              {
                icon: "/discussion.avif",
                label: "Financing Planning",
                description: `This course equips entrepreneurs and business managers with the tools to manage cash flow, make informed decisions, and ensure financial sustainability`,
                path: `/generalResources`,
              },
              {
                icon: "/discussion.avif",
                label: "Financial Management",
                description: `This course equips entrepreneurs and business managers with the tools to manage cash flow, make informed decisions, and ensure financial sustainability`,
                path: `/generalResources`,
              },
              {
                icon: "/discussion.avif",
                label: "Financial Planning",
                description: `This course equips entrepreneurs and business managers with the tools to manage cash flow, make informed decisions, and ensure financial sustainability`,
                path: `/generalResources`,
              },
              {
                icon: "/discussion.avif",
                label: "Financial Management",
                description: `This course equips entrepreneurs and business managers with the tools to manage cash flow, make informed decisions, and ensure financial sustainability`,
                path: `/generalResources`,
              },
            ].map((item) => {
              return (
                <Link
                  key={item.label}
                  href={item.path}
                  className="border border-black/10 bg-white rounded-lg p-5 flex flex-col items-center  space-y-4"
                >
                  <img className="h-48" src={item.icon} />
                  <div>
                    <h1 className="font-bold text-lg">{item.label}</h1>
                    <p>{item.description}</p>
                    <button className="bg-primary px-4 py-2 rounded-lg text-white mt-2">
                      Access Material
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
        <div>
          <h1 className="text-xl font-bold">Technology & Innovation</h1>
          <div className="grid grid-cols-4 gap-4 pt-4">
            {[
              {
                icon: "/discussion.avif",
                label: "Financing Planning",
                description: `This course equips entrepreneurs and business managers with the tools to manage cash flow, make informed decisions, and ensure financial sustainability`,
                path: `/generalResources`,
              },
              {
                icon: "/discussion.avif",
                label: "Financial Management",
                description: `This course equips entrepreneurs and business managers with the tools to manage cash flow, make informed decisions, and ensure financial sustainability`,
                path: `/generalResources`,
              },
              {
                icon: "/discussion.avif",
                label: "Financial Planning",
                description: `This course equips entrepreneurs and business managers with the tools to manage cash flow, make informed decisions, and ensure financial sustainability`,
                path: `/generalResources`,
              },
              {
                icon: "/discussion.avif",
                label: "Financial Management",
                description: `This course equips entrepreneurs and business managers with the tools to manage cash flow, make informed decisions, and ensure financial sustainability`,
                path: `/generalResources`,
              },
            ].map((item) => {
              return (
                <Link
                  key={item.label}
                  href={item.path}
                  className="border border-black/10 bg-white rounded-lg p-5 flex flex-col items-center  space-y-4"
                >
                  <img className="h-48" src={item.icon} />
                  <div>
                    <h1 className="font-bold text-lg">{item.label}</h1>
                    <p>{item.description}</p>
                    <button className="bg-primary px-4 py-2 rounded-lg text-white mt-2">
                      Access Material
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
        <div>
          <h1 className="text-xl font-bold">
            Leadership & Personal Development
          </h1>
          <div className="grid grid-cols-4 gap-4 pt-4">
            {[
              {
                icon: "/discussion.avif",
                label: "Financing Planning",
                description: `This course equips entrepreneurs and business managers with the tools to manage cash flow, make informed decisions, and ensure financial sustainability`,
                path: `/generalResources`,
              },
              {
                icon: "/discussion.avif",
                label: "Financial Management",
                description: `This course equips entrepreneurs and business managers with the tools to manage cash flow, make informed decisions, and ensure financial sustainability`,
                path: `/generalResources`,
              },
              {
                icon: "/discussion.avif",
                label: "Financial Planning",
                description: `This course equips entrepreneurs and business managers with the tools to manage cash flow, make informed decisions, and ensure financial sustainability`,
                path: `/generalResources`,
              },
              {
                icon: "/discussion.avif",
                label: "Financial Management",
                description: `This course equips entrepreneurs and business managers with the tools to manage cash flow, make informed decisions, and ensure financial sustainability`,
                path: `/generalResources`,
              },
            ].map((item) => {
              return (
                <Link
                  key={item.label}
                  href={item.path}
                  className="border border-black/10 bg-white rounded-lg p-5 flex flex-col items-center  space-y-4"
                >
                  <img className="h-48" src={item.icon} />
                  <div>
                    <h1 className="font-bold text-lg">{item.label}</h1>
                    <p>{item.description}</p>
                    <button className="bg-primary px-4 py-2 rounded-lg text-white mt-2">
                      Access Material
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
        <div>
          <h1 className="text-xl font-bold">Impact & Sustainability</h1>
          <div className="grid grid-cols-4 gap-4 pt-4">
            {[
              {
                icon: "/discussion.avif",
                label: "Financing Planning",
                description: `This course equips entrepreneurs and business managers with the tools to manage cash flow, make informed decisions, and ensure financial sustainability`,
                path: `/generalResources`,
              },
              {
                icon: "/discussion.avif",
                label: "Financial Management",
                description: `This course equips entrepreneurs and business managers with the tools to manage cash flow, make informed decisions, and ensure financial sustainability`,
                path: `/generalResources`,
              },
              {
                icon: "/discussion.avif",
                label: "Financial Planning",
                description: `This course equips entrepreneurs and business managers with the tools to manage cash flow, make informed decisions, and ensure financial sustainability`,
                path: `/generalResources`,
              },
              {
                icon: "/discussion.avif",
                label: "Financial Management",
                description: `This course equips entrepreneurs and business managers with the tools to manage cash flow, make informed decisions, and ensure financial sustainability`,
                path: `/generalResources`,
              },
            ].map((item) => {
              return (
                <Link
                  key={item.label}
                  href={item.path}
                  className="border border-black/10 bg-white rounded-lg p-5 flex flex-col items-center  space-y-4"
                >
                  <img className="h-48" src={item.icon} />
                  <div>
                    <h1 className="font-bold text-lg">{item.label}</h1>
                    <p>{item.description}</p>
                    <button className="bg-primary px-4 py-2 rounded-lg text-white mt-2">
                      Access Material
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
        <div>
          <h1 className="text-xl font-bold">Legal & Compliance</h1>
          <div className="grid grid-cols-4 gap-4 pt-4">
            {[
              {
                icon: "/discussion.avif",
                label: "Financing Planning",
                description: `This course equips entrepreneurs and business managers with the tools to manage cash flow, make informed decisions, and ensure financial sustainability`,
                path: `/generalResources`,
              },
              {
                icon: "/discussion.avif",
                label: "Financial Management",
                description: `This course equips entrepreneurs and business managers with the tools to manage cash flow, make informed decisions, and ensure financial sustainability`,
                path: `/generalResources`,
              },
              {
                icon: "/discussion.avif",
                label: "Financial Planning",
                description: `This course equips entrepreneurs and business managers with the tools to manage cash flow, make informed decisions, and ensure financial sustainability`,
                path: `/generalResources`,
              },
              {
                icon: "/discussion.avif",
                label: "Financial Management",
                description: `This course equips entrepreneurs and business managers with the tools to manage cash flow, make informed decisions, and ensure financial sustainability`,
                path: `/generalResources`,
              },
            ].map((item) => {
              return (
                <Link
                  key={item.label}
                  href={item.path}
                  className="border border-black/10 bg-white rounded-lg p-5 flex flex-col items-center  space-y-4"
                >
                  <img className="h-48" src={item.icon} />
                  <div>
                    <h1 className="font-bold text-lg">{item.label}</h1>
                    <p>{item.description}</p>
                    <button className="bg-primary px-4 py-2 rounded-lg text-white mt-2">
                      Access Material
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
