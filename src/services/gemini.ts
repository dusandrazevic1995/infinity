import { GoogleGenAI, Type } from "@google/genai";
import { StorySegment } from "../types";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY! });

const SYSTEM_INSTRUCTION = `You are a master storyteller for an interactive "Infinite Echoes" game. 
Your goal is to provide a compelling, atmospheric, and branching narrative based on user choices.

Rules:
1. Each response MUST be in JSON format.
2. Provide a "text" field with the story segment (Markdown supported).
3. Provide a "choices" array, each with "text" and a unique "id".
4. CHOICES MUST BE EXTREMELY SHORT (1-3 words max). Example: "Open door", "Flee", "Cast spell".
5. If the story reaches a natural conclusion, set "isEnding" to true and provide an empty choices array.
6. Keep the story segments concise but descriptive (2-4 paragraphs).
7. Ensure choices are diverse and impactful.
8. Maintain consistency with previous events in the history.
9. The genre is dark fantasy/mystery by default, but adapt to the user's initial prompt if they provide one.`;

const storySchema = {
  type: Type.OBJECT,
  properties: {
    text: { type: Type.STRING, description: "The story segment text in Markdown." },
    choices: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING, description: "The choice text." },
          id: { type: Type.STRING, description: "A unique identifier for the choice." },
          type: { 
            type: Type.STRING, 
            enum: ["aggressive", "cautious", "mystical", "neutral", "curious"],
            description: "The nature or impact of the choice."
          }
        },
        required: ["text", "id", "type"]
      }
    },
    isEnding: { type: Type.BOOLEAN, description: "Whether this is an ending segment." }
  },
  required: ["text", "choices"]
};

export async function generateEndingImage(prompt: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY! });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: `A cinematic, atmospheric illustration of the following story ending: ${prompt}. Dark fantasy style, high detail, moody lighting.`,
        },
      ],
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
}
export async function generateNextSegment(
  history: { story: string; choice: string }[], 
  maxSteps: number,
  language: string,
  gender: 'male' | 'female',
  initialPrompt?: string
): Promise<StorySegment> {
  const currentStep = history.length + 1;
  const stepsLeft = maxSteps - currentStep;
  
  const historyText = history.map(h => `Story: ${h.story}\nChoice: ${h.choice}`).join("\n\n");
  
  let prompt = initialPrompt 
    ? `Start a new story based on this theme: ${initialPrompt}. `
    : `Continue the story based on the history:\n\n${historyText}\n\nWhat happens next? `;

  prompt += `The protagonist is ${gender}. `;
  prompt += `This is step ${currentStep} of ${maxSteps}. `;
  prompt += `IMPORTANT: The entire response (story text and choices) MUST be in ${language}. `;
  
  if (stepsLeft < 0) {
    prompt += "You MUST conclude the story now. Set isEnding to true and provide an empty choices array. This is the final conclusion.";
  } else if (stepsLeft === 0) {
    prompt += "This is the final set of choices. The next segment MUST be the ending.";
  } else if (stepsLeft <= 2) {
    prompt += "The story is reaching its climax. Prepare for an ending soon.";
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: storySchema,
    },
  });

  try {
    const parsed = JSON.parse(response.text || "{}");
    return {
      text: parsed.text || "The echoes are silent...",
      choices: Array.isArray(parsed.choices) ? parsed.choices : [],
      isEnding: !!parsed.isEnding
    } as StorySegment;
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    throw new Error("The echoes are silent. Try again.");
  }
}
