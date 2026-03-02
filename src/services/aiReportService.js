import { analyzeCompleteReport, generateExecutiveSummary } from "./openAi";
import jsPDF from "jspdf";
import "jspdf-autotable";

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
  async generateCompleteReport(
    reportData,
    scoreData,
    businessInfo,
    userDetails,
  ) {
    try {
      const timestamp = new Date().toISOString();
      const reportId = `ai-report-${Date.now()}`;

      console.log("🤖 Starting AI analysis generation...");
      console.log("📋 Input validation:", {
        hasReportData: !!reportData,
        hasScoreData: !!scoreData,
        hasBusinessInfo: !!businessInfo,
        userRole: userDetails?.role,
      });

      // Validate inputs
      if (!scoreData) {
        throw new Error("Score data is required for AI analysis");
      }

      if (!businessInfo) {
        console.warn("⚠️ Business info not provided, using defaults");
        businessInfo = {
          name: "Unknown Business",
          sector: "Unknown",
          location: "Unknown",
        };
      }

      // Generate AI analysis with retry logic
      let aiAnalysis;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          console.log(`🔄 AI Analysis attempt ${retryCount + 1}/${maxRetries}`);
          console.log("📊 Calling analyzeCompleteReport with:", {
            reportDataType: typeof reportData,
            scoreDataType: typeof scoreData,
            businessInfoType: typeof businessInfo,
            scoreDataKeys: scoreData ? Object.keys(scoreData) : "null",
          });

          console.log("🔍 analyzeCompleteReport function:", {
            isFunction: typeof analyzeCompleteReport === "function",
            functionName: analyzeCompleteReport?.name,
            functionString: analyzeCompleteReport?.toString().substring(0, 100),
          });

          aiAnalysis = await analyzeCompleteReport(
            reportData,
            scoreData,
            businessInfo,
          );
          console.log(
            "✅ AI Analysis successful, result type:",
            typeof aiAnalysis,
          );
          break;
        } catch (error) {
          retryCount++;
          console.error(`❌ AI Analysis attempt ${retryCount} failed:`, error);
          console.error("❌ Full error object:", {
            message: error.message,
            stack: error.stack,
            name: error.name,
            cause: error.cause,
          });

          if (retryCount >= maxRetries) {
            console.error("❌ All retry attempts failed, throwing error");
            throw error;
          }

          // Wait before retry (exponential backoff)
          const waitTime = Math.pow(2, retryCount) * 1000;
          console.log(`⏳ Waiting ${waitTime}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }

      // Create comprehensive report object
      const completeReport = {
        id: reportId,
        timestamp,
        businessInfo,
        userDetails: {
          name: userDetails?.name || "Unknown",
          email: userDetails?.email || "Unknown",
          role: userDetails?.role || "Unknown",
        },
        assessmentData: {
          scoreData,
          reportData,
        },
        aiAnalysis,
        metadata: {
          aiModel: "Gemini 1.5 Pro",
          analysisType: "Complete CRAT Assessment",
          version: "1.0",
          retryCount,
        },
      };

      // Save report
      this.saveReport(reportId, completeReport);

      console.log("✅ AI analysis completed successfully");
      return completeReport;
    } catch (error) {
      console.error("❌ Error generating AI report:", error);

      // Return a meaningful error message
      const errorMessage =
        error.message || "Unknown error occurred during AI analysis";
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
      const savedReports = JSON.parse(
        localStorage.getItem("aiReports") || "{}",
      );
      savedReports[reportId] = report;
      localStorage.setItem("aiReports", JSON.stringify(savedReports));
    } catch (error) {
      console.warn("Could not save to localStorage:", error);
    }
  }

  /**
   * Get saved reports
   */
  getSavedReports() {
    try {
      const savedReports = JSON.parse(
        localStorage.getItem("aiReports") || "{}",
      );
      return Object.values(savedReports).sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
      );
    } catch (error) {
      console.warn("Could not load from localStorage:", error);
      return Array.from(this.reports.values());
    }
  }

  /**
   * Get specific report by ID
   */
  getReport(reportId) {
    try {
      const savedReports = JSON.parse(
        localStorage.getItem("aiReports") || "{}",
      );
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
      const savedReports = JSON.parse(
        localStorage.getItem("aiReports") || "{}",
      );
      delete savedReports[reportId];
      localStorage.setItem("aiReports", JSON.stringify(savedReports));
    } catch (error) {
      console.warn("Could not delete from localStorage:", error);
    }
  }

  /**
   * Helper method to extract sections from AI analysis
   */
  extractSection(fullText, sectionTitle) {
    const regex = new RegExp(`##\\s*${sectionTitle}[^#]*(?=##|$)`, "is");
    const match = fullText.match(regex);
    if (match) {
      return match[0].replace(`## ${sectionTitle}`, "").trim();
    }
    return null;
  }

  /**
   * Helper method to determine readiness level based on score
   */
  getReadinessLevel(score) {
    if (score >= 75) return "Ready";
    if (score >= 60) return "Partially Ready";
    return "Not Ready";
  }

  /**
   * Get readiness level based on percentage score
   */
  getReadinessLevel(percentage) {
    if (percentage >= 75) return "Ready";
    if (percentage >= 60) return "Partially Ready";
    return "Not Ready";
  }

  /**
   * Calculate average score from score data
   */
  calculateAverageScore(scoreData) {
    const scores = [
      scoreData.commercial?.percentage || 0,
      scoreData.financial?.percentage || 0,
      scoreData.operations?.percentage || 0,
      scoreData.legal?.percentage || 0,
    ];
    return Math.round(
      scores.reduce((sum, score) => sum + score, 0) / scores.length,
    );
  }

  /**
   * Export comprehensive report as PDF with modern design
   */
  exportToPDF(report) {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 15;
      let yPosition = 0;

      // Color palette - Single primary color theme
      const colors = {
        primary: [38, 45, 137], // #262D89 - our brand color
        primaryLight: [58, 65, 157], // Light variation
        primaryDark: [28, 35, 117], // Dark variation
        text: {
          dark: [31, 41, 55],
          medium: [107, 114, 128],
          light: [156, 163, 175],
        },
        background: {
          white: [255, 255, 255],
          light: [249, 250, 251],
          gray: [243, 244, 246],
        },
      };

      // ============= CLEAN PROFESSIONAL COVER PAGE =============

      // Simple header bar with primary color
      doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.rect(0, 0, pageWidth, 70, "F");

      // Anza logo area
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont(undefined, "bold");
      doc.text("ANZA", pageWidth / 2, 35, { align: "center" });

      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont(undefined, "bold");
      doc.text("INVESTMENT ANALYSIS", pageWidth / 2, 58, { align: "center" });

      yPosition = 85;

      // Company name - clean and simple
      const companyName = report.businessInfo?.name || "Confidential Business";
      doc.setTextColor(
        colors.text.dark[0],
        colors.text.dark[1],
        colors.text.dark[2],
      );
      doc.setFontSize(20);
      doc.setFont(undefined, "bold");
      doc.text(companyName, pageWidth / 2, yPosition, { align: "center" });

      doc.setFontSize(10);
      doc.setFont(undefined, "normal");
      doc.setTextColor(
        colors.text.medium[0],
        colors.text.medium[1],
        colors.text.medium[2],
      );
      const sector = report.businessInfo?.sector || "Multi-sector";
      const location = report.businessInfo?.location || "East Africa";
      doc.text(`${sector} • ${location}`, pageWidth / 2, yPosition + 10, {
        align: "center",
      });

      yPosition += 30;

      // Readiness Score - Simple circle with primary color
      const scores = report.assessmentData.scoreData;
      const avgScore = Math.round(
        ((scores.commercial?.percentage || 0) +
          (scores.financial?.percentage || 0) +
          (scores.operations?.percentage || 0) +
          (scores.legal?.percentage || 0)) /
          4,
      );

      // Score circle with primary color
      doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.circle(pageWidth / 2, yPosition + 30, 28, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(36);
      doc.setFont(undefined, "bold");
      doc.text(`${avgScore}%`, pageWidth / 2, yPosition + 35, {
        align: "center",
      });

      doc.setFontSize(9);
      doc.setFont(undefined, "normal");
      doc.text("OVERALL SCORE", pageWidth / 2, yPosition + 43, {
        align: "center",
      });

      yPosition += 75;

      // Key metrics grid - 4 clean boxes with primary color
      const domains = [
        {
          label: "Commercial",
          value: Math.round(scores.commercial?.percentage || 0),
        },
        {
          label: "Financial",
          value: Math.round(scores.financial?.percentage || 0),
        },
        {
          label: "Operations",
          value: Math.round(scores.operations?.percentage || 0),
        },
        {
          label: "Legal",
          value: Math.round(scores.legal?.percentage || 0),
        },
      ];

      const boxWidth = (pageWidth - 2 * margin - 15) / 4;
      domains.forEach((domain, index) => {
        const xPos = margin + index * (boxWidth + 5);

        // Simple border with primary color
        doc.setDrawColor(
          colors.primary[0],
          colors.primary[1],
          colors.primary[2],
        );
        doc.setLineWidth(1);
        doc.setFillColor(
          colors.background.light[0],
          colors.background.light[1],
          colors.background.light[2],
        );
        doc.roundedRect(xPos, yPosition, boxWidth, 35, 2, 2, "FD");

        // Value
        doc.setTextColor(
          colors.primary[0],
          colors.primary[1],
          colors.primary[2],
        );
        doc.setFontSize(18);
        doc.setFont(undefined, "bold");
        doc.text(`${domain.value}%`, xPos + boxWidth / 2, yPosition + 18, {
          align: "center",
        });

        // Label
        doc.setFontSize(8);
        doc.setTextColor(
          colors.text.medium[0],
          colors.text.medium[1],
          colors.text.medium[2],
        );
        doc.text(domain.label, xPos + boxWidth / 2, yPosition + 28, {
          align: "center",
        });
      });

      yPosition += 45;

      // Report metadata - clean and minimal
      doc.setFontSize(8);
      doc.setTextColor(
        colors.text.light[0],
        colors.text.light[1],
        colors.text.light[2],
      );
      const reportDate = new Date(report.timestamp).toLocaleDateString(
        "en-US",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        },
      );
      doc.text(`Generated: ${reportDate}`, pageWidth / 2, yPosition, {
        align: "center",
      });
      doc.text(
        `Report ID: ai-report-${report.id.substring(10, 23)}`,
        pageWidth / 2,
        yPosition + 5,
        { align: "center" },
      );

      yPosition += 15;

      // Powered by
      doc.setFontSize(7);
      doc.setTextColor(
        colors.text.light[0],
        colors.text.light[1],
        colors.text.light[2],
      );
      doc.text("Powered by Advanced AI Analysis", pageWidth / 2, yPosition, {
        align: "center",
      });

      // ============= PAGE 2: EXECUTIVE SUMMARY =============
      doc.addPage();
      yPosition = margin + 5;

      // Section header with primary bar
      doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.rect(margin, yPosition, 3, 10, "F");
      doc.setTextColor(
        colors.text.dark[0],
        colors.text.dark[1],
        colors.text.dark[2],
      );
      doc.setFontSize(16);
      doc.setFont(undefined, "bold");
      doc.text("Executive Summary", margin + 8, yPosition + 7);

      yPosition += 18;

      // Executive summary content - now showing rawAnalysis
      let executiveSummary =
        report.aiAnalysis?.rawAnalysis ||
        report.aiAnalysis?.executiveSummary ||
        `AI INVESTMENT ANALYSIS REPORT FOR ${companyName.toUpperCase()}`;

      if (typeof executiveSummary === "object") {
        executiveSummary =
          executiveSummary.summary || JSON.stringify(executiveSummary);
      }

      doc.setFontSize(10);
      doc.setFont(undefined, "normal");
      doc.setTextColor(
        colors.text.dark[0],
        colors.text.dark[1],
        colors.text.dark[2],
      );

      // Split by newlines first to preserve paragraph structure
      const paragraphs = executiveSummary.split("\n");
      paragraphs.forEach((paragraph) => {
        // Handle markdown headers (##)
        if (paragraph.trim().startsWith("##")) {
          // Add some spacing before headers
          yPosition += 5;
          if (yPosition > pageHeight - margin - 10) {
            doc.addPage();
            yPosition = margin;
          }
          doc.setFont(undefined, "bold");
          doc.setFontSize(12);
          const headerText = paragraph.replace(/^#+\s*/, "").trim();
          doc.text(headerText, margin, yPosition);
          yPosition += 8;
          doc.setFont(undefined, "normal");
          doc.setFontSize(10);
        } else if (paragraph.trim().startsWith("#")) {
          // Main headers
          yPosition += 5;
          if (yPosition > pageHeight - margin - 10) {
            doc.addPage();
            yPosition = margin;
          }
          doc.setFont(undefined, "bold");
          doc.setFontSize(14);
          const headerText = paragraph.replace(/^#+\s*/, "").trim();
          doc.text(headerText, margin, yPosition);
          yPosition += 10;
          doc.setFont(undefined, "normal");
          doc.setFontSize(10);
        } else if (paragraph.trim()) {
          // Regular paragraph with word wrapping
          const wrappedLines = doc.splitTextToSize(
            paragraph,
            pageWidth - 2 * margin,
          );
          wrappedLines.forEach((line) => {
            if (yPosition > pageHeight - margin - 10) {
              doc.addPage();
              yPosition = margin;
            }
            doc.text(line, margin, yPosition);
            yPosition += 5.5;
          });
        } else {
          // Empty line - add spacing
          yPosition += 3;
        }
      });

      // ============= DETAILED SCORES ON NEW PAGE =============
      doc.addPage();
      yPosition = margin + 5;

      // Section header
      doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.rect(margin, yPosition, 3, 10, "F");
      doc.setFontSize(16);
      doc.setFont(undefined, "bold");
      doc.setTextColor(
        colors.text.dark[0],
        colors.text.dark[1],
        colors.text.dark[2],
      );
      doc.text("Assessment Scores", margin + 8, yPosition + 7);

      yPosition += 18;

      // Score cards - clean without emojis
      const domainDetails = [
        {
          name: "Commercial Excellence",
          key: "commercial",
        },
        {
          name: "Financial Strength",
          key: "financial",
        },
        {
          name: "Operational Maturity",
          key: "operations",
        },
        {
          name: "Legal & Compliance",
          key: "legal",
        },
      ];

      domainDetails.forEach((domain, index) => {
        if (yPosition > pageHeight - 45) {
          doc.addPage();
          yPosition = margin;
        }

        const score = Math.round(scores[domain.key]?.percentage || 0);
        const status = scores[domain.key]?.status || "Not ready";
        const readiness = this.getReadinessLevel(score);

        // Clean card with border
        doc.setDrawColor(
          colors.primary[0],
          colors.primary[1],
          colors.primary[2],
        );
        doc.setLineWidth(0.5);
        doc.setFillColor(
          colors.background.light[0],
          colors.background.light[1],
          colors.background.light[2],
        );
        doc.roundedRect(
          margin,
          yPosition,
          pageWidth - 2 * margin,
          30,
          2,
          2,
          "FD",
        );

        // Domain name
        doc.setFontSize(12);
        doc.setFont(undefined, "bold");
        doc.setTextColor(
          colors.text.dark[0],
          colors.text.dark[1],
          colors.text.dark[2],
        );
        doc.text(domain.name, margin + 8, yPosition + 12);

        // Score - large and prominent
        doc.setFontSize(22);
        doc.setFont(undefined, "bold");
        doc.setTextColor(
          colors.primary[0],
          colors.primary[1],
          colors.primary[2],
        );
        doc.text(`${score}%`, pageWidth - margin - 30, yPosition + 13);

        // Status and readiness on same line
        doc.setFontSize(8);
        doc.setFont(undefined, "normal");
        doc.setTextColor(
          colors.text.medium[0],
          colors.text.medium[1],
          colors.text.medium[2],
        );
        doc.text(`Status: ${status}`, margin + 8, yPosition + 20);
        doc.text(`Level: ${readiness}`, margin + 8, yPosition + 26);

        yPosition += 35;
      });

      // ============= RECOMMENDATIONS PAGE =============
      doc.addPage();
      yPosition = margin + 5;

      // Section header with primary color
      doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.rect(margin, yPosition, 3, 10, "F");
      doc.setFontSize(16);
      doc.setFont(undefined, "bold");
      doc.setTextColor(
        colors.text.dark[0],
        colors.text.dark[1],
        colors.text.dark[2],
      );
      doc.text("Strategic Recommendations", margin + 8, yPosition + 7);

      yPosition += 20;

      // Recommendations - clean and simple
      const recommendations =
        report.aiAnalysis?.predictions?.recommendations ||
        report.aiAnalysis?.recommendations ||
        [];

      if (recommendations.length > 0) {
        recommendations.slice(0, 8).forEach((rec, index) => {
          if (yPosition > pageHeight - margin - 30) {
            doc.addPage();
            yPosition = margin;
          }

          const recTitle = rec.title || `Recommendation ${index + 1}`;
          const recDesc = rec.description || rec.text || rec;

          // Clean bordered card
          doc.setDrawColor(
            colors.primary[0],
            colors.primary[1],
            colors.primary[2],
          );
          doc.setLineWidth(0.5);
          doc.setFillColor(
            colors.background.light[0],
            colors.background.light[1],
            colors.background.light[2],
          );
          doc.roundedRect(
            margin,
            yPosition,
            pageWidth - 2 * margin,
            22,
            2,
            2,
            "FD",
          );

          // Number with primary color
          doc.setFillColor(
            colors.primary[0],
            colors.primary[1],
            colors.primary[2],
          );
          doc.circle(margin + 8, yPosition + 8, 5, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(8);
          doc.setFont(undefined, "bold");
          doc.text(`${index + 1}`, margin + 8, yPosition + 10, {
            align: "center",
          });

          // Title
          doc.setFontSize(10);
          doc.setFont(undefined, "bold");
          doc.setTextColor(
            colors.text.dark[0],
            colors.text.dark[1],
            colors.text.dark[2],
          );
          const titleText =
            typeof recTitle === "string"
              ? recTitle
              : recTitle.text || `Recommendation ${index + 1}`;
          doc.text(titleText.substring(0, 60), margin + 17, yPosition + 9);

          // Description
          doc.setFontSize(8);
          doc.setFont(undefined, "normal");
          doc.setTextColor(
            colors.text.medium[0],
            colors.text.medium[1],
            colors.text.medium[2],
          );
          const descText =
            typeof recDesc === "string" ? recDesc : JSON.stringify(recDesc);
          const descLines = doc.splitTextToSize(
            descText.substring(0, 120),
            pageWidth - 2 * margin - 22,
          );
          doc.text(descLines[0], margin + 17, yPosition + 16);

          yPosition += 26;
        });
      } else {
        doc.setFontSize(9);
        doc.setTextColor(
          colors.text.medium[0],
          colors.text.medium[1],
          colors.text.medium[2],
        );
        doc.text(
          "Detailed recommendations are being generated based on your assessment.",
          margin,
          yPosition,
        );
      }

      // ============= FOOTER ON ALL PAGES =============
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);

        // Subtle footer line
        doc.setDrawColor(
          colors.text.light[0],
          colors.text.light[1],
          colors.text.light[2],
        );
        doc.setLineWidth(0.3);
        doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

        // Footer text - minimal
        doc.setFontSize(7);
        doc.setTextColor(
          colors.text.light[0],
          colors.text.light[1],
          colors.text.light[2],
        );
        doc.text(
          `${companyName} - Investment Analysis Report`,
          margin,
          pageHeight - 8,
        );
        doc.text(
          `Page ${i} of ${totalPages}`,
          pageWidth - margin - 20,
          pageHeight - 10,
        );
      }

      // Save PDF
      const fileName = `Investment_Analysis_${companyName.replace(/[^a-z0-9]/gi, "_")}_${new Date().getTime()}.pdf`;
      doc.save(fileName);

      return { success: true, fileName };
    } catch (error) {
      console.error("Error generating PDF:", error);
      throw error;
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
      averageScore:
        reports.length > 0
          ? reports.reduce((sum, report) => {
              const scores = report.assessmentData.scoreData;
              const avg =
                ((scores.commercial?.percentage || 0) +
                  (scores.financial?.percentage || 0) +
                  (scores.operations?.percentage || 0) +
                  (scores.legal?.percentage || 0)) /
                4;
              return sum + avg;
            }, 0) / reports.length
          : 0,
      readyBusinesses: reports.filter(
        (r) => r.assessmentData.scoreData.general_status === "Ready",
      ).length,
    };
  }
}

// Export singleton instance
export const aiReportService = new AIReportService();

// Export utility functions
export const generateAIReport = (
  reportData,
  scoreData,
  businessInfo,
  userDetails,
) =>
  aiReportService.generateCompleteReport(
    reportData,
    scoreData,
    businessInfo,
    userDetails,
  );

export const exportReportToPDF = (report) =>
  aiReportService.exportToPDF(report);
export const getSavedReports = () => aiReportService.getSavedReports();
export const getReportStats = () => aiReportService.getReportStats();
