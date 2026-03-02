// Simple test script to verify AI functionality
import { GoogleGenAI } from "@google/genai";

const testAI = async () => {
  try {
    console.log("🧪 Testing direct Gemini AI...");

    const ai = new GoogleGenAI({
      apiKey: "AIzaSyDOg_VEiAOqIa_PqFImUcrJ4RAafCpOGRQ",
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Hello, please respond with 'AI is working correctly'",
    });

    const text = response.text;

    console.log("✅ AI Response:", text);
    return true;
  } catch (error) {
    console.error("❌ AI Test Failed:", error);
    return false;
  }
};

// Run test if this file is executed directly
if (typeof window !== "undefined") {
  testAI();
}

export default testAI;
