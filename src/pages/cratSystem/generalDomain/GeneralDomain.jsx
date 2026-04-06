"use client";
import { useState, useEffect, useContext } from "react";
import DropdownTwo from "@/components/Dropdowns/DropdownTwo";
import ReactIcons from "@/components/icons/reactIcons";
import toast from "react-hot-toast";
import Loader from "@/components/common/Loader";
import Modal from "@/components/Model";
import Modal2 from "@/components/Model2";
import {
  getGeneralData,
  createGeneralData,
  updateGeneralData,
  attachDocument,
  deleteAttachment,
  getInitialDataTemplate,
} from "@/controllers/crat_general_controller";

import Spinner from "@/components/spinner";
import { UserContext } from "../../../layouts/DashboardLayout";
import { useTranslation } from "../../../locales";

// Table headers will be translated inline in renderSection

const GeneralDomain = () => {
  const { t } = useTranslation();

  // Create translated template
  const translatedTemplate = getInitialDataTemplate(t);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(translatedTemplate);
  const [originalData, setOriginalData] = useState(translatedTemplate);
  const [changesMade, setChangesMade] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [deletemodalOpen, deleteModalOpen] = useState(false);
  const [deletemodalMessage, deleteModalMessage] = useState("");
  const [deleteCache, setDeleteCache] = useState([]);
  const { userDetails, setUserDetails } = useContext(UserContext);
  const [uploading, setUploading] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const responseData = await getGeneralData();
        if (responseData == null || responseData.length == 0) {
          await createGeneralData(translatedTemplate);
          fetchData(); // Fetch again after creating general data
        } else {
          const updatedData = { ...translatedTemplate };

          // Create English template for stable database matching
          const englishTemplate = getInitialDataTemplate(
            (key, fallback) => fallback || key,
          );

          // Create a mapping of English subDomains with their occurrence count
          const subDomainCounts = {};

          Object.keys(updatedData).forEach((section) => {
            updatedData[section] = updatedData[section].map((item, index) => {
              // Get corresponding English subdomain for database matching
              const englishSubDomain =
                englishTemplate[section]?.[index]?.subDomain || item.subDomain;

              // Track occurrence count for this subdomain
              subDomainCounts[englishSubDomain] =
                subDomainCounts[englishSubDomain] || 0;

              // Find all matching items from responseData
              const matchingItems = responseData.filter(
                (dataItem) => dataItem.subDomain === englishSubDomain,
              );

              // Get the specific item based on occurrence count
              const fetchedItem =
                matchingItems[subDomainCounts[englishSubDomain]];

              // Increment count for next occurrence
              subDomainCounts[englishSubDomain]++;

              // If we found a matching item from the database
              if (fetchedItem) {
                return {
                  ...item,
                  score: fetchedItem.score || 0,
                  rating:
                    fetchedItem.score === 2
                      ? t("crat.general.assessments.ratingYes", "Yes")
                      : fetchedItem.score === 1
                        ? t("crat.general.assessments.ratingMaybe", "Maybe")
                        : t("crat.general.assessments.ratingNo", "No"),
                  attachment: fetchedItem.attachment || null,
                  comments: fetchedItem.comments || "",
                  userId: fetchedItem.userId,
                };
              }
              return item;
            });
          });

          setData(updatedData);
          setOriginalData(updatedData);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error(t("errors.fetchingData", "Error fetching data"));
        setLoading(false);
      }
    };

    fetchData();
  }, [t]);

  const handleRatingChange = (domain, index, rating) => {
    const newData = { ...data };
    newData[domain][index].rating = rating;
    newData[domain][index].score =
      rating === t("crat.general.assessments.ratingYes", "Yes")
        ? 2
        : rating === t("crat.general.assessments.ratingMaybe", "Maybe")
          ? 1
          : 0;
    setData(newData);
    setChangesMade(true);
  };

  const handleEdit = (domain, index, comment) => {
    const newData = { ...data };
    newData[domain][index].comments = comment;
    setData(newData);
    setChangesMade(true);
  };

  const submitChanges = async () => {
    try {
      setModalMessage(t("messages.saving", "Saving changes..."));
      setModalOpen(true);

      // Convert data to array format expected by API
      const arrayData = Object.values(data)
        .flat()
        .map((item) => ({
          subDomain: item.subDomain,
          score: item.score,
          attachment: item.attachment,
          comments: item.comments,
          userId: item.userId,
        }));

      await updateGeneralData(arrayData);
      setOriginalData(data);
      setChangesMade(false);
      toast.success(t("success.changesSaved", "Changes saved successfully"));
    } catch (error) {
      console.error("Error updating data:", error);
      toast.error(t("errors.savingChanges", "Error saving changes"));
    } finally {
      setModalOpen(false);
    }
  };

  const handleAddFile = async (subDomain, file, userId) => {
    try {
      setUploading((prev) => ({ ...prev, [subDomain]: true }));
      await attachDocument(file, userId);
      await fetchData(); // Refresh data after file upload
      toast.success(t("success.fileUploaded", "File uploaded successfully"));
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error(t("errors.fileUpload", "Error uploading file"));
    } finally {
      setUploading((prev) => ({ ...prev, [subDomain]: false }));
    }
  };

  const openDeleteDialog = (subDomain, userId, attachment, domain, index) => {
    deleteModalMessage(
      t(
        "confirmations.deleteFile",
        "Are you sure you want to delete this file?",
      ),
    );
    setDeleteCache([subDomain, userId, attachment, domain, index]);
    deleteModalOpen(true);
  };

  const handleDeleteFile = async () => {
    const [subDomain, userId, attachment, domain, index] = deleteCache;
    try {
      await deleteAttachment(userId);
      const newData = { ...data };
      newData[domain][index].attachment = null;
      setData(newData);
      toast.success(t("success.fileDeleted", "File deleted successfully"));
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error(t("errors.fileDelete", "Error deleting file"));
    } finally {
      deleteModalOpen(false);
    }
  };

  const handleViewFile = (fileUrl) => {
    if (fileUrl) {
      window.open(fileUrl, "_blank");
    }
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
            options={[
              t("crat.general.assessments.ratingYes", "Yes"),
              t("crat.general.assessments.ratingMaybe", "Maybe"),
              t("crat.general.assessments.ratingNo", "No"),
            ]}
            onChange={(newRating) =>
              handleRatingChange(domain, index, newRating)
            }
          />
        </div>
        <div className="flex items-center px-2">
          <p className="text-sm text-black dark:text-white">{item.score}</p>
        </div>
        <div className="flex items-center px-2">
          <ReactIcons
            loading={uploading[item.subDomain]}
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
            attachment={item.attachment}
            onEdit={(comment) => handleEdit(domain, index, comment)}
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
            <p className="font-medium">{header}</p>
          </div>
        ))}
      </div>
      {renderTableRows(domain)}
    </div>
  );

  return !loading ? (
    <div>
      <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="py-6 px-4 md:px-6 xl:px-7.5 flex justify-between items-center">
          <h4 className="text-xl font-semibold text-black dark:text-white">
            {t("crat.general.title", "General Domain Assessment")}
          </h4>
          {changesMade && (
            <div className="flex justify-end mt-4">
              <button
                onClick={submitChanges}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {t("crat.submitChanges", "Submit Changes")}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        {["On review", "Reviewed"].includes(userDetails.publishStatus) ? (
          <div className="py-6 px-4 md:px-6 xl:px-7.5 flex justify-center items-center">
            <p className="text-lg font-medium text-black dark:text-white">
              {t(
                "crat.onReviewMessage",
                "Your application is currently under review",
              )}
            </p>
          </div>
        ) : (
          <div className="p-4">
            {renderSection(
              "generalInformation",
              t(
                "crat.general.sections.generalInformation",
                "General Information",
              ),
            )}

            <div className="mt-4 rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-4">
              <div className="py-6 px-4 md:px-6 xl:px-7.5 flex justify-between items-center">
                <h4 className="text-xl font-semibold text-black dark:text-white">
                  {t("crat.totalScore", "Total Score")}
                </h4>
                <p className="text-xl font-semibold text-black dark:text-white">
                  {calculateOverallTotalScore()}/{calculateOverallMaxScore()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} message={modalMessage} />
      <Modal2
        isOpen={deletemodalOpen}
        message={deletemodalMessage}
        onConfirm={handleDeleteFile}
        onCancel={() => deleteModalOpen(false)}
      />
    </div>
  ) : (
    <Loader />
  );
};

export default GeneralDomain;
