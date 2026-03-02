import OpenAI from "openai";

// OpenAI API Key
const OPENAI_API_KEY =
  "REDACTED_OPENAI_KEY";

if (!OPENAI_API_KEY) {
  console.warn("⚠️ OpenAI API key is not set. AI features will not work.");
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Allow usage in browser
});

/**
 * Comprehensive CRAT Report Analysis using OpenAI
 * Interprets Capital Readiness Assessment Tool results and provides actionable insights
 */
export class CRATAIAnalyzer {
  constructor() {
    this.modelName = "gpt-4o-mini";
  }

  /**
   * Generate comprehensive CRAT report interpretation with advanced predictions
   * @param {Object} reportData - Complete CRAT assessment data
   * @param {Object} scoreData - Domain scores and percentages
   * @param {Object} businessInfo - Basic business information
   * @returns {Object} AI-generated analysis and recommendations with predictions
   */
  async analyzeCompleteReport(reportData, scoreData, businessInfo = {}) {
    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 2000;
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
      try {
        console.log(
          "🤖 Starting comprehensive CRAT analysis with predictions...",
        );
        console.log("📊 Score Data:", scoreData);
        console.log("🏢 Business Info:", businessInfo);

        // Validate inputs
        if (!scoreData) {
          throw new Error("Score data is required for analysis");
        }

        const prompt = this.buildComprehensivePrompt(
          reportData,
          scoreData,
          businessInfo,
        );
        console.log("📝 Generated prompt length:", prompt.length);

        console.log(
          "🔄 Sending request to OpenAI... (attempt",
          attempt + 1,
          ")",
        );

        // Use OpenAI chat completion
        const response = await openai.chat.completions.create({
          model: this.modelName,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 4000,
        });

        if (!response || !response.choices || !response.choices[0]) {
          throw new Error("No response received from OpenAI");
        }

        const analysis = response.choices[0].message.content;
        console.log("✅ Received AI response, length:", analysis.length);

        // Parse the structured response with enhanced predictions
        const parsedAnalysis = this.parseAIResponse(analysis);

        // Generate additional predictive data
        const predictiveData = await this.generatePredictiveAnalysis(
          reportData,
          scoreData,
          businessInfo,
        );

        // Merge predictive data with main analysis
        const enhancedAnalysis = {
          ...parsedAnalysis,
          predictions: predictiveData,
          generatedAt: new Date().toISOString(),
          analysisVersion: "2.0-enhanced",
        };

        console.log("🎯 Enhanced analysis with predictions completed");

        return enhancedAnalysis;
      } catch (error) {
        attempt++;
        // Log full error for developers
        console.error(
          "❌ Error analyzing CRAT report (attempt",
          attempt,
          "):",
          error,
        );

        // Retry on 503/model overloaded
        if (
          error.message &&
          error.message.includes("503") &&
          attempt < MAX_RETRIES
        ) {
          console.warn(
            "OpenAI API temporarily unavailable. Retrying in 2 seconds...",
          );
          await new Promise((res) => setTimeout(res, RETRY_DELAY_MS));
          continue;
        }

        // Provide more specific error messages
        if (
          error.message?.includes("API_KEY_INVALID") ||
          error.status === 401
        ) {
          throw new Error(
            "Invalid OpenAI API key. Please check your API key configuration.",
          );
        } else if (
          error.message?.includes("QUOTA_EXCEEDED") ||
          error.status === 429
        ) {
          throw new Error(
            "OpenAI API quota exceeded. Please try again later or check your billing.",
          );
        } else if (error.message?.includes("SAFETY")) {
          throw new Error(
            "Content was blocked by safety filters. Please try with different data.",
          );
        } else if (
          error.message?.includes("fetch") ||
          error.name === "NetworkError"
        ) {
          throw new Error(
            "Network error. Please check your internet connection and try again.",
          );
        } else if (error.message?.includes("503") || error.status === 503) {
          throw new Error(
            "The AI model is temporarily overloaded. Please try again in a few minutes.",
          );
        } else if (error.status === 404) {
          throw new Error(
            "Model not found. The AI model may have been updated. Please contact support.",
          );
        }

        throw new Error(`AI Analysis failed: ${error.message}`);
      }
    }
    throw new Error(
      "AI Analysis failed after multiple attempts. Please try again later.",
    );
  }

  /**
   * Generate advanced predictive analysis for risk, growth, and investment decisions
   * @param {Object} reportData - Complete CRAT assessment data
   * @param {Object} scoreData - Domain scores and percentages
   * @param {Object} businessInfo - Basic business information
   * @returns {Object} Comprehensive predictive analysis
   */
  async generatePredictiveAnalysis(reportData, scoreData, businessInfo = {}) {
    try {
      console.log("🔮 Generating predictive analysis...");

      const predictivePrompt = this.buildPredictivePrompt(
        reportData,
        scoreData,
        businessInfo,
      );

      const response = await openai.chat.completions.create({
        model: this.modelName,
        messages: [
          {
            role: "user",
            content: predictivePrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const analysis = response.choices[0].message.content;

      return this.parsePredictiveResponse(analysis);
    } catch (error) {
      console.error("Error generating predictive analysis:", error);
      return this.getDefaultPredictiveData(scoreData);
    }
  }

  /**
   * Generate domain-specific analysis
   * @param {string} domain - Domain name (commercial, financial, operations, legal)
   * @param {Object} domainData - Domain-specific data
   * @param {Object} domainScore - Domain score information
   * @returns {Object} Domain-specific AI analysis
   */
  async analyzeDomain(domain, domainData, domainScore) {
    try {
      const prompt = this.buildDomainPrompt(domain, domainData, domainScore);

      const response = await openai.chat.completions.create({
        model: this.modelName,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      });

      const analysis = response.choices[0].message.content;

      return this.parseDomainResponse(analysis, domain);
    } catch (error) {
      console.error(`Error analyzing ${domain} domain:`, error);
      throw new Error(`Failed to generate ${domain} domain analysis`);
    }
  }

  /**
   * Generate executive summary and key recommendations
   * @param {Object} scoreData - Overall scores
   * @param {string} generalStatus - Overall readiness status
   * @returns {Object} Executive summary and strategic recommendations
   */
  async generateExecutiveSummary(scoreData, generalStatus) {
    try {
      const prompt = this.buildExecutiveSummaryPrompt(scoreData, generalStatus);

      const response = await openai.chat.completions.create({
        model: this.modelName,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const summary = response.choices[0].message.content;

      return this.parseExecutiveSummary(summary);
    } catch (error) {
      console.error("Error generating executive summary:", error);
      throw new Error("Failed to generate executive summary");
    }
  }

  /**
   * Build comprehensive analysis prompt for complete CRAT report
   */
  buildComprehensivePrompt(reportData, scoreData, businessInfo) {
    return `
You are a distinguished senior investment analyst and business strategy consultant with over 15 years of experience in African markets. Your expertise spans venture capital, private equity, and strategic business development across emerging markets. You are known for your insightful, narrative-driven analysis that combines quantitative assessment with qualitative storytelling.

BUSINESS PROFILE:
${businessInfo.name ? `Company: ${businessInfo.name}` : "Confidential Business Entity"}
${businessInfo.sector ? `Industry: ${businessInfo.sector}` : "Multi-sector Operations"}
${businessInfo.location ? `Market: ${businessInfo.location}` : "East African Region"}
${businessInfo.stage ? `Development Stage: ${businessInfo.stage}` : "Growth Phase"}

CAPITAL READINESS ASSESSMENT RESULTS:
• Commercial Excellence: ${scoreData.commercial?.percentage || 0}% - ${scoreData.commercial?.status || "Under Review"}
• Financial Strength: ${scoreData.financial?.percentage || 0}% - ${scoreData.financial?.status || "Under Review"}
• Operational Maturity: ${scoreData.operations?.percentage || 0}% - ${scoreData.operations?.status || "Under Review"}
• Legal & Compliance: ${scoreData.legal?.percentage || 0}% - ${scoreData.legal?.status || "Under Review"}
• Overall Investment Readiness: ${scoreData.general_status || "Assessment Pending"}

COMPREHENSIVE BUSINESS DATA:
${JSON.stringify(reportData, null, 2)}

Provide a comprehensive, professional narrative-driven investment analysis report following this professional structure:

## EXECUTIVE SUMMARY

Write a compelling 4-5 paragraph executive summary that provides a professional report of this business opportunity. Begin with a powerful opening statement about the company's investment position, then weave together the key findings into a cohesive narrative. Address the investment thesis, highlight the most compelling aspects of the business, acknowledge key risks, and conclude with a clear investment recommendation and confidence level.

## INVESTMENT THESIS & OPPORTUNITY LANDSCAPE

Craft a detailed narrative that positions this business within the broader African economic context. Discuss the main aspects and dynamics of similar markets in Tanzania and Africa, and the unique value proposition. Explain why this business matters now and how it aligns with current investment trends in African markets.

## DOMAIN DEEP DIVE

### Commercial Excellence & Market Position
Write a professional report about this company's commercial journey. How do they compete? What makes them unique? Analyze their market penetration strategy, customer acquisition approach, and revenue generation model. Paint a picture of their commercial viability, competitive landscape, and future market opportunities.

### Financial Architecture & Performance
Prepare a comprehensive narrative financial analysis of the business. Go beyond presenting the raw financial figures—explain the unit economics and key drivers of profitability, assess cash flow dynamics and overall financial health, and interpret what the current financial trajectory indicates about the business's future performance.

### Operational Foundation & Execution Capability
Provide a detailed overview of the organization's operational dynamics. Describe how the organization functions on a day-to-day basis and evaluate its operational readiness for scale.

### Legal Framework & Governance Structure
Provide an overview of the business's legal and governance foundation within the context of the Tanzanian regulatory environment.

## STRATEGIC INVESTMENT SCORE
Assign a definitive score between 1 and 100 to the business with compelling narrative explanation.

## STRATEGIC ROADMAP & RECOMMENDATIONS
Present 5-7 strategic recommendations organized by timeline.

## RISK LANDSCAPE & MITIGATION STRATEGY
Provide a narrative analysis of risks and mitigation strategies.

## GROWTH TRAJECTORY & MARKET POTENTIAL
Craft a compelling narrative about future growth potential.

## INVESTMENT DECISION FRAMEWORK
Conclude with investment decision recommendations and next steps.
`;
  }

  /**
   * Build predictive analysis prompt
   */
  buildPredictivePrompt(reportData, scoreData, businessInfo) {
    const avgScore = this.calculateAverageScore(scoreData);
    return `
Generate comprehensive predictive investment analysis for this business in valid JSON format:

CURRENT SCORES:
Commercial: ${scoreData.commercial?.percentage || 0}%
Financial: ${scoreData.financial?.percentage || 0}%
Operations: ${scoreData.operations?.percentage || 0}%
Legal: ${scoreData.legal?.percentage || 0}%
Average Score: ${avgScore}

BUSINESS INFO:
${JSON.stringify(businessInfo, null, 2)}

BUSINESS DATA:
${JSON.stringify(reportData, null, 2)}

Provide a complete JSON response with the following exact structure. Use realistic numbers based on the business data:
{
  "riskAssessment": {
    "overallRiskScore": <number 0-100>,
    "riskLevel": "Low" | "Medium" | "High",
    "riskScore": <number 0-100>,
    "riskTrends": {
      "next6Months": "Stable" | "Increasing" | "Decreasing",
      "next24Months": "Stable" | "Increasing" | "Decreasing"
    },
    "keyRisks": [
      {
        "risk": "<specific risk description>",
        "category": "GENERAL" | "OPERATIONAL" | "FINANCIAL" | "MARKET",
        "impact": "Low" | "Medium" | "High",
        "probability": "Low" | "Medium" | "High",
        "mitigation": "<specific mitigation strategy>",
        "timeframe": "Short-term" | "Medium-term" | "Long-term"
      }
    ]
  },
  "growthPotential": {
    "growthScore": <number 0-100>,
    "growthCategory": "High Growth" | "Moderate Growth" | "Stable Growth",
    "revenueProjections": {
      "year1": {"conservative": <number>, "realistic": <number>, "optimistic": <number>},
      "year3": {"conservative": <number>, "realistic": <number>, "optimistic": <number>},
      "year5": {"conservative": <number>, "realistic": <number>, "optimistic": <number>}
    },
    "marketExpansion": {
      "currentMarketSize": <number>,
      "addressableMarket": <number>,
      "marketSharePotential": "<percentage>",
      "marketGrowthRate": "<percentage>"
    },
    "scalingFactors": [
      {"factor": "<factor name>", "impact": "High" | "Medium" | "Low"}
    ]
  },
  "investmentDecision": {
    "recommendation": "Strong Investment" | "Conditional Investment" | "Monitor" | "Not Recommended",
    "investmentReadinessScore": <number 0-100>,
    "expectedReturns": "<return description>",
    "confidenceLevel": "High" | "Medium" | "Low",
    "investmentRationale": "<detailed rationale>",
    "conditions": ["<condition 1>", "<condition 2>"]
  },
  "recommendations": [
    {
      "title": "<recommendation title>",
      "description": "<detailed actionable description with specific steps>",
      "priority": "HIGH" | "MEDIUM" | "LOW",
      "category": "OPERATIONAL" | "FINANCIAL" | "MARKET" | "STRATEGIC" | "GENERAL",
      "timeframe": "Immediate" | "Short-term" | "Medium-term" | "Long-term",
      "expectedImpact": "High" | "Medium" | "Low"
    }
  ],
  "scenarioAnalysis": {
    "bestCase": {
      "title": "Best Case Scenario",
      "description": "<detailed optimistic scenario>",
      "probability": "<percentage>",
      "expectedReturns": "<return range>",
      "timeframe": "<years>",
      "keyDrivers": ["<driver 1>", "<driver 2>"]
    },
    "mostLikely": {
      "title": "Most Likely Scenario",
      "description": "<detailed realistic scenario>",
      "probability": "<percentage>",
      "expectedReturns": "<return range>",
      "timeframe": "<years>",
      "keyDrivers": ["<driver 1>", "<driver 2>"]
    },
    "worstCase": {
      "title": "Worst Case Scenario",
      "description": "<detailed pessimistic scenario>",
      "probability": "<percentage>",
      "expectedReturns": "<return range>",
      "timeframe": "<years>",
      "keyDrivers": ["<driver 1>", "<driver 2>"]
    }
  }
}

IMPORTANT: Return ONLY valid JSON. Base ALL projections on actual business data provided. Analyze the business's current revenue, market position, and sector to generate realistic scenarios. Include specific, actionable recommendations tailored to this business's needs.
`;
  }

  /**
   * Build domain-specific analysis prompt
   */
  buildDomainPrompt(domain, domainData, domainScore) {
    return `
Analyze this ${domain} domain for investment readiness:

DOMAIN: ${domain.toUpperCase()}
SCORE: ${domainScore.percentage || 0}%
STATUS: ${domainScore.status || "Under Review"}

DATA:
${JSON.stringify(domainData, null, 2)}

Provide analysis covering:
1. Current Performance: Strengths and weaknesses
2. Key Findings: Most important observations
3. Risk Factors: Potential issues and concerns
4. Recommendations: 3-4 specific improvement actions
5. Investment Impact: How this affects overall investment readiness

Be specific and actionable. Focus on investment implications.`;
  }

  /**
   * Build executive summary prompt
   */
  buildExecutiveSummaryPrompt(scoreData, generalStatus) {
    return `
Create an executive summary for this investment assessment:

SCORES:
• Commercial: ${scoreData.commercial?.percentage || 0}%
• Financial: ${scoreData.financial?.percentage || 0}%
• Operations: ${scoreData.operations?.percentage || 0}%
• Legal: ${scoreData.legal?.percentage || 0}%
• Overall: ${generalStatus || "Assessment Pending"}

Generate:
1. OVERVIEW: 2-3 sentences on overall readiness
2. KEY STRENGTHS: Top 3 positive factors
3. MAIN CONCERNS: Top 3 areas needing attention
4. RECOMMENDATION: Clear investment decision with confidence level
5. NEXT STEPS: 2-3 immediate actions required

Keep it concise and executive-focused. Maximum 200 words.`;
  }

  // ... (Continue with all the parsing methods from the original file)
  // I'll include the essential parsing methods below

  parseAIResponse(text) {
    // Simple parsing - extract sections
    const executiveSummaryText = this.extractSection(text, "EXECUTIVE SUMMARY");

    // If executive summary is not found, use the full text up to next section
    let executiveSummary = executiveSummaryText;
    if (
      executiveSummaryText === "Section not found" ||
      !executiveSummaryText ||
      executiveSummaryText.length < 50
    ) {
      // Try to get the first major section or use substantial portion of text
      const firstSectionMatch = text.match(/^([\s\S]*?)(?=##[\s\S]|$)/);
      executiveSummary = firstSectionMatch ? firstSectionMatch[1].trim() : text;
    }

    const sections = {
      executiveSummary: executiveSummary,
      investmentThesis: this.extractSection(text, "INVESTMENT THESIS"),
      commercialAnalysis: this.extractSection(text, "Commercial Excellence"),
      financialAnalysis: this.extractSection(text, "Financial Architecture"),
      operationalAnalysis: this.extractSection(text, "Operational Foundation"),
      legalAnalysis: this.extractSection(text, "Legal Framework"),
      investmentScore: this.extractScore(text),
      recommendations: this.extractRecommendations(text),
      risks: this.extractSection(text, "RISK LANDSCAPE"),
      growthTrajectory: this.extractSection(text, "GROWTH TRAJECTORY"),
      investmentDecision: this.extractSection(text, "INVESTMENT DECISION"),
      rawAnalysis: text,
    };

    return sections;
  }

  extractSection(text, sectionTitle) {
    const regex = new RegExp(
      `##\\s*${sectionTitle}[^#]*([\\s\\S]*?)(?=##|$)`,
      "i",
    );
    const match = text.match(regex);
    return match ? match[1].trim() : "Section not found";
  }

  extractScore(text) {
    const scoreMatch = text.match(/(?:score|rating):\s*(\d+)/i);
    return scoreMatch ? parseInt(scoreMatch[1]) : 50;
  }

  extractRecommendations(text) {
    const section = this.extractSection(text, "STRATEGIC ROADMAP");
    const recommendations = [];
    const lines = section.split("\n");
    let currentRec = null;

    lines.forEach((line) => {
      if (line.trim().startsWith("-") || line.trim().startsWith("•")) {
        const recText = line.trim().substring(1).trim();
        if (recText.length > 10) {
          currentRec = {
            title: recText.split(":")[0] || recText.substring(0, 50),
            description: recText,
            priority: "MEDIUM",
            category: "STRATEGIC",
            timeframe: "Short-term",
            expectedImpact: "Medium",
          };
          recommendations.push(currentRec);
        }
      }
    });

    // Return default structured recommendations if none found
    return recommendations.length > 0
      ? recommendations
      : [
          {
            title: "Strengthen Operational Capacity",
            description:
              "Build robust operational systems and processes to support growth and scalability.",
            priority: "HIGH",
            category: "OPERATIONAL",
            timeframe: "Immediate",
            expectedImpact: "High",
          },
          {
            title: "Improve Financial Management",
            description:
              "Implement comprehensive financial controls, reporting systems, and cash flow management.",
            priority: "HIGH",
            category: "FINANCIAL",
            timeframe: "Immediate",
            expectedImpact: "High",
          },
          {
            title: "Enhance Market Positioning",
            description:
              "Develop clear value proposition and competitive differentiation strategy.",
            priority: "MEDIUM",
            category: "MARKET",
            timeframe: "Short-term",
            expectedImpact: "Medium",
          },
        ];
  }

  parsePredictiveResponse(text) {
    try {
      // Try to parse as JSON first
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        // Validate that essential fields exist
        if (
          parsed.riskAssessment &&
          parsed.growthPotential &&
          parsed.investmentDecision
        ) {
          // Ensure all nested fields are present
          if (!parsed.riskAssessment.overallRiskScore) {
            parsed.riskAssessment.overallRiskScore =
              parsed.riskAssessment.riskScore || 50;
          }
          if (!parsed.riskAssessment.riskTrends) {
            parsed.riskAssessment.riskTrends = {
              next6Months: "Stable",
              next24Months: "Decreasing",
            };
          }
          if (
            !parsed.riskAssessment.keyRisks ||
            parsed.riskAssessment.keyRisks.length === 0
          ) {
            parsed.riskAssessment.keyRisks = this.getDefaultPredictiveData(
              {},
            ).riskAssessment.keyRisks;
          }
          if (!parsed.growthPotential.marketExpansion) {
            parsed.growthPotential.marketExpansion =
              this.getDefaultPredictiveData({}).growthPotential.marketExpansion;
          }
          if (
            !parsed.growthPotential.scalingFactors ||
            parsed.growthPotential.scalingFactors.length === 0
          ) {
            parsed.growthPotential.scalingFactors =
              this.getDefaultPredictiveData({}).growthPotential.scalingFactors;
          }
          if (!parsed.recommendations || parsed.recommendations.length === 0) {
            parsed.recommendations = this.getDefaultPredictiveData(
              {},
            ).recommendations;
          }
          if (!parsed.scenarioAnalysis) {
            parsed.scenarioAnalysis = this.getDefaultPredictiveData(
              {},
            ).scenarioAnalysis;
          }

          return parsed;
        }
      }
    } catch (e) {
      console.warn(
        "Could not parse predictive response as JSON, using defaults:",
        e.message,
      );
    }

    console.log("📝 Using default predictive data");
    return this.getDefaultPredictiveData({});
  }

  parseDomainResponse(text, domain) {
    return {
      domain,
      analysis: text,
      strengths: this.extractListItems(text, "strength"),
      weaknesses: this.extractListItems(text, "weakness"),
      recommendations: this.extractListItems(text, "recommendation"),
    };
  }

  parseExecutiveSummary(text) {
    // Remove markdown asterisks from the text
    const cleanText = text.replace(/\*\*/g, "");

    return {
      summary: cleanText,
      overview:
        this.extractSection(cleanText, "OVERVIEW") ||
        cleanText.substring(0, 300),
      strengths: this.extractListItems(cleanText, "strength"),
      concerns: this.extractListItems(cleanText, "concern"),
      recommendation:
        this.extractSection(cleanText, "RECOMMENDATION") ||
        "Further analysis required",
      nextSteps: this.extractListItems(cleanText, "next step"),
    };
  }

  extractListItems(text, keyword) {
    const items = [];
    const lines = text.split("\n");
    let capturing = false;

    lines.forEach((line) => {
      if (line.toLowerCase().includes(keyword)) {
        capturing = true;
      }
      if (
        capturing &&
        (line.trim().startsWith("-") ||
          line.trim().startsWith("•") ||
          line.trim().match(/^\d+\./))
      ) {
        items.push(line.trim().replace(/^[-•\d.]\s*/, ""));
      }
      if (capturing && line.trim() === "") {
        capturing = false;
      }
    });

    return items.length > 0 ? items : [`Analysis of ${keyword} pending`];
  }

  getDefaultPredictiveData(scoreData) {
    const avgScore = this.calculateAverageScore(scoreData);
    const baseRevenue = 50000; // Base revenue for projections

    return {
      riskAssessment: {
        overallRiskScore: 100 - avgScore,
        riskLevel: avgScore > 70 ? "Low" : avgScore > 50 ? "Medium" : "High",
        riskScore: 100 - avgScore,
        riskTrends: {
          next6Months: avgScore > 60 ? "Stable" : "Increasing",
          next24Months: avgScore > 60 ? "Decreasing" : "Stable",
        },
        keyRisks: [
          {
            risk: "Market competition and customer acquisition challenges",
            category: "MARKET",
            impact: avgScore < 50 ? "High" : "Medium",
            probability: "Medium",
            mitigation:
              "Develop unique value proposition and strengthen marketing efforts to differentiate from competitors",
            timeframe: "Short-term",
          },
          {
            risk: "Operational capacity constraints limiting scalability",
            category: "OPERATIONAL",
            impact: "Medium",
            probability: avgScore < 60 ? "High" : "Medium",
            mitigation:
              "Invest in operational systems, staff training, and process automation to improve efficiency",
            timeframe: "Medium-term",
          },
          {
            risk: "Financial sustainability and cash flow management",
            category: "FINANCIAL",
            impact: avgScore > 60 ? "Low" : "High",
            probability: avgScore > 60 ? "Low" : "Medium",
            mitigation:
              "Implement robust financial controls, diversify revenue streams, and maintain adequate cash reserves",
            timeframe: "Short-term",
          },
          {
            risk: "Regulatory compliance and legal framework changes",
            category: "GENERAL",
            impact: "Medium",
            probability: "Low",
            mitigation:
              "Stay updated on regulatory requirements, maintain proper documentation, and seek legal counsel when needed",
            timeframe: "Long-term",
          },
        ],
      },
      growthPotential: {
        growthScore: avgScore,
        growthCategory:
          avgScore > 75
            ? "High Growth"
            : avgScore > 55
              ? "Moderate Growth"
              : "Stable Growth",
        revenueProjections: {
          year1: {
            conservative: Math.round(baseRevenue * 1.15),
            realistic: Math.round(baseRevenue * 1.25),
            optimistic: Math.round(baseRevenue * 1.4),
          },
          year3: {
            conservative: Math.round(baseRevenue * 1.5),
            realistic: Math.round(baseRevenue * 1.85),
            optimistic: Math.round(baseRevenue * 2.3),
          },
          year5: {
            conservative: Math.round(baseRevenue * 2.0),
            realistic: Math.round(baseRevenue * 2.75),
            optimistic: Math.round(baseRevenue * 3.8),
          },
        },
        marketExpansion: {
          currentMarketSize: 5000000,
          addressableMarket: 2500000,
          marketSharePotential:
            avgScore > 70 ? "8-12%" : avgScore > 50 ? "5-8%" : "3-5%",
          marketGrowthRate:
            avgScore > 70
              ? "12-15% annually"
              : avgScore > 50
                ? "8-12% annually"
                : "5-8% annually",
        },
        scalingFactors: [
          {
            factor: "Digital transformation and technology adoption",
            impact: "High",
          },
          {
            factor: "Market expansion to new customer segments",
            impact: avgScore > 60 ? "High" : "Medium",
          },
          {
            factor: "Strategic partnerships and collaborations",
            impact: "Medium",
          },
          {
            factor: "Product/service diversification",
            impact: avgScore > 70 ? "High" : "Medium",
          },
          { factor: "Operational efficiency improvements", impact: "Medium" },
        ],
      },
      investmentDecision: {
        investmentReadinessScore: avgScore,
        recommendation:
          avgScore > 75
            ? "Conditional Investment"
            : avgScore > 55
              ? "Monitor"
              : "Not Recommended",
        expectedReturns:
          avgScore > 70
            ? "2.5-4x over 5 years"
            : avgScore > 50
              ? "2-3x over 5 years"
              : "1.5-2x over 5 years",
        confidenceLevel:
          avgScore > 70 ? "High" : avgScore > 50 ? "Medium" : "Low",
        investmentRationale:
          avgScore > 70
            ? "Strong market positioning with solid operational foundation. Business demonstrates high readiness across key investment criteria."
            : avgScore > 50
              ? "Moderate investment potential with some areas requiring improvement. Business shows promise but needs strengthening in key areas before full investment commitment."
              : "Significant gaps identified in capital readiness. Business requires substantial improvements in operations, financial management, and market positioning before investment consideration.",
        conditions: [
          avgScore < 70
            ? "Strengthen financial management systems and reporting"
            : "Maintain robust financial controls",
          avgScore < 60
            ? "Develop comprehensive business and growth strategy"
            : "Refine and execute growth strategy",
          avgScore < 65
            ? "Build operational capacity and systems"
            : "Optimize operational efficiency",
          "Ensure legal compliance and proper documentation",
          avgScore < 55
            ? "Demonstrate market traction and customer acquisition"
            : "Scale customer acquisition efforts",
        ],
      },
      recommendations: [
        {
          title: "Strengthen Financial Infrastructure",
          description:
            "Implement robust accounting systems, improve cash flow management, and establish clear financial reporting mechanisms to enhance investor confidence.",
          priority: avgScore < 60 ? "HIGH" : "MEDIUM",
          category: "FINANCIAL",
          timeframe: "Immediate",
          expectedImpact: "High",
        },
        {
          title: "Enhance Market Positioning Strategy",
          description:
            "Conduct comprehensive market analysis, refine value proposition, and develop targeted marketing campaigns to strengthen competitive advantage.",
          priority: avgScore < 65 ? "HIGH" : "MEDIUM",
          category: "MARKET",
          timeframe: "Short-term",
          expectedImpact: "High",
        },
        {
          title: "Build Operational Excellence",
          description:
            "Streamline operations, implement quality control measures, and invest in team development to improve delivery efficiency and scalability.",
          priority: "MEDIUM",
          category: "OPERATIONAL",
          timeframe: "Medium-term",
          expectedImpact: "Medium",
        },
        {
          title: "Develop Strategic Growth Plan",
          description:
            "Create detailed 3-5 year growth roadmap with clear milestones, resource requirements, and expansion strategies to guide sustainable development.",
          priority: avgScore > 70 ? "MEDIUM" : "HIGH",
          category: "STRATEGIC",
          timeframe: "Short-term",
          expectedImpact: "High",
        },
        {
          title: "Ensure Legal and Regulatory Compliance",
          description:
            "Review and update all legal documentation, ensure proper registration and licensing, and establish governance frameworks to mitigate legal risks.",
          priority: avgScore < 55 ? "HIGH" : "LOW",
          category: "GENERAL",
          timeframe: "Immediate",
          expectedImpact: "Medium",
        },
      ],
      scenarioAnalysis: {
        bestCase: {
          title: "Best Case Scenario",
          description:
            avgScore > 70
              ? "With strong execution and favorable market conditions, the business achieves accelerated growth. Market demand exceeds projections, operational efficiency improves significantly, and strategic partnerships materialize. The business captures significant market share and achieves profitability ahead of schedule."
              : "Improved management practices and market conditions lead to steady growth. The business successfully implements recommended improvements, attracts quality talent, and secures additional funding. Revenue grows consistently and customer retention improves.",
          probability: avgScore > 70 ? "35-40%" : "25-30%",
          expectedReturns:
            avgScore > 70 ? "4-5x over 5 years" : "3-4x over 5 years",
          timeframe: "5 years",
          keyDrivers: [
            "Strong market demand and favorable economic conditions",
            "Successful execution of growth strategy",
            "Strategic partnerships and market expansion",
            "Operational excellence and cost optimization",
          ],
        },
        mostLikely: {
          title: "Most Likely Scenario",
          description:
            avgScore > 70
              ? "The business maintains its strong position and grows steadily. It successfully navigates market challenges, implements most strategic initiatives, and achieves sustainable profitability. Some delays and challenges occur but are managed effectively."
              : "The business shows gradual improvement with consistent implementation of recommendations. Growth is steady but moderate, with some setbacks balanced by wins. The business maintains operations and slowly builds market presence.",
          probability: avgScore > 70 ? "45-50%" : "50-55%",
          expectedReturns:
            avgScore > 70 ? "2.5-3.5x over 5 years" : "2-2.5x over 5 years",
          timeframe: "5 years",
          keyDrivers: [
            "Steady market growth and stable economic environment",
            "Gradual implementation of strategic initiatives",
            "Moderate competition and market dynamics",
            "Consistent operational improvements",
          ],
        },
        worstCase: {
          title: "Worst Case Scenario",
          description:
            avgScore > 70
              ? "External market shocks or execution challenges slow growth significantly. Competition intensifies, key team members leave, or regulatory changes impact operations. The business survives but growth stalls temporarily, requiring strategic pivots."
              : "Significant challenges emerge including cash flow problems, increased competition, or operational failures. Without rapid corrective action, the business struggles to maintain market position. Revenue declines and profitability remains elusive.",
          probability: avgScore > 70 ? "15-20%" : "20-25%",
          expectedReturns:
            avgScore > 70 ? "1.5-2x over 5 years" : "0.5-1.5x over 5 years",
          timeframe: "5 years",
          keyDrivers: [
            "Economic downturn or adverse market conditions",
            "Execution failures or management challenges",
            "Intense competition and market disruption",
            "Cash flow problems and funding constraints",
          ],
        },
      },
    };
  }

  calculateAverageScore(scoreData) {
    if (!scoreData) return 50;

    const scores = [
      scoreData.commercial?.percentage || 0,
      scoreData.financial?.percentage || 0,
      scoreData.operations?.percentage || 0,
      scoreData.legal?.percentage || 0,
    ];

    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }
}

// Export singleton instance
export const cratAIAnalyzer = new CRATAIAnalyzer();

// Export utility functions for easy use
export const testOpenAIConnection = async () => {
  try {
    console.log("🧪 Testing OpenAI connection...");

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: "Hello, please respond with 'Connection successful'",
        },
      ],
      max_tokens: 50,
    });

    const text = response.choices[0].message.content;

    console.log("✅ OpenAI connection test successful:", text);
    return { success: true, message: text };
  } catch (error) {
    console.error("❌ OpenAI connection test failed:", error);
    return { success: false, error: error.message };
  }
};

export const analyzeCompleteReport = (reportData, scoreData, businessInfo) =>
  cratAIAnalyzer.analyzeCompleteReport(reportData, scoreData, businessInfo);

export const analyzeDomain = (domain, domainData, domainScore) =>
  cratAIAnalyzer.analyzeDomain(domain, domainData, domainScore);

export const generateExecutiveSummary = (scoreData, generalStatus) =>
  cratAIAnalyzer.generateExecutiveSummary(scoreData, generalStatus);
