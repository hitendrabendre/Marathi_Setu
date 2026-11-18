
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ProcessingResult } from "../types";

const API_KEY = process.env.API_KEY || "";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: API_KEY });
  }

  /**
   * Translates and explains the input text in Marathi.
   */
  async translateAndExplain(text: string): Promise<ProcessingResult> {
    const response = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Translate the following text into Marathi and provide a detailed explanation of it in Marathi. Your response should be a JSON object with two fields: 'marathiTranslation' (the Marathi translation) and 'marathiExplanation' (the detailed Marathi explanation).

Text: "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            marathiTranslation: {
              type: Type.STRING,
              description: "The direct Marathi translation of the input text.",
            },
            marathiExplanation: {
              type: Type.STRING,
              description: "A detailed explanation of the input text in Marathi.",
            },
          },
          required: ["marathiTranslation", "marathiExplanation"],
        },
      },
    });

    try {
      const result = JSON.parse(response.text || "{}");
      return {
        originalText: text,
        marathiTranslation: result.marathiTranslation || "",
        marathiExplanation: result.marathiExplanation || "",
      };
    } catch (e) {
      console.error("Failed to parse Gemini response", e);
      throw new Error("Failed to process translation.");
    }
  }

  /**
   * Converts Marathi text to high-quality speech.
   */
  async textToSpeech(text: string): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Please speak the following Marathi text clearly: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("No audio data received from Gemini TTS.");
    }

    return base64Audio;
  }
}
