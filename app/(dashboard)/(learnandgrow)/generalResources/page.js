"use client";

import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Loader from "@/components/common/Loader";
import { UserContext } from "@/app/(dashboard)/layout";
import { getDocuments } from "@/app/controllers/pitch_material_controller";
import Image from "next/image";

const Page = ({ params }) => {
  const { uuid } = params;
  const { userDetails } = useContext(UserContext);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  useEffect(() => {
    setLoading(true);
    getDocuments()
      .then((res) => {
        console.log(res);
        setData(res);
      })
      .finally(() => setLoading(false));
  }, []);

  // Define categories
  const categories = [
    "Finance and Fundraising",
    "Marketing & Sales",
    "Technology & Innovation",
    "Leadership & Personal Development",
    "Impact & Sustainability",
    "Legal & Compliance",
  ];

  // Group documents by category
  const groupedDocuments = categories.reduce((acc, category) => {
    acc[category] = data.filter((doc) => doc.category === category);
    return acc;
  }, {});

  return loading ? (
    <Loader />
  ) : (
    <div>
      {/* Stats Section - Full Width */}
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Welcome back {userDetails.name}!</h1>
        {["Admin"].includes(userDetails.role) && (
          <Link
            href={"/uploadMaterial/document"}
            className="text-white bg-primary py-2 px-3 cursor-pointer rounded"
          >
            Add Material
          </Link>
        )}
      </div>
      <div className="bg-primary/10 p-6 rounded-xl mb-4 mt-4">
        <p>
          Welcome to your one-stop hub for actionable tools, templates, guides,
          and learning materials. Whether you're validating an idea, scaling
          your business, or preparing for investment, these resources are
          designed to support every stage of your entrepreneurial journey.
        </p>
      </div>
      <div className="space-y-6">
        {categories.map((category) => (
          <div key={category}>
            <h1 className="text-xl font-bold">{category}</h1>
            <div className="grid grid-cols-4 gap-4 pt-4">
              {groupedDocuments[category]?.length > 0 ? (
                groupedDocuments[category].map((item) => (
                  <Link
                    key={item.id}
                    target="_blank"
                    href={item.materialUrl || "/generalResources"}
                    className="border border-black/10 bg-white rounded-lg p-5 flex flex-col items-start space-y-4"
                  >
                    <Image
                      width={"1000"}
                      height={"1000"}
                      className="h-48"
                      src={item.thumbnailUrl || "/discussion.avif"}
                      alt={item.fileName}
                    />
                    <div>
                      <h1 className="font-bold text-lg">{item.fileName}</h1>
                      <p>{item.description}</p>
                      <button className="bg-primary px-4 py-2 rounded-lg text-white mt-2">
                        Access Material
                      </button>
                    </div>
                  </Link>
                ))
              ) : (
                <p>No materials available in this category.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Page;
