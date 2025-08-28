import express from "express";
import cors from "cors";
import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { v4 as uuidv4 } from "uuid"; // npm install uuid

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Gemini
let genAI;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

let notes = [];

// Summarize note route
app.post("/api/summarize", async (req, res) => {
  const { text } = req.body;

  if (!text) return res.status(400).json({ error: "No text provided" });

  try {
    if (genAI) {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Summarize the following text in 2–3 concise sentences. 
                       Do not copy directly. Capture only the main idea.\n\n${text}`
              }
            ]
          }
        ]
      });

      let summary = result.response.text().trim();

      
      if (summary.length > text.length * 0.6) {
        summary = text.split(".").slice(0, 2).join(".") + "...";
      }

      return res.json({ summary });
    }
  } catch (err) {
    console.error("Gemini error:", err.message);
  }

  // Mock fallback
    const mockSummary = text.split(".")[0] + "...";
    res.json({ summary: mockSummary });
  });

// CRUD routes
app.post("/api/notes", (req, res) => {
  const { text, tags = [], summary } = req.body;
  const newNote = {
    id: uuidv4(),
    text,
    summary,
    tags: tags.map(t => t.trim())
  };
  notes.push(newNote);
  res.json(newNote);
});

app.get("/api/notes", (req, res) => res.json(notes));

app.delete("/api/notes/:id", (req, res) => {
  notes = notes.filter(n => n.id !== req.params.id);
  res.json({ message: "Deleted" });
});

// Test route
app.get("/", (req, res) => res.send("Notes API server is running!"));

app.listen(5000, () => console.log("Server running on http://localhost:5000"));
