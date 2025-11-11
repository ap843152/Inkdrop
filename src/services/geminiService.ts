
import { GoogleGenAI, Type } from "@google/genai";

// Fix: Initialize GoogleGenAI directly with the environment variable as per coding guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateArtDescription = async (imageBase64: string): Promise<{ title: string; description: string }> => {
  try {
    const imagePart = {
      inlineData: {
        mimeType: 'image/png',
        data: imageBase64,
      },
    };

    const textPart = {
      text: "請為這幅水墨風格的抽象畫作，以繁體中文，創作一個富有詩意的標題和一句話的描述。",
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
      // Fix: Use JSON mode for reliable, structured output.
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: 'The poetic title for the artwork in Traditional Chinese.',
            },
            description: {
              type: Type.STRING,
              description: 'A one-sentence poetic description for the artwork in Traditional Chinese.',
            },
          },
          required: ['title', 'description']
        },
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error generating art description:", error);
    throw new Error("Failed to communicate with the Gemini API.");
  }
};
