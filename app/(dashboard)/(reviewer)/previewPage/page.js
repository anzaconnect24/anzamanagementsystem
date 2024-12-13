"use client";
import { useState, useEffect } from "react";
import { getReport, initialData, publishChanges, publishUser } from "@/app/controllers/crat_reviewer_controller"; // Import updated API functions
import * as XLSX from "xlsx"; // Import xlsx library for Excel export
import jsPDF from "jspdf";
import "jspdf-autotable"; // Ensure you have this plugin for table support
import DropdownTwo from "@/components/Dropdowns/DropdownTwo";
import toast from 'react-hot-toast';
import cloneDeep from 'lodash/cloneDeep';
import { useRouter } from "next/navigation"; // Import useRouter for navigation



// Define the table headers
const tableHeaders = ["Sub Domain", 'Rating', "Report Narrative", "Comments", "Actions"];


const Page = () => {
    const [data, setData] = useState(initialData);
    const [scoreData, setScoreData] = useState({});
    const [selectedData, setSelectedData] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [publishModalOpen, setPublishModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);
    const router = useRouter(); // Initialize the router for navigation
    var parsedData = {};


    useEffect(() => {
        const storedData = sessionStorage.getItem("selectedRowData");
    
        if (storedData) {
            try {
                 parsedData = JSON.parse(storedData);
                setSelectedData(parsedData);
                fetchData(parsedData.id); // Pass parsed data for further processing
            } catch (error) {
                console.error("Error parsing data from sessionStorage:", error);
            }
        } else {
            console.log("No data found in sessionStorage.");
        }
    }, []);
    
    const fetchData = async (id) => {
        try {
            const responseData = await getReport(id);
            if (responseData.status && Array.isArray(responseData.body)) {
                updateDataWithBackendResponse(responseData.body);
            } else {
                console.error("Error: Invalid response structure");
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };
    


    const updateDataWithBackendResponse = (responseDataBody) => {
        const updatedData = cloneDeep(data); // Use deep copy to ensure state updates are detected
    
        responseDataBody.forEach((responseItem) => {
            const { subDomain, score, comments, attachment, reviewer_comment } = responseItem;
            const rating = score === 0 ? "No" : score === 1 ? "Maybe" : "Yes";
    
            Object.keys(updatedData).forEach((section) => {
                if (Array.isArray(updatedData[section])) {
                    updatedData[section].forEach((subDomainGroup) => {
                        if (subDomainGroup.subDomain === subDomain) {
                            subDomainGroup.score = score;
                            subDomainGroup.rating = rating;
                            subDomainGroup.comments = comments;
                            subDomainGroup.attachment = attachment;
                            subDomainGroup.reviewer_comment = reviewer_comment;
                        }
                    });
                } else {
                    Object.keys(updatedData[section]).forEach((subSection) => {
                        if (Array.isArray(updatedData[section][subSection])) {
                            updatedData[section][subSection].forEach((subDomainGroup) => {
                                if (subDomainGroup.subDomain === subDomain) {
                                    subDomainGroup.score = score;
                                    subDomainGroup.rating = rating;
                                    subDomainGroup.comments = comments;
                                    subDomainGroup.attachment = attachment;
                                    subDomainGroup.reviewer_comment = reviewer_comment;
                                }
                            });
                        }
                    });
                }
            });
        });
    
        console.log('Updating data state with backend response');
        setData(updatedData); // Update the state
    };
    


    const renderTableHeaders = () => (
        <div className="grid grid-cols-5 border-b border-stroke py-5 px-5 dark:border-strokedark">
            {tableHeaders.map((header, index) => (
                <div key={index} className="flex items-center px-2">
                    <p className="text-sm text-black dark:text-white font-semibold">{header}</p>
                </div>
            ))}
        </div>
    );


    const renderTableRows = (sectionData, section) => {
        return sectionData.map((item, index) => {
            const [reviewerComment, setReviewerComment] = useState(item.reviewer_comment || "");
            const [rating, setRating] = useState(item.rating || "No");
            const [isChanged, setIsChanged] = useState(false);
            const [narrative, setNarrative] = useState(() => {
                return item.narrative.find((n) => n.score === item.score)?.text || "Narrative not found";
            });
    
            useEffect(() => {
                if (!isChanged) {
                    setRating(item.rating || "No");
                    setReviewerComment(item.reviewer_comment || "");
                    const updatedNarrative = 
                        item.narrative.find((n) => n.score === item.score)?.text || "Narrative not found";
                    setNarrative(updatedNarrative);
                }
            }, [item, isChanged]);
    
            const handleRatingChange = (newRating) => {
                setRating(newRating);
                setIsChanged(true);
    
                const newScore = newRating === "No" ? 0 : newRating === "Maybe" ? 1 : 2;
                item.score = newScore;
    
                const updatedNarrative = item.narrative.find((n) => n.score === newScore)?.text || "Narrative not found";
                setNarrative(updatedNarrative);
            };
    
            const handleSave = () => {
                const updatedItem = {
                    ...item,
                    score: rating === "No" ? 0 : rating === "Maybe" ? 1 : 2,
                    reviewer_comment: reviewerComment,
                    rating: rating,
                };
    
                // Update the backend or parent component
                publishItem(item.subDomain, index, updatedItem);
    
                // Reflect the updated values in the `item`
                item.reviewer_comment = reviewerComment;
                item.rating = rating;
                item.score = rating === "No" ? 0 : rating === "Maybe" ? 1 : 2;
    
                setIsChanged(false); // Reset change flag after saving
            };
    
            return (
                <div className="grid grid-cols-5 border-t border-stroke py-5 px-5 dark:border-strokedark" key={index}>
                    <div className="flex items-center px-2">
                        <p className="text-sm text-black dark:text-white">{item.subDomain}</p>
                    </div>
                    <div className="flex items-center px-2">
                        <DropdownTwo
                            value={rating}
                            onChange={(e) => handleRatingChange(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center px-2">
                        <p className="text-sm text-black dark:text-white">{narrative}</p>
                    </div>
                    <div className="flex items-center px-2">
                        <textarea
                            className="resize-none p-2 text-sm text-black dark:text-white w-full h-24 border border-stroke dark:border-strokedark bg-gray-100 dark:bg-gray-800"
                            value={reviewerComment}
                            onChange={(e) => {
                                setReviewerComment(e.target.value);
                                setIsChanged(true);
                            }}
                        />
                    </div>
                    <div className="flex items-center px-2 justify-center space-x-2">
                        <button
                            onClick={() => previewItem(item)}
                            className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                        >
                            Preview
                        </button>
                        <button
                            onClick={handleSave}
                            className={`px-4 py-2 rounded-lg ${isChanged ? 'bg-green-500' : 'bg-black opacity-10 cursor-not-allowed'} text-white`}
                            disabled={!isChanged}
                        >
                            Save
                        </button>
                    </div>
                </div>
            );
        });
    };
    
    
    
    

    const cleanTitle = (title) => {
        return title.replace(/^\d+\.\s*/, "").replace(/Report\s*$/, "");
    };

    const renderSection = (title, sectionData) => {
        return (
            <div className="mt-4 rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-4">
                <div className="py-6 px-4 md:px-6 xl:px-7.5 flex justify-between items-center">
                    <h4 className="text-xl font-semibold text-sky-700 dark:text-white">{title}</h4>
                </div>
                <div>
                    {Object.keys(sectionData).map((subTitle, index) => (
                        <div key={index}>
                            <div className="bg-gray-100 p-4 dark:bg-gray-800">
                                <h5 className="text-lg font-bold text-gray-700 dark:text-gray-300">{subTitle}</h5>
                                {renderTableHeaders()}
                                {renderTableRows(Array.isArray(sectionData[subTitle]) ? sectionData[subTitle] : [])}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };
    





    const previewItem = (item) => {
        setCurrentItem(item);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setCurrentItem(null);
    };


    const openPublishModel = () => {
        setPublishModalOpen(true);
    };

    const closePublishModal = () => {
        setPublishModalOpen(false);
    };


    const publishItem = (subDomain, index, changedData) => {
        console.log('Publishing changes for:', subDomain, index, changedData);

        // Assuming you have parsedData with userId from sessionStorage
        const userId = selectedData?.id; // Get the userId from the parsedData

        if (!userId) {
            console.error('User ID not found');
            return;
        }

        // Send the update to the backend
        submitChanges(subDomain, changedData, userId);
    };

    const submitChanges = async (subDomain, changedData, userId) => {
        console.log('Submitting changes for:', subDomain, changedData);

        try {
            const payload = {
                userId: userId, // Include userId to ensure the update is for the right user
                subDomain: subDomain,
                score: changedData.score,
                rating: changedData.rating,
                reviewer_comment: changedData.reviewer_comment
            };

            // Call your backend API to update the data for this user
            await publishChanges(payload); // Ensure you handle the API response properly



            toast.success('Changes successfully submitted');
        } catch (error) {
            toast.error('Error submitting changes');
            console.error('Error submitting changes:', error);
        }
    };

    const exportToPDF = () => {
        const doc = new jsPDF();

        let yPosition = 20;  // Initial Y position for PDF content

        // Add centered title at the top (Selected Name Report)
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        const title = selectedData ? `${selectedData.name.toUpperCase()} REPORT` : "REPORT";
        const titleWidth = doc.getTextWidth(title);
        const titleX = (doc.internal.pageSize.width - titleWidth) / 2; // Center the title
        doc.text(title, titleX, yPosition);
        yPosition += 20;  // Add space after title

        // Define custom column widths
        const columnWidths = {
            subDomain: 30,  // Smaller width for Sub Domain
            narrative: 100, // Larger width for Narrative
            comments: 50    // Medium width for Comments
        };

        // Column headers (only three titles: Sub Domain, Narrative, Comments)
        const tableHeaders = ["Sub Domain", "Narrative", "Comments"];

        // Iterate over all sections
        Object.keys(data).forEach((sectionTitle) => {
            const sectionData = data[sectionTitle];

            // Add section title with bold formatting and capitalize it
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text(sectionTitle.toUpperCase(), 10, yPosition);  // Section title in uppercase
            yPosition += 10;  // Move down to the next line

            // Empty row for spacing between section and content
            yPosition += 5;

            // Iterate over sub-sections
            Object.keys(sectionData).forEach((subTitle) => {
                const subSectionData = sectionData[subTitle];

                // Capitalize only the first letter of the string
                const capitalizeFirstLetter = (str) => {
                    if (!str) return str; // Return empty string if input is empty
                    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
                };

                // Add sub-title with bold formatting and capitalize the first letter only
                doc.setFontSize(10);
                doc.setFont("helvetica", "bold");
                doc.text(capitalizeFirstLetter(subTitle), 10, yPosition);  // Capitalize only first letter
                yPosition += 5;

                // Add headers for table (Sub Domain, Report Narrative, Comments) only once per sub-section
                doc.autoTable({
                    startY: yPosition,

                    head: [tableHeaders],
                    body: [],
                    theme: "grid",
                    margin: { top: 5 },

                    styles: { fontSize: 8 },
                    columnStyles: {
                        0: { cellWidth: columnWidths.subDomain, fontStyle: "bold" },  // Sub Domain column width
                        1: { cellWidth: columnWidths.narrative },  // Narrative column width
                        2: { cellWidth: columnWidths.comments }   // Comments column width
                    },
                    didDrawPage: function (data) {
                        yPosition = data.cursor.y;
                    },
                });

                // Add rows for each item in the sub-section
                if (Array.isArray(subSectionData)) {
                    subSectionData.forEach((item) => {
                        const narrative = item.narrative.find((n) => n.score === item.score)?.text || "Narrative not found";
                        const comment = item.reviewer_comment || "No comments";

                        doc.autoTable({
                            startY: yPosition,
                            body: [
                                [item.subDomain, narrative, comment]
                            ],
                            theme: "grid",
                            margin: { top: 5 },
                            styles: { fontSize: 8 },
                            columnStyles: {
                                0: { cellWidth: columnWidths.subDomain, fontStyle: "bold" },  // Sub Domain column width
                                1: { cellWidth: columnWidths.narrative },  // Narrative column width
                                2: { cellWidth: columnWidths.comments }   // Comments column width
                            },
                            didDrawPage: function (data) {
                                yPosition = data.cursor.y;
                            },
                        });
                    });
                }

                yPosition += 10;  // Add spacing after sub-sections
            });

            yPosition += 10; // Add spacing between sections
        });

        // Save the PDF document
        doc.save(`${selectedData ? selectedData.name : "report"}.pdf`);
    };


    const handlePublishClick = async () => {
        const doc = new jsPDF();
    
        let yPosition = 20; // Initial Y position for PDF content
    
        // Add centered title at the top (Selected Name Report)
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        const title = selectedData ? `${selectedData.name.toUpperCase()} REPORT` : "REPORT";
        const titleWidth = doc.getTextWidth(title);
        const titleX = (doc.internal.pageSize.width - titleWidth) / 2; // Center the title
        doc.text(title, titleX, yPosition);
        yPosition += 20; // Add space after title
    
        // Define custom column widths
        const columnWidths = {
            subDomain: 30, // Smaller width for Sub Domain
            narrative: 100, // Larger width for Narrative
            comments: 50, // Medium width for Comments
        };
    
        // Column headers
        const tableHeaders = ["Sub Domain", "Narrative", "Comments"];
    
        // Iterate over all sections
        Object.keys(data).forEach((sectionTitle) => {
            const sectionData = data[sectionTitle];
    
            // Add section title
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text(sectionTitle.toUpperCase(), 10, yPosition);
            yPosition += 10;
    
            // Empty row for spacing between section and content
            yPosition += 5;
    
            // Iterate over sub-sections
            Object.keys(sectionData).forEach((subTitle) => {
                const subSectionData = sectionData[subTitle];
    
                // Add sub-title
                doc.setFontSize(10);
                doc.setFont("helvetica", "bold");
                doc.text(subTitle.charAt(0).toUpperCase() + subTitle.slice(1).toLowerCase(), 10, yPosition);
                yPosition += 5;
    
                // Add rows for each item in the sub-section
                if (Array.isArray(subSectionData)) {
                    subSectionData.forEach((item) => {
                        const narrative = item.narrative.find((n) => n.score === item.score)?.text || "Narrative not found";
                        const comment = item.reviewer_comment || "No comments";
    
                        doc.autoTable({
                            startY: yPosition,
                            head: [tableHeaders],
                            body: [[item.subDomain, narrative, comment]],
                            theme: "grid",
                            styles: { fontSize: 8 },
                            columnStyles: {
                                0: { cellWidth: columnWidths.subDomain },
                                1: { cellWidth: columnWidths.narrative },
                                2: { cellWidth: columnWidths.comments },
                            },
                            didDrawPage: (data) => {
                                yPosition = data.cursor.y;
                            },
                        });
                    });
                }
    
                yPosition += 10;
            });
    
            yPosition += 10;
        });
    
        // Convert PDF to Blob
        const pdfBlob = doc.output("blob");
    
        // Convert Blob to File
        const pdfFile = new File([pdfBlob], `${selectedData?.name || "report"}.pdf`, {
            type: "application/pdf",
        });
    
        // Create data to publish
        const publishData = {
            file: pdfFile, // Use the file object
            userId: selectedData?.id, // Add the user ID or any related identifier
        };
    
        try {
            // Call `publishUser` with the data
            const response = await publishUser(publishData);
            console.log("Publish response:", response);

            closePublishModal();
            toast.success("Document published successfully!");
            router.push("/applicationList");
        } catch (error) {
            console.error("Publish error:", error);
            toast.error("Failed to publish document.");
        }
    };
    
    
    
    

    return (
        <div>
            <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-4">
                <div className="py-6 px-4 md:px-6 xl:px-7.5 flex justify-between items-center">
                    <h4 className="text-xl font-semibold text-black dark:text-white">
                        {selectedData ? `${selectedData.name} Report` : "Loading..."}
                    </h4>
                    <div className="ml-auto flex gap-2">
                        <button
                            onClick={exportToPDF}
                            className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                        >
                            Export to PDF
                        </button>
                        <button
                            className="px-4 py-2 bg-green-500 text-white rounded"
                            onClick={() => {
                                console.log('Publish button clicked');
                                setPublishModalOpen(true); // Open publish modal      
                            }}                            
                        >
                            Publish
                        </button>
                    </div>
                </div>
            </div>

            {data && renderSection("Commercial", data.commercial)}
            {data && renderSection("Financial", data.financial)}
            {data && renderSection("Operations", data.operations)}
            {data && renderSection("Legal", data.legal)}



            {modalOpen && currentItem && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
                        <h3 className="text-lg font-bold mb-4 text-gray-700 dark:text-gray-300">Comment & Attachment</h3>
                        <p className="text-sm text-gray-700 dark:text-gray-400 mb-4">
                            {currentItem.comments || "No comments available."}
                        </p>
                        {currentItem.attachment && (
                            <div className="flex flex-col gap-2">
                                <a
                                    href={`http://${currentItem.attachment}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 font-normal underline"
                                >
                                    Preview Document
                                </a>
                            </div>
                        )}

                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={closeModal}
                                className="bg-red-500 text-white px-4 py-2 rounded-lg"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

{publishModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
                    <h3 className="text-lg font-bold mb-4 text-gray-700 dark:text-gray-300">
                        Alert!
                    </h3>
                    <p className="text-base font-normal mb-10 text-gray-700 dark:text-gray-300">
                        Are you sure you want to publish the results?
                    </p>
                    <div className="flex justify-end gap-4">
                        <button   
                            onClick={closePublishModal}
                            className="bg-slate-100 text-black px-4 py-2 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handlePublishClick}
                            className="bg-green-500 text-white px-4 py-2 rounded-lg"
                        >
                             Publish
                        </button>
                    </div>
                </div>
            </div>
            )}

        </div>

    );
};

export default Page;
