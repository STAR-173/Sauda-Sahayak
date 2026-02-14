import React, { useState, useRef, useEffect } from 'react';
import { Mic, Send, RefreshCw, AlertCircle, FileText, Square, Loader2, Zap, Volume2, VolumeX } from 'lucide-react';
import { analyzeNegotiationText, transcribeAudio, generateSpeech } from './services/geminiService';
import { decodeAudioData } from './services/audioUtils';
import AnalysisDashboard from './components/AnalysisDashboard';
import LiveInterface from './components/LiveInterface';
import { useLiveApi } from './hooks/useLiveApi';
import { NegotiationAnalysis } from './types';
import { DEMO_SCENARIO } from './constants';

const App: React.FC = () => {
  // Mode State: 'text' or 'live'
  const [mode, setMode] = useState<'text' | 'live'>('text');

  // Text Analysis State
  const [inputText, setInputText] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<NegotiationAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Audio Recording & TTS State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [autoSpeak, setAutoSpeak] = useState<boolean>(true); // Auto-speak result enabled by default
  const [isPlayingResponse, setIsPlayingResponse] = useState<boolean>(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const playbackContextRef = useRef<AudioContext | null>(null);

  // Live API Hook
  const { connect, disconnect, isConnected, isSpeaking, isListening, volume } = useLiveApi();

  // --- Helpers ---
  const playTextResponse = async (analysis: NegotiationAnalysis) => {
    if (!autoSpeak) return;

    try {
      setIsPlayingResponse(true);
      // Construct the script to speak
      // We mix English structure with the potentially localized response script
      const scriptToSpeak = `Risk Level: ${analysis.risk_level}. Detected Tactic: ${analysis.detected_tactic}. Suggested Response: ${analysis.short_response_script}`;
      
      const audioBase64 = await generateSpeech(scriptToSpeak);
      
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      playbackContextRef.current = ctx;
      
      const audioBuffer = await decodeAudioData(audioBase64, ctx, 24000);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start();
      
      source.onended = () => {
        setIsPlayingResponse(false);
      };
    } catch (err) {
      console.error("Failed to play audio response", err);
      setIsPlayingResponse(false);
    }
  };

  const stopPlayback = () => {
    if (playbackContextRef.current) {
        playbackContextRef.current.close();
        playbackContextRef.current = null;
    }
    setIsPlayingResponse(false);
  };

  // --- Handlers for Text Mode ---
  const handleAnalyze = async (textOverride?: string) => {
    const textToAnalyze = textOverride || inputText;
    if (!textToAnalyze.trim()) return;

    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    stopPlayback(); // Stop any previous audio

    try {
      const data = await analyzeNegotiationText(textToAnalyze);
      setResult(data);
      
      // Auto-Speak Logic
      if (autoSpeak) {
        await playTextResponse(data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to analyze negotiation. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDemo = () => {
    setInputText(DEMO_SCENARIO);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
        handleAnalyze();
    }
  };

  // --- Handlers for Transcription Mode ---
  const startRecording = async () => {
    setError(null);
    stopPlayback();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        // Clean up tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Handle Processing
        await handleTranscription(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied:", err);
      setError("Microphone access denied. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleTranscription = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        try {
          const transcript = await transcribeAudio(base64Data, 'audio/webm');
          if (transcript) {
            setInputText((prev) => {
                const newText = prev ? `${prev} ${transcript}` : transcript;
                // If autoSpeak is on, we assume the user wants an immediate analysis flow 
                // ("input will audio then without clicking button")
                if (autoSpeak) {
                   handleAnalyze(newText);
                }
                return newText;
            });
          }
        } catch (err: any) {
          setError("Failed to transcribe audio. Please try again.");
        } finally {
            setIsTranscribing(false);
        }
      };
    } catch (err) {
      setError("Error processing audio file.");
      setIsTranscribing(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  // --- Handlers for Mode Switching ---
  const toggleLiveMode = () => {
    stopPlayback();
    if (mode === 'text') {
      setMode('live');
      connect();
    } else {
      disconnect();
      setMode('text');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 selection:bg-blue-500 selection:text-white">
      {/* Header */}
      <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
              <span className="text-xl font-bold text-white">S</span>
            </div>
            <div>
              <h1 className="font-bold text-white text-lg leading-none">Sauda-Sahayak</h1>
              <p className="text-xs text-slate-500 font-medium tracking-wide">NEGOTIATION INTELLIGENCE</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             {/* Mode Toggle Button */}
            <button 
                onClick={toggleLiveMode}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                    mode === 'live' 
                    ? 'bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse' 
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                }`}
            >
                {mode === 'live' ? <Zap size={14} className="fill-current" /> : <Mic size={14} />}
                {mode === 'live' ? 'Live Session Active' : 'Switch to Live Mode'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Intro / Context - Only show if not Live and no result */}
        {mode === 'text' && !result && !isAnalyzing && (
            <div className="mb-10 text-center max-w-2xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                    Regain your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">leverage</span>.
                </h2>
                <p className="text-slate-400 mb-8 text-lg">
                    Real-time detection of manipulation tactics, price anchoring, and artificial scarcity in Indian market negotiations.
                </p>
            </div>
        )}

        {/* Live Mode Interface */}
        {mode === 'live' ? (
            <LiveInterface 
                isConnected={isConnected}
                isListening={isListening}
                isSpeaking={isSpeaking}
                volume={volume}
                onDisconnect={toggleLiveMode}
            />
        ) : (
            /* Text / Transcription Mode Interface */
            <>
                <div className="mb-8">
                    <div className={`bg-slate-800/50 rounded-2xl border transition-colors duration-300 p-2 shadow-2xl ${isRecording ? 'border-red-500/50 shadow-red-900/20' : 'border-slate-700'}`}>
                        <div className="relative">
                            <textarea 
                                className="w-full bg-slate-900 rounded-xl p-4 md:p-6 text-slate-200 placeholder-slate-600 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none text-lg min-h-[120px] md:min-h-[160px]"
                                placeholder={isRecording ? "Listening..." : "Paste negotiation text here, or use voice input. I'll detect the language and tactics automatically."}
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isAnalyzing || isRecording || isTranscribing}
                            />
                            <div className="absolute bottom-4 right-4 flex gap-2">
                                <button 
                                    onClick={handleDemo}
                                    className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg text-xs font-medium transition-colors border border-slate-700"
                                    disabled={isAnalyzing || isRecording || isTranscribing}
                                >
                                    <FileText size={14} />
                                    Try Demo
                                </button>
                                
                                <button 
                                    onClick={toggleRecording}
                                    disabled={isAnalyzing || isTranscribing}
                                    className={`p-2 rounded-lg transition-all border group relative flex items-center justify-center w-10 h-10 ${
                                        isRecording 
                                        ? 'bg-red-500/20 text-red-500 border-red-500/50 hover:bg-red-500/30' 
                                        : isTranscribing
                                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                                        : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700'
                                    }`}
                                >
                                    {isRecording ? (
                                        <Square size={18} className="fill-current" />
                                    ) : isTranscribing ? (
                                        <Loader2 size={20} className="animate-spin" />
                                    ) : (
                                        <Mic size={20} />
                                    )}
                                    <span className="sr-only">Transcribe</span>
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex flex-col md:flex-row justify-between items-center p-2 gap-4">
                            <div className="flex items-center gap-4 pl-2">
                                <div className="text-xs text-slate-500 hidden md:block">
                                    Supported: English, Hindi, Kannada, Hinglish
                                </div>
                                
                                {/* Auto-Speak Toggle */}
                                <button 
                                  onClick={() => setAutoSpeak(!autoSpeak)}
                                  className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border transition-all ${
                                    autoSpeak 
                                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' 
                                    : 'bg-slate-800 text-slate-500 border-slate-700'
                                  }`}
                                  title="Automatically analyze and speak results after voice input"
                                >
                                  {autoSpeak ? <Volume2 size={14} /> : <VolumeX size={14} />}
                                  {autoSpeak ? 'Auto-Voice Enabled' : 'Auto-Voice Disabled'}
                                </button>
                            </div>

                            <button 
                                onClick={() => handleAnalyze()}
                                disabled={!inputText.trim() || isAnalyzing || isRecording || isTranscribing}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all transform active:scale-95 w-full md:w-auto justify-center ${
                                    !inputText.trim() || isAnalyzing || isRecording || isTranscribing
                                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20'
                                }`}
                            >
                                {isAnalyzing ? (
                                    <>
                                        <RefreshCw className="animate-spin" size={20} />
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        <Send size={20} />
                                        Analyze Tactics
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                    
                    {(isRecording || isTranscribing || isPlayingResponse) && (
                        <div className="mt-2 text-center text-sm text-slate-400 animate-pulse">
                           {isRecording && "Listening..."}
                           {isTranscribing && "Processing Audio..."}
                           {isPlayingResponse && <span className="text-emerald-400 flex items-center justify-center gap-2"><Volume2 size={16}/> Speaking Results...</span>}
                        </div>
                    )}
                </div>

                {/* Error Display */}
                {error && (
                    <div className="mb-6 bg-red-500/10 border border-red-500/50 rounded-xl p-4 flex items-center gap-3 text-red-200">
                        <AlertCircle className="shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                {/* Results Area */}
                {result && (
                    <AnalysisDashboard data={result} />
                )}
            </>
        )}
        
      </main>
    </div>
  );
};

export default App;
