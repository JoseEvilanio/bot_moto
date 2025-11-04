import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { MODEL_NAME, SYSTEM_INSTRUCTION } from '../constants';

let ai: GoogleGenAI | null = null;
let chat: Chat | null = null;

// Inicializa preguiçosamente a instância do GoogleGenAI para evitar que o aplicativo
// falhe ao carregar se a chave da API ainda não estiver disponível.
const getAiInstance = (): GoogleGenAI | null => {
    if (ai) {
        return ai;
    }
    if (!process.env.API_KEY) {
        console.error("API_KEY environment variable not set. Gemini AI cannot be initialized.");
        return null;
    }
    try {
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    } catch(e) {
        console.error("Failed to create GoogleGenAI instance:", e);
        return null;
    }
    return ai;
};

export function initializeChat(): boolean {
  if (chat) {
    return true;
  }
  
  const geminiAI = getAiInstance();
  if (!geminiAI) {
      return false;
  }

  chat = geminiAI.chats.create({
    model: MODEL_NAME,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
    },
  });

  return true;
}

export async function sendMessage(message: string): Promise<GenerateContentResponse> {
  if (!chat) {
    throw new Error("Chat not initialized. The API key may be missing or invalid.");
  }
  try {
    const result = await chat.sendMessage({ message });
    return result;
  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    throw new Error("Failed to get a response from the AI assistant.");
  }
}