"use client";
import { useState, useEffect, useContext } from "react";
import DropdownTwo from "@/components/Dropdowns/DropdownTwo";
import ReactIcons from "@/components/icons/reactIcons";
import toast from "react-hot-toast";
import Loader from "@/components/common/Loader";
import Modal from "@/components/Model";
import Modal2 from "@/components/Model2";
import {
  getOperationData,
  createOperationData,
  updateOperationData,
  attachDocument,
  deleteAttachment,
  getInitialDataTemplate,
  updateSingleOperationItem,
} from "@/controllers/crat_operation_controller"; // Updated with single-item patch
import axios from "axios";
import { server_url } from "@/utils/endpoint";
import { headers } from "@/utils/headers";
const tableHeaders = [
  "Sub Domain",
  "Question",
  "Rating",
  "Score",
  "Attachment",
  "Your Comment",
  "Reviewer Comment",
  "Actions",
];
import { useTranslation } from "@/locales";
import { UserContext } from "../../../layouts/DashboardLayout";

const OperationsDomain = () => {
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
        const responseData = await getOperationData();
        if (responseData == null || responseData.length == 0) {
          await createOperationData(translatedTemplate);
          fetchData(); // Fetch again after creating market data
        } else {
          const updatedData = { ...translatedTemplate };
          Object.keys(updatedData).forEach((section) => {
            updatedData[section] = updatedData[section].map((item) => {
              const fetchedItem = responseData.find(
                (dataItem) => dataItem.subDomain === item.subDomain
              );
              return fetchedItem
                ? {
                    ...item,
                    uuid: fetchedItem.uuid,
                    rating: fetchedItem.rating,
                    score: fetchedItem.score,
                    userId: fetchedItem.userId,
                    attachment: fetchedItem.attachment,
                    comment: fetchedItem.comment,
                    customerComment: fetchedItem.customerComment,
                    reviewerComment: fetchedItem.reviewerComment,
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

  // When the logged-in user changes, reload domain data to prevent stale cross-user data
  useEffect(() => {
    if (!userDetails || !userDetails.id) return;
    const reload = async () => {
      setLoading(true);
      try {
        const responseData = await getOperationData();
        const updatedData = { ...translatedTemplate };
        Object.keys(updatedData).forEach((section) => {
          updatedData[section] = updatedData[section].map((item) => {
            const fetchedItem = responseData.find(
              (dataItem) => dataItem.subDomain === item.subDomain
            );
            return fetchedItem
              ? {
                  ...item,
                  uuid: fetchedItem.uuid,
                  rating: fetchedItem.rating,
                  score: fetchedItem.score,
                  userId: fetchedItem.userId,
                  attachment: fetchedItem.attachment,
                  comment: fetchedItem.comment,
                  customerComment: fetchedItem.customerComment,
                  reviewerComment: fetchedItem.reviewerComment,
                }
              : item;
          });
        });
        setData(updatedData);
        setOriginalData(updatedData);
      } catch (e) {
        console.log("reload error", e);
      } finally {
        setLoading(false);
      }
    };
    reload();
  }, [userDetails && userDetails.id]);

  // Debounced bulk auto-save fallback
  useEffect(() => {
    if (!changesMade) return;
    const timer = setTimeout(() => submitChanges(), 500);
    return () => clearTimeout(timer);
  }, [changesMade]);

  const handleRatingChange = async (section, index, newRating) => {
    const newData = { ...data };
    const current = newData[section][index];
    const score = newRating === "No" ? 0 : newRating === "Maybe" ? 1 : 2;
    if (newRating === "Yes" && !current.attachment) {
      setModalMessage(
        t(
          "crat.pleaseUploadAttachmentFirst",
          "Please upload an attachment first."
        )
      );
      setModalOpen(true);
      return;
    }
    current.rating = newRating;
    current.score = score;
    setData(newData);
    try {
      if (!current.uuid) {
        setChangesMade(true); // fallback bulk save
        toast(
          t(
            "crat.uuidMissingDeferredSave",
            "Record missing id; will save shortly"
          )
        );
        return;
      }
      await updateSingleOperationItem(current.uuid, {
        rating: newRating,
        score,
      });
      setOriginalData((prev) => {
        const clone = { ...prev };
        clone[section] = clone[section].map((it, i) =>
          i === index ? { ...it, rating: newRating, score } : it
        );
        return clone;
      });
      toast.success(
        t("crat.ratingUpdated", "Rating & score updated successfully")
      );
    } catch (e) {
      toast.error(t("crat.updateFailed", "Failed to update rating"));
      setData(originalData);
    }
  };

  const submitChanges = async () => {
    try {
      await updateOperationData(data);
      setOriginalData(data);
      setChangesMade(false);
      toast.success(
        t("crat.changesSubmittedSuccess", "Changes successfully submitted")
      );
    } catch (error) {
      toast.error(t("crat.changesSubmittedError", "Error submitting changes"));
    }
  };

  const handleAddFile = async (domain, file, userId, uuid) => {
    if (!file) return;

    // Extract the file extension
    const fileExtension = file.name.split(".").pop();

    // Append timestamp to the filename
    const timestamp = Date.now();
    const uniqueFileName = `${domain}_${timestamp}.${fileExtension}`;

    // Create a new file with the updated name
    const updatedFile = new File([file], uniqueFileName, { type: file.type });

    const fileData = {
      file: updatedFile,
      userId,
      uuid,
      subDomain: domain, // fallback
    };

    try {
      await attachDocument(fileData);

      // Fetch updated data
      const responseData = await getOperationData();
      const updatedData = { ...translatedTemplate };

      Object.keys(updatedData).forEach((section) => {
        updatedData[section] = updatedData[section].map((item) => {
          const fetchedItem = responseData.find(
            (dataItem) => dataItem.subDomain === item.subDomain
          );
          return fetchedItem
            ? {
                ...item,
                uuid: fetchedItem.uuid,
                rating: fetchedItem.rating,
                userId: fetchedItem.userId,
                score: fetchedItem.score,
                attachment: fetchedItem.attachment,
                customerComment: fetchedItem.customerComment,
                reviewerComment: fetchedItem.reviewerComment,
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

  const openDeleteDialog = (domain, id, attachment, section, index, uuid) => {
    // Open the delete modal with the confirmation message
    deleteModalOpen(true);
    deleteModalMessage(
      t("crat.confirmDelete", "Are you sure you want to delete?")
    );
    setDeleteCache([domain, id, attachment, section, index, uuid]);
  };

  const handleDeleteCancel = () => {
    // Close the delete modal without performing any action
    deleteModalOpen(false);
  };

  const handleDeleteFile = async () => {
    const [domain, id, attachment, section, index, uuid] = deleteCache;
    console.log(domain, id, attachment, section, index);
    try {
      // Proceed with deletion directly
      await deleteAttachment({
        uuid,
        subDomain: domain,
        userId: id,
        attachment,
      });
      handleRatingChange(section, index, "No");
      submitChanges();
      // Fetch updated data
      const responseData = await getOperationData();
      const updatedData = { ...translatedTemplate };

      Object.keys(updatedData).forEach((section) => {
        updatedData[section] = updatedData[section].map((item) => {
          const fetchedItem = responseData.find(
            (dataItem) => dataItem.subDomain === item.subDomain
          );
          return fetchedItem
            ? {
                ...item,
                uuid: fetchedItem.uuid,
                rating: fetchedItem.rating,
                userId: fetchedItem.userId,
                score: fetchedItem.score,
                attachment: fetchedItem.attachment,
                customerComment: fetchedItem.customerComment,
                reviewerComment: fetchedItem.reviewerComment,
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
    newData[index].comments = comment;
    setData({ ...data, [domain]: newData });
    submitChanges();
    toast.success(
      t("crat.commentUpdatedSuccessfully", "Comment updated successfully")
    );
  };

  const handleCustomerCommentBlur = async (domain, index, comment) => {
    console.log(
      "🔧 DEBUG: handleCustomerCommentBlur called in OperationsDomain"
    );
    console.log("🔧 DEBUG: User role:", userDetails?.role);
    console.log("🔧 DEBUG: Domain:", domain, "Index:", index);
    console.log("🔧 DEBUG: Comment:", comment);

    // Check if user is Entrepreneur - only they can edit customer comments
    if (userDetails?.role !== "Enterprenuer") {
      console.log("🔧 DEBUG: Permission denied - user is not Entrepreneur");
      toast.warning(
        t(
          "crat.noPermissionCustomer",
          "Only entrepreneurs can edit customer comments"
        )
      );
      return;
    }

    const item = data[domain][index];
    if (!item.uuid) {
      console.log("🔧 DEBUG: No UUID found, cannot save comment");
      toast.error(t("crat.noUuidError", "Cannot save comment - missing ID"));
      return;
    }

    try {
      console.log(
        "🔧 DEBUG: Making PATCH request to:",
        `${server_url}/crat_operation/${item.uuid}`
      );

      const response = await axios.patch(
        `${server_url}/crat_operation/${item.uuid}`,
        {
          customerComment: comment,
        },
        { headers }
      );

      console.log("🔧 DEBUG: API Response:", response.data);

      if (response.data.status) {
        console.log("🔧 DEBUG: Comment saved successfully");
        const newData = { ...data };
        newData[domain][index].customerComment = comment;
        setData(newData);

        toast.success(
          t("crat.commentSavedAutomatically", "Comment saved automatically")
        );
      } else {
        console.log("🔧 DEBUG: API returned error status:", response.data);
        toast.error(t("crat.errorSavingComment", "Error saving comment"));
      }
    } catch (error) {
      console.log("🔧 DEBUG: Exception occurred:", error);
      toast.error(t("crat.errorSavingComment", "Error saving comment"));
      console.error("Error saving customer comment:", error);
    }
  };

  const handleReviewerCommentBlur = async (domain, index, comment) => {
    console.log("🔧 DEBUG: handleReviewerCommentBlur called in OperationsDomain");
    console.log("🔧 DEBUG: User role:", userDetails?.role);
    console.log("🔧 DEBUG: Domain:", domain, "Index:", index);
    console.log("🔧 DEBUG: Comment:", comment);

    // Check if user is Admin - only they can edit reviewer comments
    if (userDetails?.role !== "Admin") {
      console.log("🔧 DEBUG: Permission denied - user is not Admin");
      toast.warning(
        t("crat.noPermissionReviewer", "Only admins can edit reviewer comments")
      );
      return;
    }

    const item = data[domain][index];
    if (!item.uuid) {
      console.log("🔧 DEBUG: No UUID found, cannot save reviewer comment");
      toast.error(t("crat.noUuidError", "Cannot save comment - missing ID"));
      return;
    }

    try {
      console.log("🔧 DEBUG: Making PATCH request to:", `${server_url}/crat_operation/${item.uuid}`);
      
      const response = await axios.patch(
        `${server_url}/crat_operation/${item.uuid}`,
        {
          reviewerComment: comment,
        },
        { headers }
      );

      console.log("🔧 DEBUG: API Response:", response.data);

      if (response.data.status) {
        console.log("🔧 DEBUG: Reviewer comment saved successfully");
        const newData = { ...data };
        newData[domain][index].reviewerComment = comment;
        setData(newData);

        toast.success(
          t("crat.reviewerCommentSaved", "Reviewer comment saved automatically")
        );
      } else {
        console.log("🔧 DEBUG: API returned error status:", response.data);
        toast.error(t("crat.errorSavingReviewerComment", "Error saving reviewer comment"));
      }
    } catch (error) {
      console.log("🔧 DEBUG: Exception occurred:", error);
      toast.error(t("crat.errorSavingReviewerComment", "Error saving reviewer comment"));
      console.error("Error saving reviewer comment:", error);
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
        className="grid grid-cols-8 border-t border-stroke py-4 px-4 dark:border-strokedark"
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
          {item.attachment ? (
            <a
              href={item.attachment}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline break-all"
              title={t("crat.openAttachment", "Open attachment")}
            >
              {(() => {
                try {
                  const url = new URL(item.attachment);
                  return url.pathname.split("/").pop();
                } catch {
                  return item.attachment.split("/").pop();
                }
              })()}
            </a>
          ) : (
            <p className="text-sm text-gray-500">
              {t("crat.noFile", "No file")}
            </p>
          )}
        </div>
        
        {/* Customer Comment Column */}
        <div className="flex items-center px-2">
          {userDetails?.role === "Enterprenuer" ? (
            <textarea
              className="w-full p-2 text-sm border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700 dark:text-white resize-none"
              placeholder={t("crat.enterYourComment", "Enter your comment...")}
              value={item.customerComment || ""}
              onChange={(e) => {
                const newData = { ...data };
                newData[domain][index].customerComment = e.target.value;
                setData(newData);
              }}
              onBlur={(e) =>
                handleCustomerCommentBlur(domain, index, e.target.value)
              }
              rows={2}
            />
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {item.customerComment || t("crat.noComment", "No comment")}
            </p>
          )}
        </div>

        {/* Reviewer Comment Column */}
        <div className="flex items-center px-2">
          {userDetails?.role === "Admin" ? (
            <textarea
              className="w-full p-2 text-sm border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700 dark:text-white resize-none"
              placeholder={t("crat.enterReviewerComment", "Enter reviewer comment...")}
              value={item.reviewerComment || ""}
              onChange={(e) => {
                const newData = { ...data };
                newData[domain][index].reviewerComment = e.target.value;
                setData(newData);
              }}
              onBlur={(e) =>
                handleReviewerCommentBlur(domain, index, e.target.value)
              }
              rows={2}
            />
          ) : userDetails?.role === "Enterprenuer" ? (
            <p className="text-sm text-gray-500 italic">
              {t("crat.hiddenFromEntrepreneur", "Hidden")}
            </p>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {item.reviewerComment || t("crat.noComment", "No comment")}
            </p>
          )}
        </div>

        <div className="flex items-center px-2 space-x-2">
          <ReactIcons
            onAdd={(file) =>
              handleAddFile(item.subDomain, file, item.userId, item.uuid)
            }
            onDelete={() =>
              openDeleteDialog(
                item.subDomain,
                item.userId,
                item.attachment,
                domain,
                index,
                item.uuid
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
      <div className="grid grid-cols-8 border-b border-stroke py-4 px-4 dark:border-strokedark">
        {[
          t("crat.tableHeaders.subDomain", "Sub Domain"),
          t("crat.tableHeaders.question", "Question"),
          t("crat.tableHeaders.rating", "Rating"),
          t("crat.tableHeaders.score", "Score"),
          t("crat.tableHeaders.attachment", "Attachment"),
          t("crat.tableHeaders.yourComment", "Your Comment"),
          t("crat.tableHeaders.reviewerComment", "Reviewer Comment"),
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
            {t("crat.operations.title", "Operations Domain Assessment")}
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
              "managementCapacity",
              t(
                "crat.operations.sections.managementCapacity",
                "1. Management Capacity"
              )
            )}
            {renderSection("mis", t("crat.operations.sections.mis", "2. MIS"))}
            {renderSection(
              "qualityManagement",
              t(
                "crat.operations.sections.qualityManagement",
                "3. Quality Management"
              )
            )}
            {renderSection(
              "overallOperations",
              t(
                "crat.operations.sections.overallOperations",
                "4. Overall Operations"
              )
            )}
            {renderSection(
              "strategyPlanning",
              t(
                "crat.operations.sections.strategyPlanning",
                "5. Strategy & Planning"
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

export default OperationsDomain;
