import { analyzeCompleteReport, generateExecutiveSummary } from './geminiAI';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * AI Report Service - Handles AI analysis reports, saving, downloading, and management
 */
export class AIReportService {
  constructor() {
    this.reports = new Map(); // In-memory storage for demo (replace with database in production)
  }

  /**
   * Generate complete AI analysis report
   */
  async generateCompleteReport(reportData, scoreData, businessInfo, userDetails) {
    try {
      const timestamp = new Date().toISOString();
      const reportId = `ai-report-${Date.now()}`;

      console.log('🤖 Starting AI analysis generation...');
      console.log('📋 Input validation:', {
        hasReportData: !!reportData,
        hasScoreData: !!scoreData,
        hasBusinessInfo: !!businessInfo,
        userRole: userDetails?.role
      });
      
      // Validate inputs
      if (!scoreData) {
        throw new Error('Score data is required for AI analysis');
      }
      
      if (!businessInfo) {
        console.warn('⚠️ Business info not provided, using defaults');
        businessInfo = { name: 'Unknown Business', sector: 'Unknown', location: 'Unknown' };
      }
      
      // Generate AI analysis with retry logic
      let aiAnalysis;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          console.log(`🔄 AI Analysis attempt ${retryCount + 1}/${maxRetries}`);
          console.log('📊 Calling analyzeCompleteReport with:', {
            reportDataType: typeof reportData,
            scoreDataType: typeof scoreData,
            businessInfoType: typeof businessInfo,
            scoreDataKeys: scoreData ? Object.keys(scoreData) : 'null'
          });
          
          console.log('🔍 analyzeCompleteReport function:', {
            isFunction: typeof analyzeCompleteReport === 'function',
            functionName: analyzeCompleteReport?.name,
            functionString: analyzeCompleteReport?.toString().substring(0, 100)
          });
          
          aiAnalysis = await analyzeCompleteReport(reportData, scoreData, businessInfo);
          console.log('✅ AI Analysis successful, result type:', typeof aiAnalysis);
          break;
        } catch (error) {
          retryCount++;
          console.error(`❌ AI Analysis attempt ${retryCount} failed:`, error);
          console.error('❌ Full error object:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
            cause: error.cause
          });
          
          if (retryCount >= maxRetries) {
            console.error('❌ All retry attempts failed, throwing error');
            throw error;
          }
          
          // Wait before retry (exponential backoff)
          const waitTime = Math.pow(2, retryCount) * 1000;
          console.log(`⏳ Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
      
      // Create comprehensive report object
      const completeReport = {
        id: reportId,
        timestamp,
        businessInfo,
        userDetails: {
          name: userDetails?.name || 'Unknown',
          email: userDetails?.email || 'Unknown',
          role: userDetails?.role || 'Unknown'
        },
        assessmentData: {
          scoreData,
          reportData
        },
        aiAnalysis,
        metadata: {
          aiModel: 'Gemini 1.5 Pro',
          analysisType: 'Complete CRAT Assessment',
          version: '1.0',
          retryCount
        }
      };

      // Save report
      this.saveReport(reportId, completeReport);
      
      console.log('✅ AI analysis completed successfully');
      return completeReport;
    } catch (error) {
      console.error('❌ Error generating AI report:', error);
      
      // Return a meaningful error message
      const errorMessage = error.message || 'Unknown error occurred during AI analysis';
      throw new Error(`AI Report Generation Failed: ${errorMessage}`);
    }
  }

  /**
   * Save report to storage (in-memory for demo, database in production)
   */
  saveReport(reportId, report) {
    this.reports.set(reportId, report);
    
    // Also save to localStorage for persistence across sessions
    try {
      const savedReports = JSON.parse(localStorage.getItem('aiReports') || '{}');
      savedReports[reportId] = report;
      localStorage.setItem('aiReports', JSON.stringify(savedReports));
    } catch (error) {
      console.warn('Could not save to localStorage:', error);
    }
  }

  /**
   * Get saved reports
   */
  getSavedReports() {
    try {
      const savedReports = JSON.parse(localStorage.getItem('aiReports') || '{}');
      return Object.values(savedReports).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      console.warn('Could not load from localStorage:', error);
      return Array.from(this.reports.values());
    }
  }

  /**
   * Get specific report by ID
   */
  getReport(reportId) {
    try {
      const savedReports = JSON.parse(localStorage.getItem('aiReports') || '{}');
      return savedReports[reportId] || this.reports.get(reportId);
    } catch (error) {
      return this.reports.get(reportId);
    }
  }

  /**
   * Delete report
   */
  deleteReport(reportId) {
    this.reports.delete(reportId);
    
    try {
      const savedReports = JSON.parse(localStorage.getItem('aiReports') || '{}');
      delete savedReports[reportId];
      localStorage.setItem('aiReports', JSON.stringify(savedReports));
    } catch (error) {
      console.warn('Could not delete from localStorage:', error);
    }
  }

  /**
   * Helper method to extract sections from AI analysis
   */
  extractSection(fullText, sectionTitle) {
    const regex = new RegExp(`##\\s*${sectionTitle}[^#]*(?=##|$)`, 'is');
    const match = fullText.match(regex);
    if (match) {
      return match[0].replace(`## ${sectionTitle}`, '').trim();
    }
    return null;
  }

  /**
   * Helper method to determine readiness level based on score
   */
  getReadinessLevel(score) {
    if (score >= 75) return 'Ready';
    if (score >= 60) return 'Partially Ready';
    return 'Not Ready';
  }

  /**
   * Get readiness level based on percentage score
   */
  getReadinessLevel(percentage) {
    if (percentage >= 75) return 'Ready';
    if (percentage >= 60) return 'Partially Ready';
    return 'Not Ready';
  }

  /**
   * Calculate average score from score data
   */
  calculateAverageScore(scoreData) {
    const scores = [
      scoreData.commercial?.percentage || 0,
      scoreData.financial?.percentage || 0,
      scoreData.operations?.percentage || 0,
      scoreData.legal?.percentage || 0
    ];
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }

  /**
   * Export comprehensive report as PDF
   */
  exportToPDF(report) {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      let yPosition = margin;

      // Helper function to add text with proper word wrapping and page breaks
      const addWrappedText = (text, x, y, maxWidth, options = {}) => {
        const {
          fontSize = 10,
          fontStyle = 'normal',
          lineHeight = null,
          color = [0, 0, 0],
          alignment = 'left'
        } = options;

        doc.setFontSize(fontSize);
        doc.setFont(undefined, fontStyle);
        doc.setTextColor(color[0], color[1], color[2]);

        if (!text || text.trim() === '') {
          return y + (lineHeight || fontSize * 1.2);
        }

        const actualLineHeight = lineHeight || fontSize * 1.2;
        const lines = doc.splitTextToSize(text.toString(), maxWidth);
        
        let currentY = y;
        lines.forEach((line, index) => {
          // Check if we need a new page
          if (currentY + actualLineHeight > pageHeight - margin - 10) {
            doc.addPage();
            currentY = margin;
          }
          
          if (alignment === 'center') {
            doc.text(line, x + maxWidth / 2, currentY, { align: 'center' });
          } else {
            doc.text(line, x, currentY);
          }
          currentY += actualLineHeight;
        });
        
        return currentY;
      };

      // Helper function to add section with proper spacing
      const addSection = (title, content, options = {}) => {
        const {
          titleFontSize = 14,
          contentFontSize = 10,
          spaceBefore = 15,
          spaceAfter = 10,
          titleColor = [0, 0, 0],
          contentColor = [0, 0, 0]
        } = options;

        // Add space before section
        yPosition += spaceBefore;

        // Check if we need a new page for the section
        if (yPosition + titleFontSize * 2 > pageHeight - margin - 20) {
          doc.addPage();
          yPosition = margin;
        }

        // Add section title
        yPosition = addWrappedText(title, margin, yPosition, pageWidth - 2 * margin, {
          fontSize: titleFontSize,
          fontStyle: 'bold',
          color: titleColor,
          lineHeight: titleFontSize * 1.3
        });

        yPosition += 8;

        // Add content if provided
        if (content && content.trim() !== '') {
          yPosition = addWrappedText(content, margin, yPosition, pageWidth - 2 * margin, {
            fontSize: contentFontSize,
            fontStyle: 'normal',
            color: contentColor,
            lineHeight: contentFontSize * 1.4
          });
        }

        yPosition += spaceAfter;
        return yPosition;
      };

      // Helper function to add a styled box
      const addStyledBox = (x, y, width, height, content, options = {}) => {
        const {
          fillColor = [240, 248, 255],
          borderColor = [0, 123, 255],
          textColor = [0, 0, 0],
          fontSize = 12,
          fontStyle = 'normal'
        } = options;

        // Draw box
        doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
        doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
        doc.rect(x, y, width, height, 'FD');

        // Add content
        if (content) {
          addWrappedText(content, x + 10, y + 15, width - 20, {
            fontSize,
            fontStyle,
            color: textColor
          });
        }

        return y + height;
      };

      // ============= COVER PAGE =============
      
      // Main Title
      yPosition = addWrappedText(
        'COMPREHENSIVE INVESTMENT ANALYSIS',
        margin,
        yPosition,
        pageWidth - 2 * margin,
        { fontSize: 24, fontStyle: 'bold', color: [0, 50, 100], alignment: 'center' }
      );

      yPosition += 10;

      // Subtitle
      yPosition = addWrappedText(
        'Capital Readiness Assessment Report',
        margin,
        yPosition,
        pageWidth - 2 * margin,
        { fontSize: 18, fontStyle: 'normal', color: [0, 50, 100], alignment: 'center' }
      );

      yPosition += 15;

      // Company Information Box
      const companyName = report.businessInfo?.name || 'Confidential Business Entity';
      const sector = report.businessInfo?.sector || 'Multi-sector Operations';
      const location = report.businessInfo?.location || 'East African Region';
      
      const companyInfo = `${companyName}\n\nIndustry: ${sector}\nMarket: ${location}`;
      
      yPosition = addStyledBox(
        margin,
        yPosition,
        pageWidth - 2 * margin,
        60,
        companyInfo,
        {
          fillColor: [240, 248, 255],
          borderColor: [0, 123, 255],
          textColor: [0, 50, 100],
          fontSize: 14,
          fontStyle: 'bold'
        }
      );

      yPosition += 20;

      // Report metadata
      const reportDate = new Date(report.timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      yPosition = addWrappedText(`Analysis Date: ${reportDate}`, margin, yPosition, pageWidth - 2 * margin, {
        fontSize: 11,
        fontStyle: 'normal'
      });

      yPosition = addWrappedText(`Report ID: ${report.id}`, margin, yPosition, pageWidth - 2 * margin, {
        fontSize: 11,
        fontStyle: 'normal'
      });

      yPosition += 20;

      // Table of Contents
      yPosition = addSection('TABLE OF CONTENTS', '', {
        titleFontSize: 16,
        spaceBefore: 20,
        titleColor: [0, 50, 100]
      });

      const tocItems = [
        '1. Executive Summary',
        '2. Assessment Scores Overview',
        '3. Investment Thesis & Market Opportunity',
        '4. Domain Analysis',
        '   4.1 Commercial Excellence',
        '   4.2 Financial Architecture',
        '   4.3 Operational Foundation',
        '   4.4 Legal Framework',
        '5. Strategic Recommendations',
        '6. Risk Assessment & Mitigation',
        '7. Growth Potential & Market Dynamics',
        '8. Investment Decision Framework'
      ];

      tocItems.forEach(item => {
        yPosition = addWrappedText(item, margin + 10, yPosition, pageWidth - 2 * margin - 10, {
          fontSize: 10,
          lineHeight: 14
        });
      });

      // Start new page for content
      doc.addPage();
      yPosition = margin;

      // ============= EXECUTIVE SUMMARY =============
      
      let executiveSummary = '';
      if (report.aiAnalysis.executiveSummary) {
        executiveSummary = typeof report.aiAnalysis.executiveSummary === 'string' 
          ? report.aiAnalysis.executiveSummary 
          : report.aiAnalysis.executiveSummary.summary || '';
      }

      if (!executiveSummary && report.aiAnalysis.fullAnalysis) {
        // Try to extract executive summary from full analysis
        const summaryMatch = report.aiAnalysis.fullAnalysis.match(/## EXECUTIVE SUMMARY\s*([\s\S]*?)(?=##|$)/i);
        if (summaryMatch) {
          executiveSummary = summaryMatch[1].trim();
        }
      }

      if (!executiveSummary) {
        executiveSummary = `This comprehensive analysis evaluates ${companyName}'s investment readiness across four critical domains. The assessment reveals varying levels of preparedness, with specific recommendations for enhancement before investment consideration.`;
      }

      yPosition = addSection('1. EXECUTIVE SUMMARY', executiveSummary, {
        titleFontSize: 16,
        titleColor: [0, 50, 100],
        spaceBefore: 0
      });

      // ============= ASSESSMENT SCORES OVERVIEW =============
      
      yPosition = addSection('2. ASSESSMENT SCORES OVERVIEW', '', {
        titleFontSize: 16,
        titleColor: [0, 50, 100]
      });

      // Create scores table
      const scores = report.assessmentData.scoreData;
      const scoreTableData = [
        ['Domain', 'Score', 'Status', 'Readiness Level'],
        [
          'Commercial Excellence',
          `${scores.commercial?.percentage || 0}%`,
          scores.commercial?.status || 'Under Review',
          this.getReadinessLevel(scores.commercial?.percentage || 0)
        ],
        [
          'Financial Strength',
          `${scores.financial?.percentage || 0}%`,
          scores.financial?.status || 'Under Review',
          this.getReadinessLevel(scores.financial?.percentage || 0)
        ],
        [
          'Operational Maturity',
          `${scores.operations?.percentage || 0}%`,
          scores.operations?.status || 'Under Review',
          this.getReadinessLevel(scores.operations?.percentage || 0)
        ],
        [
          'Legal & Compliance',
          `${scores.legal?.percentage || 0}%`,
          scores.legal?.status || 'Under Review',
          this.getReadinessLevel(scores.legal?.percentage || 0)
        ]
      ];

      // Add table using autoTable
      if (typeof doc.autoTable === 'function') {
        doc.autoTable({
          head: [scoreTableData[0]],
          body: scoreTableData.slice(1),
          startY: yPosition,
          theme: 'grid',
          headStyles: {
            fillColor: [0, 123, 255],
            textColor: [255, 255, 255],
            fontSize: 10,
            fontStyle: 'bold'
          },
          bodyStyles: {
            fontSize: 9
          },
          margin: { left: margin, right: margin },
          tableWidth: 'auto',
          columnStyles: {
            0: { cellWidth: 50 },
            1: { cellWidth: 25 },
            2: { cellWidth: 35 },
            3: { cellWidth: 35 }
          }
        });
        yPosition = doc.lastAutoTable.finalY + 15;
      } else {
        // Fallback manual table
        scoreTableData.forEach((row, index) => {
          if (yPosition > pageHeight - margin - 20) {
            doc.addPage();
            yPosition = margin;
          }
          
          const isHeader = index === 0;
          yPosition = addWrappedText(
            row.join(' | '),
            margin,
            yPosition,
            pageWidth - 2 * margin,
            {
              fontSize: isHeader ? 10 : 9,
              fontStyle: isHeader ? 'bold' : 'normal',
              lineHeight: 12
            }
          );
        });
        yPosition += 15;
      }

      // Overall Status
      yPosition = addStyledBox(
        margin,
        yPosition,
        pageWidth - 2 * margin,
        25,
        `Overall Investment Readiness: ${scores.general_status || 'Assessment Pending'}`,
        {
          fillColor: [240, 255, 240],
          borderColor: [0, 150, 0],
          textColor: [0, 100, 0],
          fontSize: 12,
          fontStyle: 'bold'
        }
      );

      yPosition += 15;

      // ============= INVESTMENT THESIS =============
      
      let investmentThesis = '';
      if (report.aiAnalysis.fullAnalysis) {
        const thesisMatch = report.aiAnalysis.fullAnalysis.match(/## INVESTMENT THESIS[\s\S]*?([\s\S]*?)(?=##|$)/i);
        if (thesisMatch) {
          investmentThesis = thesisMatch[1].trim();
        }
      }

      if (!investmentThesis) {
        investmentThesis = `${companyName} presents a compelling investment opportunity within the ${sector} sector. The comprehensive assessment reveals both strengths and areas for development, providing a clear roadmap for investment readiness enhancement.`;
      }

      yPosition = addSection('3. INVESTMENT THESIS & MARKET OPPORTUNITY', investmentThesis, {
        titleFontSize: 16,
        titleColor: [0, 50, 100]
      });

      // ============= DOMAIN ANALYSIS =============
      
      yPosition = addSection('4. DOMAIN ANALYSIS', '', {
        titleFontSize: 16,
        titleColor: [0, 50, 100]
      });

      const domains = [
        { name: 'Commercial Excellence', key: 'commercial', number: '4.1' },
        { name: 'Financial Architecture', key: 'financial', number: '4.2' },
        { name: 'Operational Foundation', key: 'operations', number: '4.3' },
        { name: 'Legal Framework', key: 'legal', number: '4.4' }
      ];

      domains.forEach(domain => {
        const domainScore = scores[domain.key];
        const scoreText = `Score: ${domainScore?.percentage || 0}% - ${domainScore?.status || 'Under Review'}`;
        
        yPosition = addSection(`${domain.number} ${domain.name}`, scoreText, {
          titleFontSize: 14,
          titleColor: [0, 50, 100],
          spaceBefore: 10
        });

        // Add domain-specific analysis
        let domainAnalysis = '';
        if (report.aiAnalysis.fullAnalysis) {
          const domainMatch = report.aiAnalysis.fullAnalysis.match(
            new RegExp(`### ${domain.name}[\\s\\S]*?([\\s\\S]*?)(?=###|##|$)`, 'i')
          );
          if (domainMatch) {
            domainAnalysis = domainMatch[1].trim();
          }
        }

        if (!domainAnalysis) {
          domainAnalysis = `The ${domain.name.toLowerCase()} assessment reveals a score of ${domainScore?.percentage || 0}%, indicating ${this.getReadinessLevel(domainScore?.percentage || 0).toLowerCase()} readiness in this domain. Further development is recommended to enhance overall investment attractiveness.`;
        }

        yPosition = addWrappedText(domainAnalysis, margin, yPosition, pageWidth - 2 * margin, {
          fontSize: 10,
          lineHeight: 14
        });

        yPosition += 10;
      });

      // ============= STRATEGIC RECOMMENDATIONS =============
      
      yPosition = addSection('5. STRATEGIC RECOMMENDATIONS', '', {
        titleFontSize: 16,
        titleColor: [0, 50, 100]
      });

      if (report.aiAnalysis.recommendations && report.aiAnalysis.recommendations.length > 0) {
        const priorityGroups = {
          high: report.aiAnalysis.recommendations.filter(r => r.priority === 'high'),
          medium: report.aiAnalysis.recommendations.filter(r => r.priority === 'medium'),
          low: report.aiAnalysis.recommendations.filter(r => r.priority === 'low')
        };

        Object.entries(priorityGroups).forEach(([priority, recs]) => {
          if (recs.length > 0) {
            yPosition = addSection(`${priority.toUpperCase()} PRIORITY INITIATIVES`, '', {
              titleFontSize: 12,
              titleColor: [100, 0, 0],
              spaceBefore: 10
            });

            recs.forEach((rec, index) => {
              const recText = `${index + 1}. ${rec.text}`;
              yPosition = addWrappedText(recText, margin + 10, yPosition, pageWidth - 2 * margin - 10, {
                fontSize: 10,
                lineHeight: 14
              });
              yPosition += 8;
            });
          }
        });
      } else {
        // Default recommendations
        const defaultRecs = [
          'Strengthen financial reporting and management systems',
          'Enhance operational processes and documentation',
          'Develop comprehensive business plan and growth strategy',
          'Improve legal compliance and governance framework'
        ];

        defaultRecs.forEach((rec, index) => {
          yPosition = addWrappedText(`${index + 1}. ${rec}`, margin + 10, yPosition, pageWidth - 2 * margin - 10, {
            fontSize: 10,
            lineHeight: 14
          });
          yPosition += 8;
        });
      }

      // ============= RISK ASSESSMENT =============
      
      yPosition = addSection('6. RISK ASSESSMENT & MITIGATION', '', {
        titleFontSize: 16,
        titleColor: [0, 50, 100]
      });

      let riskContent = '';
      if (report.aiAnalysis.predictions?.riskAssessment) {
        const riskData = report.aiAnalysis.predictions.riskAssessment;
        riskContent = `Overall Risk Score: ${riskData.overallRiskScore}/100 (${riskData.riskLevel})\n\n`;
        
        if (riskData.keyRisks && riskData.keyRisks.length > 0) {
          riskContent += 'Key Risk Factors:\n';
          riskData.keyRisks.forEach((risk, index) => {
            riskContent += `${index + 1}. ${risk.category} Risk: ${risk.risk}\n`;
            riskContent += `   Mitigation: ${risk.mitigation}\n\n`;
          });
        }
      } else {
        riskContent = 'Risk assessment indicates moderate to high risk levels across operational, financial, and market domains. Comprehensive risk mitigation strategies should be implemented before investment consideration.';
      }

      yPosition = addWrappedText(riskContent, margin, yPosition, pageWidth - 2 * margin, {
        fontSize: 10,
        lineHeight: 14
      });

      // ============= GROWTH POTENTIAL =============
      
      yPosition = addSection('7. GROWTH POTENTIAL & MARKET DYNAMICS', '', {
        titleFontSize: 16,
        titleColor: [0, 50, 100]
      });

      let growthContent = '';
      if (report.aiAnalysis.predictions?.growthPotential) {
        const growthData = report.aiAnalysis.predictions.growthPotential;
        growthContent = `Growth Score: ${growthData.growthScore}/100 (${growthData.growthCategory})\n\n`;
        
        if (growthData.marketExpansion) {
          growthContent += `Market Analysis:\n`;
          growthContent += `• Current Market Size: $${growthData.marketExpansion.currentMarketSize?.toLocaleString() || 'N/A'}\n`;
          growthContent += `• Addressable Market: $${growthData.marketExpansion.addressableMarket?.toLocaleString() || 'N/A'}\n`;
          growthContent += `• Growth Rate: ${growthData.marketExpansion.marketGrowthRate || 'N/A'}\n\n`;
        }
      } else {
        growthContent = 'Growth potential analysis indicates significant opportunities for market expansion and revenue growth, subject to successful implementation of recommended strategic initiatives.';
      }

      yPosition = addWrappedText(growthContent, margin, yPosition, pageWidth - 2 * margin, {
        fontSize: 10,
        lineHeight: 14
      });

      // ============= INVESTMENT DECISION =============
      
      yPosition = addSection('8. INVESTMENT DECISION FRAMEWORK', '', {
        titleFontSize: 16,
        titleColor: [0, 50, 100]
      });

      let investmentContent = '';
      if (report.aiAnalysis.predictions?.investmentDecision) {
        const investmentData = report.aiAnalysis.predictions.investmentDecision;
        investmentContent = `Investment Readiness Score: ${investmentData.investmentReadinessScore}/100\n`;
        investmentContent += `Recommendation: ${investmentData.recommendation}\n\n`;
        
        if (investmentData.investmentAmount) {
          investmentContent += `Investment Framework:\n`;
          investmentContent += `• Minimum: $${investmentData.investmentAmount.minimum?.toLocaleString() || 'N/A'}\n`;
          investmentContent += `• Optimal: $${investmentData.investmentAmount.optimal?.toLocaleString() || 'N/A'}\n`;
          investmentContent += `• Maximum: $${investmentData.investmentAmount.maximum?.toLocaleString() || 'N/A'}\n\n`;
        }
      } else {
        const avgScore = this.calculateAverageScore(scores);
        investmentContent = `Based on the comprehensive assessment, the business demonstrates ${avgScore > 70 ? 'strong' : avgScore > 50 ? 'moderate' : 'limited'} investment readiness. ${avgScore > 70 ? 'Conditional investment recommended' : 'Further development required'} subject to implementation of strategic recommendations.`;
      }

      yPosition = addWrappedText(investmentContent, margin, yPosition, pageWidth - 2 * margin, {
        fontSize: 10,
        lineHeight: 14
      });

      // ============= FOOTER FOR ALL PAGES =============
      
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        // Footer line
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, pageHeight - 25, pageWidth - margin, pageHeight - 25);
        
        // Footer text
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(
          'Generated by AI-Powered CRAT System | Confidential Investment Analysis',
          margin,
          pageHeight - 18
        );
        doc.text(
          `Page ${i} of ${pageCount}`,
          pageWidth - margin - 30,
          pageHeight - 18
        );
        doc.text(
          `Report ID: ${report.id} | ${new Date().toLocaleDateString()}`,
          margin,
          pageHeight - 12
        );
      }

      // Save the PDF
      const fileName = `Investment_Analysis_${companyName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      return fileName;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF report');
    }
  }



  /**
   * Get report statistics
   */
  getReportStats() {
    const reports = this.getSavedReports();
    
    return {
      totalReports: reports.length,
      lastGenerated: reports.length > 0 ? reports[0].timestamp : null,
      averageScore: reports.length > 0 
        ? reports.reduce((sum, report) => {
            const scores = report.assessmentData.scoreData;
            const avg = ((scores.commercial?.percentage || 0) + 
                        (scores.financial?.percentage || 0) + 
                        (scores.operations?.percentage || 0) + 
                        (scores.legal?.percentage || 0)) / 4;
            return sum + avg;
          }, 0) / reports.length
        : 0,
      readyBusinesses: reports.filter(r => r.assessmentData.scoreData.general_status === 'Ready').length
    };
  }
}

// Export singleton instance
export const aiReportService = new AIReportService();

// Export utility functions
export const generateAIReport = (reportData, scoreData, businessInfo, userDetails) => 
  aiReportService.generateCompleteReport(reportData, scoreData, businessInfo, userDetails);

export const exportReportToPDF = (report) => aiReportService.exportToPDF(report);
export const getSavedReports = () => aiReportService.getSavedReports();
export const getReportStats = () => aiReportService.getReportStats(); 