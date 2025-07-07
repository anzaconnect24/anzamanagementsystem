"use client";
import React, { useState } from 'react';
import { generateExecutiveSummary } from '@/app/services/geminiAI';

const AIDemo = () => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  // Sample CRAT data for demonstration
  const sampleScoreData = {
    commercial: { percentage: 65, status: "Not Ready" },
    financial: { percentage: 70, status: "Ready" },
    operations: { percentage: 55, status: "Not Ready" },
    legal: { percentage: 60, status: "Not Ready" },
    general_status: "Not Ready"
  };

  const testAI = async () => {
    try {
      setLoading(true);
      const result = await generateExecutiveSummary(sampleScoreData, "Not Ready");
      setAnalysis(result);
    } catch (error) {
      console.error('AI Test Error:', error);
      setAnalysis({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-black dark:text-white mb-2">
          🧪 AI Integration Test
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Test the Gemini AI integration with sample CRAT data
        </p>
      </div>

      <div className="mb-4">
        <h4 className="font-medium mb-2">Sample Assessment Scores:</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>Commercial: {sampleScoreData.commercial.percentage}%</div>
          <div>Financial: {sampleScoreData.financial.percentage}%</div>
          <div>Operations: {sampleScoreData.operations.percentage}%</div>
          <div>Legal: {sampleScoreData.legal.percentage}%</div>
        </div>
      </div>

      <button
        onClick={testAI}
        disabled={loading}
        className="mb-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80 disabled:bg-gray-400 transition-colors"
      >
        {loading ? 'Testing AI...' : 'Test AI Analysis'}
      </button>

      {analysis && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          {analysis.error ? (
            <div className="text-red-600">
              <strong>Error:</strong> {analysis.error}
              <div className="mt-2 text-sm">
                Make sure you have set the NEXT_PUBLIC_GEMINI_API_KEY environment variable.
              </div>
            </div>
          ) : (
            <div>
              <h4 className="font-medium mb-2">AI Analysis Result:</h4>
              <div className="whitespace-pre-wrap text-sm">
                {analysis.summary || JSON.stringify(analysis, null, 2)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIDemo; 