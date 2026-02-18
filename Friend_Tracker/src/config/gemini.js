const GEMINI_API_KEY = "AIzaSyB7yIZ4syDimoA44_W0DZhep0jYSoperJQ"

export async function generateNews() {

  const prompt = `
  Generate today's important news summary in 5 points.
  Keep it short and professional.
  Include global and local highlights.
  `

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    }
  )

  const data = await res.json()

  return data.candidates[0].content.parts[0].text
}