
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Scene, ScriptAnalysis, AspectRatio } from "../types";

export class GeminiService {
  private static getAI() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  static async analyzeScript(scriptText: string, sceneCount: string | number, globalStyle: string): Promise<ScriptAnalysis> {
    const ai = this.getAI();
    const countInstruction = sceneCount === 'auto' ? 'break it down into a logical sequence of key visual scenes' : `break it down into EXACTLY ${sceneCount} key visual scenes`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: `Analyze the following script and ${countInstruction} for a storyboard. 
      For each scene, provide a descriptive title, a summary of what's happening, and a detailed visual prompt for an image generation model.
      ${globalStyle ? `Incorporate this overall style/theme into the visual prompts: ${globalStyle}` : ''}
      
      Script:
      ${scriptText}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  visualPrompt: { type: Type.STRING }
                },
                required: ["id", "title", "description", "visualPrompt"]
              }
            }
          },
          required: ["scenes"]
        }
      }
    });

    const text = response.text || "";
    return JSON.parse(text) as ScriptAnalysis;
  }

  static async generateStoryboardImage(prompt: string, aspectRatio: AspectRatio, theme: string, globalInstruction: string): Promise<string> {
    const ai = this.getAI();
    const finalPrompt = `${theme} style. ${globalInstruction ? globalInstruction + '. ' : ''}${prompt}`;
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: finalPrompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as any
          }
        }
      });

      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData) {
          const mimeType = part.inlineData.mimeType || 'image/png';
          return `data:${mimeType};base64,${part.inlineData.data}`;
        }
      }
      throw new Error("No image data returned from model");
    } catch (error: any) {
      if (error.message?.includes("Requested entity was not found")) {
        throw new Error("KEY_RESET_REQUIRED");
      }
      throw error;
    }
  }

  static async chat(message: string, history: { role: 'user' | 'model', text: string }[]): Promise<string> {
    const ai = this.getAI();
    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        systemInstruction: "You are a professional storyboard artist and creative consultant. Assist the user with their scriptwriting and visual storytelling questions."
      }
    });

    // Simple implementation of sending one message at a time to keep it clean
    const response = await chat.sendMessage({ message });
    return response.text || "I'm sorry, I couldn't process that.";
  }
}
