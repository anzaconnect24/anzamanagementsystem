"use client";
import React, { useState, useEffect } from 'react';
import dynamic from "next/dynamic";
import { getScoreData } from "@/app/controllers/crat_general_controller";

// Import ReactApexChart dynamically to avoid SSR issues
const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const PerformanceDistribution = ({ userDetails, initialScoreData }) => {
  const [scoreData, setScoreData] = useState(initialScoreData || {});
  const [loading, setLoading] = useState(!initialScoreData);

  // Fetch data if not provided as prop
  useEffect(() => {
    if (!initialScoreData) {
      setLoading(true);
      getScoreData().then((res) => {
        setScoreData(res);
        setLoading(false);
      }).catch(error => {
        console.error("Error fetching score data:", error);
        setLoading(false);
      });
    }
  }, [initialScoreData]);

  // Calculate the overall average score
  const calculateOverallScore = () => {
    const scores = [
      scoreData.commercial?.percentage || 0,
      scoreData.financial?.percentage || 0,
      scoreData.operations?.percentage || 0,
      scoreData.legal?.percentage || 0
    ];
    
    // Calculate the average and round to whole number
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  };

  const overallScore = calculateOverallScore();
  const remainingScore = 100 - overallScore;

  // Donut chart options and series
  const donutChartOptions = {
    chart: {
      type: 'donut',
      height: 350,
      fontFamily: 'Inter, sans-serif',
      background: 'transparent'
    },
    plotOptions: {
      pie: {
        donut: {
          size: '75%',
          labels: {
            show: true,
            name: {
              show: false
            },
            value: {
              show: true,
              fontSize: '36px',
              fontWeight: 600,
              color: '#111827',
              formatter: function(val) {
                return overallScore + '%';
              }
            },
            total: {
              show: true,
              fontSize: '16px',
              fontWeight: 500,
              label: 'Total Score',
              color: '#6B7280',
              formatter: function() {
                return overallScore + '%';
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
      show: false
    },
    stroke: {
      width: 0
    },
    colors: ['#10B981', '#E5E7EB'],
    tooltip: {
      enabled: false
    }
  };

  const donutChartSeries = [overallScore, remainingScore];

  return (
    <div className="bg-white rounded-sm border border-stroke p-5 pt-7.5 pb-5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 mb-8">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-black dark:text-white">
          Performance Distribution
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Overall assessment score across domains
        </p>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="mb-4">
              <svg className="animate-spin h-8 w-8 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <span className="text-gray-400">Loading performance data...</span>
          </div>
        </div>
      ) : (
        <div className="flex justify-center">
          <div style={{ width: '100%', maxWidth: '400px' }}>
            <ReactApexChart
              options={donutChartOptions}
              series={donutChartSeries}
              type="donut"
              height={350}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceDistribution; 