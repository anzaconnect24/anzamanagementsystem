"use client";
import { useState, useEffect, useContext } from "react";
import DropdownTwo from "@/components/Dropdowns/DropdownTwo";
import ReactIcons from "@/components/icons/reactIcons";
import toast from 'react-hot-toast';
import Loader from "@/components/common/Loader";
import Modal from "@/components/Model";
import Modal2 from "@/components/Model2";
import { getFinancialData, createFinancialData, updateFinancialData, attachDocument, deleteAttachment, initialDataTemplate } from "@/app/controllers/crat_financials_controller"; // Import updated API functions
import { UserContext } from "../../../(dashboard)/layout";

const tableHeaders = ["Sub Domain", "Question", "Rating", "Score", "Attachment", "Actions"];

const Page = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(initialDataTemplate);
  const [originalData, setOriginalData] = useState(initialDataTemplate);
  const [changesMade, setChangesMade] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [deletemodalOpen, deleteModalOpen] = useState(false);
  const [deletemodalMessage, deleteModalMessage] = useState("");
  const [deleteCache, setDeleteCache] = useState([]);
  const { userDetails, setUserDetails } = useContext(UserContext)


  useEffect(() => {

    const fetchData = async () => {
      try {
        const responseData = await getFinancialData(userDetails.id);
        if (responseData == null || responseData.length == 0) {
          await createFinancialData(initialDataTemplate);
          fetchData(); // Fetch again after creating market data
        } else {
          const updatedData = { ...initialDataTemplate };
          Object.keys(updatedData).forEach((section) => {
            updatedData[section] = updatedData[section].map((item) => {
              const fetchedItem = responseData.find((dataItem) => dataItem.subDomain === item.subDomain);
              return fetchedItem
                ? { ...item, rating: fetchedItem.rating, score: fetchedItem.score, userId: fetchedItem.userId, attachment: fetchedItem.attachment,  comments: fetchedItem.comments }
                : item;
            });
          });
          setData(updatedData);
          setOriginalData(updatedData); // Set original data
        }
      } catch (error) {
        console.log('Error fetching data:', error);
      }
    };

    fetchData();
    setLoading(false);
  }, []);

  const handleRatingChange = (section, index, newRating) => {
    const newData = { ...data };
    const score = newRating === "No" ? 0 : newRating === "Maybe" ? 1 : 2;
    if (newRating === "Yes" && !newData[section][index].attachment) {
      setModalMessage("Please upload an attachment first.");
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
        await updateFinancialData(data);

        // Update initialDataTemplate here
        Object.keys(data).forEach(section => {
            initialDataTemplate[section] = data[section].map(item => ({
                subDomain: item.subDomain,
                rating: item.rating,
                score: item.score,
                userId: item.userId,
                attachment: item.attachment,
                comments: item.comments,
                question: item.question, 
                description: item.description 
            }));
        });

        setOriginalData(data); // Update original data after successful submission
        setChangesMade(false);

        toast.success("Changes successfully submitted");
        console.log("Changes successfully submitted");
    } catch (error) {
        toast.error("Error submitting changes");
        console.error("Error submitting changes:", error);
    }
};


  // const submitChanges = async () => {
  //   console.log(initialDataTemplate['profitability']);
  //   try {
  //     await updateFinancialData(data);
  //     setOriginalData(data); // Update original data after successful submission
  //     setChangesMade(false);
  
  //     toast.success("Changes successfully submitted");
  //     console.log("Changes successfully submitted");
  //   } catch (error) {
  //     toast.error("Error submitting changes");
  //     console.error("Error submitting changes:", error);
  //   }
  // };
  
  const handleAddFile = async (domain, file, userId) => {
  
    if (!file) return; // Ensure a file is provided
  
    const fileData = {
      file: file, // Attach the file
      subDomain: domain, // Include the subDomain
      userId: userId
    };
  
    try {
      await attachDocument(fileData);
      
      // Fetch updated data
      const responseData = await getFinancialData();
      const updatedData = { ...initialDataTemplate };
  
      Object.keys(updatedData).forEach((section) => {
        updatedData[section] = updatedData[section].map((item) => {
          const fetchedItem = responseData.find((dataItem) => dataItem.subDomain === item.subDomain);
          return fetchedItem
            ? { ...item, rating: fetchedItem.rating, userId: fetchedItem.userId, score: fetchedItem.score, attachment: fetchedItem.attachment,  comment: fetchedItem.comment }
            : item;
        });
      });

      toast.success('Attachment Uploaded');
      setData(updatedData);
      // setChangesMade(true);
    } catch (error) {
      toast.error("Error attaching file");
      console.error("Error attaching file:", error);
    }
  };
  

  const openDeleteDialog = (domain, id, attachment, section, index) => {
    deleteModalOpen(true);
    deleteModalMessage('Are you sure you want to delete attachment?');
    setDeleteCache([domain, id, attachment, section, index]);
};

