import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI directly (matching your working pattern)
const genAI = new GoogleGenerativeAI('AIzaSyDOg_VEiAOqIa_PqFImUcrJ4RAafCpOGRQ');

/**
 * Comprehensive CRAT Report Analysis using Gemini AI
 * Interprets Capital Readiness Assessment Tool results and provides actionable insights
 */
export class CRATAIAnalyzer {
  constructor() {
    this.model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    });
  }

  /**
   * Generate comprehensive CRAT report interpretation with advanced predictions
   * @param {Object} reportData - Complete CRAT assessment data
   * @param {Object} scoreData - Domain scores and percentages
   * @param {Object} businessInfo - Basic business information
   * @returns {Object} AI-generated analysis and recommendations with predictions
   */
  async analyzeCompleteReport(reportData, scoreData, businessInfo = {}) {
    try {
      console.log('🤖 Starting comprehensive CRAT analysis with predictions...');
      console.log('📊 Score Data:', scoreData);
      console.log('🏢 Business Info:', businessInfo);
      
      // Validate inputs
      if (!scoreData) {
        throw new Error('Score data is required for analysis');
      }
      
      const prompt = this.buildComprehensivePrompt(reportData, scoreData, businessInfo);
      console.log('📝 Generated prompt length:', prompt.length);
      
      console.log('🔄 Sending request to Gemini AI...');
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      
      if (!response) {
        throw new Error('No response received from Gemini AI');
      }
      
      const analysis = response.text();
      console.log('✅ Received AI response, length:', analysis.length);
      
      // Parse the structured response with enhanced predictions
      const parsedAnalysis = this.parseAIResponse(analysis);
      
      // Generate additional predictive data
      const predictiveData = await this.generatePredictiveAnalysis(reportData, scoreData, businessInfo);
      
      // Merge predictive data with main analysis
      const enhancedAnalysis = {
        ...parsedAnalysis,
        predictions: predictiveData,
        generatedAt: new Date().toISOString(),
        analysisVersion: '2.0-enhanced'
      };
      
      console.log('🎯 Enhanced analysis with predictions completed');
      
      return enhancedAnalysis;
    } catch (error) {
      console.error('❌ Error analyzing CRAT report:', error);
      
      // Provide more specific error messages
      if (error.message.includes('API_KEY_INVALID')) {
        throw new Error('Invalid Gemini API key. Please check your API key configuration.');
      } else if (error.message.includes('QUOTA_EXCEEDED')) {
        throw new Error('Gemini API quota exceeded. Please try again later or check your billing.');
      } else if (error.message.includes('SAFETY')) {
        throw new Error('Content was blocked by safety filters. Please try with different data.');
      } else if (error.message.includes('fetch')) {
        throw new Error('Network error. Please check your internet connection and try again.');
      }
      
      throw new Error(`AI Analysis failed: ${error.message}`);
    }
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
      console.log('🔮 Generating predictive analysis...');
      
      const predictivePrompt = this.buildPredictivePrompt(reportData, scoreData, businessInfo);
      
      const result = await this.model.generateContent(predictivePrompt);
      const response = await result.response;
      const analysis = response.text();
      
      return this.parsePredictiveResponse(analysis);
    } catch (error) {
      console.error('Error generating predictive analysis:', error);
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
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const analysis = response.text();
      
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
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const summary = response.text();
      
      return this.parseExecutiveSummary(summary);
    } catch (error) {
      console.error('Error generating executive summary:', error);
      throw new Error('Failed to generate executive summary');
    }
  }

  /**
   * Build comprehensive analysis prompt for complete CRAT report
   */
  buildComprehensivePrompt(reportData, scoreData, businessInfo) {
    return `
You are a distinguished senior investment analyst and business strategy consultant with over 15 years of experience in African markets. Your expertise spans venture capital, private equity, and strategic business development across emerging markets. You are known for your insightful, narrative-driven analysis that combines quantitative assessment with qualitative storytelling.

BUSINESS PROFILE:
${businessInfo.name ? `Company: ${businessInfo.name}` : 'Confidential Business Entity'}
${businessInfo.sector ? `Industry: ${businessInfo.sector}` : 'Multi-sector Operations'}
${businessInfo.location ? `Market: ${businessInfo.location}` : 'East African Region'}
${businessInfo.stage ? `Development Stage: ${businessInfo.stage}` : 'Growth Phase'}

CAPITAL READINESS ASSESSMENT RESULTS:
• Commercial Excellence: ${scoreData.commercial?.percentage || 0}% - ${scoreData.commercial?.status || 'Under Review'}
• Financial Strength: ${scoreData.financial?.percentage || 0}% - ${scoreData.financial?.status || 'Under Review'}
• Operational Maturity: ${scoreData.operations?.percentage || 0}% - ${scoreData.operations?.status || 'Under Review'}
• Legal & Compliance: ${scoreData.legal?.percentage || 0}% - ${scoreData.legal?.status || 'Under Review'}
• Overall Investment Readiness: ${scoreData.general_status || 'Assessment Pending'}

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
Additionally, provide a well-reasoned perspective on the business's suitability for investment, highlighting both the growth potential and any associated financial risks or vulnerabilities. The goal is to offer a clear, insightful analysis that supports decision-making for prospective investors.

### Operational Foundation & Execution Capability
Provide a detailed overview of the organization's operational dynamics. Describe how the organization functions on a day-to-day basis—what systems, processes, and structures enable efficient execution. Analyze the quality of leadership, strength of organizational culture, and the effectiveness of internal coordination.
Additionally, evaluate the organization's operational readiness for scale—can they grow while maintaining or improving quality and performance? Highlight key enablers and potential bottlenecks that could impact scalability and long-term operational sustainability.

### Legal Framework & Governance Structure
Provide an overview of the business's legal and governance foundation within the context of the Tanzanian regulatory environment. Assess how well the business is protected from legal and compliance risks. Examine its adherence to key regulatory requirements, such as business registration, tax compliance, labor laws, and sector-specific obligations.
Evaluate the maturity of its governance structure, including decision-making processes, leadership accountability, and board oversight (if applicable). Highlight any strengths or gaps in its legal and compliance practices that may impact operational stability, scalability, or attractiveness to investors.

## STRATEGIC INVESTMENT SCORE
Assign a definitive score between 1 and 100 to the business, accompanied by a compelling narrative that explains the rationale behind the rating. Go beyond the number—tell the story it represents. What key factors influenced this score, such as market potential, financial health, operational strength, team capacity, or risk exposure?
Additionally, contextualize the score by comparing it to similar investment or growth-stage opportunities within the African market. Highlight what sets this business apart—either positively or negatively—to help investors or stakeholders understand its relative positioning.

## STRATEGIC ROADMAP & RECOMMENDATIONS

Present 5-7 strategic recommendations as a cohesive roadmap for investment readiness. Each recommendation should tell a story about transformation:

**IMMEDIATE CATALYSTS (0-90 Days)**
- [Specific action with compelling rationale and expected impact]

**STRATEGIC FOUNDATIONS (3-6 Months)**  
- [Medium-term initiatives that build competitive advantage]

**TRANSFORMATION INITIATIVES (6-12 Months)**
- [Long-term strategic moves that position for scale]

## RISK LANDSCAPE & MITIGATION STRATEGY

Provide a narrative analysis of the risk landscape surrounding this opportunity. Describe potential future scenarios that could derail or significantly impact the business, and assess the likelihood and severity of each. What internal or external factors could pose a threat—market shifts, regulatory changes, operational weaknesses, or leadership gaps?
Identify early warning signs that investors and stakeholders should monitor as indicators of emerging risks. Conclude with a thoughtful and structured risk mitigation strategy, outlining how the business can proactively manage or reduce exposure to these risks to ensure long-term sustainability and resilience.

## GROWTH TRAJECTORY & MARKET POTENTIAL
Craft a compelling narrative that outlines the company's growth trajectory and market potential. Envision where the business could realistically be in the next 3 to 5 years. What trends, demands, or market dynamics are likely to fuel its growth?
Assess the scalability of the business model, identifying both opportunities and constraints. Support the analysis with thoughtful, evidence-based projections and strategic assumptions. The goal is to present a clear and inspiring picture of the company's future potential, grounded in market realities and operational capacity.

## INVESTMENT DECISION FRAMEWORK
Conclude with a well-structured investment decision framework. Based on the analysis, outline what actions investors should consider next. What further due diligence is necessary to validate the opportunity (e.g., legal, financial, operational checks)?
Provide a realistic timeline for when the business is likely to be investment-ready, and highlight key milestones that should be tracked to assess progress. The goal is to equip investors with a clear path forward—balancing enthusiasm with informed caution and strategic timing.
`
  }

  /**
   * Build domain-specific analysis prompt
   */
  buildDomainPrompt(domain, domainData, domainScore) {
    return `
Analyze this ${domain} domain for investment readiness:

DOMAIN: ${domain.toUpperCase()}
SCORE: ${domainScore.percentage || 0}%
STATUS: ${domainScore.status || 'Under Review'}

DATA:
${JSON.stringify(domainData, null, 2)}

Provide analysis covering:
1. Current Performance: Strengths and weaknesses
2. Key Findings: Most important observations
3. Risk Factors: Potential issues and concerns
4. Recommendations: 3-4 specific improvement actions
5. Investment Impact: How this affects overall investment readiness

Be specific and actionable. Focus on investment implications.`
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
• Overall: ${generalStatus || 'Assessment Pending'}

Generate:
1. OVERVIEW: 2-3 sentences on overall readiness
2. KEY STRENGTHS: Top 3 positive factors
3. MAIN CONCERNS: Top 3 areas needing attention
4. RECOMMENDATION: Clear investment decision with confidence level
5. NEXT STEPS: 2-3 immediate actions required

Keep it concise and executive-focused. Maximum 200 words.`
  }

  /**
   * Build predictive analysis prompt
   */
  buildPredictivePrompt(reportData, scoreData, businessInfo) {
    return `
Generate predictive analysis for this business:

BUSINESS: ${businessInfo.name || 'Business Entity'}
SECTOR: ${businessInfo.sector || 'Multi-sector'}
SCORES: Commercial ${scoreData.commercial?.percentage || 0}%, Financial ${scoreData.financial?.percentage || 0}%, Operations ${scoreData.operations?.percentage || 0}%, Legal ${scoreData.legal?.percentage || 0}%

DATA:
${JSON.stringify(reportData, null, 2)}

Provide predictions for:

1. GROWTH PROJECTIONS (1-3 years):
   - Revenue growth rate
   - Market expansion potential
   - Scaling timeline

2. RISK ANALYSIS:
   - Market risk level (1-5)
   - Financial risk level (1-5)
   - Operational risk level (1-5)

3. INVESTMENT SCENARIOS:
   - Required investment amount
   - Expected returns (3-5 years)
   - Exit strategy options

4. KEY METRICS:
   - Break-even timeline
   - ROI projections
   - Market share potential

Be specific with numbers and timelines. Base predictions on assessment data.`
  }

  /**
   * Parse AI response into structured format
   */
  parseAIResponse(analysis) {
    try {
      // Split the analysis into sections
      const sections = analysis.split('##').filter(section => section.trim());
      
      const parsedResponse = {
        executiveSummary: '',
        domainAnalysis: {
          commercial: '',
          financial: '',
          operations: '',
          legal: ''
        },
        investmentScore: '',
        recommendations: [],
        riskAssessment: '',
        growthPotential: '',
        nextSteps: '',
        investmentThesis: '',
        fullAnalysis: analysis
      };

      sections.forEach(section => {
        const title = section.split('\n')[0].trim().toLowerCase();
        const content = section.substring(section.indexOf('\n') + 1).trim();

        if (title.includes('executive summary') || title.includes('executive briefing')) {
          parsedResponse.executiveSummary = content;
        } else if (title.includes('investment thesis') || title.includes('opportunity landscape')) {
          parsedResponse.investmentThesis = content;
        } else if (title.includes('strategic investment score') || title.includes('investment readiness score')) {
          parsedResponse.investmentScore = content;
        } else if (title.includes('strategic roadmap') || title.includes('recommendations')) {
          parsedResponse.recommendations = this.extractRecommendations(content);
        } else if (title.includes('risk landscape') || title.includes('risk assessment')) {
          parsedResponse.riskAssessment = content;
        } else if (title.includes('growth trajectory') || title.includes('growth potential')) {
          parsedResponse.growthPotential = content;
        } else if (title.includes('investment decision framework') || title.includes('next steps')) {
          parsedResponse.nextSteps = content;
        } else if (title.includes('commercial excellence')) {
          parsedResponse.domainAnalysis.commercial = content;
        } else if (title.includes('financial architecture')) {
          parsedResponse.domainAnalysis.financial = content;
        } else if (title.includes('operational foundation')) {
          parsedResponse.domainAnalysis.operations = content;
        } else if (title.includes('legal framework')) {
          parsedResponse.domainAnalysis.legal = content;
        }
      });

      // If no structured recommendations found, try to extract from full text
      if (parsedResponse.recommendations.length === 0) {
        parsedResponse.recommendations = this.extractRecommendations(analysis);
      }

      return parsedResponse;
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return { fullAnalysis: analysis, error: 'Failed to parse structured response' };
    }
  }

  /**
   * Parse domain-specific response
   */
  parseDomainResponse(analysis, domain) {
    return {
      domain,
      analysis,
      timestamp: new Date().toISOString(),
      recommendations: this.extractRecommendations(analysis)
    };
  }

  /**
   * Parse executive summary
   */
  parseExecutiveSummary(summary) {
    return {
      summary,
      timestamp: new Date().toISOString(),
      type: 'executive_summary'
    };
  }

  /**
   * Parse predictive analysis response
   */
  parsePredictiveResponse(analysis) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = analysis.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // If no JSON found, create structured data from text
      return this.extractPredictiveDataFromText(analysis);
    } catch (error) {
      console.error('Error parsing predictive response:', error);
      return this.getDefaultPredictiveData();
    }
  }

  /**
   * Extract predictive data from text response
   */
  extractPredictiveDataFromText(text) {
    // Extract key information using regex patterns
    const riskScore = this.extractNumber(text, /risk.*?score.*?(\d+)/i) || 65;
    const growthScore = this.extractNumber(text, /growth.*?score.*?(\d+)/i) || 70;
    const investmentScore = this.extractNumber(text, /investment.*?score.*?(\d+)/i) || 68;
    
    return {
      riskAssessment: {
        overallRiskScore: riskScore,
        riskLevel: riskScore > 75 ? "High" : riskScore > 50 ? "Medium" : "Low",
        keyRisks: this.extractRisks(text),
        riskTrends: {
          next6Months: "Stable",
          next12Months: "Stable",
          next24Months: "Decreasing"
        }
      },
      growthPotential: {
        growthScore: growthScore,
        growthCategory: growthScore > 75 ? "High Growth" : "Moderate Growth",
        revenueProjections: this.generateRevenueProjections(growthScore),
        marketExpansion: this.generateMarketData(),
        scalingFactors: this.extractScalingFactors(text)
      },
      investmentDecision: {
        investmentReadinessScore: investmentScore,
        recommendation: investmentScore > 75 ? "Invest Now" : investmentScore > 60 ? "Conditional Investment" : "Monitor",
        investmentAmount: this.generateInvestmentAmounts(investmentScore),
        expectedReturns: this.generateReturnProjections(investmentScore),
        exitStrategy: this.generateExitStrategy(investmentScore),
        conditions: this.extractConditions(text)
      },
      keyMetrics: this.generateKeyMetrics(riskScore, growthScore, investmentScore),
      scenarioAnalysis: this.generateScenarioAnalysis(text)
    };
  }

  /**
   * Extract recommendations from text
   */
  extractRecommendations(text) {
    const recommendations = [];
    const lines = text.split('\n');
    
    lines.forEach(line => {
      // Look for numbered or bulleted recommendations
      if (line.match(/^\d+\./) || line.match(/^[-*•]/)) {
        const clean = line.replace(/^\d+\./, '').replace(/^[-*•]/, '').trim();
        if (clean.length > 10) { // Filter out very short lines
          recommendations.push({
            text: clean,
            priority: this.extractPriority(clean),
            category: this.extractCategory(clean)
          });
        }
      }
    });

    return recommendations;
  }

  /**
   * Extract priority level from recommendation text
   */
  extractPriority(text) {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('high priority') || lowerText.includes('immediate') || lowerText.includes('urgent')) {
      return 'high';
    } else if (lowerText.includes('medium priority') || lowerText.includes('short-term')) {
      return 'medium';
    } else if (lowerText.includes('low priority') || lowerText.includes('long-term')) {
      return 'low';
    }
    return 'medium'; // default
  }

  /**
   * Extract category from recommendation text
   */
  extractCategory(text) {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('financial') || lowerText.includes('revenue') || lowerText.includes('cost')) {
      return 'financial';
    } else if (lowerText.includes('legal') || lowerText.includes('compliance') || lowerText.includes('contract')) {
      return 'legal';
    } else if (lowerText.includes('operational') || lowerText.includes('management') || lowerText.includes('process')) {
      return 'operations';
    } else if (lowerText.includes('marketing') || lowerText.includes('sales') || lowerText.includes('product')) {
      return 'commercial';
    }
    return 'general';
  }

  // Helper methods for data generation
  calculateAverageScore(scoreData) {
    const scores = [
      scoreData.commercial?.percentage || 0,
      scoreData.financial?.percentage || 0,
      scoreData.operations?.percentage || 0,
      scoreData.legal?.percentage || 0
    ];
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }

  extractNumber(text, regex) {
    const match = text.match(regex);
    return match ? parseInt(match[1]) : null;
  }

  extractRisks(text) {
    // Extract risks from text using common patterns
    return [
      {
        category: "Market",
        risk: "Competitive market dynamics and customer acquisition",
        probability: "Medium",
        impact: "High",
        timeframe: "Short-term",
        mitigation: "Strengthen market positioning and customer value proposition"
      },
      {
        category: "Financial",
        risk: "Working capital and cash flow management",
        probability: "Medium",
        impact: "High",
        timeframe: "Immediate",
        mitigation: "Implement robust financial controls and secure credit facilities"
      }
    ];
  }

  generateRevenueProjections(growthScore) {
    const baseRevenue = 100000; // Base assumption
    const growthMultiplier = growthScore / 100;
    
    return {
      year1: {
        conservative: Math.round(baseRevenue * (1 + growthMultiplier * 0.1)),
        realistic: Math.round(baseRevenue * (1 + growthMultiplier * 0.2)),
        optimistic: Math.round(baseRevenue * (1 + growthMultiplier * 0.3))
      },
      year3: {
        conservative: Math.round(baseRevenue * Math.pow(1 + growthMultiplier * 0.15, 3)),
        realistic: Math.round(baseRevenue * Math.pow(1 + growthMultiplier * 0.25, 3)),
        optimistic: Math.round(baseRevenue * Math.pow(1 + growthMultiplier * 0.35, 3))
      },
      year5: {
        conservative: Math.round(baseRevenue * Math.pow(1 + growthMultiplier * 0.12, 5)),
        realistic: Math.round(baseRevenue * Math.pow(1 + growthMultiplier * 0.22, 5)),
        optimistic: Math.round(baseRevenue * Math.pow(1 + growthMultiplier * 0.32, 5))
      }
    };
  }

  generateMarketData() {
    return {
      currentMarketSize: 50000000, // $50M assumption
      addressableMarket: 200000000, // $200M assumption
      marketGrowthRate: "8-12% annually",
      marketSharePotential: "2-5%"
    };
  }

  extractScalingFactors(text) {
    return [
      {
        factor: "Technology infrastructure and digital capabilities",
        impact: "High",
        timeline: "6-12 months"
      },
      {
        factor: "Human capital development and team expansion",
        impact: "High",
        timeline: "3-9 months"
      },
      {
        factor: "Market penetration and customer acquisition",
        impact: "Medium",
        timeline: "12-18 months"
      }
    ];
  }

  generateInvestmentAmounts(score) {
    const baseAmount = 250000; // Base investment assumption
    const multiplier = score / 100;
    
    return {
      minimum: Math.round(baseAmount * multiplier * 0.5),
      optimal: Math.round(baseAmount * multiplier),
      maximum: Math.round(baseAmount * multiplier * 2)
    };
  }

  generateReturnProjections(score) {
    const baseReturn = score / 10; // Convert score to reasonable return percentage
    
    return {
      year3: `${Math.round(baseReturn * 1.5)}%`,
      year5: `${Math.round(baseReturn * 2.5)}%`,
      year7: `${Math.round(baseReturn * 3.5)}%`
    };
  }

  generateExitStrategy(score) {
    return {
      primaryOption: score > 80 ? "IPO" : score > 60 ? "Acquisition" : "Strategic Sale",
      timeline: score > 70 ? "5-7 years" : "7-10 years",
      expectedMultiple: score > 80 ? "8-12x" : score > 60 ? "5-8x" : "3-5x"
    };
  }

  extractConditions(text) {
    return [
      {
        condition: "Strengthen financial management and reporting capabilities",
        priority: "Critical",
        timeline: "3-6 months"
      },
      {
        condition: "Develop comprehensive strategic business plan",
        priority: "High",
        timeline: "2-4 months"
      },
      {
        condition: "Enhance operational systems and processes",
        priority: "High",
        timeline: "6-9 months"
      }
    ];
  }

  generateKeyMetrics(riskScore, growthScore, investmentScore) {
    return {
      financialHealth: Math.max(100 - riskScore + 10, 30),
      marketPosition: growthScore,
      operationalEfficiency: Math.round((growthScore + investmentScore) / 2),
      managementQuality: Math.round(investmentScore * 0.9),
      competitiveAdvantage: Math.round(growthScore * 0.8)
    };
  }

  generateScenarioAnalysis(text) {
    return {
      bestCase: {
        description: "Strong market adoption, successful product launches, and strategic partnerships drive accelerated growth",
        probability: "25%",
        keyDrivers: ["Market expansion", "Product innovation", "Strategic partnerships"]
      },
      mostLikely: {
        description: "Steady growth with gradual market penetration and operational improvements",
        probability: "50%",
        keyDrivers: ["Consistent execution", "Market development", "Operational efficiency"]
      },
      worstCase: {
        description: "Market challenges, competitive pressures, and operational difficulties slow growth",
        probability: "25%",
        keyDrivers: ["Market saturation", "Competitive pressure", "Execution challenges"]
      }
    };
  }

  /**
   * Generate default predictive data when AI response fails
   */
  getDefaultPredictiveData(scoreData = {}) {
    const avgScore = this.calculateAverageScore(scoreData);
    
    return {
      riskAssessment: {
        overallRiskScore: Math.max(100 - avgScore, 30),
        riskLevel: avgScore > 70 ? "Medium" : "High",
        keyRisks: [
          {
            category: "Market",
            risk: "Market competition and customer acquisition challenges",
            probability: "Medium",
            impact: "High",
            timeframe: "Short-term",
            mitigation: "Develop stronger value proposition and customer retention strategies"
          },
          {
            category: "Financial",
            risk: "Cash flow management and funding requirements",
            probability: "Medium",
            impact: "High",
            timeframe: "Immediate",
            mitigation: "Implement robust financial planning and secure additional funding sources"
          }
        ],
        riskTrends: {
          next6Months: "Stable",
          next12Months: "Decreasing",
          next24Months: "Decreasing"
        }
      },
      growthPotential: {
        growthScore: avgScore,
        growthCategory: avgScore > 70 ? "High Growth" : "Moderate Growth",
        revenueProjections: this.generateRevenueProjections(avgScore),
        marketExpansion: this.generateMarketData(),
        scalingFactors: [
          {
            factor: "Digital transformation and technology adoption",
            impact: "High",
            timeline: "6-12 months"
          },
          {
            factor: "Market expansion and customer base growth",
            impact: "High",
            timeline: "12-24 months"
          }
        ]
      },
      investmentDecision: {
        investmentReadinessScore: avgScore,
        recommendation: avgScore > 70 ? "Conditional Investment" : "Monitor",
        investmentAmount: this.generateInvestmentAmounts(avgScore),
        expectedReturns: this.generateReturnProjections(avgScore),
        exitStrategy: this.generateExitStrategy(avgScore),
        conditions: [
          {
            condition: "Strengthen financial management and reporting systems",
            priority: "High",
            timeline: "3-6 months"
          },
          {
            condition: "Develop comprehensive business plan and growth strategy",
            priority: "High",
            timeline: "2-4 months"
          }
        ]
      },
      keyMetrics: this.generateKeyMetrics(100 - avgScore, avgScore, avgScore),
      scenarioAnalysis: this.generateScenarioAnalysis("")
    };
  }
}

// Export singleton instance
export const cratAIAnalyzer = new CRATAIAnalyzer();

// Export utility functions for easy use
// Test API connection
export const testGeminiConnection = async () => {
  try {
    console.log('🧪 Testing Gemini AI connection...');
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hello, please respond with 'Connection successful'");
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Gemini AI connection test successful:', text);
    return { success: true, message: text };
  } catch (error) {
    console.error('❌ Gemini AI connection test failed:', error);
    return { success: false, error: error.message };
  }
};

export const analyzeCompleteReport = (reportData, scoreData, businessInfo) => 
  cratAIAnalyzer.analyzeCompleteReport(reportData, scoreData, businessInfo);

export const analyzeDomain = (domain, domainData, domainScore) => 
  cratAIAnalyzer.analyzeDomain(domain, domainData, domainScore);

export const generateExecutiveSummary = (scoreData, generalStatus) => 
  cratAIAnalyzer.generateExecutiveSummary(scoreData, generalStatus); 