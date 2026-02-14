import React, { useState, useRef } from 'react';
import { Mic, Send, RefreshCw, AlertCircle, FileText, Square, Loader2, Zap, Volume2, VolumeX, Camera, Shield, ToggleLeft, ToggleRight } from 'lucide-react';
import { analyzeNegotiationText, transcribeAudio, generateSpeech } from './services/geminiService';
import { decodeAudioData } from './services/audioUtils';
import AnalysisDashboard from './components/AnalysisDashboard';
import LiveInterface from './components/LiveInterface';
import ScanMode from './components/ScanMode';
import GamificationPanel from './components/GamificationPanel';
import { useLiveApi } from './hooks/useLiveApi';
import { NegotiationAnalysis, LocalMode, AppMode } from './types';
import { DEMO_SCENARIO } from './constants';

const App: React.FC = () => {
  // Mode State
  const [mode, setMode] = useState<AppMode>('negotiate');

  // Local Mode (Rowdy vs Polite)
  const [localMode, setLocalMode] = useState<LocalMode>('polite');

  // Text Analysis State
  const [inputText, setInputText] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<NegotiationAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Gamification State
  const [showGamification, setShowGamification] = useState<boolean>(false);

  // Audio Recording & TTS State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [autoSpeak, setAutoSpeak] = useState<boolean>(true);
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
      const scriptToSpeak = `Risk Level: ${analysis.risk_level}. Detected Scam: ${analysis.detected_tactic}. Say this: ${analysis.short_response_script}`;

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
    setShowGamification(false);
    stopPlayback();

    try {
      const data = await analyzeNegotiationText(textToAnalyze, localMode);
      setResult(data);

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
        stream.getTracks().forEach(track => track.stop());
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
  const switchToLive = () => {
    stopPlayback();
    setMode('live');
    connect();
  };

  const exitLive = () => {
    disconnect();
    setMode('negotiate');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 selection:bg-blue-500 selection:text-white">
      {/* Header */}
      <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
              <span className="text-xl font-bold text-white">S</span>
            </div>
            <div>
              <h1 className="font-bold text-white text-lg leading-none">Sauda-Sahayak</h1>
              <p className="text-xs text-slate-500 font-medium tracking-wide">AUTO-RICKSHAW NEGOTIATION AI</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Local Mode Toggle */}
            <button
              onClick={() => setLocalMode(localMode === 'polite' ? 'rowdy' : 'polite')}
              className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${
                localMode === 'rowdy'
                  ? 'bg-orange-500/20 text-orange-400 border-orange-500/50'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
              }`}
              title={localMode === 'rowdy' ? 'Rowdy Mode: Aggressive Kanglish' : 'Polite Mode: Respectful responses'}
            >
              {localMode === 'rowdy' ? <ToggleRight size={16} className="text-orange-400" /> : <ToggleLeft size={16} />}
              <span className="hidden sm:inline">{localMode === 'rowdy' ? 'Rowdy' : 'Polite'}</span>
            </button>

            {/* Mode Tabs */}
            {mode !== 'live' && (
              <div className="flex bg-slate-800 rounded-full p-1 border border-slate-700">
                <button
                  onClick={() => setMode('negotiate')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    mode === 'negotiate' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Shield size={12} />
                  <span className="hidden sm:inline">Negotiate</span>
                </button>
                <button
                  onClick={() => setMode('scan')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    mode === 'scan' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Camera size={12} />
                  <span className="hidden sm:inline">Scan</span>
                </button>
              </div>
            )}

            {/* Live Mode Button */}
            <button
              onClick={mode === 'live' ? exitLive : switchToLive}
              className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${
                mode === 'live'
                ? 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {mode === 'live' ? <Zap size={14} className="fill-current" /> : <Mic size={14} />}
              <span className="hidden sm:inline">{mode === 'live' ? 'Live Active' : 'Live'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">

        {/* Live Mode Interface */}
        {mode === 'live' ? (
          <LiveInterface
            isConnected={isConnected}
            isListening={isListening}
            isSpeaking={isSpeaking}
            volume={volume}
            onDisconnect={exitLive}
          />
        ) : mode === 'scan' ? (
          /* Scan Mode Interface */
          <ScanMode />
        ) : (
          /* Negotiate Mode Interface */
          <>
            {/* Intro / Context - Only show if no result */}
            {!result && !isAnalyzing && (
              <div className="mb-10 text-center max-w-2xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Don't get <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">scammed</span>.
                </h2>
                <p className="text-slate-400 mb-4 text-lg">
                  Real-time detection of auto-rickshaw scams — The Techie Tax, Meter Broken Lie, Weather Tax, and more.
                </p>
                <div className="flex justify-center gap-2 flex-wrap">
                  <span className={`text-xs px-3 py-1 rounded-full border ${
                    localMode === 'rowdy'
                      ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                      : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                  }`}>
                    {localMode === 'rowdy' ? 'Rowdy Mode: Kanglish Responses' : 'Polite Mode: Respectful Responses'}
                  </span>
                  <span className="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    Bangalore Auto Fares Built-In
                  </span>
                </div>
              </div>
            )}

            <div className="mb-8">
              <div className={`bg-slate-800/50 rounded-2xl border transition-colors duration-300 p-2 shadow-2xl ${isRecording ? 'border-red-500/50 shadow-red-900/20' : 'border-slate-700'}`}>
                <div className="relative">
                  <textarea
                    className="w-full bg-slate-900 rounded-xl p-4 md:p-6 text-slate-200 placeholder-slate-600 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none text-lg min-h-[120px] md:min-h-[160px]"
                    placeholder={isRecording ? "Listening to auto driver..." : "What did the auto driver say? Type or use voice. Example: 'Meter not working sir, ₹300 fixed.'"}
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
                    </button>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center p-2 gap-4">
                  <div className="flex items-center gap-4 pl-2">
                    <div className="text-xs text-slate-500 hidden md:block">
                      English, Hindi, Kannada, Kanglish
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
                      {autoSpeak ? 'Auto-Voice On' : 'Auto-Voice Off'}
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
                        Detecting Scams...
                      </>
                    ) : (
                      <>
                        <Send size={20} />
                        Analyze
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
              <>
                <AnalysisDashboard data={result} />

                {/* Deal Accepted Button */}
                {!showGamification && (
                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={() => setShowGamification(true)}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black rounded-xl font-bold transition-all shadow-lg shadow-yellow-500/20 transform active:scale-95"
                    >
                      <Zap size={20} />
                      Deal Accepted? See Your Score!
                    </button>
                  </div>
                )}

                {/* Gamification Panel */}
                {showGamification && (
                  <div className="mt-6">
                    <GamificationPanel
                      driverAskPrice={result.driver_ask_price}
                      fairPriceEstimate={result.fair_price_estimate}
                      onClose={() => setShowGamification(false)}
                    />
                  </div>
                )}
              </>
            )}
          </>
        )}

      </main>
    </div>
  );
};

export default App;
