export interface MCQ {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export async function generateQuizFromNotes(notes: string, numQuestions: number = 10, difficulty: string = "Medium"): Promise<MCQ[]> {
  const response = await fetch('/api/gemini/quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes, numQuestions, difficulty }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to generate quiz');
  }

  const result = await response.json();
  return result.data as MCQ[];
}

export async function generateFlashcardsFromNotes(notes: string, numCards: number = 10): Promise<Flashcard[]> {
  const response = await fetch('/api/gemini/flashcards-notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes, numCards }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to generate flashcards');
  }

  const result = await response.json();
  return result.data as Flashcard[];
}

export async function generateFlashcardsFromTopic(topic: string, difficulty: string = "Intermediate", numCards: number = 10): Promise<Flashcard[]> {
  const response = await fetch('/api/gemini/flashcards-topic', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, difficulty, numCards }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to generate flashcards from topic');
  }

  const result = await response.json();
  return result.data as Flashcard[];
}

export async function summarizeNotes(notes: string): Promise<string> {
  const response = await fetch('/api/gemini/summarize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to summarize notes');
  }

  const result = await response.json();
  return result.data as string;
}

export async function getChatResponse(message: string, history: ChatMessage[] = []): Promise<string> {
  const response = await fetch('/api/gemini/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to generate chat response');
  }

  const result = await response.json();
  return result.data as string;
}

