// NOTE: In a real production app, never hardcode API keys on the frontend.
// Since this is a standalone demo app, you'll need to pass your Google Gemini API Key here.

const GEMINI = "AIzaSyDo6X0ikv";
const API = "UbsQCcO6oeT6l";
const KEY = "EfbUWqUJh_M4";



const GEMINI_API_KEY = GEMINI + API + KEY;

export const askGemini = async (prompt) => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    console.log("Gemini RAW:", data);

    if (!response.ok) {
      throw new Error(data?.error?.message || "API Error");
    }

    let text = "";
    if (data?.candidates?.[0]?.content?.parts) {
      text = data.candidates[0].content.parts.map(p => p.text).join("");
    }

    console.log("Gemini EXTRACTED TEXT:", text);

    if (!text) {
      throw new Error("Empty response from AI");
    }

    return text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "⚠️ AI failed: " + error.message;
  }
};