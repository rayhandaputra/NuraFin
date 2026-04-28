import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export interface ExtractedReceipt {
  merchant: string;
  date: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
}

export const extractReceiptData = async (base64Image: string): Promise<ExtractedReceipt> => {
  const prompt = `
    Extract the following data from this receipt image and return ONLY a valid JSON object:
    {
      "merchant": string,
      "date": string,
      "items": [{"name": string, "qty": number, "price": number}],
      "total": number
    }
    If quantity is not visible, estimate as 1.
  `;

  // Remove the data area prefix if present
  const base64Data = base64Image.split(',')[1] || base64Image;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      { text: prompt },
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg",
        },
      },
    ],
  });

  const text = response.text || "";
  
  // Basic JSON extraction from text in case model adds markdown blocks
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Could not extract valid JSON from receipt.");
  
  return JSON.parse(jsonMatch[0]);
};
