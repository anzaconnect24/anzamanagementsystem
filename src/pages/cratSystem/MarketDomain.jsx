"use client";
import { useState, useEffect, useContext } from "react";
import DropdownTwo from "@/components/Dropdowns/DropdownTwo";
import ReactIcons from "@/components/icons/reactIcons";
import Modal from "@/components/Model";
import Modal2 from "@/components/Model2";
import toast from "react-hot-toast";
import Loader from "@/components/common/Loader";
import Spinner from "@/components/spinner";
import {
  getMarketData,
  createMarketData,
  attachDocument,
  deleteAttachment,
  getInitialDataTemplate,
  updateSingleMarketItem,
} from "@/controllers/crat_market_controller";
import { UserContext } from "@/layouts/DashboardLayout";
import { useTranslation } from "@/locales";

const tableHeaders = [
  "Sub Domain",
  "Question",
  "Rating",
  "Score",
  "Attachment",
  "Actions",
];

const Page = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const initialTemplate = getInitialDataTemplate(t); // build per-render (translations stable after hydration)
  // Backwards compatibility alias in case any deferred code still references initialDataTemplate
  const initialDataTemplate = initialTemplate;
  const [data, setData] = useState(initialTemplate);
  const [originalData, setOriginalData] = useState(initialTemplate);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [deletemodalOpen, deleteModalOpen] = useState(false);
  const [deletemodalMessage, deleteModalMessage] = useState("");
  const [deleteCache, setDeleteCache] = useState([]);
  const { userDetails, setUserDetails } = useContext(UserContext);
  const [uploading, setUploading] = useState({});

  useEffect(() => {
    console.log("then");

    const fetchData = async () => {
      try {
        const responseData = await getMarketData();
        console.log(responseData);
        if (!responseData || responseData.length === 0) {
          await createMarketData(initialTemplate);
          fetchData(); // Fetch again after creating market data
        } else {
          const updatedData = { ...initialTemplate };
          Object.keys(updatedData).forEach((section) => {
            updatedData[section] = updatedData[section].map((item) => {
              const fetchedItem = responseData.find(
                (dataItem) => dataItem.subDomain === item.subDomain,
              );
              return fetchedItem
                ? {
                    ...item,
                    uuid: fetchedItem.uuid,
                    rating: fetchedItem.rating,
                    score: fetchedItem.score,
                    userId: fetchedItem.userId,
                    attachment: fetchedItem.attachment,
                    comments: fetchedItem.comments,
                  }
                : item;
            });
          });
          setData(updatedData);
          setOriginalData(updatedData); // Set original data
        }
      } catch (error) {
        console.log("Error fetching data:", error);
      }
    };

    fetchData();
    setLoading(false);
  }, []);

  const handleRatingChange = async (section, index, newRating) => {
    const newData = { ...data };
    const current = newData[section][index];
    const score = newRating === "No" ? 0 : newRating === "Maybe" ? 1 : 2;
    if (newRating === "Yes" && !current.attachment) {
      setModalMessage(
        t(
          "crat.pleaseUploadAttachmentFirst",
          "Please upload an attachment first.",
        ),
      );
      setModalOpen(true);
      return; // abort persist
    }
    // Optimistic UI update
    current.rating = newRating;
    current.score = score;
    setData(newData);
    try {
      if (!current.uuid) {
        toast(
          t("crat.uuidMissingDeferredSave", "Record missing id; reload page."),
        );
        return;
      }
      await updateSingleMarketItem(current.uuid, {
        rating: newRating,
        score,
      });
      // sync originalData snapshot for this item
      setOriginalData((prev) => {
        const clone = { ...prev };
        clone[section] = clone[section].map((it, i) =>
          i === index ? { ...it, rating: newRating, score } : it,
        );
        return clone;
      });
      toast.success(
        t("crat.ratingUpdated", "Rating & score updated successfully"),
      );
    } catch (e) {
      toast.error(t("crat.updateFailed", "Failed to update rating"));
      // Revert UI on failure
      const revertData = { ...originalData };
      setData(revertData);
    }
  };

  // Removed legacy submitChanges flow; page now fully auto-saves.

  const handleAddFile = async (domain, file, userId) => {
    if (!file) return;

    // Extract the file extension
    const fileExtension = file.name.split(".").pop();

    // Append timestamp to the filename
    const timestamp = Date.now();
    const uniqueFileName = `${domain}_${timestamp}.${fileExtension}`;

    // Create a new file with the updated name
    const updatedFile = new File([file], uniqueFileName, { type: file.type });

    const fileData = {
      file: updatedFile, // Use the updated file
      subDomain: domain,
      userId: userId,
    };

    try {
      // set uploading state for this domain
      setUploading((s) => ({ ...s, [domain]: true }));
      await attachDocument(fileData);

      // Fetch updated data
      const responseData = await getMarketData();
      const updatedData = { ...initialTemplate };
      console.log("this is my res", responseData);

      Object.keys(updatedData).forEach((section) => {
        updatedData[section] = updatedData[section].map((item) => {
          const fetchedItem = responseData.find(
            (dataItem) => dataItem.subDomain === item.subDomain,
          );
          return fetchedItem
            ? {
                ...item,
                uuid: fetchedItem.uuid,
                rating: fetchedItem.rating,
                userId: fetchedItem.userId,
                score: fetchedItem.score,
                attachment: fetchedItem.attachment,
                comments: fetchedItem.comments,
              }
            : item;
        });
      });

      toast.success(t("crat.attachmentUploaded", "Attachment uploaded"));
      setData(updatedData);
      setUploading((s) => ({ ...s, [domain]: false }));
      // setChangesMade(true);
    } catch (error) {
      toast.error(t("crat.errorAttachingFile", "Error attaching file"));
      console.error("Error attaching file:", error);
      // clear uploading flag on error
      setUploading((s) => ({ ...s, [domain]: false }));
    }
  };

  const openDeleteDialog = (domain, id, attachment, section, index) => {
    console.log(domain, id, attachment, section, index);
    deleteModalOpen(true);
    deleteModalMessage(
      t("crat.confirmDelete", "Are you sure you want to delete?"),
    );
    setDeleteCache([domain, id, attachment, section, index]);
  };

  const handleDeleteFile = async () => {
    const [domain, id, attachment, section, index] = deleteCache;
    try {
      // Proceed with deletion directly
      await deleteAttachment(domain, id, attachment, section, index);
      // Update rating locally & persist (will also adjust score)
      await handleRatingChange(section, index, "No");
      // Fetch updated data
      const responseData = await getMarketData();
      const updatedData = { ...initialTemplate };

      Object.keys(updatedData).forEach((section) => {
        updatedData[section] = updatedData[section].map((item) => {
          const fetchedItem = responseData.find(
            (dataItem) => dataItem.subDomain === item.subDomain,
          );
          return fetchedItem
            ? {
                ...item,
                uuid: fetchedItem.uuid,
                rating: fetchedItem.rating,
                userId: fetchedItem.userId,
                score: fetchedItem.score,
                attachment: fetchedItem.attachment,
                comments: fetchedItem.comments,
              }
            : item;
        });
      });

      toast.success(t("crat.deletedSuccessfully", "Deleted successfully"));
      setData(updatedData);
      deleteModalOpen(false); // Close modal
    } catch (error) {
      toast.error(t("crat.errorDeletingFile", "Error deleting file"));
      console.error("Error deleting file:", error);
    }
  };

  const handleDeleteCancel = () => {
    // Close the delete modal without performing any action
    deleteModalOpen(false);
  };

  const handleViewFile = (attachment) => {
    window.open(`${attachment}`, "_blank");

    // const fileName = data[domain][index].attachment;
    // if (fileName) {
    //   // Assuming a URL to view the file
    //   window.open(`${server_url}/crat_market/image/${fileName}`, '_blank');
    // }
  };

  const handleEdit = (domain, index, comment) => {
    const newData = [...data[domain]];
    const target = newData[index];
    target.comments = comment;
    setData({ ...data, [domain]: newData });
    if (target.uuid) {
      updateSingleMarketItem(target.uuid, { reviewerComment: comment })
        .then(() => {
          setOriginalData((prev) => {
            const clone = { ...prev };
            clone[domain] = clone[domain].map((it, i) =>
              i === index ? { ...it, comments: comment } : it,
            );
            return clone;
          });
          toast.success(
            t(
              "crat.commentUpdatedSuccessfully",
              "Comment updated successfully",
            ),
          );
        })
        .catch(() =>
          toast.error(t("crat.updateFailed", "Failed to update rating")),
        );
    } else {
      toast(
        t("crat.uuidMissingDeferredSave", "Record missing id; reload page."),
      );
    }
  };

  const calculateTotalScore = (domain) => {
    return data[domain].reduce((acc, item) => acc + (item.score || 0), 0);
  };

  const calculateOverallTotalScore = () => {
    return Object.values(data)
      .flat()
      .reduce((acc, item) => acc + (item.score || 0), 0);
  };

  const calculateOverallMaxScore = () => {
    return Object.values(data).flat().length * 2; // Assuming the max score for each item is 2
  };

  const renderTableRows = (domain) => {
    return data[domain].map((item, index) => (
      <div
        className="grid grid-cols-6 border-t border-stroke py-4 px-4 dark:border-strokedark"
        key={index}
      >
        <div className="flex items-center px-2">
          <p className="text-sm text-black dark:text-white">{item.subDomain}</p>
        </div>
        <div className="flex items-center px-2">
          <p className="text-sm text-black dark:text-white">{item.question}</p>
        </div>
        <div className="flex items-center px-2">
          <DropdownTwo
            value={item.rating}
            onChange={(e) => handleRatingChange(domain, index, e.target.value)}
          />
        </div>
        <div className="flex items-center px-2">
          <p className="text-sm text-black dark:text-white">{item.score}</p>
        </div>
        <div className="flex items-center px-2">
          {uploading[item.subDomain] ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span className="text-sm text-gray-500">
                {t("crat.uploading", "Uploading...")}
              </span>
            </div>
          ) : item.attachment ? (
            <a
              href={item.attachment}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline break-all"
            >
              {item.attachment.split("/").pop()}
            </a>
          ) : (
            <p className="text-sm text-gray-500">
              {t("crat.noFile", "No file")}
            </p>
          )}
        </div>
        <div className="flex items-center px-2 space-x-2">
          <ReactIcons
            onAdd={(file) => handleAddFile(item.subDomain, file, item.userId)}
            onDelete={() =>
              openDeleteDialog(
                item.subDomain,
                item.userId,
                item.attachment,
                domain,
                index,
              )
            }
            onView={() => handleViewFile(item.attachment)}
            onEdit={(comment) => handleEdit(domain, index, comment)}
            attachment={item.attachment}
            comment={item.comments}
          />
        </div>
      </div>
    ));
  };

  const renderSection = (domain, title) => (
    <div className="mt-4 rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-4">
      <div className="py-6 px-4 md:px-6 xl:px-7.5 flex justify-between items-center">
        <h4 className="text-xl font-semibold text-black dark:text-white">
          {title}
        </h4>
      </div>
      <div className="grid grid-cols-6 border-b border-stroke py-4 px-4 dark:border-strokedark">
        {[
          t("crat.tableHeaders.subDomain", "Sub Domain"),
          t("crat.tableHeaders.question", "Question"),
          t("crat.tableHeaders.rating", "Rating"),
          t("crat.tableHeaders.score", "Score"),
          t("crat.tableHeaders.attachment", "Attachment"),
          t("crat.tableHeaders.actions", "Actions"),
        ].map((header, index) => (
          <div key={index} className="flex items-center px-2">
            <p className="font-medium text-black dark:text-white">{header}</p>
          </div>
        ))}
      </div>
      {renderTableRows(domain)}
      <div className="flex justify-between items-center py-4 px-4 border-t border-stroke dark:border-strokedark">
        <p className="text-sm font-medium text-black dark:text-white">
          {t("crat.total", "Total")}: {calculateTotalScore(domain)}
        </p>
      </div>
    </div>
  );

  return !loading ? (
    <div>
      <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="py-6 px-4 md:px-6 xl:px-7.5 flex justify-between items-center">
          <h4 className="text-xl font-semibold text-black dark:text-white">
            {t("crat.market.title", "Market Domain Assessment")}
          </h4>
          {/* Manual save removed – auto-save on change */}
        </div>
      </div>
      <div className="mt-4 rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        {["On review", "Reviewed"].includes(userDetails.publishStatus) ? (
          <div className="py-6 px-4 md:px-6 xl:px-7.5 flex justify-center items-center">
            <p className="text-lg font-medium text-black dark:text-white">
              {t("report.onReview", "On review")}
            </p>
          </div>
        ) : (
          <>
            {renderSection(
              "market",
              t(
                "crat.market.sections.marketDemandShare",
                "Market Demand & Share",
              ),
            )}
            {renderSection(
              "salesTraction",
              t("crat.market.sections.salesTraction", "Sales & Traction"),
            )}
            {renderSection(
              "product",
              t(
                "crat.market.sections.productDevelopment",
                "Product Development",
              ),
            )}
            {renderSection(
              "competition",
              t("crat.market.sections.competition", "Competition"),
            )}
            {renderSection(
              "marketing",
              t("crat.market.sections.marketing", "Marketing"),
            )}
            <div className="mt-4 rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-4">
              <div className="py-6 px-4 md:px-6 xl:px-7.5 flex justify-between items-center">
                <h4 className="text-xl font-semibold text-black dark:text-white">
                  {t("crat.totalScore", "Total Score")}
                </h4>
                <p className="text-lg font-semibold">
                  {calculateOverallTotalScore()} / {calculateOverallMaxScore()}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        message={modalMessage}
      />
      <Modal2
        isOpen={deletemodalOpen}
        onClose={() => deleteModalOpen(false)}
        message={deletemodalMessage}
        onDelete={() => handleDeleteFile()} // Directly call handleDeleteFile
        onCancel={handleDeleteCancel}
        bgColor="yellow-200"
        closeButtonText={t("actions.cancel", "Cancel")}
        deleteButtonText={t("actions.delete", "Delete")}
        closeButtonColor="gray-500"
        deleteButtonColor="blue-500"
      />
    </div>
  ) : (
    <Loader />
  );
};

export default Page;
