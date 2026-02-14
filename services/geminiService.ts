import { GoogleGenAI, Modality } from "@google/genai";
import { SYSTEM_INSTRUCTION, VISION_SYSTEM_INSTRUCTION, GAMIFICATION_SYSTEM_INSTRUCTION } from "../constants";
import { NegotiationAnalysis, VisionAnalysis, GamificationResult, LocalMode } from "../types";

const apiKey = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

export const analyzeNegotiationText = async (text: string, localMode: LocalMode = 'polite'): Promise<NegotiationAnalysis> => {
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  try {
    const model = "gemini-3-flash-preview";

    const augmentedText = `[local_mode: ${localMode}]\n\nUser's negotiation input:\n${text}`;

    const response = await ai.models.generateContent({
      model: model,
      contents: [
        {
          role: "user",
          parts: [{ text: augmentedText }],
        },
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.4,
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response from AI");
    }

    return JSON.parse(responseText) as NegotiationAnalysis;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const analyzeImage = async (imageBase64: string, mimeType: string): Promise<VisionAnalysis> => {
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  try {
    const model = "gemini-3-flash-preview";

    const response = await ai.models.generateContent({
      model: model,
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: imageBase64,
              },
            },
            {
              text: "Analyze this phone screen image for signs of a fake or manipulated ride-hailing app. Check for fake taxi apps, manipulated prices, double status bars, font mismatches, and any other forensic indicators."
            },
          ],
        },
      ],
      config: {
        systemInstruction: VISION_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response from AI");
    }

    return JSON.parse(responseText) as VisionAnalysis;
  } catch (error) {
    console.error("Vision Analysis Error:", error);
    throw error;
  }
};

export const generateGamification = async (askPrice: number, dealPrice: number): Promise<GamificationResult> => {
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  try {
    const model = "gemini-3-flash-preview";

    const response = await ai.models.generateContent({
      model: model,
      contents: [
        {
          role: "user",
          parts: [{ text: `Initial ask price: ₹${askPrice}. Final deal price: ₹${dealPrice}. Generate the gamification result.` }],
        },
      ],
      config: {
        systemInstruction: GAMIFICATION_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response from AI");
    }

    return JSON.parse(responseText) as GamificationResult;
  } catch (error) {
    console.error("Gamification Error:", error);
    throw error;
  }
};

export const transcribeAudio = async (audioBase64: string, mimeType: string): Promise<string> => {
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  try {
    const model = "gemini-3-flash-preview";

    const response = await ai.models.generateContent({
      model: model,
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: audioBase64
              }
            },
            {
              text: "Transcribe this audio exactly as spoken. It may contain English, Hindi, Kannada, Hinglish, or Kanglish. Do not translate it, just transcribe the words used. Do not add any markdown or explanation, just the raw text."
            }
          ],
        },
      ],
    });

    return response.text || "";
  } catch (error) {
    console.error("Transcription Error:", error);
    throw new Error("Failed to transcribe audio.");
  }
};

export const generateSpeech = async (text: string): Promise<string | null> => {
  if (!apiKey) return null;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch {
    // TTS is best-effort — return null so callers degrade gracefully
    return null;
  }
};
