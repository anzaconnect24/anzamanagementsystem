"use client";
import React, { useState, useContext } from 'react';
import { testGeminiConnection, analyzeCompleteReport } from '../../app/services/geminiAI';
import { UserContext } from '../../app/(dashboard)/layout';

const AITestComponent = () => {
  const { userDetails } = useContext(UserContext);
  const [testResult, setTestResult] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const runConnectionTest = async () => {
    setLoading(true);
    setTestResult(null);
    
    try {
      console.log('🧪 Starting AI connection test...');
      const result = await testGeminiConnection();
      console.log('📊 Connection test result:', result);
      setTestResult(result);
    } catch (error) {
      console.error('❌ Connection test error:', error);
      setTestResult({
        success: false,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const runFullAnalysisTest = async () => {
    setAnalysisLoading(true);
    setAnalysisResult(null);
    
    try {
      console.log('🔍 Starting full AI analysis test...');
      
      // Sample test data
      const sampleReportData = {
        commercial: { responses: ['Yes', 'No', 'Yes'], score: 67 },
        financial: { responses: ['Yes', 'Yes', 'No'], score: 75 },
        operations: { responses: ['No', 'Yes', 'Yes'], score: 60 },
        legal: { responses: ['Yes', 'Yes', 'Yes'], score: 85 }
      };
      
      const sampleScoreData = {
        commercial: { percentage: 67, status: 'Good' },
        financial: { percentage: 75, status: 'Good' },
        operations: { percentage: 60, status: 'Fair' },
        legal: { percentage: 85, status: 'Excellent' },
        general_status: 'Investment Ready'
      };
      
      const sampleBusinessInfo = {
        name: 'TechStart Solutions',
        sector: 'Technology',
        location: 'Dar es Salaam, Tanzania',
        stage: 'Growth Stage'
      };
      
      const result = await analyzeCompleteReport(sampleReportData, sampleScoreData, sampleBusinessInfo);
      console.log('✅ Analysis completed:', result);
      setAnalysisResult({ success: true, data: result });
    } catch (error) {
      console.error('❌ Analysis test error:', error);
      setAnalysisResult({
        success: false,
        error: error.message
      });
    } finally {
      setAnalysisLoading(false);
    }
  };

  // Check if user is admin
  const isAdmin = userDetails?.role === 'Admin';

  if (!isAdmin) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <div className="mb-3">
            <svg className="w-12 h-12 text-red-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-red-600 mb-2">🔒 Admin Access Required</h3>
          <p className="text-gray-500">AI testing tools are restricted to Administrators only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-xl font-bold mb-6 text-gray-800">🤖 AI Service Testing Panel (Admin Only)</h3>
      
      {/* Connection Test */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold mb-3">Step 1: Connection Test</h4>
        <button
          onClick={runConnectionTest}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Testing Connection...' : 'Test AI Connection'}
        </button>

        {testResult && (
          <div className={`mt-4 p-4 rounded ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <h5 className={`font-semibold ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
              {testResult.success ? '✅ Connection Successful' : '❌ Connection Failed'}
            </h5>
            <p className={`mt-2 ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
              {testResult.success ? testResult.message : testResult.error}
            </p>
          </div>
        )}
      </div>

      {/* Full Analysis Test */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold mb-3">Step 2: Full Analysis Test</h4>
        <p className="text-sm text-gray-600 mb-3">
          Tests the complete AI analysis with sample business data
        </p>
        <button
          onClick={runFullAnalysisTest}
          disabled={analysisLoading || (testResult && !testResult.success)}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {analysisLoading ? 'Running Analysis...' : 'Test Full AI Analysis'}
        </button>

        {analysisResult && (
          <div className={`mt-4 p-4 rounded max-h-96 overflow-y-auto ${analysisResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <h5 className={`font-semibold ${analysisResult.success ? 'text-green-800' : 'text-red-800'}`}>
              {analysisResult.success ? '✅ Analysis Successful' : '❌ Analysis Failed'}
            </h5>
            {analysisResult.success ? (
              <div className="mt-2 text-green-700 text-sm">
                <p><strong>Executive Summary Generated:</strong> {analysisResult.data.executiveSummary ? 'Yes' : 'No'}</p>
                <p><strong>Investment Thesis:</strong> {analysisResult.data.investmentThesis ? 'Yes' : 'No'}</p>
                <p><strong>Recommendations:</strong> {analysisResult.data.recommendations?.length || 0} items</p>
                <p><strong>Analysis Length:</strong> {JSON.stringify(analysisResult.data).length} characters</p>
                <details className="mt-2">
                  <summary className="cursor-pointer font-medium">View Full Analysis</summary>
                  <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-x-auto">
                    {JSON.stringify(analysisResult.data, null, 2)}
                  </pre>
                </details>
              </div>
            ) : (
              <p className="mt-2 text-red-700">
                {analysisResult.error}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Testing Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded p-4">
        <h5 className="font-semibold text-blue-800 mb-2">📋 Testing Instructions</h5>
        <ol className="text-sm text-blue-700 space-y-1">
          <li>1. First run the connection test to verify API access</li>
          <li>2. If successful, run the full analysis test</li>
          <li>3. Check console (F12) for detailed logs</li>
          <li>4. Test real data by completing a CRAT assessment</li>
        </ol>
      </div>
    </div>
  );
};

export default AITestComponent; 