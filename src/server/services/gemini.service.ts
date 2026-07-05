import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env';

let aiClient: GoogleGenAI | null = null;

export function getGemini(): GoogleGenAI | null {
  if (aiClient) return aiClient;

  if (!env.geminiApiKey) {
    console.warn('GEMINI_API_KEY environment variable is missing.');
    return null;
  }

  aiClient = new GoogleGenAI({
    apiKey: env.geminiApiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  return aiClient;
}
