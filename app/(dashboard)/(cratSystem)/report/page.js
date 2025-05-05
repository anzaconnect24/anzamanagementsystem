"use client";
import { useState, useContext, useEffect } from "react";
import { getReportData, getScoreData, initialData, publishReport } from "@/app/controllers/crat_general_controller"; // Import updated API functions
import Modal2 from "@/components/Model2";
import toast from 'react-hot-toast';
import { UserContext } from "../../../(dashboard)/layout";
import Loader from "@/components/common/Loader";
import dynamic from 'next/dynamic';
const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

// Define the table headers
// const tableHeaders = ["Sub Domain", "Score", "Report Narrative"];
const tableHeaders = ["Sub Domain", "Score", "Report Narrative"];

const Page = () => {
  const [data, setData] = useState(initialData);
  const [scoreData, setScoreData] = useState({}); // State to hold the score data
  const [deletemodalOpen, publishModalOpen] = useState(false);
  const [deletemodalMessage, publishModalMessage] = useState("");
  const [generalStatus, setGeneralStatus] = useState("Not Ready"); // Add this
  const { userDetails, setUserDetails } = useContext(UserContext)
  const [loading, setLoading] = useState(true);



  useEffect(() => {


    fetchData();
    setLoading(false);
  }, []);


  const fetchData = async () => {
    try {
      const responseData = await getReportData();
      //  console.log('report data', responseData);
      const responseData1 = await getScoreData();
      setScoreData(responseData1);
      setGeneralStatus(responseData1?.general_status || "Not Ready");
      console.log('general status:', userDetails);

      updateDataWithBackendResponse(responseData);
    } catch (error) {
      console.log("Error fetching data:", error);
    }
  };

  const updateDataWithBackendResponse = (responseData) => {
    const updatedData = { ...data };

    responseData.forEach((responseItem) => {
      const { subDomain, score } = responseItem;

      Object.keys(updatedData).forEach((section) => {
        if (Array.isArray(updatedData[section])) {
          updatedData[section].forEach((subDomainGroup) => {
            if (subDomainGroup.subDomain === subDomain) {
              subDomainGroup.score = score;
            }
          });
        } else {
          Object.keys(updatedData[section]).forEach((subSection) => {
            if (Array.isArray(updatedData[section][subSection])) {
              updatedData[section][subSection].forEach((subDomainGroup) => {
                if (subDomainGroup.subDomain === subDomain) {
                  subDomainGroup.score = score;
                }
              });
            }
          });
        }
      });
    });

    setData(updatedData);
  };


  const publishChanges = async () => {
    try {
      await publishReport(userDetails.id, userDetails.versionCount, userDetails.publishStatus);

      setUserDetails((prevDetails) => ({
        ...prevDetails, // Copy existing properties
        publishStatus: "On review", // Update the publishStatus property
      }));

      publishModalOpen(false)
      toast.success("Published Successfully");
      console.log("Changes successfully submitted");
    } catch (error) {
      // Handle errors
      toast.error("Error publishing report");
      console.error("Error publishing report:", error);
    }
  };


  const openPublishDialog = (data) => {
    console.log(userDetails)
    publishModalOpen(true);
    publishModalMessage('Are you sure you want to publish this report for review?');
  };

  const handleDeleteCancel = () => {
    publishModalOpen(false);
  };

  const handleDeleteFile = async () => {
    const [domain, id, attachment, section, index] = deleteCache;
    try {
      // Proceed with deletion directly
      await deleteAttachment(domain, id, attachment, section, index);
      handleRatingChange(section, index, "No");
      submitChanges();
      // Fetch updated data
      const responseData = await getOperationData();
      const updatedData = { ...initialDataTemplate };

      Object.keys(updatedData).forEach((section) => {
        updatedData[section] = updatedData[section].map((item) => {
          const fetchedItem = responseData.find((dataItem) => dataItem.subDomain === item.subDomain);
          return fetchedItem
            ? { ...item, rating: fetchedItem.rating, userId: fetchedItem.userId, score: fetchedItem.score, attachment: fetchedItem.attachment }
            : item;
        });
      });

      toast.success('Deleted Successfully');
      setData(updatedData);
      publishModalOpen(false); // Close modal
    } catch (error) {
      toast.error("Error deleting file");
      console.error("Error deleting file:", error);
    }
  };

  const renderTableHeaders = () => (
    <div className="grid grid-cols-3 border-b border-stroke py-4 px-4 dark:border-strokedark">
      {tableHeaders.map((header, index) => (
        <div key={index} className="flex items-center px-2">
          <p className="text-sm text-black dark:text-white font-semibold">{header}</p>
        </div>
      ))}
    </div>
  );

  const renderTableRows = (sectionData) => {
    return sectionData.map((item, index) => {
      const narrative = item.narrative.find((n) => n.score === item.score)?.text || "Narrative not found";
      return (
        <div className="grid grid-cols-3 border-t border-stroke py-4 px-4 dark:border-strokedark" key={index}>
          <div className="flex items-center px-2">
            <p className="text-sm text-black dark:text-white">{item.subDomain}</p>
          </div>
          <div className="flex items-center px-2">
            <p className="text-sm text-black dark:text-white">{item.score}</p>
          </div>
          <div className="flex items-center px-2">
            <p className="text-sm text-black dark:text-white">{narrative}</p>
          </div>
        </div>
      );
    });
  };

  const cleanTitle = (title) => {
    return title.replace(/^\d+\.\s*/, "").replace(/Report\s*$/, "");
  };

  // Multi-bar chart for the 4 sections
  const renderOverallChart = () => {
    const donutChartOptions = {
      chart: {
        type: 'donut',
        height: 350
      },
      labels: ['Commercial', 'Financial', 'Operations', 'Legal'],
      colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'],
      plotOptions: {
        pie: {
          donut: {
            size: '70%',
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: '14px',
                fontWeight: 500,
                color: '#6B7280'
              },
              value: {
                show: true,
                fontSize: '16px',
                fontWeight: 600,
                color: '#111827',
                formatter: function (val) {
                  return val + '%';
                }
              },
              total: {
                show: true,
                label: 'Total',
                formatter: function (w) {
                  return w.globals.seriesTotals.reduce((a, b) => a + b, 0) / w.globals.series.length + '%';
                }
              }
            }
          }
        }
      },
      dataLabels: {
        enabled: false
      },
      legend: {
        position: 'bottom',
        horizontalAlign: 'center',
        fontSize: '12px',
        markers: {
          width: 12,
          height: 12,
          radius: 12
        },
        itemMargin: {
          horizontal: 8
        }
      }
    };

    const donutChartSeries = [
      scoreData.commercial?.percentage || 0,
      scoreData.financial?.percentage || 0,
      scoreData.operations?.percentage || 0,
      scoreData.legal?.percentage || 0
    ];

    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Performance Distribution</h3>
        <p className="text-sm text-gray-500 mb-4">Overall distribution across domains</p>
        <ReactApexChart 
          options={donutChartOptions} 
          series={donutChartSeries} 
          type="donut" 
          height={350}
        />
      </div>
    );
  };

  const renderSection = (title, sectionData) => {
    // Generate the key from the title
    const domainKey = title.toLowerCase().replace(/[^a-z]/g, "");

    // Get the score status and percentage from scoreData
    const sectionScore = scoreData[domainKey]?.percentage || 0;
    const sectionStatus = scoreData[domainKey]?.status || "Not ready";

    // Determine the status color
    const overallStatusColor = sectionStatus === "Ready" ? "text-green-500" : "text-red-500";

    return (
      <div className="mt-4 rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-4">
        <div className="py-6 px-4 md:px-6 xl:px-7.5 flex justify-between items-center">
          <h4 className="text-xl font-semibold text-sky-700 dark:text-white">{title}</h4>
        </div>
        <div className="grid grid-cols-2 border-t-2 border-b-2 border-stroke py-4 px-4 dark:border-strokedark">
          <div className="flex items-center px-2">
            <p className="text-sm text-black dark:text-white font-semibold">Overall {cleanTitle(title)} Readiness</p>
          </div>
          <div className="flex items-center justify-end px-2">
            <p className={`text-sm font-semibold ${overallStatusColor}`}>{sectionStatus}</p>
          </div>
        </div>
        <div>
          {Object.keys(sectionData).map((subTitle, index) => (
            <div key={index}>
              <div className="bg-gray-100 p-4 dark:bg-gray-800">
                <h5 className="text-lg font-bold text-gray-700 dark:text-gray-300">{subTitle}</h5>
                {renderTableHeaders()}
                {renderTableRows(sectionData[subTitle])}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };


  return !loading ? (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Business Assessment Report</h2>
              <p className="text-sm text-gray-500 mt-1">Version {userDetails.versionCount}</p>
            </div>
            <div className="flex space-x-3">
              {userDetails.publishStatus === "Draft" ? (
                <>
                  {userDetails.reportPdf && (
                    <button
                      className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      onClick={() => window.open(`http://${userDetails.reportPdf}`, '_blank')}
                    >
                      View Report
                    </button>
                  )}
                  <button
                    className={`px-4 py-2 text-white rounded-lg transition-colors ${
                      generalStatus === 'Not ready'
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                    onClick={openPublishDialog}
                    disabled={generalStatus === 'Not ready'}
                  >
                    Publish
                  </button>
                </>
              ) : (
                <button className="px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed" disabled>
                  {userDetails.publishStatus}
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="p-6">
          {renderOverallChart()}
        </div>
      </div>

      {renderSection("Commercial", data.commercial)}
      {renderSection("Financial", data.financial)}
      {renderSection("Operations", data.operations)}
      {renderSection("Legal", data.legal)}

      <Modal2
        isOpen={deletemodalOpen}
        onClose={() => publishModalOpen(false)}
        message={deletemodalMessage}
        onDelete={() => publishChanges()}
        onCancel={handleDeleteCancel}
        bgColor="yellow-200"
        closeButtonText="Cancel"
        deleteButtonText="Publish"
        closeButtonColor="gray-500"
        deleteButtonColor="blue-500"
      />
    </div>
  ) : (<Loader />);
};

export default Page;
