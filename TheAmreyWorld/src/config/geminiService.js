// NOTE: In a real production app, never hardcode API keys on the frontend.
// Since this is a standalone demo app, you'll need to pass your Google Gemini API Key here.
const GEMINI_API_KEY = "AIzaSyA4BWo-VmuYFBu1kUZJr6Hpx5s2YRJbIOA";

export const askGemini = async (prompt) => {
  // if (!GEMINI_API_KEY) {
  //   return "Error: Please set your Gemini API key in src/config/geminiService.js.";
  // }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        })
      }
    );

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message);
    }

    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Sorry, I could not process your request. " + error.message;
  }
};