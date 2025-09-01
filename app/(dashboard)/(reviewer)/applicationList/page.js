"use client";

import { useRouter } from "next/navigation"; // Import useRouter for navigation
import { useState, useEffect } from "react";
import Modal2 from "@/components/Model2"; // Assuming you're using the same Modal2 component as before
import toast from "react-hot-toast";
import Link from "next/link";
import { getApplicationList } from "@/app/controllers/crat_reviewer_controller"; // Import updated API functions
import { useTranslation } from "../../../locales";

const Page = () => {
  const { t } = useTranslation();
  const [publishModalOpen, setPublishModalOpen] = useState(false); // State for publish confirmation modal
  const [publishMessage, setPublishMessage] = useState(""); // Message for the publish modal
  const [data, setData] = useState([]); // State to hold the fetched data
  const router = useRouter(); // Initialize the router for navigation

  const tableHeaders = [
    t("common.name", "Name"),
    t("reviewer.readiness", "Readiness"),
    t("common.status", "Status"),
    t("reviewer.reviewNo", "Review No."),
    t("common.actions", "Actions"),
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const responseData = await getApplicationList();
        console.log(responseData);
        if (responseData && responseData.length > 0) {
          setData(responseData); // Store fetched data in state
        } else {
          // Handle empty response or no data scenario
          setData([]);
        }
      } catch (error) {
        console.log("Error fetching data:", error);
      }
    };

    fetchData(); // Fetch data on page load
  }, []);

  const renderTableHeaders = () => (
    <div className="grid grid-cols-5 border-b border-stroke py-4 px-4 dark:border-strokedark">
      {tableHeaders.map((header, index) => (
        <div key={index} className="flex items-center px-2">
          <p className="text-sm text-black dark:text-white font-semibold">
            {header}
          </p>
        </div>
      ))}
    </div>
  );

  const handlePublishClick = (name) => {
    setPublishMessage(
      t(
        "reviewer.confirmPublish",
        "Are you sure you want to publish {{name}}?",
        { name }
      )
    );
    setPublishModalOpen(true);
  };

  const handlePublishConfirm = () => {
    setPublishModalOpen(false);
    toast.success(
      t("reviewer.publishedSuccessfully", "Successfully published!")
    );
  };

  const handlePublishCancel = () => {
    setPublishModalOpen(false);
  };

  const handlePreviewClick = (item) => {
    sessionStorage.setItem("selectedRowData", JSON.stringify(item));
    router.push("/previewPage");
  };

  const renderTableRows = () => {
    return data.map((item, index) => (
      <div
        className="grid grid-cols-5 border-t border-stroke py-4 px-4 dark:border-strokedark"
        key={index}
      >
        <div className="flex items-center px-2">
          <p className="text-sm text-black dark:text-white">{item.name}</p>
        </div>
        <div className="flex items-center px-2">
          <p className="text-sm text-black dark:text-white">
            {item.totalPercentage}%
          </p>
        </div>
        <div className="flex items-center px-2">
          <p className="text-sm text-black dark:text-white">{item.readiness}</p>
        </div>
        <div className="flex items-center px-2">
          <p className="text-sm text-black dark:text-white">
            {item.reviewCount}
          </p>
        </div>
        <div className="flex items-center px-2 gap-2">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded"
            onClick={() => handlePreviewClick(item)}
          >
            {t("reviewer.preview", "Preview")}
          </button>
        </div>
      </div>
    ));
  };

  return (
    <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="py-6 px-4 md:px-6 xl:px-7.5">
        <h4 className="text-xl font-semibold text-black dark:text-white">
          {t("reviewer.cratApplications", "CRAT Applications")}
        </h4>
      </div>
      <div className="p-4">
        {renderTableHeaders()}
        {renderTableRows()}
      </div>

      <Modal2
        isOpen={publishModalOpen}
        onClose={handlePublishCancel}
        message={publishMessage}
        onDelete={handlePublishConfirm} // Reuse the onDelete prop for confirmation
        onCancel={handlePublishCancel}
        bgColor="yellow-200"
        closeButtonText={t("common.cancel", "Cancel")}
        deleteButtonText={t("reviewer.publish", "Publish")}
        closeButtonColor="gray-500"
        deleteButtonColor="green-500"
      />
    </div>
  );
};

export default Page;
