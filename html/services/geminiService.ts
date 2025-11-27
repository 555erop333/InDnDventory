import { GoogleGenAI, Type } from "@google/genai";
import { ItemCategory, Rarity } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export interface GeneratedItemData {
  name: string;
  description: string;
  weight: number;
  costLabel: string;
  category: string;
  rarity: string;
  isMagic: boolean;
  attunement: boolean;
}

export const generateFantasyItem = async (prompt: string): Promise<GeneratedItemData> => {
  try {
    const modelId = 'gemini-2.5-flash';
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Сгенерируй предмет для D&D 5e на основе концепта: "${prompt}". Язык ответа: Русский. Верни строгий JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            weight: { type: Type.NUMBER },
            costLabel: { type: Type.STRING },
            category: { type: Type.STRING, enum: Object.values(ItemCategory) },
            rarity: { type: Type.STRING, enum: Object.values(Rarity) },
            isMagic: { type: Type.BOOLEAN },
            attunement: { type: Type.BOOLEAN }
          },
          required: ["name", "description", "weight", "costLabel", "category", "rarity", "isMagic", "attunement"]
        }
      }
    });
    if (response.text) return JSON.parse(response.text) as GeneratedItemData;
    throw new Error("Empty response");
  } catch (error) { console.error(error); throw error; }
};

// Заглушка, чтобы старый код не ругался, если вдруг он остался
export const generateItemImage = async (description: string): Promise<string | null> => {
  return null; 
};
