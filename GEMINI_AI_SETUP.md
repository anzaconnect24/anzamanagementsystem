# Gemini AI Integration Setup Guide

## Overview
This guide explains how to set up and use the Gemini AI integration for CRAT (Capital Readiness Assessment Tool) report analysis.

## Features
- **Complete Report Analysis**: Comprehensive AI interpretation of all CRAT domains
- **Domain-Specific Analysis**: Focused analysis on individual domains (Commercial, Financial, Operations, Legal)
- **Executive Summary**: Quick overview with key findings and recommendations
- **Risk Assessment**: AI-powered risk analysis and mitigation strategies
- **Actionable Recommendations**: Prioritized, specific recommendations for improvement

## Setup Instructions

### 1. Get Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the API key

### 2. Configure Environment Variables
Create a `.env.local` file in your project root and add:

```env
NEXT_PUBLIC_GEMINI_API_KEY=AIzaSyC7xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. Install Dependencies
The required package is already added to package.json:
```bash
npm install @google/generative-ai
```

### 4. User Access Control
AI Analysis is available for:
- ✅ **Admin** - Full access to all AI features
- ✅ **Investor** - Complete analysis for investment decisions
- ✅ **Mentor** - Domain analysis and recommendations
- ✅ **Reviewer** - Assessment validation and insights
- ❌ **Entrepreneur** - No access (to maintain objectivity)

## Usage

### Accessing AI Analysis
1. Navigate to the CRAT Report page (`/report`)
2. The AI Analysis panel will appear below the performance charts
3. Click "Generate Complete Analysis" for full AI interpretation

### Available Analysis Types

#### 1. Executive Summary
- **Auto-generated** for eligible users
- Quick overview of investment readiness
- Key strengths and critical gaps
- Overall recommendation

#### 2. Complete Analysis
- Comprehensive analysis of all domains
- Investment readiness score (1-100)
- Detailed recommendations with priorities
- Risk assessment and mitigation strategies
- Growth potential evaluation

#### 3. Domain-Specific Analysis
- Focused analysis on individual domains
- Specific recommendations for each area
- Implementation roadmap with timelines
- Resource requirements and success metrics

#### 4. Risk Assessment
- High-risk factors that could derail investment
- Medium-risk areas requiring monitoring
- Risk mitigation strategies
- Timeline for addressing risks

## AI Prompts & Analysis Quality

### Prompt Engineering
The system uses carefully crafted prompts that:
- **Context-Aware**: Understands African business environment
- **Role-Specific**: Tailored for different user types
- **Actionable**: Provides specific, implementable recommendations
- **Structured**: Consistent format for easy parsing

### Analysis Depth
- **Comprehensive**: Covers all CRAT domains and sub-domains
- **Contextual**: Considers business stage, sector, and location
- **Benchmarked**: Compares against industry standards
- **Prioritized**: Recommendations ranked by impact and feasibility

## Technical Implementation

### Key Components
1. **`app/services/geminiAI.js`** - Core AI service
2. **`components/AI/AIAnalysisPanel.js`** - UI component
3. **Integration in report page** - Seamless user experience

### API Usage
- Uses Gemini 1.5 Pro model for best results
- Structured prompts for consistent output
- Error handling and fallback mechanisms
- Response parsing for structured data

## Best Practices

### For Users
1. **Complete Assessment First**: Ensure all CRAT domains are properly assessed
2. **Review AI Recommendations**: AI provides guidance, but human judgment is crucial
3. **Implement Gradually**: Start with high-priority recommendations
4. **Track Progress**: Monitor improvements and reassess periodically

### For Administrators
1. **Monitor API Usage**: Track Gemini API costs and usage
2. **Update Prompts**: Refine prompts based on user feedback
3. **Quality Control**: Review AI outputs for accuracy and relevance
4. **User Training**: Educate users on how to interpret AI analysis

## Troubleshooting

### Common Issues
1. **API Key Not Working**
   - Verify key is correctly set in environment variables
   - Check API key permissions in Google AI Studio
   - Ensure billing is enabled for your Google account

2. **Analysis Not Generating**
   - Check browser console for errors
   - Verify report data is complete
   - Try refreshing the page

3. **Poor Quality Analysis**
   - Ensure assessment data is complete and accurate
   - Check that all domains have been properly evaluated
   - Consider updating business information

### Error Messages
- `"Failed to generate AI analysis"` - Check API key and network connection
- `"Report data not available"` - Complete the CRAT assessment first
- `"API configuration error"` - Verify environment variables

## Cost Management

### API Costs
- Gemini AI charges per token (input + output)
- Complete analysis: ~2,000-3,000 tokens
- Executive summary: ~500-800 tokens
- Domain analysis: ~800-1,200 tokens each

### Optimization Tips
1. **Cache Results**: Store AI analysis to avoid regeneration
2. **Smart Triggers**: Only generate when assessment changes
3. **User Limits**: Consider rate limiting for cost control
4. **Batch Processing**: Process multiple reports efficiently

## Security & Privacy

### Data Handling
- Assessment data is sent to Google's Gemini API
- No data is permanently stored by Google for model training
- Follow your organization's data privacy policies
- Consider data sensitivity before using AI analysis

### Recommendations
1. **Review Privacy Policy**: Understand Google's data handling
2. **Sanitize Data**: Remove sensitive information if necessary
3. **User Consent**: Inform users about AI processing
4. **Compliance**: Ensure compliance with local data protection laws

## Future Enhancements

### Planned Features
1. **Multi-language Support**: Analysis in local languages
2. **Industry-Specific Prompts**: Tailored analysis by sector
3. **Historical Comparison**: Track progress over time
4. **Export Capabilities**: PDF/Word export of AI analysis
5. **Integration with Investment Pipeline**: Connect to investment workflow

### Feedback & Improvement
- Collect user feedback on AI analysis quality
- Continuously refine prompts based on real-world usage
- Monitor accuracy and relevance of recommendations
- Update analysis criteria as CRAT methodology evolves

## Support

For technical support or questions:
1. Check this documentation first
2. Review browser console for error messages
3. Verify API key configuration
4. Contact system administrator

## 🧪 Testing the Integration

### **Method 1: Quick Test with AI Demo (Recommended)**
1. **Navigate to Dashboard**: Go to your main dashboard page (`/`)
2. **Find AI Demo**: Scroll down to see the "AI Demo & Testing" section
3. **Test Sample Analysis**: Click "Test AI with Sample Data" button
4. **Check Results**: You should see a sample executive summary generated

### **Method 2: Full CRAT Report Test**
1. **Complete CRAT Assessment**: Fill out all CRAT domains (Commercial, Financial, Operations, Legal)
2. **Go to Report Page**: Navigate to `/report`
3. **Generate AI Analysis**: 
   - Look for the "🤖 AI Analysis & Insights" section
   - Click "Generate Complete Analysis" button
   - Wait for AI processing (may take 30-60 seconds)
4. **View Results**: Browse through different tabs (Executive Summary, Recommendations, etc.)
5. **Download Reports**: Use PDF/JSON download buttons

### **Method 3: AI Reports Management**
1. **Access AI Reports**: Navigate to `/aiReports` (if the route exists)
2. **View Saved Reports**: See all previously generated AI analyses
3. **Download/Manage**: Download PDF/JSON or delete old reports

## 📊 **What You Should See**

### ✅ **Successful AI Analysis Includes:**
- **Executive Summary**: Comprehensive overview of business readiness
- **Prioritized Recommendations**: High/Medium/Low priority action items
- **Risk Assessment**: Potential risks and mitigation strategies  
- **Domain-Specific Insights**: Detailed analysis for each CRAT domain
- **Investment Readiness Score**: Overall assessment and next steps

### ❌ **Common Issues & Solutions:**

| Issue | Solution |
|-------|----------|
| "API key not found" error | Check `.env.local` file exists and has correct key |
| "Failed to generate analysis" | Verify Gemini API key is valid and has quota |
| Loading forever | Check network connection and API limits |
| Empty analysis results | Ensure CRAT data is complete before analysis |

## 🔍 **Debugging Steps**

### 1. Check Browser Console
```javascript
// Open browser dev tools (F12) and look for:
console.log('🤖 Starting AI analysis generation...');
console.log('✅ AI analysis completed successfully');
// Or error messages
```

### 2. Verify Environment Variables
```bash
# Check if .env.local exists
dir .env.local

# Check content exists (PowerShell)
Get-Content .env.local
```

### 3. Test API Connection
Open browser console and run:
```javascript
// Test if API key is loaded
console.log('API Key loaded:', !!process.env.NEXT_PUBLIC_GEMINI_API_KEY);
```

## 📥 **Report Downloads & Management**

### **PDF Reports Include:**
- Business information and assessment scores
- Complete AI analysis with executive summary
- Prioritized recommendations with action items
- Risk assessment and mitigation strategies
- Professional formatting with report ID and timestamps

### **JSON Export Contains:**
- Raw analysis data for further processing
- Complete assessment data and scores
- AI analysis metadata and version info
- Structured format for integration with other systems

### **Report Storage:**
- Reports are saved locally in browser storage
- Available across sessions until cleared
- Can be accessed via AI Reports management page
- No server-side storage (privacy-focused)

---

**Note**: This AI integration is designed to augment human expertise, not replace it. Always combine AI insights with professional judgment and local market knowledge. 