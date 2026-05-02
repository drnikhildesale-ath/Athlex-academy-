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

export interface Flashcard {
  front: string;
  back: string;
}

export async function generateFlashcardsFromNotes(notes: string, numCards: number = 10): Promise<Flashcard[]> {
  const currentApiKey = process.env.GEMINI_API_KEY;
  if (!currentApiKey) {
    throw new Error("GEMINI_API_KEY is not set.");
  }

  const ai = new GoogleGenAI({ apiKey: currentApiKey });
  const model = "gemini-3-flash-preview";

  const prompt = `Generate a set of exactly ${numCards} educational flashcards based on the following study notes for the ACE-CPT certification. 
  Each flashcard should have a 'front' (the question or term) and a 'back' (the answer or definition).
  Make them highly effective for quick revision of complex sports science and fitness concepts.
  
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
              front: { type: Type.STRING, description: "The term or question on the front of the card." },
              back: { type: Type.STRING, description: "The definition or answer on the back of the card." }
            },
            required: ["front", "back"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text.trim());
  } catch (error) {
    console.error("Flashcard Generation Error:", error);
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
        systemInstruction: `You are the ultimate expert assistant for Athlex Academy, a premier institution for fitness and sports science education. 
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
        - If they seem confused, suggest they check the "Study Materials" or "Signature Quizzes" in their dashboard.`,
      }
    });
    return response.text || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Chat Error:", error);
    throw error;
  }
}
