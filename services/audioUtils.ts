export type AudioBlob = {
  data: string;
  mimeType: string;
};

// Convert Base64 string to Uint8Array
export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Convert Uint8Array to Base64 string
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Float32 audio data (from Web Audio API) to Int16 PCM (for Gemini)
export function float32ToInt16PCM(float32Array: Float32Array): Int16Array {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return int16Array;
}

// Create a blob payload for Gemini Live API
export function createAudioPayload(data: Float32Array): AudioBlob {
  const int16Data = float32ToInt16PCM(data);
  const base64Data = arrayBufferToBase64(int16Data.buffer);
  return {
    data: base64Data,
    mimeType: "audio/pcm;rate=16000",
  };
}

// Decode raw PCM data from Gemini into an AudioBuffer
export async function decodeAudioData(
  base64Data: string,
  audioContext: AudioContext,
  sampleRate: number = 24000
): Promise<AudioBuffer> {
  const uint8Array = base64ToUint8Array(base64Data);
  const int16Array = new Int16Array(uint8Array.buffer);
  
  const audioBuffer = audioContext.createBuffer(1, int16Array.length, sampleRate);
  const channelData = audioBuffer.getChannelData(0);
  
  for (let i = 0; i < int16Array.length; i++) {
    // Convert Int16 to Float32
    channelData[i] = int16Array[i] / 32768.0;
  }
  
  return audioBuffer;
}
