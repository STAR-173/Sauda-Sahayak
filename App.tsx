import React, { useState, useRef } from 'react';
import { Mic, Send, RefreshCw, AlertCircle, FileText, Square, Loader2, Zap, Volume2, VolumeX, Camera, Shield, ArrowRight } from 'lucide-react';
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
  const [mode, setMode] = useState<AppMode>('negotiate');
  const [localMode, setLocalMode] = useState<LocalMode>('polite');
  const [inputText, setInputText] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<NegotiationAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showGamification, setShowGamification] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [autoSpeak, setAutoSpeak] = useState<boolean>(true);
  const [isPlayingResponse, setIsPlayingResponse] = useState<boolean>(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const playbackContextRef = useRef<AudioContext | null>(null);
  const { connect, disconnect, isConnected, isSpeaking, isListening, volume } = useLiveApi();

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
      source.onended = () => setIsPlayingResponse(false);
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
      if (autoSpeak) await playTextResponse(data);
    } catch (err: any) {
      setError(err.message || "Failed to analyze negotiation. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDemo = () => setInputText(DEMO_SCENARIO);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) handleAnalyze();
  };

  const startRecording = async () => {
    setError(null);
    stopPlayback();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        await handleTranscription(audioBlob);
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
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
              if (autoSpeak) handleAnalyze(newText);
              return newText;
            });
          }
        } catch {
          setError("Failed to transcribe audio. Please try again.");
        } finally {
          setIsTranscribing(false);
        }
      };
    } catch {
      setError("Error processing audio file.");
      setIsTranscribing(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  const switchToLive = () => { stopPlayback(); setMode('live'); connect(); };
  const exitLive = () => { disconnect(); setMode('negotiate'); };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>

      {/* ═══ HEADER ═══ */}
      <header className="sticky top-0 z-50" style={{ background: 'rgba(5,5,5,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-5xl mx-auto px-5 h-16 flex justify-between items-center">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center font-display font-bold text-lg" style={{ background: 'var(--yellow)', color: '#0a0a0a' }}>
              S
            </div>
            <div className="hidden sm:block">
              <div className="font-display font-bold text-sm leading-none" style={{ color: 'var(--text)' }}>Sauda-Sahayak</div>
              <div className="text-[10px] font-medium tracking-widest mt-0.5" style={{ color: 'var(--text-3)' }}>BANGALORE AUTO AI</div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">

            {/* Local Mode Toggle */}
            <button
              onClick={() => setLocalMode(localMode === 'polite' ? 'rowdy' : 'polite')}
              className="tag cursor-pointer transition-all duration-200"
              style={{
                background: localMode === 'rowdy' ? 'var(--orange-dim)' : 'transparent',
                color: localMode === 'rowdy' ? 'var(--orange)' : 'var(--text-3)',
                border: `1px solid ${localMode === 'rowdy' ? 'rgba(249,115,22,0.25)' : 'var(--border)'}`,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: localMode === 'rowdy' ? 'var(--orange)' : 'var(--text-3)' }} />
              {localMode === 'rowdy' ? 'Rowdy' : 'Polite'}
            </button>

            {/* Mode Tabs */}
            {mode !== 'live' && (
              <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                {(['negotiate', 'scan'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-all duration-200"
                    style={{
                      background: mode === m ? 'var(--card-2)' : 'transparent',
                      color: mode === m ? 'var(--text)' : 'var(--text-3)',
                    }}
                  >
                    {m === 'negotiate' ? <Shield size={12} /> : <Camera size={12} />}
                    <span className="hidden sm:inline capitalize">{m}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Live Button */}
            <button
              onClick={mode === 'live' ? exitLive : switchToLive}
              className="tag cursor-pointer transition-all duration-200"
              style={{
                background: mode === 'live' ? 'var(--red-dim)' : 'transparent',
                color: mode === 'live' ? 'var(--red)' : 'var(--text-3)',
                border: `1px solid ${mode === 'live' ? 'rgba(239,68,68,0.25)' : 'var(--border)'}`,
              }}
            >
              {mode === 'live' ? <Zap size={11} style={{ fill: 'currentColor' }} /> : <Mic size={11} />}
              <span className="hidden sm:inline">{mode === 'live' ? 'End' : 'Live'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ═══ MAIN ═══ */}
      <main className="max-w-5xl mx-auto px-5 pt-10 pb-20">

        {mode === 'live' ? (
          <LiveInterface isConnected={isConnected} isListening={isListening} isSpeaking={isSpeaking} volume={volume} onDisconnect={exitLive} />
        ) : mode === 'scan' ? (
          <ScanMode />
        ) : (
          <>
            {/* ─── Hero ─── */}
            {!result && !isAnalyzing && (
              <div className="mb-12 max-w-xl mx-auto anim-in">
                <h2 className="font-display font-extrabold text-4xl md:text-5xl leading-[1.1] tracking-tight mb-5">
                  Don't get{' '}
                  <span style={{ color: 'var(--yellow)' }}>scammed</span>.
                </h2>
                <p className="text-base leading-relaxed mb-6" style={{ color: 'var(--text-2)' }}>
                  Real-time detection of auto-rickshaw scams in Bangalore. Powered by Gemini AI.
                </p>
                <div className="flex flex-wrap gap-2 anim-in delay-2">
                  <span className="tag" style={{
                    background: localMode === 'rowdy' ? 'var(--orange-dim)' : 'var(--yellow-dim)',
                    color: localMode === 'rowdy' ? 'var(--orange)' : 'var(--yellow)',
                    border: `1px solid ${localMode === 'rowdy' ? 'rgba(249,115,22,0.2)' : 'rgba(245,197,24,0.2)'}`,
                  }}>
                    {localMode === 'rowdy' ? 'Kanglish Mode' : 'Polite Mode'}
                  </span>
                  <span className="tag" style={{ background: 'var(--card)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
                    Meter Broken Lie
                  </span>
                  <span className="tag" style={{ background: 'var(--card)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
                    Techie Tax
                  </span>
                  <span className="tag" style={{ background: 'var(--card)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
                    Weather Tax
                  </span>
                </div>
              </div>
            )}

            {/* ─── Input Area ─── */}
            <div className={`anim-in delay-3 mb-10 ${result || isAnalyzing ? '' : ''}`}>
              <div
                className="card p-1.5 transition-all duration-300"
                style={{
                  borderColor: isRecording ? 'rgba(239,68,68,0.4)' : undefined,
                  boxShadow: isRecording ? '0 0 0 4px rgba(239,68,68,0.06)' : undefined,
                }}
              >
                <div className="relative">
                  <textarea
                    className="input-field w-full p-5 text-base leading-relaxed"
                    style={{ background: 'var(--surface)', minHeight: '140px', border: 'none', borderRadius: '10px' }}
                    placeholder={isRecording ? "Listening to auto driver..." : "What did the auto driver say? E.g., 'Meter not working sir, ₹300 fixed.'"}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isAnalyzing || isRecording || isTranscribing}
                  />

                  {/* Floating buttons inside textarea */}
                  <div className="absolute bottom-3 right-3 flex gap-2">
                    <button
                      onClick={handleDemo}
                      className="btn-ghost hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs"
                      disabled={isAnalyzing || isRecording || isTranscribing}
                    >
                      <FileText size={13} />
                      Demo
                    </button>

                    <button
                      onClick={toggleRecording}
                      disabled={isAnalyzing || isTranscribing}
                      className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200"
                      style={{
                        background: isRecording ? 'var(--red-dim)' : isTranscribing ? 'var(--yellow-dim)' : 'var(--card)',
                        color: isRecording ? 'var(--red)' : isTranscribing ? 'var(--yellow)' : 'var(--text-2)',
                        border: `1px solid ${isRecording ? 'rgba(239,68,68,0.3)' : isTranscribing ? 'rgba(245,197,24,0.3)' : 'var(--border)'}`,
                        ...(isRecording ? { animation: 'recording-pulse 1.5s ease-out infinite' } : {}),
                      }}
                    >
                      {isRecording ? <Square size={14} style={{ fill: 'currentColor' }} /> :
                       isTranscribing ? <Loader2 size={16} className="anim-spin" /> :
                       <Mic size={16} />}
                    </button>
                  </div>
                </div>

                {/* Bottom bar */}
                <div className="flex flex-col sm:flex-row justify-between items-center px-3 py-2.5 gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-medium hidden sm:block" style={{ color: 'var(--text-3)' }}>
                      EN &middot; HI &middot; KN &middot; Kanglish
                    </span>
                    <button
                      onClick={() => setAutoSpeak(!autoSpeak)}
                      className="tag cursor-pointer transition-all duration-200"
                      style={{
                        background: autoSpeak ? 'var(--yellow-dim)' : 'transparent',
                        color: autoSpeak ? 'var(--yellow)' : 'var(--text-3)',
                        border: `1px solid ${autoSpeak ? 'rgba(245,197,24,0.2)' : 'var(--border)'}`,
                      }}
                    >
                      {autoSpeak ? <Volume2 size={11} /> : <VolumeX size={11} />}
                      Auto-Voice
                    </button>
                  </div>

                  <button
                    onClick={() => handleAnalyze()}
                    disabled={!inputText.trim() || isAnalyzing || isRecording || isTranscribing}
                    className="btn-primary flex items-center gap-2 px-6 py-2.5 text-sm w-full sm:w-auto justify-center"
                  >
                    {isAnalyzing ? (
                      <><Loader2 size={16} className="anim-spin" /> Analyzing...</>
                    ) : (
                      <><Send size={15} /> Analyze</>
                    )}
                  </button>
                </div>
              </div>

              {/* Status indicator */}
              {(isRecording || isTranscribing || isPlayingResponse) && (
                <div className="mt-3 text-center text-xs font-medium anim-fade" style={{ color: 'var(--text-3)' }}>
                  {isRecording && <span style={{ color: 'var(--red)' }}>Recording...</span>}
                  {isTranscribing && <span style={{ color: 'var(--yellow)' }}>Transcribing...</span>}
                  {isPlayingResponse && (
                    <span className="inline-flex items-center gap-1.5" style={{ color: 'var(--green)' }}>
                      <Volume2 size={13} /> Speaking...
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* ─── Error ─── */}
            {error && (
              <div className="card mb-8 p-4 flex items-center gap-3 anim-scale" style={{ borderColor: 'rgba(239,68,68,0.2)', background: 'var(--red-dim)' }}>
                <AlertCircle size={18} style={{ color: 'var(--red)', flexShrink: 0 }} />
                <p className="text-sm" style={{ color: '#fca5a5' }}>{error}</p>
              </div>
            )}

            {/* ─── Results ─── */}
            {result && (
              <>
                <AnalysisDashboard data={result} />

                {!showGamification && (
                  <div className="mt-8 flex justify-center anim-in delay-6">
                    <button
                      onClick={() => setShowGamification(true)}
                      className="btn-primary flex items-center gap-2.5 px-7 py-3 text-sm"
                    >
                      <Zap size={16} />
                      Deal Accepted? See Your Score
                      <ArrowRight size={14} />
                    </button>
                  </div>
                )}

                {showGamification && (
                  <div className="mt-8 anim-in">
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
