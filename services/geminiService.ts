import { GoogleGenAI, Modality } from "@google/genai";
import { getSystemInstruction } from "../constants";
import { NegotiationAnalysis } from "../types";

const apiKey = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

export const analyzeNegotiationText = async (text: string, isRowdyMode: boolean = false): Promise<NegotiationAnalysis> => {
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
          parts: [{ text: text }],
        },
      ],
      config: {
        systemInstruction: getSystemInstruction(isRowdyMode),
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

export const transcribeAudio = async (audioBase64: string, mimeType: string): Promise<string> => {
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  try {
    // Using gemini-3-flash-preview for fast multimodal transcription
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

export const generateSpeech = async (text: string): Promise<string> => {
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

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

    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioData) {
        throw new Error("No audio data generated");
    }
    return audioData;
  } catch (error) {
    console.error("TTS Error:", error);
    throw new Error("Failed to generate speech.");
  }
};
