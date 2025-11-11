
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a representational ink-wash style image based on a user prompt.
 * @param userPrompt The subject of the artwork (e.g., "dragon", "phoenix").
 * @returns A base64 encoded string of the generated PNG image.
 */
export const generateInkImage = async (userPrompt: string): Promise<string> => {
  try {
    const fullPrompt = `A photorealistic, high-contrast, black ink painting of a ${userPrompt}, formed by ink swirling and splashing in water. The image should be on a clean, minimalist, off-white background (#F3F2EE). The style should be elegant, dynamic, and highly detailed, capturing the essence of traditional ink wash art with a modern, hyperrealistic twist.`;

    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: fullPrompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/png',
        aspectRatio: '1:1',
      },
    });

    if (!response.generatedImages || response.generatedImages.length === 0) {
      throw new Error("Image generation failed, no images returned.");
    }
    // The API returns a base64 string directly.
    return response.generatedImages[0].image.imageBytes;
  } catch (error) {
    console.error("Error generating ink image:", error);
    throw new Error("Failed to generate image with the Gemini API.");
  }
};


/**
 * Generates a poetic title and description for a given artwork image.
 * @param imageBase64 The base64 encoded image data.
 * @param userPrompt The original user prompt, for context.
 * @returns An object with a title and description.
 */
export const generateArtDescription = async (imageBase64: string, userPrompt?: string): Promise<{ title: string; description: string }> => {
  try {
    const imagePart = {
      inlineData: {
        mimeType: 'image/png',
        data: imageBase64,
      },
    };

    const basePrompt = "這是一幅由水墨在水中飛濺、凝聚而成的具象藝術畫。請為此景，以繁體中文，創作一個富有詩意、空靈的標題和一句話的描述。";
    const promptWithUserInput = `這是一幅由水墨在水中飛濺、凝聚而成的具象藝術畫，描繪了「${userPrompt}」的形態。請為此景，以繁體中文，創作一個富有詩意、空靈的標題和一句話的描述。`;
    const promptText = userPrompt ? promptWithUserInput : basePrompt;

    const textPart = {
      text: promptText,
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: 'The poetic and ethereal title for the artwork in Traditional Chinese.',
            },
            description: {
              type: Type.STRING,
              description: 'A one-sentence poetic and ethereal description for the artwork in Traditional Chinese.',
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
