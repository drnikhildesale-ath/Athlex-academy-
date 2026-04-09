import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

export interface MCQ {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export async function generateQuizFromNotes(notes: string, numQuestions: number = 10, difficulty: string = "Medium"): Promise<MCQ[]> {
  const currentApiKey = process.env.GEMINI_API_KEY;
  if (!currentApiKey) {
    throw new Error("GEMINI_API_KEY is not set.");
  }

  const ai = new GoogleGenAI({ apiKey: currentApiKey });
  const model = "gemini-3-flash-preview";

  const prompt = `Generate a set of exactly ${numQuestions} multiple-choice questions (MCQs) at a ${difficulty} difficulty level based on the following study notes for the ACE-CPT certification. 
  Each question should have 4 options, a correct answer index (0-3), and a brief explanation.
  
  Notes:
  ${notes}
  
  Return the result as a JSON array of objects.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING, description: "The MCQ question text." },
              options: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "Array of 4 possible answers."
              },
              correctAnswer: { type: Type.INTEGER, description: "Index of the correct answer (0-3)." },
              explanation: { type: Type.STRING, description: "Brief explanation of why the answer is correct." }
            },
            required: ["question", "options", "correctAnswer", "explanation"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text.trim());
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}

export async function summarizeNotes(notes: string): Promise<string> {
  const currentApiKey = process.env.GEMINI_API_KEY;
  if (!currentApiKey) {
    throw new Error("GEMINI_API_KEY is not set.");
  }

  const ai = new GoogleGenAI({ apiKey: currentApiKey });
  const model = "gemini-3-flash-preview";

  const prompt = `Summarize the following study notes into 15-20 concise bullet points. 
  Focus on key concepts, definitions, and important facts for the ACE-CPT certification.
  
  Notes:
  ${notes}
  
  Return the bullet points as a plain text list.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });

  return response.text || "Failed to generate summary.";
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export async function getChatResponse(message: string, history: ChatMessage[] = []): Promise<string> {
  const currentApiKey = process.env.GEMINI_API_KEY;
  if (!currentApiKey) {
    throw new Error("GEMINI_API_KEY is not set.");
  }

  const ai = new GoogleGenAI({ apiKey: currentApiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...history,
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: "You are a helpful study assistant for ACE-CPT certification. Answer questions based on fitness, anatomy, and exercise science. Be concise and encouraging.",
      }
    });
    return response.text || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Chat Error:", error);
    throw error;
  }
}
