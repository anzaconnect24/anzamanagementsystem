// Simple test script to verify AI functionality
import { GoogleGenerativeAI } from "@google/generative-ai";

const testAI = async () => {
  try {
    console.log('🧪 Testing direct Gemini AI...');
    
    const genAI = new GoogleGenerativeAI('AIzaSyDOg_VEiAOqIa_PqFImUcrJ4RAafCpOGRQ');
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const result = await model.generateContent("Hello, please respond with 'AI is working correctly'");
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ AI Response:', text);
    return true;
  } catch (error) {
    console.error('❌ AI Test Failed:', error);
    return false;
  }
};

// Run test if this file is executed directly
if (typeof window !== 'undefined') {
  testAI();
}

export default testAI; 