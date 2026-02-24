import axios from "axios";

const GEMINI_API_KEY = "AIzaSyA4BWo-VmuYFBu1kUZJr6Hpx5s2YRJbIOA";

export const askGemini = async (message) => {
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        // Simple request: just give the message as content
        prompt: {
          text: message
        },
        // Optional parameters for Gemini
        maxOutputTokens: 50
      }
    );

    // Gemini returns candidates
    const candidates = response.data?.candidates;
    if (candidates && candidates.length > 0) {
      // Return the first candidate's text
      return candidates[0]?.content?.[0]?.text || message;
    }

    return message; // fallback: return same message
  } catch (e) {
    console.error("Gemini API error:", e.message);
    return "AI error occurred.";
  }
};