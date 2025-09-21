"use client";
import { useState, useEffect, useContext } from "react";
import DropdownTwo from "@/components/Dropdowns/DropdownTwo";
import ReactIcons from "@/components/icons/reactIcons";
import toast from "react-hot-toast";
import Loader from "@/components/common/Loader";
import Modal from "@/components/Model";
import Modal2 from "@/components/Model2";
import {
  getLegalData,
  createLegalData,
  updateLegalData,
  attachDocument,
  deleteAttachment,
  getInitialDataTemplate,
} from "@/controllers/crat_legal_controller"; // Import updated API functions
const tableHeaders = [
  "Sub Domain",
  "Question",
  "Rating",
  "Score",
  "Attachment",
  "Actions",
];
import { useTranslation } from "@/locales";
import { UserContext } from "../../../layouts/DashboardLayout";

const LegalDomainPage = () => {
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const responseData = await getLegalData();
        console.log("Fetched legal data:", responseData);
        console.log("Translated template:", translatedTemplate);
        if (responseData == null || responseData.length == 0) {
          await createLegalData(translatedTemplate);
          fetchData(); // Fetch again after creating legal data
        } else {
          const updatedData = { ...translatedTemplate };
          console.log("updatedData:", updatedData);
          // Create English template for stable database matching
          const englishTemplate = getInitialDataTemplate(
            (key, fallback) => fallback || key
          );

          // Create a mapping of English subDomains with their occurrence count
          const subDomainCounts = {};
          
          Object.keys(updatedData).forEach((section) => {
            updatedData[section] = updatedData[section].map((item, index) => {
              // Get corresponding English subdomain for database matching
              const englishSubDomain =
                englishTemplate[section]?.[index]?.subDomain || item.subDomain;

              // Track occurrence count for this subdomain
              subDomainCounts[englishSubDomain] = (subDomainCounts[englishSubDomain] || 0);

              // Find all matching items from responseData
              const matchingItems = responseData.filter(
                (dataItem) => dataItem.subDomain === englishSubDomain
              );

              // Get the specific item based on occurrence count
              const fetchedItem = matchingItems[subDomainCounts[englishSubDomain]];
              
              // Increment count for next occurrence
              subDomainCounts[englishSubDomain]++;

              return fetchedItem
                ? {
                    ...item, // Keep the translated template (including translated subDomain)
                    rating: fetchedItem.rating,
                    score: fetchedItem.score,
                    userId: fetchedItem.userId,
                    attachment: fetchedItem.attachment,
                    comments: fetchedItem.comments,
                    uuid: fetchedItem.uuid, // Add uuid for future reference
                    // Don't overwrite subDomain - keep the translated one from item
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

  const handleRatingChange = (section, index, newRating) => {
    const newData = { ...data };
    const score = newRating === "No" ? 0 : newRating === "Maybe" ? 1 : 2;
    if (newRating === "Yes" && !newData[section][index].attachment) {
      setModalMessage(
        t(
          "crat.pleaseUploadAttachmentFirst",
          "Please upload an attachment first."
        )
      );
      setModalOpen(true);
    } else {
      newData[section][index].rating = newRating;
      newData[section][index].score = score;
      setData(newData);
      setChangesMade(true);
    }
  };

  const submitChanges = async () => {
    try {
      await updateLegalData(data);

      // Update translatedTemplate here (though it's not needed since it's recreated on render)
      Object.keys(data).forEach((section) => {
        // No need to update translatedTemplate as it's dynamically generated
      });

      setOriginalData(data); // Update original data after successful submission
      setChangesMade(false);

      toast.success(
        t("crat.changesSubmittedSuccess", "Changes successfully submitted")
      );
      console.log("Changes successfully submitted");
    } catch (error) {
      toast.error(t("crat.changesSubmittedError", "Error submitting changes"));
      console.error("Error submitting changes:", error);
    }
  };

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
      await attachDocument(fileData);

      // Fetch updated data
      const responseData = await getLegalData();
      const updatedData = { ...translatedTemplate };

      // Create English template for stable database matching
      const englishTemplate = getInitialDataTemplate(
        (key, fallback) => fallback || key
      );

      // Create a mapping of English subDomains with their occurrence count
      const subDomainCounts = {};

      Object.keys(updatedData).forEach((section) => {
        updatedData[section] = updatedData[section].map((item, index) => {
          // Get corresponding English subdomain for database matching
          const englishSubDomain =
            englishTemplate[section]?.[index]?.subDomain || item.subDomain;

          // Track occurrence count for this subdomain
          subDomainCounts[englishSubDomain] = (subDomainCounts[englishSubDomain] || 0);

          // Find all matching items from responseData
          const matchingItems = responseData.filter(
            (dataItem) => dataItem.subDomain === englishSubDomain
          );

          // Get the specific item based on occurrence count
          const fetchedItem = matchingItems[subDomainCounts[englishSubDomain]];
          
          // Increment count for next occurrence
          subDomainCounts[englishSubDomain]++;

          return fetchedItem
            ? {
                ...item, // Keep the translated template (including translated subDomain)
                rating: fetchedItem.rating,
                userId: fetchedItem.userId,
                score: fetchedItem.score,
                attachment: fetchedItem.attachment,
                comments: fetchedItem.comments,
                uuid: fetchedItem.uuid, // Add uuid for future reference
                // Don't overwrite subDomain - keep the translated one from item
              }
            : item;
        });
      });

      toast.success(t("crat.attachmentUploaded", "Attachment uploaded"));
      setData(updatedData);
      // setChangesMade(true);
    } catch (error) {
      toast.error(t("crat.errorAttachingFile", "Error attaching file"));
      console.error("Error attaching file:", error);
    }
  };

  const openDeleteDialog = (domain, id, attachment, section, index) => {
    // Open the delete modal with the confirmation message
    deleteModalOpen(true);
    deleteModalMessage(
      t("crat.confirmDelete", "Are you sure you want to delete?")
    );
    setDeleteCache([domain, id, attachment, section, index]);
  };

  const handleDeleteFile = async () => {
    const [domain, id, attachment, section, index] = deleteCache;
    try {
      // Proceed with deletion directly
      await deleteAttachment(domain, id, attachment);
      handleRatingChange(section, index, "No");
      submitChanges();

      // Fetch updated data
      const responseData = await getLegalData();
      const updatedData = { ...translatedTemplate };

      // Create English template for stable database matching
      const englishTemplate = getInitialDataTemplate(
        (key, fallback) => fallback || key
      );

      // Create a mapping of English subDomains with their occurrence count
      const subDomainCounts = {};

      Object.keys(updatedData).forEach((section) => {
        updatedData[section] = updatedData[section].map((item, index) => {
          // Get corresponding English subdomain for database matching
          const englishSubDomain =
            englishTemplate[section]?.[index]?.subDomain || item.subDomain;

          // Track occurrence count for this subdomain
          subDomainCounts[englishSubDomain] = (subDomainCounts[englishSubDomain] || 0);

          // Find all matching items from responseData
          const matchingItems = responseData.filter(
            (dataItem) => dataItem.subDomain === englishSubDomain
          );

          // Get the specific item based on occurrence count
          const fetchedItem = matchingItems[subDomainCounts[englishSubDomain]];
          
          // Increment count for next occurrence
          subDomainCounts[englishSubDomain]++;

          return fetchedItem
            ? {
                ...item, // Keep the translated template (including translated subDomain)
                rating: fetchedItem.rating,
                userId: fetchedItem.userId,
                score: fetchedItem.score,
                attachment: fetchedItem.attachment,
                uuid: fetchedItem.uuid, // Add uuid for future reference
                // Don't overwrite subDomain - keep the translated one from item
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
    console.log("Editing item:", domain, index, comment);

    const newData = [...data[domain]];
    newData[index].comments = comment;
    setData({ ...data, [domain]: newData });
    submitChanges();
    toast.success(
      t("crat.commentUpdatedSuccessfully", "Comment updated successfully")
    );
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
    // Create English template for stable database identifiers
    const englishTemplate = getInitialDataTemplate(
      (key, fallback) => fallback || key
    );
    console.log("Data:", data);
    return data[domain].map((item, index) => {
      // Get corresponding English subdomain for API calls
      const englishSubDomain =
        englishTemplate[domain]?.[index]?.subDomain || item.subDomain;

      return (
        <div
          className="grid grid-cols-6 border-t border-stroke py-4 px-4 dark:border-strokedark"
          key={index}
        >
          <div className="flex items-center px-2">
            <p className="text-sm text-black dark:text-white">
              {item.subDomain}
            </p>
          </div>
          <div className="flex items-center px-2">
            <p className="text-sm text-black dark:text-white">
              {item.question}
            </p>
          </div>
          <div className="flex items-center px-2">
            <DropdownTwo
              value={item.rating}
              onChange={(e) =>
                handleRatingChange(domain, index, e.target.value)
              }
            />
          </div>
          <div className="flex items-center px-2">
            <p className="text-sm text-black dark:text-white">{item.score}</p>
          </div>
          <div className="flex items-center px-2">
            <p className="text-sm text-black dark:text-white">
              {item.description}
            </p>
          </div>
          <div className="flex items-center px-2 space-x-2">
            <ReactIcons
              onAdd={(file) =>
                handleAddFile(englishSubDomain, file, item.userId)
              }
              onDelete={() =>
                openDeleteDialog(
                  englishSubDomain,
                  item.userId,
                  item.attachment,
                  domain,
                  index
                )
              }
              onView={() => handleViewFile(item.attachment)}
              attachment={item.attachment}
              onEdit={(comment) => handleEdit(domain, index, comment)}
              comment={item.comments}
            />
          </div>
        </div>
      );
    });
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
            {t("crat.legal.title", "Legal Domain Assessment")}
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
        {userDetails.publishStatus === "On review" ? (
          <div className="py-6 px-4 md:px-6 xl:px-7.5 flex justify-center items-center">
            <p className="text-lg font-medium text-black dark:text-white">
              {t("report.onReview", "On review")}
            </p>
          </div>
        ) : (
          <>
            {renderSection(
              "corporateDocumentsCompliance",
              t(
                "crat.legal.sections.corporateDocsCompliance",
                "1. Corporate Documents & Compliance"
              )
            )}
            {renderSection(
              "contractsAgreements",
              t(
                "crat.legal.sections.contractsAgreements",
                "2. Contracts & Agreements"
              )
            )}
            {renderSection(
              "intellectualProperty",
              t(
                "crat.legal.sections.intellectualProperty",
                "3. Intellectual Property"
              )
            )}
            {renderSection(
              "entrepreneurFamily",
              t(
                "crat.legal.sections.entrepreneurFamily",
                "4. Entrepreneur & Family"
              )
            )}
            {renderSection(
              "corporateGovernance",
              t(
                "crat.legal.sections.corporateGovernance",
                "5. Corporate Governance"
              )
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
        onDelete={() => handleDeleteFile()}
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

export default LegalDomainPage;
