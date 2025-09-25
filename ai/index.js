import express from "express";
import fetch from "node-fetch";
import cors from "cors";


const app = express();
app.use(express.json());
app.use(cors());



import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "../client")));

// ✅ Extract city using Ollama
async function extractCity(prompt) {
  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llava:13b",
      prompt: `Extract only the city name from this sentence: "${prompt}".
               If no city is found, return "unknown".
               Respond ONLY with the city name.`,
    }),
  });

  const data = await response.text();
  const lines = data.trim().split("\n");

  let city = "";
  for (const line of lines) {
    try {
      const json = JSON.parse(line);
      if (json.response) city += json.response;
    } catch {}
  }

  return city.trim();
}

// ✅ Get latitude/longitude using Open-Meteo Geocoding API
async function getCoordinates(city) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.results && data.results.length > 0) {
    return {
      lat: data.results[0].latitude,
      lon: data.results[0].longitude,
      resolvedName: data.results[0].name
    };
  }

  return null;
}


async function finalAnswer(prompt, weatherData, city) {
  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llava:13b",
      prompt: `
        User asked: "${prompt}".
        City: ${city}.
        Weather data: ${JSON.stringify(weatherData)}.

        Write a short, clear, friendly weather update for the user.
         IMPORTANT: Respond in the same language as the user's question.
      `,
    }),
  });

  const data = await response.text();
  const lines = data.trim().split("\n");

  let answer = "";
  for (const line of lines) {
    try {
      const json = JSON.parse(line);
      if (json.response) answer += json.response;
    } catch {}
  }

  return answer.trim();
}

// ✅ API endpoint
app.post("/ask", async (req, res) => {
  try {
    const { prompt } = req.body;

    // 1. Extract city
    const city = await extractCity(prompt);

    if (!city || city.toLowerCase() === "unknown") {
      return res.json({ city: "", answer: "Sorry, I couldn’t detect a city." });
    }

    // 2. Get coordinates dynamically
    const coords = await getCoordinates(city);
    if (!coords) {
      return res.json({ city, answer: "I couldn’t find that city in my database." });
    
    
    }

    // 3. Fetch weather
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current_weather=true`
    );
    const weatherData = await weatherRes.json();

    // 4. Generate final answer
    const answer = await finalAnswer(prompt, weatherData, coords.resolvedName);

    res.json({ city: coords.resolvedName, answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// ✅ Start server
app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
