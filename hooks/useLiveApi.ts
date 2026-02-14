import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { LIVE_SYSTEM_INSTRUCTION } from '../constants';
import { createAudioPayload, decodeAudioData } from '../services/audioUtils';

const API_KEY = process.env.API_KEY || '';
const MODEL_NAME = 'gemini-2.5-flash-native-audio-preview-12-2025';

export const useLiveApi = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false); // AI is speaking
  const [isListening, setIsListening] = useState(false); // Mic is active
  const [volume, setVolume] = useState(0); // For visualizer

  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  const nextStartTimeRef = useRef<number>(0);
  const scheduledSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  
  // Clean up function to stop audio context and streams
  const disconnect = useCallback(async () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      await audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // Stop any playing audio
    scheduledSourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    scheduledSourcesRef.current = [];

    setIsConnected(false);
    setIsListening(false);
    setIsSpeaking(false);
    setVolume(0);
  }, []);

  const connect = useCallback(async () => {
    if (!API_KEY) {
      console.error("API Key missing");
      return;
    }

    try {
      // 1. Initialize Audio Contexts
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass({ sampleRate: 16000 }); // Input usually resampled by browser, but requesting 16k preferred
      audioContextRef.current = audioContext;
      
      // Output context for 24kHz playback (Gemini default)
      // Note: We can reuse the same context if we handle resampling, but creating a separate one or using the same one 
      // with decoding logic is fine. decodeAudioData util handles the buffer creation.
      // We will use the same audioContext for simplicity, letting the browser handle playback rate differences.
      
      // 2. Initialize Gemini Client
      const ai = new GoogleGenAI({ apiKey: API_KEY });
      
      // 3. Connect to Live API
      const sessionPromise = ai.live.connect({
        model: MODEL_NAME,
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: LIVE_SYSTEM_INSTRUCTION,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
        },
        callbacks: {
          onopen: () => {
            console.log("Live Session Connected");
            setIsConnected(true);
            setIsListening(true);
            
            // Start Audio Input Stream
            navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
              streamRef.current = stream;
              const source = audioContext.createMediaStreamSource(stream);
              sourceRef.current = source;
              
              // Processor to capture audio data
              // bufferSize 4096 is a balance between latency and performance
              const processor = audioContext.createScriptProcessor(4096, 1, 1);
              processorRef.current = processor;
              
              processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                
                // Calculate volume for visualizer
                let sum = 0;
                for (let i = 0; i < inputData.length; i++) {
                    sum += inputData[i] * inputData[i];
                }
                const rms = Math.sqrt(sum / inputData.length);
                setVolume(rms * 100); // Scale up for easier UI usage

                // Send to Gemini
                const payload = createAudioPayload(inputData);
                sessionPromise.then(session => {
                  session.sendRealtimeInput({ media: payload });
                });
              };
              
              source.connect(processor);
              processor.connect(audioContext.destination);
            });
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Audio Output
            const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            
            if (audioData) {
              setIsSpeaking(true);
              const playbackContext = audioContextRef.current;
              if (!playbackContext) return;

              // Ensure play time is smooth
              const currentTime = playbackContext.currentTime;
              if (nextStartTimeRef.current < currentTime) {
                nextStartTimeRef.current = currentTime;
              }

              const audioBuffer = await decodeAudioData(audioData, playbackContext, 24000);
              const source = playbackContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(playbackContext.destination);
              
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              
              scheduledSourcesRef.current.push(source);
              
              source.onended = () => {
                 // Simple check: if this was the last scheduled source, stop "speaking" state
                 // This is a rough approximation. 
                 if (scheduledSourcesRef.current[scheduledSourcesRef.current.length - 1] === source) {
                    setIsSpeaking(false);
                 }
                 // Remove from list
                 const index = scheduledSourcesRef.current.indexOf(source);
                 if (index > -1) scheduledSourcesRef.current.splice(index, 1);
              };
            }
            
            if (message.serverContent?.interrupted) {
               // Stop playback if model is interrupted
               scheduledSourcesRef.current.forEach(s => s.stop());
               scheduledSourcesRef.current = [];
               nextStartTimeRef.current = 0;
               setIsSpeaking(false);
            }
          },
          onclose: () => {
            console.log("Live Session Closed");
            disconnect();
          },
          onerror: (err) => {
            console.error("Live Session Error", err);
            disconnect();
          }
        }
      });

    } catch (error) {
      console.error("Connection Failed", error);
      disconnect();
    }
  }, [disconnect]);

  return {
    connect,
    disconnect,
    isConnected,
    isSpeaking,
    isListening,
    volume
  };
};
