import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: "AIzaSyAjFuCtxmkvwu0lzyrmVFvTsAg0sP9bBnA" });

async function main() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Explain how AI works in a few words",
    });
    console.log("SUCCESS:", response.text);
  } catch (err) {
    console.error("ERROR:", err.message);
  }
}

main();
