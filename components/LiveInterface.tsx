import React from 'react';
import { Mic, MicOff, Activity, XCircle } from 'lucide-react';

interface LiveInterfaceProps {
  isConnected: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  volume: number;
  onDisconnect: () => void;
}

const LiveInterface: React.FC<LiveInterfaceProps> = ({ 
  isConnected, 
  isSpeaking, 
  isListening, 
  volume,
  onDisconnect 
}) => {
  // Visualizer Rings calculation based on volume
  // Volume is 0-100 roughly. 
  const scale = 1 + (volume / 20); 

  return (
    <div className="flex flex-col items-center justify-center py-12 animate-fade-in relative overflow-hidden rounded-2xl bg-slate-800 border border-slate-700 min-h-[400px]">
      
      {/* Background Pulse Effect */}
      <div className={`absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none transition-all duration-300 ${isSpeaking ? 'bg-blue-900/30' : ''}`}>
        <div 
            className="w-64 h-64 rounded-full bg-blue-500 blur-3xl transition-transform duration-100 ease-linear"
            style={{ transform: `scale(${scale})` }}
        />
      </div>

      <div className="z-10 flex flex-col items-center space-y-8">
        
        {/* Status Text */}
        <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">
                {isSpeaking ? "Sauda-Sahayak Speaking..." : isConnected ? "Listening..." : "Connecting..."}
            </h2>
            <p className="text-slate-400 text-sm">
                Real-time Negotiation Coach
            </p>
        </div>

        {/* Main Visualizer / Icon */}
        <div className="relative">
            {/* Outer Rings */}
            <div 
                className={`absolute inset-0 rounded-full border-2 border-blue-500/30 transition-all duration-100 ease-out`}
                style={{ transform: `scale(${1 + (volume/50)})`, opacity: 0.5 }}
            />
            <div 
                className={`absolute inset-0 rounded-full border border-blue-400/20 transition-all duration-100 ease-out`}
                style={{ transform: `scale(${1 + (volume/30)})`, opacity: 0.3 }}
            />

            {/* Core Circle */}
            <div className={`w-32 h-32 rounded-full flex items-center justify-center shadow-2xl transition-colors duration-500 ${
                isSpeaking 
                ? 'bg-emerald-500 shadow-emerald-500/50' 
                : 'bg-blue-600 shadow-blue-600/50'
            }`}>
                {isSpeaking ? (
                    <Activity size={48} className="text-white animate-pulse" />
                ) : (
                    <Mic size={48} className="text-white" />
                )}
            </div>
        </div>

        {/* Instructions */}
        <div className="bg-slate-900/60 backdrop-blur-sm px-6 py-3 rounded-full border border-slate-700">
            <p className="text-xs text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Live Audio Session Active
            </p>
        </div>

        {/* Disconnect Button */}
        <button 
            onClick={onDisconnect}
            className="group flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50 rounded-xl transition-all border border-slate-600 text-slate-300 mt-8"
        >
            <XCircle size={20} className="group-hover:text-red-400" />
            <span>End Session</span>
        </button>

      </div>
    </div>
  );
};

export default LiveInterface;
