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
    setIsScanning(true); setError(null); setResult(null);
    try {
      setResult(await analyzeImage(base64Data, mimeType));
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
      processImage(dataUrl.split(',')[1], file.type);
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraActive(true); setResult(null); setPreviewUrl(null);
    } catch { setError("Camera access denied."); }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setPreviewUrl(dataUrl); stopCamera();
    processImage(dataUrl.split(',')[1], 'image/jpeg');
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null; setCameraActive(false);
  };

  const reset = () => {
    stopCamera(); setResult(null); setPreviewUrl(null); setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const statusMap: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode; label: string }> = {
    FAKE_DETECTED: { color: 'var(--red)', bg: 'var(--red-dim)', border: 'rgba(239,68,68,0.18)', icon: <AlertTriangle size={22} />, label: 'FAKE APP DETECTED' },
    LEGITIMATE:    { color: 'var(--green)', bg: 'var(--green-dim)', border: 'rgba(34,197,94,0.18)', icon: <CheckCircle size={22} />, label: 'LEGITIMATE' },
    INCONCLUSIVE:  { color: '#eab308', bg: 'rgba(234,179,8,0.06)', border: 'rgba(234,179,8,0.18)', icon: <HelpCircle size={22} />, label: 'INCONCLUSIVE' },
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="max-w-xl mx-auto mb-10 anim-in">
        <h2 className="font-display font-extrabold text-4xl md:text-5xl leading-[1.1] tracking-tight mb-4">
          Vision <span style={{ color: 'var(--purple)' }}>Scan</span>.
        </h2>
        <p className="text-base leading-relaxed" style={{ color: 'var(--text-2)' }}>
          Point at the driver's phone to detect fake taxi apps, manipulated prices, and digital fraud.
        </p>
      </div>

      {/* Camera / Upload */}
      {!result && !isScanning && (
        <div className="card p-6 anim-in delay-2">
          {cameraActive ? (
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden aspect-video max-h-[380px] mx-auto" style={{ background: '#000' }}>
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <div className="scan-bracket scan-bracket-tl" />
                <div className="scan-bracket scan-bracket-tr" />
                <div className="scan-bracket scan-bracket-bl" />
                <div className="scan-bracket scan-bracket-br" />
                <div className="scanline-bar" />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-[11px] font-medium" style={{ background: 'rgba(0,0,0,0.7)', color: 'var(--yellow)', backdropFilter: 'blur(8px)' }}>
                  Point at driver's phone
                </div>
              </div>
              <div className="flex justify-center gap-3">
                <button onClick={capturePhoto} className="btn-primary flex items-center gap-2 px-6 py-2.5 text-sm">
                  <Camera size={16} /> Capture
                </button>
                <button onClick={stopCamera} className="btn-ghost flex items-center gap-2 px-5 py-2.5 text-sm">
                  <X size={16} /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6 py-10">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center anim-float" style={{ background: 'var(--purple-dim)', border: '1px solid rgba(167,139,250,0.15)' }}>
                <Camera size={32} style={{ color: 'var(--purple)' }} />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={startCamera} className="btn-primary flex items-center gap-2 px-6 py-2.5 text-sm" style={{ background: 'var(--purple)' }}>
                  <Camera size={16} /> Open Camera
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="btn-ghost flex items-center gap-2 px-5 py-2.5 text-sm">
                  <Upload size={16} /> Upload Screenshot
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              <p className="text-xs text-center max-w-sm" style={{ color: 'var(--text-3)' }}>
                Our AI checks for double status bars, font mismatches, price logic errors, and UI artifacts.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Scanning */}
      {isScanning && (
        <div className="card p-10 flex flex-col items-center gap-5 anim-scale" style={{ borderColor: 'rgba(167,139,250,0.2)' }}>
          {previewUrl && <img src={previewUrl} alt="Scanning" className="max-h-40 rounded-lg" style={{ opacity: 0.5 }} />}
          <div className="flex items-center gap-2.5" style={{ color: 'var(--purple)' }}>
            <Loader2 size={20} className="anim-spin" />
            <span className="font-display font-bold text-base">Forensic Analysis...</span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>Checking status bars, fonts, price logic, UI artifacts...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card p-4 flex items-center gap-3 anim-scale" style={{ borderColor: 'rgba(239,68,68,0.2)', background: 'var(--red-dim)' }}>
          <AlertTriangle size={18} style={{ color: 'var(--red)', flexShrink: 0 }} />
          <p className="text-sm" style={{ color: '#fca5a5' }}>{error}</p>
        </div>
      )}

      {/* Results */}
      {result && (() => {
        const s = statusMap[result.status] || statusMap.INCONCLUSIVE;
        return (
          <div className="space-y-5 anim-in">
            {previewUrl && (
              <div className="flex justify-center anim-scale">
                <img src={previewUrl} alt="Analyzed" className="max-h-44 rounded-xl" style={{ border: '1px solid var(--border)' }} />
              </div>
            )}

            {/* Status */}
            <div className="rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 anim-in delay-1" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ color: s.color, background: `${s.color}12`, border: `2px solid ${s.color}25` }}>
                  {s.icon}
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-3)' }}>Scan Result</div>
                  <span className="font-display font-bold text-2xl" style={{ color: s.color }}>{s.label}</span>
                </div>
              </div>
              <div className="md:text-right">
                <div className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-3)' }}>Confidence</div>
                <div className="font-mono font-bold text-2xl" style={{ color: 'var(--text)' }}>{(result.confidence * 100).toFixed(1)}%</div>
              </div>
            </div>

            {/* Details */}
            <div className="card p-6 anim-in delay-2">
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>App Identified</div>
                  <p className="font-display font-bold text-base" style={{ color: 'var(--text)' }}>{result.app_identified}</p>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>Price Assessment</div>
                  <p className="text-sm" style={{ color: 'var(--text-2)' }}>{result.price_assessment}</p>
                  {result.price_shown && <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>Shown: {result.price_shown}</p>}
                </div>
              </div>
            </div>

            {/* Evidence */}
            {result.evidence?.length > 0 && (
              <div className="card p-6 anim-in delay-3">
                <h3 className="flex items-center gap-2 font-display font-bold text-base mb-4" style={{ color: 'var(--text)' }}>
                  <AlertTriangle size={16} style={{ color: 'var(--purple)' }} />
                  Forensic Evidence
                </h3>
                <ul className="space-y-2.5">
                  {result.evidence.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className="font-mono font-bold text-xs mt-0.5" style={{ color: 'var(--purple)' }}>{String(i + 1).padStart(2, '0')}</span>
                      <span style={{ color: 'var(--text-2)' }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Forensic details */}
            <div className="card p-6 anim-in delay-4">
              <h3 className="font-display font-bold text-base mb-3" style={{ color: 'var(--text)' }}>Technical Details</h3>
              <p className="text-sm leading-relaxed pl-4" style={{ color: 'var(--text-2)', borderLeft: '3px solid var(--purple)' }}>
                {result.forensic_details}
              </p>
            </div>

            {/* Action */}
            <div className="rounded-xl p-5 anim-in delay-5" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
              <div className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>Recommended Action</div>
              <p className="font-display font-bold text-base" style={{ color: s.color }}>{result.recommended_action}</p>
            </div>

            <div className="flex justify-center anim-in delay-6">
              <button onClick={reset} className="btn-ghost flex items-center gap-2 px-5 py-2.5 text-sm">
                <RotateCcw size={15} /> Scan Another
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default ScanMode;