const handleDeleteCancel = () => {
  // Close the delete modal without performing any action
  deleteModalOpen(false); 
};

const handleDeleteFile = async () => {
  const [domain, id, attachment, section, index] = deleteCache;

  try {
      // Proceed with deletion of the attachment
      await deleteAttachment(domain, id, attachment);
      
       handleRatingChange(section, index, "No");
       submitChanges();
      
      // Fetch the updated data after the rating is changed
      const responseData = await getFinancialData();
      const updatedData = { ...initialDataTemplate };

      // Map over sections to apply updates
      Object.keys(updatedData).forEach((section) => {
          updatedData[section] = updatedData[section].map((item) => {
              const fetchedItem = responseData.find((dataItem) => dataItem.subDomain === item.subDomain);
              return fetchedItem
                  ? { ...item, rating: fetchedItem.rating, userId: fetchedItem.userId, score: fetchedItem.score, attachment: fetchedItem.attachment,  comment: fetchedItem.comment }
                  : item;
          });
      });

      // Notify user of success
      toast.success('Deleted and rating updated successfully');
      
      // Update the UI with the newly fetched data
      setData(updatedData);
      
      // Close the delete modal
      deleteModalOpen(false);

  } catch (error) {
      toast.error("Error deleting file or updating rating");
      console.error("Error deleting file:", error);
  }
};


  const handleViewFile = (attachment) => {
    window.open(`http://${attachment}`, '_blank');

    // const fileName = data[domain][index].attachment;
    // if (fileName) {
    //   // Assuming a URL to view the file
    //   window.open(`${server_url}/crat_market/image/${fileName}`, '_blank');
    // }
  };

  const handleEdit = (domain, index, comment) => {
    
    const newData = [...data[domain]];
    newData[index].comments = comment;
    setData({...data, [domain]: newData });
    submitChanges();
    toast.success('Comment updated successfully');
  };

  const calculateTotalScore = (domain) => {
    return data[domain].reduce((acc, item) => acc + (item.score || 0), 0);
  };

  const calculateOverallTotalScore = () => {
    return Object.values(data).flat().reduce((acc, item) => acc + (item.score || 0), 0);
  };

  const calculateOverallMaxScore = () => {
    return Object.values(data).flat().length * 2; // Assuming the max score for each item is 2
  };

  const renderTableRows = (domain) => {
    return data[domain].map((item, index) => (
      <div className="grid grid-cols-6 border-t border-stroke py-4 px-4 dark:border-strokedark" key={index}>
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
          <p className="text-sm text-black dark:text-white">{item.description}</p>
        </div>
        
        <div className="flex items-center px-2 space-x-2">
          <ReactIcons
            onAdd={(file) => handleAddFile(item.subDomain, file, item.userId)}
            onDelete={() => openDeleteDialog(item.subDomain, item.userId, item.attachment, domain, index  )}
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
        <h4 className="text-xl font-semibold text-black dark:text-white">{title}</h4>
      </div>
      <div className="grid grid-cols-6 border-b border-stroke py-4 px-4 dark:border-strokedark">
        {tableHeaders.map((header, index) => (
          <div key={index} className="flex items-center px-2">
            <p className="font-medium text-black dark:text-white">{header}</p>
          </div>
        ))}
      </div>
      {renderTableRows(domain)}
      <div className="flex justify-between items-center py-4 px-4 border-t border-stroke dark:border-strokedark">
        <p className="text-sm font-medium text-black dark:text-white">Total: {calculateTotalScore(domain)}</p>
      </div>
    </div>
  );

  return  !loading ?(
    <div>
      <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="py-6 px-4 md:px-6 xl:px-7.5 flex justify-between items-center">
          <h4 className="text-xl font-semibold text-black dark:text-white">Financial Domain Assessment</h4>
          {changesMade && (
            <div className="flex justify-end mt-4">
              <button
                onClick={submitChanges}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Submit Changes
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="mt-4 rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        {userDetails.publishStatus === "On review" ? (
          <div className="py-6 px-4 md:px-6 xl:px-7.5 flex justify-center items-center">
            <p className="text-lg font-medium text-black dark:text-white">
              On Review
            </p>
          </div>
        ) : (
          <>
            {renderSection("profitability", "1. Profitability")}
            {renderSection("balanceSheet", "2. Balance Sheet")}
            {renderSection("cashFlows", "3. Cash Flows")}
            {renderSection("projections", "4. Projections")}
            {renderSection("financialManagement", "5. Financial Management")}
            <div className="mt-4 rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-4">
              <div className="py-6 px-4 md:px-6 xl:px-7.5 flex justify-between items-center">
                <h4 className="text-xl font-semibold text-black dark:text-white">Total Score</h4>
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
        closeButtonText="Cancel"
        deleteButtonText="Delete"
        closeButtonColor="gray-500"
        deleteButtonColor="blue-500"
      />
    </div>
  ):( <Loader />);
  
  
};

export default Page;

