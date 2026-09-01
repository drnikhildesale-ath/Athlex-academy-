import { GoogleGenAI, Type } from "@google/genai";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  let aiInstance: GoogleGenAI | null = null;
  function getAi(): GoogleGenAI {
    if (!aiInstance) {
      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not set.");
      }
      aiInstance = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return aiInstance;
  }

  const DEFAULT_MODEL = "gemini-3.7-flash";

  function parseGeminiResponse<T>(text: string): T {
    if (!text) return [] as unknown as T;
    const cleaned = text.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
    try {
      return JSON.parse(cleaned);
    } catch (error) {
      console.error("Gemini JSON Parse Error:", error, "Raw text:", text);
      throw new Error("The AI response was not in the expected format. Please try again.");
    }
  }

  // API Routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Quiz generation endpoint
  app.post("/api/gemini/quiz", async (req, res) => {
    try {
      const { notes, numQuestions = 10, difficulty = "Medium" } = req.body;
      if (!notes) {
        return res.status(400).json({ error: "Notes are required" });
      }
      const prompt = `Generate a set of exactly ${numQuestions} multiple-choice questions (MCQs) at a ${difficulty} difficulty level based on the following study notes for the ACE-CPT certification. 
Each question should have 4 options, a correct answer index (0-3), and a brief explanation.

Notes:
${notes}`;

      const ai = getAi();
      const response = await ai.models.generateContent({
        model: DEFAULT_MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Array of 4 options",
                },
                correctAnswer: {
                  type: Type.INTEGER,
                  description: "Index 0 to 3 of the correct option",
                },
                explanation: { type: Type.STRING },
              },
              required: ["question", "options", "correctAnswer", "explanation"],
            },
          },
        },
      });

      const parsed = parseGeminiResponse(response.text || "[]");
      res.json({ data: parsed });
    } catch (error: any) {
      console.error("Gemini Quiz Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate quiz" });
    }
  });

  // Flashcards from notes
  app.post("/api/gemini/flashcards-notes", async (req, res) => {
    try {
      const { notes, numCards = 10 } = req.body;
      if (!notes) {
        return res.status(400).json({ error: "Notes are required" });
      }
      const prompt = `Generate a set of exactly ${numCards} educational flashcards based on the following study notes for the ACE-CPT certification. 
Each flashcard should have a 'front' (the question or term) and a 'back' (the answer or definition).
Make them highly effective for quick revision of complex sports science and fitness concepts.

Notes:
${notes}`;

      const ai = getAi();
      const response = await ai.models.generateContent({
        model: DEFAULT_MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                front: { type: Type.STRING },
                back: { type: Type.STRING },
              },
              required: ["front", "back"],
            },
          },
        },
      });

      const parsed = parseGeminiResponse(response.text || "[]");
      res.json({ data: parsed });
    } catch (error: any) {
      console.error("Gemini Flashcard Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate flashcards" });
    }
  });

  // Flashcards from topic
  app.post("/api/gemini/flashcards-topic", async (req, res) => {
    try {
      const { topic, difficulty = "Intermediate", numCards = 10 } = req.body;
      if (!topic) {
        return res.status(400).json({ error: "Topic is required" });
      }
      const prompt = `Generate a set of exactly ${numCards} educational flashcards on the topic "${topic}" at a ${difficulty} level for fitness and sports science students (specifically aligned with ACE-CPT standards). 
Each flashcard should have a 'front' (the question or term) and a 'back' (the answer or definition). Ensure the content is scientifically accurate and professional.`;

      const ai = getAi();
      const response = await ai.models.generateContent({
        model: DEFAULT_MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                front: { type: Type.STRING },
                back: { type: Type.STRING },
              },
              required: ["front", "back"],
            },
          },
        },
      });

      const parsed = parseGeminiResponse(response.text || "[]");
      res.json({ data: parsed });
    } catch (error: any) {
      console.error("Gemini Flashcard Topic Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate flashcards from topic" });
    }
  });

  // Summarize notes
  app.post("/api/gemini/summarize", async (req, res) => {
    try {
      const { notes } = req.body;
      if (!notes) {
        return res.status(400).json({ error: "Notes are required" });
      }
      const prompt = `Summarize the following study notes into 15-20 concise bullet points. 
Focus on key concepts, definitions, and important facts for the ACE-CPT certification.

Notes:
${notes}

Return the bullet points as a plain text list.`;

      const ai = getAi();
      const response = await ai.models.generateContent({
        model: DEFAULT_MODEL,
        contents: prompt,
      });

      res.json({ data: response.text || "Failed to generate summary." });
    } catch (error: any) {
      console.error("Gemini Summarize Error:", error);
      res.status(500).json({ error: error.message || "Failed to summarize notes" });
    }
  });

  // Chatbot endpoint
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { message, history = [] } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }
      const systemInstruction = `You are the ultimate expert assistant for Athlex Academy, a premier institution for fitness and sports science education. 
Your goal is to be helpful, professional, encouraging, and deeply knowledgeable about our academy and the fitness industry (specifically ACE-CPT).

Athlex Academy Identity:
- Founders: Dr. Akshay (MPT Sports Physiotherapy, CSCS) & Dr. Nikhil Desale (MPT Sports Physiotherapy, ACE-CPT). They bridge the gap between clinical science and practical fitness.
- Core Philosophy: Evidence-based practice, clinical reasoning, and performance-driven results. We don't just teach 'how'; we teach 'why'.
- Key Team: Anand Soni (Strength & Conditioning Coach, Olympic Weightlifting Specialist) and Sameer Patil (Fitness & Lifestyle Transformation Expert).

What We Offer:
- Primary Course: ACE-CPT (American Council on Exercise - Certified Personal Trainer).
- Specialist Courses: Kettlebell, Olympic Weightlifting, Suspension Training, Functional Training, Prehab & Rehab.
- Career Tracks: Army Foundation, Police Bharti Prep, Sports-Specific Training (Cricket, Football, Basketball).
- Advanced Topics: Blood Reports Understanding, Sports Nutrition, Chronic Medical Conditions Management.

Your Conversational Style:
- Be authoritative yet warm. Use terms like "Science-backed," "Clinical reasoning," and "Evidence-based" when appropriate.
- If a student asks a fitness question, answer it using ACE-CPT guidelines or sports science principles.
- If they ask about academy details (pricing, upcoming batches), encourage them to use the 'Course Inquiry' form on the Landing Page.
- Proactively encourage them to study hard for their exams. Use motivational phrases like "The science of human performance starts with your dedication."

Context: 
- You are currently inside the Athlex Academy platform.
- If they seem confused, suggest they check the "Study Materials" or "Signature Quizzes" in their dashboard.`;

      const ai = getAi();
      const contents: any[] = [];
      if (Array.isArray(history)) {
        for (const h of history) {
          if (h.role && h.parts && h.parts.length > 0) {
            contents.push({
              role: h.role === 'model' ? 'model' : 'user',
              parts: h.parts.map((p: any) => ({ text: p.text || '' })),
            });
          }
        }
      }
      contents.push({
        role: 'user',
        parts: [{ text: message }],
      });

      const response = await ai.models.generateContent({
        model: DEFAULT_MODEL,
        contents,
        config: {
          systemInstruction,
        },
      });

      res.json({ data: response.text || "I'm sorry, I couldn't generate a response." });
    } catch (error: any) {
      console.error("Gemini Chat Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate chat response" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: "0.0.0.0", port: PORT },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
