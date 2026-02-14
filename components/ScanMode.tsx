import React, { useState, useRef } from 'react';
import { Camera, Upload, X, AlertTriangle, CheckCircle, HelpCircle, Loader2, RotateCcw } from 'lucide-react';
import { analyzeImage } from '../services/geminiService';
import { VisionAnalysis } from '../types';

const ScanMode: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<VisionAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const processImage = async (base64Data: string, mimeType: string) => {
    setIsScanning(true);
    setError(null);
    setResult(null);

    try {
      const analysis = await analyzeImage(base64Data, mimeType);
      setResult(analysis);
    } catch (err: any) {
      setError(err.message || "Failed to analyze image.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPreviewUrl(dataUrl);
      const base64 = dataUrl.split(',')[1];
      processImage(base64, file.type);
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
      setResult(null);
      setPreviewUrl(null);
    } catch (err) {
      setError("Camera access denied. Please check permissions.");
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setPreviewUrl(dataUrl);
    stopCamera();

    const base64 = dataUrl.split(',')[1];
    processImage(base64, 'image/jpeg');
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const reset = () => {
    stopCamera();
    setResult(null);
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "FAKE_DETECTED": return "text-red-500";
      case "LEGITIMATE": return "text-emerald-400";
      case "INCONCLUSIVE": return "text-yellow-400";
      default: return "text-slate-400";
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case "FAKE_DETECTED": return "bg-red-500/10 border-red-500/50";
      case "LEGITIMATE": return "bg-emerald-500/10 border-emerald-500/50";
      case "INCONCLUSIVE": return "bg-yellow-500/10 border-yellow-500/50";
      default: return "bg-slate-800 border-slate-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "FAKE_DETECTED": return <AlertTriangle className="w-8 h-8 text-red-500" />;
      case "LEGITIMATE": return <CheckCircle className="w-8 h-8 text-emerald-400" />;
      case "INCONCLUSIVE": return <HelpCircle className="w-8 h-8 text-yellow-400" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Vision <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Verification</span>
        </h2>
        <p className="text-slate-400 text-lg">
          Scan the driver's phone screen to detect fake taxi apps, manipulated prices, and digital fraud.
        </p>
      </div>

      {/* Camera / Upload Area */}
      {!result && !isScanning && (
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6 shadow-2xl">
          {cameraActive ? (
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden bg-black aspect-video max-h-[400px] mx-auto">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Scan overlay grid */}
                <div className="absolute inset-0 border-2 border-purple-500/30 rounded-xl pointer-events-none">
                  <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-purple-400" />
                  <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-purple-400" />
                  <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-purple-400" />
                  <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-purple-400" />
                </div>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full text-xs text-purple-300">
                  Point at the driver's phone screen
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <button
                  onClick={capturePhoto}
                  className="flex items-center gap-2 px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-purple-600/20"
                >
                  <Camera size={20} />
                  Capture & Scan
                </button>
                <button
                  onClick={stopCamera}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl transition-all border border-slate-600"
                >
                  <X size={20} />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6 py-8">
              <div className="w-24 h-24 rounded-full bg-purple-500/10 border-2 border-purple-500/30 flex items-center justify-center">
                <Camera size={40} className="text-purple-400" />
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={startCamera}
                  className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-purple-600/20"
                >
                  <Camera size={20} />
                  Open Camera
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl font-semibold transition-all border border-slate-600"
                >
                  <Upload size={20} />
                  Upload Screenshot
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <p className="text-xs text-slate-500 text-center max-w-md">
                Take a photo of the driver's phone screen or upload a screenshot. Our AI will analyze it for fake apps, manipulated prices, and UI tampering.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Scanning State */}
      {isScanning && (
        <div className="bg-slate-800/50 rounded-2xl border border-purple-500/30 p-8 shadow-2xl">
          <div className="flex flex-col items-center gap-6">
            {previewUrl && (
              <img src={previewUrl} alt="Scanning" className="max-h-48 rounded-xl opacity-50" />
            )}
            <div className="flex items-center gap-3 text-purple-400">
              <Loader2 size={24} className="animate-spin" />
              <span className="text-lg font-semibold animate-pulse">Forensic Analysis in Progress...</span>
            </div>
            <p className="text-xs text-slate-500">Checking for double status bars, font mismatches, price logic, UI artifacts...</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 flex items-center gap-3 text-red-200">
          <AlertTriangle className="shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6 animate-fade-in">
          {/* Preview */}
          {previewUrl && (
            <div className="flex justify-center">
              <img src={previewUrl} alt="Analyzed" className="max-h-48 rounded-xl border border-slate-700" />
            </div>
          )}

          {/* Status Banner */}
          <div className={`p-6 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-4 ${getStatusBg(result.status)}`}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full border-2 ${getStatusColor(result.status).replace('text-', 'border-')}`}>
                {getStatusIcon(result.status)}
              </div>
              <div>
                <h3 className="text-sm text-slate-400 font-semibold uppercase tracking-widest">Scan Result</h3>
                <span className={`text-3xl font-bold ${getStatusColor(result.status)}`}>
                  {result.status === "FAKE_DETECTED" ? "FAKE APP DETECTED" :
                   result.status === "LEGITIMATE" ? "LEGITIMATE" : "INCONCLUSIVE"}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400 mb-1">Confidence</div>
              <div className="text-2xl font-mono font-bold text-white">
                {(result.confidence * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* App Identified */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">App Identified</div>
                <p className="text-lg text-white font-semibold">{result.app_identified}</p>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">Price Assessment</div>
                <p className="text-slate-200">{result.price_assessment}</p>
                {result.price_shown && (
                  <p className="text-sm text-slate-400 mt-1">Price shown: {result.price_shown}</p>
                )}
              </div>
            </div>
          </div>

          {/* Evidence */}
          {result.evidence && result.evidence.length > 0 && (
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <AlertTriangle size={20} className="text-purple-400" />
                Forensic Evidence
              </h3>
              <ul className="space-y-3">
                {result.evidence.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="text-purple-400 font-bold mt-0.5">{i + 1}.</span>
                    <span className="text-slate-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Forensic Details */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Technical Details</h3>
            <p className="text-slate-300 text-sm border-l-4 border-purple-500 pl-4 bg-slate-900/50 py-3 rounded-r-md">
              {result.forensic_details}
            </p>
          </div>

          {/* Action */}
          <div className={`p-4 rounded-xl border ${getStatusBg(result.status)}`}>
            <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">Recommended Action</div>
            <p className={`text-lg font-semibold ${getStatusColor(result.status)}`}>
              {result.recommended_action}
            </p>
          </div>

          {/* Reset Button */}
          <div className="flex justify-center">
            <button
              onClick={reset}
              className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl transition-all border border-slate-600"
            >
              <RotateCcw size={20} />
              Scan Another Screen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScanMode;
