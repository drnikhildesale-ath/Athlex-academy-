import { GoogleGenAI } from "@google/genai";

const DEFAULT_MODEL = "gemini-2.0-flash";

let aiInstance: GoogleGenAI | null = null;

const getAiClient = () => {
  if (!aiInstance) {
    const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY || (process as any).env?.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured. Please set it in your environment/settings.");
    }
    aiInstance = new GoogleGenAI(apiKey);
  }
  return aiInstance;
};

function parseGeminiResponse<T>(text: string): T {
  if (!text) return [] as unknown as T;
  // Strip markdown code blocks if present
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Gemini JSON Parse Error:", error, "Raw text:", text);
    throw new Error("The AI response was not in the expected format. Please try again.");
  }
}

export interface MCQ {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export async function generateQuizFromNotes(notes: string, numQuestions: number = 10, difficulty: string = "Medium"): Promise<MCQ[]> {
  const prompt = `Generate a set of exactly ${numQuestions} multiple-choice questions (MCQs) at a ${difficulty} difficulty level based on the following study notes for the ACE-CPT certification. 
  Each question should have 4 options, a correct answer index (0-3), and a brief explanation.
  
  Notes:
  ${notes}
  
  Format Requirement:
  Respond with ONLY a valid JSON array of objects, no markdown, no code blocks.
  Each object must have: "question", "options" (array of 4), "correctAnswer" (0-3), and "explanation".`;

  try {
    const ai = getAiClient();
    const response = await ai.getGenerativeModel({ model: DEFAULT_MODEL }).generateContent({
      contents: [
        { role: 'user', parts: [{ text: prompt }] }
      ]
    });
    const text = response.response.text() || "";
    return parseGeminiResponse<MCQ[]>(text);
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
  const prompt = `Generate a set of exactly ${numCards} educational flashcards based on the following study notes for the ACE-CPT certification. 
  Each flashcard should have a 'front' (the question or term) and a 'back' (the answer or definition).
  Make them highly effective for quick revision of complex sports science and fitness concepts.
  
  Notes:
  ${notes}
  
  Format Requirement:
  Respond with ONLY a valid JSON array of objects, no markdown, no code blocks.
  Example: [{"front": "Question", "back": "Answer"}]`;

  try {
    const ai = getAiClient();
    const response = await ai.getGenerativeModel({ model: DEFAULT_MODEL }).generateContent({
      contents: [
        { role: 'user', parts: [{ text: prompt }] }
      ]
    });
    const text = response.response.text() || "";
    return parseGeminiResponse<Flashcard[]>(text);
  } catch (error) {
    console.error("Flashcard Generation Error:", error);
    throw error;
  }
}

export async function generateFlashcardsFromTopic(topic: string, difficulty: string = "Intermediate", numCards: number = 10): Promise<Flashcard[]> {
  const prompt = `Generate a set of exactly ${numCards} educational flashcards on the topic "${topic}" at a ${difficulty} level for fitness and sports science students (specifically aligned with ACE-CPT standards). 
  Each flashcard should have a 'front' (the question or term) and a 'back' (the answer or definition).
  
  Format Requirement: 
  Respond with ONLY a valid JSON array of objects, no markdown, no code blocks. 
  Each object must have exactly two keys: "front" and "back". 
  Example: [{"front": "Question text", "back": "Answer text"}]
  Ensure the content is scientifically accurate and professional.`;

  try {
    const ai = getAiClient();
    const response = await ai.getGenerativeModel({ model: DEFAULT_MODEL }).generateContent({
      contents: [
        { role: 'user', parts: [{ text: prompt }] }
      ]
    });
    const text = response.response.text() || "";
    return parseGeminiResponse<Flashcard[]>(text);
  } catch (error) {
    console.error("Flashcard Topic Generation Error:", error);
    throw error;
  }
}

export async function summarizeNotes(notes: string): Promise<string> {
  const prompt = `Summarize the following study notes into 15-20 concise bullet points. 
  Focus on key concepts, definitions, and important facts for the ACE-CPT certification.
  
  Notes:
  ${notes}
  
  Return the bullet points as a plain text list.`;

  const ai = getAiClient();
  const response = await ai.getGenerativeModel({ model: DEFAULT_MODEL }).generateContent({
    contents: [
      { role: 'user', parts: [{ text: prompt }] }
    ]
  });
  return response.response.text() || "Failed to generate summary.";
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export async function getChatResponse(message: string, history: ChatMessage[] = []): Promise<string> {
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

  try {
    const ai = getAiClient();
    const response = await ai.getGenerativeModel({ 
      model: DEFAULT_MODEL,
      systemInstruction 
    }).generateContent({
      contents: history.length > 0 ? [
        ...history,
        { role: 'user', parts: [{ text: message }] }
      ] : [{ role: 'user', parts: [{ text: message }] }]
    });
    return response.response.text() || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Chat Error:", error);
    throw error;
  }
}
